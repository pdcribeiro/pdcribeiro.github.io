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
