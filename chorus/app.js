window.onerror = (msg, src, line, col, err) => {
  alert(`Error: ${msg}\n${src}:${line}:${col}\n${err?.stack ?? ''}`);
};
window.addEventListener('unhandledrejection', (e) => {
  alert(`Unhandled rejection: ${e.reason?.stack ?? e.reason}`);
});

import { ensureAudio, getAudioCtx } from './audio.js';
import { getMic, getMicStream, initRecorder, startRec, stopRec, hasMic, hasRecorder, recording } from './recorder.js';
import { showStatus, setRecording } from './ui.js';
import { initDB, saveTake } from './storage.js';
import { startLoop, stopLoop, isLooping } from './playback.js';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js');
  });
}

let recTimer = null;
const playBtn = document.getElementById('play');

initDB();

async function onRec() {
  await ensureAudio();

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

  if (recording()) {
    clearTimeout(recTimer);
    recTimer = null;
    const result = await stopRec();
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
  } else {
    startRec();
    setRecording(true);
    recTimer = setTimeout(onRec, 30_000);
  }
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
