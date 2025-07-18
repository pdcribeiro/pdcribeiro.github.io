import { assert } from './runner.js'

const IFRAME_ID = 'test-iframe'
const TOGGLE_ID = 'test-toggle-button'
const GLOBAL_SELECTOR = '*'
const IGNORED_TAGS = ['HTML', 'BODY', 'STYLE', 'SCRIPT', 'NOSCRIPT', 'TEMPLATE']
const MAX_Z_INDEX = 2147483647

let iframe

const helpers = {
    visit(parent_, url) {
        iframe = document.getElementById(IFRAME_ID) ?? createIframe()
        return new Promise((resolve, reject) => {
            iframe.onload = () => resolve(helpers.root())
            iframe.onerror = () => reject(new Error(`Failed to load ${url}`))
            iframe.src = url
        })
    },
    root(parent_) {
        return iframe.contentDocument
    },
    reload(parent_) {
        return new Promise((resolve, reject) => {
            iframe.onload = () => resolve(helpers.root())
            iframe.onerror = () => reject(new Error(`Failed to reload.`))
            iframe.contentWindow.location.reload()
        })
    },
    async find(parent, text, options = {}) {
        const { wait = true } = options
        const findFunction = () => findElementByText(parent, text, options)
        return wait ? waitFor(findFunction) : findFunction()
    },
    async click(parent, text, options = {}) {
        const element = await helpers.find(parent, text, options)
        element.click()
        return parent
    },
    async type(parent, update) {
        parent.focus()
        parent.value = update instanceof Function
            ? await update(parent.value)
            : parent.value + update
        parent.dispatchEvent(new Event('input', { bubbles: true }))
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
    async hasNot(parent, text, options = {}) {
        const { wait = true } = options
        const findFunction = () => !findElementByText(parent, text, options)
        await (wait ? waitFor(findFunction) : findFunction())
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
    for (const el of findAllBySelector(parent, options.selector)) {
        if (elementMatches(el, text.toLowerCase())) {
            console.debug('find()', el, { args: { parent, text, options } })
            return el
        }
    }
    return null
}

function findAllBySelector(parent, selector = GLOBAL_SELECTOR) {
    return Array.from(parent.querySelectorAll(selector))
        .filter(el => !IGNORED_TAGS.includes(el.tagName))
        .reverse()
}

function elementMatches(element, text) {
    return [
        element.getAttribute('aria-label'),
        element.placeholder,
        element.textContent,
        element.value,
    ].some(candidate => candidate && candidate.toLowerCase().includes(text))
}

export function visit(url) {
    return createChain(() => helpers.visit(null, url), helpers)
}

export function removeTestElements() {
    document.getElementById(IFRAME_ID)?.remove()
    document.getElementById(TOGGLE_ID)?.remove()
    iframe = null
}

function createChain(initialFn, methods) {
    const wrap = (promise) => {
        const base = Promise.resolve(promise)
        for (const [name, fn] of Object.entries(methods)) {
            base[name] = (...args) =>
                wrap(base.then(state => fn(state, ...args)))
        }
        return base
    }
    return wrap(initialFn())
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
    toggleButton.id = TOGGLE_ID
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
