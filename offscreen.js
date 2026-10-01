const DICT_URL = chrome.runtime.getURL('lib/sudachi/resources/system.dic');
const port = chrome.runtime.connect({ name: 'offscreen-sudachi' });

let enginePromise = null;

function loadEngine() {
  if (!enginePromise) {
    enginePromise = import('./lib/sudachi/engine.js');
  }
  return enginePromise;
}

port.onMessage.addListener(async (message) => {
  const { id, type, texts } = message;

  try {
    const { ensureInitialized, tokenizeTexts } = await loadEngine();

    if (type === 'init') {
      await ensureInitialized(DICT_URL);
      port.postMessage({ id, ok: true });
      return;
    }

    if (type === 'tokenize') {
      const results = await tokenizeTexts(texts || [], DICT_URL);
      port.postMessage({ id, ok: true, results });
      return;
    }

    port.postMessage({ id, ok: false, message: `알 수 없는 요청: ${type}` });
  } catch (error) {
    port.postMessage({
      id,
      ok: false,
      message: error?.message || 'Sudachi 처리 중 오류가 발생했습니다.',
    });
  }
});
