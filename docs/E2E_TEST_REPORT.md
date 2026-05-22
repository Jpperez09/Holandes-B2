# End-to-End Test Report — Dutch B2 Localhost App

**Date:** 2026-05-22
**Scope:** Full suite — every level, module, activity, vocabulary item, grammar
pattern, screen, write path, and error case.
**Result:** ✅ **141 / 141 checks passed · 2 bugs found · 2 bugs fixed**

---

## 1. Method

The test ran in two phases so the user's real study progress was never at risk:

- **Phase A — non-destructive** (87 checks): run against the live app. Hits every
  read endpoint and validates the data. Mutates nothing.
- **Phase B — destructive** (54 checks): the user's `progress.sqlite` was **backed
  up**, the test ran against a **fresh isolated database**, then the user's database
  was **restored**. Verified afterwards: 77 new / 29 learning / 24 review — the exact
  pre-test state, untouched.

Re-runnable scripts: `scripts/e2e-phase-a.py` and `scripts/e2e-phase-b.py`
(pure Python standard library — `python scripts/e2e-phase-a.py` with the app running).

---

## 2. What was tested

| Area | Coverage |
|---|---|
| Health | `/api/health`, `/api/health/db`, DB integrity, migrations |
| Levels | All 5 levels + per-level + unlock-state endpoints |
| Modules | List + detail + progress for **all 5 modules** |
| Activities | All **39 activities** — types valid, titles & ids present |
| Vocabulary | All **130 items** — translation, tts_text, IPA, articles |
| Grammar | All **18 grammar patterns** indexed |
| Vault | Snapshot, warnings, raw module bodies (×5) |
| Frontend | All 8 screens + **all 5 module-detail pages** rendered (headless) |
| Write paths | Module completion (2 modules, all activities), FSRS grading |
| FSRS | Grades 1–4, scheduling intervals, status transitions, history |
| Daily logs | Create, update, multi-date, streak calculation |
| Error cases | 404 / 422 / 400 handling, duplicate attempts, offline state |

---

## 3. Bugs found and fixed

### 🐞 Bug 1 — Corrupted vocabulary rows in the curriculum vault (FIXED)

**Severity:** Medium — wrong content shown to the learner.

In `05_Exercises/Generated/Vocabulary_Seed_A0_A1.md`, section **2.14**, the table
header declared **9 columns** but the two data rows had only **8** — the `article`
cell was missing. Every column after it shifted by one, so the words **`uit`** and
**`in`** were stored with:

- `pos` = `/œyt/` (the IPA), `translation_en` = `partial`, `module_id` = empty.

Effect: `uit`/`in` would have shown a wrong English answer in vocabulary review and
were missing from MOD-003's word list (showed 30 words instead of 32).

**Fix:** added the missing `—` (no-article) cell to both rows in the vault file.
After re-index, both words are correct (`pos=prep`, `translation_en` correct,
`module_id=MOD-003`) and MOD-003 now shows all **32 words**.

> Root cause was vault *content*, not app code — but it reveals that the Markdown
> table parser silently accepts a row with fewer cells than its header. See §5.

### 🐞 Bug 2 — A completed module could display as "Locked" (FIXED)

**Severity:** Low — cosmetic, cannot occur in normal play.

The Learn screen unlocked a module only if it was first or the previous module was
done. A module that is itself 100% complete but whose predecessor is not done would
still render "🔒 Locked" — contradicting its "Done" status.

This cannot happen through normal use (you can't finish a locked module), but it is a
logical inconsistency and leaves the door open to a confusing state.

**Fix:** `frontend/src/screens/Learn.tsx` — a module is also unlocked if it has any
progress (`percent_complete > 0`). You can always revisit a module you've started or
finished. Verified: a completed module now always shows "✓ Done".

---

## 4. Detailed results

### Phase A — non-destructive (87/87 passed)

- Health, settings, 5 levels + unlock-state: all ok.
- 5 modules: MOD-001 (7 activities, 10→ now correct), MOD-002 (7, 25), MOD-003
  (8, **32** after fix), MOD-004 (8, 39), MOD-005 (9, 24). Total **39 activities**. ✅
- 130 vocabulary items: every one has an English translation and TTS text. ✅
- 18 grammar patterns indexed. ✅
- 3 parser warnings — all benign `info` notes ("mevrouw", "meneer", "Colombia" have
  no de/het article — correct, they are titles/proper nouns).
- Error handling: unknown module → 404, unknown vocab → 404, bad id → 400. ✅

### Phase B — destructive, isolated DB (54/54 passed)

- **Module completion:** MOD-001 marked complete activity by activity — percentage
  rose 14 → 29 → 43 → 57 → 71 → 86 → 100%. MOD-005 (9 activities) → 100%. ✅
- **Duplicate attempts** do not inflate the percentage. ✅
- **Unlock chain:** with MOD-001 at 100%, MOD-002 unlocks; later modules stay locked.
  Verified visually on the Learn screen. ✅
- **FSRS scheduling** (new card, per rating):
  - Again → next review ~1 min
  - Hard → ~5 min
  - Good → ~10 min
  - Easy → ~16 days
  Intervals correctly ordered; status moves new → learning/review. ✅
- **Review history** accumulates; `fsrs_state` stored as valid JSON. ✅
- **Daily logs:** create, multi-date, streak = 2 for two consecutive days, update an
  existing log without creating a duplicate. ✅
- **Edge cases:** missing activity → 404, grade 5 → 422, grade 0 → 422, bad date
  → 400. ✅

### Frontend rendering

All 8 screens and all 5 module-detail pages rendered cleanly via headless browser,
each showing the correct sections ("What you'll learn", activities, grammar,
real-world task). No JavaScript errors. Error states (offline, vault-unset) show
friendly messages.

---

## 5. Recommendations (not bugs — future hardening)

1. **Parser robustness.** The Markdown table parser silently accepts a data row with
   fewer cells than its header (this is what hid Bug 1). Adding a `warn`-level notice
   when `row cells != header cells` would catch this class of vault typo immediately.
   Worth doing before more curriculum modules are authored.
2. The 3 `noun-missing-article` info warnings are expected; no action needed.

---

## 6. Verdict

> **The MVP passed the full end-to-end test.** All 5 modules, 5 levels, 39 activities,
> 130 words and 18 grammar patterns are correctly indexed and served. Module
> completion, the unlock chain, FSRS review, daily logs and error handling all work.
> The two bugs found were fixed and re-verified. **The app is sound for Juanpa and his
> brother to use daily.**
