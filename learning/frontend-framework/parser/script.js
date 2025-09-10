export let extractAndParseScript = (content) => {
    return parseScript(extractScript(content))
}

let extractScript = (root) => {
    let script = root.querySelector('script')
    script?.remove()
    return script
}

let systemImports = [
    'import $van, * as $vanUtils from "/lib/ui/web/van-wrapper.js"',
    'import * as $ev from "./event.js"',
]

let importRe = /\bimport\b[^'"(.]*(?<isDynamic>\([^'"]*)?['"](?:(?<path>(?:\.{1,2})?\/[^'"]+)|[^'"]+)['"] *;?/

let parseScript = (script) => {
    let scriptCode = script?.textContent.split('\n') ?? []
    let match, lastImport
    let code = [...systemImports, ...scriptCode]
        .map((line, i) => {
            if (match = line.match(importRe)) {
                let { isDynamic, path } = match.groups
                if (!isDynamic)
                    lastImport = i
                if (path)
                    return line.replace(path, resolvePath(path))
            }
            return line
        })
    let logicIndex = lastImport ? lastImport + 1 : 0
    return {
        imports: code.slice(0, logicIndex).join('\n'),
        logic: code.slice(logicIndex).join('\n'),
    }
}

// TODO allow imports relative to html file. currently relative to app root
// Needed for blob import
let resolvePath = (p) => import.meta.resolve(
    p.startsWith('.') ? '../' + p : p
)
