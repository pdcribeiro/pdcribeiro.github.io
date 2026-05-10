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
import { preload, playOnce, stopPlayback, isPlaying } from './playback.js';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
}

const DELAY_SEC = 3;
const playBtn = document.getElementById('play');

let trackLength = null; // seconds; set when first track stops
let recState = 'idle';  // 'idle' | 'countdown' | 'recording'
let countdownInterval = null;
let startTimeout = null;
let stopTimeout = null;

initDB();

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
  if (!trackLength) {
    trackLength = T;
  }
  await saveTake(result.blob, { duration: trackLength, peak: 0, gain: 1 });
  showStatus(`saved (${trackLength.toFixed(1)}s)`);
}

function startCountdownUI(onDone) {
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
    onDone();
  }, DELAY_SEC * 1000);
}

async function onRec() {
  if (recState === 'countdown') {
    cancelCountdown();
    return;
  }
  if (recState === 'recording') {
    if (!trackLength) {
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

  recState = 'countdown';
  setRecording(true);

  if (trackLength) {
    // Pre-schedule playback to start exactly when countdown ends.
    // Scheduling 3 s in advance gives Web Audio precise timing with no extra delay.
    const startAt = getAudioCtx().currentTime + DELAY_SEC;
    preload();
    playOnce(trackLength, null, startAt); // resolves before startAt; not awaited
  }

  startCountdownUI(() => {
    recState = 'recording';
    startRec(); // fires at ~startAt; playback already scheduled

    if (trackLength) {
      stopTimeout = setTimeout(async () => {
        stopTimeout = null;
        await finishRecording();
      }, trackLength * 1000);
    }
  });
}

async function onPlay() {
  if (recState !== 'idle') return;
  await ensureAudio();

  if (isPlaying()) {
    stopPlayback();
    playBtn.textContent = 'PLAY';
    return;
  }

  if (!trackLength) {
    showStatus('no tracks');
    return;
  }

  playBtn.textContent = 'STOP';
  const ok = await playOnce(trackLength, () => {
    playBtn.textContent = 'PLAY';
  });
  if (!ok) {
    playBtn.textContent = 'PLAY';
    showStatus('no audio');
  }
}

document.getElementById('rec').addEventListener('click', onRec);
playBtn.addEventListener('click', onPlay);
