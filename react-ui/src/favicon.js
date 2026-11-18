// Live countdown in the browser tab: a progress-ring favicon plus a title countdown.

const ORIGINAL_TITLE = document.title;
let originalIconHref = null;
let lastSecond = null;

function getIconLink() {
  let link = document.querySelector('link[rel~="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  if (originalIconHref === null) originalIconHref = link.href;
  return link;
}

function formatTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function drawIcon(remainingSec, totalSec) {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const center = size / 2;
  const radius = 26;
  const done = remainingSec <= 0;
  const frac = totalSec > 0 ? Math.max(0, remainingSec / totalSec) : 0;

  if (done) {
    // Solid red badge with "!" when time is up
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.arc(center, center, radius + 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', center, center + 3);
    return canvas.toDataURL('image/png');
  }

  // Track
  ctx.lineWidth = 9;
  ctx.strokeStyle = '#d9d9d9';
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, 2 * Math.PI);
  ctx.stroke();

  // Remaining-time arc: green, red in the final minute
  ctx.strokeStyle = remainingSec <= 60 ? '#e53935' : '#43a047';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(center, center, radius, -Math.PI / 2, -Math.PI / 2 + frac * 2 * Math.PI);
  ctx.stroke();

  // Minutes left (seconds in the final minute)
  const label = remainingSec > 60 ? Math.ceil(remainingSec / 60) : remainingSec;
  ctx.fillStyle = '#222';
  ctx.font = `bold ${String(label).length > 2 ? 22 : 28}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(label), center, center + 2);

  return canvas.toDataURL('image/png');
}

// Call on every timer tick; only redraws when the whole-second value changes.
export function updateTimerIndicators(remainingSec, totalSec) {
  const second = Math.max(0, Math.ceil(remainingSec));
  if (second === lastSecond) return;
  lastSecond = second;

  getIconLink().href = drawIcon(second, totalSec);
  document.title = second > 0
    ? `${formatTime(second)} – ${ORIGINAL_TITLE}`
    : `⏰ Time's up! – ${ORIGINAL_TITLE}`;
}

// Call when the timer is stopped to restore the normal icon and title.
export function resetTimerIndicators() {
  lastSecond = null;
  const link = getIconLink();
  if (originalIconHref) link.href = originalIconHref;
  document.title = ORIGINAL_TITLE;
}
