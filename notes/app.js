import Modal from '/components/Modal.js';
import routing from '/lib/routing.js';
import { bind } from '/lib/utils.js';
import van from '/third-party/van.js';
import configHelper from './config.js';
import db from './db.js';
import NoteCreatePage from './pages/NoteCreatePage.js';
import NoteDetailsPage from './pages/NoteDetailsPage.js';
import NoteEditPage from './pages/NoteEditPage.js';
import NoteListPage from './pages/NoteListPage.js';

const { button, div, h1, h2, input, label } = van.tags;

export const routes = routing.getPathHelpers({
  root: '/',
  noteList: '/notes',
  noteCreate: '/notes/create',
  noteDetails: '/notes/:param',
  noteEdit: '/notes/:param/edit',
});

const routedApp = routing.route({
  [routes.root.getPath()]: routing.redirect(routes.noteList.getPath()),
  [routes.noteList.getPath()]: NoteListPage,
  [routes.noteCreate.getPath()]: NoteCreatePage,
  [routes.noteDetails.getPath()]: NoteDetailsPage,
  [routes.noteEdit.getPath()]: NoteEditPage,
});

export function app() {
  const configOpen = van.state(false);
  const config = van.state(configHelper.load());
  const connected = van.state(false);
  init();

  return div(
    () => connected.val ? routedApp() : div(),
    button({ class: 'small float-right my-4', onclick: () => configOpen.val = true }, 'settings'),
    () => configOpen.val ? ConfigModal({ config, connectToDatabase, onclose: () => configOpen.val = false }) : div(),
  );

  async function init() {
    if (config.val) {
      setDarkMode(config.val.appearance.darkMode);
      await connectToDatabase();
    }
  }

  async function connectToDatabase() {
    try {
      await db.connect(config.val.database);
      connected.val = true;
    } catch (e) {
      console.error(e);
      connected.val = false;
    }
  }
}

function ConfigModal({ config, onclose, ...props }) {
  return Modal({ class: 'w-full max-w-200', onclose },
    h1('configuration'),
    h2('appearance'),
    button({ onclick: toggleDarkMode }, 'toggle dark mode'),
    h2('database'),
    label('auth url'), input(bind(config, 'database', 'authUrl')),
    label('api key'), input(bind(config, 'database', 'apiKey')),
    label('base url'), input(bind(config, 'database', 'baseUrl')),
    button({ onclick: connectToDatabase }, 'connect')
  );

  function toggleDarkMode() {
    config.val = { ...config.val, appearance: { darkMode: !config.val.appearance.darkMode } };
    configHelper.save(config.val);
    setDarkMode(config.val.appearance.darkMode);
  }

  async function connectToDatabase() {
    configHelper.save(config.val);
    await props.connectToDatabase();
  }
}

function setDarkMode(enabled) {
  const darkColor = getCssVar('--color-dark');
  const lightColor = getCssVar('--color-light');
  setCssVar('--bg-color', enabled ? darkColor : lightColor);
  setCssVar('--color', enabled ? lightColor : darkColor);
}

function getCssVar(name) {
  return window.getComputedStyle(document.documentElement).getPropertyValue(name);
}

function setCssVar(name, value) {
  document.documentElement.style.setProperty(name, value);
}
