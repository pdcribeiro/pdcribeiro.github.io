// A test framework

// NOTE: node.js code must use relative imports

// TODO: add support to replay browser tests step by step (CLI in console)
// TODO: print tail with only: [failed tests] to copy paste
// TODO?: add support for nesting tests (nest name, add setup/teardown?)

import { runningOn } from '../infra/environment.js'
import { COLORS, logColored } from '../infra/logging.js'
import { removeTestElements } from './ui-helpers.js'

export function browserTest(tests, options = {}) {
    if (runningOn.browser() && runningOn.localhost() && !runningOn.iframe()) {
        return test(tests, options)
    }
}

export async function test(tests, options = {}) {
    const {
        only = [],
        before = () => { },
        after = () => { },
    } = options

    if (runningOn.browser() && runningOn.iframe()) {
        return // prevents infinite loop
    }
    if (runningOn.node()) {
        console.debug = () => { }
    }
    const testsToRun = only.length ? only : Object.keys(tests)
    const failed = []
    for (const testName of testsToRun) {
        const testCallback = tests[testName]
        try {
            await before()
            await testCallback()
            await after()
            logColored(`✓ ${testName}`, COLORS.green)
        } catch (e) {
            logColored(`✗ ${testName}`, COLORS.red)
            console.log(e)
            failed.push(testName)
        }
    }
    if (failed.length) {
        logColored(`${failed.length} failed`, COLORS.red)
    } else {
        logColored('all passed', COLORS.green)
    }
    if (runningOn.browser()) {
        removeTestElements()
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

// fail(message?: string)
// fail(operation: promise | function, message?: string)
export function assertFails(...args) {
    if (args.length === 0) {
        throw new Error('assertFails() failed')
    } else if (typeof args[0] === 'string') {
        throw new Error('assertFails() failed' + formatMessage(args[0]))
    }
    const [operation, message] = args
    try {
        const result = operation instanceof Function ? operation() : operation
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
