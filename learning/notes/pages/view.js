import DragAndDropListManager from '/lib/ui/DragAndDropListManager.js'
import van, { waitPromise } from '/lib/ui/van-wrapper.js'

const BACKSPACE_KEY = 'Backspace'
const ENTER_KEY = 'Enter'

// TODO: ignore click and hold when editing (eg. to select text on touch devices)
// TODO: clarify contracts. cleanup
export default function NoteViewPage({ params, notesManager }) {
    const noteId = params.id

    return waitPromise(notesManager.listItems(noteId), (loadedItems) => {
        const editable = van.state(true)

        let items = loadedItems

        const itemsList = new DragAndDropListManager({
            listProps: { contenteditable: editable },
            items: items.map(text => Item({ text })),
            onSelect(index, selected) {
                itemsList.item(index).style.backgroundColor = 'gray'
                if (selected.length === 1) editable.val = false
            },
            onDeselect(index, selected) {
                itemsList.item(index).style.background = 'none'
                if (selected.length === 0) editable.val = true
            },
            onDrop: (selectedIndexes, droppedIndex) => {
                items = DragAndDropListManager.applyDrop(items, selectedIndexes, droppedIndex)
            },
        })

        van.derive(focusWhenEmpty)

        return main(itemsList.element)

        function Item({ text }) {
            return p({
                onkeydown: handleKeyDown,
                style: 'outline: none',
            },
                text.length ? text : br(),
            )
        }

        function focusWhenEmpty() {
            if (items.length === 1 && !items[0].length) {
                itemsList.item(0).querySelector('p').focus()
            }
        }

        async function handleKeyDown(event) {
            switch (event.key) {
                case ENTER_KEY: {
                    await addItemOnEnter(event)
                    break
                }
                case BACKSPACE_KEY: {
                    await removeItemOnBackspace(event)
                    break
                }
            }
        }

        async function addItemOnEnter(event) {
            event.preventDefault()

            const element = event.target
            const index = itemsList.index(element)
            const text = element.innerText
            const selection = document.getSelection()
            const selectionRange = selection.getRangeAt(0)
            const firstText = text.slice(0, selectionRange.startOffset)
            const secondText = text.slice(selectionRange.endOffset)

            await notesManager.updateItem(noteId, index, firstText)
            element.innerText = firstText

            await notesManager.addItem(noteId, index + 1, secondText)
            const newItemEl = Item({ text: secondText })
            itemsList.insert(index + 1, newItemEl)

            items.splice(index, 1, firstText, secondText)

            const newSelectionRange = document.createRange()
            newSelectionRange.setStart(newItemEl, 0)
            newSelectionRange.setEnd(newItemEl, 0)
            selection.removeAllRanges()
            selection.addRange(newSelectionRange)
        }

        async function removeItemOnBackspace(event) {
            const selection = document.getSelection()
            const selectionRange = selection.getRangeAt(0)
            const isTextSelected = selectionRange.startOffset !== selectionRange.endOffset
            if (selectionRange.startOffset > 0 || isTextSelected) return

            event.preventDefault()

            const element = event.target
            const index = itemsList.index(element)
            const text = element.innerText
            if (index > 0) {
                const prevItem = itemsList.item(index - 1).querySelector('p')
                const prevItemText = prevItem.innerText
                const mergedText = prevItemText + text

                await notesManager.updateItem(noteId, index - 1, mergedText)
                prevItem.innerText = mergedText

                await notesManager.removeItem(noteId, index)
                itemsList.remove(index)

                items.splice(index - 1, 2, mergedText)

                const newSelectionRange = document.createRange()
                const cursorIndex = prevItemText.length
                console.log('backspace', { mergedText, prevItem, innerText: prevItem.innerText, cursorIndex, prevItemText, text })
                newSelectionRange.setStart(prevItem, cursorIndex) // FIX: "DOMException: Index or size is negative or greater than the allowed amount"
                newSelectionRange.setEnd(prevItem, cursorIndex)
                selection.removeAllRanges()
                selection.addRange(newSelectionRange)
            }
        }
    })
}

// function clip(value, min, max) {
//     return Math.min(Math.max(value, min), max)
// }
