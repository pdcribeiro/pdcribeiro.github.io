const DRAG_MOVE_THRESHOLD_PX = 5

export default function WebDragAndDropManager({ placeholder, onDrop }) {
    let initialY, hoveredElement

    return {
        start: (pointerY) => initialY = pointerY,
        hover: (el) => el && (hoveredElement = el),
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
