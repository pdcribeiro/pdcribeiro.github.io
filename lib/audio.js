import { wait } from '/lib/utils.js';

const SOUND_DURATION = 200;

export async function repeatSound(repetitions) {
  const ctx = new AudioContext();
  for (let i = 0; i < repetitions; i++) {
    await playSound(SOUND_DURATION, ctx);
    await wait(SOUND_DURATION);
  };
}

function playSound(duration, audioContext) {
  return new Promise((resolve) => {
    const osc = audioContext.createOscillator();
    osc.connect(audioContext.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      resolve();
    }, duration);
  });
}