# QA Checklist — Dutch B2 Localhost App

A manual test checklist for the MVP. Run through it after any meaningful change.
The **Result** column shows the outcome of the Phase 3 QA pass (2026-05-21).

Legend: ✅ pass · ⚠️ pass with a known limitation · ⬜ not yet tested

---

## 1. Install

| # | Check | Result |
|---|---|---|
| 1.1 | `npm run install:all` completes without errors | ✅ |
| 1.2 | `better-sqlite3` installs with no native compile step | ✅ |
| 1.3 | Node 22 LTS works (`.nvmrc` = 22); Node 24 also works | ✅ |

## 2. Run

| # | Check | Result |
|---|---|---|
| 2.1 | `npm run dev` starts backend + frontend together | ✅ |
| 2.2 | `npm run dev:backend` / `dev:frontend` start individually | ✅ |
| 2.3 | `npm run build` builds backend + frontend with no errors | ✅ |
| 2.4 | `npm test` runs the backend suite — 45 tests pass | ✅ |
| 2.5 | App opens at `http://localhost:5173` | ✅ |

## 3. Backend health

| # | Check | Result |
|---|---|---|
| 3.1 | `GET /api/health` returns `{ ok: true }` | ✅ |
| 3.2 | `GET /api/health/db` returns `ok: true`, integrity `ok` | ✅ |
| 3.3 | Backend binds to `127.0.0.1` only (no LAN exposure) | ✅ |

## 4. Vault health

| # | Check | Result |
|---|---|---|
| 4.1 | Vault indexes 5 modules, 5 levels, 130 vocab, 18 grammar, 39 activities | ✅ |
| 4.2 | `GET /api/vault/snapshot` reports correct counts | ✅ |
| 4.3 | Parser warnings surface via `GET /api/vault/warnings` (3 info notes) | ✅ |
| 4.4 | Re-scan vault works from Settings | ✅ |

## 5. Home

| # | Check | Result |
|---|---|---|
| 5.1 | Friendly time-aware greeting with the user's name | ✅ |
| 5.2 | Current level + CEFR band shown | ✅ |
| 5.3 | "Today's plan" hero with a clear summary sentence | ✅ |
| 5.4 | One obvious primary button: "▶ Start today's lesson" | ✅ |
| 5.5 | Four quick-action cards (Continue / Review / Log / Progress) | ✅ |
| 5.6 | A learning-insight card links to the Library | ✅ |

## 6. Today

| # | Check | Result |
|---|---|---|
| 6.1 | A 5-step daily checklist renders | ✅ |
| 6.2 | Review-vocabulary count matches the real due queue | ✅ |
| 6.3 | "Continue module" points to the current module | ✅ |
| 6.4 | Steps can be ticked off; progress bar updates | ✅ |
| 6.5 | "Write today's log" editor saves (SQLite + vault file) | ✅ |
| 6.6 | Step ticks reset for a new day | ✅ |

## 7. Learn

| # | Check | Result |
|---|---|---|
| 7.1 | Modules MOD-001…MOD-005 listed, grouped by CEFR band | ✅ |
| 7.2 | Each card shows title, level, time, word count | ✅ |
| 7.3 | Status pill: Not started / In progress / Done | ✅ |
| 7.4 | Linear unlock — later modules show 🔒 Locked | ✅ |
| 7.5 | Clicking an unlocked module opens its detail page | ✅ |

## 8. Module Detail

| # | Check | Result |
|---|---|---|
| 8.1 | Title, level, time, progress bar shown | ✅ |
| 8.2 | "What you'll learn" section renders from the module body | ✅ |
| 8.3 | Vocabulary list shown (with de/het articles) | ✅ |
| 8.4 | "Grammar idea" section renders | ✅ |
| 8.5 | Activity checklist renders all activities | ✅ |
| 8.6 | "Mark done" records an attempt (`POST /api/activities/:id/attempts`) | ✅ |
| 8.7 | Progress bar updates from server after marking | ✅ |
| 8.8 | "One real thing to do" (real-world task) shown | ✅ |
| 8.9 | "I need help" collapsible panel works | ✅ |

## 9. Review (vocabulary)

| # | Check | Result |
|---|---|---|
| 9.1 | Start screen shows the due-card count | ✅ |
| 9.2 | One card at a time; Dutch word on the front | ✅ |
| 9.3 | de/het article shown for nouns | ✅ |
| 9.4 | 🔊 audio button speaks via browser speechSynthesis | ⚠️ (voice depends on OS) |
| 9.5 | "Show answer" reveals English + example | ✅ |
| 9.6 | Again / Hard / Good / Easy submit a review | ✅ |
| 9.7 | `POST /api/vocabulary/:id/review` schedules the next due date | ✅ |
| 9.8 | Keyboard: Space reveals, 1–4 grade | ⬜ (code verified; live keypress not automated) |
| 9.9 | End-of-session screen shows a count and a way onward | ✅ |

## 10. Progress

| # | Check | Result |
|---|---|---|
| 10.1 | Stat cards: level, modules done, words learned, study days | ✅ |
| 10.2 | "Recent wins" list (friendly fresh-start message when empty) | ✅ |
| 10.3 | "Next milestone" shown | ✅ |
| 10.4 | "Where you can grow" weak-areas list (friendly when empty) | ✅ |
| 10.5 | Skill details collapsed by default | ✅ |

## 11. Library

| # | Check | Result |
|---|---|---|
| 11.1 | 6 static insight cards render | ✅ |
| 11.2 | Each card: title, explanation, "Based on", "Try this today" | ✅ |
| 11.3 | No invented direct quotes — paraphrased concepts only | ✅ |
| 11.4 | Cards expand/collapse | ✅ |

## 12. Settings

| # | Check | Result |
|---|---|---|
| 12.1 | Plain zone: name, daily goal, learning goal | ✅ |
| 12.2 | Save updates settings (`PATCH /api/settings`) | ✅ |
| 12.3 | App-health line reads "Everything is working" | ✅ |
| 12.4 | Technical details collapsed by default | ✅ |
| 12.5 | Vault path field + Save + Re-scan in the technical section | ✅ |
| 12.6 | Backend / DB / vault status rows shown | ✅ |
| 12.7 | Parser notices listed | ✅ |
| 12.8 | GitHub repo link present | ✅ |

## 13. Error states

| # | Check | Result |
|---|---|---|
| 13.1 | Backend offline → friendly "Can't reach the app" + Try again | ✅ (fixed in this QA pass) |
| 13.2 | Vault path unset → "Your Dutch content is not connected" + Open Settings | ✅ |
| 13.3 | Settings screen still loads when the vault is unset | ✅ |
| 13.4 | Empty vocabulary due → "You're all caught up" | ✅ (code path verified) |
| 13.5 | Empty modules → friendly empty state | ✅ (code path verified) |
| 13.6 | Failed daily-log save → friendly retry message | ✅ (code path verified) |
| 13.7 | Failed review submit → friendly retry message | ✅ (code path verified) |
| 13.8 | Unknown route → friendly "page doesn't exist" + Go home | ✅ |
| 13.9 | No raw stack traces shown to the user | ✅ |

## 14. Data persistence

| # | Check | Result |
|---|---|---|
| 14.1 | Activity attempts persist in `progress.sqlite` | ✅ |
| 14.2 | Vocabulary reviews persist; next-due dates recomputed | ✅ |
| 14.3 | Daily log saved to SQLite and to `04_Daily_Logs/<date>.md` | ✅ |
| 14.4 | Settings persist across restarts | ✅ |
| 14.5 | Deleting `progress.sqlite` yields a clean, working fresh start | ✅ |

## 15. GitHub safety

| # | Check | Result |
|---|---|---|
| 15.1 | `progress.sqlite*` git-ignored, not committed | ✅ |
| 15.2 | `config.local.json` git-ignored, not committed | ✅ |
| 15.3 | `node_modules/` git-ignored | ✅ |
| 15.4 | `dist/` / build output git-ignored | ✅ |
| 15.5 | No `.env`, API keys, or secrets in the repo | ✅ |
| 15.6 | No secret-like patterns in source code | ✅ |

---

## Notes from the Phase 3 QA pass (2026-05-21)

- **Bug found & fixed:** when the backend was down, the Vite dev proxy returns a
  plain-text HTTP 500, so the UI showed a generic "server snag" message. Fixed in
  `frontend/src/api/client.ts` — a 5xx response with a non-JSON body is now treated
  as *offline*, showing the helpful "make sure the app is still running" message.
- **Dead scripts removed:** root `package.json` advertised `validate-vault`,
  `export`, `import`, `reset`, but `scripts/` was empty — running any of them
  crashed. Removed those entries; added a working `npm test`.
- Items marked ⬜ are verified by code inspection; live automated interaction
  testing (clicks/keypresses) is not yet set up — see the completion report.
