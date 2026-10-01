(function initJaWordSpacer() {
  if (window.__jaWordSpacer) {
    return;
  }

  const EXCLUDED_TAGS = new Set([
    'SCRIPT',
    'STYLE',
    'PRE',
    'CODE',
    'TEXTAREA',
    'INPUT',
    'SELECT',
    'NOSCRIPT',
  ]);

  const state = {
    originals: new WeakMap(),
    trackedNodes: new Set(),
    applied: false,
  };

  function isExcludedTextNode(textNode) {
    let element = textNode.parentElement;
    while (element) {
      if (EXCLUDED_TAGS.has(element.tagName)) {
        return true;
      }
      if (element.isContentEditable) {
        return true;
      }
      element = element.parentElement;
    }
    return false;
  }

  function collectTextNodes(root) {
    const nodes = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.textContent || !/\S/u.test(node.textContent)) {
          return NodeFilter.FILTER_REJECT;
        }
        if (isExcludedTextNode(node)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }

    return nodes;
  }

  async function sendToBackground(message, attempts = 5) {
    if (!chrome?.runtime?.sendMessage) {
      throw new Error('확장 API를 사용할 수 없습니다. 확장을 새로고침해 주세요.');
    }

    let lastError;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const response = await chrome.runtime.sendMessage(message);
        if (response === undefined) {
          throw new Error('확장 프로그램 응답이 없습니다. 확장을 새로고침해 주세요.');
        }
        return response;
      } catch (error) {
        lastError = error;
        const retriable = /Receiving end does not exist|Could not establish connection/i.test(
          error?.message || '',
        );
        if (!retriable || attempt === attempts - 1) {
          throw error;
        }
        await new Promise((resolve) => {
          setTimeout(resolve, 150 * (attempt + 1));
        });
      }
    }

    throw lastError;
  }

  async function tokenizeTexts(texts) {
    const response = await sendToBackground({
      target: 'background',
      type: 'tokenize',
      texts,
    });

    if (!response?.ok) {
      throw new Error(response?.message || 'Sudachi 분석에 실패했습니다.');
    }

    return response.results;
  }

  async function applySpacing() {
    const root = document.body;
    if (!root) {
      return { ok: false, message: '페이지 본문을 찾을 수 없습니다.' };
    }

    const textNodes = collectTextNodes(root);
    if (textNodes.length === 0) {
      return { ok: true, message: '처리할 텍스트가 없습니다.' };
    }

    const sourceTexts = [];
    for (const node of textNodes) {
      const currentText = node.textContent;
      const sourceText = state.originals.has(node)
        ? state.originals.get(node)
        : currentText;

      if (!state.originals.has(node)) {
        state.originals.set(node, sourceText);
        state.trackedNodes.add(node);
      }

      sourceTexts.push(sourceText);
    }

    let spacedTexts;
    try {
      spacedTexts = await tokenizeTexts(sourceTexts);
    } catch (error) {
      return {
        ok: false,
        message: error.message || 'Sudachi 분석에 실패했습니다.',
      };
    }

    let changedCount = 0;
    for (let index = 0; index < textNodes.length; index += 1) {
      const node = textNodes[index];
      const spacedText = spacedTexts[index];
      if (spacedText !== node.textContent) {
        node.textContent = spacedText;
        changedCount += 1;
      }
    }

    state.applied = state.trackedNodes.size > 0;

    if (changedCount === 0) {
      return { ok: true, message: '변경할 텍스트가 없습니다. (이미 적용됨)' };
    }

    return {
      ok: true,
      message: `띄어쓰기를 적용했습니다. (${changedCount}개 텍스트 노드, Sudachi Mode B)`,
    };
  }

  function restoreOriginal() {
    if (state.trackedNodes.size === 0) {
      return { ok: true, message: '복원할 원문이 없습니다.' };
    }

    let restoredCount = 0;

    for (const node of state.trackedNodes) {
      if (!node.isConnected) {
        continue;
      }

      const originalText = state.originals.get(node);
      if (typeof originalText === 'string' && node.textContent !== originalText) {
        node.textContent = originalText;
        restoredCount += 1;
      }
    }

    state.trackedNodes.clear();
    state.applied = false;

    if (restoredCount === 0) {
      return { ok: true, message: '복원할 변경 사항이 없습니다.' };
    }

    return {
      ok: true,
      message: `원문을 복원했습니다. (${restoredCount}개 텍스트 노드)`,
    };
  }

  window.__jaWordSpacer = {
    apply: applySpacing,
    restore: restoreOriginal,
    isApplied: () => state.applied,
  };
})();
