import { SudachiStateless, TokenizeMode } from './sudachi.js';
import { groupIntoBunsetsu } from './bunsetsu-rules.js';
import { applySpacingPatterns } from './spacing-patterns.js';

const TOKENIZE_MODE_B = TokenizeMode.B;

let sudachi = null;
let initPromise = null;

function hasJapanese(text) {
  return /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/u.test(text);
}

function refineBunsetsuSpacing(text) {
  return applySpacingPatterns(text);
}

function tokenizeText(text) {
  if (!text || !/\S/u.test(text) || !hasJapanese(text)) {
    return text;
  }

  const tokens = sudachi.tokenize_raw(text, TOKENIZE_MODE_B);
  if (tokens?.error) {
    throw new Error(tokens.details || tokens.error);
  }

  return refineBunsetsuSpacing(groupIntoBunsetsu(tokens));
}

export async function ensureInitialized(dictUrl) {
  if (sudachi?.is_initialized()) {
    return;
  }

  if (!initPromise) {
    initPromise = (async () => {
      const response = await fetch(dictUrl);
      if (!response.ok) {
        throw new Error(`사전 파일을 불러오지 못했습니다. (${response.status})`);
      }

      const dictBytes = new Uint8Array(await response.arrayBuffer());
      sudachi = new SudachiStateless();
      const initResult = sudachi.initialize_from_bytes(dictBytes);
      if (initResult?.error) {
        throw new Error(initResult.details || initResult.error);
      }
      if (!sudachi.is_initialized()) {
        throw new Error('Sudachi 초기화에 실패했습니다.');
      }
    })();
  }

  try {
    await initPromise;
  } catch (error) {
    initPromise = null;
    sudachi = null;
    throw error;
  }
}

export async function tokenizeTexts(texts, dictUrl) {
  await ensureInitialized(dictUrl);
  return (texts || []).map((text) => tokenizeText(text));
}
