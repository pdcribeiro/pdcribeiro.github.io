import { after, before, describe, test } from '/test-framework/index.js';
import { someFunction, someBrokenFunction } from './some-module.js';

test('logs message to console (PASS)', () => {
  console.log('hello world');
});

test('throws error (FAIL)', () => {
  throw new Error('fail');
});

describe('calling imported functions', () => {
  test('runs imported function (PASS) ', () => {
    someFunction();
  });

  test('runs broken imported function (FAIL)', () => {
    someBrokenFunction();
  });
});

describe('before and after callbacks', () => {
  before(() => {

  });

  test('', () => {

  });

  after(() => {

  });
});

// describe('toBe or not.toBe', () => {
//   test('1 is 1', () => {
//     expect(1).toBe(1);
//   });

//   test('1 is 2', () => {
//     expect(1).toBe(2);
//   });

//   test('1 is not 2', () => {
//     expect(1).not.toBe(2);
//   });

//   test('1 is not 1', () => {
//     expect(1).not.toBe(1);
//   });
// });
