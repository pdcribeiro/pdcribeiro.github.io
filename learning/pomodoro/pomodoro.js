// A pomodoro timer app

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
            timerRunning: false,
            timeRemaining: workDuration * 60,
            workCount: 0,
        }
        return {
            ...initialState,
            start(timestamp) {
                return {
                    ...this,
                    timerRunning: true,
                    lastTimestamp: timestamp,
                }
            },
            pause() {
                return { ...this, timerRunning: false }
            },
            tick(timestamp) {
                if (!this.timerRunning) {
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
            stop() {
                const isWork = this.phase === PHASES.work
                const isLongBreak = this.workCount % workCountUntilLongBreak === 0
                const minutesRemaining = isWork ? workDuration : isLongBreak ? longBreakDuration : shortBreakDuration
                return {
                    ...this,
                    timerRunning: false,
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
                        timerRunning: false,
                        timeRemaining: minutesRemaining * 60,
                        workCount,
                    }
                } else {
                    return {
                        ...this,
                        phase: PHASES.work,
                        timerRunning: false,
                        timeRemaining: workDuration * 60,
                    }
                }
            },
            prevPhase() {
                if (this.phase === PHASES.work) {
                    if (this.workCount === 0) {
                        return this
                    }
                    const prevIsLongBreak = this.workCount % workCountUntilLongBreak === 0
                    const minutesRemaining = prevIsLongBreak ? longBreakDuration : shortBreakDuration
                    return {
                        ...this,
                        phase: PHASES.break,
                        timerRunning: false,
                        timeRemaining: minutesRemaining * 60,
                    }
                } else {
                    return {
                        ...this,
                        phase: PHASES.work,
                        timerRunning: false,
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
