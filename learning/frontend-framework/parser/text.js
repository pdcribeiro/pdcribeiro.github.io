let TEMPLATE_DELIMITERS = '{}'
let [openChar, closeChar] = TEMPLATE_DELIMITERS

export let parseTemplateExpressions = (text) => {
    let i, count = 0, start = 0, nodes = []
    for (i = 0; i < text.length; i++) {
        if (text[i] === openChar && count++ === 0) {
            i > 0 && nodes.push(parseText(text.slice(start, i)))
            start = i + 1
        } else if (text[i] === closeChar && --count === 0) {
            nodes.push(parseTemplate(text.slice(start, i)))
            start = i + 1
        }
    }
    if (start < i)
        nodes.push(parseText(text.slice(start)))
    return nodes.join(',')
}

export let parseText = (text) => `\`${escapeQuotes(text)}\``

let quoteRe = /'|"|`/g
let escapeQuotes = (text) => text.replaceAll(quoteRe, '\\$&')

let parseTemplate = (text) => `() => ${text}`
