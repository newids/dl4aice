# 공식 샘플 문항 형식 모의고사 (4~6회) 작성 명세

AICE 공식 홈페이지의 Associate 샘플 문항 2종(회귀 1, 이진분류 1)의 **형식**을 따르는 모의고사다.
문항과 데이터는 모두 새로 만든다. 샘플 문항의 지문·데이터·도메인을 옮겨 쓰지 않는다(샘플은 무단 복제·공유를 금지한다).

데이터 스키마와 채점 규칙 문법은 `_workspace/v2/SPEC.md` §2, §4 와 같다. 아래는 4~6회에만 해당하는 차이다.

## 1. 회차

| id | 유형 | 주제 | 파일(작성 단계) |
|----|------|------|----------------|
| mock04 | 회귀 | 배달 앱 주문 데이터로 배달 소요 시간(분) 예측 | `_workspace/v2/mocks_official/mock04.json` |
| mock05 | 이진분류 | 호텔 예약 데이터로 예약 취소 여부(Canceled / Kept) 예측 | `_workspace/v2/mocks_official/mock05.json` |
| mock06 | 다중분류 | 사과 선별 데이터로 품질 등급(A / B / C) 예측 | `_workspace/v2/mocks_official/mock06.json` |

작성 단계에서는 회차 하나를 JSON 객체 하나(파일 하나)로 쓴다. 검증이 끝나면 `assets/data/mock_exams_14q.json` 의 `exams` 에 합친다.

## 2. 회차 객체에 추가되는 필드

```json
{
  "id": "mock04",
  "title": "실전 모의고사 4회 — 회귀: 배달 소요 시간 예측 (공식 샘플 형식)",
  "format": "official_sample",
  "task_type": "regression",
  "parts": [
    { "id": "analysis",   "label": "데이터 분석 (20점)",   "questions": [1, 2, 3, 4] },
    { "id": "preprocess", "label": "데이터 전처리 (30점)", "questions": [5, 6, 7, 8, 9] },
    { "id": "modeling",   "label": "AI 모델링 (50점)",     "questions": [10, 11, 12, 13, 14] }
  ],
  "scenario": "...", "dataset": { ... }, "variables": [ ... ], "questions": [ ... 14개 ... ]
}
```

- `scenario`: 공식 샘플처럼 "도메인 / 목표 / 배경 2~3문장". 평범한 설명문으로 쓴다.
- `dataset.setup_code`: `np.random.default_rng(42)` 로 CSV 를 만드는 코드. 2,000~4,000행. 결측치, 이상치, 문자열 컬럼(범주형 2개 이상), 예측에 쓰지 않는 식별자 컬럼을 넣는다. 타깃과 특성 사이에 실제 관계가 있어야 한다(모델이 학습되어야 함).
- 문항 `part` 는 위 세 id 중 하나.

## 3. 문항 14개의 구성과 배점 (세 회차 공통, 합계 100)

| no | part | 내용 | points | style |
|----|------|------|--------|-------|
| 1 | analysis | 라이브러리를 지정한 별칭으로 불러오기 | 3 | write |
| 2 | analysis | CSV 를 읽어 지정한 변수명에 담고 앞 n행 출력 | 4 | write |
| 3 | analysis | seaborn 시각화 ① + 출력에서 읽은 값을 `답안3` 에 저장 | 6 | 회차마다 다르게 |
| 4 | analysis | seaborn 시각화 ② (`jointplot`, `boxplot`, `heatmap`, `histplot`, `scatterplot` 중) | 7 | write |
| 5 | preprocess | 이상치 행 삭제 + 불필요 컬럼 삭제 → 새 변수명 | 6 | 회차마다 다르게 |
| 6 | preprocess | 결측치 개수 확인 + 처리 → 새 변수명 (+ `답안6`) | 6 | 회차마다 다르게 |
| 7 | preprocess | 원-핫 인코딩(`pd.get_dummies`) → 새 변수명 | 6 | blank 또는 fix |
| 8 | preprocess | X·y 분리 + `train_test_split` (`X_train, X_valid, y_train, y_valid`) | 6 | write |
| 9 | preprocess | 스케일링 오류 정정 + `답안9` | 6 | fix |
| 10 | modeling | 머신러닝 모델 2종(의사결정나무, 랜덤포레스트). 한 회차는 `GridSearchCV` 사용 | 10 | write |
| 11 | modeling | 랜덤포레스트 변수 중요도 상위 10개 막대 그래프 + `답안11` | 8 | fix |
| 12 | modeling | 두 모델의 검증 성능 계산·비교 + `답안12` | 8 | fix |
| 13 | modeling | 딥러닝 모델 구성·컴파일·학습 (층 구성은 지문에 제시) | 14 | write 또는 blank |
| 14 | modeling | 학습 곡선 시각화 + `답안14_1`, `답안14_2` | 10 | blank |

- 세 회차에서 style 이 겹치지 않게 섞는다. 회차마다 write / fix / blank 가 각각 4문항 이상 나오게 한다.
- 공식 샘플은 한 문항이 10-1, 10-2 처럼 나뉘기도 한다. 여기서는 **문항 하나(셀 하나)에 합치고** 지문에서 "(10-1)", "(10-2)" 로 구분한다.
- 변수 이름은 회차마다 다르게 정한다(공식 샘플도 `df`/`data`, `df_temp`/`data_temp` 처럼 바뀐다). 예: `df → df_temp → df_na → df_preset`. 지문에 변수명을 명시하고 규칙의 `assign` 으로 검증한다.
- 검증용 데이터 이름은 `X_valid`, `y_valid` 를 쓴다(공식 샘플 표기).

### style 별 skeleton_code

- `"style": "write"`: 첫 줄이 `# [N번 문항] 여기에 답안코드를 작성하고 실행하세요.` 인 주석뿐인 셀. 빈칸 `___` 없음.
- `"style": "fix"`: 첫 줄이 `# [N번 문항] 아래의 코드를 정정하고 실행하세요.` 이고, 그 아래에 **오류가 2~4곳 있는 코드**. 오류는 실제 수험생이 틀리는 것으로 한다(없는 함수·속성 이름, `fit_transform` 과 `transform` 혼동, 학습용·검증용 데이터 혼동, `axis` 값, 정답과 예측의 변수 혼동 등). 빈칸 `___` 없음. 주어진 코드 그대로는 채점에서 오답이어야 한다.
- `"style": "blank"`: 첫 줄이 `# [N번 문항] 아래 코드의 빈칸을 채우고 실행하세요.` 이고 빈칸은 `___`. 빈칸 번호는 줄 끝 주석으로 적는다(예: `fig, axes = plt.___(nrows=1, ncols=2)  # blank3-1`). 같은 번호의 빈칸이 여러 곳에 나올 수 있다.

### `답안N` 변수

- 공식 샘플처럼 "빈칸에 들어갈 내용" 또는 "출력에서 읽은 값"을 `답안N` 변수에 저장하게 한다. 예: `답안7_1 = 'get_dummies'`, `답안9 = 6`, `답안12 = 'RandomForest'`.
- 이 사이트는 코드를 실행하지 않는다. 그래서 **출력을 봐야 정할 수 있는 값은 지문에 실행 결과를 싣는다.** 지문 끝에 "이 셀을 올바르게 실행하면 다음과 같이 출력됩니다." 와 함께 실제 출력(코드 펜스)을 넣고, 수험생이 거기서 값을 읽게 한다. 그래프는 글로 옮긴다(막대별 개수 표 등).
- 실행 결과에 따라 정해지는 `답안N` 은 문항에 `check_code` 를 둔다. `run_mock_answers.py` 가 모범 답안 바로 뒤에서 실행한다.

```json
"check_code": "assert 답안9 == int(round(np.max(X_valid))), (답안9, np.max(X_valid))"
```

- 딥러닝 학습 결과(loss 값, 멈춘 epoch 등)는 실행마다 달라지므로 `답안N` 으로 묻지 않는다.

### 시험지가 제공하는 셀 (`given_code`)

공식 샘플은 문항 사이에 "다음 문항을 풀기 전에 아래 코드를 실행하세요" 셀을 둔다(numpy·seaborn·matplotlib 임포트, 한글 글꼴 설정, tensorflow 임포트).
그 코드를 다음 문항의 `given_code` 필드에 넣고, 같은 코드를 그 문항 `prompt` 맨 앞에 "다음 코드는 이미 실행되어 있습니다."라는 문장과 함께 코드 펜스로 보여 준다.

- 2번 문항: numpy, seaborn, matplotlib 등 임포트(1번에서 불러오게 한 라이브러리는 제외). 글꼴 설정은 넣지 않는다.
- 10번 문항: 필요하면 sklearn 임포트.
- 13번 문항: tensorflow 임포트(`Sequential`, `Input`, `Dense`, `Dropout`, `EarlyStopping` 등)와 `tf.keras.utils.set_random_seed(42)`.

### 13번 (딥러닝)

- 공식 샘플은 그림(토폴로지)으로 층 구성을 준다. 여기서는 지문에 글로 준다. 예:

```
입력(특성 수) → Dense 64 (selu) → Dropout 0.1 → Dense 32 (selu) → Dense 16 (selu) → 출력 Dense 1 (linear)
```

- 지문이 정하는 것: 은닉층과 출력층의 activation, `EarlyStopping` 의 `monitor` 와 `patience`(변수명 지정), optimizer·loss·metrics, `batch_size`, `epochs`(30 이하), `validation_data=(X_valid, y_valid)`, 학습 기록 변수 `history`. "안내된 내용 외의 인자는 넣지 않는다"는 조건도 둔다.
- 입력은 이 교재 표준대로 `Input(shape=(X_train.shape[1],))` 를 모범 답안으로 쓴다. 채점 규칙은 `Dense(..., input_dim=...)` 과 `input_shape=(...)` 도 `any` 로 인정한다(공식 샘플 코드는 `input_dim` 을 쓴다). 해설에 이 점을 한 줄로 적는다.
- 유형별 출력층과 손실은 이 교재의 기준을 따른다: 회귀 `Dense(1)` 또는 `activation='linear'` + `mse`, 이진분류 `Dense(1, activation='sigmoid')` + `binary_crossentropy`, 다중분류 `Dense(K, activation='softmax')` + (`sparse_`)`categorical_crossentropy`.
  - 문자열 타깃은 13번 안에서 `LabelEncoder` 로 정수로 바꾸게 한다(공식 샘플 방식). 다중분류 한 회차는 `to_categorical` 로 원-핫까지 바꾸고 `categorical_crossentropy` 를 쓰게 해도 된다.
- 검증 실행은 `epochs` 를 3으로 줄여 돌린다(자동). 원래 epochs 로도 한 번 돌려 `expected_output` 에 실제 출력을 발췌해 넣는다.

### 14번 (학습 곡선)

`history.history[...]` 의 키, `plt.legend`/`title`/`xlabel`/`ylabel`, `plt.plot` 중 2~3곳을 빈칸으로 한다. 빈칸에 들어갈 말을 `답안14_1`, `답안14_2` 에도 문자열로 저장하게 한다.

## 4. 모든 문항에 필요한 필드

`no, part, title, points, minutes, style, prompt, skeleton_code, answer_code, validation_rules, negative_tests, expected_output, explanation` (+ 필요하면 `given_code`, `check_code`).

- `minutes` 합계는 85~90.
- `validation_rules`: 지문의 요구사항마다 규칙 하나 이상. 지정 변수명은 `assign` 으로 검증. 동치 표현은 대안으로 허용(`axis=1` 과 `columns=`, `'mse'` 와 `'mean_squared_error'`, `isnull` 과 `isna` 등). `답안N` 은 `{"type":"assign","var":"답안9","contains":"6"}` 처럼 검증한다.
- `negative_tests`: 문항당 2개 이상. fix 문항은 "일부만 고친 코드"를 반드시 포함한다.
- `expected_output`: 모범 답안을 실제로 실행한 출력(길면 발췌).
- `explanation`: "**왜 이렇게 푸는가**"와 "**자주 틀리는 지점**". fix 문항은 어디가 왜 틀렸는지 줄마다 적는다.

## 5. 문체 (예외 없음)

- 지문은 "~하세요" 체(공식 샘플 문체), 해설은 "~합니다" 체.
- 광고 문구처럼 대구를 맞춘 구호, 단정적인 구호, 과장된 수식을 쓰지 않는다.
- 풀이 없는 비유와 의인화를 쓰지 않는다("눌러 준다", "외운다", "범인", "함정", "짚다" 등). 실제로 일어나는 계산과 동작을 그대로 적는다.
- "필요한 것은 ~입니다", "~하는 이유입니다" 같은 문장 틀 대신 주어와 서술어를 바로 잇는다.
- 기준: `.claude/skills/korean-proofreading/SKILL.md`.

## 6. 검증 (전부 통과해야 완료)

```bash
node scripts/v2/test_grader.js _workspace/v2/mocks_official/mock04.json
python3 scripts/v2/run_mock_answers.py _workspace/v2/mocks_official/mock04.json
python3 scripts/v2/run_mock_answers.py _workspace/v2/mocks_official/mock04.json --full   # expected_output 을 얻을 때
```

- `test_grader.js`: 모범 답안 통과, 따옴표·공백·인자 순서를 바꾼 변형 통과, 처음 주어진 코드 오답, negative_tests 전부 오답.
- `run_mock_answers.py`: `setup_code` → 문항마다 `given_code` → `answer_code` → `check_code` 순서로 이어 붙여 실제 실행. 오류 0.
- 지문에 실은 "실행 결과"는 실제 실행 출력과 같아야 한다.
