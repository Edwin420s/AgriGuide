"""Live Open-Meteo Meteorological Service for AgriGuide.

Connects to the official public Open-Meteo API (no API key required) to fetch
real-time weather, temperature, humidity, wind, and forecast precipitation for
any farm's geographic coordinates (e.g. Kirinyaga County, Kenya at -0.528, 37.283).
"""

import logging
from datetime import datetime, timezone
import httpx
from typing import Any

logger = logging.getLogger("agriguide.weather")

class WeatherService:
    BASE_URL = "https://api.open-meteo.com/v1/forecast"
    GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"

    AGRICULTURAL_HUBS = {
        # Central Region (Highlands & Tea / Coffee / Rice / Dairy)
        "kutus": (-0.528, 37.283, "Kutus, Kirinyaga County, Kenya"),
        "kerugoya": (-0.498, 37.280, "Kerugoya, Kirinyaga County, Kenya"),
        "mwea": (-0.686, 37.356, "Mwea, Kirinyaga County, Kenya"),
        "kirinyaga": (-0.500, 37.280, "Kirinyaga Central, Kenya"),
        "kiambu": (-1.171, 36.835, "Kiambu County, Kenya"),
        "thika": (-1.033, 37.069, "Thika, Kiambu County, Kenya"),
        "limuru": (-1.117, 36.650, "Limuru, Kiambu County, Kenya"),
        "nyeri": (-0.420, 36.947, "Nyeri County, Kenya"),
        "karatina": (-0.483, 37.124, "Karatina, Nyeri County, Kenya"),
        "othaya": (-0.563, 36.942, "Othaya, Nyeri County, Kenya"),
        "murang'a": (-0.721, 37.152, "Murang'a County, Kenya"),
        "maragua": (-0.783, 37.133, "Maragua, Murang'a County, Kenya"),
        "nyandarua": (-0.180, 36.520, "Nyandarua County, Kenya"),
        "ol kalou": (-0.271, 36.379, "Ol Kalou, Nyandarua County, Kenya"),
        "kinangop": (-0.638, 36.634, "North Kinangop, Nyandarua County, Kenya"),

        # Rift Valley (Grain Basket & Horticulture)
        "eldoret": (0.514, 35.269, "Eldoret, Uasin Gishu County, Kenya"),
        "uasin gishu": (0.550, 35.300, "Uasin Gishu County, Kenya"),
        "kitale": (1.016, 35.006, "Kitale, Trans-Nzoia County, Kenya"),
        "trans nzoia": (1.050, 34.950, "Trans-Nzoia County, Kenya"),
        "nakuru": (-0.303, 36.080, "Nakuru County, Kenya"),
        "naivasha": (-0.717, 36.431, "Naivasha, Nakuru County, Kenya"),
        "molo": (-0.248, 35.733, "Molo, Nakuru County, Kenya"),
        "subukia": (-0.016, 36.233, "Subukia, Nakuru County, Kenya"),
        "nanyuki": (0.016, 37.072, "Nanyuki, Laikipia County, Kenya"),
        "laikipia": (0.333, 36.833, "Laikipia County, Kenya"),
        "rumuruti": (0.272, 36.538, "Rumuruti, Laikipia County, Kenya"),
        "kericho": (-0.368, 35.286, "Kericho County, Kenya"),
        "bomet": (-0.781, 35.342, "Bomet County, Kenya"),
        "sotik": (-0.683, 35.117, "Sotik, Bomet County, Kenya"),
        "narok": (-1.083, 35.867, "Narok County, Kenya"),
        "kajiado": (-1.850, 36.783, "Kajiado County, Kenya"),
        "nandi": (0.183, 35.100, "Nandi County, Kenya"),
        "kapsabet": (0.204, 35.105, "Kapsabet, Nandi County, Kenya"),
        "baringo": (0.467, 35.967, "Baringo County, Kenya"),
        "kabarnet": (0.492, 35.743, "Kabarnet, Baringo County, Kenya"),
        "elgeyo marakwet": (0.800, 35.500, "Elgeyo-Marakwet County, Kenya"),
        "iten": (0.672, 35.507, "Iten, Elgeyo-Marakwet County, Kenya"),
        "turkana": (3.117, 35.600, "Turkana County, Kenya"),
        "lodwar": (3.119, 35.597, "Lodwar, Turkana County, Kenya"),
        "west pokot": (1.617, 35.117, "West Pokot County, Kenya"),
        "kapenguria": (1.240, 35.114, "Kapenguria, West Pokot County, Kenya"),
        "samburu": (1.250, 36.950, "Samburu County, Kenya"),
        "maralal": (1.097, 36.698, "Maralal, Samburu County, Kenya"),

        # Eastern Region
        "embu": (-0.534, 37.456, "Embu County, Kenya"),
        "meru": (0.047, 37.655, "Meru County, Kenya"),
        "maua": (0.233, 37.933, "Maua, Meru County, Kenya"),
        "tharaka nithi": (-0.300, 37.900, "Tharaka-Nithi County, Kenya"),
        "chuka": (-0.333, 37.650, "Chuka, Tharaka-Nithi County, Kenya"),
        "machakos": (-1.517, 37.263, "Machakos County, Kenya"),
        "makueni": (-1.800, 37.620, "Makueni County, Kenya"),
        "wote": (-1.781, 37.629, "Wote, Makueni County, Kenya"),
        "kitui": (-1.367, 38.017, "Kitui County, Kenya"),
        "isiolo": (0.354, 37.582, "Isiolo County, Kenya"),
        "marsabit": (2.328, 37.989, "Marsabit County, Kenya"),

        # Western Region (Sugarcane & Mixed Farming)
        "kakamega": (0.283, 34.750, "Kakamega County, Kenya"),
        "mumias": (0.335, 34.487, "Mumias, Kakamega County, Kenya"),
        "bungoma": (0.569, 34.558, "Bungoma County, Kenya"),
        "webuye": (0.617, 34.767, "Webuye, Bungoma County, Kenya"),
        "busia": (0.461, 34.111, "Busia County, Kenya"),
        "vihiga": (0.067, 34.717, "Vihiga County, Kenya"),
        "mbale": (0.082, 34.721, "Mbale, Vihiga County, Kenya"),

        # Nyanza Region
        "kisumu": (-0.102, 34.761, "Kisumu County, Kenya"),
        "kisii": (-0.682, 34.767, "Kisii County, Kenya"),
        "nyamira": (-0.563, 34.935, "Nyamira County, Kenya"),
        "homa bay": (-0.527, 34.457, "Homa Bay County, Kenya"),
        "migori": (-1.063, 34.473, "Migori County, Kenya"),
        "siaya": (-0.061, 34.288, "Siaya County, Kenya"),

        # Coast Region
        "mombasa": (-4.043, 39.668, "Mombasa County, Kenya"),
        "kilifi": (-3.630, 39.850, "Kilifi County, Kenya"),
        "malindi": (-3.217, 40.117, "Malindi, Kilifi County, Kenya"),
        "kwale": (-4.174, 39.460, "Kwale County, Kenya"),
        "taita taveta": (-3.317, 38.350, "Taita-Taveta County, Kenya"),
        "voi": (-3.396, 38.556, "Voi, Taita-Taveta County, Kenya"),
        "taveta": (-3.398, 37.674, "Taveta, Taita-Taveta County, Kenya"),
        "lamu": (-2.271, 40.902, "Lamu County, Kenya"),
        "tana river": (-1.500, 39.900, "Tana River County, Kenya"),
        "hola": (-1.500, 40.033, "Hola, Tana River County, Kenya"),

        # North Eastern Region
        "garissa": (-0.453, 39.646, "Garissa County, Kenya"),
        "wajir": (1.747, 40.057, "Wajir County, Kenya"),
        "mandera": (3.937, 41.857, "Mandera County, Kenya"),

        # Nairobi
        "nairobi": (-1.292, 36.822, "Nairobi County, Kenya")
    }

    def list_known_locations(self) -> list[dict[str, Any]]:
        """Returns sorted list of all registered Kenyan agricultural hubs and counties."""
        return [
            {"key": k, "name": desc, "latitude": lat, "longitude": lon}
            for k, (lat, lon, desc) in sorted(self.AGRICULTURAL_HUBS.items(), key=lambda x: x[1][2])
        ]

    def resolve_location(self, query: str) -> dict[str, Any]:
        """Resolves location name to geographical coordinates and elevation for weather forecasting."""
        cleaned = query.strip().lower()
        for key, (lat, lon, desc) in self.AGRICULTURAL_HUBS.items():
            if key in cleaned:
                return {
                    "name": desc,
                    "latitude": lat,
                    "longitude": lon,
                    "country": "Kenya",
                    "source": "verified_hub"
                }

        try:
            with httpx.Client(timeout=4.0) as client:
                resp = client.get(self.GEOCODING_URL, params={"name": query.strip(), "count": 1})
                if resp.status_code == 200:
                    results = resp.json().get("results", [])
                    if results:
                        top = results[0]
                        admin = top.get("admin1") or top.get("country") or ""
                        full_name = f"{top.get('name')}, {admin}".strip(", ")
                        return {
                            "name": full_name,
                            "latitude": float(top.get("latitude")),
                            "longitude": float(top.get("longitude")),
                            "elevation": top.get("elevation"),
                            "country": top.get("country", "Kenya"),
                            "source": "open-meteo-geocoding"
                        }
        except Exception as e:
            logger.warning("Geocoding lookup failed for '%s': %s", query, e)

        return {
            "name": f"{query.strip().title()}, Kenya",
            "latitude": -0.528,
            "longitude": 37.283,
            "country": "Kenya",
            "source": "default_fallback"
        }

    def fetch_live_weather(
        self,
        latitude: float = -0.528,
        longitude: float = 37.283,
        timeout: float = 5.0
    ) -> dict[str, Any]:
        """Fetch live meteorological telemetry and 24h/48h forecast from Open-Meteo."""
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": [
                "temperature_2m",
                "relative_humidity_2m",
                "precipitation",
                "wind_speed_10m"
            ],
            "daily": [
                "precipitation_probability_max",
                "precipitation_sum",
                "temperature_2m_max",
                "temperature_2m_min"
            ],
            "timezone": "auto"
        }

        try:
            with httpx.Client(timeout=timeout) as client:
                resp = client.get(self.BASE_URL, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    current = data.get("current", {})
                    daily = data.get("daily", {})
                    
                    # Extract live values
                    temp_c = float(current.get("temperature_2m", 24.5))
                    humidity = float(current.get("relative_humidity_2m", 58.0))
                    current_precip = float(current.get("precipitation", 0.0))
                    wind_kmh = float(current.get("wind_speed_10m", 10.0))
                    
                    # Forecast
                    daily_probs = daily.get("precipitation_probability_max", [])
                    daily_sums = daily.get("precipitation_sum", [])
                    
                    rain_prob_24h = float(daily_probs[0]) if daily_probs else 15.0
                    rain_sum_24h = float(daily_sums[0]) if daily_sums else 0.0
                    
                    return {
                        "status": "live",
                        "provider": "open-meteo",
                        "latitude": latitude,
                        "longitude": longitude,
                        "temperature_c": temp_c,
                        "humidity_pct": humidity,
                        "wind_speed_kmh": wind_kmh,
                        "current_rainfall": current_precip > 0.1,
                        "current_rainfall_mm": current_precip,
                        "rain_probability_24h": rain_prob_24h,
                        "expected_accumulation_mm": rain_sum_24h,
                        "fetched_at": datetime.now(timezone.utc).isoformat()
                    }
                else:
                    logger.warning("Open-Meteo returned status %s: %s", resp.status_code, resp.text[:100])
        except Exception as e:
            logger.warning("Failed to fetch live weather from Open-Meteo: %s. Using default baseline.", e)

        # Fallback to realistic East African baseline if network is offline
        return {
            "status": "fallback",
            "provider": "open-meteo-baseline",
            "latitude": latitude,
            "longitude": longitude,
            "temperature_c": 24.8,
            "humidity_pct": 62.0,
            "wind_speed_kmh": 11.0,
            "current_rainfall": False,
            "current_rainfall_mm": 0.0,
            "rain_probability_24h": 18.0,
            "expected_accumulation_mm": 0.0,
            "fetched_at": datetime.now(timezone.utc).isoformat()
        }

weather_service = WeatherService()
