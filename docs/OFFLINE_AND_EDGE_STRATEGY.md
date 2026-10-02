# Offline Resilience and Edge Execution Architecture

## Context
Rural smallholders frequently experience cellular connectivity dropouts and grid power outages. An agricultural decision agent must not freeze when the internet connection drops.

## Architectural Tiers of Resilience

### 1. In-Browser Client Cache (PWA)
- The React frontend caches the current field digital twin, active crop thresholds, and the last 10 decision traces in IndexedDB and localStorage.
- If the browser loses network access, the UI continues to render the What-If simulation sandbox and local rule tester using pre-bundled agronomic logic.

### 2. Edge Micro-Gateway (ESP32 / Raspberry Pi Zero 2W)
- A lightweight symbolic interpreter can run directly on an on-farm edge device.
- The gateway collects local sensor telemetry, evaluates hard safety limits (e.g., immediate valve shutoff on high rain detection), and buffers observations until connectivity resumes.

### 3. Store-and-Forward Synchronization
- Once 4G / Wi-Fi is restored, queued observations and outcome measurements are synchronized upstream with timestamp preservation and conflict resolution.
