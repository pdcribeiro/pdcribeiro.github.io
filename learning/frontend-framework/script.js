export let createScriptFunction = async (script) => {
    if (!script)
        return { default: () => { } }
    let blob = createBlob(parseScript(script))
    let url = URL.createObjectURL(blob)
    let exports = await import(url)
    URL.revokeObjectURL(url)
    return exports.default
}

let parseScript = (script) => wrapInContextFunction(rewriteImports(script.textContent))

let importsRewriteRe = /\bimport(?:\s+(?:[^'"]+\s+from\s+)?|\s*\(\s*)['"](?<path>(?:\.{1,2})?\/[^'"]+)['"]/g

// Rewrites imports to use full URL. Needed for dynamic import
let rewriteImports = (code) =>
    code.replace(importsRewriteRe, (match, _, offset, string, { path }) =>
        match.replace(path, import.meta.resolve(path))
    )

let wrapInContextFunction = (code) => {
    let importsEnd = getStaticImportsEnd(code)
    let onlyImports = code.slice(0, importsEnd)
    let onlyCode = code.slice(importsEnd)
    let declarations = getDeclarations(code)
    return `
    ${onlyImports}
    export default function({ $props, $state, $derive, $emit }) {
        ${onlyCode}
        return { ${declarations.join(', ')} }
    }`
}

let importRe = /^\s*import\s.+\n/gm

let getStaticImportsEnd = (code) => {
    const matches = [...code.matchAll(importRe)]
    if (!matches.length)
        return 0
    const lastMatch = matches[matches.length - 1]
    return lastMatch.index + lastMatch[0].length + 1
}

let importsRe = /import\s+((?:\w+|\{[^}]+\})(?:\s*,\s*\{[^}]+\})?)\s*from\s*['"][^'"]+['"]/g
let varsRe = /(var|let|const)\s+((?:\{[^}]*\}|\$begin:math:display\$[^\$end:math:display\$]*\]|\w+)(?:\s*,\s*(?:\{[^}]*\}|\$begin:math:display\$[^\$end:math:display\$]*\]|\w+))*)/g
let funcsAndClassesRe = /(?:async\s+)?function\s*\*?\s*(\w+)|class\s+(\w+)/g

let getDeclarations = (code) => {
    let declarations = []
    for (let match of code.matchAll(importsRe)) {
        declarations.push(...extractImportOrVarNames(match[1]))
    }
    for (let match of code.matchAll(varsRe)) {
        declarations.push(...extractImportOrVarNames(match[2].replace(/[\[\]\s]/g, '')))
    }
    for (let match of code.matchAll(funcsAndClassesRe)) {
        declarations.push(match[1] || match[2]).filter(Boolean)
    }
    return [...new Set(declarations)]
}

let extractImportOrVarNames = (str) => str
    .split(',')
    .map(s => s.trim())
    .flatMap(part => {
        if (part.startsWith('{')) {
            return part
                .replace(/[\{\}]/g, '')
                .split(',')
                .map(s => s.trim())
                .filter(Boolean)
        }
        return part ? [part] : []
    })

let createBlob = (code) => new Blob([code], { type: 'application/javascript' })
