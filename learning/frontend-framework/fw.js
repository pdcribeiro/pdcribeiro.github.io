/**
 * WIP
 * - try again to bind before mounting. use doc frags to avoid parent null error
 * - cleanup
 *
 * TODO
 * - write tests
 *
 * LATER
 * - allow defining component in html file and importing it into another html / component file
 */

import { AsyncQueue } from '/lib/queue.js'
import { kebab } from '/lib/string.js'
import { emit } from './events.js'
import { state, derive, bind } from './state.js'

let ATTRIBUTES = {
    if: ':if',
    elsif: ':elsif',
    else: ':else',
    for: ':for',
    model: ':model',
}
let TEMPLATE_DELIMITERS = '{}'

let init = async () => {
    setGlobals({
        $state: state,
        $derive: derive,
        $emit: emit,
    })
    loadAllComponents()
    let content = extractAppContent()
    let script = extractScript(content)
    let scope = await runScriptAndGetScope(script)
    document.body.append(content)
    parseAndBindDom(document.body, scope)
}

let setGlobals = (globals) => Object.assign(window, globals)

let loadAllComponents = () => document.querySelectorAll('template[component]').forEach(loadComponent)

// TODO optimize. move heavy stuff out of constructor (or cache it)
//   - components are created on first render and can also be cloned a bunch of times
// TODO? prevent first render?
let loadComponent = (template) => {
    let name = template.getAttribute('component')
    customElements.define(kebab(name), class extends Component {
        static content = extractTemplateContent(template)
        static script = extractScript(this.content)
    })
}

class Component extends HTMLElement {
    static content
    static script

    constructor() {
        super()
        console.debug('constructor', this.tagName)
        this.style.display = 'none'
        this._props = state({})
        this.attachShadow({ mode: 'open' })
            .appendChild(this.constructor.content.cloneNode(true))
    }
    setProp(name, value) {
        this._props[name] = value
    }
    async init() {
        console.debug('init', this.tagName)
        let getScope = () => runScriptAndGetScope(this.constructor.script)
        let scope = await runWithGlobalsAsync(getScope, {
            $props: this._props,
            $emit: emit.bind(this),
        })
        for (let c of this.shadowRoot.children)
            parseAndBindDom(c, scope)
        this.style.display = ''
    }
}

let extractTemplateContent = (template) => {
    let content = template.content
    template.remove()
    return content
}

let extractScript = (root) => {
    let script = root.querySelector('script')
    script?.remove()
    return script
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

// NOTE must run set globals (eg. $props) before calling this
// NOTE must import as module to allow imports inside script code
let runScriptAndGetScope = async (script) =>
    script ? await import(createImportUrl(parseScript(script))) : {}

// LATER wrap argument of $derive calls in arrow function
let parseScript = (script) => {
    let code = script.textContent
    let declarations = code.match(allDeclarationsRe)?.map(m => m.match(declarationRe)[3]) ?? []
    return code + '\n' + `export { ${declarations.join(', ')} }`
}

let createImportUrl = (code) => URL.createObjectURL(
    new Blob([code], { type: 'application/javascript' })
)

let componentInitQueue = new AsyncQueue({ handler: cmp => cmp.init() })

let parseAndBindDom = (element, scope) => {
    console.debug('parseAndBindDom', element.tagName, { element, isComponent: element instanceof Component, task: scope.task, scope })

    if (element.tagName === 'STYLE')
        return

    // NOTE either :if or :for allowed
    let ifAttr = extractAttr(ATTRIBUTES.if, element)
    let forAttr = extractAttr(ATTRIBUTES.for, element)
    if (ifAttr) return bindIfAttr(ifAttr, element, scope)
    else if (forAttr) return bindForAttr(forAttr, element, scope)

    if (extractAttr(ATTRIBUTES.elsif, element) ||
        extractAttr(ATTRIBUTES.else, element) !== null
    ) return // skip elsif/else elements. they are bound along with if/for elements

    for (let { name } of [...element.attributes]) // spread to prevent catching newly set attributes
        parseAndBindAttribute(name, element, scope)

    for (let child of [...element.children]) // spread to prevent catching newly appended elements
        parseAndBindDom(child, scope)

    bindTemplateExpressions(element, scope)

    if (element instanceof Component)
        componentInitQueue.push(element)
}

let extractAttr = (name, el) => {
    let val = el.getAttribute(name)
    if (val !== null) el.removeAttribute(name)
    return val
}

// TODO test in custom elements with multiple children
// TODO? return anchor from binding function to allow gc when parent element is removed
let bindIfAttr = (value, element, scope) => {
    console.debug('bindIfAttr', element.tagName, { element, scope })

    let el = element
    let branches = [{ exp: value, el }]
    while (el = el.nextElementSibling) {
        let exp = extractAttr(ATTRIBUTES.elsif, el)
        if (exp || extractAttr(ATTRIBUTES.else, el) !== null)
            branches.push({ exp, el })
        else
            break
    }
    let list = createListRenderer(...branches.map(b => b.el))
    for (let b of branches) {
        b.eval = b.exp ? createEvaluator(b.exp, scope) : () => true // elsif : else
        b.el = b.el.cloneNode(true)
    }

    let current
    bind(() => {
        let active = branches.find(b => b.eval())?.el
        if (active !== current) {
            list.clear()
            if (active) {
                let clone = active.cloneNode(true)
                list.add(clone)
                parseAndBindDom(clone, scope)
            }
            current = active
        }
        return document // prevent gc of binding
    })
}

let createEvaluator = (expr, scope) => {
    console.debug('createEvaluator', { expr, scope })

    let body = expr.includes(';') ? expr : `return ${expr}`
    let params = Object.keys(scope)
    let args = Object.values(scope)
    let evaluate = new Function(...params, body)

    return () => {
        console.debug('evaluate', { expr, scope })
        return evaluate(...args)
    }
}

// NOTE must run before element is removed from dom
let createListRenderer = (...initial) => {
    let elements = initial
    let first = elements[0]
    let parent = first.parentElement
    let anchor = new Comment('anchor')
    first.before(anchor)
    let list = {
        clear: () => {
            elements.forEach(el => el.remove())
            elements = []
        },
        add: (el) => {
            parent.insertBefore(el, anchor)
            elements.push(el)
        },
    }
    list.clear()
    return list
}

// TODO handle :else
// TODO? return anchor from binding function to allow gc when parent element is removed
// LATER handle destructure. idea: pass ...rest param to evaluator
// LATER optimize re-render
let bindForAttr = (value, element, scope) => {
    console.debug('bindForAttr', element.tagName, { element, scope })

    let [itemName, itemsExpr] = value.split(' in ')
    let evaluateItems = createEvaluator(itemsExpr, scope)
    let list = createListRenderer(element)
    let itemEl = element.cloneNode(true)
    bind(() => {
        let items = evaluateItems()
        list.clear()
        for (let item of items) {
            let clone = itemEl.cloneNode(true)
            list.add(clone)
            parseAndBindDom(clone, { ...scope, [itemName]: item })
        }
        return document // prevent garbage collection of binding
    })
}

// FIX when we bound an attribute, the parseAndBindDom then finds and processes it again
// TODO read vue docs and add missing essential functionality (https://vuejs.org/guide/essentials/template-syntax.html#attribute-bindings)
let parseAndBindAttribute = (name, element, scope) => {
    console.debug('parseAndBindAttribute', name, { element, scope })

    let value = element.getAttribute(name)
    if (name === ':model')
        bindModelAttr(element, scope)
    else if (name.startsWith(':'))
        bindAttribute(name.slice(1), value, element, scope)
    else if (name.startsWith('@'))
        bindEventListenerAttr(name.slice(1), value, element, scope)
    else if (element instanceof Component)
        element.setProp(name, value)
}

let bindModelAttr = (element, scope) => {
    console.debug('bindModelAttr', element.tagName, { element, scope })

    // let value = extractAttr(ATTRIBUTES.model, element)
    // bindAttribute('value', value, element, scope)

    // let value = extractAttr(ATTRIBUTES.model, element)
    // bind(() => element.value = evaluate(value), element)
    // TODO set state value. handle object state and primitive state (.val)
    // TODO use addEventListener (guarantee run once)
    // element.oninput = (e) => 
}

let bindAttribute = (name, value, element, scope) => {
    let evaluate = createEvaluator(value || name, scope)
    bind(() => {
        let result = evaluate()
        let newVal = result.isState ? result.val : result
        if (result && typeof result !== 'object')
            element.setAttribute(name, newVal)
        else
            element.removeAttribute(name)
        if (element instanceof Component)
            element.setProp(name, newVal)
        return element
    })
}

let bindEventListenerAttr = (name, value, element, scope) => {
    let evaluate = createEvaluator(value, {
        ...scope,
        $emit: emit.bind(element),
    })
    let listener = (event) => {
        let result = evaluate()
        result instanceof Function && result(event)
    }
    element.addEventListener(name, listener) // TODO bind?
}

let bindTemplateExpressions = (element, scope) => {
    for (let node of element.childNodes) {
        if (!(node instanceof Text))
            continue
        let originalText = node.textContent
        let templates = findTemplateExpressions(node.textContent)
            .map(exp => ({ exp, eval: createEvaluator(exp.slice(1, -1), scope) }))
        if (templates.length) {
            bind(() => {
                let newText = originalText
                templates.forEach((t) => newText = newText.replace(t.exp, t.eval()))
                node.textContent = newText
                return node
            })
        }
    }
}

let findTemplateExpressions = (text) => {
    let [openChar, closeChar] = TEMPLATE_DELIMITERS
    let start, count = 0, expressions = []
    for (let i = 0; i < text.length; i++) {
        if (text[i] === openChar && count++ === 0)
            start = i
        else if (text[i] === closeChar && --count === 0)
            expressions.push(text.slice(start, i + 1))
    }
    return expressions
}

let extractAppContent = () => extractTemplateContent(document.querySelector('template[app]'))

init()
