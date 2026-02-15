# EchoLog – Voice, Typing, and Sound Capture App

## Goal
EchoLog is a mobile application that allows users to quickly capture thoughts, conversations, or ambient sounds using three input methods:

1. Voice recording with automatic transcription  
2. Manual typing  
3. Audio-only recording  

Each entry records:
- Date and time
- Location name
- Coordinates
- Transcript text OR typed text OR audio file

Entries appear in a fast list view and can be exported as a single document by time range.

The app is local-first for speed, and older data can sync to Supabase when thresholds are exceeded.

---

## Core User Flows

### Voice → Text Mode (Transcribe)
1. User presses and holds the main button
2. Recording starts immediately
3. User releases the button
4. Audio is transcribed automatically
5. Entry appears in list

If transcription is delayed:
- Placeholder entry shows "Transcribing..."

---

### Type Mode
1. User taps "New Note"
2. Location auto-filled if available
3. User types text
4. Entry saved

---

### Sound Mode (Audio Only)
1. User presses and holds button
2. Recording starts
3. User releases button
4. Audio saved
5. Entry appears with audio indicator

No transcription in this mode.

---

## Entry Types

Each entry has one type:

- transcript
- typed
- sound

---

## Data Stored Per Entry

Each entry contains:

- id
- type
- createdAt
- updatedAt
- locationName
- latitude
- longitude
- locationKey
- transcriptText
- transcriptEngine
- transcriptConfidence
- audioPath
- durationMs
- syncStatus

---

## Location Behavior

If the user edits a location name:

- That name becomes the preferred name for that coordinate region
- Future entries recorded at the same location automatically use that name

LocationKey rule:
- geohash precision 8

---

## List View

Default columns:
1. DateTime
2. Location
3. Content Preview

Optional column:
4. Coordinates

Sorting:
- newest first

---

## Export

User can export entries as a single document.

Ranges:
- Day
- Week
- Month
- 3 Months
- 6 Months
- Year

Export format:
- Entries grouped by date
- Each entry shows time, location, and content

User actions:
- Copy all
- Select text
- Share (future feature)

---

## Storage Strategy

Default:
- Local SQLite database

When threshold exceeded:
- Old entries uploaded to Supabase
- Local cache maintained

Offline-first behavior required.

---

## Permissions

Required:
- Microphone

Optional:
- Location

If location permission denied:
- Location saved as "Unknown"
- Entry still created

---

## Performance Targets

Recording start:
- Under 150ms target

List performance:
- Smooth scrolling up to 5000 entries

---

## Non-Goals (Version 1)

- Social sharing
- Multi-user collaboration
- Audio editing
