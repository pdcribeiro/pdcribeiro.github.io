// Tests for the test framework

import { ass, assert, assertEquals, eq, test } from './test.js'

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
        } catch (e) {
        }
    },
    'assert() does not throw error when condition is true': () => {
        try {
            assert(true)
        } catch (e) {
            throw new Error('assert() should not throw error when condition is true')
        }
    },
    'assertEquals() throws error when values are not equal': () => {
        try {
            assertEquals(1, 2)
            throw new Error('assertEquals() should throw error when values are not equal')
        } catch (e) {
        }
    },
    'assertEquals() does not throw error when values are equal': () => {
        try {
            assertEquals(1, 1)
        } catch (e) {
            throw new Error('assertEquals() should not throw error when values are equal')
        }
    },
    'ass() is alias of assert()': () => {
        assertEquals(ass, assert)
    },
    'eq() is alias of assertEquals()': () => {
        assertEquals(eq, assertEquals)
    },
})
