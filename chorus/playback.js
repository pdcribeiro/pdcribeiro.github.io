import { getAudioCtx } from './audio.js';
import { getAllTakes } from './storage.js';

let masterGain = null;
let activeSources = [];
let _playing = false;
let _preloaded = null;
let _cancelToken = 0;

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
  return Promise.all(valid.map(t => t.blob.arrayBuffer().then(ab => ctx.decodeAudioData(ab))));
}

export function preload() {
  _preloaded = loadBuffers();
}

// when: optional absolute AudioContext time to start; computed after load if omitted
export async function playOnce(T, onEnd, when) {
  stopPlayback();
  const token = _cancelToken;
  const buffers = await (_preloaded ?? loadBuffers());
  _preloaded = null;
  if (_cancelToken !== token || !buffers) return false;

  const ctx = getAudioCtx();
  const t = when ?? ctx.currentTime + 0.05;
  _playing = true;
  let remaining = buffers.length;

  for (const buffer of buffers) {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = false;
    src.connect(getGain());
    src.start(t);
    src.stop(t + T);
    activeSources.push(src);
    src.onended = () => {
      const i = activeSources.indexOf(src);
      if (i !== -1) activeSources.splice(i, 1);
      remaining--;
      if (remaining === 0 && _playing) {
        _playing = false;
        onEnd?.();
      }
    };
  }
  return true;
}

export function stopPlayback() {
  _playing = false;
  _cancelToken++;
  for (const src of activeSources) {
    try { src.stop(); } catch {}
  }
  activeSources = [];
}

export function isPlaying() {
  return _playing;
}
