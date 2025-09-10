import { compose } from '/lib/functions.js'
import { pick, transformEntries, transformValues } from '/lib/object.js'
import { kebab } from '/lib/string.js'

let pack = (fn, start = 0) => (...args) => fn(...args.slice(0, start), args.slice(start))
let unpack = (fn, start = 0) => (args) => fn(...args.slice(0, start), ...args.slice(start))
let tap = (v, fn) => fn(v)

patch()

function patch() {
    patchMethods(Object.prototype, {
        keys: Object.keys,
        values: Object.values,
        pick: pack(pick, 1),
        transformEntries,
        transformValues,
        tap,
    })
    patchMethods(Array.prototype, {
        toObject: Object.fromEntries,
        toSet: (arr) => new Set(arr),
        compose: unpack(compose),
        tap,
    })
    patchMethods(String.prototype, {
        kebab,
    })
}

function patchMethods(targetProto, functions) {
    for (const [name, fn] of Object.entries(functions)) {
        targetProto[name] = function (...args) {
            return fn(this, ...args)
        }
    }
}
