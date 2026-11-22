# 그룹 스터디 발표 자료

『AICE Associate 딥러닝 실전 교본』을 함께 공부하는 스터디의 회차별 발표 자료입니다. 한 회차에 챕터 하나 또는 모의고사 한 회분을 다룹니다.

- 발표 30~40분, 질의응답 20분 (한 회차 약 1시간)
- 교재 사이트: https://newids.github.io/dl4aice/

## 회차 구성

| 회차 | 자료 | 다루는 내용 | 교재 |
|---|---|---|---|
| 1 | [01-ch01.md](01-ch01.md) | 시험 구조와 학습 지도 | [Ch01](https://newids.github.io/dl4aice/ch01.html) |
| 2 | [02-ch02.md](02-ch02.md) | 데이터 준비와 머신러닝 | [Ch02](https://newids.github.io/dl4aice/ch02.html) |
| 3 | [03-ch03.md](03-ch03.md) | 딥러닝은 어떻게 배우는가 | [Ch03](https://newids.github.io/dl4aice/ch03.html) |
| 4 | [04-ch04.md](04-ch04.md) | Keras로 모델 만들기 | [Ch04](https://newids.github.io/dl4aice/ch04.html) |
| 5 | [05-ch05.md](05-ch05.md) | 컴파일과 학습 | [Ch05](https://newids.github.io/dl4aice/ch05.html) |
| 6 | [06-ch06.md](06-ch06.md) | 과적합 진단과 대응 | [Ch06](https://newids.github.io/dl4aice/ch06.html) |
| 7 | [07-ch07.md](07-ch07.md) | 평가와 예측 | [Ch07](https://newids.github.io/dl4aice/ch07.html) |
| 8 | [08-ch08.md](08-ch08.md) | 문제 유형별 완성 코드와 시험장 전략 | [Ch08](https://newids.github.io/dl4aice/ch08.html) |
| 9 | [09-mock01.md](09-mock01.md) | 모의고사 1회 리뷰 (이진분류) | [모의고사 1회](https://newids.github.io/dl4aice/mock01.html) |
| 10 | [10-mock02.md](10-mock02.md) | 모의고사 2회 리뷰 (다중분류) | [모의고사 2회](https://newids.github.io/dl4aice/mock02.html) |
| 11 | [11-mock03.md](11-mock03.md) | 모의고사 3회 리뷰 (회귀) | [모의고사 3회](https://newids.github.io/dl4aice/mock03.html) |

## 발표 진행 방법

1. **참가자 사전 준비.** 챕터 회차는 해당 챕터를 읽고 실습 셀을 풀어 옵니다. 모의고사 회차는 90분 타이머로 직접 풀고 점수와 틀린 문항을 적어 옵니다.
2. **발표 (30~40분).** 발표자는 자료의 슬라이드를 순서대로 진행합니다. 슬라이드마다 권장 시간이 적혀 있습니다. "함께 풀기" 슬라이드에서는 교재 사이트의 실습 셀이나 모의고사 화면을 직접 띄워 풉니다.
3. **질의응답 (20분).** 자료 끝의 "토론 질문"을 먼저 던지고, 나온 질문은 "예상 질문과 답"을 참고해 답합니다. 답하지 못한 질문은 다음 회차 시작 때 확인합니다.

## 자료를 화면에 띄우는 방법

- **한 장씩 넘기는 HTML 슬라이드 (권장):** https://newids.github.io/dl4aice/study/ 에서 회차를 고르거나, 저장소를 받았다면 `study/html/index.html`을 브라우저로 엽니다. 설치할 것이 없고 인터넷 없이도 열립니다.
  - `→` 또는 `Space`로 다음, `←`로 이전, `Home`/`End`로 처음과 끝
  - `O` 슬라이드 목록, `F` 전체 화면, `T` 밝게/어둡게, `R` 타이머 초기화
  - 아래쪽 타이머는 처음 넘길 때 시작하고, 계획한 발표 시간을 넘기면 빨갛게 바뀝니다.
  - 브라우저의 인쇄 기능으로 한 장에 한 슬라이드씩 PDF로 저장할 수 있습니다.
- **GitHub에서 그대로 보기:** 마크다운 파일을 열고 화면을 공유한 채 스크롤합니다.
- **슬라이드로 보기:** [Marp](https://marp.app/)를 지원하는 편집기(VS Code의 Marp 확장 등)에서 파일을 열면 한 장씩 넘기는 슬라이드로 보입니다. PDF로 내보낼 수도 있습니다.

마크다운이 원본이고 HTML은 거기서 만든 결과물입니다. 내용을 고칠 때는 마크다운을 고친 뒤 아래 명령으로 HTML을 다시 만듭니다.

```bash
python3 scripts/v2/build_study_slides.py
```

도해는 저장소의 `_workspace/diagrams/` 파일을 그대로 참조합니다.

## 자료 형식

모든 회차 자료는 같은 순서를 따릅니다.

1. 제목 — 회차, 다루는 범위, 전체 시간
2. 오늘의 목표 — 세 가지 이내
3. 진행 순서 — 구간별 시간 배분
4. 본문 — 개념, 도해, 코드, 자주 틀리는 지점
5. 함께 풀기 — 교재의 실습 셀 또는 모의고사 문항
6. 정리 — 꼭 기억할 내용
7. 다음 회차 준비
8. 토론 질문 — 질의응답을 여는 질문 세 개
9. 예상 질문과 답 — 다섯 개 이상

형식 검사는 아래 명령으로 합니다.

```bash
python3 scripts/v2/check_study.py
```

## 유의사항

이 자료와 교재는 Claude Code가 제작했으며, AI 전문가나 AICE 자격증 보유자의 검수를 거치지 않은 비공인 학습 자료입니다. 문항 수와 배점, 오픈북 정책은 회차마다 달라질 수 있으니 응시 전에 KT AICE 공식 공지를 확인하십시오.
