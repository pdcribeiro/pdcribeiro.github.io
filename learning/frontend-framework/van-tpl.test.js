import { test } from '../../lib/test/runner.js'
import { init } from './fw.js'

test({
    '': () => {
        mockScript('let var = 123')
        // expect()
    }
})

let mockScript = (textContent) => {
    let documentMock = {
        querySelector: () => templateMock,
    }
    let templateMock = {
        content: {
            querySelectorAll: () => [{ textContent }],
        },
    }
    global.document = documentMock
}
