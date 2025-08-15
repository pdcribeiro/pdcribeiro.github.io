import van from '/lib/ui/van.js'

const TAGS_TO_INJECT = [
    'a',
    'br',
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

export function deriveAsync(callback, deps = []) {
    const state = van.state()
    const update = async () => state.val = await callback()
    van.derive(() => {
        deps.forEach(d => d.val)
        update()
    })
    return state
}

export function waitState(state, render) {
    return () => state.val === undefined ? div() : render()
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

// NOTE: must be wrapped in parent element to be removed from dom
// idea: use first child as element and insert other siblings after. on unmount of first child, remove other children. test removal before and after changes in try app. try reverting router change if successful
export function Fragment(...children) {
    return van.add(new DocumentFragment(), children)
}
