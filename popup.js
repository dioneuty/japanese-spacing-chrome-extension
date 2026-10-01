const applyBtn = document.getElementById('applyBtn');
const restoreBtn = document.getElementById('restoreBtn');
const statusEl = document.getElementById('status');

function setStatus(message, type = '') {
  statusEl.textContent = message;
  statusEl.className = 'popup__status';
  if (type) {
    statusEl.classList.add(`popup__status--${type}`);
  }
}

function setButtonsDisabled(disabled) {
  applyBtn.disabled = disabled;
  restoreBtn.disabled = disabled;
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error('활성 탭을 찾을 수 없습니다.');
  }
  return tab;
}

async function ensureContentScript(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['content.js'],
  });
}

async function runAction(action) {
  setButtonsDisabled(true);
  setStatus(action === 'apply' ? 'Sudachi 사전 로드 및 분석 중…' : '처리 중…');

  try {
    const tab = await getActiveTab();

    if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('edge://') || tab.url?.startsWith('chrome-extension://')) {
      throw new Error('이 페이지에서는 확장 프로그램을 사용할 수 없습니다.');
    }

    await ensureContentScript(tab.id);

    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async (actionName) => {
        if (!window.__jaWordSpacer) {
          return { ok: false, message: '콘텐츠 스크립트를 불러오지 못했습니다.' };
        }
        return window.__jaWordSpacer[actionName]();
      },
      args: [action],
    });

    if (!result?.ok) {
      throw new Error(result?.message || '작업에 실패했습니다.');
    }

    setStatus(result.message, 'success');
  } catch (error) {
    setStatus(error.message || '알 수 없는 오류가 발생했습니다.', 'error');
  } finally {
    setButtonsDisabled(false);
  }
}

applyBtn.addEventListener('click', () => runAction('apply'));
restoreBtn.addEventListener('click', () => runAction('restore'));
