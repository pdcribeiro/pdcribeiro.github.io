import { ensureAudio } from './audio.js';
import { getMic, getMicStream, initRecorder, startRec, stopRec, hasMic, hasRecorder, recording } from './recorder.js';
import { showStatus } from './ui.js';

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
  } else {
    startRec();
  }
}

async function onPlay() {
  await ensureAudio();
}

document.getElementById('rec').addEventListener('click', onRec);
document.getElementById('play').addEventListener('click', onPlay);
