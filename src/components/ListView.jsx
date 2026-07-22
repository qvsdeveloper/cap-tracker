import { COLORS } from '../styles/colors.js';
import CadetCard from './CadetCard.jsx';
import ContactRow from './ContactRow.jsx';
import TabBar from './TabBar.jsx';
import { sortActiveCadets } from '../utils/pipeline.js';

export default function ListView({ cadets, tab, onChangeTab, onSelectCadet, onAddNew }) {
  const active = sortActiveCadets(cadets.filter((c) => c.status === 'Active'));
  const archived = cadets
    .filter((c) => c.status === 'Joined' || c.status === 'Withdrew')
    .sort((a, b) => (b.archivedDate || '').localeCompare(a.archivedDate || ''));
  const contacts = active.filter((c) => c.parentPhone || c.parentEmail);

  let list = null;
  if (tab === 'active') {
    list = active.length ? (
      active.map((c) => <CadetCard key={c.id} cadet={c} onClick={() => onSelectCadet(c.id)} />)
    ) : (
      <EmptyState text="No active prospects yet. Tap + to add one." />
    );
  } else if (tab === 'archive') {
    list = archived.length ? (
      archived.map((c) => <CadetCard key={c.id} cadet={c} onClick={() => onSelectCadet(c.id)} />)
    ) : (
      <EmptyState text="No archived cadets yet." />
    );
  } else {
    list = contacts.length ? (
      contacts.map((c) => <ContactRow key={c.id} cadet={c} />)
    ) : (
      <EmptyState text="No active prospects with contact info yet." />
    );
  }

  return (
    <div>
      <TabBar tab={tab} onChange={onChangeTab} />
      <div
        style={{
          padding: '16px 16px 100px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {list}
      </div>
      {tab === 'active' && (
        <button
          onClick={onAddNew}
          aria-label="Add prospect"
          style={{
            position: 'fixed',
            right: 20,
            bottom: 'calc(20px + env(safe-area-inset-bottom))',
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: COLORS.capGold,
            color: COLORS.capBlue,
            border: 'none',
            fontSize: 28,
            fontWeight: 700,
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            cursor: 'pointer',
          }}
        >
          +
        </button>
      )}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ textAlign: 'center', color: COLORS.textMuted, padding: '60px 20px', fontSize: 14 }}>{text}</div>
  );
}
