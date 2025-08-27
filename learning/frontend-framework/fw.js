/*
    todo:
    - parse and bind html

    features:
    - allow defining component in html file (optional: without surrounding template tag) and importing it into another html/component file
*/

import { kebab } from '/lib/string.js'

let init = () => {
    let $props = () => ({}) // creates state object that reacts to changes on parent component
    let $state = v => v
    let $derive = f => f()
    let $emit = () => { }

    let baseScope = {
        $props,
        $state,
        $derive,
        $emit,
    }

    Object.assign(window, baseScope)

    let components = findAndDefineComponents(document)

    let appTemplate = document.querySelector('template[app]')
    let app = parseTemplate(appTemplate)
    appTemplate.remove()
    console.debug({ app })

    // append html to body
    document.body.append(app.root)
}

let findAndDefineComponents = (root, scope = {}) => {
    let templates = root.querySelectorAll('template[component]')
    let components = Array.from(templates).map(t => parseTemplate(t, scope))
    console.debug({ components })

    templates.forEach(t => (defineComponent(t), t.remove()))

    return components
}

const declarationRe = /^\s*(var|let|const|function) ([{\[]\s+)?(\w+)(\s+[}\]])?[ =(]/
const allDeclarationsRe = new RegExp(declarationRe, 'gm')

let parseTemplate = (template, scope = {}) => {
    console.debug('parseTemplate()', { template, scope })

    let root = template.content.cloneNode(true)
    console.debug({ root })

    // find script tags
    let scripts = root.querySelectorAll('script')
    console.debug({ scripts })

    for (let s of scripts) {
        // parse and export declarations
        let code = s.textContent
        console.debug({ code })
        let declarations = code.match(allDeclarationsRe)?.map(m => m.match(declarationRe)[3]) ?? []
        console.debug({ declarations })
        let exports = `export { ${declarations.join(', ')} }`
        console.debug({ exports })

        let codeWithExports = code + '\n' + exports

        // LATER wrap argument of $derive calls in arrow function

        // import rewritten script tags
        let blob = new Blob([codeWithExports], { type: 'application/javascript' })
        let url = URL.createObjectURL(blob)
        let moduleExports = import(url)

        // build scope object
        scope = { ...scope, ...moduleExports }

        s.remove()
    }
    console.debug(scope)

    let components = findAndDefineComponents(root, scope)

    // TODO parse and bind html

    return { root, scope }
}

let defineComponent = (template) => {
    let name = template.getAttribute('component')
    class Component extends HTMLElement {
        constructor() {
            super()
            let shadowRoot = this.attachShadow({ mode: 'open' })
            shadowRoot.appendChild(template.content.cloneNode(true))
        }
    }
    customElements.define(kebab(name), Component)
}

init()

function walk() {
    let walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT)
    let node = walker.firstChild()
    while (node) {
        // console.log(node, node.attributes)
        for (let attr of node.attributes) {
            // console.log('attr', attr.name)
            const expr = node.getAttribute(attr.name)
            const func = () => evaluate(expr,)
            switch (attr.name) {
                case ':if': {
                    // bind(node, attr.value, (val) => {
                    //     if (val) {
                    //         if (node._content) {
                    //             node.append(node._content)
                    //             node._content = null
                    //         }
                    //     } else {
                    //         let fragment = new DocumentFragment()
                    //         fragment.append(...Array.from(node.childNodes))
                    //         node._content = fragment
                    //     }
                    // })
                    break
                }
                case ':for': {
                    break
                }
            }
        }
        node = walker.nextNode()
    }
}

function evaluate(expr, scope) {
    const keys = Object.keys(scope)
    const values = Object.values(scope)
    const fn = new Function(...keys, `return ${expr};`)
    return fn(...values)
}
