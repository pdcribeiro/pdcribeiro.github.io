import { sanitizeConfig } from './pomodoro.js'

const STORAGE_KEY = 'pomodoro-config'

export function loadConfig() {
    const config = localStorage.getItem(STORAGE_KEY)
    return sanitizeConfig(JSON.parse(config) ?? {})
}

export function saveConfig(config) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}
