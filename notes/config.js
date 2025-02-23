import store from '/lib/store.js';

const CONFIG_KEY = 'notes-config';
const DEFAULT_CONFIG = {
  appearance: {
    darkMode: false,
  },
  database: {
    authUrl: '',
    apiKey: '',
    baseUrl: '',
  },
};

export default {
  load() {
    return store.get(CONFIG_KEY) ?? DEFAULT_CONFIG;
  },
  save(config) {
    store.set(CONFIG_KEY, config);
  },
};
