window.onerror = (msg, src, line, col, err) => {
  alert(`Error: ${msg}\n${src}:${line}:${col}\n${err?.stack ?? ''}`);
};
window.addEventListener('unhandledrejection', (e) => {
  alert(`Unhandled rejection: ${e.reason?.stack ?? e.reason}`);
});

import { ensureAudio, getAudioCtx } from './audio.js';
import { getMic, getMicStream, initRecorder, startRec, stopRec, hasMic, hasRecorder, recording } from './recorder.js';
import { showStatus, setRecording } from './ui.js';
import { initDB, saveTake, getAllTakes } from './storage.js';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js');
  });
}

let loopT = null;
let track1Buffer = null;

initDB().then(async () => {
  const takes = await getAllTakes();
  if (takes.length > 0 && takes[0].duration != null) {
    loopT = takes[0].duration;
    alert('restored T=' + loopT.toFixed(2) + 's');
  }
});

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
      const takes = await getAllTakes();
      if (takes.length === 0) {
        const arrayBuffer = await result.blob.arrayBuffer();
        let buf;
        try {
          buf = await getAudioCtx().decodeAudioData(arrayBuffer);
        } catch {
          alert('decode fail');
          return;
        }
        let T = buf.duration;
        if (T < 0.5) {
          alert('too short');
          return;
        }
        const capped = T > 30;
        if (capped) T = 30;
        loopT = T;
        track1Buffer = buf;
        await saveTake(result.blob, { duration: loopT, peak: 0, gain: 1 });
        if (capped) alert('capped 30s');
        alert('T=' + loopT.toFixed(2) + 's');
      }
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
