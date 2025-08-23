import { pick, transformEntries, transformValues } from '/lib/objects.js'

export function monkeyPatchHelperMethods() {
    patchMethods(Object.prototype, {
        transformEntries,
        transformValues,
    })
    Object.prototype.pick = function (...keys) {
        return pick(this, keys)
    }
}

function patchMethods(targetProto, functions) {
    for (const [name, fn] of Object.entries(functions)) {
        targetProto[name] = function (...args) {
            return fn(this, ...args)
        }
    }
}
