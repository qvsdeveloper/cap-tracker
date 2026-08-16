import { useEffect, useRef, useState } from 'react';
import { COLORS } from './styles/colors.js';
import Header from './components/Header.jsx';
import TabBar from './components/TabBar.jsx';
import ListView from './components/ListView.jsx';
import DetailView from './components/DetailView.jsx';
import FormView from './components/FormView.jsx';
import SettingsView from './components/SettingsView.jsx';
import {
  loadSettings,
  saveSettings as persistSettings,
  loadCadets,
  saveCadetsLocal,
  saveCadetsToSheets,
  fetchFromSheets,
} from './utils/storage.js';

export default function App() {
  const [settings, setSettings] = useState(loadSettings());
  const [cadets, setCadets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [tab, setTab] = useState('active');
  const [selectedId, setSelectedId] = useState(null);
  const [syncStatus, setSyncStatus] = useState({ icon: '💾', label: 'Local only', syncing: false });

  const hasLoaded = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { cadets: loaded, source } = await loadCadets(settings);
      if (cancelled) return;
      setCadets(loaded);
      setLoading(false);
      hasLoaded.current = true;
      setSyncStatus(
        source === 'sheets' || source === 'local-to-sheets'
          ? { icon: '☁️', label: 'Synced with Google Sheets', syncing: false }
          : { icon: '💾', label: 'Local only', syncing: false }
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
    if (settings.sheetsUrl) {
      setSyncStatus({ icon: '☁️', label: 'Syncing…', syncing: true });
      saveCadetsToSheets(cadets, settings).then((result) => {
        setSyncStatus(
          result.ok
            ? { icon: '☁️', label: 'Synced with Google Sheets', syncing: false }
            : { icon: '⚠️', label: `Sync failed: ${result.error}`, syncing: false }
        );
      });
    }
  }, [cadets]);

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
          setSyncStatus({ icon: '☁️', label: 'Synced with Google Sheets', syncing: false });
        } else {
          // Sheet reachable but empty: push what we have up to it.
          const result = await saveCadetsToSheets(cadets, newSettings);
          setSyncStatus(
            result.ok
              ? { icon: '☁️', label: 'Synced with Google Sheets', syncing: false }
              : { icon: '⚠️', label: `Sync failed: ${result.error}`, syncing: false }
          );
        }
      } catch (err) {
        setSyncStatus({ icon: '⚠️', label: `Sync failed: ${err.message}`, syncing: false });
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
            <Header activeCount={activeCount} syncStatus={syncStatus} onOpenSettings={() => setView('settings')} />
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
    </div>
  );
}
