import { bind } from '/lib/utils.js';
import van from '/third-party/van.js';
import { routes } from '../app.js';
import db from '../db.js';

const TAG_PREFIX = 'tag:';

const { a, div, input, ul, li } = van.tags;

export default function NoteListPage() {
  const notes = van.state(null);
  db.findNotes().then((data) => (notes.val = data));
  const search = van.state('');
  const searchStrings = van.derive(() => search.val.trim().split(' ').map((s) => s.trim()).filter((s) => s.length));
  const searchTags = van.derive(() => searchStrings.val.filter((s) => s.startsWith(TAG_PREFIX)).map((s) => s.slice(TAG_PREFIX.length)));
  const searchWords = van.derive(() => searchStrings.val.filter((s) => !s.startsWith(TAG_PREFIX)));

  return div(
    div({ class: 'flex sticky top-0 items-center bg-theme' },
      input({ placeholder: 'search', class: 'm-0', ...bind(search) }),
      a({ href: routes.noteCreate.getPath(), class: 'button ml-4' }, '+'),
    ),
    () => notes.val
      ? ul(notes.val.filter(checkMatch).map(NoteListItem))
      : div('loading notes...'),
  );

  function checkMatch({ name, tags }) {
    const tagsArray = tags.split(',').map((t) => t.trim());
    if (!searchStrings.val.length) {
      return true;
    }
    for (const tag of searchTags.val) {
      if (!tagsArray.includes(tag)) {
        return false;
      }
    }
    if (!searchWords.val.length) {
      return true;
    }
    for (const word of searchWords.val) {
      if (name.includes(word)) {
        return true;
      }
    }
    return false;
  }
}

function NoteListItem({ id, name }) {
  return li({ class: 'mb-6' }, a({ href: routes.noteDetails.getPath(id) }, name));
}
