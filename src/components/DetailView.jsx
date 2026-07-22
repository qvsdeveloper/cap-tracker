import { useState } from 'react';
import { COLORS } from '../styles/colors.js';
import {
  PIPELINE_STEPS,
  getPipelineDotStatus,
  getMeetingCount,
  getActionBadge,
} from '../utils/pipeline.js';
import { buildWelcomeEmailPrompt, buildThirdNightEmailPrompt, generateEmail, parseGeneratedEmail } from '../utils/email.js';
import ConfirmModal from './ConfirmModal.jsx';
import EmailModal from './EmailModal.jsx';

const STATUS_BADGE_COLOR = {
  Active: COLORS.capBlue,
  Joined: '#16a34a',
  Withdrew: '#94a3b8',
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function DetailView({ cadet, settings, onBack, onEdit, onUpdate }) {
  const [confirmAction, setConfirmAction] = useState(null);
  const [addingNote, setAddingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [email, setEmail] = useState(null); // { type, loading, error, subject, body, cc }

  const dots = getPipelineDotStatus(cadet);
  const meetingCount = getMeetingCount(cadet);
  const actionBadge = getActionBadge(cadet);

  function touch(partial) {
    onUpdate({ ...cadet, ...partial, lastTouched: today() });
  }

  function handlePipelineTap(step, status) {
    if (status === 'done') {
      touch({ [step.key]: '' });
    } else if (status === 'next') {
      touch({ [step.key]: today() });
    }
  }

  function handleSaveNote() {
    if (!noteDraft.trim()) return;
    const entry = `[${today()}] ${noteDraft.trim()}`;
    const notes = cadet.notes ? `${cadet.notes}\n${entry}` : entry;
    touch({ notes });
    setNoteDraft('');
    setAddingNote(false);
  }

  function runConfirmed() {
    if (!confirmAction) return;
    if (confirmAction.type === 'join') {
      touch({ status: 'Joined', archivedDate: cadet.archivedDate || today() });
    } else if (confirmAction.type === 'withdraw') {
      touch({ status: 'Withdrew', archivedDate: cadet.archivedDate || today() });
    } else if (confirmAction.type === 'restore') {
      touch({ status: 'Active', archivedDate: '' });
    }
    setConfirmAction(null);
  }

  async function handleGenerateEmail(type) {
    const cc = type === 'welcome' ? settings.welcomeCc : settings.thirdNightCc;
    setEmail({ type, loading: true, error: null, subject: '', body: '', cc });
    try {
      const prompt =
        type === 'welcome'
          ? buildWelcomeEmailPrompt(cadet, settings)
          : buildThirdNightEmailPrompt(cadet, settings);
      const raw = await generateEmail(prompt, settings.anthropicApiKey);
      const { subject, body } = parseGeneratedEmail(raw);
      setEmail({ type, loading: false, error: null, subject, body, cc });
      if (type === 'welcome') touch({ welcomeEmailSent: today() });
      if (type === 'thirdNight') touch({ thirdNightEmailSent: today() });
    } catch (err) {
      setEmail({ type, loading: false, error: err.message, subject: '', body: '', cc });
    }
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      <div
        style={{
          background: COLORS.capBlue,
          color: '#fff',
          padding: 'calc(16px + var(--safe-area-top)) 16px 14px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <button onClick={onBack} style={backButtonStyle}>
            ‹ Back
          </button>
          <button onClick={onEdit} style={backButtonStyle}>
            Edit
          </button>
        </div>
        <div style={{ marginTop: 6 }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            {cadet.firstName} {cadet.lastName}
          </div>
          <div style={{ fontSize: 13, color: '#cbd5e1', marginTop: 2 }}>
            {[cadet.age && `Age ${cadet.age}`, cadet.grade].filter(Boolean).join(' · ')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#fff',
              background: STATUS_BADGE_COLOR[cadet.status],
              borderRadius: 999,
              padding: '3px 10px',
            }}
          >
            {cadet.status}
          </span>
          {actionBadge && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: COLORS.capBlue,
                background: COLORS.capGold,
                borderRadius: 999,
                padding: '3px 10px',
              }}
            >
              {actionBadge}
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <Section title="Contact Info">
          <Field label="Parent/Guardian" value={cadet.parentName} />
          <Field
            label={cadet.cadetPhone ? "Cadet's Phone" : "Parent's Phone"}
            value={cadet.parentPhone}
            href={cadet.parentPhone ? `tel:${cadet.parentPhone.replace(/[^\d+]/g, '')}` : null}
          />
          <Field
            label={cadet.cadetEmail ? "Cadet's Email" : "Parent's Email"}
            value={cadet.parentEmail}
            href={cadet.parentEmail ? `mailto:${cadet.parentEmail}` : null}
          />
        </Section>

        <Section title="Pipeline">
          {PIPELINE_STEPS.map((step, i) => {
            const status = dots[i];
            const dateVal = cadet[step.key];
            const tappable = status === 'done' || status === 'next';
            return (
              <div
                key={step.key}
                onClick={() => tappable && handlePipelineTap(step, status)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  marginBottom: 8,
                  borderRadius: 10,
                  background: status === 'done' ? '#dcfce7' : status === 'next' ? '#fef3c7' : COLORS.background,
                  border:
                    status === 'next'
                      ? `2px dashed ${COLORS.pipelineNext}`
                      : `1px solid ${status === 'done' ? '#bbf7d0' : COLORS.border}`,
                  cursor: tappable ? 'pointer' : 'default',
                }}
              >
                <span style={{ fontSize: 14, color: COLORS.text, fontWeight: status === 'pending' ? 400 : 600 }}>
                  {status === 'done' ? '✅ ' : ''}
                  {step.label}
                </span>
                <span style={{ fontSize: 13, color: COLORS.textMuted }}>
                  {dateVal || (status === 'next' ? 'Tap for today' : '—')}
                </span>
              </div>
            );
          })}
        </Section>

        {cadet.status === 'Active' && (
          <Section title="Email Generation">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => handleGenerateEmail('welcome')} style={emailButtonStyle(false)}>
                ✉️ Welcome Email
              </button>
              <button
                onClick={() => handleGenerateEmail('thirdNight')}
                style={emailButtonStyle(meetingCount >= 2)}
              >
                📨 3rd Night / Join Email
              </button>
            </div>
          </Section>
        )}

        <Section title="Notes">
          {cadet.notes ? (
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                fontSize: 13,
                color: COLORS.text,
                background: COLORS.background,
                borderRadius: 10,
                padding: 12,
                margin: 0,
              }}
            >
              {cadet.notes}
            </pre>
          ) : (
            <div style={{ fontSize: 13, color: COLORS.textMuted }}>No notes yet.</div>
          )}
          {addingNote ? (
            <div style={{ marginTop: 10 }}>
              <textarea
                autoFocus
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  fontSize: 16,
                  padding: 10,
                  borderRadius: 10,
                  border: `1px solid ${COLORS.border}`,
                }}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button onClick={handleSaveNote} style={emailButtonStyle(true)}>
                  Save Note
                </button>
                <button onClick={() => { setAddingNote(false); setNoteDraft(''); }} style={emailButtonStyle(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingNote(true)} style={{ ...emailButtonStyle(false), marginTop: 10 }}>
              + Add Note
            </button>
          )}
        </Section>

        <Section title="Status">
          {cadet.status === 'Active' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => setConfirmAction({ type: 'join' })}
                style={{ ...statusButtonStyle, background: '#16a34a' }}
              >
                ✅ Mark as Joined — Archive
              </button>
              <button
                onClick={() => setConfirmAction({ type: 'withdraw' })}
                style={{ ...statusButtonStyle, background: COLORS.textMuted }}
              >
                Mark as Withdrew
              </button>
            </div>
          )}
          {cadet.status !== 'Active' && (
            <button
              onClick={() => setConfirmAction({ type: 'restore' })}
              style={{ ...statusButtonStyle, background: COLORS.capBlue }}
            >
              ↩ Restore to Active
            </button>
          )}
        </Section>
      </div>

      <ConfirmModal
        open={!!confirmAction}
        title={
          confirmAction?.type === 'join'
            ? 'Mark as Joined?'
            : confirmAction?.type === 'withdraw'
            ? 'Mark as Withdrew?'
            : 'Restore to Active?'
        }
        subtitle={
          confirmAction?.type === 'restore'
            ? 'This cadet will move back into the active pipeline.'
            : 'This will move the cadet to the Archive tab.'
        }
        confirmLabel={confirmAction?.type === 'withdraw' ? 'Mark Withdrew' : 'Confirm'}
        tone={confirmAction?.type === 'withdraw' ? 'danger' : 'positive'}
        onConfirm={runConfirmed}
        onCancel={() => setConfirmAction(null)}
      />

      <EmailModal
        open={!!email}
        title={email?.type === 'welcome' ? 'Welcome Email' : '3rd Night / Join Email'}
        cadetName={`${cadet.firstName} ${cadet.lastName}`}
        parentEmail={cadet.parentEmail}
        cc={email?.cc}
        loading={email?.loading}
        error={email?.error}
        subject={email?.subject}
        body={email?.body}
        onClose={() => setEmail(null)}
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
      <div
        style={{
          background: COLORS.card,
          borderRadius: 14,
          padding: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, href }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </div>
      {value ? (
        href ? (
          <a href={href} style={{ fontSize: 15, color: COLORS.capBlue, fontWeight: 600, textDecoration: 'none' }}>
            {value}
          </a>
        ) : (
          <div style={{ fontSize: 15, color: COLORS.text, fontWeight: 600 }}>{value}</div>
        )
      ) : (
        <div style={{ fontSize: 15, color: COLORS.textMuted }}>—</div>
      )}
    </div>
  );
}

const backButtonStyle = {
  background: 'none',
  border: 'none',
  color: '#fff',
  fontSize: 15,
  fontWeight: 600,
  padding: 4,
};

function emailButtonStyle(highlighted) {
  return {
    padding: '12px 16px',
    borderRadius: 10,
    border: highlighted ? 'none' : `1px solid ${COLORS.border}`,
    background: highlighted ? COLORS.capGold : '#fff',
    color: highlighted ? COLORS.capBlue : COLORS.text,
    fontSize: 14,
    fontWeight: 700,
  };
}

const statusButtonStyle = {
  padding: '14px 0',
  borderRadius: 12,
  border: 'none',
  color: '#fff',
  fontSize: 15,
  fontWeight: 700,
};
