# 한국어 교정 기록 — mock_exams_14q.json

## 요약
- 읽은 범위: 전부. `parts[*].label`, 모의고사 3회의 `scenario`·`dataset.description`·`columns[*].desc`·`variables[*].role`, 42문항의 `title`·`prompt`·`explanation`·`validation_rules`(중첩 포함)의 `label`·`hint`, `negative_tests[*].reason`을 모두 읽음.
- 고친 곳: 78건 (은유·비유 31 / 광고 문구 0 / 번역투 2 / 낱말 41 / 문장 4)
  - mock01: 은유·비유 7 / 광고 문구 0 / 번역투 1 / 낱말 7 / 문장 1 (계 16)
  - mock02: 은유·비유 11 / 광고 문구 0 / 번역투 0 / 낱말 11 / 문장 2 (계 24)
  - mock03: 은유·비유 13 / 광고 문구 0 / 번역투 1 / 낱말 23 / 문장 1 (계 38)
- 검증: `node scripts/v2/test_grader.js assets/data/mock_exams_14q.json` → PASS, 42문항, 실패 0건. 원본과 프로그램으로 비교해 허용 필드(scenario, title 제외, prompt, explanation, label, hint, reason) 밖의 변경 0건.
- 한 곳이 여러 필드에 걸린 경우 필드별로 한 행씩 적었다(표의 건수는 필드 기준).

## 고친 곳
| 파일 | 위치 | 이전 | 이후 | 이유 |
|---|---|---|---|---|
| mock_exams_14q.json | mock01 시나리오 scenario | 공개된 출제 범위를 바탕으로 재구성한 기출 변형 문제이며 실제 기출 원문이 아니다 | 공개된 출제 범위를 바탕으로 새로 만든 문제이며 실제 시험 문제가 아니다 | [낱말] 이 교재의 문제는 기출이 아니므로 "기출 변형" 표현을 쓰지 않음(§1.4) |
| mock_exams_14q.json | mock01 Q1 explanation | 탐색의 첫 세트는 `shape`(규모), `head()`(값의 생김새) | 탐색의 첫 단계에서 쓰는 것은 `shape`(규모), `head()`(값의 모양) | [낱말] "첫 세트"는 낯선 표현 |
| mock_exams_14q.json | mock01 Q1 explanation | 탐색 출력이 곧 전처리 계획서입니다. | 탐색 출력을 보고 전처리 계획을 세웁니다. | [은유·비유] "계획서" 비유를 실제 동작으로 |
| mock_exams_14q.json | mock01 Q3 neg[2].reason | 가로로 누운 이상한 상자가 됨 | 가로 방향 상자그림이 됨 | [낱말] "누운 이상한 상자"는 구어적 비유 |
| mock_exams_14q.json | mock01 Q4 explanation | 평균이 큰 값에 끌려가지만 중앙값은 덜 영향받습니다 | 평균은 큰 값의 영향을 크게 받지만 중앙값은 덜 받습니다 | [은유·비유] "끌려간다" 의인 비유를 실제 뜻으로 |
| mock_exams_14q.json | mock01 Q6 explanation | 범주 하나하나를 0/1 열로 펼쳐 줍니다 | 범주마다 0/1 열을 하나씩 만듭니다 | [은유·비유] "펼쳐 준다" 비유를 실제 동작으로 |
| mock_exams_14q.json | mock01 Q8 explanation | 결정트리는 `max_depth` 를 제한하지 않으면 학습 데이터를 거의 외워 과적합합니다 | 의사결정나무는 `max_depth` 를 제한하지 않으면 학습 데이터에 지나치게 맞춰져 과적합이 됩니다 | [은유·비유] "외운다" 비유(§1.1 예시)를 풀고, 같은 모델을 같은 이름(의사결정나무)으로 통일 |
| mock_exams_14q.json | mock01 Q9 explanation | 전부 유지로 찍어도 | 모두 유지로 예측해도 | [낱말] "찍다"는 구어 |
| mock_exams_14q.json | mock01 Q11 explanation | 이진분류의 3종 세트는 | 이진분류의 기본 조합은 | [낱말] "3종 세트" 상품 광고식 표현 |
| mock_exams_14q.json | mock01 Q11 explanation | 항상 짝으로 움직이며, 한쪽만 바꾸면 에러 없이 학습이 망가지는 것이 가장 흔한 사고입니다 | 항상 함께 맞춰야 하며, 한쪽만 바꾸면 에러 없이 학습이 제대로 되지 않는 것이 가장 흔한 실수입니다 | [은유·비유] "짝으로 움직인다·망가진다·사고" 비유를 실제 뜻으로 |
| mock_exams_14q.json | mock01 Q11 rules[4].hint | 그 값을 0~1 로 눌러 주는 활성화 함수를 고르세요 | 그 값을 0~1 사이의 값으로 바꾸는 활성화 함수를 고르세요 | [은유·비유] "누른다" 비유(§1.1 예시) |
| mock_exams_14q.json | mock01 Q12 explanation | 최저점을 지나친 나쁜 상태의 모델이 남습니다 | 최저점을 지난 시점의, 성능이 나빠진 모델이 남습니다 | [문장] "지나친"(과도한)은 "지난"의 오용 |
| mock_exams_14q.json | mock01 Q12 explanation | 에러 없이 100 epoch 를 다 돕니다 | 에러 없이 100 epoch 를 끝까지 실행합니다 | [낱말] "돈다"는 구어 |
| mock_exams_14q.json | mock01 Q12 explanation | 방법도 동치입니다 | 방법도 같은 결과를 냅니다 | [낱말] "동치"는 수학 용어를 잘못 끌어온 표현 |
| mock_exams_14q.json | mock01 Q13 explanation | 네 키를 가진 딕셔너리이고 | 네 개의 키가 있는 딕셔너리이고 | [번역투] have 직역 "가진"(§1.3) |
| mock_exams_14q.json | mock01 Q14 explanation | 전처리 사슬**을 타야 합니다 | 전처리 순서**를 그대로 거쳐야 합니다 | [은유·비유] "사슬을 탄다" 비유를 실제 뜻으로 |
| mock_exams_14q.json | mock02 Q1 explanation | 은 정수가 아니라 문자열**( | 은 문자열**( | [문장] "A가 아니라 B" 대비 구문을 평서문으로(§1.5) |
| mock_exams_14q.json | mock02 Q1 explanation | 정수로 바꿔야 한다는 예고입니다 | 정수로 바꿔야 합니다 | [낱말] "예고입니다"는 뜻이 흐린 표현 |
| mock_exams_14q.json | mock02 Q1 explanation | 별칭을 멋대로 바꾸는 것 | 별칭을 임의로 바꾸는 것 | [낱말] "멋대로"는 구어 |
| mock_exams_14q.json | mock02 Q3 explanation | 서로 바꾸면 가로로 눕습니다 | 서로 바꾸면 가로 방향 상자그림이 됩니다 | [은유·비유] "눕는다" 비유를 실제 결과로 |
| mock_exams_14q.json | mock02 Q3 explanation | 해석이 흐려집니다 | 해석하기 어려워집니다 | [은유·비유] "흐려진다" 비유 |
| mock_exams_14q.json | mock02 Q3 explanation | 이상치 때문에 부풀려져 있을 수 있습니다 | 이상치 때문에 실제보다 크게 나올 수 있습니다 | [은유·비유] "부풀려진다" 비유 |
| mock_exams_14q.json | mock02 Q3 neg[0].reason | 범주 축이 y 로 감 | 범주가 y 축에 놓임 | [낱말] "y 로 감"은 구어 |
| mock_exams_14q.json | mock02 Q5 explanation | 경계값으로 눌러 주는 | 경계값으로 바꿔 주는 | [은유·비유] "누른다" 비유 |
| mock_exams_14q.json | mock02 Q5 explanation | 인덱스에 구멍이 생기지만 | 인덱스 번호가 중간에 비지만 | [은유·비유] "구멍" 비유 |
| mock_exams_14q.json | mock02 Q6 explanation | 로 쪼개는 것 | 로 나누는 것 | [낱말] "쪼개다"는 구어 |
| mock_exams_14q.json | mock02 Q6 rules[2].hint | `le` 에게 타깃 컬럼을 **학습과 변환을 한 번에** 시키는 메서드를 호출합니다 | `le` 로 타깃 컬럼의 **학습과 변환을 한 번에** 하는 메서드를 호출합니다 | [문장] 객체에게 "시키는" 의인 표현 |
| mock_exams_14q.json | mock02 Q7 explanation | 가장 흔한 누수 사고입니다 | 가장 흔한 누수 실수입니다 | [은유·비유] "사고" 비유 |
| mock_exams_14q.json | mock02 Q8 explanation | 학습 데이터를 거의 외워 버립니다 | 학습 데이터에 지나치게 맞춰집니다 | [은유·비유] "외운다" 비유(§1.1 예시) |
| mock_exams_14q.json | mock02 Q10 explanation | 어디에 견줘 평가할지 | 무엇과 비교해 평가할지 | [낱말] "견주다"는 예스러운 표현 |
| mock_exams_14q.json | mock02 Q10 explanation | 트리 계열이 매우 강합니다 | 트리 계열의 성능이 높은 경우가 많습니다 | [은유·비유] "강하다" 비유와 단정 |
| mock_exams_14q.json | mock02 Q11 explanation | 데이터가 바뀌어도 통하는 코드이기 때문입니다 | 데이터가 바뀌어도 그대로 쓸 수 있는 코드이기 때문입니다 | [낱말] "통하는 코드"는 모호 |
| mock_exams_14q.json | mock02 Q12 explanation | 복원하지 않으면 일부러 과적합된 가중치를 쓰는 셈입니다 | 복원하지 않으면 과적합이 시작된 뒤의 가중치를 그대로 쓰게 됩니다 | [은유·비유] "일부러…셈" 비유를 실제 동작으로 |
| mock_exams_14q.json | mock02 Q12 explanation | 검증으로 떼어 씁니다 | 검증으로 나누어 씁니다 | [낱말] "떼어 쓴다"는 구어 |
| mock_exams_14q.json | mock02 Q12 explanation | 를 다 돌아서 "왜 멈추지 않지" 하고 시간을 잃습니다 | 를 끝까지 실행해서 "왜 멈추지 않지" 하고 시간을 허비합니다 | [낱말] "다 돈다·시간을 잃는다" 구어 |
| mock_exams_14q.json | mock02 Q12 explanation | 그릴 재료가 사라집니다 | 그릴 자료가 없어집니다 | [낱말] "재료" 비유 |
| mock_exams_14q.json | mock02 Q12 rules[3].hint | 평가가 오염됩니다 | 평가 결과를 믿을 수 없게 됩니다 | [은유·비유] "오염" 비유를 실제 결과로 |
| mock_exams_14q.json | mock02 Q14 explanation | 값이 0 으로 무너지고 | 값이 모두 0 이 되고 | [은유·비유] "무너진다" 비유 |
| mock_exams_14q.json | mock02 Q14 explanation | 엉뚱한 특성에 들어갑니다 | 다른 특성에 들어갑니다 | [낱말] "엉뚱한"은 구어 |
| mock_exams_14q.json | mock02 Q14 explanation | 번호를 손으로 이름에 매핑하지 말고 | 번호를 직접 이름으로 바꿔 적지 말고 | [낱말] "손으로 매핑"은 어색한 혼용 |
| mock_exams_14q.json | mock03 Q2 explanation | 이상값 유무 | 이상치 유무 | [낱말] 같은 문서에서 이상치/이상값 혼용 → 이상치로 통일 |
| mock_exams_14q.json | mock03 Q2 explanation | 분포 모양이 뭉개지고 | 분포 모양을 알아보기 어렵고 | [은유·비유] "뭉개진다" 비유 |
| mock_exams_14q.json | mock03 Q4 explanation | 이상값 영향이 작음 | 이상치 영향이 작음 | [낱말] 이상치로 통일 |
| mock_exams_14q.json | mock03 Q4 explanation | `production_units` 이상값이 | `production_units` 이상치가 | [낱말] 이상치로 통일 |
| mock_exams_14q.json | mock03 Q4 explanation | 정보가 조용히 사라집니다 | 정보가 아무 경고 없이 사라집니다 | [은유·비유] "조용히" 의인 비유 |
| mock_exams_14q.json | mock03 Q5 explanation | 극단값에 덜 흔들립니다 | 극단값의 영향을 덜 받습니다 | [은유·비유] "흔들린다" 비유 |
| mock_exams_14q.json | mock03 Q7 explanation | 시험 문제를 미리 본 것과 같은 정보 누수가 됩니다 | 평가 정보가 학습 기준에 들어가는 정보 누수가 됩니다 | [은유·비유] 시험 문제 비유를 실제 뜻으로 |
| mock_exams_14q.json | mock03 Q7 explanation | 평균·표준편차를 배우고 | 평균·표준편차를 계산하고 | [은유·비유] 스케일러가 "배운다" 의인 표현 |
| mock_exams_14q.json | mock03 Q7 explanation | 순서를 바꾸면 조용히 엉뚱한 변수에 들어갑니다 | 순서를 바꾸면 오류 없이 다른 변수에 들어갑니다 | [낱말] "조용히 엉뚱한" 구어 |
| mock_exams_14q.json | mock03 Q7 rules[1].hint | 검증 비율은 20% | 테스트 비율은 20% | [낱말] 이 데이터 분리는 학습/테스트이므로 "검증" 혼용 제거(용어 통일) |
| mock_exams_14q.json | mock03 Q8 prompt | 결정 트리 회귀 모델로 | 의사결정나무 회귀 모델로 | [낱말] Q8~Q10 모의고사 1·2회와 같이 의사결정나무로 통일 |
| mock_exams_14q.json | mock03 Q8 explanation | 학습 데이터를 거의 외워 과적합합니다 | 학습 데이터에 지나치게 맞춰져 과적합이 됩니다 | [은유·비유] "외운다" 비유(§1.1 예시) |
| mock_exams_14q.json | mock03 Q9 prompt | 랜덤 포레스트 | 랜덤포레스트 | [낱말] 모의고사 1·2회 표기(랜덤포레스트)로 통일 |
| mock_exams_14q.json | mock03 Q9 explanation | 랜덤 포레스트 | 랜덤포레스트 | [낱말] 모의고사 1·2회 표기(랜덤포레스트)로 통일 |
| mock_exams_14q.json | mock03 Q9 rules[0].hint | 랜덤 포레스트 | 랜덤포레스트 | [낱말] 모의고사 1·2회 표기(랜덤포레스트)로 통일 |
| mock_exams_14q.json | mock03 Q9 explanation | 결과가 엉망이 됩니다 | 올바르지 않은 결과가 나옵니다 | [낱말] "엉망"은 구어 |
| mock_exams_14q.json | mock03 Q10 explanation | 랜덤 포레스트 | 랜덤포레스트 | [낱말] 랜덤포레스트로 통일 |
| mock_exams_14q.json | mock03 Q10 explanation | 평행하게 평균 내는 것과 달리 | 독립적으로 평균 내는 것과 달리 | [낱말] "평행하게"는 뜻이 다름(독립적으로) |
| mock_exams_14q.json | mock03 Q10 explanation | 딥러닝(Q11~)도 같은 수준을 노립니다 | 딥러닝(Q11~)도 비슷한 수준의 성능을 목표로 합니다 | [낱말] "노린다"는 구어 |
| mock_exams_14q.json | mock03 Q10 neg[0].reason | 복붙 실수 | 복사·붙여넣기 실수 | [낱말] "복붙"은 줄임말 |
| mock_exams_14q.json | mock03 Q11 explanation | 출력을 눌러 버리는 | 출력을 0~1 범위로 바꾸는 | [은유·비유] "누른다" 비유 |
| mock_exams_14q.json | mock03 Q11 explanation | `mse`(큰 오차에 더 큰 벌점) | `mse`(오차를 제곱하므로 큰 오차가 더 크게 반영됨) | [은유·비유] "벌점" 비유를 실제 계산으로 |
| mock_exams_14q.json | mock03 Q11 explanation | 동치인 **Sequential** 코드(같은 모델)는 다음과 같습니다. | 같은 모델을 **Sequential** 코드로 쓰면 다음과 같습니다. | [낱말] "동치인" |
| mock_exams_14q.json | mock03 Q11 explanation | 예측이 0~1 에 갇혀 | 예측이 0~1 범위로 제한되어 | [은유·비유] "갇힌다" 비유 |
| mock_exams_14q.json | mock03 Q11 neg[0].reason | 0~1로 눌림 | 0~1 범위로 제한됨 | [은유·비유] "눌림" 비유 |
| mock_exams_14q.json | mock03 Q12 prompt | 를 감시해 | 를 관찰해 | [낱말] 모의고사 1·2회의 "관찰"로 용어 통일 |
| mock_exams_14q.json | mock03 Q12 explanation | 학습을 끊어 과적합과 | 학습을 멈춰 과적합과 | [낱말] "끊어"는 구어 |
| mock_exams_14q.json | mock03 Q12 explanation | 갱신될 때마다만 | 갱신될 때만 | [문장] "마다만" 어색한 조사 연결 |
| mock_exams_14q.json | mock03 Q12 explanation | 회귀의 감시 지표는 | 회귀의 관찰 지표는 | [낱말] 관찰로 통일 |
| mock_exams_14q.json | mock03 Q12 explanation | 알아서 멈추므로 | 자동으로 멈추므로 | [낱말] "알아서"는 구어 |
| mock_exams_14q.json | mock03 Q12 explanation | 안에서 떼어 씁니다 | 안에서 나누어 씁니다 | [낱말] "떼어 쓴다" 구어 |
| mock_exams_14q.json | mock03 Q12 rules[0].hint | 감시 지표는 검증 손실, 인내 횟수는 3~30 정수 | 관찰 지표는 검증 손실, 기다리는 횟수(`patience`)는 3~30 정수 | [낱말] "감시·인내 횟수"는 지어낸 말 |
| mock_exams_14q.json | mock03 Q12 neg[0].reason | val_accuracy 감시 | val_accuracy 관찰 | [낱말] 관찰로 통일 |
| mock_exams_14q.json | mock03 Q13 explanation | 복붙하면 | 복사해 붙이면 | [낱말] "복붙" 줄임말 |
| mock_exams_14q.json | mock03 Q14 explanation | 이 함정은 에러 없이 | 이 실수는 에러 없이 | [은유·비유] "함정" 비유 |
| mock_exams_14q.json | mock03 Q14 explanation | 라인 A(기준)로 오해합니다 | 라인 A(기준)로 처리합니다 | [은유·비유] 모델이 "오해한다" 의인 표현 |
| mock_exams_14q.json | mock03 Q14 explanation | 스케일러는 **학습 데이터 기준**의 평균·표준편차를 이미 갖고 있습니다. | 스케일러에는 **학습 데이터 기준**의 평균·표준편차가 이미 저장되어 있습니다. | [번역투] have 직역 "갖고 있습니다" |
| mock_exams_14q.json | mock03 Q14 neg[0].reason | 새로 배워 모든 특성이 0 이 됨 | 새로 계산해 모든 특성이 0 이 됨 | [은유·비유] "배운다" 의인 |

## 제목 수정 제안 (직접 고치지 않음)
| 파일 | 현재 제목 | 제안 | 이유 |
|---|---|---|---|
| mock_exams_14q.json | 실전 모의고사 3회 — 회귀: 스마트팩토리 전력 에너지 소비량 예측 | 실전 모의고사 3회 — 회귀: 스마트팩토리 에너지 소비량 예측 | "전력 에너지"는 겹치는 말(타깃은 kWh 단위 에너지 소비량). 다만 의미가 통하므로 선택 사항 |

## 판단 보류·내용 의심
- 프롬프트 문체: 모의고사 2·3회 일부 프롬프트는 "~하시오"와 "~합니다/~이다"가 한 문항 안에 섞여 있다(예: mock02 Q3 "배치합니다", mock03 Q6 "두 컬럼이다"). 지시문과 상황 설명이 섞인 구성이라 요구사항 문장을 건드리지 않고 그대로 두었다.
- mock03 Q3·Q4·Q5 등 중첩 규칙 일부는 `label`·`hint`가 빈 문자열이다. 채점에 영향이 없고 고칠 문장이 없어 그대로 둠.
- mock03 Q4 해설 "데이터의 약 6% 를 잃습니다"와 시나리오의 결측 비율(각 약 3%) 정합은 기술 내용이라 확인하지 않고 둠.
- mock02 Q10 해설의 accuracy 0.77~0.79, macro F1 0.70~0.72 수치와 mock02 Q11 NEG의 "3,000여 행"은 실제 실행값과 맞는지 확인하지 않았다(본 작업 범위 밖).
- mock03 Q14 해설 "`squared=False` 옵션은 최신 scikit-learn 에서 제거"는 버전 의존 기술 주장이라 그대로 둠.
- 비유로 보이나 "스케일러가 컬럼 이름과 순서를 기억합니다"(mock01 Q14, mock02 Q14)는 `feature_names_in_` 속성 저장을 뜻하는 관용적 표현이라 그대로 둠.
- 제목의 "(Simulation Input)"(mock01 Q14)은 시험 용어 영문 병기라 그대로 둠.
