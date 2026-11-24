export function speakerText(value = '') {
  return String(value || '').replace(/[\u{1D400}-\u{1D7FF}]/gu, (character) => character.normalize('NFKC'));
}
