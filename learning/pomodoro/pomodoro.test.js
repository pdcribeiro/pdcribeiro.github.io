// Tests for the pomodoro app

import { test, eq } from '../test/test.js'
import { PHASES, pomodoro } from './pomodoro.js'

const config = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    workCountUntilLongBreak: 4,
}
const startTimestamp = 1234567890123
const oneSecondTimestamp = startTimestamp + 1000

test({
    // init()
    'init() sets state correctly': () => {
        const state = pomodoro.init(config)
        eq(state.phase, PHASES.work)
        eq(state.timerRunning, false)
        eq(state.timeRemaining, config.workDuration * 60)
        eq(state.workCount, 0)
    },
    // start() and pause()
    'if timer is stopped, start() starts it': () => {
        const state = pomodoro.init(config)
            .start(startTimestamp)
        eq(state.timerRunning, true)
    },
    'if timer is running, pause() pauses it': () => {
        const state = pomodoro.init(config)
            .start(startTimestamp)
            .pause()
        eq(state.timerRunning, false)
    },
    'if timer is paused, start() starts it': () => {
        const state = pomodoro.init(config)
            .start(startTimestamp)
            .pause()
            .start(startTimestamp)
        eq(state.timerRunning, true)
    },
    // tick()
    'if timer is stopped, tick() does not change time remaining': () => {
        const state = pomodoro.init(config)
            .tick(oneSecondTimestamp)
        eq(state.timeRemaining, config.workDuration * 60)
    },
    'if timer is running, tick() decrements time remaining': () => {
        const state = pomodoro.init(config)
            .start(startTimestamp)
            .tick(oneSecondTimestamp)
        eq(state.timeRemaining, config.workDuration * 60 - 1)
    },
    'if timer is paused, tick() does not change time remaining': () => {
        const state = pomodoro.init(config)
            .start(startTimestamp)
            .pause()
            .tick(oneSecondTimestamp)
        eq(state.timeRemaining, config.workDuration * 60)
    },
    'if time remaining is zero, tick() moves to next phase': () => {
        const state = pomodoro.init({ ...config, workDuration: 1 / 60 })
            .start(startTimestamp)
            .tick(startTimestamp + 1000)
        eq(state.phase, PHASES.break)
        eq(state.timerRunning, false)
        eq(state.timeRemaining, config.shortBreakDuration * 60)
        eq(state.workCount, 1)
    },
    // nextPhase()
    'if working, nextPhase() updates state correctly': () => {
        const state = pomodoro.init(config)
            .start(startTimestamp)
            .tick(oneSecondTimestamp)
            .nextPhase()
        eq(state.phase, PHASES.break)
        eq(state.timerRunning, false)
        eq(state.timeRemaining, config.shortBreakDuration * 60)
        eq(state.workCount, 1)
    },
    'if on break, nextPhase() updates state correctly': () => {
        const state = pomodoro.init(config)
            .start(startTimestamp)
            .nextPhase()
            .tick(oneSecondTimestamp)
            .nextPhase()
        eq(state.phase, PHASES.work)
        eq(state.timerRunning, false)
        eq(state.timeRemaining, config.workDuration * 60)
        eq(state.workCount, 1)
    },
    'if next is long break, nextPhase() updates state correctly': () => {
        const state = pomodoro.init({ ...config, workCountUntilLongBreak: 1 })
            .start(startTimestamp)
            .tick(oneSecondTimestamp)
            .nextPhase()
        eq(state.phase, PHASES.break)
        eq(state.timerRunning, false)
        eq(state.timeRemaining, config.longBreakDuration * 60)
        eq(state.workCount, 1)
    },
    // stop()
    'if timer is running, stop() stops it and resets time': () => {
        const state = pomodoro.init(config)
            .start(startTimestamp)
            .tick(oneSecondTimestamp)
            .stop()
        eq(state.timerRunning, false)
        eq(state.timeRemaining, config.workDuration * 60)
    },
    'if on break, stop() resets time correctly': () => {
        const state = pomodoro.init(config)
            .start(startTimestamp)
            .nextPhase()
            .tick(oneSecondTimestamp)
            .stop()
        eq(state.timerRunning, false)
        eq(state.timeRemaining, config.shortBreakDuration * 60)
    },
    'if on long break, stop() resets time correctly': () => {
        const state = pomodoro.init({ ...config, workCountUntilLongBreak: 1 })
            .start(startTimestamp)
            .nextPhase()
            .tick(oneSecondTimestamp)
            .stop()
        eq(state.timerRunning, false)
        eq(state.timeRemaining, config.longBreakDuration * 60)
    },
    'if timer is paused, stop() resets time': () => {
        const state = pomodoro.init(config)
            .start(startTimestamp)
            .tick(oneSecondTimestamp)
            .pause()
            .stop()
        eq(state.timerRunning, false)
        eq(state.timeRemaining, config.workDuration * 60)
    },
    // prevPhase()
    'if on break, prevPhase() updates state correctly': () => {
        const state = pomodoro.init(config)
            .start(startTimestamp) // work
            .nextPhase() // break
            .tick(oneSecondTimestamp)
            .prevPhase() // work
        eq(state.phase, PHASES.work)
        eq(state.timerRunning, false)
        eq(state.timeRemaining, config.workDuration * 60)
        eq(state.workCount, 0)
    },
    'if working, prevPhase() updates state correctly': () => {
        const state = pomodoro.init(config)
            .start(startTimestamp) // work
            .nextPhase() // break
            .nextPhase() // work
            .tick(oneSecondTimestamp)
            .prevPhase() // break
        eq(state.phase, PHASES.break)
        eq(state.timerRunning, false)
        eq(state.timeRemaining, config.shortBreakDuration * 60)
        eq(state.workCount, 1)
    },
    'if previous is long break, prevPhase() updates state correctly': () => {
        const state = pomodoro.init({ ...config, workCountUntilLongBreak: 1 })
            .start(startTimestamp) // work
            .nextPhase() // break
            .nextPhase() // work
            .tick(oneSecondTimestamp)
            .prevPhase() // break
        eq(state.phase, PHASES.break)
        eq(state.timerRunning, false)
        eq(state.timeRemaining, config.longBreakDuration * 60)
        eq(state.workCount, 1)
    },
})
