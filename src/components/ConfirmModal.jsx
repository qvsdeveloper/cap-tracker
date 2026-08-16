import { COLORS } from '../styles/colors.js';

export default function ConfirmModal({
  open,
  title,
  subtitle,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const confirmColor = tone === 'danger' ? COLORS.danger : tone === 'positive' ? '#16a34a' : COLORS.capBlue;

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
      onClick={onCancel}
    >
      <div
        style={{
          background: COLORS.card,
          width: '100%',
          maxWidth: 480,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: '24px 20px calc(20px + var(--safe-area-bottom))',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            background: COLORS.border,
            margin: '0 auto 16px',
          }}
        />
        <h3 style={{ margin: 0, fontSize: 18, color: COLORS.text }}>{title}</h3>
        {subtitle && (
          <p style={{ margin: '8px 0 0', fontSize: 14, color: COLORS.textMuted, lineHeight: 1.4 }}>{subtitle}</p>
        )}
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '14px 0',
              borderRadius: 12,
              border: `1px solid ${COLORS.border}`,
              background: '#fff',
              color: COLORS.text,
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '14px 0',
              borderRadius: 12,
              border: 'none',
              background: confirmColor,
              color: '#fff',
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
