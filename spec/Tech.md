# EchoLog – Technical Specification

## Platform

Target:
- Android first
- iOS later (same codebase)

Framework:
- React Native (Expo)

Language:
- TypeScript

---

## Architecture Overview

Layers:

1. UI Layer
2. Application Logic Layer
3. Local Storage Layer
4. Sync Layer (Supabase)

The app must function offline-first.

---

## Core Modules

### Recording Module

Responsibilities:
- Start recording instantly
- Stop recording
- Save audio file
- Return duration

Library:
- expo-av

---

### Transcription Module

Responsibilities:
- Convert audio to text
- Return transcript
- Handle errors gracefully

Design:
- Async transcription
- Placeholder entry while processing

Future:
- Whisper or server transcription

---

### Typing Module

Responsibilities:
- Create entry without audio
- Save text immediately

---

### Location Module

Responsibilities:
- Fetch GPS coordinates
- Reverse geocode to location name
- Generate locationKey (geohash precision 8)

Library:
- expo-location

---

### Entry Storage Module

Responsibilities:
- Create entry
- Update entry
- Delete entry
- Query entries by date range

Local DB:
- SQLite (expo-sqlite)

---

### Audio Storage

Audio files stored:
- Local filesystem

Library:
- expo-file-system

---

### Sync Module

Responsibilities:
- Upload older entries to Supabase
- Maintain local cache
- Sync status flag

Sync triggers:
- Storage threshold exceeded
- Manual sync

---

## Data Flow Example

Voice Entry Flow:

1. User holds button
2. Recording starts
3. Recording stops
4. Entry created (status = processing)
5. Transcription starts
6. Entry updated with transcript

---

## Performance Targets

Recording start:
<150ms

Entry save:
<100ms

Scroll:
60fps up to 5000 entries

---

## Error Handling

Possible failures:

Microphone permission denied:
- Show prompt
- Allow typing fallback

Location unavailable:
- Save "Unknown"

Transcription failure:
- Keep audio
- Allow retry

---

## Folder Structure
