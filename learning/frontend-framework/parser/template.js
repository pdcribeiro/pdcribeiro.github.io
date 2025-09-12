import { parseTemplateExpressions, parseText } from './text.js'

export let parseChildren = (el) =>
    el instanceof HTMLStyleElement ? parseText(el.textContent) :
        `[\n${[...el.childNodes].map(parseNode).filter(Boolean).join('')}]`

let parseNode = (n) => (
    n instanceof Element ? parseElement(n) :
        n instanceof Text ? parseTextNode(n) :
            null
)

let parseElement = (el) => extractAndParseLogicAttributes(el)(
    `,$van.tags['${el.tagName}']({${parseAttributes(el)}},${parseChildren(el)})\n`
)

let attrNames = {
    if: ':if',
    elsif: ':elsif',
    else: ':else',
    for: ':for',
    await: ':await',
    catch: ':catch',
    model: ':model',
}
let logicAttrNames = attrNames.pick('if', 'elsif', 'else', 'for', 'await', 'catch').values().toSet()

let extractAndParseLogicAttributes = (el) => {
    let logicAttrs = [...el.attributes].filter(({ name }) => logicAttrNames.has(name)) // keep order
    let wrappers = []
    for (let { name } of logicAttrs) {
        let value = extractAttr(name, el)
        switch (name) {
            case attrNames.if:
                wrappers.push((content) => `,$vanUtils.If(() => ${value}).Then(\n${content.slice(1)})`)
                break
            case attrNames.elsif:
                wrappers.push((content) => `.ElseIf(() => ${value}).Then(\n${content.slice(1)})`)
                break
            case attrNames.else:
                wrappers.push((content) => `.Else(\n${content.slice(1)})`)
                break
            case attrNames.for: {
                let [item, list] = value.split(' in ')
                wrappers.push((content) => `,$vanUtils.For(() => ${list}).Each((${item}) =>\n${content.slice(1)})\n`)
                break
            }
            case attrNames.await: {
                let [promise, result] = value.split(' as ')
                wrappers.push((content) => `,$vanUtils.Await(${promise}).Then((${result}) =>\n${content.slice(1)})\n`)
                break
            }
            case attrNames.catch:
                wrappers.push((content) => `.Catch((${value}) =>\n${content.slice(1)})`)
                break
        }
    }
    return wrappers.length ? wrappers.compose() : c => c
}

let extractAttr = (name, el) => {
    let val = el.getAttribute(name)
    if (val !== null) el.removeAttribute(name)
    return val
}

// TODO read vue docs and add missing essential functionality (https://vuejs.org/guide/essentials/template-syntax.html#attribute-bindings)
let parseAttributes = (el) => [...el.attributes]
    .map(({ name }) => [name, el.getAttribute(name)])
    .tap(parseModelAttribute)
    .map(([k, v]) =>
        k.startsWith(':') ? [k.slice(1), `() => (${v || k.slice(1)})`] :
            k.startsWith('@') ? ['on' + k.slice(1), `$ev.wrap(($event, $emit) => (${v}))`] :
                [k, parseText(v)])
    .map(([k, v]) => k + ':' + v)
    .join(',')

let parseModelAttribute = (attributes) => {
    let index = attributes.findIndex(([k]) => k === attrNames.model)
    if (index !== -1) {
        let [k, v] = attributes[index]
        attributes.push(
            [':value', `${v}.val`],
            ['@input', `e => ${v}.val = e.target.value`],
        )
    }
    return attributes
}

let parseTextNode = (n) => n.data.trim().length ? `${parseTemplateExpressions(n.data)}\n` : null
