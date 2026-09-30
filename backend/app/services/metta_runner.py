"""Symbolic MeTTa Runtime & Rule Engine for AgriGuide.

Supports executing agricultural decision models either via the native Hyperon/MeTTa
binary (if available) or via an embedded symbolic S-expression reduction engine that
parses and evaluates .metta files faithfully.
"""

from __future__ import annotations
import os
import re
import shutil
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from app.core.config import settings

@dataclass
class MettaStep:
    step_type: str
    expression: str
    result: Any
    detail: str = ""

@dataclass
class MettaExecutionResult:
    recommendation: str
    confidence: float
    reason: str
    rules: list[str]
    steps: list[dict[str, Any]]
    source: str  # "metta-native" | "metta-embedded" | "metta-fallback"
    counterfactuals: dict[str, Any] = field(default_factory=dict)
    raw_output: str = ""

# --- S-Expression Tokenizer and Parser for MeTTa ---

class Atom:
    pass

class Symbol(Atom):
    def __init__(self, name: str):
        self.name = name
    def __repr__(self):
        return self.name
    def __eq__(self, other):
        return isinstance(other, Symbol) and self.name == other.name
    def __hash__(self):
        return hash(self.name)

class Variable(Atom):
    def __init__(self, name: str):
        self.name = name
    def __repr__(self):
        return f"${self.name}"
    def __eq__(self, other):
        return isinstance(other, Variable) and self.name == other.name
    def __hash__(self):
        return hash(self.name)

class Expression(Atom):
    def __init__(self, children: list[Any]):
        self.children = children
    def __repr__(self):
        return "(" + " ".join(repr(c) for c in self.children) + ")"
    def __eq__(self, other):
        return isinstance(other, Expression) and self.children == other.children

def tokenize(text: str) -> list[str]:
    # Remove single line comments starting with ;
    cleaned_lines = []
    for line in text.splitlines():
        line = re.sub(r';.*$', '', line)
        cleaned_lines.append(line)
    cleaned = " ".join(cleaned_lines)
    # Tokenize parentheses and whitespace-delimited tokens
    tokens = []
    current = []
    in_quote = False
    quote_char = ""
    for ch in cleaned:
        if ch in ('"', "'"):
            if in_quote and ch == quote_char:
                in_quote = False
                current.append(ch)
                tokens.append("".join(current))
                current = []
            elif not in_quote:
                in_quote = True
                quote_char = ch
                current.append(ch)
            else:
                current.append(ch)
        elif in_quote:
            current.append(ch)
        elif ch in ('(', ')'):
            if current:
                tokens.append("".join(current))
                current = []
            tokens.append(ch)
        elif ch.isspace():
            if current:
                tokens.append("".join(current))
                current = []
        else:
            current.append(ch)
    if current:
        tokens.append("".join(current))
    return tokens

def parse_tokens(tokens: list[str]) -> list[Any]:
    def parse_one(idx: int) -> tuple[Any, int]:
        if idx >= len(tokens):
            return None, idx
        token = tokens[idx]
        if token == '(':
            idx += 1
            children = []
            while idx < len(tokens) and tokens[idx] != ')':
                child, idx = parse_one(idx)
                if child is not None:
                    children.append(child)
            return Expression(children), idx + 1
        elif token == ')':
            return None, idx + 1
        elif token.startswith('$'):
            return Variable(token[1:]), idx + 1
        else:
            # Check number or bool
            if token.lower() == 'true':
                return True, idx + 1
            if token.lower() == 'false':
                return False, idx + 1
            try:
                if '.' in token:
                    return float(token), idx + 1
                return int(token), idx + 1
            except ValueError:
                return Symbol(token), idx + 1

    expressions = []
    i = 0
    while i < len(tokens):
        # Ignore leading ! query marker for declarations
        if tokens[i] == '!':
            i += 1
            expr, i = parse_one(i)
            if expr:
                expressions.append(('query', expr))
        else:
            expr, i = parse_one(i)
            if expr:
                expressions.append(('def', expr))
    return expressions

class MettaSpace:
    """In-memory symbolic space for MeTTa knowledge and rewrite rules."""
    def __init__(self):
        self.rules: list[tuple[Any, Any]] = []  # (= head body)
        self.facts: list[Any] = []

    def load_file(self, filepath: str | Path):
        path = Path(filepath)
        if not path.is_file():
            return
        text = path.read_text(encoding="utf-8")
        parsed = parse_tokens(tokenize(text))
        for kind, expr in parsed:
            if isinstance(expr, Expression) and len(expr.children) >= 3 and expr.children[0] == Symbol('='):
                head = expr.children[1]
                body = expr.children[2]
                self.rules.append((head, body))
            else:
                self.facts.append(expr)

    def add_rule_string(self, rule_text: str):
        parsed = parse_tokens(tokenize(rule_text))
        for kind, expr in parsed:
            if isinstance(expr, Expression) and len(expr.children) >= 3 and expr.children[0] == Symbol('='):
                head = expr.children[1]
                body = expr.children[2]
                # Prepend so newer/farmer custom rules take precedence
                self.rules.insert(0, (head, body))
            else:
                self.facts.append(expr)

class MettaInterpreter:
    """Interprets MeTTa expressions against a MettaSpace."""
    def __init__(self, space: MettaSpace):
