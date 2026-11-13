# dl4aice

## 하네스: AICE Associate 딥러닝 교재 제작

**목표:** AICE Associate 수험 수준의 딥러닝 교재를 한국어·도해 위주로 집필하고, 기출 유형 문제·해설을 포함한 HTML e-book으로 산출한다.

**트리거:** 교재 제작/수정/재빌드 등 콘텐츠 작업 요청 시 `aice-textbook` 스킬을 사용하라. 시험 범위에 대한 단순 질문은 직접 응답 가능.

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-07-28 | 초기 구성 (에이전트 6, 스킬 6) | 전체 | - |
| 2026-07-28 | 코드 검증 증적 규칙·Keras 버전 표준·플레이스홀더 필드 정의·SVG 유니코드 규칙 추가 | skills/chapter-writing, aice-domain, diagram-style | 스모크 테스트 피드백 |
| 2026-07-31 | 시각화 범위에 boxplot 추가 | skills/aice-domain | 모의고사 QA H-2 (커리큘럼 허용 항목과 정합) |
| 2026-11-13 | v2.0 인터랙티브 계층 추가 — 정본은 `assets/`(JS·CSS 조각·JSON), 빌드가 `book/`·`docs/`로 배포. 명세 `_workspace/v2/SPEC.md`, 검증 `python3 scripts/v2/verify_all.py` | assets/, scripts/ebook/v2.py, scripts/v2/, skills/ebook-assembly | 14문항 CBT 체제 반영 (WORK_ORDER v2.0) |
