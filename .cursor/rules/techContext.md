# Tech Context

## 기술 스택
| 항목 | 선택 |
|------|------|
| 플랫폼 | Chrome Extension Manifest V3 |
| 형태소 분석 | Sudachi WASM (sudachi-wasm333 1.0.3) |
| 분절 모드 | TokenizeMode B (Medium / 文節) |
| 사전 | SudachiDict Small → `system.dic` (~117MB) |
| Worker | ES module Web Worker |
| 빌드 | 없음 — vendored prebuilt |

## 파일 구조
```
manifest.json
popup.html / popup.css / popup.js
content.js
sudachi-worker.js
lib/sudachi/sudachi.js
lib/sudachi/resources/system.dic
lib/sudachi/NOTICE.md
scripts/setup-dict.ps1
```

## 설치
1. `.\scripts\setup-dict.ps1` (사전·sudachi.js 없을 때)
2. `chrome://extensions` → 개발자 모드 → 폴더 로드

## 제약
- 런타임 외부 CDN·API 없음
- Web Store 미배포 (로컬 sideload)
- 첫 tokenize 전 dict fetch·WASM init 지연

## 라이선스
- Sudachi / sudachi-wasm333 / SudachiDict: Apache-2.0
