// Dev-only helper for previewing iOS safe-area spacing without a physical
// device or simulator. Add ?notch=<preset|px> to the dev server URL, e.g.
// http://localhost:5173/cap-tracker/?notch=dynamic-island
const PRESETS = {
  'dynamic-island': { top: 59, bottom: 34 }, // iPhone 14 Pro through 17 Pro
  notch: { top: 47, bottom: 34 }, // iPhone X - 13 style notch
  none: { top: 0, bottom: 0 },
};

export function applyDevSafeAreaOverride() {
  const params = new URLSearchParams(window.location.search);
  const notch = params.get('notch');
  if (!notch) return;

  const preset = PRESETS[notch];
  const top = preset ? preset.top : Number(notch);
  const bottom = preset ? preset.bottom : Number(params.get('homebar') || 34);
  if (Number.isNaN(top)) return;

  document.documentElement.style.setProperty('--safe-area-top', `${top}px`);
  document.documentElement.style.setProperty('--safe-area-bottom', `${bottom}px`);

  const banner = document.createElement('div');
  banner.textContent = `Simulating safe area — top: ${top}px, bottom: ${bottom}px`;
  banner.style.cssText =
    'position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#000;' +
    'color:#4ade80;font:11px ui-monospace,monospace;text-align:center;' +
    'padding:3px;pointer-events:none;opacity:0.85;';
  document.body.appendChild(banner);
}
