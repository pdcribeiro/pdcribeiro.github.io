import { DragAndDropList } from '/lib/ui/components/DragAndDropList.js'
import { waitPromise } from '/lib/ui/van-wrapper.js'

// TODO: how to handle empty item? and empty note?
export default function ViewNotePage({ params, notesManager }) {
    return waitPromise(notesManager.listItems(params.id), (fetchedItems) => {
        let items = fetchedItems

        const itemsList = new DragAndDropList({
            items: items.map(text => Item({ text })),
            onSelect(index, selected) {
                itemsList.getElement(index).style.backgroundColor = 'gray'
                if (selected.length === 1) setEditable(false)
            },
            onDeselect(index, selected) {
                itemsList.getElement(index).style.background = 'none'
                if (selected.length === 0) setEditable(true)
            },
            onDrop: (selectedIndexes, droppedIndex) => {
                items = DragAndDropList.applyDrop(items, selectedIndexes, droppedIndex)
            },
        })

        return main(itemsList.element)

        function Item({ text }) {
            return p({ contenteditable: true }, text)
        }

        // function addItem(itemText) {
        //     if (itemText.length === 0) return
        //     itemsList.addItem(
        //         Item({ id: itemText }, itemText)
        //     )
        //     itemsData.push(itemText)
        // }

        // function removeItem(id) {
        //     itemsList.removeItem(itemsData.indexOf(id))
        //     itemsData = itemsData.filter(it => it !== id)
        // }

        function setEditable(value) {
            Array.from(itemsList.element.querySelectorAll('p'))
                .forEach(el => el.setAttribute('contenteditable', value))
        }
    })
}
