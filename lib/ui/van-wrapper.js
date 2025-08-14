import van from '/third-party/van-1.5.3.min.js'

const TAGS_TO_INJECT = [
    'a',
    'button',
    'div',
    'fieldset',
    'footer',
    'h1',
    'header',
    'hr',
    'i',
    'img',
    'input',
    'label',
    'li',
    'main',
    'option',
    'p',
    'pre',
    'section',
    'select',
    'span',
    'textarea',
    'time',
    'ul',
]

// monkey patch set() (ie. `state.set(s => s + 1)`)
const vanState = van.state
van.state = (initVal) => Object.assign(vanState(initVal), {
    set(callback) {
        this.val = callback(this.val)
    }
})

export default van

export function injectTagsIntoWindow() {
    TAGS_TO_INJECT.forEach(t => window[t] = van.tags[t])
}

export function renderAfterLoad(app) {
    window.addEventListener('load', () => render(app))
}

export function render(app) {
    van.add(document.body, app)
}

export function stateAsync(promise) {
    const state = van.state()
    promise.then(result => state.val = result)
    return state
}

export function waitState(state, render) {
    return Fragment(() => state.val === undefined ? div() : render())
}

export function waitPromise(promise, render) {
    const result = stateAsync(
        promise.then(result => result ?? null) // handles undefined result
    )
    return waitState(result, () => render(result.val))
}

export function bindInput(state) {
    return {
        value: state,
        oninput: (e) => state.val = e.target.value,
    }
}

export function Fragment(...children) {
    return van.add(new DocumentFragment(), children)
}
