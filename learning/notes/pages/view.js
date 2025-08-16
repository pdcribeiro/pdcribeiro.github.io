import { diffArrays, DiffChecker } from '/lib/diff.js'
import { debounce } from '/lib/functions.js'
import { AsyncQueue } from '/lib/queue.js'
import DragAndDropListManager from '/lib/ui/DragAndDropListManager.js'
import van, { waitPromise } from '/lib/ui/van-wrapper.js'
import { now } from '../utils.js'

const SAVE_DEBOUNCE_TIME = 500

export default function NoteViewPage({ params, notesManager }) {
    return main(
        waitPromise(notesManager.viewNote(params.id), (note) =>
            Editor({ note, notesManager })
        ),
    )
}

// FIX: paste creates single item. must split into elements
// TODO: handle save errors
function Editor({ note, notesManager }) {
    const diff = new DiffChecker({
        read: () => itemsList.children.map(c => c.innerText),
        diff: diffArrays,
    })
    const saveQueue = new AsyncQueue({
        handler: async (update) => notesManager.updateNote(note.id, update),
    })
    const saveChanges = debounce(() => saveQueue.push({
        changes: diff.run(),
        timestamp: now(),
    }), SAVE_DEBOUNCE_TIME)

    const editing = van.state(false)

    const itemsList = new DragAndDropListManager({
        listProps: {
            enabled: () => editing.val ? '' : true,
            contenteditable: true,
            oninput: saveChanges,
        },
        listStyle: {
            flexGrow: 1, // allow clicking anywhere to edit even if note is smaller than screen
            paddingTop: '1rem',
            paddingBottom: '10vh',
            outline: 'none',
        },
        items: note.items.map(t => div(t.replace(/\n$/, '').length ? t : br())),
        onSelect(index, selected) {
            itemsList.item(index).style.backgroundColor = 'gray'
            // if (selected.length === 1) editing.val = false
        },
        onDeselect(index, selected) {
            itemsList.item(index).style.background = 'none'
            // if (selected.length === 0) editing.val = true
        },
        onDrop: saveChanges,
    })

    van.derive(diff.init)
    van.derive(focusEditorWhenEmpty)
    van.derive(toggleEditModeOnToggleVirtualKeyboard)
    van.derive(blurEditorOnLeaveEditMode)

    return itemsList.element

    function focusEditorWhenEmpty() {
        if (note.items.length === 1 && !note.items[0].trim().length) {
            setTimeout(() => itemsList.element.focus())
        }
    }

    function toggleEditModeOnToggleVirtualKeyboard() {
        const fullHeight = visualViewport.height
        visualViewport.addEventListener('resize', () =>
            visualViewport.height < fullHeight
                ? editing.val = true
                : editing.val = false
        )
    }

    function blurEditorOnLeaveEditMode() {
        if (!editing.val) {
            itemsList.element.blur()
        }
    }
}
