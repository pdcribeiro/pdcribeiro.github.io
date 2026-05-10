const statusEl = document.getElementById('status');
const recBtn = document.getElementById('rec');
const nudgeEl = document.getElementById('nudge');
const nudgeLabelEl = document.getElementById('nudge-label');
let statusTimer = null;

export function showStatus(msg) {
  statusEl.textContent = msg;
  statusEl.classList.add('visible');
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => statusEl.classList.remove('visible'), 3000);
}

export function setRecording(active) {
  recBtn.textContent = active ? 'STOP' : 'REC';
  recBtn.classList.toggle('recording', active);
}

export function showNudgeUI(offsetSec) {
  nudgeLabelEl.textContent = `${Math.round(offsetSec * 1000)} ms`;
  nudgeEl.hidden = false;
}

export function hideNudgeUI() {
  nudgeEl.hidden = true;
}

export function setNudgeLabel(offsetSec) {
  nudgeLabelEl.textContent = `${Math.round(offsetSec * 1000)} ms`;
}

export function setCountdown(n) {
  clearTimeout(statusTimer);
  if (n === null) {
    statusEl.classList.remove('visible');
    statusEl.textContent = '';
  } else {
    statusEl.textContent = String(n);
    statusEl.classList.add('visible');
  }
}
