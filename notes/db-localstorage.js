import store from '/lib/store.js';

const CONFIG_KEY = 'notes-database-config';
const COLLECTION_KEY = 'notes-database-collection';

const db = {
  async connect() {
    console.log('[dev db] dummy connect');
    migrate();
    seed();
  },
  async findNotes() {
    return get();
  },
  async createNote(data) {
    const notes = get();
    const note = { id: getNextId(), ...data };
    notes.push(note);
    set(notes);
    console.debug('[dev db] note created', note);
    return note;
  },
  async getNote(id) {
    const note = get().find((s) => s.id === id);
    if (!note) {
      throw new Error('note not found');
    }
    console.debug('[dev db] note found', note);
    return note;
  },
  async updateNote(id, data) {
    const notes = get();
    const index = notes.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error('note not found');
    }
    const note = { ...notes[index], ...data };
    notes[index] = note;
    set(notes);
    console.debug('[dev db] note updated', note);
    return note;
  },
  async deleteNote(id) {
    const notes = get();
    const index = notes.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error('note not found');
    }
    const note = notes[index];
    notes.splice(index, 1);
    set(notes);
    console.debug('[dev db] note deleted', note);
  },
};

function get() {
  return store.get(COLLECTION_KEY) ?? [];
}

function set(notes) {
  store.set(COLLECTION_KEY, notes);
}

function getNextId() {
  const config = store.get(CONFIG_KEY) ?? {};
  if (!config.nextId) {
    config.nextId = 1;
  } else {
    config.nextId += 1;
  }
  store.set(CONFIG_KEY, config);
  return config.nextId;
}

export default db;


// MIGRATIONS

function migrate() {
  // applyMigration((notes) => notes.map(s => ({...s, pictures: s.pictures.map(pic => ({...pic, description: pic.description ?? ''}))})))
}

function applyMigration(callback) {
  const notes = get();
  const migrated = callback(notes);
  set(migrated);
};


// SEEDS

// import seeds from './seeds.json'

function seed() {
  // store.set(COLLECTION_KEY, []);

  // localStorage.setItem(CONFIG_KEY, seeds.config)
  // localStorage.setItem(COLLECTION_KEY, seeds.notes)

  // await db.createNote({ name: 'effleurage', content: 'lorem ipsum', images: [], tags: [] });
}
