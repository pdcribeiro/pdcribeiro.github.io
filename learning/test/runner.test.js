// Tests for the test framework

import { ass, assert, assertEquals, assertFails, eq, fail, test } from './runner.js'

(() => {
    let ran = false
    test({
        'toggles run state': () => {
            ran = true
        }
    })
    ass(ran === true, 'test function should be called')
})()

test({
    'assert() throws error when condition is false': () => {
        try {
            assert(false)
            throw new Error('assert() should throw error when condition is false')
        } catch { }
    },
    'assert() does not throw error when condition is true': () => {
        try {
            assert(true)
        } catch {
            throw new Error('assert() should not throw error when condition is true')
        }
    },
    'assertEquals() throws error when values are not equal': () => {
        try {
            assertEquals(1, 2)
            throw new Error('assertEquals() should throw error when values are not equal')
        } catch { }
    },
    'assertEquals() does not throw error when values are equal': () => {
        try {
            assertEquals(1, 1)
        } catch {
            throw new Error('assertEquals() should not throw error when values are equal')
        }
    },
    'assertFails() throws error when callback does not throw error': async () => {
        let error
        try {
            await assertFails(() => { })
        } catch {
            error = true
        }
        if (!error) {
            throw new Error('assertFails() should throw error when callback does not throw error')
        }
    },
    'assertFails() does not throw error when callback throws error': async () => {
        try {
            await assertFails(() => { throw new Error() })
        } catch {
            throw new Error('assertFails() should not throw error when callback throws error')
        }
    },
    'ass() is alias of assert()': () => {
        assertEquals(ass, assert)
    },
    'eq() is alias of assertEquals()': () => {
        assertEquals(eq, assertEquals)
    },
    'fail() is alias of assertFails()': () => {
        assertEquals(fail, assertFails)
    },
})
