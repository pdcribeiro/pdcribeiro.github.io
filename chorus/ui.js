const statusEl = document.getElementById('status');
let statusTimer = null;

export function showStatus(msg) {
  statusEl.textContent = msg;
  statusEl.classList.add('visible');
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => statusEl.classList.remove('visible'), 3000);
}
