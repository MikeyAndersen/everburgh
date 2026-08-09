---
name: session-end
description: Post-session pass — update every file the session touched. Run manually only.
disable-model-invocation: true
---

The session is over. Run the cleanup pass.

1. Read the newest note in `Sessions/` and every note in `Encounters/` newer than the
   previous session.
2. Work out what changed for: PCs (items, level, curses, story beats), NPCs (status,
   disposition, relationships), Locations, `Quests/Threads.md`, and any `status: unverified`
   entity that was actually used at the table.
3. **Show the DM a summary of every proposed change before writing anything.** Group by file.
   Wait for approval.
4. On approval, apply edits. Append dated update sections — never delete existing canon.
5. Finish by listing what is still `status: unverified` and needs a decision.

If a change contradicts existing canon, flag the contradiction instead of resolving it.
