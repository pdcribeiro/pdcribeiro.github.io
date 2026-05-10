import { getAudioCtx } from './audio.js';
import { getAllTakes } from './storage.js';

let _graph = null;
let _playing = false;
let _preloaded = null;
let _cancelToken = 0;

async function loadBuffers() {
  const takes = await getAllTakes();
  const valid = takes.filter(t => t.blob?.size > 0);
  if (!valid.length) return null;
  const ctx = getAudioCtx();
  return Promise.all(valid.map(t =>
    t.blob.arrayBuffer()
      .then(ab => ctx.decodeAudioData(ab))
      .then(buffer => ({ buffer, offset: t.offset ?? 0, gain: t.gain ?? 1 }))
  ));
}

function createNodes(buffers, ctx) {
  const masterGain = ctx.createGain();
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -6;
  limiter.knee.value = 12;
  limiter.ratio.value = 10;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.25;
  masterGain.connect(limiter);
  limiter.connect(ctx.destination);

  const nodes = buffers.map(({ buffer, offset, gain }) => {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g);
    g.connect(masterGain);
    return { src, g, offset };
  });

  return { nodes, masterGain, limiter };
}

function startGraph(graph, startTime, bufferOffset = 0) {
  const ctx = getAudioCtx();
  for (const { src, offset } of graph.nodes) {
    const t = startTime + (offset ?? 0);
    const now = ctx.currentTime;
    if (t < now) {
      src.start(now, (now - t) + bufferOffset);
    } else {
      src.start(t, bufferOffset);
    }
  }
}

function stopGraph(graph) {
  if (!graph) return;
  for (const { src, g } of graph.nodes) {
    try { src.stop(); } catch {}
    try { src.disconnect(); } catch {}
    try { g.disconnect(); } catch {}
  }
  try { graph.masterGain.disconnect(); } catch {}
  try { graph.limiter.disconnect(); } catch {}
}

export function preload() {
  _preloaded = loadBuffers();
}

export async function startPlayback(when) {
  stopPlayback();
  const token = _cancelToken;
  const buffers = await (_preloaded ?? loadBuffers());
  _preloaded = null;
  if (_cancelToken !== token || !buffers) return false;

  const ctx = getAudioCtx();
  const t = when ?? ctx.currentTime + 0.05;
  _graph = createNodes(buffers, ctx);
  startGraph(_graph, t);
  _playing = true;
  return true;
}

export function stopPlayback() {
  _playing = false;
  _cancelToken++;
  stopGraph(_graph);
  _graph = null;
}

export function isPlaying() {
  return _playing;
}
