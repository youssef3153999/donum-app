# CLAUDE.md — Read this first

You are working on **Donum**, an Android app for selling/buying land plots
in Syria. Sellers draw polygon boundaries on a satellite map.

## ⚠️ Before doing anything else

**Read `C:\Dev\ardmap\DONUM_DOCS.md` in full.** That file is the single
source of truth: tech stack, pinned versions, file structure, database
schema, completed features, roadmap, decision log, and known issues.

Skipping it will cause you to give advice that contradicts existing
decisions or breaks the build.

## Quick conversation rules

- Default language with the user (Youssef) is **Arabic** — Arabic letters
  only, no English mixed in.
- Keep answers **terse**. After each step or command, add a one-line
  Arabic explanation prefixed with `شرح:`.
- Do **NOT** suggest TWA, PWA, or non-native solutions.
- Do **NOT** bump pinned package versions (see DONUM_DOCS.md section 3)
  unless the user explicitly asks.
- Business-quality tone, not hobby project.

## ⚠️ MANDATORY checklist after EVERY meaningful change

Before telling the user "done", you MUST update `DONUM_DOCS.md`. Skipping
this is a bug. The user is auditing this — your reply at the end MUST
explicitly list what you updated in the docs.

Checklist:

- [ ] If a Pending item (section 7) was finished → moved to section 6 (Done).
- [ ] If a new file was created in `src/` → added to section 4.
- [ ] If SQL was run on Supabase → schema change recorded in section 5.
- [ ] If a non-obvious choice was made → entry added to section 12.
- [ ] If a build/runtime issue was hit and solved → entry added to section 10.
- [ ] "Last updated" date at the top bumped to today.
- [ ] Committed: `git add DONUM_DOCS.md && git commit -m "docs: <what changed>" && git push`

Final user reply must end with a block like:
```
✅ تم. حدّثت DONUM_DOCS.md:
- [list of sections updated]
- التاريخ → YYYY-MM-DD
- Commit: docs: <what changed>
```

If you skip this, the user is allowed to refuse the work as incomplete.

## How to know where we are

If the user asks "where are we?" or "what's next?":
- Section 6 = what's done
- Section 7 = what's next (priority-ordered)
- Section 12 = why we made past decisions
