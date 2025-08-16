import { chain } from '/lib/functions.js'
import ClickAndHoldManager from '/lib/ui/ClickAndHoldManager.js'
import ItemSelectionManager from '/lib/ui/ItemSelectionManager.js'
import DragAndDropManager from '/lib/ui/WebDragAndDropManager.js'
import ScrollManager from '/lib/ui/WebScrollManager.js'
import { findDirectChild, getChildIndex, setAttributesAndListeners } from '/lib/ui/dom.js'

const CLICK_DEBOUNCE_TIME_MS = 50

/* FIX: ignore toggle select after click and hold select (desktop only)
- ignore toggle select after click and hold select (desktop only)
    - listen on touch/mouse
    - FAIL: listen on touch/mouse start. it unselects selected element when selecting multiple elements to drag and drop
    - FAIL: listen on touch/mouse end. it unselect the element on click and hold release
- ignore toggle after toggle
    - listen on click or listen on touch/mouse and debounce toggle
*/

// FIX: drag down refresh on mobile prevents drag and drop
// FIX: sometimes mouseup event is not received so items are never dropped
// FIX: prevent text selection when dragging on desktop
// TODO: allow selecting text across items and then drag them together
// TODO: review where each event handler should go (Manager component or app page)
// TODO: test drag and drop on desktop and mobile
export default function DragAndDropList({ onSelect, onDeselect, onDrop, listProps }, ...items) {
    const itemSelection = new ItemSelectionManager({
        onSelect: (el) => onSelect(getChildIndex(el, listElement)), // get index here otherwise placeholder can mess with has() logic
        onDeselect: (el) => onDeselect(getChildIndex(el, listElement)),
    })
    const dragAndDrop = new DragAndDropManager({
        placeholder: document.createElement('hr'),
        onDrop(selected, dropped) {
            itemSelection.stop()
            onDrop(selected, dropped)
        },
    })
    const scroll = new ScrollManager()

    const clickAndHold = new ClickAndHoldManager({
        onHold(event) {
            const element = findDirectChild(event.target, listElement)
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

    const listElement = createListElement(listProps, { clickAndHold, itemSelection, dragAndDrop })
    listElement.append(...items.flat(Infinity))

    return listElement
}

function getPointerY(event) {
    return event.clientY ?? event.touches[0].clientY
}

function createListElement(props, { clickAndHold, itemSelection, dragAndDrop }) {
    const listElement = document.createElement('div')

    const enabled = () => !!listElement.getAttribute('enabled')
    const ifEnabled = (cb) => (...args) => enabled() && cb(...args)
    const ifSelected = (cb) => (...args) => !itemSelection.empty && cb(...args)
    const getEventItem = (e) => findDirectChild(e.target, listElement)
    const preventDefault = (e) => e.preventDefault()

    // NOTE: touch triggers touch and mouse events. touch and hold only triggers touch events
    // 
    // mouse click (or click and hold) -> mousedown, mouseup, click
    // touch -> touchstart, touchend, mousedown, mouseup, click
    // touch and hold -> touchstart, touchend
    // 
    setAttributesAndListeners(listElement, {
        enabled: true,
        ...props,

        ontouchstart: ifEnabled(clickAndHold.click),
        onmousedown: ifEnabled(clickAndHold.click),
        ontouchend: clickAndHold.release,
        onmouseup: clickAndHold.release,

        onclick: (e) => itemSelection.toggle(getEventItem(e)),

        onpointerdown: (e) => e.target.releasePointerCapture(e.pointerId), // allow receiving onpointerenter on touch devices
        onpointerover: (e) => dragAndDrop.hover(getEventItem(e)),
        // onpointermove: clickAndHold.abort, // allow scrolling on touch devices // NOTE: preventing click and hold from triggering on chrome mobile. also seems like it's not needed to scroll after all

        oncontextmenu: ifEnabled(preventDefault), // disable context menu
        onfocus: ifSelected(e => e.target.blur()), // prevent focus when selecting
        // ondragstart: preventDefault, // disable drag and drop API which doesn't support touch devices // NOTE: preventing drag and drop text
    })

    return listElement
}

export class DragAndDropListManager {
    constructor(listElement) {
        this.listElement = listElement
    }
    get children() {
        return Array.from(this.listElement.children)
    }
    insert(i, el) {
        i < this.listElement.children.length
            ? this.item(i).insertAdjacentElement('beforebegin', el)
            : this.append(el)
    }
    append(el) {
        this.listElement.appendChild(el)
    }
    item(i) {
        return this.listElement.children[i]
    }
    index(el) {
        const child = findDirectChild(el, this.listElement)
        return getChildIndex(child, this.listElement)
    }
    remove(i) {
        this.item(i).remove()
    }
    static applyDrop(originalList, selectedIndexes, droppedIndex) {
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
}
