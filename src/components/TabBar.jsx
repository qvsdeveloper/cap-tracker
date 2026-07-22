import { COLORS } from '../styles/colors.js';

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'archive', label: 'Archive' },
  { key: 'contacts', label: 'Contacts' },
];

export default function TabBar({ tab, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        background: COLORS.card,
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      {TABS.map((t) => {
        const active = tab === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            style={{
              flex: 1,
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom: active ? `3px solid ${COLORS.capGold}` : '3px solid transparent',
              color: active ? COLORS.capBlue : COLORS.textMuted,
              fontSize: 15,
              fontWeight: active ? 700 : 500,
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
