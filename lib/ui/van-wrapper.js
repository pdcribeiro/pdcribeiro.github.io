import van from '/third-party/van-1.5.3.min.js'

const TAGS_TO_INJECT = [
    'a',
    'button',
    'div',
    'fieldset',
    'h1',
    'i',
    'img',
    'input',
    'label',
    'li',
    'main',
    'option',
    'p',
    'select',
    'span',
    'textarea',
    'time',
    'ul',
]

export function injectTagsIntoWindow() {
    TAGS_TO_INJECT.forEach(t => window[t] = van.tags[t])
}

export function render(app) {
    van.add(document.body, app())
}

export default van
