import { stl } from '/lib/ui/utils.js'

const CLICK_AND_HOLD_TIME = 500
const CLICK_DEBOUNCE_TIME = 50

const preventDefault = (e) => e.preventDefault()

// FIX: add pointer move threshold to trigger drag
// FIX: sometimes mouseup event is not received so items are never dropped
// TODO: add scroll support
export function DragAndDropList({ items: rawItems, onSelect, onDeselect, onDrop }) {
    const itemSelection = new ItemSelectionManager({
        onSelect: (el) => onSelect(getItemIndex(el), itemSelection.selected), // get index here otherwise placeholder can mess with has() logic
        onDeselect: (el) => onDeselect(getItemIndex(el), itemSelection.selected),
    })

    const dragAndDrop = new DragAndDropManager({
        placeholder: hr(),
        onDrop(selected, dropped) {
            itemSelection.clear()
            onDrop(selected, dropped)
        },
    })

    let ignoreClick = false

    const clickAndHold = new ClickAndHoldManager({
        onHold(event) {
            const element = getItemElement(event)
            if (itemSelection.size === 0) {
                itemSelection.start(element)
            } else if (!itemSelection.has(element)) {
                itemSelection.toggle(element)
            }

            document.addEventListener('mousemove', onPointerMove)
            document.addEventListener('touchmove', onPointerMove, { passive: false })
            document.addEventListener('mouseup', clickAndHold.release) // detect mouseup outside of list element 
        },
        onHoldRelease(event_) {
            ignoreClick = true // ignore click triggered in mouse devices, which would deselect item
            setTimeout(() => ignoreClick = false, CLICK_DEBOUNCE_TIME)

            dragAndDrop.drop(...itemSelection.selected)

            document.removeEventListener('mousemove', onPointerMove)
            document.removeEventListener('touchmove', onPointerMove)
            document.removeEventListener('mouseup', clickAndHold.release)
        },
    })

    function onPointerMove(event) {
        event.preventDefault() // prevent scroll when holding on touch devices
        dragAndDrop.drag(getPointerY(event))
    }

    const listElement = ul({
        onmousedown: clickAndHold.click,
        ontouchstart: clickAndHold.click,
        ontouchend: clickAndHold.release,
        onclick: (e) => ignoreClick || itemSelection.toggle(getItemElement(e)),
        onpointerdown: (e) => e.target.releasePointerCapture(e.pointerId), // allow receiving onpointerenter on touch devices
        onpointermove: clickAndHold.abort, // allow scrolling on touch devices
        ondragstart: preventDefault, // disable drag and drop API which doesn't support touch devices
        oncontextmenu: preventDefault, // disable context menu on touch devices, which is triggered on click and hold
        style: stl({
            padding: 0,
            margin: 0,
            listStyle: 'none',
        }),
    }, rawItems.map(Item))

    return {
        element: listElement,
        addItem: (el) => listElement.appendChild(Item(el)),
        getElement,
        removeItem: (index) => getElement(index).remove(),
    }

    function Item(rawItem) {
        return li({
            onpointerenter: (e) => dragAndDrop.hover(getItemElement(e))
        }, rawItem)
    }

    function getElement(index) {
        return listElement.children[index]
    }
}

DragAndDropList.applyDrop = function (originalList, selectedIndexes, droppedIndex) {
    const selectedItems = originalList.filter((_, i) => selectedIndexes.includes(i))
    const isNotSelected = (it) => !selectedItems.includes(it)
    const updatedList = [
        ...originalList.slice(0, droppedIndex).filter(isNotSelected),
        ...selectedItems,
        ...originalList.slice(droppedIndex).filter(isNotSelected),
    ]
    console.debug('DragAndDropList.applyDrop()', { selectedIndexes, droppedIndex, updatedList })
    return updatedList
}

function getItemIndex(element) {
    return Array.from(element.parentElement.children).indexOf(element)
}

function getItemElement(event) {
    return event.target.closest('li')
}

function getPointerY(event) {
    return event.clientY ?? event.touches[0].clientY
}

// Utils

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
        get selected() {
            return Array.from(selected)
        },
        get size() {
            return selected.size
        },
        start: (item) => selected.size === 0 && toggleItem(item),
        toggle: (item) => selected.size > 0 && toggleItem(item),
        has: (item) => selected.has(item),
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
