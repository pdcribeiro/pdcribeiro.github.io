// Tests for the UI helpers

import { ass, eq, fail, test } from './runner.js'
import { visit } from './ui-helpers.js'

const SOME_URL = 'https://example.com'
const SOME_TEXT = 'some text'
const OTHER_TEXT = 'other text'
const SOME_PLACEHOLDER = 'some placeholder'
const FIND_OPTIONS = {
    wait: false,
}

test({
    // visit()
    'creates iframe': () => {
        const iframeMock = mockEl()
        const appendChildMock = mockFn()

        global.document = {
            getElementById: () => null,
            createElement: (tag) => tag === 'iframe' ? iframeMock : mockEl(),
            body: {
                appendChild: appendChildMock.fn
            },
        }

        visit(SOME_URL)

        ass(appendChildMock.calls.find(([el]) => el === iframeMock))
    },
    'reuses iframe': () => {
        const createElementMock = mockFn()

        global.document = {
            getElementById: () => mockEl(),
            createElement: createElementMock.fn,
        }

        visit(SOME_URL)

        eq(createElementMock.calls.length, 0)
    },
    'sets iframe src': () => {
        const iframeMock = mockEl()

        global.document = {
            getElementById: () => iframeMock,
        }

        visit(SOME_URL)

        eq(iframeMock.src, SOME_URL)
    },
    // has()
    'passes when page contains text': () => {
        mockIframe([
            mockEl({ textContent: SOME_TEXT }),
        ])
        return visit(SOME_URL)
            .has(SOME_TEXT, FIND_OPTIONS)
    },
    'fails when page does not contain text': () => {
        mockIframe([
            mockEl({ textContent: SOME_TEXT }),
        ])
        return fail(() =>
            visit(SOME_URL)
                .has(OTHER_TEXT, FIND_OPTIONS)
        )
    },
    // hasNot()
    'passes when page does not contain text': () => {
        mockIframe([
            mockEl({ textContent: SOME_TEXT }),
        ])
        return fail(() =>
            visit(SOME_URL)
                .has(OTHER_TEXT, FIND_OPTIONS)
        )
    },
    'fails when page contains text': () => {
        mockIframe([
            mockEl({ textContent: SOME_TEXT }),
        ])
        return visit(SOME_URL)
            .has(SOME_TEXT, FIND_OPTIONS)
    },
    // click()
    'finds and clicks button': () => {
        const clickMock = mockFn()

        mockIframe([
            mockEl({ textContent: SOME_TEXT, click: clickMock.fn }),
        ])

        return visit(SOME_URL)
            .click(SOME_TEXT, FIND_OPTIONS)
            .then(() => {
                eq(clickMock.calls.length, 1)
            })
    },
    // type()
    'appends text to empty input': () => {
        const inputMock = mockControl({
            placeholder: SOME_PLACEHOLDER,
            value: '',
        })

        mockIframe([inputMock])

        return visit(SOME_URL)
            .find(SOME_PLACEHOLDER)
            .type(SOME_TEXT)
            .root()
            .has(SOME_TEXT)
    },
    'appends text to non-empty input': () => {
        const inputMock = mockControl({
            placeholder: SOME_PLACEHOLDER,
            value: SOME_TEXT,
        })

        mockIframe([inputMock])

        return visit(SOME_URL)
            .find(SOME_PLACEHOLDER)
            .type(OTHER_TEXT)
            .root()
            .has(SOME_TEXT + OTHER_TEXT)
    },
    'replaces text in non-empty input': () => {
        const inputMock = mockControl({
            placeholder: SOME_PLACEHOLDER,
            value: SOME_TEXT,
        })

        mockIframe([inputMock])

        return visit(SOME_URL)
            .find(SOME_PLACEHOLDER)
            .type(() => OTHER_TEXT)
            .root()
            .has(OTHER_TEXT)
    },
})

function mockIframe(elements = []) {
    const iframeMock = {
        contentDocument: {
            querySelectorAll: () => elements,
        },
        set src(value_) {
            this.onload()
        },
    }
    global.document = {
        getElementById: () => iframeMock,
    }
    return iframeMock
}

function mockEl(props = {}) {
    return {
        style: {},
        addEventListener: () => { },
        getAttribute: () => null,
        ...props,
    }
}

function mockControl(props = {}) {
    return mockEl({
        focus: () => { },
        dispatchEvent: () => { },
        ...props,
    })
}

function mockFn(callback = () => { }) {
    const calls = []
    const wrappedCallback = (...args) => {
        calls.push(args)
        callback(...args)
    }
    return {
        calls,
        fn: wrappedCallback,
    }
}
