// note: async test functions not supported
// note: parallel tests not supported

let tests, prefix, callbacks;

export async function runTests(filePath) {
  tests = [];
  prefix = '';
  callbacks = {
    before: [],
    after: [],
  };

  await importFresh(filePath);

  return tests.map(({ test, description }) => {
    try {
      test();
      return { description };
    } catch (error) {
      return { description, error };
    }
  });
}

function importFresh(filePath) {
  return import(`${filePath}?t=${Date.now()}`);
}

export function test(description, test) {
  tests.push({
    description: prefix + description,
    test
  });
}

export function describe(description, callback) {
  const previousPrefix = prefix;
  prefix += `${description} `;
  callback();
  prefix = previousPrefix;
}

export function before(callback) {

}

export function after(callback) {

}
