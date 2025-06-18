export const runningOn = {
    node: () => typeof process !== 'undefined',
    browser: () => typeof window !== 'undefined',
    localhost: () => window.location.hostname === 'localhost',
    iframe: () => window.self !== window.top,
}
