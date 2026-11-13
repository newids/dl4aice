---
name: ebook-assembly
description: 교재 HTML e-book 빌드 스펙 — 디렉토리 구조, 조판 스타일, 도해 임베드, 해설 접힘 처리, 자체 검증. e-book 빌드, 재빌드, 조판 수정, "책으로 만들어줘", EPUB 변환 요청 시 반드시 사용할 것.
---

# e-book 빌드 스펙

## 산출 구조

```
book/
├── index.html      # 표지 + 전체 목차 + 학습 로드맵
├── ch01.html …     # 챕터 페이지 (이전/다음 내비게이션 포함)
├── mock01.html …   # 모의고사 페이지
└── style.css       # 단일 스타일시트
```

- 오프라인 단독 열람: 외부 CDN·폰트·스크립트 참조 금지. SVG는 인라인 임베드.
- `<html lang="ko">`, 시맨틱 구조(`<main>`, `<nav>`, `<section>`) 준수.

## 치환 규칙 (콘텐츠 무수정 원칙)

| 소스 | 치환 |
|------|------|
| `<!-- DIAGRAM: {id} \| {제목} \| ... -->` | `_workspace/diagrams/{id}.svg` 인라인 + `<figcaption>{제목}</figcaption>` |
| `<!-- EXAM: ch{NN} -->` | `_workspace/exams/ch{NN}_quiz.md` 렌더링 결과 |
| `## 해답 및 해설` 이하 (문제 파일) | `<details class="solution"><summary>해답 및 해설 보기</summary>…</details>` |

콘텐츠 텍스트는 한 글자도 수정하지 않는다. 결함 발견 시 보고만 한다.

## 조판 스타일 (도해 중심 수험서 방향)

- **본문:** 최대 폭 760px 중앙, 줄간 1.75, 17px. 시스템 한국어 폰트 스택 (`"Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`).
- **팔레트:** 도해 스타일 시스템과 동일 토큰(ink `#1a2332`, primary `#2563eb`, accent `#f59e0b`)을 CSS 변수로 정의해 도해와 지면이 한 시스템으로 보이게 한다.
- **도해:** `<figure>` 전폭 배치, 연한 테두리 + 번호 캡션 ("그림 3-1"). 챕터 내 자동 번호.
- **시험 포인트 인용 블록:** 옅은 배경 틴트 + 같은 계열의 1px 전체 테두리 콜아웃(좌측 색 보더 금지).
- **코드:** 다크 배경(`#0f172a`) 블록, 15px 모노스페이스, 가로 스크롤 허용.
- **반응형:** 320/768/1024 브레이크포인트. 모바일에서 도해는 가로 스크롤 대신 축소 표시.
- **인쇄 CSS:** `@media print`에서 details 강제 펼침 + 페이지 나눔 제어 (PDF 저장 대응).

## 빌드 방법

Python 스크립트(`scripts/build_ebook.py`)로 빌드한다. markdown 변환은 표준 라이브러리로 어려우므로 `python3 -m pip install markdown` 후 사용 (불가 시 자체 최소 변환기 작성). 빌드 스크립트는 재실행 가능(idempotent)해야 한다.

## 자체 검증 (빌드 완료 조건)

1. 잔존 플레이스홀더 검색: 결과물에 `<!-- DIAGRAM`/`<!-- EXAM` 문자열 0건
2. 내부 링크: 모든 `href` 대상 파일 존재
3. 도해 매칭: 고아 SVG(참조 안 된 파일)와 누락 SVG 목록 보고
4. 목차 ↔ 실제 페이지 일치

## EPUB 변환 (요청 시에만)

HTML 빌드가 정본이다. EPUB 요청 시 `pandoc` 존재를 확인하고 있으면 변환, 없으면 HTML 산출 후 변환 불가 사유를 보고한다.

## v2 인터랙티브 계층 (2026-11-13 추가)

HTML 빌드 위에 얹는 Vanilla JS 위젯 계층이다. 프레임워크·번들러·외부 CDN은 여전히 금지이며 빌드 시간 0초를 유지한다.

- **정본 위치:** 리포 루트 `assets/` — `js/*.js`(위젯), `css/_parts/*.css`(조각 → 빌드가 `css/v2-widgets.css`로 합본), `data/*.json`(학습 데이터). `book/`·`docs/`의 `assets/`는 빌드 산출물이므로 직접 고치지 않는다.
- **데이터 로딩:** 빌드가 JSON마다 `assets/data/<name>.js` 래퍼를 만들어 `file://` 열람에서도 동작한다. 모듈은 `DL4AICE.data(name)`만 쓴다.
- **플레이스홀더 추가:** `<!-- WIDGET: arch | type=binary | api=sequential | focus=output,loss -->` → 유형×API 비교 위젯 마운트.
- **확인 문제 자리(`<!-- EXAM: chNN -->`):** 실습 셀(`chapter_drills.json`) 마운트 + v1 지면판 문제·해설은 `<details class="v2-legacy">`로 접어 보존.
- **모의고사 페이지:** `mock_exams_14q.json`에 해당 id가 있으면 CBT 엔진 마운트 + v1 지면판(`mock_exam_N.md`가 있을 때)을 접어 보존.
- **부속 페이지:** `_workspace/pages/<키>.html`(HTML 조각) → `<키>.html`. 목록은 `scripts/ebook/v2.py`의 `EXTRA_PAGES`(현재 `cheatsheet`, `appendix`). 부록 조각은 손으로 고치지 않고 `python3 scripts/v2/appendix_memorize.py`로 생성한다(같은 파일의 `--verify`가 실린 코드를 실제 실행).
- **docs 동기화:** 빌드가 끝나면 `book/`을 `docs/`(GitHub Pages)로 그대로 반영한다(`--no-docs`로 생략).
- **자체 검증 추가분:** `src` 경로 존재·외부 스크립트 금지 검사가 내부 링크 검사에 포함된다. 전체 게이트는 `python3 scripts/v2/verify_all.py`.
- 스키마·모듈 계약·CSS 규칙의 상세는 `_workspace/v2/SPEC.md`가 단일 기준이다.
- **모션·코드 블록 계층 (2026-11-13):** `assets/js/motion.js`(읽기 진행 막대, 스크롤 등장, 현재 절 표시, 카드 스포트라이트, 정답·합격 축하, 테마 전환 리빌)와 `assets/js/code-blocks.js`(본문 `<pre><code>`를 에디터 창 UI로: 구문 색상·줄 번호·복사)가 전 페이지에 붙는다. 스타일은 `css/_parts/70-motion.css`, `80-codeblock.css`. 원칙: transform/opacity만 애니메이션, `prefers-reduced-motion`이면 전부 끔, 클래스는 스크립트가 붙이므로 JS가 꺼져도 내용은 그대로 보인다. 구문 색상 토큰(`.v2-tok-*`)은 `00-base.css` 한 곳에서 정의한다.

## 금지 장식 (예외 없음)

카드·블록·콜아웃·버튼 등 모든 UI 요소에서 **한쪽 가장자리(왼쪽 끝 또는 위쪽 끝)에만 다른 색으로 포인트를 주는 띠 장식을 절대 쓰지 않는다.** `border-left`/`border-top`을 굵게 색칠하는 방식, `box-shadow: inset`이나 `::before`/`::after`로 만든 색 띠, 한쪽만 각진 `border-radius: 0 r r 0` 모두 해당한다. 구분이 필요하면 전체 테두리 색(1px), 옅은 배경 틴트, 배지·아이콘·제목 색으로 표현한다.
