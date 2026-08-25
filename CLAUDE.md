# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A mobile-first PWA for tracking prospective cadets through a squadron
recruiting pipeline (first contact → welcome email → meetings → 3rd night
email → joined). Sender identity and squadron-specific details are entered
in-app (Settings) rather than hardcoded, so the source stays
organization-agnostic.

## Commands

- `npm run dev` — start the Vite dev server (listens on the LAN via
  `server.host: true` in `vite.config.js` so a real phone on the same WiFi
  can load it directly; use the "Network:" URL Vite prints on startup).
- `npm run build` — production build to `dist/`.
- `npm run preview` — serve the built `dist/` locally.
- `npm run deploy` — build then publish `dist/` to GitHub Pages via `gh-pages`.

There is no test suite, linter, or formatter configured — consistency comes
from following existing patterns, not tooling.

## Versioning

Bump the `version` field in `package.json` with every commit that changes
app behavior (Settings reads it directly via
`import { version as appVersion } from '../../package.json'` and displays
it, so it's the one source of truth — no separate changelog to keep in
sync). Patch-bump (`1.1.0` → `1.1.1`) for fixes and small UX tweaks,
minor-bump (`1.1.0` → `1.2.0`) for new features. Skip the bump only for
changes with no user-visible effect (docs, comments, CI config).

## Style

- Plain JavaScript + JSX, no TypeScript.
- Functional components + hooks only — no classes, no Redux/context
  libraries. State lives mostly in `App.jsx` and is passed down as props.
- Inline styles everywhere (`style={{...}}` object literals). No CSS
  framework, no CSS Modules; `src/index.css` only holds global resets and
  iOS safe-area variables. `src/styles/colors.js` is the one shared
  design-token file.
- No component library — buttons, modals, and inputs are hand-rolled (see
  `ConfirmModal.jsx`, or the `Input`/`TextArea` helpers defined inside
  `SettingsView.jsx`).

## Architecture

**Single-page, view-switch app.** `App.jsx` holds all top-level state
(`cadets`, `settings`, `view`, `selectedId`, sync status) and renders exactly
one of five views based on a `view` string: `list`, `detail`, `form`,
`settings`. There's no router. Navigation is just `setView(...)` plus
`setSelectedId(...)`, handled by callback props passed down from `App.jsx`.

**Cadet data model.** A cadet is a plain object with a pipeline of dated
fields (`firstContactDate`, `welcomeEmailSent`, `meeting1Date`,
`meeting2Date`, `thirdNightEmailSent`, `meeting3Date`), plus `status`
(`'Active'` or archived), `archivedDate`, and `lastTouched`. Presence of a
date field means that step is done — there's no separate boolean/enum status
field. All pipeline logic (temperature/urgency, sort tier, next-action
badge, pipeline dots) derives from which date fields are set — see
`src/utils/pipeline.js`. `getSortTier` + `getLatestActivityDate` drive
`sortActiveCadets`, which orders the Active list by urgency then recency.

**Storage: three-tier fallback (`src/utils/storage.js`).**
Load priority is Google Sheets → localStorage primary
(`cap-cadets-v2`) → localStorage backup (`cap-cadets-backup`) → seed data
(`src/data/seedCadets.js`). Saves always go to localStorage first
(synchronous, can't fail silently in a way that loses data) and then,
if a Sheets URL is configured, async to the Sheet — a Sheets failure never
blocks or rolls back the local save. Dates coming back from Sheets can be
auto-converted to full ISO timestamps by Google; `sanitizeCadetDates`
truncates them back to `YYYY-MM-DD` on load.

**Sync conflict detection (`App.jsx`).** The app keeps
`lastSyncedSnapshotRef`, a JSON snapshot of the cadet list as last known to
match the Sheet. Before pushing a local change to Sheets, it re-fetches the
remote and compares it to that snapshot; if they differ, someone else wrote
to the Sheet since this device last synced, so the write is paused and the
user is prompted via `ConfirmModal` to keep local changes (overwrite) or
load remote changes (discard local).

**Google Sheets backend.** The Sheet is written to/read from through a
Google Apps Script deployed as a Web App (`scripts/google-sheets-sync.gs`),
called via plain `fetch` (GET with `?token=`, POST with a JSON body
containing `token` + `data`). Setup steps for deploying this script are
documented in the README and duplicated in-app under Settings → Google
Sheets Sync → "How do I set this up?".

**AI features (`src/utils/email.js`).** Two things call the Anthropic
Messages API directly from the browser (`anthropic-dangerous-direct-browser-access`
header, user-supplied API key from Settings, no backend proxy):
1. Generating welcome/3rd-night emails from a cadet + settings-built prompt
   (`buildWelcomeEmailPrompt` / `buildThirdNightEmailPrompt` →
   `generateEmail` → `parseGeneratedEmail`, which expects a
   `Subject: ...\n\n body` response format).
2. Quick Fill: extracting cadet fields from pasted email text
   (`buildExtractCadetPrompt` → `generateEmail` → `parseExtractedCadet`,
   which expects a raw JSON object back and only keeps whitelisted string
   fields, discarding anything invented that wasn't in the source email).

**PWA config (`vite.config.js`).** `vite-plugin-pwa` with
`registerType: 'autoUpdate'`; manifest name/theme colors and the
`base: '/cap-tracker/'` path are set for GitHub Pages hosting.
