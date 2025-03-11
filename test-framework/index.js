// todo: deeper before/after callbacks should be called first
// todo: avoid having to call before/after callbacks before test functions

// note: async test functions not supported
// note: parallel tests not supported
// note: before/after functions must be called before the test functions they concern

import { range } from '/lib/utils.js';

let tests, prefix, callbacks;

export async function runTests(filePath) {
  tests = [];
  prefix = '';
  callbacks = {
    before: [],
    after: [],
  };

  await importFresh(filePath);

  const results = [];
  tests.forEach(({ callbacks, test, description }) => {
    try {
      callbacks.before.forEach((cb) => cb());
      test();
      results.push({ description });
    } catch (error) {
      results.push({ description, error });
    }
    callbacks.after.forEach((cb) => cb());
  });
  return results;
}

function importFresh(filePath) {
  return import(`${filePath}?t=${Date.now()}`);
}

export function test(description, test) {
  tests.push({
    description: prefix + description,
    test,
    callbacks: {
      before: [...callbacks.before],
      after: [...callbacks.after],
    },
  });
}

export function describe(description, callback) {
  const previousPrefix = prefix;
  prefix += `${description} `;

  const previousBeforeCallbackCount = callbacks.before.length;
  const previousAfterCallbackCount = callbacks.after.length;

  callback();

  prefix = previousPrefix;

  const addedBeforeCallbacksCount = callbacks.before.length - previousBeforeCallbackCount;
  const addedAfterCallbacksCount = callbacks.after.length - previousAfterCallbackCount;
  range(addedBeforeCallbacksCount).forEach(() => callbacks.before.pop());
  range(addedAfterCallbacksCount).forEach(() => callbacks.after.pop());
}

export function before(callback) {
  callbacks.before.push(callback);
}

export function after(callback) {
  callbacks.after.push(callback);
}
