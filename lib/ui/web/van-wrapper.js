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

// TODO try move active branch computation out into derive to avoid render when branch doesn't change
// If() vs callback (pros: avoids null element, readability / cons: complexity)
export let If = (condition) => {
    let branches = [{ condition }]
    let result = () => {
        let active = branches.find(b => !b.condition || b.condition())
        let elements = active ? active.content : []
        return Block.render(...elements)
    }
    result.Then = (...content) => (branches.at(-1).content = content, result)
    result.ElseIf = (condition) => (branches.push({ condition }), result)
    result.Else = (...content) => (branches.push({ content }), result)
    return result
}

// TODO optimize re-render
// For() vs callback (pros: avoids wrapper element, readability / cons: complexity)
export let For = (list) => ({
    Each: (renderItem) => {
        let emptyContent = []
        let result = () => {
            let items = list()
            let elements = items.length ? items.map(renderItem).flat(Infinity) : emptyContent
            return Block.render(...elements)
        }
        result.Else = (...content) => (emptyContent = content, result)
        return result
    }
})

export let Await = (promise) => {
    let ful = van.state(),
        rej = van.state()
    promise.then(d => ful.val = d)
        .catch(d => rej.val = d)
    let renderFul, renderRej
    let result = () => {
        let elements =
            ful.val ? renderFul(ful.val) :
                rej.val ? renderRej(rej.val) :
                    []
        return Block.render(...[elements].flat(Infinity))
    }
    result.Then = (render) => (renderFul = render, result)
    result.Catch = (render) => (renderRej = render, result)
    return result
}

// NOTE depends on vanjs logic. assumes elements are removed with remove/replaceWith methods
class Block extends Comment {
    static render(...elements) {
        let block = new Block()
        setTimeout(() => block.render(...elements))
        return block
    }
    #elements
    constructor() {
        super('block')
    }
    render(...elements) {
        let frag = new DocumentFragment()
        van.add(frag, ...elements) // run callbacks, bindings, etc.
        this.#elements = [...frag.childNodes] // save computed elements
        this.parentNode?.insertBefore(frag, this)
    }
    remove() {
        super.remove()
        this.#removeElements()
    }
    replaceWith(...elements) {
        super.replaceWith(...elements)
        this.#removeElements()
    }
    #removeElements() {
        this.#elements
            .filter(el => el.isConnected || el instanceof Block)
            .forEach(el => el.remove())
    }
}
