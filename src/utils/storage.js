import { makeSeedCadets } from '../data/seedCadets.js';

export const CADETS_KEY = 'cap-cadets-v2';
export const CADETS_BACKUP_KEY = 'cap-cadets-backup';
export const SETTINGS_KEY = 'cap-settings-v1';

export const DEFAULT_SETTINGS = {
  senderSignoff: '',
  welcomeCc: '',
  welcomeExtra: '',
  thirdNightCc: '',
  thirdNightExtra: '',
  squadronSchedule: '',
  sheetsUrl: '',
  sheetsToken: '',
  anthropicApiKey: '',
};

export function makeId() {
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Known data corrections applied on load. Each migration only touches a
// record if its status still matches what we expected when we wrote the
// migration, so it never clobbers a change the user made afterward.
const MIGRATIONS = [];

const DATE_FIELDS = [
  'firstContactDate',
  'welcomeEmailSent',
  'meeting1Date',
  'meeting2Date',
  'thirdNightEmailSent',
  'meeting3Date',
  'archivedDate',
  'lastTouched',
];

// Google Sheets can auto-convert a plain "YYYY-MM-DD" string into a real
// Date cell, which comes back as a full ISO timestamp. Truncate any
// oversized date field back to YYYY-MM-DD so <input type="date"> and the
// day-count math both keep working regardless of where the data came from.
function sanitizeCadetDates(cadet) {
  let changed = false;
  const next = { ...cadet };
  for (const field of DATE_FIELDS) {
    const value = next[field];
    if (typeof value === 'string' && value.length > 10) {
      next[field] = value.slice(0, 10);
      changed = true;
    }
  }
  return changed ? next : cadet;
}

export function applyMigrations(cadets) {
  let result = cadets.map(sanitizeCadetDates);
  for (const migration of MIGRATIONS) {
    result = result.map((cadet) => {
      const match = cadet.id === migration.id && cadet.status === migration.expectedStatus;
      return match ? { ...cadet, ...migration.update } : cadet;
    });
  }
  return result;
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to load settings', err);
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings', err);
  }
}

function loadLocalCadets() {
  try {
    const raw = localStorage.getItem(CADETS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load cadets from primary local storage', err);
  }
  try {
    const raw = localStorage.getItem(CADETS_BACKUP_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load cadets from backup local storage', err);
  }
  return null;
}

export async function fetchFromSheets(sheetsUrl, token) {
  const url = `${sheetsUrl}?token=${encodeURIComponent(token)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sheets GET failed: ${res.status}`);
  const data = await res.json();
  if (data && data.error) throw new Error(data.error);
  return Array.isArray(data) ? data : [];
}

export async function postToSheets(sheetsUrl, token, data) {
  const res = await fetch(sheetsUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify({ token, data }),
  });
  if (!res.ok) throw new Error(`Sheets POST failed: ${res.status}`);
  const result = await res.json();
  if (result && result.error) throw new Error(result.error);
  return result;
}

// Load priority: Google Sheets -> localStorage primary -> localStorage
// backup -> seed data. Returns { cadets, source }.
export async function loadCadets(settings) {
  if (settings.sheetsUrl) {
    try {
      const remote = await fetchFromSheets(settings.sheetsUrl, settings.sheetsToken);
      if (remote.length > 0) {
        return { cadets: applyMigrations(remote), source: 'sheets' };
      }
      // Sheet reachable but empty: fall through to local data so we can push it up.
      const local = loadLocalCadets();
      if (local) return { cadets: applyMigrations(local), source: 'local-to-sheets' };
    } catch (err) {
      console.error('Failed to load from Google Sheets, falling back to local storage', err);
    }
  }
  const local = loadLocalCadets();
  if (local) return { cadets: applyMigrations(local), source: 'local' };
  return { cadets: applyMigrations(makeSeedCadets()), source: 'seed' };
}

// Save order: local storage first (always succeeds fast), then Sheets async.
// A Sheets failure must never block or roll back the local save.
export function saveCadetsLocal(cadets) {
  const json = JSON.stringify(cadets);
  try {
    localStorage.setItem(CADETS_KEY, json);
    localStorage.setItem(CADETS_BACKUP_KEY, json);
  } catch (err) {
    console.error('Failed to save cadets locally', err);
  }
}

export async function saveCadetsToSheets(cadets, settings) {
  if (!settings.sheetsUrl) return { skipped: true };
  try {
    const result = await postToSheets(settings.sheetsUrl, settings.sheetsToken, cadets);
    return { ok: true, result };
  } catch (err) {
    console.error('Failed to sync cadets to Google Sheets', err);
    return { ok: false, error: err.message };
  }
}

export function exportDataToClipboard(cadets, settings) {
  const payload = JSON.stringify({ cadets, settings, exportedAt: new Date().toISOString() }, null, 2);
  return navigator.clipboard.writeText(payload);
}

export function parseImportPayload(text) {
  const parsed = JSON.parse(text);
  if (Array.isArray(parsed)) return { cadets: parsed, settings: null };
  if (parsed && Array.isArray(parsed.cadets)) return { cadets: parsed.cadets, settings: parsed.settings || null };
  throw new Error('Unrecognized data format');
}

export function downloadSettingsFile(settings) {
  const payload = JSON.stringify({ settings, exportedAt: new Date().toISOString() }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cap-tracker-settings-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseSettingsPayload(text) {
  const parsed = JSON.parse(text);
  const settings = parsed && parsed.settings ? parsed.settings : parsed;
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    throw new Error('Unrecognized settings format');
  }
  return settings;
}
