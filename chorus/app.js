window.onerror = (msg, src, line, col, err) => {
  alert(`Error: ${msg}\n${src}:${line}:${col}\n${err?.stack ?? ''}`);
};
window.addEventListener('unhandledrejection', (e) => {
  alert(`Unhandled rejection: ${e.reason?.stack ?? e.reason}`);
});

import { ensureAudio } from './audio.js';
import { getMic, getMicStream, initRecorder, startRec, stopRec, hasMic, hasRecorder, recording } from './recorder.js';
import { showStatus, setRecording } from './ui.js';
import { initDB, saveTake, getAllTakes, deleteLastTake, sizeEstimate } from './storage.js';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js');
  });
}

initDB();

let lastResult = null;

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
    const result = await stopRec();
    setRecording(false);
    if (result) {
      lastResult = result;
      alert(`duration: ${result.duration.toFixed(2)}s\nblob: ${result.blob.size} bytes`);
    }
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

document.getElementById('save').addEventListener('click', async () => {
  if (!lastResult) { alert('no recording yet'); return; }
  const id = await saveTake(lastResult.blob, { duration: lastResult.duration, peak: 0, gain: 1 });
  alert('saved id:' + id);
});

document.getElementById('list').addEventListener('click', async () => {
  const takes = await getAllTakes();
  alert('takes:' + takes.length);
});

document.getElementById('del-last').addEventListener('click', async () => {
  const remaining = await deleteLastTake();
  alert('takes:' + remaining.length);
});

document.getElementById('size').addEventListener('click', async () => {
  const bytes = await sizeEstimate();
  alert('bytes:' + bytes);
});
