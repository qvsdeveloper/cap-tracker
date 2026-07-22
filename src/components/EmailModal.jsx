import { COLORS } from '../styles/colors.js';

export default function EmailModal({
  open,
  title,
  cadetName,
  parentEmail,
  cc,
  loading,
  error,
  subject,
  body,
  onClose,
}) {
  if (!open) return null;

  const fullText = subject ? `Subject: ${subject}\n\n${body}` : body;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
  };

  const mailtoHref = `mailto:${encodeURIComponent(parentEmail || '')}${
    cc ? `?cc=${encodeURIComponent(cc)}&` : '?'
  }subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(body || '')}`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: COLORS.card,
          width: '100%',
          maxWidth: 560,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: '20px 20px calc(16px + var(--safe-area-bottom))',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{ width: 40, height: 4, borderRadius: 2, background: COLORS.border, margin: '0 auto 12px' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 17, color: COLORS.text }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'none', fontSize: 22, color: COLORS.textMuted, padding: 4 }}
          >
            ✕
          </button>
        </div>
        <p style={{ margin: '4px 0 12px', fontSize: 13, color: COLORS.textMuted }}>
          {cadetName} · to {parentEmail || 'no email on file'}
          {cc ? ` · cc: ${cc}` : ''}
        </p>

        {loading && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: COLORS.textMuted }}>
            <div
              style={{
                width: 32,
                height: 32,
                margin: '0 auto 12px',
                border: `3px solid ${COLORS.border}`,
                borderTopColor: COLORS.capBlue,
                borderRadius: '50%',
                animation: 'cap-spin 0.8s linear infinite',
              }}
            />
            Generating email...
            <style>{'@keyframes cap-spin { to { transform: rotate(360deg); } }'}</style>
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: '20px 0', color: COLORS.danger, fontSize: 14 }}>{error}</div>
        )}

        {!loading && !error && (
          <>
            <textarea
              readOnly
              value={fullText}
              style={{
                flex: 1,
                minHeight: 220,
                width: '100%',
                boxSizing: 'border-box',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 13,
                lineHeight: 1.5,
                padding: 12,
                borderRadius: 12,
                border: `1px solid ${COLORS.border}`,
                background: COLORS.background,
                resize: 'vertical',
                WebkitOverflowScrolling: 'touch',
              }}
            />
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button
                onClick={handleCopy}
                style={{
                  flex: 1,
                  padding: '14px 0',
                  borderRadius: 12,
                  border: `1px solid ${COLORS.border}`,
                  background: '#fff',
                  color: COLORS.text,
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                📋 Copy
              </button>
              <a
                href={mailtoHref}
                style={{
                  flex: 1,
                  padding: '14px 0',
                  borderRadius: 12,
                  border: 'none',
                  background: COLORS.capBlue,
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  textAlign: 'center',
                  textDecoration: 'none',
                  boxSizing: 'border-box',
                }}
              >
                📧 Open in Mail
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
