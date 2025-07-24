import van from '/third-party/van-1.5.3.min.js'

const TAGS_TO_INJECT = [
    'a',
    'button',
    'div',
    'fieldset',
    'footer',
    'h1',
    'header',
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

export default van

export function injectTagsIntoWindow() {
    TAGS_TO_INJECT.forEach(t => window[t] = van.tags[t])
}

export function renderAfterLoad(app) {
    window.addEventListener('load', () => render(app))
}

export function render(app) {
    van.add(document.body, app())
}

export function stateAsync(promise) {
    const state = van.state()
    promise.then(data => state.val = data)
    return state
}

export function waitState(state, render) {
    return div(() => state.val === undefined ? div() : render())
}
