// Browser tests for the pomodoro app

import { browserTest } from '/lib/test/runner.js'
import { visit } from '/lib/test/ui-helpers.js'

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
    'pauses timer': () =>
        visit(URL)
            .click('start')
            .has('24:59')
            .click('pause')
            .wait(1000)
            .has('24:59'),
    'stops timer': () =>
        visit(URL)
            .click('start')
            .has('24:59')
            .click('previous')
            .has('25:00'),
    'moves to next phase': () =>
        visit(URL)
            .click('next')
            .has('05:00'),
    'moves to previous phase': () =>
        visit(URL)
            .click('next')
            .has('05:00')
            .click('previous')
            .has('25:00'),
    'opens settings': () =>
        visit(URL)
            .click('settings')
            .has('work')
            .has('short')
            .has('long')
            .has('count'),
    'closes settings': () =>
        visit(URL)
            .click('settings')
            .has('work')
            .click('settings')
            .hasNot('work'),
    'updates timer on settings change': () =>
        changeSettings((settings) => settings.replace('work: 25', 'work: 24'))
            .has('24:00'),
    'settings persist after reload': () =>
        changeSettings((settings) => settings.replace('work: 25', 'work: 24'))
            .reload()
            .has('24:00'),
}, {
    before: () => localStorage.clear(),
})

function changeSettings(update) {
    return visit(URL)
        .click('settings')
        .find('work')
        .type(update)
        .root()
        .click('settings')
}
