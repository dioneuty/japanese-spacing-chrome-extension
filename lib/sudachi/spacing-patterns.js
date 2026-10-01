/**
 * POS 文節 규칙으로 처리하지 못하는 예외만 regex로 보정한다.
 */
export const SPACING_PATTERNS = [
  {
    name: 'brackets-open',
    pattern: /([^\s])([（「『【〈《〔［])/gu,
    replacement: '$1 $2',
  },
  {
    name: 'brackets-close',
    pattern: /([）」』】〉》〕］])([^\s])/gu,
    replacement: '$1 $2',
  },
];

export function applySpacingPatterns(text) {
  let result = text;

  for (const { pattern, replacement } of SPACING_PATTERNS) {
    result = result.replace(pattern, replacement);
  }

  return result.replace(/ {2,}/g, ' ').trim();
}
