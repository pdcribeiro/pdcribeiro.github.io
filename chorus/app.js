window.onerror = (msg, src, line, col, err) => {
  alert(`Error: ${msg}\n${src}:${line}:${col}\n${err?.stack ?? ''}`);
};
window.addEventListener('unhandledrejection', (e) => {
  alert(`Unhandled rejection: ${e.reason?.stack ?? e.reason}`);
});

import { ensureAudio, getAudioCtx } from './audio.js';
import { getMic, getMicStream, initRecorder, startRec, stopRec, hasMic, hasRecorder } from './recorder.js';
import { showStatus, setRecording, setCountdown, showNudgeUI, hideNudgeUI, setNudgeLabel } from './ui.js';
import { initDB, saveTake, updateTakeOffset } from './storage.js';
import { preload, playOnce, stopPlayback, isPlaying } from './playback.js';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
}

const DELAY_SEC = 3;
const NUDGE_STEP = 0.02;
const playBtn = document.getElementById('play');

let trackLength = null; // seconds; set when first track stops
let recState = 'idle';  // 'idle' | 'countdown' | 'recording'
let countdownInterval = null;
let startTimeout = null;
let stopTimeout = null;
let nudgeId = null;
let nudgeOffset = 0;
let nudgeIdleTimer = null;

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

async function confirmNudge() {
  if (nudgeId === null) return;
  clearTimeout(nudgeIdleTimer);
  nudgeIdleTimer = null;
  await updateTakeOffset(nudgeId, nudgeOffset);
  nudgeId = null;
  nudgeOffset = 0;
  hideNudgeUI();
}

function resetNudgeIdle() {
  clearTimeout(nudgeIdleTimer);
  nudgeIdleTimer = setTimeout(confirmNudge, 10000);
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
  const isOverdub = trackLength !== null;
  if (!trackLength) {
    trackLength = T;
  }
  const id = await saveTake(result.blob, { duration: trackLength, peak: 0, gain: 1, offset: 0 });
  showStatus(`saved (${trackLength.toFixed(1)}s)`);
  if (isOverdub) {
    nudgeId = id;
    nudgeOffset = 0;
    showNudgeUI(0);
    resetNudgeIdle();
  }
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
  if (nudgeId !== null) {
    await confirmNudge();
  }

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
  const nudgeOverride = nudgeId !== null ? { id: nudgeId, offset: nudgeOffset } : null;
  const ok = await playOnce(trackLength, () => {
    playBtn.textContent = 'PLAY';
  }, undefined, nudgeOverride);
  if (!ok) {
    playBtn.textContent = 'PLAY';
    showStatus('no audio');
  }
}

document.getElementById('rec').addEventListener('click', onRec);
playBtn.addEventListener('click', onPlay);

document.getElementById('nudge-earlier').addEventListener('click', () => {
  if (nudgeId === null) return;
  nudgeOffset = Math.max(-1, nudgeOffset - NUDGE_STEP);
  setNudgeLabel(nudgeOffset);
  resetNudgeIdle();
});

document.getElementById('nudge-later').addEventListener('click', () => {
  if (nudgeId === null) return;
  nudgeOffset = Math.min(1, nudgeOffset + NUDGE_STEP);
  setNudgeLabel(nudgeOffset);
  resetNudgeIdle();
});
