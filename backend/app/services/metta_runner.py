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
        self.space = space
        self.trace_steps: list[dict[str, Any]] = []

    def pattern_match(self, pattern: Any, target: Any, bindings: dict[str, Any]) -> bool:
        if isinstance(pattern, Variable):
            var_name = pattern.name
            if var_name in bindings:
                return bindings[var_name] == target
            bindings[var_name] = target
            return True
        elif isinstance(pattern, Symbol) and isinstance(target, Symbol):
            return pattern.name.lower() == target.name.lower()
        elif isinstance(pattern, Expression) and isinstance(target, Expression):
            if len(pattern.children) != len(target.children):
                return False
            for p, t in zip(pattern.children, target.children):
                if not self.pattern_match(p, t, bindings):
                    return False
            return True
        elif type(pattern) == type(target):
            return pattern == target
        return False

    def substitute(self, expr: Any, bindings: dict[str, Any]) -> Any:
        if isinstance(expr, Variable):
            return bindings.get(expr.name, expr)
        elif isinstance(expr, Expression):
            return Expression([self.substitute(c, bindings) for c in self.children_of(expr)])
        return expr

    def children_of(self, expr: Expression) -> list[Any]:
        return expr.children

    def evaluate(self, expr: Any) -> Any:
        if not isinstance(expr, Expression):
            return expr

        children = expr.children
        if not children:
            return expr

        head = children[0]

        # Builtin: if
        if head == Symbol('if'):
            if len(children) >= 4:
                cond = self.evaluate(children[1])
                self.trace_steps.append({
                    "type": "CONDITION_EVAL",
                    "expression": repr(children[1]),
                    "result": bool(cond),
                    "branch": "then" if cond else "else"
                })
                if cond:
                    return self.evaluate(children[2])
                else:
                    return self.evaluate(children[3])

        # Builtin: and
        if head == Symbol('and'):
            for c in children[1:]:
                res = self.evaluate(c)
                if not res:
                    return False
            return True

        # Builtin: or
        if head == Symbol('or'):
            for c in children[1:]:
                res = self.evaluate(c)
                if res:
                    return True
            return False

        # Builtin: not
        if head == Symbol('not'):
            if len(children) > 1:
                return not bool(self.evaluate(children[1]))
            return False

        # Builtin: comparisons <, <=, >, >=, ==
        if head in (Symbol('<'), Symbol('<='), Symbol('>'), Symbol('>='), Symbol('==')):
            if len(children) >= 3:
                left = self.evaluate(children[1])
                right = self.evaluate(children[2])
                op = head.name
                val = self._compare(op, left, right)
                return val

        # Check rewrite rules in space
        for rule_head, rule_body in self.space.rules:
            bindings: dict[str, Any] = {}
            if self.pattern_match(rule_head, expr, bindings):
                self.trace_steps.append({
                    "type": "RULE_MATCH",
                    "rule_head": repr(rule_head),
                    "bindings": {k: repr(v) for k, v in bindings.items()},
                    "output": repr(rule_body)
                })
                substituted = self.substitute(rule_body, bindings)
                return self.evaluate(substituted)

        # Evaluate child expressions if not resolved
        return Expression([self.evaluate(c) for c in children])

    def _compare(self, op: str, left: Any, right: Any) -> bool:
        if isinstance(left, Symbol):
            left = left.name.lower()
        if isinstance(right, Symbol):
            right = right.name.lower()
        if isinstance(left, str):
            left = left.lower()
        if isinstance(right, str):
            right = right.lower()

        try:
            if op == '<':
                return float(left) < float(right)
            elif op == '<=':
                return float(left) <= float(right)
            elif op == '>':
                return float(left) > float(right)
            elif op == '>=':
                return float(left) >= float(right)
            elif op == '==':
                return left == right
        except (ValueError, TypeError):
            return left == right
        return False

class MettaService:
    """High-level service coordinating MeTTa execution."""
    def __init__(self):
        self.rules_path = Path(settings.metta_rules_path)
        self.knowledge_path = Path(settings.metta_knowledge_path)
        self.omega_skill_path = Path(settings.omega_skill_path)
        self.native_binary = settings.metta_binary if shutil.which(settings.metta_binary) else None

    def execute_query(
        self,
        soil: float | None,
        rain: float | None,
        water: str = "limited",
        current_rain: bool = False,
        crop_demand: str = "high",
        custom_rules: list[dict] | None = None
    ) -> MettaExecutionResult:
        # 1. Missing evidence guard
        if soil is None or rain is None:
            return MettaExecutionResult(
                recommendation="REASSESS",
                confidence=0.45,
                reason="Required field evidence (soil moisture or rain forecast) is missing.",
                rules=["R-REASSESS-MISSING"],
                steps=[{"type": "MISSING_EVIDENCE", "output": "soil or rain is None"}],
                source="metta-fallback"
            )

        # 2. Try native MeTTa binary if available on system
        if self.native_binary and self.rules_path.is_file():
            try:
                res = self._run_native_metta(soil, rain, water, current_rain)
                if res:
                    return res
            except Exception:
                pass

        # 3. Embedded Symbolic MeTTa Engine
        return self._run_embedded_metta(soil, rain, water, current_rain, crop_demand, custom_rules)

    def _run_native_metta(
        self,
        soil: float,
        rain: float,
        water: str,
        current_rain: bool
    ) -> MettaExecutionResult | None:
        c_rain_str = "true" if current_rain else "false"
        query_code = (
            f"!(irrigation-decision {soil} {rain} {water.lower()} {c_rain_str})\n"
        )
        proc = subprocess.run(
            [self.native_binary, str(self.rules_path)],
            input=query_code,
            text=True,
            capture_output=True,
            timeout=5
        )
        if proc.returncode == 0 and proc.stdout.strip():
            raw = proc.stdout.strip()
            rec = "REASSESS"
            if "IRRIGATE" in raw:
                rec = "IRRIGATE"
            elif "WAIT" in raw:
                rec = "WAIT"

            rule_id = self._map_rule_id(rec)
            cf = self.evaluate_counterfactuals(soil, rain, water)
            return MettaExecutionResult(
                recommendation=rec,
                confidence=0.88,
                reason=self._format_reason(rec, soil, rain, water, current_rain),
                rules=[rule_id],
                steps=[
                    {"type": "NATIVE_METTA", "input": query_code.strip(), "output": raw}
                ],
                source="metta-native",
                counterfactuals=cf,
                raw_output=raw
            )
        return None

    def _run_embedded_metta(
        self,
        soil: float,
        rain: float,
        water: str,
        current_rain: bool,
        crop_demand: str,
        custom_rules: list[dict] | None = None
    ) -> MettaExecutionResult:
        space = MettaSpace()

        # Load knowledge base & baseline rules
        if self.knowledge_path.is_file():
            space.load_file(self.knowledge_path)
        if self.rules_path.is_file():
            space.load_file(self.rules_path)
        if self.omega_skill_path.is_file():
            space.load_file(self.omega_skill_path)
        else:
            # Built-in fallback rule definition
            space.add_rule_string("""
(= (water-demand flowering) high)
(= (water-demand vegetative) medium)
(= (water-demand germination) high)
(= (irrigation-decision $soil $rain $water $current-rain)
    (if $current-rain
        WAIT
        (if (and (< $soil 18) (>= $rain 70) (== $water limited))
            WAIT
            (if (and (< $soil 18) (< $rain 35) (not (== $water unavailable)))
                IRRIGATE
                REASSESS))))
(= (decision-rule IRRIGATE) R-LOW-MOISTURE-LOW-RAIN)
(= (decision-rule WAIT) R-HIGH-RAIN-WATER-CONSERVATION)
(= (decision-rule REASSESS) R-UNCERTAIN-OR-BALANCED)
""")

        # Inject farmer / custom field rules ("The Agent That Grows Up")
        if custom_rules:
            for rule in custom_rules:
                if not rule.get("is_active", True):
                    continue
                # If explicit MeTTa expr provided
                if rule.get("metta_expr"):
                    space.add_rule_string(rule["metta_expr"])
                else:
                    # Synthesize from condition
                    cond = rule.get("condition", {})
                    action = rule.get("action", "WAIT")
                    # E.g. {"rain_threshold_min": 60}
                    if "rain_threshold_min" in cond:
                        thresh = cond["rain_threshold_min"]
                        rule_str = f"(= (custom-rain-check $soil $rain) (if (>= $rain {thresh}) {action} CONTINUED))"
                        space.add_rule_string(rule_str)

        interpreter = MettaInterpreter(space)

        # Construct query expression: (irrigation-decision $soil $rain $water $current-rain)
        c_rain_val = True if current_rain else False
        query = Expression([
            Symbol("irrigation-decision"),
            soil,
            rain,
            Symbol(water.lower()),
            c_rain_val
        ])

        # First evaluate custom rules if present
        eval_result = None
        fired_custom_rule = None
        if custom_rules:
            for rule in custom_rules:
                if not rule.get("is_active", True):
                    continue
                cond = rule.get("condition", {})
                if "rain_threshold_min" in cond and rain >= cond["rain_threshold_min"]:
                    eval_result = Symbol(rule.get("action", "WAIT"))
                    fired_custom_rule = rule.get("name", "Custom Field Rule")
                    interpreter.trace_steps.append({
                        "type": "CUSTOM_RULE_MATCH",
                        "rule_name": fired_custom_rule,
                        "condition": f"rain ({rain}%) >= threshold ({cond['rain_threshold_min']}%)",
                        "action": rule.get("action", "WAIT")
                    })
                    break

        if eval_result is None:
            eval_result = interpreter.evaluate(query)

        rec = "REASSESS"
        if isinstance(eval_result, Symbol):
            rec = eval_result.name.upper()
        elif isinstance(eval_result, str):
            rec = eval_result.upper()

        rule_id = fired_custom_rule or self._map_rule_id(rec)

        # Map steps for the audit trail
        formatted_steps = []
        for i, s in enumerate(interpreter.trace_steps, 1):
            formatted_steps.append({
                "sequence": i,
                "type": s.get("type", "METTA_STEP"),
                "rule_id": s.get("rule_head") or s.get("rule_name") or rule_id,
                "input": s.get("bindings") or {"soil": soil, "rain": rain},
                "output": s.get("result") or s.get("output") or rec,
                "confidence": 0.92
            })

        cf = self.evaluate_counterfactuals(soil, rain, water)
        return MettaExecutionResult(
            recommendation=rec,
            confidence=0.91 if fired_custom_rule else 0.88,
            reason=self._format_reason(rec, soil, rain, water, current_rain, fired_custom_rule),
            rules=[rule_id],
            steps=formatted_steps,
            source="metta-embedded",
            counterfactuals=cf,
            raw_output=repr(eval_result)
        )

    def evaluate_counterfactuals(self, soil: float, rain: float, water: str = "limited") -> dict[str, Any]:
        """Symbolic counterfactual trade-off analysis (What if you irrigate vs what if you wait?)."""
        is_high_rain = rain >= 70
        is_low_rain = rain < 35
        
        if is_high_rain:
            irrigate_eff = "POOR"
            irrigate_risk = "Root leaching & reservoir water waste"
            irrigate_impact = f"Wastes limited reservoir water when high rainfall ({rain}%) is imminent."
            irrigate_rec = "AVOID"
        else:
            irrigate_eff = "OPTIMAL"
            irrigate_risk = "Moisture stress relief"
            irrigate_impact = "Directly replenishes root zone before critical moisture stress occurs."
            irrigate_rec = "PROCEED"

        if is_low_rain:
            wait_eff = "NEUTRAL"
            wait_risk = "Severe crop water stress"
            wait_impact = f"With only {rain}% rain probability, delaying irrigation risks crop yield loss."
            wait_rec = "AVOID"
        else:
            wait_eff = "HIGH"
            wait_risk = "Minimal - natural rainfall compensates"
            wait_impact = f"Conserves limited irrigation reserves while relying on expected {rain}% rainfall."
            wait_rec = "PROCEED"

        return {
            "if_irrigate": {
                "action": "IRRIGATE",
                "efficiency": irrigate_eff,
                "risk": irrigate_risk,
                "impact": irrigate_impact,
                "recommendation": irrigate_rec
            },
            "if_wait": {
                "action": "WAIT",
                "efficiency": wait_eff,
                "risk": wait_risk,
                "impact": wait_impact,
                "recommendation": wait_rec
            }
        }

    def _map_rule_id(self, rec: str) -> str:
        if rec == "IRRIGATE":
            return "R-LOW-MOISTURE-LOW-RAIN"
        elif rec == "WAIT":
            return "R-HIGH-RAIN-WATER-CONSERVATION"
        return "R-UNCERTAIN-OR-BALANCED"

    def _format_reason(
        self,
        rec: str,
        soil: float,
        rain: float,
        water: str,
        current_rain: bool,
        custom_rule_name: str | None = None
    ) -> str:
        if custom_rule_name:
            return (
                f"Adapted by custom rule '{custom_rule_name}': rain forecast is {rain}%, "
                f"so immediate irrigation is paused to conserve water resources."
            )
        if current_rain:
            return "Rain is currently falling on the field; irrigation is paused to prevent waterlogging."
        if rec == "WAIT":
            return (
                f"Soil moisture is {soil}%, but rain probability is {rain}% in the next 24h. "
                f"With {water.lower()} water availability, waiting for natural precipitation is the optimal decision."
            )
        elif rec == "IRRIGATE":
            return (
                f"Soil moisture is critically low at {soil}%, and rain probability is only {rain}%. "
                f"Immediate irrigation is recommended to protect the crop."
            )
        return (
            f"Soil moisture ({soil}%) and rain forecast ({rain}%) indicate balanced or uncertain conditions. "
            f"Monitor sensor readings and reassess after the next weather cycle."
        )

metta_service = MettaService()
