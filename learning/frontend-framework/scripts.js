export let getScript = (root) => {
    let script = extractScript(root)
    return script && createBlob(parseScript(script))
}

// NOTE must set globals (eg. $props) before
export let importScript = async (blob) => {
    if (!blob)
        return {}
    let url = URL.createObjectURL(blob)
    let exports = await import(url)
    URL.revokeObjectURL(url)
    return exports
}

let extractScript = (root) => {
    let script = root.querySelector('script')
    script?.remove()
    return script
}

// LATER wrap argument of $derive calls in arrow function
let parseScript = (script) => appendExports(rewriteImports(script.textContent))

// Matches import statements like:
// import x from '...'
// import {x} from "..."
// import '...'
// import(/* ... */ '...')
let importsRewriteRe = /\bimport(?:\s+(?:[^'"]+\s+from\s+)?|\s*\(\s*)['"](?<path>\/[^'"]+|\.{1,2}\/[^'"]+)['"]/g

let rewriteImports = (code) =>
    code.replace(importsRewriteRe, (match, _, offset, string, { path }) =>
        match.replace(path, import.meta.resolve(path))
    )

const importsRe = /import\s+((?:\w+|\{[^}]+\})(?:\s*,\s*\{[^}]+\})?)\s*from\s*['"][^'"]+['"]/g
const varsRe = /(var|let|const)\s+((?:\{[^}]*\}|\$begin:math:display\$[^\$end:math:display\$]*\]|\w+)(?:\s*,\s*(?:\{[^}]*\}|\$begin:math:display\$[^\$end:math:display\$]*\]|\w+))*)/g
const funcsAndClassesRe = /(?:async\s+)?function\s*\*?\s*(\w+)|class\s+(\w+)/g

let appendExports = (code) => {
    const declarations = []
    for (const match of code.matchAll(importsRe)) {
        declarations.push(...extractImportOrVarNames(match[1]))
    }
    for (const match of code.matchAll(varsRe)) {
        declarations.push(...extractImportOrVarNames(match[2].replace(/[\[\]\s]/g, '')))
    }
    for (const match of code.matchAll(funcsAndClassesRe)) {
        declarations.push(match[1] || match[2]).filter(Boolean)
    }
    const uniqueDeclarations = [...new Set(declarations)]
    const exportsLine = `\nexport { ${uniqueDeclarations.join(', ')} }`
    return code + exportsLine
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
