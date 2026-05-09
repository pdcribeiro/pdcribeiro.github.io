TASK T1 audio init

GOAL
AudioContext ready, global clock usable

FILES
/ app.js

STEP 1 create ctx
- let audioCtx = null
- fn initAudio():
  if !audioCtx → audioCtx = new (window.AudioContext||window.webkitAudioContext)({sampleRate:44100})

STEP 2 resume on gesture
- AudioContext starts suspended (iOS)
- fn unlockAudio():
  if audioCtx.state !== 'running' → await audioCtx.resume()

STEP 3 bind gesture
- on first user tap (REC or PLAY):
  call initAudio()
  call unlockAudio()
- ensure runs once (flag)

STEP 4 clock ref
- fn now():
  return audioCtx.currentTime

STEP 5 export globals
- store audioCtx, now in module/global scope

STEP 6 test
- tap button → audioCtx.state === 'running'
- console log now() increments

DONE