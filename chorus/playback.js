import { getAudioCtx } from './audio.js';
import { getAllTakes } from './storage.js';

let masterGain = null;
let _playing = false;
let scheduleTimer = null;
let activeSources = [];
let loopStartTime = 0;
let loopDuration = 0;

export function getLoopStartTime() { return loopStartTime; }
export function getLoopDuration() { return loopDuration; }

function getGain() {
  if (!masterGain) {
    const ctx = getAudioCtx();
    masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
  }
  return masterGain;
}

async function loadBuffers() {
  const takes = await getAllTakes();
  const valid = takes.filter(t => t.blob?.size > 0);
  if (!valid.length) return null;
  const ctx = getAudioCtx();
  const T = (valid[0].duration ?? 0) * 1000;
  const buffers = await Promise.all(
    valid.map(t => t.blob.arrayBuffer().then(ab => ctx.decodeAudioData(ab)))
  );
  return { buffers, T };
}

function createSources(startTime, buffers, T) {
  const ctx = getAudioCtx();
  const gain = getGain();
  const Ts = T / 1000;
  for (const buffer of buffers) {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = false;
    src.connect(gain);
    src.start(startTime);
    src.stop(startTime + Ts);
    activeSources.push(src);
    src.onended = () => {
      const i = activeSources.indexOf(src);
      if (i !== -1) activeSources.splice(i, 1);
    };
  }
}

function scheduleLoop(t, buffers, T) {
  if (!_playing) return;
  createSources(t, buffers, T);
  scheduleTimer = setTimeout(() => scheduleLoop(t + T / 1000, buffers, T), Math.max(0, T - 20));
}

export async function startLoop() {
  if (_playing) return;
  const result = await loadBuffers();
  if (!result) {
    alert('no audio');
    return;
  }
  const { buffers, T } = result;
  _playing = true;
  const base = getAudioCtx().currentTime + 0.05;
  loopStartTime = base;
  loopDuration = T / 1000;
  scheduleLoop(base, buffers, T);
}

export function stopLoop() {
  _playing = false;
  clearTimeout(scheduleTimer);
  scheduleTimer = null;
  for (const src of activeSources) {
    try { src.stop(); } catch {}
  }
  activeSources = [];
}

export function isLooping() {
  return _playing;
}
