import json
import logging
import os
import re
from dataclasses import dataclass
import httpx
from app.core.config import settings

logger = logging.getLogger("agriguide.llm")

@dataclass
class ParsedObservation:
    predicate: str
    value: dict
    confidence: float
    explanation: str

class LLMService:
    """SingularityNET / ASI Cloud OpenAI-compatible Neural-Symbolic Language Layer.

    Grounds natural language into formal MeTTa predicates (Neural Perception)
    and translates MeTTa/Omega derivation proofs into farmer-accessible explanations
    (Auditable Explanation Synthesizer).

    Supported Models on SingularityNET / ASI Cloud:
      - minimax/minimax-m3 (recommended default for agentic workflows & reasoning)
      - asi1-mini (SingularityNET specialized model)
      - google/gemma-3-27b-it
      - meta-llama/llama-3.3-70b-instruct
      - qwen/qwen3-32b
    """

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        model: str | None = None,
        timeout: float = 12.0
    ):
        self.api_key = (
            api_key
            or os.getenv("ASI_CLOUD_KEY")
            or os.getenv("OPENAI_API_KEY")
            or settings.asi_cloud_key
            or settings.openai_api_key
        ).strip()
        self.base_url = (base_url or os.getenv("ASI_CLOUD_URL") or settings.asi_cloud_url).rstrip("/")
        self.model = model or os.getenv("ASI_CLOUD_MODEL") or settings.asi_cloud_model
        self.timeout = timeout

    @property
    def is_configured(self) -> bool:
        """True if an actual API key is present."""
        return bool(self.api_key and self.api_key != "your_basix_hackathon_api_key_here")

    def check_status(self) -> dict:
        """Diagnostics and health information for API and UI status indicators."""
        return {
            "provider": "asi_cloud",
            "api_configured": self.is_configured,
            "base_url": self.base_url,
            "model": self.model,
            "status": "online" if self.is_configured else "local_mock_fallback",
            "available_models": [
                "minimax/minimax-m3",
                "asi1-mini",
                "google/gemma-3-27b-it",
                "meta-llama/llama-3.3-70b-instruct",
                "qwen/qwen3-32b"
            ]
        }

    def _call_chat_completion(self, messages: list[dict], temperature: float = 0.2, max_tokens: int = 350) -> str | None:
        """Execute an OpenAI-compatible chat completion request against ASI Cloud."""
        if not self.is_configured:
            return None

        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices:
                        return choices[0].get("message", {}).get("content", "")
                else:
                    logger.warning("ASI Cloud API returned status %s: %s", resp.status_code, resp.text[:200])
        except Exception as e:
            logger.warning("ASI Cloud request error: %s. Falling back to local deterministic model.", e)
        return None

    def extract_observation(self, message: str) -> ParsedObservation:
        """Perception Layer: extracts structured MeTTa predicates from farmer text/speech notes.

        Uses SingularityNET / ASI Cloud LLM when configured, with a deterministic
        symbolic heuristic fallback for offline or unconfigured environments.
        """
        if self.is_configured:
            system_prompt = (
                "You are AgriGuide's Neural-Symbolic Perception Module.\n"
                "Extract structured agricultural evidence predicates from unstructured farmer observations.\n"
                "Return a raw JSON object with NO extra text or markdown formatting:\n"
                "{\n"
                '  "predicate": "soil_moisture" | "current_rainfall" | "weather_forecast" | "crop_health" | "farmer_note",\n'
                '  "value": { ... },\n'
                '  "confidence": float between 0.50 and 0.99,\n'
                '  "explanation": "brief reason for extraction"\n'
                "}\n"
                "Examples:\n"
                '- "Soil feels dry and crumbly" -> {"predicate": "soil_moisture", "value": {"value": 16.0, "qualitative": "dry"}, "confidence": 0.88, "explanation": "Farmer notes dry crumbly soil."}\n'
                '- "Heavy rain started 10 minutes ago" -> {"predicate": "current_rainfall", "value": {"value": true, "intensity": "heavy"}, "confidence": 0.95, "explanation": "Active precipitation reported."}\n'
                '- "Dark clouds over the hills, rain expected tomorrow" -> {"predicate": "weather_forecast", "value": {"rain_expected": true, "probability": 75.0, "timeframe": "24h"}, "confidence": 0.85, "explanation": "Farmer sees rain clouds gathering."}'
            )

            try:
                raw_response = self._call_chat_completion(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": message}
                    ],
                    temperature=0.1,
                    max_tokens=200
                )

                if raw_response:
                    cleaned = re.sub(r"^```(?:json)?\s*", "", raw_response.strip())
                    cleaned = re.sub(r"\s*```$", "", cleaned)
                    data = json.loads(cleaned)
                    pred = str(data.get("predicate", "farmer_note"))
                    val = data.get("value", {})
                    if not isinstance(val, dict):
                        val = {"value": val}
                    conf = float(data.get("confidence", 0.85))
                    expl = str(data.get("explanation", "Extracted via SingularityNET / ASI Cloud LLM."))
                    return ParsedObservation(
                        predicate=pred,
                        value=val,
                        confidence=min(0.99, max(0.5, conf)),
                        explanation=expl
                    )
            except Exception as ex:
                logger.warning("Failed to extract observation via LLM: %s. Falling back to heuristic.", ex)

        # Fallback to local heuristic extractor
        return self._extract_heuristic(message)

    def _extract_heuristic(self, message: str) -> ParsedObservation:
        """Deterministic heuristic fallback for observation parsing."""
        text = message.lower()
        if any(x in text for x in ["raining", "rain started", "heavy rain", "downpour", "drizzle", "rainfall"]):
            intensity = "heavy" if any(x in text for x in ["heavy", "pouring", "downpour"]) else "moderate"
            return ParsedObservation(
                "current_rainfall",
                {"value": True, "intensity": intensity, "raw": message},
                0.90,
                f"Detected farmer report about active {intensity} rainfall."
            )

        m = re.search(r"(\d+(?:\.\d+)?)\s*%", text)
        if m and any(k in text for k in ["moisture", "soil", "humidity"]):
            val = float(m.group(1))
            return ParsedObservation(
                "soil_moisture",
                {"value": val, "unit": "percentage"},
                0.88,
                f"Detected numeric soil moisture reading of {val}%."
            )

        if any(k in text for k in ["cloud", "clouds", "dark sky", "thunder", "rain tomorrow", "rain later"]):
            return ParsedObservation(
                "weather_forecast",
                {"rain_expected": True, "probability": 75.0, "timeframe": "24h"},
                0.80,
                "Detected cloud formation indicating probable rainfall within 24h."
            )

        if any(k in text for k in ["dry", "wilting", "parched", "cracked"]):
            return ParsedObservation(
                "soil_moisture",
                {"value": 16.0, "qualitative": "dry", "raw": message},
                0.80,
                "Detected farmer report of parched/dry topsoil."
            )

        return ParsedObservation(
            "farmer_note",
            {"text": message},
            0.70,
            "Stored unstructured farmer field observation."
        )

    def explain(self, recommendation: str, reason: str, confidence: float) -> str:
        """Simple baseline explanation."""
        return f"AgriGuide recommends {recommendation.lower()} with {round(confidence*100)}% confidence. {reason}"

    def explain_decision(
        self,
        recommendation: str,
        confidence: float,
        reason: str,
        steps: list | None = None,
        counterfactuals: dict | None = None,
        supersedes_diff: dict | None = None,
        crop: str = "Maize",
        soil_moisture: float | None = None,
        rain_prob: float | None = None,
        water_avail: str | None = None
    ) -> str:
        """Synthesize a clear, natural language explanation grounded in MeTTa proof.

        Translates the formal symbolic derivation into conversational guidance for farmers,
        honoring the core neuro-symbolic hackathon principle: MeTTa handles the reasoning;
        the ASI Cloud LLM makes it human-auditable.
        """
        if self.is_configured:
            prompt_context = {
                "recommendation": recommendation,
                "confidence_percent": round(confidence * 100),
                "formal_metta_reason": reason,
                "crop": crop,
                "soil_moisture": f"{soil_moisture}%" if soil_moisture is not None else "unknown",
                "rain_prob_24h": f"{rain_prob}%" if rain_prob is not None else "unknown",
                "water_availability": water_avail or "LIMITED",
                "counterfactuals": counterfactuals or {},
                "supersedes_previous": bool(supersedes_diff)
            }

            system_prompt = (
                "You are AgriGuide's Neuro-Symbolic Agricultural Explainer.\n"
                "Your role is to explain a formal MeTTa decision to a farmer in plain, respectful, concise English (2-3 sentences max).\n"
                "CRITICAL: Do NOT invent facts. Base your explanation strictly on the formal parameters provided:\n"
                "- Recommendation\n"
                "- Soil Moisture vs. Rain Forecast\n"
                "- Water Resource Limitations\n"
                "- Counterfactual trade-off (why this action was better than the alternative)\n"
                "- If this supersedes a previous decision, state what new evidence changed the recommendation."
            )

            try:
                raw = self._call_chat_completion(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Formal MeTTa Decision Context:\n{json.dumps(prompt_context, indent=2)}"}
                    ],
                    temperature=0.3,
                    max_tokens=220
                )

                if raw:
                    return raw.strip()
            except Exception as e:
                logger.warning("Failed to generate explanation via ASI Cloud: %s. Using deterministic synthesizer.", e)

        # Deterministic symbolic explanation synthesizer
        cf_part = ""
        if counterfactuals:
            if recommendation in ["WAIT", "IRRIGATE_DELAY"]:
                wait_eff = counterfactuals.get("if_wait", {}).get("efficiency", "HIGH")
                irr_risk = counterfactuals.get("if_irrigate", {}).get("risk", "HIGH_RUNOFF_RISK")
                cf_part = f" Waiting preserves scarce reservoir water while utilizing expected rainfall (trade-off efficiency: {wait_eff}, risk if irrigated: {irr_risk.replace('_', ' ').lower()})."
            elif recommendation in ["IRRIGATE", "IRRIGATE_PROCEED"]:
                irr_eff = counterfactuals.get("if_irrigate", {}).get("efficiency", "HIGH")
                cf_part = f" Immediate irrigation protects crop yield from severe moisture stress (efficiency: {irr_eff})."

        supersede_part = ""
        if supersedes_diff:
            prev = supersedes_diff.get("previous_recommendation")
            if prev and prev != recommendation:
                supersede_part = f" This supersedes previous advice ({prev}) following newly verified environmental evidence."

        return f"AgriGuide advises {recommendation.replace('_', ' ').lower()} ({round(confidence*100)}% confidence). {reason}{cf_part}{supersede_part}"

    def consult(self, query: str, context: dict) -> dict:
        """Grounded conversational consultation with the farmer.

        Answers farmer queries strictly bounded by the MeTTa Atomspace state.
        """
        crop = context.get("crop", "Maize")
        moisture = context.get("soil_moisture", 18.0)
        rain_prob = context.get("rain_probability_24h", 75.0)
        water = context.get("water_availability", "LIMITED")
        decision = context.get("latest_decision", "WAIT")
        reason = context.get("latest_reason", "Expected rain will replenish soil.")

        if self.is_configured:
            system_prompt = (
                f"You are AgriGuide, an explainable agricultural decision agent powered by MeTTa and Omega.\n"
                f"You are conversing with a farmer. All answers must be grounded strictly in this verified field state:\n"
                f"- Crop: {crop}\n"
                f"- Current Soil Moisture: {moisture}%\n"
                f"- 24h Rain Probability: {rain_prob}%\n"
                f"- Water Reservoir Availability: {water}\n"
                f"- Latest MeTTa Recommendation: {decision}\n"
                f"- Formal Reason: {reason}\n"
                "Answer the farmer's question clearly, warmly, and concisely (under 4 sentences). Always explain the reasoning behind the recommendation."
            )

            try:
                ans = self._call_chat_completion(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": query}
                    ],
                    temperature=0.2,
                    max_tokens=250
                )

                if ans:
                    return {
                        "answer": ans.strip(),
                        "grounded": True,
                        "provider": "asi_cloud",
                        "model": self.model
                    }
            except Exception as e:
                logger.warning("Failed consult via ASI Cloud: %s. Using grounded local fallback.", e)

        # Deterministic grounded consult answer
        return {
            "answer": (
                f"Based on your {crop} field's current state (soil moisture at {moisture}%, rain probability at {rain_prob}%, "
                f"and {water.lower()} reservoir water), AgriGuide's MeTTa reasoning engine currently recommends {decision}. "
                f"{reason}"
            ),
            "grounded": True,
            "provider": "local_metta_grounded",
            "model": "deterministic"
        }

