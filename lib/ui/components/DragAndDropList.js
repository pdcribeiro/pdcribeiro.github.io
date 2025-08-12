import { stl } from '/lib/ui/utils.js'

const CLICK_AND_HOLD_TIME_MS = 500
const CLICK_DEBOUNCE_TIME_MS = 50
const DRAG_MOVE_THRESHOLD_PX = 5
const SCROLL_AREA_HEIGHT_PERCENT = 0.1
const SCROLL_AMOUNT = 10

const UP = 'up'
const DOWN = 'down'

const preventDefault = (e) => e.preventDefault()

// FIX: sometimes mouseup event is not received so items are never dropped
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

    const scroll = new ScrollManager()

    let ignoreClick = false

    const clickAndHold = new ClickAndHoldManager({
        onHold(event) {
            const element = getItemElement(event)
            if (itemSelection.empty) {
                itemSelection.start(element)
            } else if (!itemSelection.has(element)) {
                itemSelection.toggle(element)
            }

            dragAndDrop.start(getPointerY(event))
            scroll.start(listElement)

            document.addEventListener('mousemove', onPointerMove)
            document.addEventListener('touchmove', onPointerMove, { passive: false })
            document.addEventListener('mouseup', clickAndHold.release) // detect mouseup outside of list element 
        },
        onHoldRelease(event_) {
            ignoreClick = true // ignore click triggered in mouse devices, which would deselect item
            setTimeout(() => ignoreClick = false, CLICK_DEBOUNCE_TIME_MS)

            dragAndDrop.drop(...itemSelection.selected)
            scroll.stop()

            document.removeEventListener('mousemove', onPointerMove)
            document.removeEventListener('touchmove', onPointerMove)
            document.removeEventListener('mouseup', clickAndHold.release)
        },
    })

    function onPointerMove(event) {
        event.preventDefault() // prevent scroll when holding on touch devices
        dragAndDrop.drag(getPointerY(event), { touch: !!event.touches })
        scroll.handlePointerMove(getPointerY(event))
    }

    const listElement = ul({
        onmousedown: clickAndHold.click,
        onmouseup: clickAndHold.release,
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
        click: (e) => {
            timeout = setTimeout(() => {
                onHold(e)
                timeout = null
            }, CLICK_AND_HOLD_TIME_MS)
        },
        release: (e) => timeout ? clearTimeout(timeout) : onHoldRelease(e),
        abort: () => clearTimeout(timeout),
    }
}

function ItemSelectionManager({ onSelect, onDeselect }) {
    const selected = new Set()

    return {
        get selected() {
            return Array.from(selected)
        },
        get empty() {
            return selected.size === 0
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
    let initialY, hoveredElement

    return {
        start: (pointerY) => initialY = pointerY,
        hover: (el) => hoveredElement = el,
        drag: movePlaceholder,
        drop: (...elements) => {
            if (!placeholder.parentElement) return // placeholder not in DOM

            const allElements = Array.from(placeholder.parentElement.children)
            const itemElements = allElements.filter(el => el !== placeholder)
            const selectedIndexes = elements.map(el => itemElements.indexOf(el))
            const droppedIndex = allElements.indexOf(placeholder)
            placeholder.replaceWith(...elements)
            onDrop(selectedIndexes, droppedIndex)
        },
    }

    function movePlaceholder(pointerY, { touch }) {
        const threshold = touch ? 2 * DRAG_MOVE_THRESHOLD_PX : DRAG_MOVE_THRESHOLD_PX
        if (Math.abs(pointerY - initialY) < threshold) {
            return
        }

        const rect = hoveredElement.getBoundingClientRect()
        const centerY = rect.top + rect.height / 2

        if (pointerY < centerY && placeholder.nextSibling !== hoveredElement) {
            hoveredElement.insertAdjacentElement('beforebegin', placeholder)
        } else if (pointerY >= centerY && hoveredElement.nextSibling !== placeholder) {
            hoveredElement.insertAdjacentElement('afterend', placeholder)
        }
    }
}

function ScrollManager() {
    let scrollElement, scrollDirection, scrollAnimation

    return {
        start: (el) => scrollElement = getClosestScrollableElement(el),
        handlePointerMove(pointerY) {
            if (!scrollElement) return

            const rect = scrollElement.getBoundingClientRect()
            const topBoundary = Math.max(
                rect.top + rect.height * SCROLL_AREA_HEIGHT_PERCENT,
                window.innerHeight * SCROLL_AREA_HEIGHT_PERCENT,
            )
            const bottomBoundary = Math.min(
                rect.bottom - rect.height * SCROLL_AREA_HEIGHT_PERCENT,
                window.innerHeight * (1 - SCROLL_AREA_HEIGHT_PERCENT),
            )

            if (pointerY < topBoundary) startScroll(UP)
            else if (pointerY > bottomBoundary) startScroll(DOWN)
            else stopScroll()
        },
        stop: () => {
            stopScroll()
            scrollElement = null
        },
    }

    function startScroll(direction) {
        if (direction !== scrollDirection) {
            cancelAnimationFrame(scrollAnimation)
            scroll(SCROLL_AMOUNT * (direction === DOWN ? 1 : -1))
            scrollDirection = direction
        }
    }

    function scroll(value) {
        scrollElement.scrollTop += value
        scrollAnimation = requestAnimationFrame(() => scroll(value))
    }

    function stopScroll() {
        cancelAnimationFrame(scrollAnimation)
        scrollDirection = null
    }
}

function getClosestScrollableElement(element) {
    while (element) {
        const style = getComputedStyle(element)
        if (/(auto|scroll)/.test(style.overflow + style.overflowY)) {
            return element
        }
        element = element.parentElement
    }
    return document.scrollingElement || document.documentElement
}
