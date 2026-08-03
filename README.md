# The Shifting Realms of Everburgh

Obsidian vault + Claude Code setup for a D&D **5e (2014)** campaign.

## Setup

1. Open this folder as an Obsidian vault.
2. Install the **Dataview** plugin. In its settings enable **JavaScript Queries** and
   **Inline JavaScript Queries**.
3. Core plugin **Page Preview** on. Turn off the Ctrl requirement if you want hover-to-read.
4. `git init && git add -A && git commit -m "initial vault"` — this matters, Claude Code
   edits canon and `git diff` is your undo.
5. Drop your PDFs into `Reference/`.
6. Fill in the `ac:` field in each `PCs/*.md` — the tracker reads it.

## Running combat

Open `Combat/Scratch.md`. The party is already listed. Type initiative, add monsters, go.

| Key | Does |
|-----|------|
| `j` / `k` | move selection |
| digits then `Enter` | apply damage to selection |
| `-` digits | heal |
| `R` | end round (+1 round, +6 seconds) |
| `N` | jump to the add field |
| `C` | add a condition (append a number for rounds: `stunned 1`) |
| `space` | expand the selected monster's stat block inline |

Typing a name that exists in `Bestiary/` auto-fills AC, HP, saves and immunities.
**Build monster ↗** copies a ready-made prompt to the clipboard for Claude Code.

**End encounter** writes an `Encounters/` note with the initiative and HP log in the same
format you were already keeping by hand, then resets the tracker.

## Claude Code

- `CLAUDE.md` is read every session — edition lock, language rules, campaign canon.
- `_dm/ENGAGEMENT.md` — how to behave mid-session. Short answers, rules with sources.
- `_dm/ACTIVE.md` — where the party is right now. Regenerate before each session.
- `_dm/HOUSERULES.md` — currently mostly empty, with an interview to fill it.

At the table: *"Read `_dm/` — we're running."*

## Language

Story, narration and descriptions in **Danish**. Stats, rules, conditions, spell names and
all mechanics in **English**. When in doubt, English.
