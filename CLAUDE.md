# dl4aice

## 하네스: AICE Associate 딥러닝 교재 제작

**목표:** AICE Associate 수험 수준의 딥러닝 교재를 한국어·도해 위주로 집필하고, 기출 유형 문제·해설을 포함한 HTML e-book으로 산출한다.

**트리거:** 교재 제작/수정/재빌드 등 콘텐츠 작업 요청 시 `aice-textbook` 스킬을 사용하라. 시험 범위에 대한 단순 질문은 직접 응답 가능.

## 디자인 금지 규칙 (사용자 지시, 2026-11-13 — 예외 없음)

- 카드·블록·콜아웃·버튼 등 모든 UI 요소에서 **한쪽 가장자리(왼쪽 끝 또는 위쪽 끝)에만 다른 색으로 포인트를 주는 띠 장식을 절대 쓰지 않는다.** `border-left`/`border-top`을 굵게 색칠하는 방식, `box-shadow: inset`이나 `::before`/`::after`로 만든 색 띠, 한쪽만 각진 `border-radius: 0 r r 0` 모두 해당한다. 구분이 필요하면 전체 테두리 색(1px), 옅은 배경 틴트, 배지·아이콘·제목 색으로 표현한다.
- 새 CSS·SVG·HTML을 만들거나 서브에이전트에게 UI 작업을 맡길 때 이 규칙을 지시문에 반드시 포함한다.
- 검사: `python3 scripts/v2/check_no_edge_stripes.py` (빌드 검증 게이트에 포함).

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-07-28 | 초기 구성 (에이전트 6, 스킬 6) | 전체 | - |
| 2026-07-28 | 코드 검증 증적 규칙·Keras 버전 표준·플레이스홀더 필드 정의·SVG 유니코드 규칙 추가 | skills/chapter-writing, aice-domain, diagram-style | 스모크 테스트 피드백 |
| 2026-07-31 | 시각화 범위에 boxplot 추가 | skills/aice-domain | 모의고사 QA H-2 (커리큘럼 허용 항목과 정합) |
| 2026-11-13 | v2.0 인터랙티브 계층 추가 — 정본은 `assets/`(JS·CSS 조각·JSON), 빌드가 `book/`·`docs/`로 배포. 명세 `_workspace/v2/SPEC.md`, 검증 `python3 scripts/v2/verify_all.py` | assets/, scripts/ebook/v2.py, scripts/v2/, skills/ebook-assembly | 14문항 CBT 체제 반영 (WORK_ORDER v2.0) |
| 2026-11-13 | 한쪽 가장자리 색 띠 장식 전면 금지 규칙 추가, 기존 스타일 53곳 제거 | CLAUDE.md, style.css, assets/css/_parts, skills/ebook-assembly, diagram-style | 사용자 지시 |
