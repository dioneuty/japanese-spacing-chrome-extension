# 일본어 띄어쓰기 Chrome 확장

일본어 웹페이지의 **원문을 번역하지 않고** 文節(한국어 어절에 가까운 단위) 사이에 공백을 추가하는 **로컬 sideload 전용** Chrome 확장입니다.

- **분석 엔진**: [Sudachi](https://github.com/WorksApplications/sudachi.rs) WASM ([sudachi-wasm333](https://github.com/Benjas333/sudachi-wasm333))
- **분절 모드**: **TokenizeMode B (Medium)** — 예: `今日は良い天気です` → `今日は 良い 天気 です`
- **처리 위치**: 브라우저 로컬 Web Worker (외부 API·CDN 없음)
- **배포**: Chrome Web Store 미사용, `chrome://extensions` sideload만

## 기능

- **띄어쓰기 적용**: 현재 탭 텍스트 노드에 Sudachi Mode B 공백 삽입
- **원문 복원**: 저장된 원문으로 되돌림
- **중복 방지**: 반복 적용해도 원문 기준으로 처리
- **제외 영역**: `input`, `textarea`, `contenteditable`, `script`, `style`, `pre`, `code`

## 권한

| 권한 | 용도 |
|------|------|
| `activeTab` | 팝업을 연 현재 탭에만 접근 |
| `scripting` | 버튼 클릭 시 콘텐츠 스크립트 주입 |
| `offscreen` | Sudachi WASM을 확장 origin에서 실행 (페이지 origin Worker 제한 회피) |

## 사전 설치 (최초 1회)

Sudachi Small 사전(`system.dic`, 약 117MB)이 필요합니다.

### 방법 A: setup 스크립트 (권장)

```powershell
cd "프로젝트-루트"
.\scripts\setup-dict.ps1
```

### 방법 B: 이미 포함된 경우

`lib/sudachi/resources/system.dic` 파일이 있으면 추가 작업 없이 사용할 수 있습니다.

## Chrome sideload 설치

1. Chrome에서 `chrome://extensions` 를 엽니다.
2. **개발자 모드**를 켭니다.
3. **압축해제된 확장 프로그램을 로드합니다** 를 클릭합니다.
4. 이 프로젝트 **루트 폴더**(`manifest.json` 위치)를 선택합니다.

### 사용 방법

1. 일본어 페이지를 엽니다.
2. 확장 아이콘 → **띄어쓰기 적용**
3. **첫 적용**은 Small 사전(~117MB) 로드로 **수 초** 걸릴 수 있습니다.
4. **원문 복원**으로 되돌립니다.

## 테스트 체크리스트

### 기본 동작

- [ ] `今日は良い天気です` → `今日は 良い 天気 です` 에 가깝게 공백이 들어간다
- [ ] `私は学校に行きました` → `私は 学校に 行き ました` 에 가깝게 분리된다
- [ ] **원문 복원** 후 원래 텍스트와 동일하다
- [ ] **띄어쓰기 적용**을 연속 두 번 눌러도 공백이 누적되지 않는다

### 제외·회귀

- [ ] `input`, `textarea`, `contenteditable`, `pre`, `code` 내부는 변경되지 않는다
- [ ] 링크·버튼 등 페이지 동작이 깨지지 않는다
- [ ] `chrome://` 페이지에서는 오류 메시지가 표시된다

### 성능

- [ ] 첫 적용 후 같은 탭에서 재적용 시 사전 로드 없이 더 빠르다
- [ ] 팝업에 「Sudachi 사전 로드 및 분석 중…」 상태가 표시된다

## Sudachi Mode B와 한국어식 띄어쓰기

| 원문 | Mode B 예시 | 한국어 감각 |
|------|-------------|-------------|
| `今日は良い天気です` | `今日は 良い 天気 です` | `오늘은 / 좋은 / 날씨 / 입니다` |
| `私は学校に行きました` | `私は 学校に 行き ました` | `나는 / 학교에 / 갔습니다` |

Mode B는 **文節(문节)** 수준으로, 조사·활용이 앞 단어에 붙은 뒤 다음 文節과 공백으로 구분됩니다.

## 한계

| 항목 | 설명 |
|------|------|
| Small dict | Core/Full 대비 신조어·固有名詞 커버리지가 낮을 수 있음 |
| 첫 로드 | 사전 파일(~117MB) fetch·초기화로 지연 |
| 혼합 텍스트 | 일본어가 없는 노드는 그대로 둠 |
| SPA | AJAX/SPA 재렌더링 후 새 DOM은 재적용 필요 |
| iframe | cross-origin iframe 내부는 접근 불가 |

Core dict(~200MB+)로 교체하려면 `scripts/setup-dict.ps1`를 참고해 `system.dic`만 교체하면 됩니다 (로컬 sideload 전용).

## 프로젝트 구조

```
manifest.json
popup.html / popup.css / popup.js
background.js              # offscreen 문서 생성·메시지 중계
offscreen.html/js          # Sudachi WASM 실행 (확장 origin)
content.js                 # DOM 순회, runtime 메시지
lib/sudachi/engine.js      # Sudachi 초기화·tokenize
lib/sudachi/
  sudachi.js               # sudachi-wasm333 (vendored)
  resources/system.dic     # SudachiDict Small
  NOTICE.md
scripts/setup-dict.ps1
.cursor/rules/             # Memory Bank
```

## 기술 요구사항

- Chrome 87+ (Web Worker ES module, WASM)
- 빌드·번들러 없음 — sideload 후 바로 사용
- **로컬 전용** — Web Store 배포를 전제로 하지 않음

## 라이선스·attribution

- 확장 코드: 개인용 프로젝트
- Sudachi / sudachi-wasm333 / SudachiDict: **Apache-2.0** — 자세한 내용은 [lib/sudachi/NOTICE.md](lib/sudachi/NOTICE.md)
