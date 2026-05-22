# Dutch B2 — Localhost Learning System

A calm, local-first app for learning Dutch up to **CEFR level B2**. It runs entirely
on your own computer — **no cloud, no accounts, no sign-up, no tracking**.

The app turns an [Obsidian](https://obsidian.md) vault of Dutch curriculum into a
friendly daily study companion: a guided lesson plan, spaced-repetition vocabulary
review, module browser, progress overview, and a daily learning journal.

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
  way to study Dutch. (See [`docs/BROTHER_ONBOARDING.md`](docs/BROTHER_ONBOARDING.md)
  for a friendly, non-technical setup guide.)

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
- An **Obsidian vault** with the Dutch curriculum (the `03_Curriculum/`,
  `05_Exercises/`, `06_Resources/` folders).
- About 300 MB of disk space for dependencies.

No database server, no Python, no Docker — just Node.

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

## Configure your vault path

The app needs to know where your Dutch curriculum vault lives. There are **two ways**:

**Option A — in the app (easiest).** Start the app, open **Settings → "For technical
users"**, paste your vault folder path, and click *Save vault folder*.

**Option B — config file.** Copy the template and edit it:

```bash
cp config.example.json config.local.json
```

Then set `vault_path` in `config.local.json` to your vault folder, e.g.
`D:\\Obsidian\\Juanpa-Holandes-B2`. `config.local.json` is git-ignored, so each
person's machine keeps its own path.

## Start learning

1. Open http://localhost:5173.
2. The **Home** screen greets you and shows today's plan.
3. Click **▶ Start today's lesson**, or go to **Learn** and open **MOD-001**.
4. Work through the module activities and tick them off.
5. Open **Review** to study vocabulary flashcards (spaced repetition).
6. End the day on **Today** by writing a short daily log.

---

## How the Obsidian vault works

The app and the vault have **clearly separated jobs**:

| Folder | App access |
|---|---|
| `03_Curriculum/` | **Read only** — modules and levels |
| `05_Exercises/` | **Read only** — vocabulary & grammar seed data |
| `06_Resources/` | **Read only** — supporting resources |
| `04_Daily_Logs/` | **Write** — the app saves your daily log here |
| everything else | Untouched |

- The vault is the **single source of truth for curriculum content**.
- The app **never edits your curriculum**. It only ever *writes* daily-log files,
  and only into `04_Daily_Logs/`.
- You can keep using Obsidian normally while the app runs. If you change a module
  file, click **Settings → Re-scan vault for content** to pick it up.

## Your data — what stays local

| File | Contents | Committed to Git? |
|---|---|---|
| `progress.sqlite` | All your study progress: reviews, attempts, daily logs, streaks | **No — git-ignored** |
| `config.local.json` | Your machine's vault path and name | **No — git-ignored** |
| `04_Daily_Logs/*.md` | Your written daily journal (inside your vault) | (lives in your vault, not this repo) |
| The curriculum vault | Dutch modules and exercises | (separate Obsidian repo) |

Everything personal stays on your machine. To start completely fresh, stop the app
and delete `progress.sqlite` — it is recreated empty on the next start.

## What Git ignores

`.gitignore` keeps private and generated files out of the repository:

- `node_modules/` — dependencies
- `progress.sqlite*` — your personal study database
- `config.local.json` — your machine-specific config
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
