// A test framework

// TODO: add support for browser tests (idea: if app running on localhost, run tests on load)
// TODO: add support to replay browser tests step by step (CLI in console)
// TODO?: add support for nesting tests (nest name, add setup/teardown?)

import { runningOn } from '../infra/environment.js'
import { COLORS, logColored } from '../infra/logging.js'

export function browserTest(tests) {
    if (runningOn.browser() && runningOn.localhost() && !runningOn.iframe()) {
        return test(tests)
    }
}

export async function test(tests) {
    if (runningOn.browser() && runningOn.iframe()) {
        return // prevents infinite loop
    }
    for (const testName in tests) {
        const testCallback = tests[testName]
        try {
            await testCallback()
            logColored(`✓ ${testName}`, COLORS.green)
        } catch (e) {
            logColored(`✗ ${testName}`, COLORS.red)
            console.log(e)
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
