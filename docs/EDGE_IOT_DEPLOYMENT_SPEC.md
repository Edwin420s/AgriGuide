# Edge IoT Hardware Deployment Specification

## Device Specifications
- Microcontroller: ESP32-WROOM-32D (Dual-Core 240MHz, 4MB Flash, Wi-Fi / BLE / LoRa).
- Primary Transceiver: SX1276 LoRa 868/915MHz for rural connectivity up to 10km.
- Power Supply: 5W Monocrystalline solar panel + 18650 3.7V 3000mAh Li-ion battery.

## Telemetry Packet Format (Binary Struct)
```
Byte 0-1: Device ID (uint16)
Byte 2-3: Packet Sequence (uint16)
Byte 4-5: Soil Moisture VWC x 10 (int16)
Byte 6-7: Soil Temperature x 10 (int16)
Byte 8-9: Ambient Humidity x 10 (int16)
Byte 10-11: Battery Millivolts (uint16)
Byte 12-13: CRC-16-CCITT Checksum (uint16)
```

## Cloud Ingestion Gateway
Telemetry packets arrive at the FastAPI edge endpoint `/api/sensors/telemetry`, undergo CRC-16 verification, and are injected into the active field Atomspace.
