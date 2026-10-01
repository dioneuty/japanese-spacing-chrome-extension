# System Patterns

## 아키텍처
Manifest V3 — 팝업 + background + offscreen + 주입형 콘텐츠 스크립트.

```
popup.js
    │  chrome.scripting.executeScript (activeTab)
    ▼
content.js  →  chrome.runtime.sendMessage
    ▼
background.js  →  offscreen document 생성·중계
    ▼
offscreen.js + lib/sudachi/engine.js
    │  SudachiStateless + TokenizeMode.B
    ▼
lib/sudachi/sudachi.js + resources/system.dic
    │
    ▼
텍스트 노드 textContent 변경 (innerHTML 미사용)
```

## 핵심 설계

### Sudachi 분절 + 文節 병합 + 패턴 후처리
- `SudachiStateless.initialize_from_bytes(dict)` — offscreen에서 사전 로드
- `tokenize_raw(text, TokenizeMode.B)` → `groupIntoBunsetsu()` (POS 기반 文節 병합)
- `groupIntoBunsetsu()` — `lib/sudachi/bunsetsu-rules.js` (한국어 어절 원칙 → POS·문맥 규칙)
- `applySpacingPatterns()` — 괄호 등 POS로 처리 어려운 예외만 (`spacing-patterns.js`)
- 품질 개선은 **Mode 전환보다 POS 규칙·예외 패턴 추가**가 우선
- 일본어 없는 텍스트 노드는 원문 유지

### 상태 저장
- `WeakMap<Text, string>`: 텍스트 노드 → 최초 원문
- `Set<Text>`: 복원용 추적 노드
- 반복 적용: 저장된 원문 기준 재 tokenize

### 메시지 통신
- content → background (`target: 'background'`)
- background → offscreen (`target: 'offscreen'`)
- `tokenize`: 텍스트 배열 batch 처리 (내부에서 사전 lazy-load)
- 페이지 origin에서 Worker 생성 불가 → **offscreen document** 사용

### 권한·배포
- `activeTab`, `scripting` only
- **로컬 sideload** — Web Store 미배포, Core dict(~200MB) 선택 가능

## DOM 변경 원칙
- `textContent`만 변경
- 제외: script, style, pre, code, input, textarea, select, contenteditable
