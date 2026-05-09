TASK T3 recording core

GOAL
capture mic → blobs via MediaRecorder

PREREQ
- T1 AudioContext ready
- T2 mic stream acquired

STATE
let mediaRecorder
let chunks = []
let isRecording = false

STEP 1 init recorder
- input: MediaStream (mic)
- mime = 'audio/webm;codecs=opus' (fallback if unsupported)
- mediaRecorder = new MediaRecorder(stream,{mimeType:mime})

STEP 2 events
- ondataavailable(e):
  if e.data.size>0 → chunks.push(e.data)
- onstart:
  chunks = []
  isRecording = true
- onstop:
  isRecording = false

STEP 3 start fn
fn startRec():
  if isRecording → return
  chunks = []
  mediaRecorder.start()

STEP 4 stop fn
fn stopRec():
  if !isRecording → return
  mediaRecorder.stop()

STEP 5 blob assemble
fn getBlob():
  return new Blob(chunks,{type:mediaRecorder.mimeType})

STEP 6 duration measure
- record t0 = performance.now() on start
- on stop → duration = (now - t0)/1000

STEP 7 guards
- handle mediaRecorder.state ('inactive','recording')
- try/catch start/stop

STEP 8 test
- startRec → speak → stopRec
- getBlob size >0
- duration sane

DONE