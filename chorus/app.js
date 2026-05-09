window.onerror = (msg, src, line, col, err) => {
  alert(`Error: ${msg}\n${src}:${line}:${col}\n${err?.stack ?? ''}`);
};
window.addEventListener('unhandledrejection', (e) => {
  alert(`Unhandled rejection: ${e.reason?.stack ?? e.reason}`);
});

import { ensureAudio } from './audio.js';
import { getMic, getMicStream, initRecorder, startRec, stopRec, hasMic, hasRecorder, recording } from './recorder.js';
import { showStatus, setRecording } from './ui.js';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js');
  });
}

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
    stopRec();
    setRecording(false);
  } else {
    startRec();
    setRecording(true);
  }
}

async function onPlay() {
  await ensureAudio();
}

document.getElementById('rec').addEventListener('click', onRec);
document.getElementById('play').addEventListener('click', onPlay);
