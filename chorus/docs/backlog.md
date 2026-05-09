BACKLOG (ordered, dep→prio)

T0 scaffold
- static PWA shell (HTML/CSS/JS)
- manifest + SW (cache core)
- mobile-first viewport

T1 audio init
- create AudioContext
- resume on user gesture
- global clock ref

T2 mic access
- getUserMedia({audio:{ec:false,ns:false,agc:false}})
- permission flow + retry UI

T3 recording core
- MediaRecorder setup (mono)
- start/stop control fn
- collect blobs

T4 storage
- IndexedDB schema (takes store)
- save blob per take async
- load/delete last take

T5 track1 loop
- record first take
- compute T (duration)
- cap T ≤30s
- persist T

T6 playback engine
- decode blobs → AudioBuffer
- schedule loop via AudioContext
- continuous loop (bufferSource restart)

T7 countdown scheduler
- fixed delay (3s)
- schedule start = now + delay
- sync with AudioContext time

T8 overdub alignment
- on REC n>1: schedule start at next loop boundary
- stop at T
- ensure phase match

T9 track limit
- max 4 tracks guard
- UI reflect n/4

T10 gain normalize
- after each take: scan peak
- apply gain → target ≈ -6dB
- store gain value

T11 mix graph
- per-track gain nodes (fixed)
- sum → master gain
- soft limiter node
- connect to destination

T12 no monitor path
- ensure mic not routed to output
- playback only existing tracks

T13 UI base
- single screen layout
- buttons: REC, PLAY/STOP, EXPORT
- progress ring (loop phase)
- track counter

T14 transport control
- PLAY/STOP toggle loop engine
- REC state machine (idle/count/rec)

T15 undo last
- remove last take (IDB + memory)
- update n, graph

T16 export render
- OfflineAudioContext mix all tracks
- apply gains + limiter
- render WAV 44.1kHz

T17 export share
- create blob URL
- Web Share API if avail
- fallback download

T18 lazy load
- load only active buffers
- release unused

T19 error handling
- mic fail/denied message
- recorder fail fallback
- IDB errors simple notify

T20 perf guard
- enforce mono, ≤4 tracks, ≤30s
- memory checks

T21 iOS safari fixes
- touch unlock AudioContext
- MediaRecorder polyfills if needed

T22 background note
- detect visibilitychange
- warn user if background

T23 visuals polish
- minimal styles
- ring animation tied to clock

T24 test suite
- manual flows: record/overdub/export
- edge: short T, max tracks, undo

END
