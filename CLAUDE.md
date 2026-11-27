# dl4aice

## 하네스: AICE Associate 딥러닝 교재 제작

**목표:** AICE Associate 수험 수준의 딥러닝 교재를 한국어·도해 위주로 집필하고, 기출 유형 문제·해설을 포함한 HTML e-book으로 산출한다.

**트리거:** 교재 제작/수정/재빌드 등 콘텐츠 작업 요청 시 `aice-textbook` 스킬을 사용하라. 시험 범위에 대한 단순 질문은 직접 응답 가능.

## 문구 금지 규칙 (사용자 지시, 2026-11-13 — 예외 없음)

- **광고 카피식 문구를 쓰지 않는다.** "도해로 익히고 코드로 끝낸다", "순서가 곧 점수다", "위치가 전부입니다"처럼 대구를 맞춘 구호, 단정적인 캐치프레이즈, 과장된 수식은 한국어 화자가 평소 쓰지 않는 옛 광고 말투다. 제목·부제·소제목·UI 문구·해설 어디에도 쓰지 않는다. 무엇을 다루는지 그대로 적는 평범한 설명문으로 쓴다(예: "분리한 뒤에 스케일링한다", "어디에 놓는가").
- 글을 쓰거나 서브에이전트에게 집필·출제·UI 문구 작업을 맡길 때 이 규칙을 지시문에 반드시 포함한다.

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
| 2026-11-13 | 광고 카피식 문구 금지 규칙 추가. 교재 제목의 구호 삭제, 부제·콘셉트 문장과 소제목 3곳(2.7, 4.6, 7.4) 평서문으로 수정 | CLAUDE.md, 01_curriculum.md, chapters/ch02·04·07, skills/chapter-writing, exam-authoring | 사용자 지시 |
| 2026-11-13 | 부록 `appendix.html`(외워야 하는 코드 3단 분해: 흐름·줄·값) 추가. 원고 정본은 `scripts/v2/appendix_memorize.py`, `--verify`로 실린 코드 실제 실행 | scripts/v2, _workspace/pages, assets/css/_parts/55-appendix.css | 사용자 요청 |
| 2026-11-13 | 부록에 기억 연습 추가(순서의 이유, 값·줄 가리기, 보지 않고 써 보기 + 정적 채점, 1·3·7·14·30일 간격 복습). 전체 목차에 "부록" 묶음(A 외워야 하는 코드, B 치트시트) 추가, 이전/다음 내비게이션 연결 | scripts/v2/appendix_memorize.py, assets/js/appendix.js, assets/data/appendix_units.json, scripts/ebook | 사용자 요청 |
| 2026-11-22 | 그룹 스터디 발표 자료 `study/`(회차별 11개, 발표 30~40분 + 질의응답 20분) 추가, 형식 검사 `scripts/v2/check_study.py`. 교재 본문의 과장 문장 3곳(Ch05, Ch08) 평서문으로 수정 | study/, scripts/v2, chapters/ch05·08 | 사용자 요청 |
| 2026-11-22 | 스터디 발표 자료의 HTML 슬라이드판 추가(`study/html/`, 한 장씩 넘김·타이머·목록). 생성 `scripts/v2/build_study_slides.py`, 빌드가 `book/study/`·`docs/study/`로 배포 | study/html, scripts/v2, scripts/ebook/v2.py | 사용자 요청 |
| 2026-11-24 | 한국어 교정 스킬 `korean-proofreading` 추가, 프로젝트 전체 교정(풀이 없는 비유·의인화, 구호식 문구, 번역투, 뜻이 통하지 않는 낱말). 제목 6곳 변경(ch02 2.5, ch05 2절, ch06 6.1, ch08 8.5, 모의고사 1·2회 정리 절), 교정 기록 `_workspace/qa/korean_review/` | skills/korean-proofreading, chapters, exams, pages, study, assets/data, scripts/ebook, scripts/v2 | 사용자 요청 |
| 2026-11-24 | Ch03에 3.7절 "값을 바꿔 가며 확인하기" 추가(뉴런 계산, 활성화 함수, 층, 예측과 학습을 직접 움직여 보는 그림 다섯 개). 자리표시 `<!-- WIDGET: neuron -->`, 본문 조각 `_workspace/widgets/neuron.html`, 스크립트 `assets/js/neuron.js`, 스타일 `assets/css/_parts/58-neuron.css` | chapters/ch03, _workspace/widgets, assets/js, assets/css/_parts, scripts/ebook | 사용자 요청 |
| 2026-11-25 | 외부 스킬 `humanize-korean`(epoko77-ai/im-not-ai v2.4.8)의 점수 스크립트로 한국어 재검증. 34개 문서 모두 위험도 low, 스크립트가 짚은 36곳(짚다·매끄럽게·갈리다, 분열문, "~이유입니다" 결말) 수정. 기록 `_workspace/qa/korean_review/humanize-korean.md` | chapters, exams, study, assets/data, _workspace/widgets | 사용자 요청 |
| 2026-11-27 | "문제 유형 × API 코드 비교" 위젯을 한 화면에 들어오게 다시 짬(선택 줄을 화면 위에 고정, 달라지는 줄만 보기 기본·"전체 코드" 버튼, 핵심 값은 접이식, 코드 높이를 화면에 맞춤). 페이지를 열거나 새로 고치면 맨 위에서 시작(브라우저 자동 위치 복원 끔, #앵커 이동은 유지) | assets/js/arch-switcher.js, assets/css/_parts/10-arch.css, assets/js/dl4aice-core.js | 사용자 요청 |
