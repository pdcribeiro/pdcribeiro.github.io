// A test framework

// TODO: add support for browser tests (idea: if app running on localhost, run tests on load)
// TODO: add support to replay browser tests step by step (CLI in console)
// TODO: add support for nesting tests (nest name, add setup/teardown?)
// TODO?: add support for async tests

import { COLOR_CODES, logColored } from './infra/logging.js'

export function test(tests) {
    for (const testName in tests) {
        const testCallback = tests[testName]
        try {
            testCallback()
            logColored(`✓ ${testName}`, COLOR_CODES.green)
        } catch (e) {
            logColored(`✗ ${testName}`, COLOR_CODES.red)
            console.log(e.stack)
        }
    }
}

export function assert(condition, message = '') {
    if (!condition) {
        throw new Error('assert() failed' + formatMessage(message))
    }
}

function formatMessage(message) {
    return message ? ` (${message})` : ''
}

export function assertEquals(value, expected) {
    if (value !== expected) {
        throw new Error(`assertEquals() expected ${expected} got ${value}`)
    }
}

export {
    assert as ass,
    assertEquals as eq,
}
