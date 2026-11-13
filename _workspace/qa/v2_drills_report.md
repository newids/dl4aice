# v2 챕터 실습 셀 · 아키텍처 패턴 · ch02 §2.10 · ch01 콜아웃 · 치트시트 QA 리포트

- 검수일: 2026-11-13 / 환경: Python 3.13.18, TensorFlow 2.21.0, Keras 3.15.1, pandas 3.0.5, scikit-learn 1.9.1
- 방법: 채점기 `assets/js/grader-core.js` 를 Node 로 직접 호출해 변형 답안을 넣어 봄(프로브). 모범 답안 42개는 전부 실제로 실행해 `expected_output` 과 비교함. §2.10 코드 블록 8개는 순서대로 이어서 실행함. 치트시트의 에러 메시지는 재현해 봄.
- 자동 검사(모범 답안 통과, skeleton·negative 오답 판정)는 다시 하지 않았다.

## 0. 요약

| 영역 | CRITICAL | HIGH | MEDIUM | LOW |
|------|---------:|-----:|-------:|----:|
| chapter_drills.json (42문항) | 4 | 2 | 14 | 8 |
| arch_patterns.json | 0 | 0 | 1 | 2 |
| ch02 §2.10 / ch01 콜아웃 | 0 | 0 | 0 | 2 |
| cheatsheet.html | 1 | 1 | 0 | 2 |
| **합계** | **5** | **3** | **15** | **14** |

긍정적 확인 사항
- 모범 답안 42개를 실제로 실행한 결과가 `expected_output` 과 **42/42 완전히 일치**한다.
- §2.10 블록 8개를 순서대로 실행했고, 본문의 "출력 요지"가 모두 일치한다(`(997, 4) 188`, `Invalid dtype: object`, `(285, 285)`, `float32 (950, 5) (950,)`, 5줄 점검 `2 [0, 1]` 등).
- 치트시트 에러 카드 1·2·4·5의 메시지 원문은 이 환경에서 그대로 재현된다(`Did you mean 'metrics'?` 포함).
- 시험 형식 서술(14문항, 90분, 80점 합격, Q1–3 / Q4–7 / Q8–10 / Q11–13 / Q14)은 ch01 콜아웃, §2.10, 치트시트, SPEC §4 사이에서 서로 일치한다. ch01 콜아웃과 치트시트에는 변동 가능 단서가 있다. KT AICE 공식 사이트(aice.study)는 프록시가 403으로 막아 **공지 원문과는 대조하지 못했다**. 특히 "제한적 오픈북" 서술은 확인하지 못했다.
- ch03 실습은 Keras를 쓰지 않는다. ch04 실습은 compile/fit을 쓰지 않는다. 모든 실습이 `input_shape` 를 쓰지 않으며, 저장은 `.keras` 다. 범위 밖 내용은 없다.
- Sequential과 Functional 버전은 4개 유형 모두에서 같은 층 구성(Input → Dense64 relu → Dense32 relu → 출력층)과 같은 compile을 쓰는 동치 모델이다.

---

## 1. CRITICAL

### C-1. ch04-q5 — 올바른 `shape` 값 `X_train.shape[1:]`, `(X_train.shape[-1],)` 를 거부함
- 위치: `ch04-q5.validation_rules[0]`
- 문제: 지문은 "특성 수만 담긴 원소 하나짜리 튜플"을 요구한다. `X_train.shape[1:]` 는 정확히 `(8,)` 이고 Keras에서 가장 흔한 관용구다. `(X_train.shape[-1],)` 도 정답인데, ch04-q1과 q3는 `shape[-1]` 을 인정하면서 q5만 거부한다. ch04-q1의 두 번째 빈칸 `(X_train.shape[-1],)` 도 거부된다.
- 증거: 프로브 결과 `FAIL | shape[1:] | Input 의 shape 값이 요구사항과 다릅니다 (입력값: X_train.shape[1:])`, `FAIL | (X_train.shape[-1],)`.
- 수정: `ch04-q5.validation_rules[0].params[0].value` 를 `["(X_train.shape[1],)", "(X_train.shape[-1],)", "X_train.shape[1:]", "(8,)"]` 로 바꾼다. ch04-q1 `validation_rules[1].params[0].value` 에는 `"(X_train.shape[-1],)"` 를 추가한다.

### C-2. ch05-q5 — 지문이 정답으로 인정한다고 밝힌 `to_categorical(y_train)` 을 거부함
- 위치: `ch05-q5.validation_rules[0].rules[1].rules[0]`(regex)
- 문제: 지문에 "원-핫 `to_categorical` 로 `y_fit` 을 만들고 loss 도 함께 바꾸는 방식도 정답으로 인정됩니다"라고 적혀 있다. 그런데 regex는 클래스 수 `4` 를 명시한 경우만 받는다. 출처 퀴즈 Q4와 본문 §2.10.3(`tf.keras.utils.to_categorical(y_train)`)은 클래스 수를 생략한 형태를 쓴다. 이 형태도 라벨이 0~3이라 (600, 4) 가 되어 정상 동작한다.
- 증거: `y_fit = to_categorical(y_train)` 과 `loss='categorical_crossentropy'` 조합이 `FAIL | 필수 패턴과 일치하는 코드가 없습니다`.
- 수정: 해당 pattern을 `"y_fit=(tf\\.keras\\.utils\\.)?to_categorical\\(y_train(,(num_classes=)?4)?\\)"` 로 바꾼다.

### C-3. ch07-q4 — 같은 실습 세트의 다른 문항이 인정하는 동치 답안을 거부함
- 위치: `ch07-q4.validation_rules[1]`(np.argmax call), `validation_rules[0]`(y_bin any)
- 문제:
  1. 메서드 형태 `multi_pred.argmax(axis=1)` 를 거부한다. ch08-q1과 q2는 `pred.argmax(axis=1)` 을 인정하고, 본문 §2.10.3도 `y_onehot.argmax(axis=1)` 을 가르친다.
  2. `y_bin = (bin_pred > 0.5).astype(int).reshape(-1)` 을 거부한다. ch07-q3은 같은 형태를 인정한다.
- 증거: 프로브 결과 `FAIL | method argmax | np.argmax(...) 호출을 찾지 못했습니다`, `FAIL | reshape(-1) bin`.
- 수정:
  - `validation_rules[1]` 을 `{"type":"any", "label":"y_mul: 행(axis=1) 방향 argmax", "hint":(기존), "rules":[ 기존 call 규칙, {"type":"regex","pattern":"y_mul=multi_pred\\.argmax\\(axis=(1|-1)\\)"} ]}` 로 감싼다.
  - `validation_rules[0].rules` 에 `{"type":"regex","pattern":"y_bin=\\(bin_pred>0\\.5\\)\\.astype\\((int|'int\\d*')\\)\\.reshape\\(-1\\)"}` 를 추가한다.

### C-4. ch04-q4 / ch04-q6 — `n_class` 의 정답 표현이 ch05·ch08 실습과 달리 거부됨
- 위치: `ch04-q4.validation_rules[0]`, `ch04-q6.validation_rules[0]` (assign contains)
- 문제: `np.unique(y_train).shape[0]` 과 `y_train.max() + 1` 을 거부한다. ch05-q4와 ch08-q1/q2/q4는 둘 다 인정한다. 같은 개념인데 챕터마다 채점이 다르다.
- 증거: 프로브 결과 `FAIL | shape[0] unique`, `FAIL | max+1` (ch04-q4, ch04-q6 모두).
- 수정: 두 문항의 `contains` 에 `"np.unique(y_train).shape[0]"`, `"y_train.max()+1"`, `"np.max(y_train)+1"`, `"int(y_train.max())+1"` 를 추가한다.

### C-5. cheatsheet ③ 4번 행 — 결측치 처리 호출이 틀림(재대입 누락 + 전체 컬럼 채움)
- 위치: `_workspace/pages/cheatsheet.html`, ③ 표의 4번 행
- 문제: `df.fillna(df[col].median())` 에는 두 가지 오류가 있다.
  1. 대입이 없어 `df` 가 바뀌지 않는다. ch02-q6이 바로 이 실수를 오류로 가르친다.
  2. 대입하더라도 다른 컬럼의 결측까지 `col` 의 중앙값으로 채운다.
  치트시트는 수험생이 그대로 옮겨 쓰는 문서이므로 실점으로 직결된다.
- 수정: 해당 셀을 `<code>df[col] = df[col].fillna(df[col].median())</code> / <code>df = df.dropna()</code>` 로 바꾼다.

## 2. HIGH

### H-1. ch06-q4 — `mode='min'` 오답이 통과함
- 위치: `ch06-q4.validation_rules[0]`
- 문제: 지문은 "클수록 좋은 지표임을 명시하는 인자"를 강조한다. 그런데 `EarlyStopping(monitor='val_accuracy', ..., mode='min')` 이 통과한다. 이 설정이면 정확도가 떨어질 때를 개선으로 보고, 가장 낮은 정확도 시점의 가중치로 복원한다.
- 증거: `PASS | ch06-q4 | mode=min`.
- 수정: `validation_rules` 에 `{"type":"forbid","value":"mode='min'","label":"정확도에 mode='min' 금지","hint":"정확도는 클수록 좋은 지표입니다. mode 를 쓴다면 'max' 입니다."}` 를 추가한다.

### H-2. ch05-q2 / ch05-q3 / ch05-q6 — 동치로 인정한 지표명이 skeleton의 고정 줄을 깨뜨림
- 위치: `ch05-q3.validation_rules[1]`(`['acc']`), `ch05-q2.validation_rules[2]` 와 `ch05-q6.validation_rules[2]`(`['mean_absolute_error']`)
- 문제: Keras 3.15에서 history 키는 지표 문자열을 그대로 따른다.
  - `metrics=['acc']` 이면 키가 `acc`/`val_acc` 가 되므로, ch05-q3의 고정 줄 `history.history['val_accuracy']` 가 KeyError를 낸다.
  - `['mean_absolute_error']` 이면 키가 `mean_absolute_error`/`val_mean_absolute_error` 가 되므로, ch05-q2의 `['mae']` 와 ch05-q6의 `['val_mae']` 가 KeyError를 낸다.
  - 채점기는 이 답들을 통과시키지만 실제 셀은 실행되지 않는다. 치트시트 카드 5(`KeyError: 'val_acc'`, "`acc` 아님")와도 모순된다.
- 증거: 실행 결과 `['acc'] -> ['acc','loss','val_acc','val_loss']`, `['mean_absolute_error'] -> ['loss','mean_absolute_error','val_loss','val_mean_absolute_error']`. 프로브 결과 `PASS | ch05-q3 | acc`, `PASS | ch05-q2 | mean_absolute_error`.
- 수정:
  - ch05-q3 `validation_rules[1].params[0].value` 를 `"['accuracy']"` 하나로 줄인다.
  - ch05-q2와 ch05-q6의 `validation_rules[2].params[0].value` 를 `"['mae']"` 하나로 줄인다.
  - 각 hint에 "history 키 이름이 지표 문자열을 따르므로 아래 줄의 `'val_accuracy'`/`'mae'` 키와 맞추세요"를 덧붙인다. ch08-q3과 q5는 history 키를 읽지 않으므로 그대로 두어도 된다.

### H-3. cheatsheet ① 노트 — "units 는 `len(np.unique(y_train))` 로 계산하면 틀리지 않습니다"
- 위치: `_workspace/pages/cheatsheet.html`, ① `.v2-cs-note`
- 문제: 이 문장은 일반 규칙으로는 사실이 아니다.
  - 이진분류에 적용하면 2가 나와 `Dense(2, 'sigmoid')` 가 된다. 표의 `Dense(1)` 과 모순된다.
  - 원-핫 라벨 `(N,K)` 에 적용하면 고유값이 0과 1뿐이라 2가 나온다.
  - 회귀에는 해당하지 않는다.
- 수정: 해당 문장을 "**다중분류(정수 라벨)** 출력층 `units` 는 `len(np.unique(y_train))` 로 계산합니다(이진분류는 1, 회귀는 1)."로 바꾼다.

## 3. MEDIUM

| ID | 위치 | 문제 · 증거 | 최소 수정 |
|----|------|------------|-----------|
| M-1 | ch02-q1, ch02-q4, ch02-q5 (forbid 규칙) | 빈칸 `scaler.___(X_test)` 에 `fit(X_test).transform` 을 넣으면 평가 데이터로 다시 fit하는 누수인데 통과함. 프로브 `PASS | refit on test`(q1, q4) | 각 forbid에 `"fit(X_test)"`, `"fit(X)"` 를 추가 |
| M-2 | ch01-q1 | 정답 `'binary_crossentropy'` 는 Ch01 본문에 없음(Ch03/Ch05에서 배움). 출처 Q1(범위 판별)과의 연결도 약함 | prompt의 첫 항목을 "`compile` 의 손실 함수는 이진분류용 `'binary_crossentropy'` 문자열로 지정합니다."로 수정 |
| M-3 | ch01-q2.explanation | "7번(분리), 8번(스케일링)" 은 현행 형식(7번 = 분리+스케일링, 8번 = DecisionTree)과 ch01 콜아웃에 어긋남 | "7번(분리·스케일링)과 11번 이후 딥러닝 문항이 오류 없이 이어집니다"로 수정 |
| M-4 | ch01-q4.rules[0] | `tf.version.VERSION` 도 버전 문자열 속성인데 거부함 | token value에 `"print('tensorflow:',tf.version.VERSION)"` 추가 |
| M-5 | ch03-q3 | `steps_per_epoch * 10`, `n_rows / 50` 처럼 리터럴로 쓴 정답을 거부함(변수 사용 지시가 없음) | prompt에 "변수 `batch_size`, `epochs` 를 사용합니다" 추가, 또는 contains에 리터럴 대안 추가 |
| M-6 | ch03-q4.rules[0] | `np.matmul(w, x)`, `np.inner(w, x)` 를 거부함. 빈칸이 `np.___` 라 지문 조건(numpy 함수)을 충족함 | contains에 `"np.matmul(w,x)+b"`, `"np.inner(w,x)+b"` 추가 |
| M-7 | ch04-q4.rules[1], ch04-q6.rules[1] | q4는 `Dropout(rate=0.3)` 을 거부함(regex). q6은 출력층 `Dense(4, ...)` 를 거부하는데 q4는 `4` 를 인정함 | q4 regex의 `Dropout\(0\.3\)` 를 `Dropout\((rate=)?0\.3\)` 로 수정. q6 regex의 `(n_class|units=n_class)` 를 `((units=)?(n_class|4))` 로 수정 |
| M-8 | ch05-q1(라), ch05-q6, ch08-q3, ch08-q5 | (1) 지문에 손실 지정이 없는데 회귀 표준 손실인 `loss='mae'` 를 거부함(aice-domain: "회귀 mse·mae"). (2) `Dense(1, activation=None)` 도 거부함. 프로브 FAIL 확인 | (1) ch05-q1(라)와 ch05-q6 prompt에 "손실은 평균제곱오차"를 명시. (2) 각 any 규칙에 `{"kw":"activation","value":"None"}` 대안을 추가 |
| M-9 | ch05-q4.explanation | "`len(np.unique(y_train))` 은 라벨이 1부터 시작해도 정확한 클래스 수를 줍니다"는 개수로는 맞지만, 라벨이 1..K이면 `Dense(K)` 와 sparse CE 조합에서 범위 밖 오류가 난다는 점을 가림 | "라벨이 1부터 시작하면 개수는 맞아도 sparse 손실이 범위 오류를 내므로 먼저 `y-1` 로 0부터 맞춥니다"로 수정 |
| M-10 | ch05-q6.prompt | "원본에서는 `val_mae` 가 186 부근에서 전혀 줄지 않았습니다"는 성립하지 않음. 원본은 `loss='accuracy'` 라 fit 시작 시 `Could not interpret loss identifier` 로 멈추고, `metrics=['mse']` 라 `val_mae` 키도 없음 | "원본은 fit 시작과 함께 오류로 멈췄고, loss만 고쳐도 sigmoid 때문에 `val_mae` 가 186 부근에서 정체합니다"로 수정 |
| M-11 | ch06-q2 | 빈칸 정답 `dl.count_params()` 는 Ch06 본문에 없음(퀴즈 해답과 ch04 skeleton에만 나옴) | prompt에 "층 객체의 `count_params()` 메서드로" 를 명시 |
| M-12 | ch06-q5, ch06-q1.hint | Keras 3.15에서는 `callbacks=es`(단일 객체)도 동작함(커스텀 콜백 3회 호출 확인). 그런데 q5는 이를 거부하고, q1 hint "리스트로 넘겨야 동작합니다"와 q5 explanation은 사실과 다름 | q5 prompt에 "`callbacks` 에는 리스트로 넘깁니다(표준 표기)"를 명시. q1 hint는 "리스트로 넘기는 것이 표준입니다"로 수정 |
| M-13 | ch06-q5.prompt | "6번째 epoch 에서 바닥"이 실제와 다름. 이 실습 코드의 원본(콜백 없음, 100 epoch)을 실행하면 최저 epoch은 **5**(`expected_output` 도 5), 마지막/최저 비율은 2.89 | "6번째" → "5번째" |
| M-14 | ch07-q3, ch07-q4, ch08-q3 (y_pred any 규칙) | `(pred > 0.5).flatten().astype(int)`, `.astype(int).squeeze()`, `.astype(np.int64)`, `reg_pred.squeeze()`, `np.ravel(reg_pred)`, `reshape(-1,)`, `model.predict(...).squeeze()` 등 정답을 거부함. 프로브 FAIL 확인 | 각 any에 regex 대안 추가: `\.(flatten|ravel)\(\)\.astype\(`, `\.squeeze\(\)`, `np\.(ravel|squeeze)\(`, `reshape\(-1,?\)`, `astype\((int|np\.int\d*|'int\d*')\)` |
| M-15 | arch_patterns.json `multiclass_onehot.label_format` | "y 는 원-핫 (N, K)" 이라고 적혀 있지만 코드는 정수 `y_train` 에 `np.unique` 를 쓰고 `to_categorical` 로 변환함. y가 이미 원-핫이면 `n_classes=2` 가 되어 코드가 깨짐 | `"정수 y_train 을 to_categorical 로 원-핫 (N, K) 변환해 사용"` 으로 수정 |

## 4. LOW

| ID | 위치 | 내용 | 수정 |
|----|------|------|------|
| L-1 | arch_patterns.json tags | `input` 태그를 쓰는 줄이 0개인데 범례 칩 "입력 shape"는 표시됨. 눌러도 아무 줄도 강조되지 않음 | tags에서 `input` 제거, 또는 범례에서 사용 안 하는 태그 숨김 |
| L-2 | arch binary `summary.postprocess` | `(pred > 0.5).astype(int)` 인데 코드는 `.ravel()`, 치트시트는 `.flatten()` 까지 씀 | `"(pred > 0.5).astype(int).ravel()"` |
| L-3 | ch02 §2.10 첫 문단 | "현재 실기 시험은 14문항으로 구성되며"에 변동 단서가 없음(ch01 콜아웃과 치트시트에는 있음) | "(회차별 변동 가능, Ch01 참고)" 추가 |
| L-4 | ch02 §2.10.1 출력 요지 | "Keras에서는 `loss: nan`으로 나타납니다"라고 단정함. sigmoid+BCE+relu 조합에서는 X의 NaN이 가려져 loss가 0.693으로 찍히는 것을 재현함(가중치는 NaN). 치트시트 카드 4와 어긋남 | "대개 `loss: nan`(relu 층에서는 가려질 수도 있음)" |
| L-5 | cheatsheet ③ 7번 행 | `stratify=y` 가 들어 있는데 회귀에서는 오류가 남 | "(분류일 때)" 단서 추가 |
| L-6 | cheatsheet 카드 3 | DataFrame을 fit에 넣을 때 메시지는 컬럼 순서에 따라 `Invalid dtype: str` 또는 `could not convert string to float` 로 달라짐(둘 다 재현) | "(컬럼 순서에 따라 could not convert … 로도 표시)" |
| L-7 | ch07-q1.explanation | "정확도 0.06 같은" 값은 이 실습에서는 나오지 않음(바꿔 받으면 acc 자리에 loss 0.2042) | "정확도 자리에 손실값(0.2 등)이 찍힙니다" |
| L-8 | ch05-q5.prompt | "출력은 `(32, 4)`" 라고 했지만 이 환경의 메시지는 `target.shape=(None,), output.shape=(None, 4)` | "(None, 4)" 로 수정 |
| L-9 | ch07-q1, ch07-q4 | 키워드 호출 `model.evaluate(x=..., y=...)`, `mean_squared_error(y_true=..., y_pred=...)` 를 거부함(pos만 지정) | params에 `kw` 를 병기(`{"pos":0,"kw":"x",...}` 등) |
| L-10 | ch06-q3 | 기본값으로 같은 동작을 하는 `EarlyStopping(patience=5, ...)`(monitor 생략)와 튜플 `callbacks=(es, mc)` 를 거부함 | 명시 요구를 prompt에 적거나 그대로 둠(표준 표기 강제) |
| L-11 | ch07-q2 | `tn, fp, fn, tp = cm[0,0], cm[0,1], cm[1,0], cm[1,1]` 를 거부함 | prompt에 "`ravel()` 로"를 명시 |
| L-12 | ch03-q5 | `size=[5, 1]`(리스트)를 거부함 | value에 `"[5,1]"` 추가 |

---

## 5. 검수 범위
- **전부 읽음:**
  - `chapter_drills.json` 42문항의 모든 필드(prompt, skeleton, answer, rules, negative_tests, expected_output, explanation)
  - `arch_patterns.json` 전체(4유형 × 2 API 코드, summary, pitfall)
  - `cheatsheet.html` 전체
  - ch02 §2.10 전체(338–535행)
  - ch01 콜아웃(32–39행)과 그 앞뒤 문단
  - `grader-core.js`, SPEC §2–§5, aice-domain SKILL
  - ch01–ch08 퀴즈의 문제부(해답부는 ch02·ch05·ch06에서 필요한 대목만 확인)
- **일부만 확인:** ch04·ch06·ch08 본문은 관련 대목(Functional 설명, `training=True`, §8.5 ③)만 grep으로 봤다. 모의고사 JSON은 Q14 `new_data` 형태만 확인했다.
- **확인 불가:** KT AICE 공식 공지(프록시 403).
