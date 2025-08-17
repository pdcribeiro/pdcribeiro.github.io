import { chain, debounce } from '/lib/functions.js'
import ClickAndHoldManager from '/lib/ui/ClickAndHoldManager.js'
import ItemSelectionManager from '/lib/ui/ItemSelectionManager.js'
import DragAndDropManager, { isOverDragMoveThreshold } from '/lib/ui/web/DragAndDropManager.js'
import PointerDistanceMeter from '/lib/ui/web/PointerDistanceMeter.js'
import ScrollManager from '/lib/ui/web/ScrollManager.js'
import { findDirectChild, getChildIndex, setAttributesAndListeners } from '/lib/ui/web/dom.js'

const CLICK_DEBOUNCE_TIME_MS = 50

// FIX: drag down refresh on mobile prevents drag and drop
// FIX: sometimes mouseup event is not received so items are never dropped
// TODO: select/unselect range on shift click. if last was select, unselect. and vice versa
export default function DragAndDropList({ onSelect, onDeselect, onDrop, listProps }, ...items) {
    const pointerMeter = new PointerDistanceMeter()
    const itemSelection = new ItemSelectionManager({
        onSelect: (el) => onSelect?.(getChildIndex(el, listElement)), // get index here otherwise placeholder can mess with has() logic
        onDeselect: (el) => onDeselect?.(getChildIndex(el, listElement)),
    })
    const dragAndDrop = new DragAndDropManager({
        placeholder: document.createElement('hr'),
        onDrop(selected, dropped) {
            itemSelection.stop()
            onDrop?.(selected, dropped)
        },
    })
    const scroll = new ScrollManager()

    const clickAndHold = new ClickAndHoldManager({
        onClick(event) {
            pointerMeter.setOrigin(event)
            document.addEventListener('pointermove', onPointerMove)
        },
        onHold(event) {
            const element = findDirectChild(event.target, listElement)
            if (itemSelection.empty) {
                itemSelection.start(element)
            } else if (!itemSelection.has(element)) {
                itemSelection.toggle(element)
            }

            dragAndDrop.start(getPointerY(event))
            scroll.start(listElement)

            document.addEventListener('mousemove', onHoldingPointerMove)
            document.addEventListener('touchmove', onHoldingPointerMove, { passive: false })
            document.addEventListener('mouseup', clickAndHold.release) // detect mouseup outside of list element 
        },
        onHoldRelease() {
            dragAndDrop.drop(...itemSelection.selected)
            scroll.stop()

            document.removeEventListener('pointermove', onPointerMove)
            document.removeEventListener('mousemove', onHoldingPointerMove)
            document.removeEventListener('touchmove', onHoldingPointerMove)
            document.removeEventListener('mouseup', clickAndHold.release)
        },
        onAbort() {
            document.removeEventListener('pointermove', onPointerMove)
        },
    })

    function onPointerMove(event) {
        const distance = pointerMeter.getDistance(event)
        if (isOverDragMoveThreshold(distance, { touch: !!event.touches })) {
            clickAndHold.abort(event) // prevent scroll on touch devices from triggering click and hold // NOTE: preventing click and hold from triggering on chrome mobile
        }
    }

    function onHoldingPointerMove(event) {
        event.preventDefault() // prevent scroll when holding on touch devices
        dragAndDrop.drag(getPointerY(event), { touch: !!event.touches })
        scroll.handlePointerMove(getPointerY(event))
    }

    const listElement = createListElement(listProps, { clickAndHold, itemSelection, dragAndDrop })
    listElement.append(...items.flat(Infinity))

    listElement._itemSelection = itemSelection // used by manager

    return listElement
}

function getPointerY(event) {
    return event.clientY ?? event.touches[0].clientY
}

function createListElement(props, { clickAndHold, itemSelection, dragAndDrop }) {
    const listElement = document.createElement('div')

    const enabled = () => !!listElement.getAttribute('enabled')
    const ifEnabled = (cb) => (e) => enabled() && cb(e) || true // return true because false can prevent default behavior
    const ifNotHolding = (cb) => (e) => !clickAndHold.holding && cb(e) || true
    const getEventItem = (e) => findDirectChild(e.target, listElement)
    const preventDefault = (e) => e.preventDefault()
    const toggleItem = debounce((e) => itemSelection.toggle(getEventItem(e)), CLICK_DEBOUNCE_TIME_MS)

    let lastPointerType

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
        ontouchend: chain(ifNotHolding(toggleItem), clickAndHold.release), // must release even if not enabled
        onmouseup: chain(ifNotHolding(toggleItem), clickAndHold.release),

        onpointerdown: (e) => {
            e.target.releasePointerCapture(e.pointerId) // allow receiving pointerover on touch devices
            lastPointerType = e.pointerType
        },
        onpointerover: (e) => dragAndDrop.hover(getEventItem(e)),

        oncontextmenu: ifEnabled(chain(
            preventDefault, // prevent touch and hold from triggering context menu
            () => lastPointerType === 'mouse' && clickAndHold.abort, // prevent right click from selecting item
        )),
        ondragstart: ifEnabled(preventDefault), // disable drag and drop API which doesn't support touch devices
        onselectstart: ifEnabled(preventDefault), // prevent text selection on drag
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
    get selection() {
        return this.listElement._itemSelection
    }
    setEnabled(value) {
        this.listElement.setAttribute('enabled', value ? true : '')
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
