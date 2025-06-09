
const IFRAME_ID = 'test-frame'
const MAX_Z_INDEX = 2147483647

const helpers = {
    visit(parent_, url) {
        const iframe = document.querySelector(`#${IFRAME_ID}`) ?? createIframe()
        return new Promise((resolve, reject) => {
            iframe.onload = () => resolve(iframe.contentDocument)
            iframe.onerror = () => reject(new Error(`Failed to load ${url}`))
            iframe.src = url
        })
    },
    async find(parent, text, selector = "*") {
        const elements = parent.querySelectorAll(selector)
        for (const el of elements) {
            if (el.textContent.trim() === text) {
                console.debug('find()', el, { args: { parent, text, selector } })
                return el
            }
        }
        throw new Error('Element not found')
    },
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
