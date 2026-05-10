const TARGET_AMP = Math.pow(10, -6 / 20); // ≈ 0.501
const MAX_GAIN = 10;
const MIN_PEAK = 1e-5;

export function measurePeak(buffer) {
  const data = buffer.getChannelData(0);
  let peak = 0;
  for (let i = 0; i < data.length; i++) {
    const a = Math.abs(data[i]);
    if (a > peak) peak = a;
  }
  return peak;
}

export function computeGain(peak) {
  if (peak < MIN_PEAK) return 1;
  return Math.min(TARGET_AMP / peak, MAX_GAIN);
}

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
  initAudio();
  await unlockAudio();
}

export function now() {
  return audioCtx.currentTime;
}

export function getAudioCtx() {
  return audioCtx;
}
