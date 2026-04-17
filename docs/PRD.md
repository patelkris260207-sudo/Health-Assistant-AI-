# Product Requirements (Prototype)

## Goal
Build an emergency-capable AI health assistant that guides normal users during urgent and critical conditions, supports live location, and provides quick ambulance/hospital calling options.

## Core Capabilities
1. Symptom + photo triage with severity levels.
2. Emergency escalation and clear immediate actions.
3. Region-based emergency numbers.
4. Nearest eligible hospital routing with fallback.
5. High-contrast emergency-first UI.

## Non-Goals
- Clinical diagnosis replacement.
- Autonomous external call API execution in this prototype.

## Primary User Flow
1. User enters symptom text and optionally attaches photo.
2. Assistant classifies severity and specialty.
3. If critical/high: emergency panel is shown instantly.
4. If location available: nearest reachable hospital is suggested.
5. If preferred hospital unreachable: fallback hospital is surfaced.
