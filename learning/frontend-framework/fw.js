/*
    wip:
    - parseAndBindAttribute

    features:
    - allow defining component in html file (optional: without surrounding template tag) and importing it into another html/component file
*/

import { kebab } from '/lib/string.js'
import { state, derive, bind } from './state.js'

let init = async () => {
    setGlobals({
        $state: state,
        $derive: derive,
        $emit: () => { },
    })

    findAndDefineComponents(document)
    // observeComponentAttributesAndUpdateProps(document.body)

    let app = getAppElement()
    let scope = await parseAndImportScript(app)
    document.body.append(app)
    parseAndBindDom(document.body, scope) // must happen after appendChild. doesn't parse custom elements
    // TODO: maybe parseAndBindDom should happen before app mounts. can we make it work? (eg. parseAndBindDom(app, scope)). check logs before and after changing
}

let setGlobals = (globals) => Object.assign(window, globals)

let findAndDefineComponents = (root) => {
    root.querySelectorAll('template[component]')
        .forEach(t => (defineComponent(t), t.remove()))
}

let getAppElement = () => {
    let template = document.querySelector('template[app]')
    let element = template.content.cloneNode(true)
    template.remove()
    return element
}

let defineComponent = (template) => {
    let name = template.getAttribute('component')
    class Component extends HTMLElement {
        constructor() {
            console.debug('constructor', name)
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

            let scope = await parseAndImportScript(root) // must happen before appendChild
            // TODO: this async call makes it so document is bound before components, but is it realiable?

            let shadowRoot = this.attachShadow({ mode: 'open' })
            // observeComponentAttributesAndUpdateProps(shadowRoot)

            shadowRoot.appendChild(root)

            parseAndBindDom(shadowRoot, scope) // must happen after appendChild
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

// TODO parse and bind innerText (get childNodes, filter text nodes, parse, bind)
// note: careful when using document fragments. if they were already appended, they'll be empty
let parseAndBindDom = (element, scope) => {
    console.debug('parseAndBindDom', { element, scope })

    for (let { name } of element.attributes)
        parseAndBindAttribute(name, element, scope)

    for (let child of element.children)
        console.debug({ child }, child.isComponent),
            parseAndBindDom(child, scope)
}

let boundAttributeRe = /^(:|@)\w+$/

let parseAndBindAttribute = (name, element, scope) => {
    console.debug('parseAndBindAttribute', { name, element, scope })

    let rawName = name.startsWith(':') ? name.slice(1) : name
    let value = element.getAttribute(name)
    switch (name) {
        // TODO: test in custom elements with multiple children
        case ':if': {
            let parent = element.parentElement
            let anchor = new Comment(':if')
            parent.insertBefore(anchor, element)

            let el = element
            let branches = [{ exp: value, el }]
            while (el = el.nextElementSibling) {
                let exp = extractAttr(':else-if', el)
                if (exp || extractAttr(':else', el) !== null)
                    branches.push({ exp, el })
                else
                    break
            }
            branches.forEach(b => b.el.remove())

            bind(() => {
                let active = branches.find(b => !b.exp || evaluate(b.exp, scope))?.el
                let current = branches.find(b => b.el.isConnected)?.el
                if (active !== current) {
                    current?.remove()
                    parent.insertBefore(active, anchor)
                }
            }, anchor)
            break
        }
        case ':else': {
            break
        }
        case ':for': {
            break
        }
        case ':model': {
            // bind(() => element.value = evaluate(value), element)
            // TODO: set state value. handle object state and primitive state (.val)
            // TODO: use addEventListener (guarantee run once)
            // element.oninput = (e) => 
            break
        }
        default: {
            if (name.startsWith(':')) {
                if (element.isComponent)
                    bind(() => {
                        let result = evaluate(value || rawName, scope)
                        element._props[rawName] = result.isState ? result.val : result
                    }, element)
                else
                    bind(() => element.setAttribute(rawName, value), element)
                // } else if (name.startsWith('@')) {
            }
        }
    }
}

let extractAttr = (name, el) => {
    let val = el.getAttribute(name)
    if (val !== null) el.removeAttribute(name)
    return val
}

let evaluate = (expr, scope) => {
    console.debug('evaluate', { expr, scope })
    let keys = Object.keys(scope)
    let values = Object.values(scope)
    try {
        let fn = new Function(...keys, `return ${expr};`)
        return fn(...values)
    } catch (e) {
        console.error('evaluate error', { expr, scope })
        return expr
    }
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
