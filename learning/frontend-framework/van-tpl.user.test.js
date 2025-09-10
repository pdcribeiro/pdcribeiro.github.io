import { browserTest } from '/lib/test/runner.js'
import { visit } from '/lib/test/ui-helpers.js'

// let = {}

browserTest({
    'loads app': () =>
        visit()
            .has('Task Tracker')
})
