# Andy's Cap Tracker

A mobile-first PWA for tracking prospective cadets through a squadron
recruiting pipeline (first contact → welcome email → meetings → 3rd night
email → joined). Sender identity and squadron-specific details are entered
in-app (Settings) rather than hardcoded, so the source stays
organization-agnostic.

This tool is built around a rolling, one-cadet-at-a-time pipeline — each
prospective cadet moves through the stages independently on their own
timeline. It fits a squadron that recruits continuously and individually
well; it isn't designed for cohort-based recruiting, where a whole intake
class moves through steps together on a shared schedule.

## Active List Sorting

The Active list (`sortActiveCadets` in `src/utils/pipeline.js`) sorts cadets
by priority tier first, then by most recent activity within a tier:

1. Ready to join (3rd meeting done)
2. Had 2+ meetings, 3rd Night Email not sent yet
3. First contact made, Welcome Email not sent yet
4. Had Meeting 1, but not yet in a higher tier
5. First contact made, no meetings or emails yet
6. No first contact yet

Within the same tier, the cadet touched most recently (by
`lastTouched`/meeting/email dates) is shown first, so whichever cadet needs
the most urgent next action floats to the top. Archived cadets are listed
separately, sorted by archive date (most recent first).

## Tech Stack & Style

- **Plain JavaScript + JSX** — no TypeScript. ES modules, built with
  [Vite](https://vitejs.dev/). React 18 is the only real runtime dependency;
  [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) adds offline support
  and installability.
- **Functional components + hooks only** — no classes, no Redux/context
  libraries. State lives mostly in `App.jsx` and is passed down as props to
  small, single-purpose components.
- **Inline styles everywhere** — every component uses `style={{...}}` object
  literals directly. No CSS framework and no CSS Modules; `src/index.css`
  only holds global resets and iOS safe-area variables, and
  `src/styles/colors.js` is the one shared design-token file.
- **No component library** — buttons, modals, and inputs are hand-rolled
  (see `ConfirmModal.jsx`, or the `Input`/`TextArea` helpers inside
  `SettingsView.jsx`).
- **Small, flat `utils/` modules** — pure functions grouped by concern
  (`pipeline.js` for cadet-status logic, `storage.js` for persistence/sync,
  `email.js` for AI prompt building).
- **No test suite, no linter/formatter config, no TypeScript** —
  consistency comes from following the existing patterns, not tooling.

Overall it's intentionally lightweight and dependency-minimal — closer to a
single developer's focused tool than a scaffolded enterprise React app.

## CI/CD

Pushes to `main` are automatically checked and deployed via GitHub Actions:

- **CI** (`.github/workflows/ci.yml`) — runs on every push/PR to `main`.
  Verifies `npm run build` succeeds, and enforces that `package.json`'s
  `version` is bumped whenever `src/` changes (see Versioning below).
- **Deploy** (`.github/workflows/deploy.yml`) — runs on push to `main`.
  Builds the app and publishes `dist/` to GitHub Pages via the official
  `actions/deploy-pages` flow. No manual step required.
- **CodeQL** and **Security** (`codeql.yml`, `security.yml`) — static
  analysis, secret scanning, and dependency auditing on every push/PR.

`npm run deploy` (build + `gh-pages -d dist`) still works as a manual
fallback if needed, but isn't part of the normal workflow anymore.

## Versioning

Bump the `version` field in `package.json` with every commit that changes
app behavior — Settings reads it directly and displays it, so it's the one
source of truth. CI enforces this: a PR (or push to `main`) that changes
`src/` without bumping the version fails the `version-check` job. Patch-bump
for fixes/small tweaks, minor-bump for new features. Docs-only or
config-only changes are exempt.

## Google Sheets Sync

The app can read/write cadet records from a Google Sheet instead of (well, in
addition to — it always falls back to local storage) on-device storage only.
This requires deploying a small Google Apps Script as a Web App to act as the
backend; the script is at [scripts/google-sheets-sync.gs](scripts/google-sheets-sync.gs).

1. Create a Google Sheet (any name — a "Cadets" tab is created automatically).
2. In the Sheet, go to **Extensions → Apps Script**.
3. Delete the placeholder code and paste in the contents of
   [scripts/google-sheets-sync.gs](scripts/google-sheets-sync.gs).
4. Select the `setup` function from the dropdown and click **Run**. Approve
   the permissions prompt on first run.
5. Check **View → Logs** for a line like `API token: xxxxxxxx-...` and copy it.
6. **Deploy → New deployment**, type **Web app**, with:
   - Execute as: **Me**
   - Who has access: **Anyone**

   Deploy, then copy the Web app URL.
7. In the app: **Settings → ☁️ Google Sheets Sync**, paste in the Web app URL
   and the token, then tap **🔌 Test Connection**.

The same steps are available in-app under Settings → Google Sheets Sync →
"How do I set this up?", including a button to copy the script straight to
your clipboard so you don't need to leave the app to grab it.

The URL and token are generated per-deployment and are never stored in this
repo — each person who follows these steps gets their own private pair.
