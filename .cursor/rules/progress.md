# Progress

## 완료된 작업
- [x] Memory Bank 초기화
- [x] Manifest V3 기본 확장 (popup, content.js)
- [x] Sudachi WASM Mode B 文節 띄어쓰기
- [x] sudachi-worker.js + lib/sudachi vendoring
- [x] setup-dict.ps1, README, NOTICE
- [x] 로컬 sideload 전용 문서화

## 진행 중
- (없음 — Chrome 수동 QA 대기)

## 남은 작업
- [ ] Chrome sideload 후 대표 문장·회귀 테스트
- [ ] (선택) Core dict 옵션
- [ ] (선택) SPA MutationObserver

## 알려진 이슈
- Small dict: 신조어·固有名詞 커버리지 한계
- 첫 적용: ~117MB 사전 로드 지연
- Chrome Worker ES module + sudachi.js: 브라우저에서만 최종 검증 필요

## 기술 부채
- `node_modules/`는 setup용 — gitignore 처리
- 자동화 테스트 없음 (수동 체크리스트)
