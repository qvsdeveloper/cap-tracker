import { COLORS } from '../styles/colors.js';

export default function Header({ activeCount, syncStatus, onOpenSettings, onSyncClick }) {
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
        <div style={{ fontSize: 17, fontWeight: 700 }}>Andy's Cap Tracker</div>
        <div style={{ fontSize: 12, color: COLORS.capGold, marginTop: 2 }}>
          {activeCount} active prospect{activeCount === 1 ? '' : 's'}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={onSyncClick}
          title={`${syncStatus.label} — tap to sync now`}
          aria-label="Sync"
          disabled={syncStatus.syncing}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            padding: '4px 6px',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            opacity: syncStatus.syncing ? 0.6 : 1,
          }}
        >
          <span style={{ fontSize: 16 }}>{syncStatus.icon}</span>
          <span>{syncStatus.shortLabel}</span>
        </button>
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
