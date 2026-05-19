# Dutch B2 Localhost Learning System

Juanpa's personal Dutch learning app. Runs entirely on your machine — no cloud, no accounts.

## Quick Start (5 steps)

```bash
# 1. Clone
git clone https://github.com/Jpperez09/Holandes-B2.git
cd Holandes-B2

# 2. Copy config
cp config.example.json config.local.json
# Edit config.local.json — set vault_path to your Obsidian vault, and user_name

# 3. Install Node (LTS recommended)
nvm use   # or: nvm install 22 && nvm use 22

# 4. Install dependencies
npm run install:all

# 5. Start
npm run dev
# → http://localhost:5173
```

### Node version

| Version | Status | Notes |
|---|---|---|
| **Node 22 LTS** (`.nvmrc` default) | **Recommended** | Active LTS through April 2027; current target for new contributors. |
| Node 20 LTS | Supported | Listed in `package.json` `engines` (`>=20.0.0`). |
| Node 24 (current) | Tested | Original development environment for this app. |

`better-sqlite3@12` ships prebuilt binaries for Windows / macOS-arm64 / macOS-x64 / Linux on Node 20, 22, and 24, so no native compile step is required on any of them.

If you switch Node versions, re-run `npm install --prefix backend` so the right prebuild is selected.

## Configuration

Edit `config.local.json` (gitignored, copied from `config.example.json`):

- **vault_path**: Absolute path to your Obsidian vault folder (e.g. `D:\Obsidian\Juanpa-Holandes-B2`).
- **user_name**: Your name (shown in the UI).
- **daily_goal_minutes**: Study goal in minutes (default 60).
- **ports.backend**: API server port (default 8787).
- **ports.frontend**: Vite dev server port (default 5173).

## URLs

| What | URL |
|---|---|
| App | http://localhost:5173 |
| API health | http://localhost:8787/api/health |
| DB health | http://localhost:8787/api/health/db |
| Settings | http://localhost:8787/api/settings |

## Useful commands

```bash
npm run dev              # start everything (frontend + backend)
npm run dev:backend      # backend only
npm run dev:frontend     # frontend only
npm run validate-vault   # check vault Markdown files for schema errors
npm run export           # export progress.sqlite → progress.json
npm run import           # import progress.json → progress.sqlite
npm run reset            # delete progress.sqlite (backup kept)
```

## Progress data

- **progress.sqlite** — your study history (gitignored; do not commit).
- **progress.backup.sqlite** — rolling single-file backup after every daily log.
- Run `npm run export` to get a `progress.json` you can commit or share.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Port 5173 or 8787 already in use | Change ports in `config.local.json` |
| `better-sqlite3` quarantined by antivirus | Add exception for `node_modules/.../better-sqlite3.node` |
| Watcher misses vault changes | Click "Re-index vault" in Settings |
| Wrong Node version | `nvm install 22 && nvm use 22` (or 20, 24) |
