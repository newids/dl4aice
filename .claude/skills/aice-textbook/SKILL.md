---
name: aice-textbook
description: AICE Associate 딥러닝 교재(한국어, 도해 위주, 기출 유형 문제·해설 포함, HTML e-book) 제작 오케스트레이터. 교재 제작·집필·생성 요청뿐 아니라 후속 작업 — "다시 실행", "재실행", "업데이트", "수정", "보완", "챕터만 다시 써줘", "도해만 다시", "문제 추가", "모의고사 추가", "e-book 재빌드", "이전 결과 개선" — 에도 반드시 이 스킬을 사용할 것. 교재/책/ebook/전자책/수험서/기출/모의고사 관련 작업 요청이면 이 스킬이 담당한다.
---

# AICE 교재 제작 오케스트레이터

**실행 모드: 에이전트 팀** (챕터·도해·문제 간 실시간 조율이 품질을 좌우한다)

팀원 정의는 `.claude/agents/`의 6개 파일을 따른다:
curriculum-architect, chapter-writer, diagram-designer, exam-writer, tech-reviewer, ebook-builder.
모든 Agent/팀원 스폰 시 `model: "opus"`를 명시한다.

## Phase 0: 컨텍스트 확인 (항상 먼저)

`_workspace/` 존재 여부로 실행 모드를 결정한다:

| 상황 | 모드 | 행동 |
|------|------|------|
| `_workspace/` 없음 | **초기 실행** | Phase 1부터 전체 실행 |
| 있음 + 부분 수정 요청 ("3장만", "도해만", "재빌드") | **부분 재실행** | 해당 에이전트만 재호출 → 해당 챕터 QA → 재빌드 |
| 있음 + 새 입력/전면 개편 요청 | **새 실행** | 기존을 `_workspace_prev/`로 이동 후 전체 실행 |

부분 재실행 시에도 콘텐츠 변경이 있으면 tech-reviewer 검수와 ebook-builder 재빌드를 생략하지 않는다.

## 데이터 전달 프로토콜

- **태스크 기반** (TaskCreate/TaskUpdate): 챕터·도해·문제 단위 작업 할당과 의존 관계 관리
- **파일 기반**: 모든 산출물은 `_workspace/` 컨벤션 경로에 저장 (아래 구조). 최종본만 `book/`에 출력
- **메시지 기반** (SendMessage): 도해 요청, QA 지적, 용어 통일 등 실시간 조율

```
_workspace/
├── 01_curriculum.md          # curriculum-architect
├── chapters/ch{NN}.md        # chapter-writer
├── diagrams/{id}.svg         # diagram-designer (id = 플레이스홀더 id)
├── exams/ch{NN}_quiz.md, mock_exam_{N}.md   # exam-writer
└── qa/ch{NN}_report.md, final_report.md     # tech-reviewer
book/                          # ebook-builder (최종 산출물)
```

## 워크플로우

### Phase 1: 커리큘럼 설계
- curriculum-architect 단독 → `01_curriculum.md`
- 리더는 목차를 사용자에게 요약 보고 (승인 대기 없이 진행하되, 사용자가 실시간이면 확인 기회 제공)

### Phase 2: 콘텐츠 제작 (팀 병렬)
- TeamCreate: chapter-writer, diagram-designer, exam-writer (+ tech-reviewer)
- 챕터 단위 파이프라인: 챕터 초안 → 도해 요청(SendMessage) → 도해 제작 → 확인 문제 출제
- 여러 챕터를 병렬 진행하되, 팀원당 동시 작업 2개 이하로 태스크를 걸어준다
- 모의고사는 전체 챕터 완성 후 exam-writer가 작성 (범위 전체를 알아야 출제 가능)

### Phase 3: 검수 (incremental)
- tech-reviewer는 **각 챕터 완성 직후** 검수한다. 전체 완성 후 몰아서 하지 않는다
- CRITICAL/HIGH는 담당 에이전트에게 직접 전달 → 수정 → 재검수. 2회 재검수 실패 시 리더가 개입해 사용자에게 보고
- 전체 완성 후 final_report.md로 교차 정합성 최종 확인

### Phase 4: e-book 빌드
- QA 최종 통과 후에만 ebook-builder 호출 → `book/`
- 빌더의 자체 검증 결과(잔존 플레이스홀더, 링크)를 확인하고 사용자에게 최종 보고

### Phase 5: 마무리
- 팀 정리(TeamDelete). `_workspace/`는 보존한다 (부분 재실행·감사 추적용)
- 사용자에게 산출물 위치, 목차 요약, QA 요약을 보고하고 피드백 기회를 제공한다

## 에러 핸들링

- **에이전트 실패:** 1회 재시도. 재실패 시 해당 산출물 없이 진행하고 최종 보고에 누락을 명시한다
- **해답 코드 실행 실패:** exam-writer 규격대로 문제 제외 + 보고. 조용한 누락 금지
- **도해 누락 상태의 빌드:** 빌더가 "도해 누락" 박스로 렌더링하고 목록 보고 — 사용자 판단에 맡긴다
- **콘텐츠 상충** (본문 vs 문제 용어 불일치 등): 삭제하지 않고 tech-reviewer 리포트에 양쪽을 병기해 조정한다

## 테스트 시나리오

**정상 흐름:** "AICE 교재 만들어줘" → Phase 0(초기 판정) → 커리큘럼 → 챕터 3개+도해+문제 병렬 제작 → 챕터별 QA → 모의고사 → 최종 QA → 빌드 → `book/index.html` 열람 가능, 잔존 플레이스홀더 0건.

**에러 흐름:** 모의고사 해답 코드가 shape 오류로 실행 실패 → exam-writer 1회 수정 후 재실행 → 재실패 → 해당 문항 제외, 파일 하단에 제외 사유 기록 → 리더가 최종 보고에 "모의고사 1회분 13문항(1문항 제외)" 명시.

**부분 재실행 흐름:** "3장 도해가 복잡해, 단순하게 다시" → Phase 0(부분 재실행 판정) → diagram-designer만 재호출(해당 id들) → tech-reviewer가 3장만 재검수 → ebook-builder가 ch03.html만 재빌드.
