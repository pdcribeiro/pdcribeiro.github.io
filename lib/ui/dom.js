export function getChildIndex(child, parent) {
    return Array.from(parent.children).indexOf(child)
}

export function findDirectChild(grandchild, parent) {
    let el = grandchild
    while (el && el.parentElement !== parent) {
        el = el.parentElement
    }
    return el
}

export function setAttributesAndListeners(element, listenersAndAttributes) {
    for (const [k, v] of Object.entries(listenersAndAttributes)) {
        if (k.startsWith('on')) {
            element[k] = v
        } else if (v instanceof Function) {
            throw new Error('prop value can not be function')
        } else {
            element.setAttribute(k, v)
        }
    }
}
