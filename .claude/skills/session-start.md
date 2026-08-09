---
name: session-start
description: Regenerate _dm/ACTIVE.md before a session so the assistant is oriented in one turn.
disable-model-invocation: true
---

Regenerate `_dm/ACTIVE.md` from the current state of the vault.

1. Read the newest note in `Sessions/`, the newest notes in `Encounters/`, `Quests/Threads.md`,
   and the location note referenced by the current `location:` frontmatter.
2. Rewrite `_dm/ACTIVE.md` with:
   - Where the party is, in 3-5 sentences of Danish.
   - Open design work as a checklist. Carry forward anything still unticked.
   - Live threads elsewhere, with links.
   - The post-session command block, unchanged.
3. List anything with `status: unverified` created since the last session.
4. Report in one short paragraph what changed. Do not restate the whole file.

Do not invent progress. If the last session log is missing or thin, say so and ask.
