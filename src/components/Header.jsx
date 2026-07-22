import { COLORS } from '../styles/colors.js';

export default function Header({ activeCount, syncStatus, onOpenSettings }) {
  return (
    <div
      style={{
        background: COLORS.capBlue,
        color: '#fff',
        padding: 'calc(12px + var(--safe-area-top)) 16px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Quakertown Composite Squadron</div>
        <div style={{ fontSize: 12, color: COLORS.capGold, marginTop: 2 }}>
          {activeCount} active prospect{activeCount === 1 ? '' : 's'}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span title={syncStatus.label} style={{ fontSize: 18, opacity: syncStatus.syncing ? 0.6 : 1 }}>
          {syncStatus.icon}
        </span>
        <button
          onClick={onOpenSettings}
          aria-label="Settings"
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: 24,
            padding: 4,
            lineHeight: 1,
          }}
        >
          ☰
        </button>
      </div>
    </div>
  );
}
