export const COLOR_CODES = {
    yellow: 33,
    green: 32,
    red: 31,
}

export function logColored(message, colorCode) {
    console.log(`\x1b[${colorCode}m${message}\x1b[0m`)
}
