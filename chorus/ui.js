const statusEl = document.getElementById('status');
const recBtn = document.getElementById('rec');
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
