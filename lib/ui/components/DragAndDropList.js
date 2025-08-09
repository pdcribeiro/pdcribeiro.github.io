const preventDefault = (e) => e.preventDefault()

// Use cases:
// clicks and holds item > drags item > drops item > item is moved
// clicks and holds item > releases item > item is selected > clicks item > item is deselected
// clicks and holds item > releases item > item is selected > clicks other item > other item is selected > clicks and holds either item > drags item > drop item > both items are moved
// clicks and holds item > releases item > item is selected > clicks and holds other item > other item is selected > drags item > drop item > both items are moved
//
// FIX: sometimes mouseup event is not received so items are never dropped
// TODO: figure out contracts: addItem, removeItem
// TODO: add scroll support
// TODO: return getIndex?, addItem, removeItem
export function DragAndDropList({ onMove }) {
    const itemSelection = new ItemSelectionManager({
        onSelect: (el) => el.style.backgroundColor = 'gray',
        onDeselect: (el) => {
            el.style.background = 'none'
            if (itemSelection.selected.size === 0) {
                setEditableForAll(el, true)
            }
        },
    })

    const dragAndDrop = new DragAndDropManager({
        placeholder: hr(),
        onDrop(selected, dropped) {
            itemSelection.clear()
            onMove(selected, dropped)
        },
    })

    let ignoreClick = false

    const clickAndHold = new ClickAndHoldManager({
        onHold(event) {
            const element = getItemElement(event)

            if (itemSelection.selected.size === 0) {
                itemSelection.start(element)
                setEditableForAll(element, false)
            } else if (!itemSelection.selected.has(element)) {
                itemSelection.toggle(element)
            }

            document.addEventListener('mousemove', onPointerMove)
            document.addEventListener('touchmove', onPointerMove, { passive: false })
        },
        onHoldRelease(event) {
            ignoreClick = true // ignore click triggered in mouse devices, which would deselect item
            setTimeout(() => ignoreClick = false, 50)

            dragAndDrop.drop(...itemSelection.selected)

            document.removeEventListener('mousemove', onPointerMove)
            document.removeEventListener('touchmove', onPointerMove)
        },
    })

    function onPointerMove(event) {
        event.preventDefault() // prevent scroll when holding on touch devices
        dragAndDrop.drag(getPointerY(event))
    }

    return {
        render(...children) {
            return ul({
                onpointermove: clickAndHold.abort, // allow scrolling on touch devices
                ondragstart: preventDefault, // disable drag and drop API which doesn't support touch devices
                oncontextmenu: preventDefault, // disable context menu on touch devices, which is triggered on click and hold
                style: 'padding: 0',
            },
                children.map(element =>
                    li({
                        contenteditable: true,
                        onmousedown: clickAndHold.click,
                        onmouseup: clickAndHold.release,
                        ontouchstart: clickAndHold.click,
                        ontouchend: clickAndHold.release,
                        onclick: (e) => ignoreClick || itemSelection.toggle(getItemElement(e)),
                        onpointerdown: (e) => e.target.releasePointerCapture(e.pointerId), // allows receiving onpointerenter on touch devices
                        onpointerenter: (e) => dragAndDrop.hover(getItemElement(e)),
                        style: 'touch-action: manipulation',
                    }, element)
                )
            )
        },
        // addItem() { },
        // removeItem() { },
    }
}

function setEditableForAll(element, value) {
    Array.from(
        element.parentElement.querySelectorAll('li')
    ).forEach(el => el.setAttribute('contenteditable', value))
}

function getItemElement(event) {
    return event.target.closest('li')
}

function getPointerY(event) {
    return event.clientY ?? event.touches[0].clientY
}

// Utils

const CLICK_AND_HOLD_TIME = 500

function ClickAndHoldManager({ onHold, onHoldRelease }) {
    let timeout

    return {
        click(event) {
            timeout = setTimeout(() => {
                onHold(event)
                timeout = null
            }, CLICK_AND_HOLD_TIME)
        },
        release(event) {
            if (timeout) clearTimeout(timeout)
            else onHoldRelease(event)
        },
        abort() {
            clearTimeout(timeout)
        },
    }
}

function ItemSelectionManager({ onSelect, onDeselect }) {
    const selected = new Set()

    return {
        selected,
        start: (item) => selected.size === 0 && toggleItem(item),
        toggle: (item) => selected.size > 0 && toggleItem(item),
        clear: () => selected.forEach(toggleItem),
    }

    function toggleItem(item) {
        if (selected.has(item)) {
            selected.delete(item)
            onDeselect(item)
        } else {
            selected.add(item)
            onSelect(item)
        }
    }
}

function DragAndDropManager({ placeholder, onDrop }) {
    let hoveredElement

    return {
        hover: (el) => hoveredElement = el,
        drag: movePlaceholder,
        drop: (...elements) => {
            if (!placeholder.parentElement) { // placeholder not in DOM
                return
            }
            const allElements = Array.from(placeholder.parentElement.children)
            const itemElements = allElements.filter(el => el !== placeholder)
            const selectedIndexes = elements.map(el => itemElements.indexOf(el))
            const droppedIndex = allElements.indexOf(placeholder)
            placeholder.replaceWith(...elements)
            onDrop(selectedIndexes, droppedIndex)
        },
    }

    function movePlaceholder(pointerY) {
        const rect = hoveredElement.getBoundingClientRect()
        const centerY = rect.top + rect.height / 2

        if (pointerY < centerY && placeholder.nextSibling !== hoveredElement) {
            hoveredElement.insertAdjacentElement('beforebegin', placeholder)
        } else if (pointerY >= centerY && hoveredElement.nextSibling !== placeholder) {
            hoveredElement.insertAdjacentElement('afterend', placeholder)
        }
    }
}
