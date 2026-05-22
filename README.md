# Dutch B2 — Localhost Learning System

A calm, local-first app for learning Dutch up to **CEFR level B2**. It runs entirely
on your own computer — **no cloud, no accounts, no sign-up, no tracking**.

The Dutch curriculum ships inside this repo (`curriculum/`), and the app turns it
into a friendly daily study companion: a guided lesson plan, spaced-repetition
vocabulary review, module browser, progress overview, and a daily learning journal.

---

## What this is

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite (`better-sqlite3`) — your study progress |
| Content | Obsidian Markdown vault — the Dutch curriculum |
| Spaced repetition | FSRS algorithm (`ts-fsrs`) |

There are **seven screens**: Home, Today, Learn, Review, Progress, Library, Settings.

## Who it is for

- **Juanpa** — the learner this was built for.
- **His brother** — a second learner who clones the repo and runs it on his own machine.
- **Any Spanish-speaking learner with good English** who wants a free, private, offline
  way to study Dutch. The five steps under *Install* and *Run* below are all you need.

## Why local-first

- **Your data is yours.** All study progress lives in a single SQLite file on your
  computer. Nothing is uploaded anywhere.
- **It works offline.** No internet connection is needed to study.
- **No accounts, no cost.** Clone it, run it, learn.
- **Your curriculum is plain Markdown** you can read and edit in Obsidian — the app
  never locks your content away.

---

## Requirements

- **Node.js 22 LTS** (recommended). Node 20+ works; Node 24 is also tested.
- **npm** (comes with Node).
- About 300 MB of disk space for dependencies.

No database server, no Python, no Docker — just Node. **The Dutch curriculum
ships inside this repository** (the `curriculum/` folder), so there is nothing
else to download — clone and run.

## Install

```bash
# 1. Clone the repository
git clone https://github.com/Jpperez09/Holandes-B2.git
cd Holandes-B2

# 2. Use Node 22 (if you use nvm)
nvm install 22 && nvm use 22      # .nvmrc pins version 22

# 3. Install all dependencies (root + backend + frontend)
npm run install:all
```

`better-sqlite3` ships prebuilt binaries for Windows, macOS (Intel & Apple Silicon),
and Linux, so there is **no native compile step**.

## Run

```bash
npm run dev
```

This starts both servers together:

- **App** → http://localhost:5173  ← open this in your browser
- API → http://localhost:8787

To stop the app, press **Ctrl+C** in the terminal.

| Command | What it does |
|---|---|
| `npm run dev` | Start the whole app (frontend + backend) |
| `npm run dev:backend` | Start only the backend |
| `npm run dev:frontend` | Start only the frontend |
| `npm run build` | Production build of both |
| `npm test` | Run the backend test suite |

## The curriculum (no setup needed)

The Dutch curriculum lives in the **`curriculum/`** folder of this repo and the
app reads it automatically — `git clone` then `npm run dev` and you are learning.
There is no vault path to configure.

**Want to use your own curriculum instead?** (e.g. a personal Obsidian vault)

- In the app: **Settings → "For technical users"** → set your folder → *Save*, or
- Copy `config.example.json` to `config.local.json` (git-ignored) and set
  `vault_path` there — an absolute path, or one relative to the repo root.

Any curriculum folder just needs `03_Curriculum/`, `05_Exercises/` and
`06_Resources/` inside it.

## Start learning

1. Open http://localhost:5173.
2. The **Home** screen greets you and shows today's plan.
3. Click **▶ Start today's lesson**, or go to **Learn** and open **MOD-001**.
4. Work through the module activities and tick them off.
5. Open **Review** to study vocabulary flashcards (spaced repetition).
6. End the day on **Today** by writing a short daily log.

---

## How the curriculum folder works

The `curriculum/` folder is a small content vault. The app reads it and writes
only your daily logs back into it:

| Folder | App access |
|---|---|
| `curriculum/03_Curriculum/` | **Read only** — modules and levels |
| `curriculum/05_Exercises/` | **Read only** — vocabulary & grammar seed data |
| `curriculum/06_Resources/` | **Read only** — supporting resources |
| `curriculum/04_Daily_Logs/` | **Write** — your daily logs (created at runtime, git-ignored) |

- The curriculum is plain Markdown — open `curriculum/` in [Obsidian](https://obsidian.md)
  or any editor to read or extend it.
- The app **never edits the curriculum**. It only ever *writes* daily-log files
  into `04_Daily_Logs/`, which is git-ignored so your journal stays private.
- If you edit a module file, click **Settings → Re-scan vault for content** to
  pick up the change.

## Your data — what stays local

| File | Contents | Committed to Git? |
|---|---|---|
| `progress.sqlite` | All your study progress: reviews, attempts, daily logs, streaks | **No — git-ignored** |
| `config.local.json` | Your machine-specific overrides (optional) | **No — git-ignored** |
| `curriculum/04_Daily_Logs/*.md` | Your written daily journal | **No — git-ignored** |
| `curriculum/03_Curriculum`, `05_Exercises`, `06_Resources` | The Dutch lessons | **Yes — shipped with the repo** |

Everything personal stays on your machine. To start completely fresh, stop the app
and delete `progress.sqlite` — it is recreated empty on the next start.

## What Git ignores

`.gitignore` keeps private and generated files out of the repository:

- `node_modules/` — dependencies
- `progress.sqlite*` — your personal study database
- `config.local.json` — your machine-specific config
- `curriculum/04_Daily_Logs/` — your private daily journals
- `dist/`, `build/` — compiled output
- `.env*`, `logs/`, `*.log` — environment files and logs

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Can't reach the app" message | The backend isn't running — make sure `npm run dev` is still going in the terminal. |
| "Your Dutch content is not connected" | Set your vault path in **Settings**. |
| Port 5173 or 8787 already in use | Another copy of the app is running, or change the ports in `config.local.json`. Don't run two copies at once. |
| `better-sqlite3` blocked by antivirus | Add an exception for the `better-sqlite3` file under `node_modules`. |
| Vault edits don't show up | Click **Settings → Re-scan vault for content**. |
| Wrong Node version | `nvm install 22 && nvm use 22`, then re-run `npm run install:all`. |
| Vocabulary audio is silent or sounds non-Dutch | The app uses your browser/OS voices; install a Dutch (`nl-NL`) voice in your system settings for best results. The app still works without it. |

---

## Current MVP limitations

This is a working MVP. Known limitations, none of which block daily learning:

- **Today's plan is built in the browser.** The backend `/api/today` endpoint is still
  a stub, so the Today screen assembles your checklist from modules + due cards itself.
- **Activity checkmarks are remembered per-browser.** The progress *bar* is always
  accurate (server-calculated); the individual ticks are stored in the browser.
- **Vocabulary review shows up to 50 cards per session.**
- **Audio uses your browser's built-in speech voices** — quality depends on your
  operating system.
- **No automated frontend tests yet** (the backend has 45 passing tests).
- Speaking / real-world activities are shown with a generic icon.

## Documentation

Project documentation — the build & QA reports, the non-technical onboarding
guide, the test checklist and the feature roadmap — lives in the Obsidian
curriculum vault under `08_App_Architecture/` (alongside the architecture specs),
not in this code repository. The README above is self-contained for installing
and running the app.

## Open source

This project is released under the **MIT License** — see [`LICENSE`](LICENSE).
It is a personal learning tool shared openly. There are no servers, no analytics,
and no accounts: when you run it, everything happens on your computer. You are
welcome to clone it, study from it, and adapt it for your own language learning.
