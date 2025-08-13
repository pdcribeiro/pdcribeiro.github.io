// A pomodoro timer app

// TODO: sync between devices

export const DEFAULT_CONFIG = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    workCountUntilLongBreak: 4,
}

export const PHASES = {
    work: 'work',
    break: 'break',
}

export const TIMER_STATES = {
    running: 'running',
    paused: 'paused',
    stopped: 'stopped',
}

export const pomodoro = {
    init(config) {
        const {
            workDuration,
            shortBreakDuration,
            longBreakDuration,
            workCountUntilLongBreak,
        } = { ...DEFAULT_CONFIG, ...config }

        const initialState = {
            phase: PHASES.work,
            timerState: TIMER_STATES.stopped,
            timeRemaining: workDuration * 60,
            workCount: 0,
        }
        return {
            ...initialState,
            start(timestamp) {
                return {
                    ...this,
                    timerState: TIMER_STATES.running,
                    lastTimestamp: timestamp,
                }
            },
            tick(timestamp) {
                if (this.timerState !== TIMER_STATES.running) {
                    return this
                }
                const elapsedSeconds = Math.floor((timestamp - this.lastTimestamp) / 1000)
                const timeRemaining = this.timeRemaining - elapsedSeconds
                if (timeRemaining <= 0) {
                    return this.nextPhase()
                }
                return {
                    ...this,
                    timeRemaining,
                    lastTimestamp: timestamp,
                }
            },
            pause() {
                return { ...this, timerState: TIMER_STATES.paused }
            },
            stop() {
                const isWork = this.phase === PHASES.work
                const isLongBreak = this.workCount % workCountUntilLongBreak === 0
                const minutesRemaining = isWork ? workDuration : isLongBreak ? longBreakDuration : shortBreakDuration
                return {
                    ...this,
                    timerState: TIMER_STATES.stopped,
                    timeRemaining: minutesRemaining * 60,
                }
            },
            nextPhase() {
                if (this.phase === PHASES.work) {
                    const workCount = this.workCount + 1
                    const nextIsLongBreak = workCount % workCountUntilLongBreak === 0
                    const minutesRemaining = nextIsLongBreak ? longBreakDuration : shortBreakDuration
                    return {
                        ...this,
                        phase: PHASES.break,
                        timerState: TIMER_STATES.stopped,
                        timeRemaining: minutesRemaining * 60,
                        workCount,
                    }
                } else {
                    return {
                        ...this,
                        phase: PHASES.work,
                        timerState: TIMER_STATES.stopped,
                        timeRemaining: workDuration * 60,
                    }
                }
            },
            prevPhase() {
                if (this.timerState !== TIMER_STATES.stopped) {
                    return this.stop()
                }
                if (this.phase === PHASES.work) {
                    if (this.workCount === 0) {
                        return this
                    }
                    const prevIsLongBreak = this.workCount % workCountUntilLongBreak === 0
                    const minutesRemaining = prevIsLongBreak ? longBreakDuration : shortBreakDuration
                    return {
                        ...this,
                        phase: PHASES.break,
                        timerState: TIMER_STATES.stopped,
                        timeRemaining: minutesRemaining * 60,
                    }
                } else {
                    return {
                        ...this,
                        phase: PHASES.work,
                        timerState: TIMER_STATES.stopped,
                        timeRemaining: workDuration * 60,
                        workCount: this.workCount - 1,
                    }
                }
            },
        }
    },
}

export function sanitizeConfig(config) {
    return Object.fromEntries(
        Object.keys(DEFAULT_CONFIG)
            .map(k => [k, config[k]])
            .map(([k, v]) => [k, Number.isInteger(v) && v > 0 ? v : DEFAULT_CONFIG[k]])
    )
}
