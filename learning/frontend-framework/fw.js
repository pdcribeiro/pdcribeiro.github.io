/*
    wip:
    - parseAndBindAttribute

    features:
    - allow defining component in html file (optional: without surrounding template tag) and importing it into another html/component file
*/

import { AsyncQueue } from '/lib/queue.js'
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
    loadAllComponents()
    let app = extractAppContent()
    let script = extractScript(app)
    let scope = await parseAndImportScript(script)
    document.body.append(app)
    parseAndBindDom(document.body, scope) // must happen after appendChild. doesn't parse custom elements
    // TODO: maybe parseAndBindDom should happen before app mounts. can we make it work? (eg. parseAndBindDom(app, scope)). check logs before and after changing
}

let setGlobals = (globals) => Object.assign(window, globals)

let loadAllComponents = () =>
    document.querySelectorAll('template[component]').forEach(loadComponent)

let extractAppContent = () => {
    let template = document.querySelector('template[app]')
    return extractTemplateContent(template)
}

let extractScript = (root) => {
    let script = root.querySelector('script')
    script?.remove()
    return script
}

let extractTemplateContent = (template) => {
    let content = template.content
    template.remove()
    return content
}

let loadedComponents = new Set()

// TODO: optimize. move heavy stuff out of constructor (or cache it). components are created on first render and can also be cloned a bunch of times
// TODO?: prevent first render?
let loadComponent = (template) => {
    if (loadedComponents.has(template)) return

    let name = template.getAttribute('component')
    let content = extractTemplateContent(template)
    let script = extractScript(content)

    customElements.define(kebab(name), class extends HTMLElement {
        isComponent = true

        constructor() {
            console.debug('constructor', name)
            super()

            this._props = state({})
            this.attachShadow({ mode: 'open' }).appendChild(content.cloneNode(true))
        }
        async init() {
            console.debug('init', name)

            // TODO: this async call makes it so document is bound before components, but is it realiable?
            let exports = await runWithGlobalsAsync(() => parseAndImportScript(script), {
                $props: this._props,
            })

            for (let c of this.shadowRoot.children)
                parseAndBindDom(c, exports)
        }
    })

    loadedComponents.add(template)
}

let runWithGlobalsAsync = async (callback, globals) => {
    let previous = Object.keys(globals).reduce((prev, k) => ({ ...prev, k: window[k] }), {})
    setGlobals(globals)
    let result = await callback()
    setGlobals(previous)
    return result
}

let declarationRe = /^\s*(var|let|const|function) ([{\[]\s+)?(\w+)(\s+[}\]])?[ =(]/
let allDeclarationsRe = new RegExp(declarationRe, 'gm')

// note: must import as module to allow imports inside script code
// note: must set globals (eg. $props) before calling this
let parseAndImportScript = async (script) => {
    console.debug('parseAndImportScript', { script })

    if (!script) return {}

    // parse and export declarations
    let code = script.textContent
    let declarations = code.match(allDeclarationsRe)?.map(m => m.match(declarationRe)[3]) ?? []
    let codeWithExports = code + '\n' + `export { ${declarations.join(', ')} }`

    // LATER wrap argument of $derive calls in arrow function

    // import rewritten script tags
    let blob = new Blob([codeWithExports], { type: 'application/javascript' })
    let url = URL.createObjectURL(blob)
    let exports = await import(url)

    return exports
}

let componentInitQueue = new AsyncQueue({ handler: cmp => cmp.init() })

// TODO: get it working without custom components first. then with :if. then with custom components
// TODO parse and bind innerText (get childNodes, filter text nodes, parse, bind)
// note: careful when using document fragments. if they were already appended, they'll be empty
let parseAndBindDom = (element, scope) => {
    console.debug('parseAndBindDom', element.tagName, { element, isComponent: !!element.isComponent, task: scope.task, scope })

    for (let { name } of element.attributes)
        parseAndBindAttribute(name, element, scope)

    for (let child of element.children) // component elements have no children. they are bound in their init method
        parseAndBindDom(child, scope)

    if (element.isComponent)
        componentInitQueue.push(element)
}

// let boundAttributeRe = /^(:|@)\w+$/

// FIX: when we set a bounded attribute to a state proxy on a component element (in props proxy), we need to extract the raw value
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
                return element
            })
        else
            bind(() => {
                let result = evaluate()
                if (result)
                    element.setAttribute(rawName, result.isState ? result.val : result)
                else
                    element.removeAttribute(rawName)
                return element
            })
    } else if (name.startsWith('@')) {
        let eventType = name.slice(1)
        let evaluate = getEvaluator(value, scope)
        let listener = (event) => {
            let result = evaluate()
            if (result instanceof Function) result(event)
        }
        element.addEventListener(eventType, listener) // TODO: bind?
    }
}

// FIX: bind attributes in bind call. check how to handle custom component shadow root children
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
        return document // prevent garbage collection of binding
    }, anchor))
}

let extractAttr = (name, el) => {
    let val = el.getAttribute(name)
    if (val !== null) el.removeAttribute(name)
    return val
}

// FIX: bind attributes in bind call. check how to handle custom component shadow root children
// FIX: reading scope in connectedCallback won't work for non-component elements. need to read it in parseAndBindAttribute. but will component scripts have already loaded by then?
// LATER: handle destructure. idea: pass ...rest param to evaluator
// LATER: optimize re-render
// LATER?: add forScope to current element
let bindForAttr = (element, scope) => {
    console.debug('bindForAttr', element.tagName, { element, scope })

    let parent = element.parentElement
    let anchor = new Comment(ATTRIBUTES.for)
    parent.insertBefore(anchor, element)

    let value = extractAttr(ATTRIBUTES.for, element)
    let [itemExpr, listExpr] = value.split(' in ')

    let itemEl = element.cloneNode(true)
    element.remove()
    for (let c of element.children)
        c.remove() // remove original children to prevent current parseAndBindDom run from catching them. they'll be rendered with item scope when bind runs the first time

    let evaluateList = getEvaluator(listExpr, scope)
    let current = []
    // bind async to prevent current parseAndBindDom from catching added elements
    setTimeout(() => bind(() => {
        let active = evaluateList().map(item => ({
            el: itemEl.cloneNode(true),
            scope: { ...scope, [itemExpr]: item },
        }))
        current.forEach(item => item.el.remove())
        for (let item of active) {
            parent.insertBefore(item.el, anchor)
            parseAndBindDom(item.el, item.scope)
        }
        current = active
        return document // prevent garbage collection of binding
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

init()
