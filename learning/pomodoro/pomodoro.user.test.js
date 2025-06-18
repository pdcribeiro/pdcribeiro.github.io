// Browser tests for the pomodoro app

import { browserTest } from '../test/runner.js'
import { visit } from '../test/ui-helpers.js'

const URL = '/learning/pomodoro'

browserTest({
    'shows time': () =>
        visit(URL)
            .has('25:00'),
    'starts timer': () =>
        visit(URL)
            .click('start')
            .has('24:59')
            .has('24:58'),
})
