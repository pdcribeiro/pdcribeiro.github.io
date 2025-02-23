import { getDragAndDropList } from '/components/DragAndDropList.js';
import Modal from '/components/Modal.js';
import { getLocalFileUrl } from '/lib/files.js';
import { bind, confirmAnd } from '/lib/utils.js';
import van from '/third-party/van.js';

const { button, div, input, label, textarea, img } = van.tags;

export default function NoteForm({ initialData = {}, onsubmit, oncancel }) {
  const { pictures: initialPictures = [], ...initialTextData } = initialData;

  const textData = van.state({
    name: '',
    content: '',
    tags: '',
    ...initialTextData,
  });
  const pictures = van.state(initialPictures);

  return div(
    label('name'), input(bind(textData, 'name')),
    label('content'), textarea({ rows: 12, ...bind(textData, 'content') }),
    () => Pictures({ pictures, onupdate: updatePictures }),
    label('tags'), textarea(bind(textData, 'tags')),
    button({ onclick: submit }, 'save'),
    button({ class: 'ml-4', onclick: oncancel }, 'cancel'),
  );

  function updatePictures(updatedPictures) {
    pictures.val = updatedPictures;
  }

  function submit() {
    console.debug('[note form] submit event');
    onsubmit({ ...textData.val, pictures: pictures.val });
  }
}

function Pictures({ pictures, onupdate }) {
  const selected = van.state(null);
  const editing = van.state(null);

  const { list, addItem, removeItem } = getDragAndDropList(
    { class: 'flex flex-col gap-4 items-center max-h-152', onupdate: handleMove },
    pictures.val.map(getNewPictureElement)
  );

  return div({ class: 'mb-4' },
    label('pictures'), input({ type: 'file', multiple: true, onchange: loadImages }),
    list,
    () => editing.val ? EditModal({
      picture: editing.val,
      onupdate: updatePicture,
      ondelete: deletePicture,
      onclose: () => editing.val = null
    }) : div(),
  );

  function getNewPictureElement(pic) {
    return div({ class: 'relative' },
      img({ src: pic.url, class: 'block p-2 min-h-48 size-48 border', onclick: () => selected.val = pic }),
      () => pic === selected.val ?
        div(
          div({ class: 'overlay bg-transparent', onclick: unselect }),
          div({ class: 'overlay flex absolute flex-col justify-center items-center bg-theme' },
            div(
              button({ onclick: openEditModal }, 'edit'),
              button({ class: 'ml-4', onclick: confirmAndDelete }, 'delete'),
            ),
          ),
        ) : div(),
    );
  }

  function unselect() {
    selected.val = null;
  }

  function openEditModal() {
    editing.val = selected.val;
    unselect();
  }

  function confirmAndDelete() {
    confirmAnd(() => deletePicture(selected.val));
    unselect();
  }

  function deletePicture(picture) {
    removeItem(pictures.val.indexOf(picture));
    onupdate(pictures.val.filter((p) => p !== picture));
  }

  function handleMove(originalIndex, newIndex) {
    const clone = [...pictures.val];
    const [movedItem] = clone.splice(originalIndex, 1);
    clone.splice(newIndex, 0, movedItem);
    onupdate(clone);
  }

  function updatePicture(picture) {
    onupdate(pictures.val.map((p) => (p === editing.val ? picture : p)));
  }

  async function loadImages(event) {
    const newPictures = await Promise.all([...event.target.files].map(async (file) => {
      const url = await getLocalFileUrl(file);
      return { file, url, description: '', unsaved: true };
    }));
    newPictures.map(getNewPictureElement).forEach((pic, i) => addItem(pic, pictures.val.length + i));
    onupdate([...pictures.val, ...newPictures]);
  }
}

function EditModal({ onupdate, ondelete, onclose, ...props }) {
  const picture = van.state(props.picture);
  return Modal({ onclose },
    () => img({ src: picture.val.url, class: 'block mx-auto mb-4 max-h-screen/2' }),
    input({ type: 'file', onchange: loadImage }),
    textarea({ rows: 5, ...bind(picture, 'description') }),
    button({ onclick: save }, 'save'),
    button({ class: 'ml-4', onclick: confirmAndDelete }, 'delete'),
    button({ class: 'ml-4', onclick: onclose }, 'cancel'),
  );

  async function loadImage(event) {
    const file = event.target.files[0];
    const url = await getLocalFileUrl(file);
    const { description } = picture.val;
    picture.val = { file, url, description, unsaved: true };
  }

  async function save() {
    onupdate(picture.val);
    onclose();
  }

  function confirmAndDelete() {
    confirmAnd(() => {
      ondelete(props.picture);
      onclose();
    });
  }
}
