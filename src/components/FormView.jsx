import { useState } from 'react';
import { COLORS } from '../styles/colors.js';
import { PIPELINE_STEPS } from '../utils/pipeline.js';
import { makeId } from '../utils/storage.js';
import { buildExtractCadetPrompt, generateEmail, parseExtractedCadet } from '../utils/email.js';
import ConfirmModal from './ConfirmModal.jsx';

// Defined outside FormView so React never remounts it on FormView re-render —
// remounting an input component on every keystroke drops focus mid-type.
function FormField({ label, value, onChange, type = 'text', placeholder, textarea, rows }) {
  const sharedStyle = {
    width: '100%',
    boxSizing: 'border-box',
    fontSize: 16,
    padding: '12px 14px',
    borderRadius: 10,
    border: `1px solid ${COLORS.border}`,
    fontFamily: 'inherit',
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6 }}>
        {label}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows || 3}
          style={sharedStyle}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={sharedStyle}
        />
      )}
    </div>
  );
}

function blankCadet() {
  const t = new Date().toISOString().slice(0, 10);
  return {
    id: makeId(),
    firstName: '',
    lastName: '',
    age: '',
    grade: '',
    firstContactDate: t,
    welcomeEmailSent: '',
    meeting1Date: '',
    meeting2Date: '',
    thirdNightEmailSent: '',
    meeting3Date: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    cadetPhone: false,
    cadetEmail: false,
    notes: '',
    status: 'Active',
    archivedDate: '',
    lastTouched: t,
  };
}

export default function FormView({ cadet, settings, onSave, onCancel, onDelete }) {
  const [draft, setDraft] = useState(() => (cadet ? { ...cadet } : blankCadet()));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteLoading, setPasteLoading] = useState(false);
  const [pasteError, setPasteError] = useState('');

  function set(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    onSave(draft);
  }

  async function handleExtractFromEmail() {
    if (!pasteText.trim()) return;
    setPasteLoading(true);
    setPasteError('');
    try {
      const raw = await generateEmail(buildExtractCadetPrompt(pasteText), settings);
      const extracted = parseExtractedCadet(raw);
      setDraft((prev) => {
        const next = { ...prev };
        for (const [key, value] of Object.entries(extracted)) {
          if (key === 'notes') {
            const entry = `[from pasted email] ${value}`;
            next.notes = next.notes ? `${next.notes}\n${entry}` : entry;
          } else if (!next[key]) {
            next[key] = value;
          }
        }
        return next;
      });
      setPasteOpen(false);
      setPasteText('');
    } catch (err) {
      setPasteError(err.message);
    } finally {
      setPasteLoading(false);
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
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 15, fontWeight: 600 }}>
          Cancel
        </button>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{cadet ? 'Edit Prospect' : 'Add Prospect'}</div>
        <button onClick={handleSave} style={{ background: 'none', border: 'none', color: COLORS.capGold, fontSize: 15, fontWeight: 700 }}>
          Save
        </button>
      </div>

      <div style={{ padding: 16 }}>
        <Section title="Quick Fill">
          {!pasteOpen ? (
            <button
              onClick={() => setPasteOpen(true)}
              style={{
                width: '100%',
                padding: '12px 0',
                borderRadius: 10,
                border: `1px solid ${COLORS.border}`,
                background: '#fff',
                color: COLORS.text,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              📋 Paste Email to Auto-Fill
            </button>
          ) : (
            <>
              <textarea
                autoFocus
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste the parent's email here..."
                rows={6}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  fontSize: 14,
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: `1px solid ${COLORS.border}`,
                  fontFamily: 'inherit',
                }}
              />
              {pasteError && (
                <div style={{ color: COLORS.danger, fontSize: 13, marginTop: 8 }}>{pasteError}</div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button
                  onClick={handleExtractFromEmail}
                  disabled={pasteLoading || !pasteText.trim()}
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    borderRadius: 10,
                    border: 'none',
                    background: COLORS.capBlue,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                    opacity: pasteLoading || !pasteText.trim() ? 0.6 : 1,
                  }}
                >
                  {pasteLoading ? 'Extracting…' : '✨ Extract Info'}
                </button>
                <button
                  onClick={() => {
                    setPasteOpen(false);
                    setPasteText('');
                    setPasteError('');
                  }}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: `1px solid ${COLORS.border}`,
                    background: '#fff',
                    color: COLORS.text,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </Section>

        <Section title="Cadet Info">
          <FormField label="First Name" value={draft.firstName} onChange={(v) => set('firstName', v)} />
          <FormField label="Last Name" value={draft.lastName} onChange={(v) => set('lastName', v)} />
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <FormField label="Age" value={draft.age} onChange={(v) => set('age', v)} type="number" />
            </div>
            <div style={{ flex: 1 }}>
              <FormField label="Grade" value={draft.grade} onChange={(v) => set('grade', v)} />
            </div>
          </div>
        </Section>

        <Section title="Parent / Guardian">
          <FormField label="Parent/Guardian Name" value={draft.parentName} onChange={(v) => set('parentName', v)} />
          <FormField
            label="Phone"
            value={draft.parentPhone}
            onChange={(v) => set('parentPhone', v)}
            type="tel"
          />
          <Checkbox
            label="This is the cadet's phone number (not parent's)"
            checked={draft.cadetPhone}
            onChange={(v) => set('cadetPhone', v)}
          />
          <FormField
            label="Email"
            value={draft.parentEmail}
            onChange={(v) => set('parentEmail', v)}
            type="email"
          />
          <Checkbox
            label="This is the cadet's email address (not parent's)"
            checked={draft.cadetEmail}
            onChange={(v) => set('cadetEmail', v)}
          />
        </Section>

        <Section title="Pipeline Dates">
          {PIPELINE_STEPS.map((step) => (
            <FormField
              key={step.key}
              label={step.label}
              value={draft[step.key]}
              onChange={(v) => set(step.key, v)}
              type="date"
            />
          ))}
        </Section>

        <Section title="Status">
          <div style={{ display: 'flex', gap: 10 }}>
            {['Active', 'Withdrew', 'Joined'].map((s) => (
              <button
                key={s}
                onClick={() => set('status', s)}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: 10,
                  border: draft.status === s ? 'none' : `1px solid ${COLORS.border}`,
                  background: draft.status === s ? COLORS.capBlue : '#fff',
                  color: draft.status === s ? '#fff' : COLORS.text,
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Notes">
          <FormField label="Notes" value={draft.notes} onChange={(v) => set('notes', v)} textarea rows={5} />
        </Section>

        {cadet && onDelete && (
          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 12,
              border: 'none',
              background: COLORS.danger,
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              marginTop: 8,
            }}
          >
            Delete Prospect
          </button>
        )}
      </div>

      <ConfirmModal
        open={confirmDelete}
        title="Delete this prospect?"
        subtitle="This permanently removes the record. This cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete(draft.id);
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {title}
      </div>
      <div style={{ background: COLORS.card, borderRadius: 14, padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {children}
      </div>
    </div>
  );
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: COLORS.textMuted, marginBottom: 14, marginTop: -6 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 18, height: 18 }} />
      {label}
    </label>
  );
}
