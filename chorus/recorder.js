const MIC_CONSTRAINTS = {
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    channelCount: 1,
    sampleRate: 44100,
  },
};

let micStream = null;
let mediaRecorder = null;
let chunks = [];
let recT0 = 0;

export async function getMic() {
  try {
    micStream = await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS);
    return micStream;
  } catch (e) {
    micStream = null;
    throw e;
  }
}

export function initRecorder(stream) {
  const preferred = 'audio/webm;codecs=opus';
  const mime = MediaRecorder.isTypeSupported(preferred) ? preferred : '';
  mediaRecorder = new MediaRecorder(stream, mime ? { mimeType: mime } : {});

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  mediaRecorder.onstart = () => {
    chunks = [];
    recT0 = performance.now();
  };
}

export function startRec() {
  if (!mediaRecorder || mediaRecorder.state === 'recording') return;
  chunks = [];
  mediaRecorder.start();
}

export function stopRec() {
  if (!mediaRecorder || mediaRecorder.state !== 'recording') return Promise.resolve(null);
  return new Promise(resolve => {
    mediaRecorder.onstop = () => {
      const duration = (performance.now() - recT0) / 1000;
      resolve({ blob: getBlob(), duration });
    };
    mediaRecorder.stop();
  });
}

export function getBlob() {
  return new Blob(chunks, { type: mediaRecorder.mimeType });
}

export function getMicStream() {
  return micStream;
}

export function hasMic() {
  return micStream !== null;
}

export function hasRecorder() {
  return mediaRecorder !== null;
}

export function recording() {
  return mediaRecorder?.state === 'recording';
}
