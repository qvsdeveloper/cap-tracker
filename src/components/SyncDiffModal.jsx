import { COLORS } from '../styles/colors.js';

function formatValue(value) {
  if (value === '' || value === undefined || value === null) return '(empty)';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

const TYPE_STYLE = {
  added: { label: 'New on Sheet', color: '#16a34a' },
  removed: { label: 'Missing from Sheet', color: COLORS.danger },
  modified: { label: 'Changed', color: COLORS.warm },
};

export default function SyncDiffModal({ open, diffs, onAccept, onKeepLocal }) {
  if (!open) return null;

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
      onClick={onKeepLocal}
    >
      <div
        style={{
          background: COLORS.card,
          width: '100%',
          maxWidth: 480,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
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
            flexShrink: 0,
          }}
        />
        <h3 style={{ margin: 0, fontSize: 18, color: COLORS.text, flexShrink: 0 }}>
          Review changes from Google Sheets
        </h3>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: COLORS.textMuted, lineHeight: 1.4, flexShrink: 0 }}>
          The Sheet has {diffs.length} change{diffs.length === 1 ? '' : 's'} that {diffs.length === 1 ? "isn't" : "aren't"} reflected here yet. Review below, then accept them or keep what you have on this device.
        </p>

        <div style={{ overflowY: 'auto', marginTop: 16, flex: 1 }}>
          {diffs.map((diff) => {
            const style = TYPE_STYLE[diff.type];
            return (
              <div
                key={diff.id}
                style={{
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 15, color: COLORS.text }}>{diff.name}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: 0.3,
                      color: style.color,
                    }}
                  >
                    {style.label}
                  </span>
                </div>

                {diff.type === 'modified' && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {diff.fields.map((field) => (
                      <div key={field.key} style={{ fontSize: 13, color: COLORS.textMuted }}>
                        <span style={{ color: COLORS.text }}>{field.label}: </span>
                        {formatValue(field.from)} → {formatValue(field.to)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexShrink: 0 }}>
          <button
            onClick={onKeepLocal}
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
            Keep My Version
          </button>
          <button
            onClick={onAccept}
            style={{
              flex: 1,
              padding: '14px 0',
              borderRadius: 12,
              border: 'none',
              background: COLORS.capBlue,
              color: '#fff',
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            Accept Changes
          </button>
        </div>
      </div>
    </div>
  );
}
