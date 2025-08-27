import AppConfigManager from '../lib/config/AppConfigManager.js'
import LocalStorageConfigRepo from '/lib/config/LocalStorageConfigRepo.js'
import { transformEntries } from '/lib/object.js'
import { sanitizeConfig } from './pomodoro.js'

const STORAGE_KEY = 'pomodoro-config'

const abbreviations = {
    workDuration: 'work',
    shortBreakDuration: 'short',
    longBreakDuration: 'long',
    workCountUntilLongBreak: 'count',
}
const reverseAbrvs = transformEntries(abbreviations, ([k, v]) => [v, k])

class PomodoroConfigManager extends AppConfigManager {
    async load() {
        return sanitizeConfig(await super.load())
    }
    stringify(config) {
        return Object.entries(abbreviations).reduce(
            (s, [k, v]) => s.replace(k, v),
            super.stringify(config)
        )
    }
    parse(string) {
        return transformEntries(
            super.parse(string),
            ([k, v]) => [reverseAbrvs[k], Number(v)]
        )
    }
}

export const configManager = new PomodoroConfigManager({
    repo: new LocalStorageConfigRepo(STORAGE_KEY),
    schema: {},
})
