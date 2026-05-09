TASK T5 track1 loop

GOAL
record first take → define loop length T

INPUT
- blob from MediaRecorder (T3)
- AudioContext (T1)

STATE
- let loopT = null
- let track1Blob = null

STEP 1 stop hook
- on MediaRecorder.stop:
  if no existing tracks:
    assign blob → track1Blob
    proceed T calc

STEP 2 decode
- blob → ArrayBuffer
- audioCtx.decodeAudioData → AudioBuffer buf

STEP 3 compute T
- T = buf.duration (sec)
- if T > 30 → T = 30 (truncate later in playback)
- store loopT

STEP 4 persist
- save blob + loopT in IndexedDB (store: takes, key=1)

STEP 5 memory
- keep buf in memory (track1Buffer)

STEP 6 guard
- if decode fail → alert("decode fail")
- if T < 0.5 → alert("too short") + discard

AC (mobile visible)
- after first record stop:
  alert("T=" + loopT.toFixed(2) + "s")
- if >30s input:
  alert("capped 30s")
- reload page:
  alert("restored T=" + stored loopT)
- if too short:
  alert("too short")

DONE