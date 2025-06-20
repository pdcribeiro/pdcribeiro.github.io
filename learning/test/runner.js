// A test framework

// TODO: add support to replay browser tests step by step (CLI in console)
// TODO?: add support for nesting tests (nest name, add setup/teardown?)

import { runningOn } from '../../lib/infra/environment.js'
import { COLORS, logColored } from '../../lib/infra/logging.js'

export function browserTest(tests, options = {}) {
    if (runningOn.browser() && runningOn.localhost() && !runningOn.iframe()) {
        return test(tests, options)
    }
}

export async function test(tests, options = {}) {
    const {
        only = [],
    } = options

    if (runningOn.browser() && runningOn.iframe()) {
        return // prevents infinite loop
    }
    if (runningOn.node()) {
        console.debug = () => { }
    }
    const testsToRun = only.length ? only : Object.keys(tests)
    for (const testName of testsToRun) {
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
    return message ? `: ${message}` : ''
}

export function assertEquals(value, expected) {
    if (value !== expected) {
        throw new Error(`assertEquals() expected ${expected} got ${value}`)
    }
}

export function assertFails(callback, message = '') {
    try {
        const result = callback()
        if (result instanceof Promise) {
            return result.then(
                () => {
                    throw new Error('assertFails() failed' + formatMessage(message))
                },
                () => { },
            )
        }
    } catch {
        return
    }
    throw new Error('assertFails() failed' + formatMessage(message))
}

export {
    assert as ass,
    assertEquals as eq,
    assertFails as fail,
}
