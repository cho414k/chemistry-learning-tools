const segmenter = new Intl.Segmenter('ko', {granularity:'grapheme'});
export function countText(text) {
  const normalized = text.normalize('NFC').replace(/[\r\n\u2028\u2029]/gu, '');
  let withSpaces=0, withoutSpaces=0;
  for (const {segment} of segmenter.segment(normalized)) {
    withSpaces++;
    if (!/^\s+$/u.test(segment)) withoutSpaces++;
  }
  return {withSpaces,withoutSpaces};
}
export function pageText(items) {
  return items.filter(item=>typeof item.str==='string').map(item=>item.str+(item.hasEOL?'\n':'')).join('');
}
