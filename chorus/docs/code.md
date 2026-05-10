CODE GUIDE

MODULE MAP

audio.js    — AudioContext singleton (init, unlock, getAudioCtx); measurePeak, computeGain
recorder.js — mic access (getUserMedia), MediaRecorder lifecycle, blob collection
storage.js  — IndexedDB `takes` store: save, load, delete last, clear, update offset
playback.js — decode buffers, schedule on AudioContext clock, per-track GainNodes, cancel token
ui.js       — button text/class, status display (auto-hide 3s), nudge label
app.js      — state machine; wires all modules; owns all mutable top-level state
sw.js       — service worker; caches core assets for offline


STATE

app.js owns:
  trackLength     — loop duration T (seconds); null until first take finishes
  takeCount       — number of saved takes
  nudgeOffset     — start offset for next/last take (seconds); loaded from last IDB take on startup
  recState        — 'idle' | 'countdown' | 'recording'
  countdownInterval, startTimeout, stopTimeout — timer handles; cleared together via clearTimers()

recorder.js owns:  micStream, mediaRecorder, chunks, recT0
playback.js owns:  masterGain, activeSources, _playing, _preloaded, _cancelToken


IDB TAKE RECORD

{ id, blob, createdAt, duration, peak, gain, offset }
  duration — always trackLength (T), not the raw recorded duration
  peak     — peak amplitude measured after decode (0–1)
  gain     — normalization scalar applied at playback (computeGain output)
  offset   — nudge in seconds; positive = start later


TIMING MODEL

AudioContext clock is the sole timing source.
Countdown is DELAY_SEC=3s via setTimeout/setInterval (wall clock).
Playback scheduled at: startAt = ctx.currentTime + DELAY_SEC
Playback started outputLatency seconds early so audio reaches ears exactly at startAt.
Per-track start: absoluteStart = t + offset
  If absoluteStart < now → src.start(now, now - absoluteStart)  [skip into buffer to catch up]
  Otherwise             → src.start(absoluteStart)
stopPlayback() increments _cancelToken to invalidate any in-flight buffer loads.


GAIN NORMALIZATION

Target: −6 dBFS (TARGET_AMP ≈ 0.501).
After each take: measurePeak scans channel 0, computeGain returns min(TARGET_AMP/peak, MAX_GAIN=10).
Near-silence (peak < 1e-5) → gain=1 (no normalization).
gain stored in IDB record; applied via per-track GainNode at playback time.


KEY INVARIANTS

trackLength set once from first recording; never updated after that.
All takes store duration=trackLength, not their own decoded duration.
nudgeOffset is loaded from the last IDB take on startup, not from a separate key.
No mic audio routed to output (no monitor path).
Blob size capped at 10MB in saveTake.
