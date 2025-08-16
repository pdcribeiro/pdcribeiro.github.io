import { diffArrays, DiffChecker } from '/lib/diff.js'
import { debounce } from '/lib/functions.js'
import { AsyncQueue } from '/lib/queue.js'
import DragAndDropList, { DragAndDropListManager } from '/lib/ui/components/DragAndDropList.js'
import van, { waitPromise } from '/lib/ui/van-wrapper.js'
import { stl } from '/lib/ui/utils.js'
import { now } from '../utils.js'

const SAVE_DEBOUNCE_TIME = 500

export default function NoteViewPage({ params, notesManager }) {
    return main(
        waitPromise(notesManager.viewNote(params.id), (note) =>
            NoteEditor({ note, notesManager })
        ),
    )
}

// FIX: paste creates single item. must split into elements
// TODO: handle save errors
function NoteEditor({ note, notesManager }) {
    const diff = new DiffChecker({
        read: () => listManager.children.map(c => c.innerText),
        diff: diffArrays,
    })
    const saveQueue = new AsyncQueue({
        handler: async (update) => notesManager.updateNote(note.id, update),
    })
    const saveChanges = debounce(() => saveQueue.push({
        changes: diff.run(),
        timestamp: now(),
    }), SAVE_DEBOUNCE_TIME)

    const listElement = DragAndDropList({
        listProps: {
            contenteditable: true,
            oninput: saveChanges,
            style: stl({
                flexGrow: 1, // allow clicking anywhere to edit even if note is smaller than screen
                paddingTop: '1rem',
                paddingBottom: '10vh',
                whiteSpace: 'pre-wrap',
                outline: 'none',
            }),
        },
        onSelect: (i) => listManager.item(i).style.backgroundColor = 'gray',
        onDeselect: (i) => listManager.item(i).style.background = 'none',
        onDrop: saveChanges,
    }, note.items.map(t => div(t.replace(/\n$/, '').length ? t : br())))
    const listManager = new DragAndDropListManager(listElement)

    van.derive(diff.init)
    van.derive(focusEditorWhenEmpty)
    van.derive(toggleEditModeOnToggleVirtualKeyboard)

    setEditMode(false)

    return listElement

    function focusEditorWhenEmpty() {
        if (note.items.length === 1 && !note.items[0].trim().length) {
            setTimeout(() => listElement.focus())
        }
    }

    function toggleEditModeOnToggleVirtualKeyboard() {
        const viewport = window.visualViewport
        const fullHeight = viewport.height

        viewport.addEventListener('resize', () =>
            viewport.height < fullHeight
                ? setEditMode(true)
                : setEditMode(false)
        )
    }

    function setEditMode(enabled) {
        if (enabled) {
            listElement.setAttribute('enabled', '')
        } else {
            listElement.setAttribute('enabled', true)
            listElement.blur()
        }
    }
}
