import { runningOn } from './environment.js'

export const COLORS = {
    green: 'green',
    red: 'red',
}

const TERMINAL_COLOR_CODES = {
    green: 32,
    red: 31,
}

export function logColored(message, color) {
    if (runningOn.node()) {
        console.info(`\x1b[${TERMINAL_COLOR_CODES[color]}m${message}\x1b[0m`)
    } else if (runningOn.browser()) {
        console.info(`%c${message}`, `color: ${color}`)
    } else {
        console.info(message)
    }
}
