TASK T2 mic access

GOAL
mic stream ready, permission flow handled

FILES
/ app.js

STEP 1 constraints
- const audioConstraints = {
  audio:{
    echoCancellation:false,
    noiseSuppression:false,
    autoGainControl:false,
    channelCount:1,
    sampleRate:44100
  }
}

STEP 2 state
- let micStream = null

STEP 3 request fn
- async fn getMic():
  try:
    micStream = await navigator.mediaDevices.getUserMedia(audioConstraints)
    return micStream
  catch(e):
    micStream = null
    throw e

STEP 4 UI trigger
- on REC tap:
  if !micStream → call getMic()
  handle promise before recording start

STEP 5 error handling
- catch error → show simple message ("mic failed, retry")
- allow retry on next REC tap

STEP 6 test
- first REC → permission prompt
- allow → micStream active
- deny → message shown, retry works

DONE