import { useEffect, useRef, useState } from 'react';
import { COLORS } from './styles/colors.js';
import Header from './components/Header.jsx';
import TabBar from './components/TabBar.jsx';
import ListView from './components/ListView.jsx';
import DetailView from './components/DetailView.jsx';
import FormView from './components/FormView.jsx';
import SettingsView from './components/SettingsView.jsx';
import SyncDiffModal from './components/SyncDiffModal.jsx';
import {
  loadSettings,
  saveSettings as persistSettings,
  loadCadets,
  saveCadetsLocal,
  saveCadetsToSheets,
  fetchFromSheets,
} from './utils/storage.js';
import { diffCadetLists } from './utils/syncDiff.js';

export default function App() {
  const [settings, setSettings] = useState(loadSettings());
  const [cadets, setCadets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [tab, setTab] = useState('active');
  const [selectedId, setSelectedId] = useState(null);
  const [syncStatus, setSyncStatus] = useState({ icon: '💾', shortLabel: 'Saved', label: 'Local only', syncing: false });
  // { remote, diffs } — a pending set of remote changes the user needs to review
  // before they're either accepted (overwrite local) or dismissed (keep local).
  const [pendingSync, setPendingSync] = useState(null);

  const hasLoaded = useRef(false);
  // JSON snapshot of the cadet list as last known to match the Sheet.
  // Null means "no known baseline yet" (nothing pulled/pushed since load).
  const lastSyncedSnapshotRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { cadets: loaded, source } = await loadCadets(settings);
      if (cancelled) return;
      setCadets(loaded);
      setLoading(false);
      hasLoaded.current = true;
      // 'local-to-sheets' means the sheet was empty and this local data still
      // needs to be pushed up, so leave the baseline null to let that happen.
      if (source === 'sheets') {
        lastSyncedSnapshotRef.current = JSON.stringify(loaded);
      }
      setSyncStatus(
        source === 'sheets' || source === 'local-to-sheets'
          ? { icon: '☁️', shortLabel: 'Synced', label: 'Synced with Google Sheets', syncing: false }
          : { icon: '💾', shortLabel: 'Saved', label: 'Local only', syncing: false }
      );
    })();
    return () => {
      cancelled = true;
    };
    // Only run on mount: settings changes are saved explicitly via handleSaveSettings.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasLoaded.current) return;
    saveCadetsLocal(cadets);
    if (settings.sheetsUrl && JSON.stringify(cadets) !== lastSyncedSnapshotRef.current) {
      syncCadetsToSheets(cadets);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cadets]);

  // Checks the Sheet hasn't changed since our last known-good snapshot before
  // overwriting it, so a stale device (e.g. one that's been open a while on
  // another phone) can't silently clobber changes made elsewhere.
  async function syncCadetsToSheets(currentCadets) {
    setSyncStatus({ icon: '☁️', shortLabel: 'Syncing…', label: 'Syncing…', syncing: true });
    try {
      const remote = await fetchFromSheets(settings.sheetsUrl, settings.sheetsToken);
      const remoteJson = JSON.stringify(remote);
      const baseline = lastSyncedSnapshotRef.current;
      if (baseline !== null && remoteJson !== baseline) {
        setPendingSync({ remote, diffs: diffCadetLists(currentCadets, remote) });
        setSyncStatus({ icon: '⚠️', shortLabel: 'Review', label: 'Sync paused — conflict detected', syncing: false });
        return;
      }
      const result = await saveCadetsToSheets(currentCadets, settings);
      if (result.ok) {
        lastSyncedSnapshotRef.current = JSON.stringify(currentCadets);
        setSyncStatus({ icon: '☁️', shortLabel: 'Synced', label: 'Synced with Google Sheets', syncing: false });
      } else {
        setSyncStatus({ icon: '⚠️', shortLabel: 'Failed', label: `Sync failed: ${result.error}`, syncing: false });
      }
    } catch (err) {
      setSyncStatus({ icon: '⚠️', shortLabel: 'Failed', label: `Sync failed: ${err.message}`, syncing: false });
    }
  }

  // Manual "Sync Now": pushes any unpushed local changes and checks for
  // remote changes, in one action — unlike the autosave path above, this
  // also retries a push that previously failed or was left paused by an
  // unresolved conflict.
  async function handleSyncNow() {
    if (!settings.sheetsUrl) {
      setView('settings');
      return;
    }
    setSyncStatus({ icon: '☁️', shortLabel: 'Syncing…', label: 'Syncing…', syncing: true });
    try {
      const remote = await fetchFromSheets(settings.sheetsUrl, settings.sheetsToken);
      const remoteJson = JSON.stringify(remote);
      const baseline = lastSyncedSnapshotRef.current;
      const localDirty = JSON.stringify(cadets) !== baseline;
      const remoteDirty = baseline !== null && remoteJson !== baseline;

      if (remoteDirty) {
        // Remote changed since our baseline — always show the diff for
        // review rather than silently picking a side.
        setPendingSync({ remote, diffs: diffCadetLists(cadets, remote) });
        setSyncStatus({ icon: '⚠️', shortLabel: 'Review', label: 'Changes to review', syncing: false });
        return;
      }

      if (localDirty || baseline === null) {
        // Remote matches our baseline (or we have none yet) and local has
        // unpushed changes — safe to push straight up.
        const result = await saveCadetsToSheets(cadets, settings);
        if (result.ok) {
          lastSyncedSnapshotRef.current = JSON.stringify(cadets);
          setSyncStatus({ icon: '☁️', shortLabel: 'Synced', label: 'Synced with Google Sheets', syncing: false });
        } else {
          setSyncStatus({ icon: '⚠️', shortLabel: 'Failed', label: `Sync failed: ${result.error}`, syncing: false });
        }
        return;
      }

      setSyncStatus({ icon: '☁️', shortLabel: 'Synced', label: 'Synced with Google Sheets', syncing: false });
    } catch (err) {
      setSyncStatus({ icon: '⚠️', shortLabel: 'Failed', label: `Sync failed: ${err.message}`, syncing: false });
    }
  }

  async function handleAcceptRemoteChanges() {
    const remote = pendingSync.remote;
    setPendingSync(null);
    setCadets(remote);
    lastSyncedSnapshotRef.current = JSON.stringify(remote);
    setSyncStatus({ icon: '☁️', shortLabel: 'Synced', label: 'Synced with Google Sheets', syncing: false });
  }

  async function handleKeepLocalChanges() {
    const toSave = cadets;
    setPendingSync(null);
    setSyncStatus({ icon: '☁️', shortLabel: 'Syncing…', label: 'Syncing…', syncing: true });
    const result = await saveCadetsToSheets(toSave, settings);
    if (result.ok) {
      lastSyncedSnapshotRef.current = JSON.stringify(toSave);
      setSyncStatus({ icon: '☁️', shortLabel: 'Synced', label: 'Synced with Google Sheets', syncing: false });
    } else {
      setSyncStatus({ icon: '⚠️', shortLabel: 'Failed', label: `Sync failed: ${result.error}`, syncing: false });
    }
  }

  function upsertCadet(cadet) {
    setCadets((prev) => {
      const idx = prev.findIndex((c) => c.id === cadet.id);
      if (idx === -1) return [...prev, cadet];
      const next = [...prev];
      next[idx] = cadet;
      return next;
    });
  }

  function handleSelectCadet(id) {
    setSelectedId(id);
    setView('detail');
  }

  function handleAddNew() {
    setSelectedId(null);
    setView('form');
  }

  function handleEditCadet() {
    setView('form');
  }

  function handleSaveForm(cadet) {
    upsertCadet(cadet);
    setSelectedId(cadet.id);
    setView('detail');
  }

  function handleDeleteCadet(id) {
    setCadets((prev) => prev.filter((c) => c.id !== id));
    setSelectedId(null);
    setView('list');
  }

  function handleUpdateFromDetail(cadet) {
    upsertCadet(cadet);
  }

  async function handleSaveSettings(newSettings) {
    const urlChanged = newSettings.sheetsUrl && newSettings.sheetsUrl !== settings.sheetsUrl;
    setSettings(newSettings);
    persistSettings(newSettings);
    if (urlChanged) {
      try {
        const remote = await fetchFromSheets(newSettings.sheetsUrl, newSettings.sheetsToken);
        if (remote.length > 0) {
          setCadets(remote);
          lastSyncedSnapshotRef.current = JSON.stringify(remote);
          setSyncStatus({ icon: '☁️', shortLabel: 'Synced', label: 'Synced with Google Sheets', syncing: false });
        } else {
          // Sheet reachable but empty: push what we have up to it.
          const result = await saveCadetsToSheets(cadets, newSettings);
          if (result.ok) lastSyncedSnapshotRef.current = JSON.stringify(cadets);
          setSyncStatus(
            result.ok
              ? { icon: '☁️', shortLabel: 'Synced', label: 'Synced with Google Sheets', syncing: false }
              : { icon: '⚠️', shortLabel: 'Failed', label: `Sync failed: ${result.error}`, syncing: false }
          );
        }
      } catch (err) {
        setSyncStatus({ icon: '⚠️', shortLabel: 'Failed', label: `Sync failed: ${err.message}`, syncing: false });
      }
    }
  }

  function handleImportData(importedCadets, importedSettings) {
    setCadets(importedCadets);
    if (importedSettings) {
      const merged = { ...settings, ...importedSettings };
      setSettings(merged);
      persistSettings(merged);
    }
  }

  const selectedCadet = cadets.find((c) => c.id === selectedId) || null;
  const activeCount = cadets.filter((c) => c.status === 'Active').length;

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: COLORS.background,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: COLORS.textMuted,
        }}
      >
        Loading…
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.background, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {view === 'list' && (
        <>
          <div style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <Header
              activeCount={activeCount}
              syncStatus={syncStatus}
              onOpenSettings={() => setView('settings')}
              onSyncClick={handleSyncNow}
            />
            <TabBar tab={tab} onChange={setTab} />
          </div>
          <ListView
            cadets={cadets}
            tab={tab}
            onSelectCadet={handleSelectCadet}
            onAddNew={handleAddNew}
          />
        </>
      )}

      {view === 'detail' && selectedCadet && (
        <DetailView
          cadet={selectedCadet}
          settings={settings}
          onBack={() => setView('list')}
          onEdit={handleEditCadet}
          onUpdate={handleUpdateFromDetail}
        />
      )}

      {view === 'form' && (
        <FormView
          cadet={selectedCadet}
          settings={settings}
          onSave={handleSaveForm}
          onCancel={() => setView(selectedCadet ? 'detail' : 'list')}
          onDelete={selectedCadet ? handleDeleteCadet : null}
        />
      )}

      {view === 'settings' && (
        <SettingsView
          settings={settings}
          cadets={cadets}
          onSave={handleSaveSettings}
          onClose={() => setView('list')}
          onImport={handleImportData}
        />
      )}

      <SyncDiffModal
        open={!!pendingSync}
        diffs={pendingSync?.diffs || []}
        onAccept={handleAcceptRemoteChanges}
        onKeepLocal={handleKeepLocalChanges}
      />
    </div>
  );
}
