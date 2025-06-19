import { assert } from './runner.js'

const IFRAME_ID = 'test-iframe'
const GLOBAL_SELECTOR = '*'
const IGNORED_TAGS = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE']
const MAX_Z_INDEX = 2147483647

const helpers = {
    visit(parent_, url) {
        const iframe = document.getElementById(IFRAME_ID) ?? createIframe()
        return new Promise((resolve, reject) => {
            iframe.onload = () => resolve(iframe.contentDocument)
            iframe.onerror = () => reject(new Error(`Failed to load ${url}`))
            iframe.src = url
        })
    },
    async find(parent, text, options = {}) {
        const {
            wait = true,
        } = options

        const findFunction = () => findElementByText(parent, text, options)

        return wait ? waitFor(findFunction) : findFunction()
    },
    async click(parent, text, options = {}) {
        const element = await helpers.find(parent, text, options)
        element.click()
        return parent
    },
    async wait(parent, duration) {
        await wait(duration)
        return parent
    },
    // Assertions
    async has(parent, text, options = {}) {
        const element = await helpers.find(parent, text, options)
        assert(element !== null)
        return parent
    },
}

async function waitFor(callback, timeout = 5000) {
    const startTime = Date.now()
    while (Date.now() - startTime < timeout) {
        const result = await callback()
        if (result) {
            return result
        }
        await wait(100)
    }
    return null
}

function wait(duration) {
    return new Promise(resolve => setTimeout(resolve, duration))
}

function findElementByText(parent, text, options = {}) {
    const {
        selector = GLOBAL_SELECTOR,
    } = options

    const elements = Array.from(parent.querySelectorAll(selector))
        .filter(el => !IGNORED_TAGS.includes(el.tagName))
        .reverse()
    const lowercasedText = text.toLowerCase()
    for (const el of elements) {
        if (elementContainsText(el, lowercasedText)) {
            console.debug('find()', el, { args: { parent, text, selector } })
            return el
        }
    }
    return null
}

function elementContainsText(element, text) {
    return element.textContent.toLowerCase().includes(text)
        || element.getAttribute('aria-label')?.toLowerCase().includes(text)
}

export function visit(url) {
    return createChain(() => helpers.visit(null, url), helpers)
}

function createChain(initialFn, methods) {
    let statePromise = initialFn()

    const makeAPI = () => {
        const api = {}

        for (const [name, fn] of Object.entries(methods)) {
            api[name] = (...args) => {
                statePromise = statePromise.then(state => fn(state, ...args))
                return makeAPI() // chainable
            }
        }

        api.then = statePromise.then.bind(statePromise) // make awaitable

        return api
    }

    return makeAPI()
}

const iframeStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    visibility: 'hidden',
    zIndex: MAX_Z_INDEX,
    width: '100vw',
    height: '100vh',
    border: '0.5rem dashed gray',
}
const toggleButtonStyle = {
    position: 'absolute',
    top: '2rem',
    left: '50%',
    zIndex: MAX_Z_INDEX,
    padding: '0.5rem 1rem',
    margin: 0,
    fontSize: '1rem',
    border: '1px solid gray',
    opacity: '50%',
    transform: 'translateX(-50%)',
}

function createIframe() {
    const iframe = document.createElement('iframe')
    iframe.id = IFRAME_ID
    setStyle(iframe, iframeStyle)
    document.body.appendChild(iframe)

    const toggleButton = document.createElement('button')
    toggleButton.textContent = 'toggle test'
    setStyle(toggleButton, toggleButtonStyle)
    toggleButton.addEventListener('click', () =>
        iframe.style.visibility = iframe.style.visibility === 'hidden' ? 'visible' : 'hidden'
    )
    document.body.appendChild(toggleButton)

    return iframe
}

function setStyle(element, style) {
    Object.assign(element.style, style)
}
