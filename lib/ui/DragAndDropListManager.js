import ClickAndHoldManager from '/lib/ui/ClickAndHoldManager.js'
import ItemSelectionManager from '/lib/ui/ItemSelectionManager.js'
import { stl } from '/lib/ui/utils.js'
import DragAndDropManager from '/lib/ui/WebDragAndDropManager.js'
import ScrollManager from '/lib/ui/WebScrollManager.js'

const CLICK_DEBOUNCE_TIME_MS = 50

const preventDefault = (e) => e.preventDefault()

// TODO: allow selecting text across items and then drag them together
// TODO: prevent text selection when dragging
// FIX: sometimes mouseup event is not received so items are never dropped
export default function DragAndDropListManager({ listProps, listStyle, items, onSelect, onDeselect, onDrop }) {
    const itemSelection = new ItemSelectionManager({
        onSelect: (el) => onSelect(getItemIndex(el), itemSelection.selected), // get index here otherwise placeholder can mess with has() logic
        onDeselect: (el) => onDeselect(getItemIndex(el), itemSelection.selected),
    })

    const dragAndDrop = new DragAndDropManager({
        placeholder: hr(),
        onDrop(selected, dropped) {
            itemSelection.stop()
            onDrop(selected, dropped)
        },
    })

    const scroll = new ScrollManager()

    let ignoreClick = false

    const clickAndHold = new ClickAndHoldManager({
        onHold(event) {
            const element = getEventItem(event)
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
        onclick: (e) => ignoreClick || itemSelection.toggle(getEventItem(e)),
        onpointerdown: (e) => e.target.releasePointerCapture(e.pointerId), // allow receiving onpointerenter on touch devices
        onpointermove: clickAndHold.abort, // allow scrolling on touch devices
        ondragstart: preventDefault, // disable drag and drop API which doesn't support touch devices
        oncontextmenu: preventDefault, // disable context menu on touch devices, which is triggered on click and hold
        style: stl({
            padding: 0,
            margin: 0,
            listStyle: 'none',
            ...listStyle,
        }),
        ...listProps,
    }, items.map(Item))

    return {
        element: listElement,
        insert: (i, el) => i < listElement.children.length
            ? getItemAt(i).insertAdjacentElement('beforebegin', Item(el))
            : appendItem(el),
        append: (el) => appendItem(el),
        item: (i) => getItemAt(i),
        index: (el) => getItemIndex(el.closest('li')),
        remove: (i) => getItemAt(i).remove(),
    }

    function Item(rawItem) {
        return li({
            onpointerenter: (e) => dragAndDrop.hover(getEventItem(e))
        }, rawItem)
    }

    function getItemAt(index) {
        return listElement.children[index]
    }

    function appendItem(element) {
        listElement.appendChild(Item(element))
    }
}

DragAndDropListManager.applyDrop = function (originalList, selectedIndexes, droppedIndex) {
    const selectedItems = originalList.filter((_, i) => selectedIndexes.includes(i))
    const isNotSelected = (it) => !selectedItems.includes(it)
    const updatedList = [
        ...originalList.slice(0, droppedIndex).filter(isNotSelected),
        ...selectedItems,
        ...originalList.slice(droppedIndex).filter(isNotSelected),
    ]
    console.debug('DragAndDropListManager.applyDrop()', { selectedIndexes, droppedIndex, updatedList })
    return updatedList
}

function getItemIndex(element) {
    return Array.from(element.parentElement.children).indexOf(element)
}

function getEventItem(event) {
    return event.target.closest('li')
}

function getPointerY(event) {
    return event.clientY ?? event.touches[0].clientY
}
