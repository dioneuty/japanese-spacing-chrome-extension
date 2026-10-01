/**
 * Sudachi POS·활용·문맥 기반 文節 병합.
 *
 * 한국어 띄어쓰기(어절) 원칙을 일본어 文節 규칙으로 매핑:
 * 1. 조사(助詞)는 앞말에 붙인다        → は/に/を/が … attach
 * 2. 관형어+명사는 나눈다              → 良い | 天気
 * 3. 복합 고유명사·OO語는 붙인다       → 東京タワー, 日本語
 * 4. 용언 활용·경어·추측 어미는 붙인다 → 行きました, 来ないでしょう
 * 5. 명사+서술격 조사도 붙인다         → 天気です, 好きです
 * 6. -고 있다는 끊는다                 → 読んで | います, 降って | いる
 * 7. -고 싶다는 끊는다                 → 行き | たい
 * 8. 인용·전달은 と까지 붙이고 끊는다  → 帰りたいと | 思う, なり得ると | した
 * 10. 주어·주제 뒤 술어는 새 어절      → 彼は | 来ない, 雨が | 降って
 * 11. 의존명사(形式名詞)는 앞 절과 분리 → 勉強する | こと
 * 12. 부사는 독립 어절                 → とても | 楽しかった
 */

const AUXILIARY_VERB_DICT = new Set([
  'いる',
  '居る',
  'ある',
  'おる',
  'くる',
  '来る',
  '行く',
  'いく',
  'みる',
  '見る',
  'しまう',
  'おく',
  'くれる',
  'あげる',
  'もらう',
  'できる',
  '得る',
  'うる',
  'たい',
  'ほしい',
]);

const REPORTING_VERB_DICT = new Set([
  'みる',
  '見る',
  '思う',
  '言う',
  'いう',
  '考える',
  '聞く',
  '呼ぶ',
  '知る',
  '示す',
  '伝える',
  '報じる',
  'おる',
  '見込む',
  '見込',
]);

const FORMAL_NOUN_DICT = new Set([
  'こと',
  'もの',
  'ところ',
  'ため',
  'はず',
  'わけ',
  'うち',
  'とおり',
  'つもり',
  'まま',
  'ほう',
]);

const SUBJECT_TOPIC_PARTICLES = new Set(['は', 'が', 'も']);

function pos(token, index) {
  return token?.poses?.[index] ?? '';
}

function dict(token) {
  return token?.dictionary_form ?? '';
}

function surface(token) {
  return token?.surface ?? '';
}

export function isOpeningBracket(text) {
  return /^[（「『【〈《〔［("'‘]/u.test(text);
}

export function isClosingBracket(text) {
  return /^[）」』】〉》〕］"'’]/u.test(text);
}

function isSahenNoun(token) {
  return pos(token, 0) === '名詞' && pos(token, 2) === 'サ変可能';
}

function isSuruVerb(token) {
  return pos(token, 0) === '動詞' && dict(token) === 'する';
}

function isTeOrDe(token) {
  return pos(token, 0) === '助詞' && pos(token, 1) === '接続助詞' && (dict(token) === 'て' || dict(token) === 'で');
}

function isParticleTo(token) {
  return pos(token, 0) === '助詞' && dict(token) === 'と';
}

function isSubjectTopicParticle(token) {
  return pos(token, 0) === '助詞' && SUBJECT_TOPIC_PARTICLES.has(dict(token));
}

function isRenTaiShi(token) {
  return pos(token, 0) === '連体詞';
}

function isPrefix(token) {
  return pos(token, 0) === '接頭辞';
}

function isAdverb(token) {
  return pos(token, 0) === '副詞';
}

function isFormalNoun(token) {
  return pos(token, 0) === '名詞' && FORMAL_NOUN_DICT.has(dict(token));
}

function isProperNoun(token) {
  return pos(token, 0) === '名詞' && pos(token, 1) === '固有名詞';
}

function isNoun(token) {
  return pos(token, 0) === '名詞';
}

function isAdjective(token) {
  return pos(token, 0) === '形容詞';
}

function isKeiyoushi(token) {
  return pos(token, 0) === '形状詞';
}

function isReportingVerb(token) {
  if (!token) {
    return false;
  }
  if (pos(token, 0) !== '動詞' && pos(token, 0) !== '助動詞') {
    return false;
  }
  return REPORTING_VERB_DICT.has(dict(token));
}

function isMainPredicateVerb(token) {
  if (pos(token, 0) !== '動詞') {
    return false;
  }
  if (pos(token, 1) === '一般') {
    return true;
  }
  return pos(token, 1) === '非自立可能' && ['行く', '来る', 'いく', 'くる'].includes(dict(token));
}

function isLocativeParticle(token) {
  return pos(token, 0) === '助詞' && ['に', 'を', 'へ'].includes(dict(token));
}

function isPolitePastSequence(token, prev) {
  return dict(token) === 'た' && (surface(prev) === 'まし' || dict(prev) === 'ます');
}

function isNegativeAfterIru(token, prev) {
  return dict(token) === 'ない' && dict(prev) === 'いる';
}

function isPassiveAfterVerbStem(token, prev) {
  return dict(token) === 'られる' && ['みる', '見る', 'おる', 'いる'].includes(dict(prev));
}

function isNounCompoundContinuable(prev, token) {
  if (!isNoun(prev) || !isNoun(token)) {
    return false;
  }
  if (isSahenNoun(prev) && isSuruVerb(token)) {
    return false;
  }
  if (isFormalNoun(token)) {
    return false;
  }
  if (isProperNoun(prev)) {
    return true;
  }
  if (dict(token) === '語' && pos(prev, 2) === '国') {
    return true;
  }
  return false;
}

function shouldSplitBeforeAuxiliaryVerb(token, prev) {
  if (pos(token, 0) !== '動詞' || pos(token, 1) !== '非自立可能') {
    return false;
  }

  const auxiliaryDict = dict(token);
  if (!AUXILIARY_VERB_DICT.has(auxiliaryDict)) {
    return false;
  }

  return isTeOrDe(prev);
}

function shouldSplitBeforeDesire(token, prev) {
  return dict(token) === 'たい' && pos(prev, 0) === '動詞';
}

function shouldSplitBeforeMainPredicate(token, prev) {
  if (!isMainPredicateVerb(token)) {
    return false;
  }
  return isLocativeParticle(prev) || isSubjectTopicParticle(prev);
}

/** 北京市にある, 事態になる — 장소·대상+に 뒤 술어(ある/なる/いる) */
function shouldSplitBeforeNiPredicate(token, prev) {
  if (dict(prev) !== 'に' || pos(prev, 0) !== '助詞') {
    return false;
  }
  return pos(token, 0) === '動詞' && ['ある', 'なる', 'いる'].includes(dict(token));
}

function shouldSplitBeforeReportingAfterTo(token, prev) {
  return isReportingVerb(token) && isParticleTo(prev);
}

/** 인용 と + した/して — なり得ると|した (라고 하다) */
function shouldSplitBeforeSuruAfterQuotativeTo(token, prev) {
  return isSuruVerb(token) && isParticleTo(prev);
}

function shouldSplitBeforeFormalNoun(token, prev) {
  if (!isFormalNoun(token)) {
    return false;
  }
  return pos(prev, 0) === '動詞' || isSuruVerb(prev) || isSahenNoun(prev);
}

function shouldSplitBeforeAdverb(token) {
  return isAdverb(token);
}

function shouldSplitBeforePredicate(token, prev) {
  if (pos(token, 0) !== '動詞' && pos(token, 0) !== '形容詞') {
    return false;
  }
  return isAdverb(prev);
}

function isAdverbialNiStem(token) {
  if (!token) {
    return false;
  }
  const p0 = pos(token, 0);
  if (p0 === '形状詞' || p0 === '形容詞' || p0 === '副詞') {
    return true;
  }
  return p0 === '名詞' && pos(token, 2) === '副詞可能';
}

/** 確かにいる — 부사적 〜に(確かに/本当に) 뒤 동사 */
function shouldSplitBeforeVerbAfterAdverbialNi(token, prev, beforePrev) {
  if (pos(token, 0) !== '動詞') {
    return false;
  }
  if (surface(prev) !== 'に') {
    return false;
  }
  return isAdverbialNiStem(beforePrev);
}

/**
 * token이 current 文節에 붙는지 여부.
 * false면 새 文節을 시작한다.
 */
export function shouldAttachToPrevious(token, prev, _next, beforePrev = null) {
  if (!token?.surface) {
    return false;
  }

  if (isOpeningBracket(surface(token))) {
    return false;
  }

  if (!prev) {
    return false;
  }

  if (shouldSplitBeforeAdverb(token)) {
    return false;
  }

  if (shouldSplitBeforePredicate(token, prev)) {
    return false;
  }

  if (shouldSplitBeforeFormalNoun(token, prev)) {
    return false;
  }

  if (shouldSplitBeforeAuxiliaryVerb(token, prev)) {
    return false;
  }

  if (shouldSplitBeforeDesire(token, prev)) {
    return false;
  }

  if (shouldSplitBeforeMainPredicate(token, prev)) {
    return false;
  }

  if (shouldSplitBeforeNiPredicate(token, prev)) {
    return false;
  }

  if (shouldSplitBeforeVerbAfterAdverbialNi(token, prev, beforePrev)) {
    return false;
  }

  if (shouldSplitBeforeReportingAfterTo(token, prev)) {
    return false;
  }

  if (shouldSplitBeforeSuruAfterQuotativeTo(token, prev)) {
    return false;
  }

  if (isNounCompoundContinuable(prev, token)) {
    return true;
  }

  if (pos(token, 0) === '助詞') {
    return true;
  }

  if (pos(token, 0) === '接尾辞') {
    return true;
  }

  if (pos(token, 0) === '補助記号' || pos(token, 0) === '記号') {
    return isClosingBracket(surface(token)) || !isOpeningBracket(surface(token));
  }

  if (pos(token, 0) === '助動詞') {
    if (isNegativeAfterIru(token, prev)) {
      return true;
    }
    if (isPolitePastSequence(token, prev)) {
      return true;
    }
    if (isPassiveAfterVerbStem(token, prev)) {
      return true;
    }
    if (dict(token) === 'ます' && dict(prev) === 'いる') {
      return true;
    }
    return true;
  }

  if (isSuruVerb(token)) {
    if (isSahenNoun(prev)) {
      return true;
    }
    if (isSuruVerb(prev)) {
      return true;
    }
    return false;
  }

  if (pos(token, 0) === '動詞' && pos(token, 1) === '非自立可能') {
    return !shouldSplitBeforeAuxiliaryVerb(token, prev);
  }

  return false;
}

export function shouldPullNextToken(token) {
  return isRenTaiShi(token) || isPrefix(token) || isOpeningBracket(surface(token));
}

export function groupIntoBunsetsu(tokens) {
  const groups = [];
  let index = 0;

  while (index < tokens.length) {
    const token = tokens[index];
    if (!token?.surface) {
      index += 1;
      continue;
    }

    let group = surface(token);
    index += 1;

    if (shouldPullNextToken(token) && index < tokens.length) {
      const next = tokens[index];
      if (next?.surface && !isOpeningBracket(surface(next))) {
        group += surface(next);
        index += 1;
      }
    }

    while (index < tokens.length) {
      const nextToken = tokens[index];
      const prevToken = tokens[index - 1];

      if (!nextToken?.surface) {
        index += 1;
        continue;
      }

      const beforePrev = index >= 2 ? tokens[index - 2] : null;
      if (!shouldAttachToPrevious(nextToken, prevToken, tokens[index + 1], beforePrev)) {
        break;
      }

      group += surface(nextToken);
      index += 1;
    }

    groups.push(group);
  }

  return groups.join(' ');
}
