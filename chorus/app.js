if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js');
  });
}

let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 });
  }
}

async function unlockAudio() {
  if (audioCtx.state !== 'running') {
    await audioCtx.resume();
  }
}

function now() {
  return audioCtx.currentTime;
}

let audioInited = false;

async function ensureAudio() {
  if (audioInited) return;
  audioInited = true;
  initAudio();
  await unlockAudio();
  alert('state: ' + audioCtx.state + '\nnow: ' + now());
}

document.getElementById('rec').addEventListener('click', ensureAudio);
document.getElementById('play').addEventListener('click', ensureAudio);
