window.onerror = (msg, src, line, col, err) => {
  alert(`Error: ${msg}\n${src}:${line}:${col}\n${err?.stack ?? ''}`);
};
window.addEventListener('unhandledrejection', (e) => {
  alert(`Unhandled rejection: ${e.reason?.stack ?? e.reason}`);
});

import { ensureAudio, unlockAudio, getAudioCtx } from './audio.js';
import { getMic, getMicStream, initRecorder, startRec, stopRec, hasMic, hasRecorder } from './recorder.js';
import { showStatus, setRecording, setCountdown } from './ui.js';
import { initDB, saveTake } from './storage.js';
import { startLoop, stopLoop, isLooping, getLoopStartTime, getLoopDuration } from './playback.js';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js');
  });
}

const DELAY_SEC = 3;
let recState = 'idle'; // 'idle' | 'countdown' | 'recording'
let countdownInterval = null;
let startTimeout = null;
let recTimer = null;
let _recStartTime = 0;
let _recStopTime = 0;
const playBtn = document.getElementById('play');

initDB();

function getNextLoopStart(now) {
  const T = getLoopDuration();
  const elapsed = now - getLoopStartTime();
  const loopsPassed = Math.ceil(elapsed / T);
  return getLoopStartTime() + loopsPassed * T;
}

function cancelCountdown() {
  clearInterval(countdownInterval);
  clearTimeout(startTimeout);
  clearTimeout(recTimer);
  countdownInterval = null;
  startTimeout = null;
  recTimer = null;
  recState = 'idle';
  setRecording(false);
  setCountdown(null);
}

function startCountdownUI() {
  let remaining = DELAY_SEC;
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
}

function onStart() {
  const actualStart = getAudioCtx().currentTime;
  startRec();
  recState = 'recording';
  recTimer = setTimeout(onRecStop, (_recStopTime - actualStart) * 1000);
}

async function onRecStop() {
  clearTimeout(recTimer);
  recTimer = null;
  const result = await stopRec();
  recState = 'idle';
  setRecording(false);
  if (result) {
    const arrayBuffer = await result.blob.arrayBuffer();
    let buf;
    try {
      buf = await getAudioCtx().decodeAudioData(arrayBuffer);
    } catch {
      alert('decode fail');
      return;
    }
    const T = buf.duration;
    if (T < 0.5) {
      alert('too short');
      return;
    }
    await saveTake(result.blob, { duration: T, peak: 0, gain: 1 });
  }
}

async function onRec() {
  if (recState === 'countdown') {
    cancelCountdown();
    return;
  }
  if (recState === 'recording') {
    await onRecStop();
    return;
  }

  await ensureAudio();
  await unlockAudio();

  if (!hasMic()) {
    try {
      await getMic();
    } catch {
      showStatus('mic failed, retry');
      return;
    }
  }

  if (!hasRecorder()) {
    initRecorder(getMicStream());
  }

  const ctx = getAudioCtx();
  const now = ctx.currentTime;
  recState = 'countdown';
  setRecording(true);

  if (isLooping()) {
    // n>1: recording starts exactly at loop boundary, countdown leads into it
    const T = getLoopDuration();
    let nextBoundary = getNextLoopStart(now);
    if (nextBoundary - now < 0.1) { // AC5: drift guard — very late tap
      nextBoundary += T;
    } else if (nextBoundary - now < DELAY_SEC) { // not enough room for countdown
      nextBoundary += T;
    }
    _recStartTime = nextBoundary;
    _recStopTime = nextBoundary + T;

    // countdown ends at boundary, so start it DELAY_SEC before
    setTimeout(() => {
      if (recState !== 'countdown') return;
      startCountdownUI();
    }, (nextBoundary - DELAY_SEC - now) * 1000);
  } else {
    // n=1: simple countdown from now, user stops manually (30s safety)
    _recStartTime = now + DELAY_SEC;
    _recStopTime = _recStartTime + 30;
    startCountdownUI();
  }

  startTimeout = setTimeout(() => {
    startTimeout = null;
    onStart();
  }, (_recStartTime - ctx.currentTime) * 1000);
}

async function onPlay() {
  await ensureAudio();
  if (isLooping()) {
    stopLoop();
    playBtn.textContent = 'PLAY';
  } else {
    await startLoop();
    if (isLooping()) {
      playBtn.textContent = 'STOP';
    }
  }
}

document.getElementById('rec').addEventListener('click', onRec);
playBtn.addEventListener('click', onPlay);
