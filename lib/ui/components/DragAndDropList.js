import ClickAndHoldManager from '/lib/ui/ClickAndHoldManager.js'
import ItemSelectionManager from '/lib/ui/ItemSelectionManager.js'
import DragAndDropManager from '/lib/ui/WebDragAndDropManager.js'
import ScrollManager from '/lib/ui/WebScrollManager.js'
import { findDirectChild, getChildIndex } from '/lib/ui/dom.js'
import { stl } from '/lib/ui/utils.js'

const CLICK_DEBOUNCE_TIME_MS = 50

// FIX: drag down refresh on mobile prevents drag and drop
// FIX: sometimes mouseup event is not received so items are never dropped
// FIX: prevent text selection when dragging on desktop
// TODO: allow selecting text across items and then drag them together
// TODO: review where each event handler should go (Manager component or app page)
// TODO: test drag and drop on desktop and mobile
export default function DragAndDropList({ items, listProps, listStyle, onSelect, onDeselect, onDrop }) {
    const itemSelection = new ItemSelectionManager({
        onSelect: (el) => onSelect(getChildIndex(el, listElement)), // get index here otherwise placeholder can mess with has() logic
        onDeselect: (el) => onDeselect(getChildIndex(el, listElement)),
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

    const listElement = div({
        enabled: true,
        ontouchstart: ifEnabled(clickAndHold.click),
        onmousedown: ifEnabled(clickAndHold.click),
        ontouchend: clickAndHold.release,
        onmouseup: clickAndHold.release,
        onclick: (e) => !ignoreClick && itemSelection.toggle(getEventItem(e)),
        onpointerdown: (e) => e.target.releasePointerCapture(e.pointerId), // allow receiving onpointerenter on touch devices
        // onpointermove: clickAndHold.abort, // allow scrolling on touch devices // NOTE: preventing click and hold from triggering on chrome mobile. also seems like it's not needed to scroll after all
        onpointerover: (e) => dragAndDrop.hover(getEventItem(e)),
        // ondragstart: preventDefault, // disable drag and drop API which doesn't support touch devices
        oncontextmenu: ifEnabled(preventDefault),
        onfocus: ifSelected(e => e.target.blur()),
        style: stl({
            whiteSpace: 'pre-wrap',
            ...listStyle,
        }),
        ...listProps,
    }, items)

    return listElement

    function getEventItem(event) {
        return findDirectChild(event.target, listElement)
    }

    function ifEnabled(callback) {
        return (...args) => enabled() && callback(...args)
    }

    function enabled() {
        return !!listElement.getAttribute('enabled')
    }

    function ifSelected(callback) {
        return (...args) => !itemSelection.empty && callback(...args)
    }
}

function preventDefault(e) {
    e.preventDefault()
}

function getPointerY(event) {
    return event.clientY ?? event.touches[0].clientY
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
