---
name: monster
description: Build a creature that fits the current room and write it to Bestiary/.
---

Build one creature for the fight in progress.

1. Read `_dm/ACTIVE.md` for the room and situation, and the three most recently modified
   notes in `Bestiary/` for house style — match their formatting and voice.
2. Read the current location note for tone and hazards.
3. Build it. Party is level 11 unless `PCs/` says otherwise — check, do not assume.
   5e 2014 maths only.
4. Write it to `Bestiary/<Name>.md` using `_templates/monster.md`, with `status: unverified`
   and `source: homebrew`. Frontmatter **must** include `ac` and `hp` — the combat tracker
   reads those fields.
5. Reply with only: `Name, AC, HP`. Nothing else. The DM is mid-fight.

Stat block in English. Any read-aloud description in Danish.
