window.onerror = (msg, src, line, col, err) => {
  alert(`Error: ${msg}\n${src}:${line}:${col}\n${err?.stack ?? ''}`);
};
window.addEventListener('unhandledrejection', (e) => {
  alert(`Unhandled rejection: ${e.reason?.stack ?? e.reason}`);
});

import { ensureAudio, getAudioCtx } from './audio.js';
import { getMic, getMicStream, initRecorder, startRec, stopRec, hasMic, hasRecorder } from './recorder.js';
import { showStatus, setRecording, setCountdown } from './ui.js';
import { initDB, saveTake } from './storage.js';
import { playOnce, stopPlayback, isPlaying } from './playback.js';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
}

const DELAY_SEC = 3;
const playBtn = document.getElementById('play');

let loopLength = null;    // seconds; set after first track stops
let loopStartTime = null; // AudioContext time when track 1 recording started
let recState = 'idle';    // 'idle' | 'countdown' | 'recording'
let countdownInterval = null;
let startTimeout = null;
let stopTimeout = null;

initDB();

function getNextLoopStart(now) {
  const elapsed = now - loopStartTime;
  const loopsPassed = Math.ceil(elapsed / loopLength);
  return loopStartTime + loopsPassed * loopLength;
}

function clearTimers() {
  clearInterval(countdownInterval);
  clearTimeout(startTimeout);
  clearTimeout(stopTimeout);
  countdownInterval = null;
  startTimeout = null;
  stopTimeout = null;
}

function cancelCountdown() {
  clearTimers();
  recState = 'idle';
  setRecording(false);
  setCountdown(null);
  stopPlayback();
}

async function finishRecording() {
  clearTimers();
  const result = await stopRec();
  recState = 'idle';
  setRecording(false);
  setCountdown(null);
  stopPlayback();
  if (!result) return;

  let buf;
  try {
    buf = await getAudioCtx().decodeAudioData(await result.blob.arrayBuffer());
  } catch {
    showStatus('decode fail');
    return;
  }
  const T = buf.duration;
  if (T < 0.5) {
    showStatus('too short');
    return;
  }
  if (!loopLength) {
    loopLength = T;
  }
  await saveTake(result.blob, { duration: loopLength, peak: 0, gain: 1 });
  showStatus(`saved (${loopLength.toFixed(1)}s)`);
}

function startCountdownUI(seconds, onDone) {
  let remaining = Math.ceil(seconds);
  setCountdown(remaining);
  countdownInterval = setInterval(() => {
    remaining--;
    if (remaining > 0) {
      setCountdown(remaining);
    } else {
      clearInterval(countdownInterval);
      countdownInterval = null;
      setCountdown(null);
    }
  }, 1000);
  startTimeout = setTimeout(() => {
    startTimeout = null;
    onDone();
  }, seconds * 1000);
}

async function onRec() {
  if (recState === 'countdown') {
    cancelCountdown();
    return;
  }
  if (recState === 'recording') {
    if (!loopLength) {
      // First track: manual stop sets length
      await finishRecording();
    }
    // Track 2+: auto-stops via timer; ignore tap
    return;
  }

  await ensureAudio();

  if (!hasMic()) {
    try { await getMic(); }
    catch { showStatus('mic failed'); return; }
  }
  if (!hasRecorder()) {
    initRecorder(getMicStream());
  }

  const ctx = getAudioCtx();
  recState = 'countdown';
  setRecording(true);

  if (!loopLength) {
    // Track 1: simple countdown, then user stops manually
    startCountdownUI(DELAY_SEC, () => {
      loopStartTime = ctx.currentTime;
      recState = 'recording';
      startRec();
    });
  } else {
    // Track 2+: align to loop boundary (T8)
    const now = ctx.currentTime;
    let nextLoopStart = getNextLoopStart(now);

    // Drift guard: need DELAY_SEC of lead time before boundary
    if (nextLoopStart - now < DELAY_SEC + 0.1) {
      nextLoopStart += loopLength;
      showStatus('shifted');
    }

    const timeToStart = nextLoopStart - now;
    startCountdownUI(timeToStart, () => {
      recState = 'recording';
      startRec();
      playOnce(nextLoopStart, loopLength);

      stopTimeout = setTimeout(async () => {
        stopTimeout = null;
        await finishRecording();
      }, loopLength * 1000);
    });
  }
}

async function onPlay() {
  if (recState !== 'idle') return;
  await ensureAudio();

  if (isPlaying()) {
    stopPlayback();
    playBtn.textContent = 'PLAY';
    return;
  }

  if (!loopLength) {
    showStatus('no tracks');
    return;
  }

  const ctx = getAudioCtx();
  playBtn.textContent = 'STOP';
  const ok = await playOnce(ctx.currentTime + 0.05, loopLength, () => {
    playBtn.textContent = 'PLAY';
  });
  if (!ok) {
    playBtn.textContent = 'PLAY';
    showStatus('no audio');
  }
}

document.getElementById('rec').addEventListener('click', onRec);
playBtn.addEventListener('click', onPlay);
