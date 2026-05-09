let audioCtx = null;

export function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 });
  }
}

export async function unlockAudio() {
  if (audioCtx.state !== 'running') {
    await audioCtx.resume();
  }
}

export async function ensureAudio() {
  if (audioCtx) return;
  initAudio();
  await unlockAudio();
}

export function now() {
  return audioCtx.currentTime;
}

export function getAudioCtx() {
  return audioCtx;
}
