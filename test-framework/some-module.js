export function someFunction() {
  console.log('module function done');
}

export function someBrokenFunction() {
  throw new Error('module function failed');
}
