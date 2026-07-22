import { COLORS } from '../styles/colors.js';

function digitsOnly(phone) {
  return (phone || '').replace(/[^\d+]/g, '');
}

export default function ContactRow({ cadet }) {
  const phone = cadet.parentPhone;
  const email = cadet.parentEmail;

  return (
    <div
      style={{
        background: COLORS.card,
        borderRadius: 14,
        padding: '14px 16px',
        marginBottom: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>
        {cadet.firstName} {cadet.lastName}
      </div>
      {cadet.parentName && (
        <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>
          {cadet.parentName} ({cadet.cadetPhone || cadet.cadetEmail ? 'cadet' : 'parent'})
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        {phone && (
          <>
            <a
              href={`tel:${digitsOnly(phone)}`}
              style={pillStyle('#e0e7ff', COLORS.capBlue)}
            >
              📞 Call
            </a>
            <a
              href={`sms:${digitsOnly(phone)}`}
              style={pillStyle('#e0e7ff', COLORS.capBlue)}
            >
              💬 Text
            </a>
          </>
        )}
        {email && (
          <a href={`mailto:${email}`} style={pillStyle('#fef3c7', '#92400e')}>
            ✉️ Email
          </a>
        )}
      </div>
    </div>
  );
}

function pillStyle(bg, color) {
  return {
    fontSize: 13,
    fontWeight: 600,
    color,
    background: bg,
    borderRadius: 999,
    padding: '8px 14px',
    textDecoration: 'none',
  };
}
