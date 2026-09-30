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
