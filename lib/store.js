export default {
  get(key) {
    const json = localStorage.getItem(key);
    return JSON.parse(json);
  },
  set(key, value) {
    const json = JSON.stringify(value);
    localStorage.setItem(key, json);
  },
};
