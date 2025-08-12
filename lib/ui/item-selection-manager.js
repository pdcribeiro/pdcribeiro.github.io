export function ItemSelectionManager({ onSelect, onDeselect }) {
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
        stop: clearSelection,
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

    function clearSelection() {
        selected.forEach(toggleItem)
    }
}
