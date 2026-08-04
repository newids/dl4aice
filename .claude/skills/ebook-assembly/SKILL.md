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
- **시험 포인트 인용 블록:** accent 좌측 보더 + 옅은 배경 콜아웃.
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
