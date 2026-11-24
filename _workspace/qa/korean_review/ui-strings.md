# 한국어 교정 기록 — UI 문구(위젯 JS, 빌드 문자열, 부록 원고, 소형 데이터)

## 요약
- 읽은 범위: 위젯 JS 10개의 한국어 문자열 전부, scripts/ebook 5개 파일의 한국어 문자열 전부, appendix_memorize.py의 원고(INTRO·OUTRO·묶음별 flow/chant/why/task/values/fixed/recall, 규칙 label/hint), openbook_refs.json과 arch_patterns.json의 허용 필드 전부. README.md는 읽지 않고 편집하지 않음.
- 고친 곳: 19건 (은유·비유 4 / 광고 문구 1 / 번역투 0 / 낱말 6 / 문장 8)
- JS 10개 파일은 이미 평이한 UI 문구라 수정 0건(`node --check` 대상 없음). arch_patterns.json 수정 0건.

## 고친 곳
| 파일 | 위치 | 이전 | 이후 | 이유 |
|---|---|---|---|---|
| scripts/ebook/assemble.py | 챕터 접힘 summary | 지면판 확인 문제와 해설 보기 (v1 원문) | 확인 문제와 해설 보기 (이전 판 원문) | 낱말: "지면판", "v1"은 지어낸 내부 용어 |
| scripts/ebook/assemble.py | 모의고사 접힘 summary | 지면판 모의고사 보기 (v1 원문 12문항 · 데이터 생성 코드 · 해설) | 이전 판 모의고사 보기 (12문항 · 데이터 생성 코드 · 해설) | 낱말: 위와 같음 |
| scripts/ebook/v2.py | 실습 셀 noscript 안내 | 아래 지면판 확인 문제는 | 아래 확인 문제는 | 낱말: 위와 같음 |
| scripts/ebook/v2.py | 표지 도구 카드(치트시트) | …비교표, 빈출 에러 5선, 문항별 변수명·임포트 요약을 한 장에. | …비교표, 자주 만나는 에러 다섯 가지, 문항별 변수명과 임포트 요약을 한 장에 정리했습니다. | 광고 문구: "5선"과 문장이 끊긴 구호식 끝맺음. 부록 B 소개문(같은 파일)과 표현 통일 |
| appendix_memorize.py | C unit chant | 나누고 → 쪼개고 → 만들고 → 맞추고 → 따르고 | …맞추고 → 변환하고 | 낱말: "따르고"는 transform을 뜻하는지 알 수 없음 |
| appendix_memorize.py | B unit chant | (채우고, 자르고, 숫자로 바꾼다) | (채우고, 걸러 내고, 숫자로 바꾼다) | 낱말: 이상치 제거를 "자르고"로 쓰면 모호 |
| appendix_memorize.py | B unit why | 빈 값이 있으면 분위수 계산이 흔들리므로 결측치를 먼저 채웁니다. 행을 지우면 인덱스에 구멍이 생기니 바로 다시 매깁니다. | 결측치를 먼저 채워 두면 분위수 계산에 모든 행이 들어갑니다. 행을 지우면 인덱스에 빠진 번호가 생기므로 바로 다시 매깁니다. | 은유("흔들리다", "구멍"). 아래 보류 항목 참고 |
| appendix_memorize.py | C unit why | 평가 데이터로 기준을 잡으면 시험 문제를 미리 본 것과 같습니다. | 평가 데이터로 기준을 잡으면 평가 데이터의 정보가 학습에 들어가 성능이 실제보다 높게 나옵니다. | 비유가 정의를 대신함 |
| appendix_memorize.py | E unit why | 마지막 층이 문제 유형에 맞는 답의 모양을 만듭니다. | 마지막 층이 문제 유형에 맞는 출력 형태를 정합니다. | 낱말: "답의 모양" 모호 |
| appendix_memorize.py | F unit task | `es`는 `val_loss`를 보고 5번 참으며 가장 좋은 가중치로 되돌립니다. | `es`는 `val_loss`가 5 epoch 동안 나아지지 않으면 학습을 멈추고 가장 좋았던 가중치로 되돌립니다. | 은유("참으며")를 실제 동작으로 |
| appendix_memorize.py | F unit task | 검증 20%, 50 에포크, 배치 32로 학습해 | 검증 데이터 20%, `epochs` 50, `batch_size` 32로 학습해 | 용어 통일 규칙(§6): 에포크·배치 표기 금지 |
| appendix_memorize.py | G unit why | 그릴 선을 먼저 올리고 | 그릴 선을 먼저 지정하고 | 낱말: "올리고" 부적절 |
| appendix_memorize.py | H unit why | 한 건씩의 예측을 받아 정답과 같은 모양으로 바꾼 뒤 | 예측값을 구해 정답과 같은 형태로 바꾼 뒤 | 문장: 어색한 표현 |
| appendix_memorize.py | I unit why | 새 입력도 학습 데이터가 지나온 길을 똑같이 지나가야 합니다. | 새 입력도 학습 데이터와 같은 전처리 순서를 거쳐야 합니다. | 은유("길") |
| appendix_memorize.py | INTRO | 묶음마다 아래 순서로 직접 꺼내 보십시오. | …직접 떠올려 보십시오. | 낱말: "꺼내 보다" 비유 |
| assets/data/openbook_refs.json | entries[31] StandardScaler... MinMaxScaler `clip` desc | True 면 transform 결과를 범위 안으로 자름 | …범위 안의 값으로 제한 | 낱말: "자름" 모호 |
| 같은 파일 | entries[30] fit desc | 평균·표준편차를 배우고 변환 | 평균·표준편차를 계산하고 변환 | 은유("배우다") |
| 같은 파일 | entries[30] transform desc | 배운 값으로 변환만 (fit 금지) | 이미 계산한 값으로 변환만 (fit 금지) | 은유 |
| 같은 파일 | entries[32] LabelEncoder fit desc | 라벨을 배우고 정수로 변환 | 라벨 목록을 만들고 정수로 변환 | 은유 |
| 같은 파일 | entries[18] argmax summary | 예측 클래스를 뽑을 때 쓴다 | 예측 클래스를 구할 때 쓴다 | 낱말 |

(openbook_refs.json은 원래 끝 줄바꿈이 없어 그대로 유지. 변경 필드가 위 5곳뿐임을 구조 비교로 확인. `signature`·`import`·`snippet`·`name`·`module`·`keywords` 불변.)

## 다른 곳에서 참조되는 문자열
- 수정한 문자열 중 e2e, 검사 스크립트, JS가 찾는 것은 없음(`grep`으로 확인). 버튼 이름("시험 시작", "값 가리기" 등)과 grader-core 메시지는 건드리지 않음.

## 제목 수정 제안
없음.

## README 제안 (직접 고치지 않음)
README는 읽지 않았으므로 제안 없음.

## 판단 보류·내용 의심
- appendix B why: 원문은 "빈 값이 있으면 분위수 계산이 흔들린다"였으나 pandas `quantile`은 NaN을 건너뛰므로 사실과 다를 수 있음. 뜻을 바꾸지 않는 범위에서 "모든 행이 들어간다"로 다시 썼으니 출제 의도 확인 필요.
- appendix A why: "텐서플로를 첫 줄에 두면 일부 환경에서 학습 셀이 멈추는 문제를 피할 수 있습니다"는 근거를 확인하지 못해 그대로 둠.
- appendix D 제목 "머신러닝 모델 3줄"은 코드가 네 줄(만들기·fit·predict·점수)이라 불일치 가능. 제목이라 고치지 않음.
- appendix 코드 주석(F의 "몇 번 참을지", "묶음 크기" 등)에 비유가 남아 있음. 코드 문자열이라 범위 밖이므로 그대로 둠. 필요하면 "몇 epoch 동안 개선이 없으면 멈출지", "batch_size"로 바꾸면 좋음.
- 표지의 부제·콘셉트 문장은 `_workspace/01_curriculum.md`에서 오므로 이 작업 범위 밖.
