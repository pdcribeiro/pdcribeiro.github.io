export function pick(object, keys) {
    return keys.reduce((p, k) => ({ ...p, [k]: object[k] }), {})
}

export function transformEntries(object, callback) {
    return Object.fromEntries(
        Object.entries(object).map(callback)
    )
}

export function transformValues(object, callback) {
    return transformEntries(object, ([k, v]) => [k, callback(v)])
}
