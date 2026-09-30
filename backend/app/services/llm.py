import re
from dataclasses import dataclass

@dataclass
class ParsedObservation:
    predicate: str
    value: dict
    confidence: float
    explanation: str

class LLMService:
    """Provider-neutral language layer.

    Mock mode is deterministic for local development. A real provider can be added
    behind this interface without changing the cognitive domain model.
    """
    def extract_observation(self, message: str) -> ParsedObservation:
        text = message.lower()
        if any(x in text for x in ["raining", "rain", "rainfall"]):
            return ParsedObservation("current_rainfall", {"value": True, "intensity": "unknown", "raw": message}, 0.82, "Detected a farmer report about current rainfall.")
        m = re.search(r"(\d+(?:\.\d+)?)\s*%", text)
        if m and "moisture" in text:
            return ParsedObservation("soil_moisture", {"value": float(m.group(1))}, 0.82, "Detected a soil-moisture percentage.")
        return ParsedObservation("farmer_note", {"text": message}, 0.65, "Stored the message as an unstructured farmer observation.")

    def explain(self, recommendation: str, reason: str, confidence: float) -> str:
        return f"AgriGuide recommends {recommendation.lower()} with {round(confidence*100)}% confidence. {reason}"
