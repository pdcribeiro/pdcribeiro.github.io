import { getDragAndDropList } from '/components/DragAndDropList.js';
import LifecycleManager from '/components/LifecycleManager.js';
import { debounce } from '/lib/functions.js';
import { confirmAnd } from '/lib/utils.js';
import van from '/third-party/van.js';
import { routes } from '../app.js';
import db from '../db.js';

const DEBOUNCE_DELAY = 2000;
const ENTER_KEY = 'Enter';
const BACKSPACE_KEY = 'Backspace';

const { a, button, div, h1, p, img } = van.tags;

export default function NoteDetailsPage({ param: id }) {
  const note = van.state(null);
  db.getNote(id).then((data) => (note.val = data));

  return div(
    Header({ id }),
    () => note.val ? NoteDetails(note.val) : p('loading note data...'),
  );
}

function Header({ id }) {
  return div({ class: 'flex sticky top-0 items-center bg-theme' },
    a({ href: routes.noteList.getPath(), class: 'button small' }, '< note list'),
    a({ href: routes.noteEdit.getPath(id), class: 'button small ml-auto' }, 'edit'),
    button({ onclick: confirmAndDelete, class: 'button small ml-4' }, 'delete'),
  );

  function confirmAndDelete() {
    confirmAnd(() => db.deleteNote(id).then(routes.noteList.visit));
  }
}

function NoteDetails({ id, name, content, pictures, tags }) {
  let unsaved = {};

  const saveWithDebounce = debounce(save, DEBOUNCE_DELAY);

  return LifecycleManager({ onmount, onunmount },
    Name({ id, name, oninput }),
    Content({ content, oninput }),
    Pictures({ pictures }),
    Tags({ tags, oninput }),
  );

  async function save() {
    if (Object.keys(unsaved).length) {
      await db.updateNote(id, unsaved);
      unsaved = {};
    }
  }

  function oninput(inputData) {
    unsaved = { ...unsaved, ...inputData };
    saveWithDebounce();
  }

  function onmount() {
    document.addEventListener('visibilitychange', saveOnHide);
  }

  function saveOnHide() {
    if (document.hidden) {
      save();
    }
  }

  async function onunmount() {
    await save();
    document.removeEventListener('visibilitychange', saveOnHide);
  }
}

function Name({ name, oninput }) {
  return h1({ contenteditable: true, class: 'outline-none', oninput: (e) => oninput({ name: e.target.textContent }) }, name);
}

function Content({ content, ...props }) {
  const { list, getIndex, addItem, removeItem } = getDragAndDropList(
    { class: 'mb-8', oninput, onkeydown, onupdate: oninput },
    content.map((text) => ContentItem({ text }))
  );

  return list;

  function oninput() {
    const newContent = Array.from(list.children).map((item) => item.textContent);
    props.oninput({ content: newContent });
  }

  function onkeydown(event) {
    const currentItem = event.target;
    const currentItemIndex = getIndex(currentItem);
    const selection = document.getSelection();

    if (event.key === ENTER_KEY) {
      event.preventDefault();

      const currentItemText = currentItem.textContent.slice(0, selection.anchorOffset);
      const newItemText = currentItem.textContent.slice(selection.focusOffset);

      currentItem.textContent = currentItemText; // note: changes seletion

      const newItem = ContentItem({ text: newItemText });
      addItem(newItem, currentItemIndex + 1);

      oninput();
    } else if (event.key === BACKSPACE_KEY) {
      if (currentItemIndex > 0 && selection.anchorOffset + selection.focusOffset === 0) {
        event.preventDefault();

        const previousItemText = list.children[currentItemIndex - 1].textContent + currentItem.textContent;
        const previousItemReplacement = ContentItem({ text: previousItemText });
        removeItem(currentItemIndex - 1);
        addItem(previousItemReplacement, currentItemIndex - 1);
        removeItem(currentItemIndex);

        oninput();
      }
    }
  }
}

function ContentItem({ text }) {
  const eventListeners = {
    onmousedown: handlePointerDown,
    ontouchstart: handlePointerDown,
    onblur,
  };
  const headingMatch = text.match(/^(#+) \w/);
  if (headingMatch) {
    const level = headingMatch[1].length;
    const heading = van.tags[`h${level}`];
    const text = text.slice(level + 1);
    return heading({ contenteditable: true, class: 'outline-none', ...eventListeners }, text);
  } else {
    return p({ contenteditable: true, class: 'whitespace-pre-wrap outline-none', ...eventListeners }, text);
  }
}

function handlePointerDown(event) {
  if (isCursorInside(event.target)) {
    event.stopPropagation(); // prevent drag when editing
  }
}

function isCursorInside(element) {
  const selection = document.getSelection();
  if (!selection.rangeCount) {
    return false;
  }
  const range = selection.getRangeAt(0);
  return element.contains(range.commonAncestorContainer);
}

function onblur(event) {
  if (isCursorInside(event.target)) {
    document.getSelection().empty();
  }
}

function Pictures({ pictures }) {
  return div({ class: 'overflow-x-auto whitespace-nowrap snap-x' },
    pictures.map((pic) => div({ class: 'inline-block w-full snap-center' },
      img({ src: pic.url, class: 'block mx-auto h-screen/2' }),
      p({ class: 'overflow-y-auto h-14 text-center whitespace-pre-wrap' }, pic.description),
    ))
  );
}

function Tags({ tags, oninput }) {
  return p({ contenteditable: true, class: 'outline-none', oninput: (e) => oninput({ tags: e.target.textContent }) }, tags);
}
