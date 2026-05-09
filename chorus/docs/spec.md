APP: minimal multitrack overdub recorder (mobile web, static)

GOAL
Fast chorus stacking. Amateur use. Zero config.

PLATFORM
Mobile browser. PWA (offline cache). No backend.

AUDIO CORE
APIs: Web Audio API (clock/playback), MediaRecorder API (capture).
Format: mono, 44.1kHz.
Tracks: max 4.
Storage: IndexedDB (per-take blobs, saved immediately).

TIMING MODEL
No BPM/grid.
Track1 defines loop length T.
All tracks align to same start time using AudioContext clock.
Start = scheduled (now + fixed countdown).
Stop = auto at T.
Loop playback continuous.

FLOW
Open app →
Tap REC →
Request mic permission →
Countdown (fixed, e.g. 3s) →
Record Track1 →
Auto-stop at T →
Auto-loop playback →
Tap REC again →
Countdown →
Record Track2 aligned to loop start →
Repeat until max 4 tracks.

UI
Single screen.
Buttons: REC, PLAY/STOP, EXPORT.
Display: loop progress ring + track count (n/4).
No track list. No mute/solo. No sliders. No waveform.

MONITORING
No live input monitoring. Playback only previous tracks.
Headphones recommended.

LEVEL HANDLING
After each take:
- measure peak
- normalize to target (≈ -6 dB)
Master:
- soft limiter on output

INPUT
Default mic only.
Constraints requested: echoCancellation=false, noiseSuppression=false, autoGainControl=false.

ERROR HANDLING
If mic denied/fail → show simple retry message.

STORAGE
IndexedDB:
- save each take after record
- chunk if needed
- lazy load active buffers
Risks: quota/eviction/perf → mitigate via short loops, 4 tracks, mono.

EXPORT
Manual EXPORT button.
Render via OfflineAudioContext.
Output: single mixed WAV (44.1kHz).
Optional: Web Share API.

LIMITS
Loop length: max ~30s (safety cap).
Session: single only (no projects).
Undo: last take only.

BACKGROUND
No handling. User keeps app foreground.

VISUALS
Minimal. No metronome. No grid. No tempo.

AUDIO GRAPH
Playback:
Track buffers → gain (per track fixed) → master gain → limiter → output.
Recording:
Mic stream → MediaRecorder (no monitor path).

ALIGNMENT
All recordings scheduled start at same relative loop start time.
No drift correction beyond this.

NON-GOALS
No effects, no editing, no trim, no multi-session, no cloud.

RELIABILITY NOTES
Use async for IndexedDB.
Test iOS Safari first.
Keep memory small (mono, short T, ≤4 tracks).

END
