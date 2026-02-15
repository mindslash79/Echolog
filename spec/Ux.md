# EchoLog – UX Specification

## Design Principles

1. Extremely fast capture
2. Minimal thinking required
3. Calm, distraction-free interface
4. Large touch targets
5. Dark mode default

The app should feel like:
- pressing a voice memo recorder
- but instantly searchable

---

## Main Screen Layout

Top area:
- Mode selector
    - Voice
    - Type
    - Sound

Center:
- Large hold-to-record button (Voice/Sound modes)
- Text input field (Type mode)

Bottom:
- Entry list

---

## Record Button Behavior

Voice Mode:
- Hold → recording
- Release → stop + transcribe

Sound Mode:
- Hold → recording
- Release → save audio

Button visual feedback:
- Glow while recording
- Timer visible

---

## Entry List UI

Each row shows:

Column 1:
Time + Date

Column 2:
Location name

Column 3:
Preview of content

Optional Column 4:
Coordinates (toggle setting)

---

## Entry Row Behavior

Tap:
- Open detail view

Long press:
- Copy entry text
- Delete
- Export single entry

---

## Entry Detail Screen

Displays:
- Full text or audio player
- Location name
- Coordinates
- Edit button

Editable fields:
- Text
- Location name

---

## Location Rename Behavior

When user edits a location name:

Prompt:
"Apply this name to future entries in this location?"

Options:
- Yes
- No

---

## Export Screen

User selects:

Range:
- Day
- Week
- Month
- 3 Months
- 6 Months
- Year

Actions:
- Copy to clipboard
- Preview
- Save file (future)

---

## Settings Screen

Options:

Toggle:
- Show coordinates column
- Auto-sync to cloud
- Transcription engine selection (future)

---

## Empty State

If no entries:

Message:
"Hold the button to capture a thought."

---

## Visual Style

Font:
- Clean sans-serif

Colors:
- Dark background
- Soft accent color
- Recording = red glow

Animations:
- Subtle
- Under 150ms transitions

---

## Accessibility

Large buttons required:
Minimum 44x44 pt

Readable text:
Minimum 16px

Voice feedback optional (future)
