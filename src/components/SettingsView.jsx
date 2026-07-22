import { useState } from 'react';
import { COLORS } from '../styles/colors.js';
import { fetchFromSheets, exportDataToClipboard, parseImportPayload } from '../utils/storage.js';
import ConfirmModal from './ConfirmModal.jsx';

export default function SettingsView({ settings, cadets, onSave, onClose, onImport }) {
  const [draft, setDraft] = useState({ ...settings });
  const [testStatus, setTestStatus] = useState(null);
  const [exportStatus, setExportStatus] = useState(null);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState(null);
  const [confirmImport, setConfirmImport] = useState(false);

  function set(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    onSave(draft);
    onClose();
  }

  async function handleTestConnection() {
    setTestStatus({ loading: true });
    try {
      const data = await fetchFromSheets(draft.sheetsUrl, draft.sheetsToken);
      setTestStatus({ ok: true, message: `Connected. Found ${data.length} record${data.length === 1 ? '' : 's'}.` });
    } catch (err) {
      setTestStatus({ ok: false, message: err.message });
    }
  }

  async function handleExport() {
    try {
      await exportDataToClipboard(cadets, draft);
      setExportStatus('Copied to clipboard!');
    } catch (err) {
      setExportStatus(`Copy failed: ${err.message}`);
    }
  }

  function handleImport() {
    try {
      const { cadets: importedCadets, settings: importedSettings } = parseImportPayload(importText);
      setImportError(null);
      onImport(importedCadets, importedSettings);
      setConfirmImport(false);
      setImportText('');
    } catch (err) {
      setImportError(err.message);
      setConfirmImport(false);
    }
  }

  return (
    <div style={{ paddingBottom: 60 }}>
      <div
        style={{
          background: COLORS.capBlue,
          color: '#fff',
          padding: 'calc(16px + var(--safe-area-top)) 16px 14px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 15, fontWeight: 600 }}>
          Close
        </button>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Settings</div>
        <button onClick={handleSave} style={{ background: 'none', border: 'none', color: COLORS.capGold, fontSize: 15, fontWeight: 700 }}>
          Save
        </button>
      </div>

      <div style={{ padding: 16 }}>
        <Section title="📅 Squadron Schedule">
          <TextArea
            value={draft.squadronSchedule}
            onChange={(v) => set('squadronSchedule', v)}
            placeholder="Upcoming meeting schedule, injected into AI-generated emails as context"
            rows={4}
          />
        </Section>

        <Section title="✉️ Welcome Email">
          <Input label="CC addresses" value={draft.welcomeCc} onChange={(v) => set('welcomeCc', v)} />
          <TextArea
            label="Extra instructions for AI"
            value={draft.welcomeExtra}
            onChange={(v) => set('welcomeExtra', v)}
            rows={3}
          />
        </Section>

        <Section title="📨 3rd Night Email">
          <Input label="CC addresses" value={draft.thirdNightCc} onChange={(v) => set('thirdNightCc', v)} />
          <TextArea
            label="Extra instructions for AI"
            value={draft.thirdNightExtra}
            onChange={(v) => set('thirdNightExtra', v)}
            rows={3}
          />
        </Section>

        <Section title="🤖 Anthropic API Key">
          <Input
            label="API Key (used to generate emails, stored on this device only)"
            value={draft.anthropicApiKey}
            onChange={(v) => set('anthropicApiKey', v)}
            type="password"
            mono
          />
        </Section>

        <Section title="☁️ Google Sheets Sync">
          <Input label="Apps Script Web App URL" value={draft.sheetsUrl} onChange={(v) => set('sheetsUrl', v)} mono />
          <Input label="API Token" value={draft.sheetsToken} onChange={(v) => set('sheetsToken', v)} mono />
          <button onClick={handleTestConnection} style={secondaryButtonStyle}>
            🔌 Test Connection
          </button>
          {testStatus && (
            <div
              style={{
                marginTop: 10,
                fontSize: 13,
                color: testStatus.loading ? COLORS.textMuted : testStatus.ok ? '#16a34a' : COLORS.danger,
              }}
            >
              {testStatus.loading ? 'Testing…' : testStatus.message}
            </div>
          )}
        </Section>

        <Section title="🛡️ Data Backup & Restore">
          <button onClick={handleExport} style={secondaryButtonStyle}>
            📤 Export All Data to Clipboard
          </button>
          {exportStatus && <div style={{ marginTop: 8, fontSize: 13, color: COLORS.textMuted }}>{exportStatus}</div>}

          <div style={{ marginTop: 16 }}>
            <TextArea
              label="Paste exported JSON here to restore"
              value={importText}
              onChange={setImportText}
              rows={4}
            />
            {importError && <div style={{ marginBottom: 8, fontSize: 13, color: COLORS.danger }}>{importError}</div>}
            <button
              onClick={() => setConfirmImport(true)}
              disabled={!importText.trim()}
              style={{ ...secondaryButtonStyle, opacity: importText.trim() ? 1 : 0.5 }}
            >
              📥 Import & Replace All Data
            </button>
          </div>
        </Section>
      </div>

      <ConfirmModal
        open={confirmImport}
        title="Replace all data?"
        subtitle="This overwrites every cadet record currently in the app with the pasted data. This cannot be undone."
        confirmLabel="Replace All Data"
        tone="danger"
        onConfirm={handleImport}
        onCancel={() => setConfirmImport(false)}
      />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>{title}</div>
      <div style={{ background: COLORS.card, borderRadius: 14, padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', mono }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6 }}>
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          fontSize: 16,
          padding: '12px 14px',
          borderRadius: 10,
          border: `1px solid ${COLORS.border}`,
          fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'inherit',
        }}
      />
    </div>
  );
}

function TextArea({ label, value, onChange, rows = 3, placeholder }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6 }}>
          {label}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          fontSize: 16,
          padding: '12px 14px',
          borderRadius: 10,
          border: `1px solid ${COLORS.border}`,
          fontFamily: 'inherit',
        }}
      />
    </div>
  );
}

const secondaryButtonStyle = {
  width: '100%',
  padding: '14px 0',
  borderRadius: 12,
  border: `1px solid ${COLORS.border}`,
  background: '#fff',
  color: COLORS.capBlue,
  fontSize: 15,
  fontWeight: 700,
};
