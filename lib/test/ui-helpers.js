import { assert } from './runner.js'

const IFRAME_ID = 'test-iframe'
const TOGGLE_ID = 'test-toggle-button'
const GLOBAL_SELECTOR = '*'
const IGNORED_TAGS = ['HTML', 'BODY', 'STYLE', 'SCRIPT', 'NOSCRIPT', 'TEMPLATE']
const MAX_Z_INDEX = 2147483647
const EVENT_OPTIONS = { bubbles: true, cancelable: true }

let iframe

const helpers = {
    visit(parent_, url = location.href) {
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
    pipe(parent, callback) {
        const chain = createChain(() => parent, helpers)
        return callback(chain)
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
        const element = text !== undefined
            ? await helpers.find(parent, text, options)
            : parent
        element.click()
        return parent
    },
    async type(parent, update) {
        parent.focus()
        parent.value = update instanceof Function
            ? await update(parent.value)
            : parent.value + update
        parent.dispatchEvent(new Event('input', EVENT_OPTIONS))
        return parent
    },
    async wait(parent, duration) {
        await wait(duration)
        return parent
    },
    async emit(parent, type) {
        const event = type.startsWith('mouse')
            ? createMouseEvent(type, parent)
            : new Event(type, EVENT_OPTIONS)
        parent.dispatchEvent(event)
        return parent
    },
    async get(parent, callback) {
        await callback(parent)
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
        const notFound = await (wait ? waitFor(findFunction) : findFunction())
        assert(notFound)
        return parent
    },
    async assert(parent, callback) {
        assert(await callback(parent))
        return parent
    },
    async waitFor(parent, callback) {
        assert(await waitFor(() => callback(parent)))
        return parent
    }
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
    const candidates = findAllBySelector(parent, options.selector)
    if (!candidates.length) {
        console.debug('find()', null, { args: { parent, text, options } })
        return null
    }
    if (!text) {
        console.debug('find()', candidates[0], { args: { parent, text, options } })
        return candidates[0]
    }
    for (const el of candidates) {
        if (elementMatches(el, text)) {
            console.debug('find()', el, { args: { parent, text, options } })
            return el
        }
    }
    console.debug('find()', null, { args: { parent, text, options } })
    return null
}

function findAllBySelector(parent, selector = GLOBAL_SELECTOR) {
    return Array.from(parent.querySelectorAll(selector))
        .filter(el => !IGNORED_TAGS.includes(el.tagName))
        .reverse()
}

function elementMatches(element, text) {
    const matchFunction = text instanceof RegExp
        ? (candidate) => text.test(candidate)
        : (candidate) => candidate.toLowerCase().includes(text.toLowerCase())
    return [
        element.getAttribute('aria-label'),
        element.placeholder,
        element.textContent,
        element.value,
    ].some(candidate => candidate && matchFunction(candidate))
}

function createMouseEvent(type, element) {
    const rect = element.getBoundingClientRect()
    return new MouseEvent(type, {
        ...EVENT_OPTIONS,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
    })
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
