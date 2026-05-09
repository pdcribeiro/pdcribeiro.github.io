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
import { startLoop, stopLoop, isLooping } from './playback.js';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js');
  });
}

const DELAY_SEC = 3;
let recState = 'idle'; // 'idle' | 'countdown' | 'recording'
let startTime = 0;
let countdownInterval = null;
let startTimeout = null;
let recTimer = null;
const playBtn = document.getElementById('play');

initDB();

function cancelCountdown() {
  clearInterval(countdownInterval);
  clearTimeout(startTimeout);
  countdownInterval = null;
  startTimeout = null;
  recState = 'idle';
  setRecording(false);
  setCountdown(null);
}

function onStart() {
  recState = 'recording';
  alert('START t=' + startTime.toFixed(2));
  startRec();
  recTimer = setTimeout(onRecStop, 30_000);
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
    alert('T=' + T.toFixed(2) + 's');
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

  startTime = getAudioCtx().currentTime + DELAY_SEC;
  recState = 'countdown';
  setRecording(true);

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

  startTimeout = setTimeout(() => {
    startTimeout = null;
    onStart();
  }, DELAY_SEC * 1000);
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
