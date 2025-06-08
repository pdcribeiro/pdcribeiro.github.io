const STORAGE_KEY = 'pomodoro-config'

export const DEFAULT_CONFIG = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    workCountUntilLongBreak: 4,
}

export function loadConfig() {
    const config = localStorage.getItem(STORAGE_KEY)
    return sanitizeConfig(JSON.parse(config) ?? {})
}

export function sanitizeConfig(config) {
    return Object.fromEntries(
        Object.entries(config)
            .map(([k, v]) => [k, Number.isInteger(v) && v > 0 ? v : DEFAULT_CONFIG[k]])
    )
}

export function saveConfig(config) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}
