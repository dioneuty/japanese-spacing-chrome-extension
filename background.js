const OFFSCREEN_PORT_NAME = 'offscreen-sudachi';

let offscreenPort = null;
let creatingOffscreen = null;
let offscreenPortWaiters = [];
let portRequestId = 0;
const pendingPortRequests = new Map();

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== OFFSCREEN_PORT_NAME) {
    return;
  }

  offscreenPort = port;

  port.onMessage.addListener((message) => {
    const pending = pendingPortRequests.get(message.id);
    if (!pending) {
      return;
    }

    pendingPortRequests.delete(message.id);
    if (message.ok) {
      pending.resolve(message);
    } else {
      pending.reject(new Error(message.message || 'Sudachi 처리에 실패했습니다.'));
    }
  });

  port.onDisconnect.addListener(() => {
    offscreenPort = null;
    for (const [, pending] of pendingPortRequests) {
      pending.reject(new Error('Offscreen Sudachi 연결이 끊어졌습니다.'));
    }
    pendingPortRequests.clear();
  });

  for (const resolve of offscreenPortWaiters) {
    resolve(port);
  }
  offscreenPortWaiters = [];
});

function waitForOffscreenPort(timeoutMs = 15000) {
  if (offscreenPort) {
    return Promise.resolve(offscreenPort);
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const index = offscreenPortWaiters.indexOf(resolve);
      if (index >= 0) {
        offscreenPortWaiters.splice(index, 1);
      }
      reject(new Error('Offscreen Sudachi 준비 시간이 초과되었습니다.'));
    }, timeoutMs);

    offscreenPortWaiters.push((port) => {
      clearTimeout(timer);
      resolve(port);
    });
  });
}

async function ensureOffscreenDocument() {
  if (offscreenPort) {
    return offscreenPort;
  }

  if (await chrome.offscreen.hasDocument()) {
    try {
      return await waitForOffscreenPort(3000);
    } catch {
      await chrome.offscreen.closeDocument();
      offscreenPort = null;
    }
  }

  if (!creatingOffscreen) {
    creatingOffscreen = chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['WORKERS'],
      justification: 'Sudachi WASM morphological analysis for Japanese spacing',
    }).finally(() => {
      creatingOffscreen = null;
    });
  }

  await creatingOffscreen;
  return waitForOffscreenPort();
}

function requestOffscreen(payload, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    if (!offscreenPort) {
      reject(new Error('Offscreen Sudachi가 연결되지 않았습니다.'));
      return;
    }

    const id = ++portRequestId;
    const timer = setTimeout(() => {
      pendingPortRequests.delete(id);
      reject(new Error('Sudachi 분석 시간이 초과되었습니다. (사전 로드 중일 수 있습니다)'));
    }, timeoutMs);

    pendingPortRequests.set(id, {
      resolve: (message) => {
        clearTimeout(timer);
        resolve(message);
      },
      reject: (error) => {
        clearTimeout(timer);
        reject(error);
      },
    });

    offscreenPort.postMessage({ id, ...payload });
  });
}

async function forwardToOffscreen(message) {
  await ensureOffscreenDocument();
  return requestOffscreen({
    type: message.type,
    texts: message.texts,
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.target !== 'background') {
    return;
  }

  forwardToOffscreen(message)
    .then((response) => {
      sendResponse(response || { ok: false, message: 'Sudachi 응답이 없습니다.' });
    })
    .catch((error) => {
      sendResponse({
        ok: false,
        message: error?.message || 'Sudachi 처리 중 오류가 발생했습니다.',
      });
    });

  return true;
});
