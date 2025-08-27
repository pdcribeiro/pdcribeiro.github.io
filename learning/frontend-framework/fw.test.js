import { test } from '../../lib/test/runner.js'
import { init } from './fw.js'

test({
    '': () => {
        mockScript('let var = 123')
        // expect()
    }
})

let mockScript = (textContent) => {
    const documentMock = {
        querySelector: () => templateMock,
    }
    const templateMock = {
        content: {
            querySelectorAll: () => [{ textContent }],
        },
    }
    global.document = documentMock
}
