import DragAndDropListManager from '/lib/ui/DragAndDropListManager.js'
import van, { waitPromise } from '/lib/ui/van-wrapper.js'
import { AsyncQueue } from '/lib/queue.js'
import { debounce } from '/lib/utils.js'
import { diffArrays } from '/third-party/diff.js'
import { now } from '../utils.js'

const SAVE_DEBOUNCE_TIME = 500

export default function NoteViewPage({ params, notesManager }) {
    return main(
        waitPromise(notesManager.viewNote(params.id), (note) =>
            Editor({ note, notesManager })
        ),
    )
}

// FIX: paste/drag with beggining/ending new line introduces an extra new line. it's because contenteditable ul has children li elements. see chatgpt history
// FIX: delete empty line with another empty line before doesn't work
// TODO: test drag and drop on desktop and mobile
// TODO: ignore click and hold when editing (eg. to select text on touch devices)
// TODO: prevent text selection when dragging
function Editor({ note, notesManager }) {
    const saveQueue = new AsyncQueue({
        handler: async (update) => notesManager.updateNote(note.id, update), // TODO: handle errors
    })

    const editable = van.state(true)

    const itemsList = new DragAndDropListManager({
        listProps: {
            contenteditable: editable,
            // onkeydown: handleListKeyDown,
            oninput: debounce(saveChanges, SAVE_DEBOUNCE_TIME),
            // onbeforeinput: handleListInput,
            // ondragstart: null,
        },
        listStyle: {
            flexGrow: 1, // allow clicking anywhere to edit even if note is smaller than screen
            outline: 'none',
        },
        items: note.items.map(text => Item({ text })),
        onSelect(index, selected) {
            itemsList.item(index).style.backgroundColor = 'gray'
            if (selected.length === 1) editable.val = false
        },
        onDeselect(index, selected) {
            itemsList.item(index).style.background = 'none'
            if (selected.length === 0) editable.val = true
        },
        onDrop: saveChanges,
    })

    const diff = createDiffFunction({
        getLines: () => Array.from(itemsList.element.children).map(c => c.innerText),
        getDiff: diffArrays,
    })

    van.derive(focusEditorWhenEmpty)

    return itemsList.element

    function saveChanges() {
        saveQueue.push({
            changes: diff(),
            timestamp: now(),
        })
    }

    function focusEditorWhenEmpty() {
        if (note.items.length === 1 && !note.items[0].trim().length) {
            itemsList.item(0).focus()
        }
    }
}

function Item({ text }) {
    return text.trim().length ? text : br()
}

function createDiffFunction({ getLines, getDiff }) {
    let oldLines = getLines()

    return () => {
        const newLines = getLines()
        const changes = getDiff(oldLines, newLines)
        oldLines = newLines
        return changes
    }
}
