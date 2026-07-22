import { getMeetingCount } from './pipeline.js';

function cadetLabel(cadet) {
  const parts = [`${cadet.firstName} ${cadet.lastName}`];
  const details = [];
  if (cadet.age) details.push(`age ${cadet.age}`);
  if (cadet.grade) details.push(`${cadet.grade} grade`);
  if (details.length) parts.push(`(${details.join(', ')})`);
  return parts.join(' ');
}

export function buildWelcomeEmailPrompt(cadet, settings) {
  const lines = [
    'Write a warm welcome email FROM [REDACTED SENDER] (Key Parent & Transportation Officer,',
    '[REDACTED SQUADRON], [REDACTED ORG], [REDACTED WING])',
    'TO the parent/guardian of a prospective cadet.',
    '',
    `Cadet: ${cadetLabel(cadet)}`,
    `Parent/Guardian: ${cadet.parentName || 'Parent/Guardian'}`,
    `First Contact: ${cadet.firstContactDate || 'recently'}`,
  ];
  if (settings.squadronSchedule) {
    lines.push(`Upcoming Squadron Schedule: ${settings.squadronSchedule}`);
  }
  lines.push(
    '',
    'Write 3-4 short paragraphs covering:',
    '- Thank them for their interest in CAP',
    '- CAP is the official [REDACTED ORG]: aerospace education, leadership, service',
    '- Tuesday evening meetings at [REDACTED LOCATION]',
    '- 3-meeting process before officially joining',
    '- Warm encouragement to keep attending'
  );
  if (settings.welcomeExtra) {
    lines.push(`Additional instructions: ${settings.welcomeExtra}`);
  }
  lines.push(
    '',
    'Sign off: [REDACTED SENDER] | Key Parent, [REDACTED SQUADRON] ([REDACTED])',
    'Output ONLY the email. Start with "Subject: ..." then blank line then body.'
  );
  return lines.join('\n');
}

export function buildThirdNightEmailPrompt(cadet, settings) {
  const lines = [
    'Write an encouraging email FROM [REDACTED SENDER] (Key Parent & Transportation Officer,',
    '[REDACTED SQUADRON], [REDACTED ORG], [REDACTED WING])',
    'TO the parent/guardian of a prospective cadet ready to officially join.',
    '',
    `Cadet: ${cadetLabel(cadet)}`,
    `Parent/Guardian: ${cadet.parentName || 'Parent/Guardian'}`,
    `Meetings attended: ${getMeetingCount(cadet)}`,
  ];
  if (settings.squadronSchedule) {
    lines.push(`Upcoming Squadron Schedule: ${settings.squadronSchedule}`);
  }
  lines.push(
    '',
    'Write 3-4 short paragraphs covering:',
    `- Celebrate attending ${getMeetingCount(cadet)} meetings -- almost official!`,
    '- Next meeting is Join Night',
    '- Need [REDACTED FORM] ([REDACTED FORM]) from [REDACTED URL] -- parent must sign',
    '- $25 annual membership fee at [REDACTED URL]',
    '- Genuine excitement about them joining'
  );
  if (settings.thirdNightExtra) {
    lines.push(`Additional instructions: ${settings.thirdNightExtra}`);
  }
  lines.push(
    '',
    'Sign off: [REDACTED SENDER] | Key Parent, [REDACTED SQUADRON] ([REDACTED])',
    'Output ONLY the email. Start with "Subject: ..." then blank line then body.'
  );
  return lines.join('\n');
}

export async function generateEmail(prompt, apiKey) {
  if (!apiKey) {
    throw new Error('No Anthropic API key set. Add one in Settings.');
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${text}`);
  }
  const data = await res.json();
  const text = data.content?.map((block) => block.text).join('') || '';
  return text.trim();
}

export function parseGeneratedEmail(raw) {
  const match = raw.match(/^Subject:\s*(.*)\n\n([\s\S]*)$/);
  if (match) {
    return { subject: match[1].trim(), body: match[2].trim() };
  }
  return { subject: '', body: raw.trim() };
}
