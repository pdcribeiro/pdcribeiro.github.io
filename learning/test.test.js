// Tests for the test framework

// TODO: test assert logic

import { test, ass, assert } from './test.js'

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
    'ass() is alias of assert()': () => {
        assert(ass === assert)
    },
})
