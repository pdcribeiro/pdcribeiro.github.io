// Tests for the pomodoro app

import { eq, test } from '../../lib/test/runner.js'
import { PHASES, TIMER_STATES, pomodoro } from './pomodoro.js'

const config = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    workCountUntilLongBreak: 4,
}
const startTimestamp = 1234567890123
const oneSecondTimestamp = startTimestamp + 1000

test({
    // initializing
    'initializes timer': () => {
        const state = pomodoro.init(config)
        eq(state.phase, PHASES.work)
        eq(state.timerState, TIMER_STATES.stopped)
        eq(state.timeRemaining, config.workDuration * 60)
        eq(state.workCount, 0)
    },
    // starting
    'starts timer': () => {
        const state = pomodoro.init(config)
            .start(startTimestamp)
        eq(state.timerState, TIMER_STATES.running)
    },
    // ticking
    'decrements time remaining': () => {
        const state = pomodoro.init(config)
            .start(startTimestamp)
            .tick(oneSecondTimestamp)
        eq(state.timeRemaining, config.workDuration * 60 - 1)
    },
    'does not decrement time when not running': () => {
        const state = pomodoro.init(config)
            .tick(oneSecondTimestamp)
        eq(state.timeRemaining, config.workDuration * 60)
    },
    'moves to next phase when time ends': () => {
        const state = pomodoro.init({ ...config, workDuration: 1 / 60 })
            .start(startTimestamp)
            .tick(startTimestamp + 1000)
        eq(state.phase, PHASES.break)
        eq(state.timerState, TIMER_STATES.stopped)
        eq(state.timeRemaining, config.shortBreakDuration * 60)
        eq(state.workCount, 1)
    },
    // pausing
    'pauses running timer': () => {
        const state = pomodoro.init(config)
            .start(startTimestamp)
            .pause()
        eq(state.timerState, TIMER_STATES.paused)
    },
    'starts paused timer': () => {
        const state = pomodoro.init(config)
            .start(startTimestamp)
            .pause()
            .start(startTimestamp)
        eq(state.timerState, TIMER_STATES.running)
    },
    'does not decrement time when paused': () => {
        const state = pomodoro.init(config)
            .start(startTimestamp)
            .pause()
            .tick(oneSecondTimestamp)
        eq(state.timeRemaining, config.workDuration * 60)
    },
    'does not reset time on pause': () => {
        const state = pomodoro.init(config)
            .start(startTimestamp)
            .tick(oneSecondTimestamp)
            .pause()
        eq(state.timeRemaining, config.workDuration * 60 - 1)
    },
    // stopping
    'stops running timer': () => {
        const state = pomodoro.init(config)
            .start(startTimestamp)
            .stop()
        eq(state.timerState, TIMER_STATES.stopped)
    },
    'starts stopped timer': () => {
        const state = pomodoro.init(config)
            .start(startTimestamp)
            .stop()
            .start(startTimestamp)
        eq(state.timerState, TIMER_STATES.running)
    },
    'stops paused timer': () => {
        const state = pomodoro.init(config)
            .start(startTimestamp)
            .pause()
            .stop()
        eq(state.timerState, TIMER_STATES.stopped)
    },
    'resets work time on stop': () => {
        const state = pomodoro.init(config)
            .start(startTimestamp)
            .tick(oneSecondTimestamp)
            .stop()
        eq(state.timeRemaining, config.workDuration * 60)
    },
    'resets short break time on stop': () => {
        const state = pomodoro.init(config)
            .start(startTimestamp)
            .nextPhase()
            .tick(oneSecondTimestamp)
            .stop()
        eq(state.timeRemaining, config.shortBreakDuration * 60)
    },
    'resets long break time on stop': () => {
        const state = pomodoro.init({ ...config, workCountUntilLongBreak: 1 })
            .start(startTimestamp)
            .nextPhase()
            .tick(oneSecondTimestamp)
            .stop()
        eq(state.timeRemaining, config.longBreakDuration * 60)
    },
    'does not decrement time when stopped': () => {
        const state = pomodoro.init(config)
            .start(startTimestamp)
            .stop()
            .tick(oneSecondTimestamp)
        eq(state.timeRemaining, config.workDuration * 60)
    },
    // moving to next phase
    'moves to short break': () => {
        const state = pomodoro.init(config)
            .start(startTimestamp)
            .tick(oneSecondTimestamp)
            .nextPhase()
        eq(state.phase, PHASES.break)
        eq(state.timerState, TIMER_STATES.stopped)
        eq(state.timeRemaining, config.shortBreakDuration * 60)
        eq(state.workCount, 1)
    },
    'moves to work': () => {
        const state = pomodoro.init(config)
            .start(startTimestamp)
            .nextPhase()
            .tick(oneSecondTimestamp)
            .nextPhase()
        eq(state.phase, PHASES.work)
        eq(state.timerState, TIMER_STATES.stopped)
        eq(state.timeRemaining, config.workDuration * 60)
        eq(state.workCount, 1)
    },
    'moves to long break': () => {
        const state = pomodoro.init({ ...config, workCountUntilLongBreak: 1 })
            .start(startTimestamp)
            .tick(oneSecondTimestamp)
            .nextPhase()
        eq(state.phase, PHASES.break)
        eq(state.timerState, TIMER_STATES.stopped)
        eq(state.timeRemaining, config.longBreakDuration * 60)
        eq(state.workCount, 1)
    },
    // moving to previous phase
    'does not move back when on first phase': () => {
        const state = pomodoro.init(config)
            .prevPhase()
        eq(state.phase, PHASES.work)
    },
    'moves back to work': () => {
        const state = pomodoro.init(config)
            .nextPhase()
            .prevPhase()
        eq(state.phase, PHASES.work)
        eq(state.timerState, TIMER_STATES.stopped)
        eq(state.timeRemaining, config.workDuration * 60)
        eq(state.workCount, 0)
    },
    'moves back to short break': () => {
        const state = pomodoro.init(config)
            .nextPhase()
            .nextPhase()
            .prevPhase()
        eq(state.phase, PHASES.break)
        eq(state.timerState, TIMER_STATES.stopped)
        eq(state.timeRemaining, config.shortBreakDuration * 60)
        eq(state.workCount, 1)
    },
    'moves back to long break': () => {
        const state = pomodoro.init({ ...config, workCountUntilLongBreak: 1 })
            .nextPhase()
            .nextPhase()
            .prevPhase()
        eq(state.phase, PHASES.break)
        eq(state.timerState, TIMER_STATES.stopped)
        eq(state.timeRemaining, config.longBreakDuration * 60)
        eq(state.workCount, 1)
    },
    'stops running timer instead of moving back': () => {
        const state = pomodoro.init(config)
            .nextPhase()
            .start(startTimestamp)
            .tick(oneSecondTimestamp)
            .prevPhase()
        eq(state.phase, PHASES.break)
        eq(state.timerState, TIMER_STATES.stopped)
        eq(state.timeRemaining, config.shortBreakDuration * 60)
        eq(state.workCount, 1)
    },
    'stops paused timer instead of moving back': () => {
        const state = pomodoro.init(config)
            .nextPhase()
            .start(startTimestamp)
            .tick(oneSecondTimestamp)
            .pause()
            .prevPhase()
        eq(state.phase, PHASES.break)
        eq(state.timerState, TIMER_STATES.stopped)
        eq(state.timeRemaining, config.shortBreakDuration * 60)
        eq(state.workCount, 1)
    },
})
