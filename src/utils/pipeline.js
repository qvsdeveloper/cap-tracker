export const PIPELINE_STEPS = [
  { key: 'firstContactDate', label: 'First Contact' },
  { key: 'welcomeEmailSent', label: 'Welcome Email Sent' },
  { key: 'meeting1Date', label: 'Meeting 1' },
  { key: 'meeting2Date', label: 'Meeting 2' },
  { key: 'thirdNightEmailSent', label: '3rd Night Email Sent' },
  { key: 'meeting3Date', label: 'Meeting 3' },
];

function daysSince(dateStr) {
  if (!dateStr) return null;
  const then = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

export function getMeetingCount(cadet) {
  return [cadet.meeting1Date, cadet.meeting2Date, cadet.meeting3Date].filter(Boolean).length;
}

export function isReadyToJoin(cadet) {
  return !!cadet.meeting3Date;
}

export function getTemperature(cadet) {
  if (isReadyToJoin(cadet)) {
    return { emoji: '🔥', label: 'Ready', color: '#ef4444' };
  }
  const days = daysSince(cadet.firstContactDate);
  if (days === null) {
    return { emoji: '', label: 'No Contact', color: '#94a3b8' };
  }
  if (days <= 21) return { emoji: '🔥', label: 'Hot', color: '#ef4444' };
  if (days <= 45) return { emoji: '☀️', label: 'Warm', color: '#f59e0b' };
  if (days <= 90) return { emoji: '🌥️', label: 'Cooling', color: '#94a3b8' };
  return { emoji: '❄️', label: 'Cold', color: '#3b82f6' };
}

export function getStaleDays(cadet) {
  const days = daysSince(cadet.lastTouched);
  if (days === null || days <= 5) return null;
  return days;
}

export function getActionBadge(cadet) {
  if (isReadyToJoin(cadet)) return 'Ready to Join!';
  const meetings = getMeetingCount(cadet);
  if (meetings >= 2 && !cadet.thirdNightEmailSent) return 'Send 3rd Night Email';
  if (cadet.firstContactDate && !cadet.welcomeEmailSent) return 'Send Welcome Email';
  return null;
}

export function getPipelineDotStatus(cadet) {
  const values = PIPELINE_STEPS.map((step) => !!cadet[step.key]);
  const firstPendingIndex = values.findIndex((v) => !v);
  return values.map((done, i) => {
    if (done) return 'done';
    if (i === firstPendingIndex) return 'next';
    return 'pending';
  });
}

// Priority tiers for the Active list, lower number = higher priority.
export function getSortTier(cadet) {
  if (isReadyToJoin(cadet)) return 1;
  const meetings = getMeetingCount(cadet);
  if (meetings >= 2 && !cadet.thirdNightEmailSent) return 2;
  if (cadet.firstContactDate && !cadet.welcomeEmailSent) return 3;
  if (cadet.meeting1Date) return 4;
  if (cadet.firstContactDate) return 5;
  return 6;
}

export function getLatestActivityDate(cadet) {
  const dates = [
    cadet.lastTouched,
    cadet.meeting3Date,
    cadet.thirdNightEmailSent,
    cadet.meeting2Date,
    cadet.meeting1Date,
    cadet.welcomeEmailSent,
    cadet.firstContactDate,
  ].filter(Boolean);
  if (dates.length === 0) return '';
  return dates.reduce((latest, d) => (d > latest ? d : latest), dates[0]);
}

export function sortActiveCadets(cadets) {
  return [...cadets].sort((a, b) => {
    const tierDiff = getSortTier(a) - getSortTier(b);
    if (tierDiff !== 0) return tierDiff;
    return getLatestActivityDate(b).localeCompare(getLatestActivityDate(a));
  });
}
