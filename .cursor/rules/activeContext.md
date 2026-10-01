# Active Context

## 현재 작업 포커스
Sudachi WASM Mode B 기반 文節 띄어쓰기 구현 완료 (로컬 sideload 전용).

## 최근 변경사항
- 2026-10-01: offscreen document 아키텍처, 文節 병합 규칙
- 2026-10-01: 한국어 어절 원칙 → POS 文節 규칙 확장 (v2.2.0)
- 2026-10-01: `lib/sudachi/bunsetsu-rules.js` — POS·dictionary_form 기반 文節 병합 (v2.1.0)
- 2026-10-01: regex 후처리는 괄호 예외만 유지
- 2026-10-01: sudachi-wasm333 + SudachiDict Small vendoring

## 활성 결정사항
- **Sudachi TokenizeMode B** — 한국어 어절 ≈ 文節
- **패턴 확장 방식** — Mode C 전환 대신 `spacing-patterns.js`에 규칙 추가
- **Small dict** (~117MB) — Core는 로컬 sideload 시 선택적 업그레이드
- **offscreen document** — WASM Sudachi 실행
- **Web Store 미배포** — sideload만

## 다음 단계
1. 뉴스·기사 문장에서 덜 띄어지는 구간 수집 → `SPACING_PATTERNS`에 추가
2. Chrome에서 확장 새로고침 후 수동 QA
3. (선택) Core dict 교체

## 주의사항
- 첫 적용 시 `system.dic` fetch로 수 초 소요
- `lib/sudachi/resources/system.dic` 없으면 `scripts/setup-dict.ps1` 실행 필요
