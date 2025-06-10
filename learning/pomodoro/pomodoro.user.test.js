// Browser tests for the pomodoro app

import { ass, eq, userTest } from '../test/runner.js'
import { visit } from '../test/ui-helpers.js'

userTest({
    'timer displays 25:00 on load': () =>
        visit('/learning/pomodoro').has('25:00'),
    // 'start button begins countdown': () => {
    //     ass(false)
    // },
})
