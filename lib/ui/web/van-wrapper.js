import van from './van.js'

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

// FIX nested not working. remove anchor and elements on unmount (triggered by parent). idea: van.update not switching the node
// LATER optimize re-render
// For() vs callback (pros: avoids wrapper element, readability / cons: complexity)
export let For = (list) => ({
    Each: (renderItem) => {
        let { anchor, render } = createRenderer()
        let items = van.derive(() => list().map(renderItem).flat(Infinity))
        let emptyContent = van.state([])
        let elements = van.derive(() => items.val.length ? items.val : emptyContent.val)
        van.derive(() => (elements.val, setTimeout(() => render(...elements.val)))) // let anchor render first
        anchor.Else = (...content) => (emptyContent.val = content, anchor)
        return anchor
    }
})

let createRenderer = () => {
    let anchor = new Comment('anchor')
    let frag = new DocumentFragment()
    let current = []
    let render = (...elements) => {
        van.add(frag, ...elements)
        current.forEach(el => el.remove())
        current = [...frag.children]
        anchor.parentNode.insertBefore(frag, anchor)
    }
    return { anchor, render }
}

// FIX nested not working. remove anchor and elements on unmount (triggered by parent)
// If() vs callback (pros: avoids null element, readability / cons: complexity)
export let If = (condition, ...content) => {
    let { anchor, render } = createRenderer()
    let branches = van.state([])
    let active = van.derive(() => branches.val.find(b => !b.condition || b.condition()))
    let elements = van.derive(() => active.val?.content ?? [])
    van.derive(() => (elements.val, setTimeout(() => render(...elements.val)))) // let anchor render first

    let parseContent = (c) => typeof c === 'string' ? new Text(c) : c
    let setBranches = (bs) => branches.val = bs.map(({ condition, content }) => ({
        condition,
        content: content.map(parseContent)
    }))
    let addBranch = ({ condition, content }) => setBranches([...branches.val, { condition, content }])
    let setLastBranch = (set) => setBranches([...branches.val.slice(0, -1), set(branches.val.at(-1))])

    addBranch({ condition, content })

    anchor.Then = (...content) => (setLastBranch(b => ({ ...b, content })), anchor)
    anchor.ElseIf = (condition, ...content) => (addBranch({ condition, content }), anchor)
    anchor.Else = (...content) => (addBranch({ content }), anchor)

    return anchor
}
