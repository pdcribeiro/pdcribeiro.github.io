/*
    wip:
    - parseAndBindAttribute

    features:
    - allow defining component in html file (optional: without surrounding template tag) and importing it into another html/component file
*/

import { kebab } from '/lib/string.js'
import { state, derive, bind } from './state.js'

let ATTRIBUTES = {
    if: ':if',
    elsif: ':elsif',
    else: ':else',
    for: ':for',
    model: ':model',
}

let init = async () => {
    setGlobals({
        $state: state,
        $derive: derive,
        $emit: () => { },
    })

    findAndDefineComponents(document)
    // observeComponentAttributesAndUpdateProps(document.body)

    let app = extractAppContent()
    let exports = await parseAndImportScript(app)
    document.body.append(app)
    parseAndBindDom(document.body, exports) // must happen after appendChild. doesn't parse custom elements
    // TODO: maybe parseAndBindDom should happen before app mounts. can we make it work? (eg. parseAndBindDom(app, scope)). check logs before and after changing
}

let setGlobals = (globals) => Object.assign(window, globals)

let findAndDefineComponents = (root) => {
    root.querySelectorAll('template[component]')
        .forEach(t => (defineComponent(t), t.remove()))
}

let extractAppContent = () => {
    let template = document.querySelector('template[app]')
    let content = template.content.cloneNode(true)
    template.remove()
    return content
}

let defineComponent = (template) => {
    let name = template.getAttribute('component')
    class Component extends HTMLElement {
        constructor() {
            console.log('constructor', name)
            super()
            this.#init()
        }
        async #init() {
            this.isComponent = true

            let root = template.content.cloneNode(true)

            this._props = state({})
            for (let { name, value } of Array.from(this.attributes)) {
                if (name.startsWith(':')) name = name.slice(1)
                this._props[name] = value
            }
            Object.assign(window, {
                $props: this._props,
            })

            let exports = await parseAndImportScript(root) // must happen before appendChild
            // TODO: this async call makes it so document is bound before components, but is it realiable?

            let shadowRoot = this.attachShadow({ mode: 'open' })
            // observeComponentAttributesAndUpdateProps(shadowRoot)

            shadowRoot.appendChild(root)

            for (let c of shadowRoot.children) // must happen after appendChild
                parseAndBindDom(c, exports)
        }
    }
    customElements.define(kebab(name), Component)
}

let declarationRe = /^\s*(var|let|const|function) ([{\[]\s+)?(\w+)(\s+[}\]])?[ =(]/
let allDeclarationsRe = new RegExp(declarationRe, 'gm')

// note: must set globals (eg. $props) before calling this
let parseAndImportScript = async (root) => {
    console.debug('parseAndImportScript', { root })

    let script = root.querySelector('script')
    if (!script) return {}

    // parse and export declarations
    let code = script.textContent
    let declarations = code.match(allDeclarationsRe)?.map(m => m.match(declarationRe)[3]) ?? []
    let exports = `export { ${declarations.join(', ')} }`

    let codeWithExports = code + '\n' + exports

    // LATER wrap argument of $derive calls in arrow function

    // import rewritten script tags
    let blob = new Blob([codeWithExports], { type: 'application/javascript' })
    let url = URL.createObjectURL(blob)
    let moduleExports = await import(url)

    script.remove()

    return moduleExports
}

// TODO: get it working without custom components first. then with :if. then with custom components
// TODO parse and bind innerText (get childNodes, filter text nodes, parse, bind)
// note: careful when using document fragments. if they were already appended, they'll be empty
let parseAndBindDom = (element, scope) => {
    console.debug('parseAndBindDom', element.tagName, { element, isComponent: !!element.isComponent, scope })

    if (element._scope)
        scope = { ...scope, ...element._scope }

    for (let { name } of element.attributes)
        parseAndBindAttribute(name, element, scope)

    for (let child of element.children)
        parseAndBindDom(child, scope)
}

let boundAttributeRe = /^(:|@)\w+$/

// FIX: when we set a bounded attribute on a non-component element, the `for (let { name } of element.attributes)` then finds and processes it again
// TODO: read vue docs and add missing essential functionality (https://vuejs.org/guide/essentials/template-syntax.html#attribute-bindings)
let parseAndBindAttribute = (name, element, scope) => {
    console.debug('parseAndBindAttribute', name, { element, scope })

    switch (name) {
        case ':if': return bindIfAttr(element, scope)
        case ':for': return bindForAttr(element, scope)
        case ':model': return bindModelAttr(element, scope)
    }

    let rawName = name.startsWith(':') ? name.slice(1) : name
    let value = element.getAttribute(name)
    if (name.startsWith(':')) {
        let evaluate = getEvaluator(value || rawName, scope)
        if (element.isComponent)
            bind(() => {
                let result = evaluate()
                element._props[rawName] = result.isState ? result.val : result
            }, element)
        else
            bind(() => {
                element.setAttribute(rawName, evaluate())
            }, element)
        // } else if (name.startsWith('@')) {
    }
}

// TODO: test in custom elements with multiple children
let bindIfAttr = (element, scope) => {
    console.debug('bindIfAttr', element.tagName, { element, scope })

    let parent = element.parentElement
    let anchor = new Comment(ATTRIBUTES.if)
    parent.insertBefore(anchor, element)

    let value = extractAttr(ATTRIBUTES.if, element)
    let el = element
    let branches = [{ exp: value, el }]
    while (el = el.nextElementSibling) {
        let exp = extractAttr(ATTRIBUTES.elsif, el)
        if (exp || extractAttr(ATTRIBUTES.else, el) !== null)
            branches.push({ exp, el })
        else
            break
    }
    for (let b of branches) {
        b.eval = b.exp ? getEvaluator(b.exp, scope) : () => true // elsif : else
        let { el } = b
        b.el = el.cloneNode(true)
        el.remove()
        for (let c of el.children)
            c.remove() // remove original children to prevent current parseAndBindDom run from catching them. they'll be rendered with item scope when bind runs the first time
    }

    // bind async to prevent current parseAndBindDom from catching added elements
    setTimeout(() => bind(() => {
        let active = branches.find(b => b.eval())?.el
        let current = branches.find(b => b.el.isConnected)?.el
        if (active !== current) {
            current?.remove()
            parent.insertBefore(active, anchor)
            parseAndBindDom(active, scope)
        }
    }, anchor))
}

let extractAttr = (name, el) => {
    let val = el.getAttribute(name)
    if (val !== null) el.removeAttribute(name)
    return val
}

// FIX: must happen before rendering children
// LATER: handle destructure
// LATER: optimize re-render
let bindForAttr = (element, scope) => {
    console.debug('bindForAttr', element.tagName, { element, scope })

    let parent = element.parentElement
    let anchor = new Comment(ATTRIBUTES.for)
    parent.insertBefore(anchor, element)

    let value = extractAttr(ATTRIBUTES.for, element)
    let [itemExpr, listExpr] = value.split(' in ')

    let template = element.cloneNode(true)
    element.remove()
    for (let c of element.children)
        c.remove() // remove original children to prevent current parseAndBindDom run from catching them. they'll be rendered with item scope when bind runs the first time

    let evaluateList = getEvaluator(listExpr, scope)
    let current = []
    // bind async to prevent current parseAndBindDom from catching added elements
    setTimeout(() => bind(() => {
        let active = evaluateList().map(item => {
            let el = template.cloneNode(true)
            let itemScope = { ...scope, [itemExpr]: item }
            return { el, scope: itemScope }
        })
        current.forEach(el => el.remove())
        for (let item of active) {
            parent.insertBefore(item.el, anchor)
            parseAndBindDom(item.el, item.scope)
        }
        current = active
    }))
}

let bindModelAttr = (element, scope) => {
    console.debug('bindModelAttr', element.tagName, { element, scope })

    // let value = extractAttr(ATTRIBUTES.model, element)
    // bind(() => element.value = evaluate(value), element)
    // TODO: set state value. handle object state and primitive state (.val)
    // TODO: use addEventListener (guarantee run once)
    // element.oninput = (e) => 
}

let getEvaluator = (expr, scope) => {
    console.debug('getEvaluator', { expr, scope })

    let keys = Object.keys(scope)
    let values = Object.values(scope)
    let evaluate
    let fallback = () => expr
    try {
        evaluate = new Function(...keys, `return ${expr};`)
    } catch (e) {
        handleEvaluatorError(e, { expr, scope })
        evaluate = fallback
    }
    return () => {
        console.debug('evaluate', { expr, scope })

        try {
            return evaluate(...values)
        }
        catch (e) {
            handleEvaluatorError(e, { expr, scope })
            return fallback()
        }
    }
}

let handleEvaluatorError = (e, args) => {
    console.error('evaluator error', args)
    console.error(e)
}

let attributesObserver = new MutationObserver((mutations) => {
    for (let { type, target, attributeName: name } of mutations) {
        if (type === 'attributes' && target._props) {
            let propName = name.startsWith(':') ? name.slice(1) : name
            target._props[propName] = target.getAttribute(name)

            console.log('mut', { name, propName, value: target._props[propName] })
        }
    }
})

// TODO: disconnect on component unmount
let observeComponentAttributesAndUpdateProps = (root) => attributesObserver.observe(root, { attributes: true, subtree: true })

init()
