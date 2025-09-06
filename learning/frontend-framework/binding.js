import { Component } from './component.js'
import { emit } from './event.js'
import { bind } from './state.js'

export let parseAndBindChildren = (element, scope) =>
    [...element.children].forEach(c => parseAndBindDom(c, scope)) // spread to prevent catching newly appended elements

let ATTRIBUTES = {
    if: ':if',
    elsif: ':elsif',
    else: ':else',
    for: ':for',
    model: ':model',
}

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

    parseAndBindChildren(element, scope)

    bindTemplateExpressions(element, scope)

    if (element instanceof Component)
        element.render()
}

let extractAttr = (name, el) => {
    let val = el.getAttribute(name)
    if (val !== null) el.removeAttribute(name)
    return val
}

// TODO test in custom elements with multiple children
let bindIfAttr = (value, element, scope) => {
    console.debug('bindIfAttr', element.tagName, { element, scope })

    let render = createRenderer(element)

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
        b.eval = b.exp ? createEvaluator(b.exp, scope) : () => true // elsif : else
        b.el.remove()
        b.el = b.el.cloneNode(true)
    }

    let current
    bind(() => {
        let active = branches.find(b => b.eval())?.el
        if (active !== current) {
            current = active
            if (active) {
                let clone = active.cloneNode(true)
                parseAndBindDom(clone, scope)
                render(clone)
                return clone
            } else
                render()
        }
        return document
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
let createRenderer = (element) => {
    let frag = document.createDocumentFragment()
    let current = []
    let parent = element.parentNode
    let anchor = new Comment('anchor')
    element.before(anchor)
    return (...elements) => {
        frag.append(...elements)
        current.forEach(el => el.remove())
        parent.insertBefore(frag, anchor)
        current = elements
    }
}

// LATER handle destructure. idea: pass ...rest param to evaluator
// LATER optimize re-render
let bindForAttr = (value, element, scope) => {
    console.debug('bindForAttr', element.tagName, { element, scope })

    let [itemName, itemsExpr] = value.split(' in ')
    let evaluateItems = createEvaluator(itemsExpr, scope)
    let render = createRenderer(element)
    let forEl = element.cloneNode(true)
    let nextEl = element.nextElementSibling
    let elseEl = nextEl?.hasAttribute(ATTRIBUTES.else) ? (nextEl.remove(), nextEl.cloneNode(true)) : null
    element.remove()
    bind(() => {
        let items = evaluateItems()
        let elements = !items.length && elseEl ?
            [elseEl.cloneNode(true)] :
            items.map(item => {
                let clone = forEl.cloneNode(true)
                parseAndBindDom(clone, { ...scope, [itemName]: item })
                return clone
            })
        render(...elements)
        return elements[0] ?? document
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

// NOTE evaluates expression once to check if needs .val suffix
let bindModelAttr = (element, scope) => {
    console.debug('bindModelAttr', element.tagName, { element, scope })

    let value = extractAttr(ATTRIBUTES.model, element)
    bindAttribute('value', value, element, scope)

    let result = createEvaluator(value, scope)()
    let varExpr = result.isState ? `${value}.val` : value
    let expr = `(e) => ${varExpr} = e.target.value`
    bindEventListenerAttr('input', expr, element, scope)
}

// TODO: check edge cases
let bindAttribute = (name, value, element, scope) => {
    let evaluate = createEvaluator(value || name, scope)
    bind(() => {
        let result = evaluate()
        result = result.isState ? result.val : result
        setAttribute(name, result, element)
        if (element instanceof Component)
            element.setProp(name, result)
        return element
    })
}

let propSetterCache = {}

var setAttribute = (name, value, element) => {
    let cacheKey = element.tagName + ',' + name
    let propSetter = propSetterCache[cacheKey] ??= getPropDescriptor(element, name)?.set ?? 0
    let setter = propSetter ? propSetter.bind(element) : element.setAttribute.bind(element, name)
    setter(value)
}

var getPropDescriptor = (proto, name) => proto && (
    Object.getOwnPropertyDescriptor(proto, name) ??
    getPropDescriptor(Object.getPrototypeOf(proto), name)
)

let bindEventListenerAttr = (name, value, element, scope) => {
    let evaluate = createEvaluator(value, {
        ...scope,
        $emit: emit.bind(element),
    })
    let previous
    bind(() => {
        let listener = (event) => {
            let result = evaluate()
            result instanceof Function && result(event)
        }
        element.removeEventListener(name, previous)
        element.addEventListener(name, listener) // TODO bind?
        previous = listener
        return element
    })
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

let TEMPLATE_DELIMITERS = '{}'

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
