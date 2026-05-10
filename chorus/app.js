window.onerror = (msg, src, line, col, err) => {
  alert(`Error: ${msg}\n${src}:${line}:${col}\n${err?.stack ?? ''}`);
};
window.addEventListener('unhandledrejection', (e) => {
  alert(`Unhandled rejection: ${e.reason?.stack ?? e.reason}`);
});

import { ensureAudio, getAudioCtx } from './audio.js';
import { getMic, getMicStream, initRecorder, startRec, stopRec, hasMic, hasRecorder } from './recorder.js';
import { showStatus, setRecording, setCountdown, setNudgeLabel } from './ui.js';
import { initDB, getAllTakes, saveTake, updateLastTakeOffset } from './storage.js';
import { preload, playOnce, stopPlayback, isPlaying } from './playback.js';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
}

const DELAY_SEC = 3;
const NUDGE_STEP = 0.02;
const playBtn = document.getElementById('play');

let trackLength = null; // seconds; set when first track stops
let takeCount = 0;
let nudgeOffset = 0;
let recState = 'idle';  // 'idle' | 'countdown' | 'recording'
let countdownInterval = null;
let startTimeout = null;
let stopTimeout = null;

initDB().then(async () => {
  const takes = await getAllTakes();
  takeCount = takes.length;
  if (takes.length > 0) trackLength = takes[0].duration;
  if (takes.length > 0) nudgeOffset = takes[takes.length - 1].offset ?? 0;
  setNudgeLabel(nudgeOffset);
  updateControls();
});

function updateControls() {
  const idle = recState === 'idle';
  document.getElementById('play').disabled = takeCount < 1 || !idle;
  document.getElementById('nudge-earlier').disabled = takeCount < 2 || !idle;
  document.getElementById('nudge-later').disabled = takeCount < 2 || !idle;
}

updateControls();

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
  updateControls();
}

async function finishRecording() {
  clearTimers();
  const result = await stopRec();
  recState = 'idle';
  setRecording(false);
  setCountdown(null);
  stopPlayback();
  if (!result) { updateControls(); return; }

  let buf;
  try {
    buf = await getAudioCtx().decodeAudioData(await result.blob.arrayBuffer());
  } catch {
    showStatus('decode fail');
    updateControls();
    return;
  }
  const T = buf.duration;
  if (T < 0.5) {
    showStatus('too short');
    updateControls();
    return;
  }
  if (!trackLength) trackLength = T;
  await saveTake(result.blob, { duration: trackLength, peak: 0, gain: 1, offset: nudgeOffset });
  takeCount++;
  setNudgeLabel(nudgeOffset);
  showStatus(`saved (${trackLength.toFixed(1)}s)`);
  updateControls();
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
  updateControls();

  if (trackLength) {
    // Schedule monitoring playback outputLatency seconds early so the singer
    // hears audio exactly when recording starts, not outputLatency ms later.
    const ctx = getAudioCtx();
    const outputLatency = ctx.outputLatency ?? ctx.baseLatency ?? 0;
    const startAt = ctx.currentTime + DELAY_SEC;
    preload();
    playOnce(trackLength, null, startAt - outputLatency);
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

document.getElementById('nudge-earlier').addEventListener('click', () => {
  nudgeOffset = Math.max(-1, nudgeOffset - NUDGE_STEP);
  setNudgeLabel(nudgeOffset);
  updateLastTakeOffset(nudgeOffset);
});

document.getElementById('nudge-later').addEventListener('click', () => {
  nudgeOffset = Math.min(1, nudgeOffset + NUDGE_STEP);
  setNudgeLabel(nudgeOffset);
  updateLastTakeOffset(nudgeOffset);
});
