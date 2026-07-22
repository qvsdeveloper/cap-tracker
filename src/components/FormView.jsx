import { useState } from 'react';
import { COLORS } from '../styles/colors.js';
import { PIPELINE_STEPS } from '../utils/pipeline.js';
import { makeId } from '../utils/storage.js';
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

export default function FormView({ cadet, onSave, onCancel, onDelete }) {
  const [draft, setDraft] = useState(() => (cadet ? { ...cadet } : blankCadet()));
  const [confirmDelete, setConfirmDelete] = useState(false);

  function set(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    onSave(draft);
  }

  return (
    <div style={{ paddingBottom: 60 }}>
      <div
        style={{
          background: COLORS.capBlue,
          color: '#fff',
          padding: '16px 16px 14px',
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
