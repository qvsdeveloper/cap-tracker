import { COLORS } from '../styles/colors.js';
import {
  PIPELINE_STEPS,
  getPipelineDotStatus,
  getMeetingCount,
  getTemperature,
  getStaleDays,
  getActionBadge,
} from '../utils/pipeline.js';

const DOT_COLOR = {
  done: COLORS.pipelineDone,
  next: COLORS.pipelineNext,
  pending: COLORS.pipelinePending,
};

const STATUS_BADGE_COLOR = {
  Active: COLORS.capBlue,
  Joined: '#16a34a',
  Withdrew: '#94a3b8',
};

export default function CadetCard({ cadet, onClick }) {
  const temp = getTemperature(cadet);
  const stale = getStaleDays(cadet);
  const action = getActionBadge(cadet);
  const dots = getPipelineDotStatus(cadet);
  const meetingCount = getMeetingCount(cadet);

  return (
    <div
      onClick={onClick}
      style={{
        background: COLORS.card,
        borderRadius: 14,
        padding: '14px 16px',
        marginBottom: 12,
        borderLeft: `5px solid ${temp.color}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>
            {temp.emoji} {cadet.firstName} {cadet.lastName}
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>
            {[cadet.age && `Age ${cadet.age}`, cadet.grade].filter(Boolean).join(' · ')}
          </div>
          {cadet.parentPhone && (
            <div style={{ fontSize: 13, color: COLORS.textMuted }}>{cadet.parentPhone}</div>
          )}
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#fff',
            background: STATUS_BADGE_COLOR[cadet.status] || COLORS.textMuted,
            borderRadius: 999,
            padding: '3px 10px',
            whiteSpace: 'nowrap',
          }}
        >
          {cadet.status}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
        {dots.map((status, i) => (
          <span
            key={PIPELINE_STEPS[i].key}
            title={PIPELINE_STEPS[i].label}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: DOT_COLOR[status],
              border: status === 'next' ? `2px dashed ${COLORS.pipelineNext}` : 'none',
            }}
          />
        ))}
        <span style={{ fontSize: 12, color: COLORS.textMuted, marginLeft: 4 }}>{meetingCount}/3 mtgs</span>
      </div>

      {(action || stale) && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {action && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: COLORS.capBlue,
                background: '#e0e7ff',
                borderRadius: 8,
                padding: '4px 10px',
              }}
            >
              {action}
            </span>
          )}
          {stale && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#b45309',
                background: '#fef3c7',
                borderRadius: 8,
                padding: '4px 10px',
              }}
            >
              ⏱ {stale}d no update
            </span>
          )}
        </div>
      )}

      {cadet.firstContactDate && (
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 8 }}>
          First contact: {cadet.firstContactDate}
        </div>
      )}
    </div>
  );
}
