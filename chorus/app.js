if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js');
  });
}

let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 });
  }
}

async function unlockAudio() {
  if (audioCtx.state !== 'running') {
    await audioCtx.resume();
  }
}

function now() {
  return audioCtx.currentTime;
}

let audioInited = false;

async function ensureAudio() {
  if (audioInited) return;
  audioInited = true;
  initAudio();
  await unlockAudio();
}

const audioConstraints = {
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    channelCount: 1,
    sampleRate: 44100
  }
};

let micStream = null;

async function getMic() {
  try {
    micStream = await navigator.mediaDevices.getUserMedia(audioConstraints);
    return micStream;
  } catch (e) {
    micStream = null;
    throw e;
  }
}

let mediaRecorder = null;
let chunks = [];
let isRecording = false;
let recT0 = 0;
let recDuration = 0;

function initRecorder(stream) {
  const preferred = 'audio/webm;codecs=opus';
  const mime = MediaRecorder.isTypeSupported(preferred) ? preferred : '';
  mediaRecorder = new MediaRecorder(stream, mime ? { mimeType: mime } : {});

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  mediaRecorder.onstart = () => {
    chunks = [];
    isRecording = true;
    recT0 = performance.now();
  };

  mediaRecorder.onstop = () => {
    isRecording = false;
    recDuration = (performance.now() - recT0) / 1000;
  };
}

function startRec() {
  if (isRecording) return;
  if (!mediaRecorder || mediaRecorder.state === 'recording') return;
  chunks = [];
  try {
    mediaRecorder.start();
  } catch (e) {
    showStatus('recorder start failed');
  }
}

function stopRec() {
  if (!isRecording) return;
  if (!mediaRecorder || mediaRecorder.state !== 'recording') return;
  try {
    mediaRecorder.stop();
  } catch (e) {
    showStatus('recorder stop failed');
  }
}

function getBlob() {
  return new Blob(chunks, { type: mediaRecorder.mimeType });
}

let statusEl = null;

function showStatus(msg) {
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.id = 'status';
    statusEl.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#333;color:#eee;padding:12px 20px;border-radius:8px;font-size:1rem;';
    document.body.appendChild(statusEl);
  }
  statusEl.textContent = msg;
  statusEl.style.display = 'block';
  clearTimeout(statusEl._t);
  statusEl._t = setTimeout(() => { statusEl.style.display = 'none'; }, 3000);
}

async function onRec() {
  await ensureAudio();
  if (!micStream) {
    try {
      await getMic();
    } catch (e) {
      showStatus('mic failed, retry');
      return;
    }
  }
  if (!mediaRecorder) {
    initRecorder(micStream);
  }
  if (isRecording) {
    stopRec();
  } else {
    startRec();
  }
}

document.getElementById('rec').addEventListener('click', onRec);
document.getElementById('play').addEventListener('click', ensureAudio);
