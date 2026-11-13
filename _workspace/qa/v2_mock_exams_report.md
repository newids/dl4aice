# v2 모의고사(mock_exams_14q.json) 학습자 관점 QA 리포트

- 대상: `assets/data/mock_exams_14q.json` (mock01 이진분류 / mock02 다중분류 / mock03 회귀, 각 14문항 = 42문항)
- 검수 범위: 공정성(숨은 요구·동치 답안 거부), 관대함 누수(오답 통과), Q1→Q14 파이프라인 논리, 해설·지문 정확성, 한국어 지시 품질
- 읽은 범위: **세 회차 42문항 전부 정독**(prompt, skeleton_code, answer_code, validation_rules, negative_tests, expected_output, explanation). 표본 추출 없음.
- 자동 검증(모범 답안 통과·skeleton 실패·실제 TF 실행)은 이미 통과했으므로 반복하지 않았다.

## 검증 방법

1. 채점기 프로브: 모범 답안에서 해당 빈칸만 바꾼 변형을 `grader-core.js` 의 `grade()` 로 채점(스크립트: 스크래치 `probe.js`). 각 지적의 "증거"에 `pass=` 결과를 적었다.
2. 실제 실행: TF 2.21 / Keras 3.15.1 / scikit-learn 1.9.1 / pandas 3.0.5 환경에서 Keras 지표 키 이름, 문자열 metrics, 정수 라벨 + `categorical_crossentropy` 오류 메시지, 데이터프레임으로 fit 한 scaler 에 열 순서가 다른 입력을 넣을 때의 동작을 직접 확인했다.
3. 수치 대조: 세 회차의 setup_code + Q1~Q10 답안을 실행해 expected_output·해설의 숫자와 비교했다(Q1~Q10 수치는 모두 일치. 불일치는 해설 문장에만 있음).
4. 수정안 검증: 아래 CRITICAL/HIGH 수정 규칙은 모범 답안 통과, 기존 negative_tests 전부 오답, skeleton 오답, 지적한 동치 답안 통과를 프로브로 확인했다.

## 요약

| 회차 | CRITICAL | HIGH | MEDIUM | LOW |
|------|---------:|-----:|-------:|----:|
| mock01 (이진분류) | 4 | 3 | 4 | 4 |
| mock02 (다중분류) | 0 | 1 | 4 | 1 |
| mock03 (회귀) | 4 | 1 | 4 | 3 |
| 공통 | 0 | 0 | 0 | 2 |
| **합계** | **8** | **5** | **12** | **10** |

담당: 문항 데이터(지문·규칙·해설)는 모두 exam-writer 수정 대상이다.

---

## CRITICAL

### C-1. mock01 Q5: 자유 빈칸 `df = df[___]` 의 동치 필터식이 오답 처리됨
- **문제**: skeleton 이 `df = df[___]` 로 필터식 전체를 비워 두었는데, 규칙(regex)은 `(df['monthly_fee']>=lower)&(df['monthly_fee']<=upper)`(양쪽 순서), `.between(lower,upper)` 만 허용한다. 지문은 "벗어나는 행을 제거"라고 쓰는데, 이를 그대로 옮긴 `~((x < lower) | (x > upper))` 와 `lower <= x` 형태, `df.monthly_fee` 표기는 모두 오답이 된다.
- **증거**:
  - `df[~((df['monthly_fee'] < lower) | (df['monthly_fee'] > upper))]` → `pass=false` (하한~상한 범위 안의 행만 남겨 df 에 재대입)
  - `(lower <= df['monthly_fee']) & (df['monthly_fee'] <= upper)` → `pass=false`
  - `(df.monthly_fee >= lower) & (df.monthly_fee <= upper)` → `pass=false`
- **수정(최소)**: mock02·mock03 처럼 필터식의 뼈대를 skeleton 에 고정한다. `questions[4].skeleton_code` 의 `df = df[___]` 줄을 다음으로 바꾼다.
  `df = df[(df['monthly_fee'] >= ___) & (df['monthly_fee'] <= ___)]`
  (빈칸 6개. 규칙은 그대로 둬도 되며, skeleton 은 오답으로 판정됨을 확인함.)

### C-2. mock01 Q7: `stratify=df['churn']` 가 오답 처리됨
- **문제**: 빈칸은 `stratify=___` 이고, 지문은 "클래스 비율이 학습·평가 양쪽에 동일하게 유지"라고만 쓴다. `df['churn']` 은 `y` 와 같은 Series 이므로 정답이다.
- **증거**: `stratify=df['churn']` → `pass=false` (7:3, random_state=42, 층화 추출)
- **수정**: `questions[6].validation_rules[2].params[4].value` 를 `"y"` 에서 `["y", "df['churn']", "df.churn"]` 로 바꾼다. (수정 후 위 변형은 통과하고 neg 4개는 모두 오답으로 남음.)

### C-3. mock01 Q11 → Q13: `metrics=['acc']` 를 정답으로 받아 Q13 파이프라인이 깨짐
- **문제**: Q11 compile 규칙이 `['acc']` 를 허용한다. Keras 3 에서 `metrics=['acc']` 로 학습하면 history 키가 `acc`/`val_acc` 가 된다. 그런데 Q13 skeleton 은 `history.history['accuracy']` 를 고정해 두어 실행하면 KeyError 가 나고, Q13 규칙은 `'val_accuracy'` 를 요구하므로 자기 모델에 맞게 `val_acc` 를 쓴 학습자도 오답이 된다. 게다가 Q13 해설은 `val_acc` 를 "옛 키 이름(KeyError)"이라고 설명한다.
- **증거**:
  - 실제 실행: `metrics=['acc']` → history 키 `['acc', 'loss', 'val_acc', 'val_loss']`
  - Q11 `metrics=['acc']` → `pass=true`, Q13 `history.history['val_acc']` → `pass=false`
- **수정**: 지문이 이미 "metrics 는 `accuracy`"로 지정하고 있으므로 `questions[10].validation_rules[6].params[2].value` 를 `["['accuracy']"]` 로 좁힌다. 이 수정은 H-2 도 함께 해결한다(수정 후 `['acc']`, `'accuracy'` 모두 오답, 모범 답안 통과를 확인함).

### C-4. mock01 Q14: `pd.DataFrame(new_data, index=[0])` 가 오답 처리됨
- **문제**: 빈칸 `pd.DataFrame(___)` 은 자유 형식이다. 스칼라 딕셔너리로 1행 DataFrame 을 만드는 표준 방법이 두 가지인데(`[new_data]`, `new_data, index=[0]`), 규칙은 앞의 것만 받는다. 실제로 pandas 오류 메시지("you must pass an index")가 뒤의 방법을 안내한다.
- **증거**: `pd.DataFrame(new_data, index=[0])` → `pass=false` (new_data 로 1행 데이터프레임 new_df 생성)
- **수정**: `questions[13].validation_rules[2]` 를 다음 규칙으로 교체한다(검증 결과: index 변형 통과, `pd.DataFrame(new_data)` 는 오답, neg 5개와 skeleton 모두 오답).
```json
{"type":"any","label":"new_data 로 1행 데이터프레임 new_df 생성","hint":"딕셔너리의 값이 모두 스칼라이면 그대로 넣을 수 없습니다. 딕셔너리를 리스트로 감싸거나 index 를 지정해 1행 표로 만드세요.","rules":[
 {"type":"call","callee":"pd.DataFrame","assign":"new_df","params":[{"kw":"data","pos":0,"value":"[new_data]"}]},
 {"type":"call","callee":"pd.DataFrame","assign":"new_df","params":[{"kw":"data","pos":0,"value":"new_data"},{"kw":"index","value":"*"}]}]}
```

### C-5. mock03 Q9, Q10: 학습·예측 데이터(스케일링 여부)를 지문이 말하지 않는데 규칙은 `X_train`/`X_test` 만 허용
- **문제**: Q8 지문은 "학습 데이터(`X_train`, `y_train`)… 트리는 스케일링이 필요 없다"고 명시하지만, Q9("학습 후 테스트 데이터를 예측해")와 Q10("학습 후 테스트 예측")은 어떤 배열을 쓸지 말하지 않는다. skeleton 도 `rf_model.fit(___, ___)`, `predict(___)` 로 비워 두었다. mock01·mock02 는 트리 모델을 `X_train_scaled` 로 학습하므로, 회차 순서대로 푼 학습자가 스케일링된 배열을 일관되게 쓰는 것은 자연스럽고 결과도 사실상 같다. 그런데도 오답이 된다.
- **증거**:
  - mock03 Q9 `fit(X_train_scaled, y_train)` + `predict(X_test_scaled)` → `pass=false` (학습 | 예측)
  - mock03 Q10 같은 변형 → `pass=false` (학습 | 예측)
- **수정(지문)**:
  - `questions[8].prompt` 둘째 항목을 "학습 데이터 `X_train`, `y_train` 으로 학습한 후(Q8 과 같이 스케일링하지 않은 데이터 사용) 테스트 데이터 `X_test` 를 예측해 `rf_pred` 에 저장하고, …"로 바꾼다.
  - `questions[9].prompt` 둘째 항목을 "`X_train`, `y_train` 으로 학습한 후(스케일링 전 데이터) `X_test` 에 대한 예측 `xgb_pred`, MAE `xgb_mae`, R² `xgb_r2` 를 구하시오."로 바꾼다.

### C-6. mock03 Q11: 지문은 "손실 함수는 회귀용"이라고만 했는데 `loss='mae'` 가 오답 처리됨
- **문제**: 지문이 손실 함수를 "회귀용으로"라고만 지정한다. 도메인 기준(aice-domain: 회귀 `mse`·`mae`)으로 보면 `mae` 도 회귀 손실로 정답이다. 그런데 규칙은 `'mse'`/`'mean_squared_error'` 만 허용하고, 정답은 hint("평균 제곱 오차")에서야 처음 드러난다. 뒤 문항도 MSE 를 전제한다(Q13 제목 `'Loss (MSE)'`, Q14 출력 `Test MSE`).
- **증거**: `loss='mae'` → `pass=false` (compile 설정). `loss='huber'` 도 `pass=false`.
- **수정(지문)**: `questions[10].prompt` 마지막 항목을 "옵티마이저 `adam`, 손실 함수는 평균제곱오차(`mse`), 평가지표는 MAE(`metrics=['mae']`)로 컴파일하고 `model.summary()` 를 출력하시오."로 바꾼다. 같은 문장으로 C-7 도 해결된다.

### C-7. mock03 Q11 → Q13: `metrics=['mean_absolute_error']` 를 정답으로 받아 Q13 이 깨짐
- **문제**: Q11 은 `['mean_absolute_error']` 를 허용한다. 하지만 Keras 3 에서는 history 키가 `mean_absolute_error`/`val_mean_absolute_error` 가 되어, Q13 규칙(`history.history['mae']`, `['val_mae']`)과 해설("키 이름은 compile 의 metrics=['mae'] 에서 정해지며")에 맞지 않는다. Q11 에서 정답 처리된 학습자가 자기 키를 쓰면 Q13 에서 오답이 되고, 지시된 `mae` 키를 쓰면 KeyError 가 난다.
- **증거**:
  - 실제 실행: `metrics=['mean_absolute_error']` → 키 `['loss', 'mean_absolute_error', 'val_loss', 'val_mean_absolute_error']`
  - Q11 변형 → `pass=true`, Q13 `history.history['val_mean_absolute_error']` → `pass=false`
- **수정**: C-6 의 지문 수정과 함께 `questions[10].validation_rules[5].params[2].value` 를 `["['mae']"]` 로 좁힌다(수정 후 모범 답안 통과, 해당 변형은 오답).

### C-8. mock03 Q14: `y_pred = pred.squeeze()` 가 오답 처리됨
- **문제**: 빈칸 `pred.___()` 에 들어갈 수 있는, `(N,1)` 을 `(N,)` 로 만드는 표준 메서드는 `flatten`, `ravel`, `squeeze` 세 가지다. 지문("1차원으로 펴서")은 이 중 무엇도 배제하지 않는다.
- **증거**: `pred.squeeze()` → `pass=false` (pred 를 1차원으로)
- **수정**: `questions[13].validation_rules[1].contains` 를 `[".flatten()", ".ravel()", ".squeeze()"]` 로 바꾼다(수정 후 통과, neg·skeleton 은 계속 오답).

---

## HIGH

### H-1. mock01 Q4: 다른 컬럼의 중앙값으로 채워도 통과
- **문제**: 규칙이 `fillna` 인자에 `.median()` 이 들어 있는지만 본다. 지문의 핵심은 "**해당 컬럼의** 중앙값"이다.
- **증거**: `df['total_fee'].fillna(df['monthly_fee'].median())` → `pass=true`
- **수정**: `questions[3].validation_rules[1].params[0].value` 를 `{"contains": "df['total_fee'].median()"}` 로 바꾼다(수정 후 다른 컬럼은 오답, `fillna(value=...)` 변형은 통과).

### H-2. mock01 Q11: `metrics='accuracy'`(리스트 아님)가 통과하지만 Keras 3 에서는 실행 오류
- **문제**: 규칙의 대안에 `"'accuracy'"` 가 들어 있다. 하지만 Keras 3 에서는 compile 단계에서 바로 ValueError 가 난다. 규칙 hint 에도 "metrics 는 리스트로 감싸"라고 적혀 있어 규칙과 hint 가 서로 어긋난다.
- **증거**:
  - 실제 실행: `ValueError: Expected 'metrics' argument to be a list, tuple, or dict. Received instead: metrics=accuracy of type <class 'str'>`
  - 채점: `metrics='accuracy'` → `pass=true`
- **수정**: C-3 과 같다(`value` 를 `["['accuracy']"]` 로).

### H-3. mock01 Q14 해설: "열 순서가 달라도 … 에러 없이 틀린 예측" 은 이 파이프라인에서 사실이 아님
- **문제**: `scaler` 는 `X_train`(DataFrame)으로 fit 되었으므로 `feature_names_in_` 를 가진다. 그래서 DataFrame 의 열 순서가 다르거나 열이 빠지면 scikit-learn 이 **ValueError** 를 낸다. "에러 없이 틀린 예측"이 되는 것은 넘파이 배열을 넣었을 때뿐이다.
- **증거**:
  - 해설 원문: "③ 이 없으면 열 개수가 10개가 안 되어 shape 오류가 나고, 열 순서가 달라도 값이 엉뚱한 특성에 들어가 에러 없이 틀린 예측을 합니다."
  - 실제 실행(sklearn 1.9.1): 순서를 바꾼 DataFrame → `ValueError: The feature names should match those that were passed during fit. Feature names must be in the same order as they were in fit.` / 열 누락 → `ValueError: … Feature names seen at fit time, yet now missing`
- **수정**: `questions[13].explanation` 의 해당 문장을 다음으로 바꾼다. "1행짜리 데이터는 `month`, `fiber` 더미만 만들어지므로 ③ 이 없으면 학습 때 본 컬럼이 빠져 `scaler.transform` 이 `ValueError`(feature names should match)를 냅니다. `scaler` 는 데이터프레임 `X_train` 으로 학습되어 컬럼 이름과 순서까지 기억하기 때문입니다. 넘파이 배열로 바꿔 넣으면 이 검사가 사라져 열 순서가 어긋나도 에러 없이 틀린 예측이 나오므로 더 위험합니다. `X.columns` 로 맞추면 개수·순서가 동시에 해결됩니다."

### H-4. mock02 Q14 해설: "scaler 는 넘파이 배열로 학습되어" 는 사실과 다름, "컬럼이 2개뿐" 도 틀림
- **문제**: (1) `X_train` 은 DataFrame 이므로 scaler 는 DataFrame 으로 학습되었다. 실제로 `hasattr(scaler, 'feature_names_in_') == True` 다. (2) `reindex` 를 빼먹었을 때 `new_df` 의 컬럼은 센서 6개 + 더미 2개 = **8개**이지 2개가 아니다. 오류도 "특성 개수 불일치"가 아니라 feature names 불일치 ValueError 다.
- **증거**:
  - 원문 1: "`new_df` 는 데이터프레임이지만 `scaler` 는 넘파이 배열로 학습되어 있어 컬럼 **순서**가 맞아야 의미가 같습니다."
  - 원문 2: "`reindex` 대신 … 바로 변환하는 것. 컬럼이 2개뿐이라 `scaler.transform` 이 `ValueError` (특성 개수 불일치)를 냅니다."
  - 실행: `scaler feature names? True`, get_dummies 후 `new_df.shape == (1, 8)`
- **수정**: `questions[13].explanation` 에서
  - 원문 1 → "`scaler` 는 데이터프레임 `X_train` 으로 학습되어 컬럼 이름과 순서를 기억합니다. 순서나 구성이 다르면 `ValueError: The feature names should match …` 가 나므로 3번이 필수입니다."
  - 원문 2 → "`reindex` 없이 바로 변환하는 것. 더미가 2개만 생겨 컬럼이 8개뿐이므로 `scaler.transform` 이 `ValueError`(학습 때 본 컬럼이 없음)를 냅니다."

### H-5. mock03 Q4: 지문은 `temperature` 를 **중앙값**으로 채우라는데 평균도 통과(다른 컬럼도 통과)
- **문제**: 규칙 대안에 `.mean()` 이 들어 있고 컬럼도 확인하지 않는다. hint("평균/중앙값 … 이상값에 강한 쪽을 쓰는 문제")도 지문과 어긋나는 신호를 준다.
- **증거**: `fillna(df['temperature'].mean())` → `pass=true`, `fillna(df['humidity'].median())` → `pass=true`
- **수정**: `questions[3].validation_rules[0].params[0].value` 를 `[{"contains": "df['temperature'].median()"}]` 로, 같은 규칙의 `hint` 를 "`temperature` 컬럼의 **중앙값**을 구하는 식을 넣으세요. 평균이 아닙니다."로 바꾼다(수정 후 mean·다른 컬럼은 오답, 모범 답안 통과).

---

## MEDIUM

### M-1. mock01 Q2: `countplot(data=df, x=df['contract_type'], hue=df['churn'])` 가 오답 처리됨
- 증거: `pass=false` (countplot: x=계약유형, hue=churn). seaborn 은 이 형태도 정상적으로 그린다. 지문은 컬럼명 문자열을 요구하지 않는다.
- 수정: `validation_rules[2].params` 의 x 값을 `["'contract_type'", "df['contract_type']"]`, hue 값을 `["'churn'", "df['churn']"]` 로 바꾼다. 또는 지문에 "`x`, `hue` 에는 컬럼명 문자열을 쓰시오"를 덧붙인다.

### M-2. mock01 Q4: 결측 총개수의 동치 표현 `df.isnull().values.sum()` 이 오답 처리됨
- 증거: `print('남은 결측치:', df.isnull().values.sum())` → `pass=false`. 빈칸 `print('남은 결측치:', ___)` 는 자유 형식이다.
- 수정: `validation_rules[2].value` 에 `"df.isnull().values.sum()"`, `"df.isna().values.sum()"` 을 추가한다.

### M-3. mock01 Q11: 동치 표기가 오답 처리됨 (`shape=X_train_scaled.shape[1:]`, `Dense(units=64, …)`, `Dropout(rate=0.3)`, `loss=tf.keras.losses.BinaryCrossentropy()`)
- 증거: 네 가지 모두 `pass=false`. 은닉층·Dropout 규칙이 위치 인자 형식만 받는 regex 이고, compile 의 loss 는 문자열만 받는다.
- 수정: Input 대안에 `"X_train_scaled.shape[1:]"` 를 추가한다. 은닉층 regex 를 `Dense\\((units=)?\\d+,activation='relu'\\)\\)[\\s\\S]*Dense\\((units=)?\\d+,activation='relu'\\)` 로, Dropout regex 의 `Dropout\\(` 를 `Dropout\\((rate=)?` 로 바꾼다. loss 대안에 `{"contains":"BinaryCrossentropy("}` 를 추가한다(mock02 Q11 의 `SparseCategoricalCrossentropy(` 도 같은 방식).

### M-4. mock01 Q14: `print('예측 결과:', new_pred > 0.5)` 가 통과 (해설이 오답으로 꼽는 형태)
- 증거: `pass=true`. 지문은 "최종 판정(0 또는 1)"이고, 해설도 "`[[True]]` 가 나오는 것. 0/1 정수로 바꿔 출력하세요"라고 오답으로 명시한다.
- 수정: `validation_rules[7].pattern` 을 아래로 바꾼다(검증 결과: 모범 답안, `int(...>=0.5)`, `.astype(int)`, `1 if … else 0`, `np.where` 는 통과하고 불리언 출력은 오답).
  `"print\\('예측 결과:',(int\\([^\\n]*new_pred[^\\n]*>=?0\\.5|[^\\n]*new_pred[^\\n]*>=?0\\.5[^\\n]*astype\\(int\\)|1 if [^\\n]*new_pred[^\\n]*>=?0\\.5[^\\n]*else 0|np\\.where\\([^\\n]*new_pred[^\\n]*>=?0\\.5)"`

### M-5. mock02 Q2: 지문이 그래프 종류를 정하지 않았는데 `countplot` 만 정답 (숨은 요구)
- 지문: "`seaborn` 의 막대형 분포 그래프로 … 클래스별 개수를 시각화". skeleton 은 `sns.___`. `histplot(data=df, x='defect_type')` 도 범주형 x 에 대해 개수 막대를 그린다. 그런데 neg 은 이를 "연속형 분포용"이라며 오답으로 처리한다.
- 증거: `sns.histplot(data=df, x='defect_type')` → `pass=false`
- 수정: 지문 3번을 "`seaborn` 의 `countplot` 으로 …"로 바꾼다(SPEC 의 Q2 허용 항목은 countplot/histplot 이므로, 하나만 정답으로 하려면 이름을 밝혀야 한다).

### M-6. mock02 Q6: `dtype` 대안이 좁고(`'int64'` 거부), 지문에 없는 `drop_first` 를 금지
- 증거: `dtype='int64'` → `pass=false`. `drop_first=True` → `pass=false` (불필요한 옵션 금지). mock01 Q6 은 `'int64'`·`np.int32`·`uint8` 등을 허용하고 `drop_first` 도 허용하므로 회차 간에 기준이 다르다. 지문은 "원-핫 인코딩 … 0과 1의 정수"만 요구하며, `drop_first` 를 써도 Q14 의 `reindex(X.columns)` 로 파이프라인은 그대로 동작한다.
- 수정: `validation_rules[0].params[2].value` 를 mock01 Q6 과 같은 `{"re": "^(int|'int'|'int64'|'int32'|'int8'|'uint8'|np\\.int64|np\\.int32|np\\.int8|np\\.uint8)$"}` 로 바꾼다. `drop_first` 금지를 유지하려면 지문 1번에 "`drop_first` 는 쓰지 마시오(모든 범주의 더미를 남김)"를 덧붙인다.

### M-7. mock02 Q11: 입력 shape·출력 노드의 동치 표현이 거부되고, 회차 간 기준이 다름
- 증거: `Input(shape=(X_train_scaled.shape[-1],))` → `pass=false` (mock01 은 허용). `Input(shape=(X_train.shape[1],))` → `pass=false` (mock03 은 허용). `Dense(len(le.classes_), activation='softmax')` → `pass=false` (skeleton 이 `n_classes = len(le.classes_)` 를 정의하므로 완전히 같은 값). `loss=tf.keras.losses.SparseCategoricalCrossentropy()` → `pass=false`.
- 수정: Input 대안을 `["(X_train_scaled.shape[1],)", "(X_train_scaled.shape[-1],)", "(X_train.shape[1],)", "(X.shape[1],)", "(12,)"]` 로, 출력층 units 대안을 `["n_classes", "3", "len(le.classes_)"]` 로 바꾸고, loss 대안에 `{"contains":"SparseCategoricalCrossentropy("}` 를 추가한다. 세 회차의 Input 대안을 같은 목록으로 통일할 것을 권한다.

### M-8. mock02 Q11 해설·negative_tests: 오류 메시지가 Keras 2 의 문구임
- 원문(explanation): "학습이 시작되자마자 `Shapes (32, 1) and (32, 3) are incompatible` 오류가 납니다. 이 메시지를 보면 `sparse_` 를 붙이십시오." negative_tests[1].reason 도 같은 문구다.
- 실제(Keras 3.15.1): `ValueError: Arguments 'target' and 'output' must have the same rank (ndim). Received: target.shape=(32,), output.shape=(32, 3)`. 교재의 expected_output(summary 표)은 Keras 3 기준이므로 같은 환경의 학습자는 다른 메시지를 보게 된다.
- 수정: "Keras 3 에서는 `Arguments target and output must have the same rank`, Keras 2 에서는 `Shapes (32, 1) and (32, 3) are incompatible` 오류가 납니다. 둘 다 정수 라벨과 원-핫용 loss 가 맞지 않는다는 뜻이므로 `sparse_` 를 붙이십시오."로 바꾸고, neg reason 도 같은 방식으로 고친다.

### M-9. mock03 Q3: 동치 표현이 거부됨 (`include=['int64','float64']`, `sns.heatmap(data=corr, …)`)
- 증거: 둘 다 `pass=false`. 두 빈칸(`include=___`, `sns.heatmap(___, …)`)은 모두 자유 형식이다.
- 수정: select_dtypes 의 include 대안에 `"['int64','float64']"`, `"['float64','int64']"` 를 추가한다. heatmap 규칙의 params[0] 을 `{"kw":"data","pos":0,"value":"corr"}` 로 바꾼다(mock01 Q3 과 같은 형태).

### M-10. mock03 Q5 해설의 제거 행 수가 expected_output 과 다름
- 원문: "이 데이터에서는 `production_units` 에 1500 이상의 값 12개가 섞여 있어 제거됩니다." 실제로는 lower=287.6, upper=712.6 이라 **31행**이 제거된다(2000→1969, expected_output `(1969, 8)`). 원래 분포의 꼬리 값 19행도 같이 제거되는데, 해설만 읽으면 12행이 제거된다고 오해한다.
- 수정: "이 데이터에서는 1500 이상의 센서 오류 값 12개와 함께 정상 분포의 양 끝 값 19개도 경계(약 288~713) 밖이라 함께 제거되어 31행이 줄어듭니다(2000 → 1969)."

### M-11. mock03 Q7 해설: "MinMaxScaler 도 정답으로 인정"은 채점기와 모순
- 원문: "`MinMaxScaler` 도 정답으로 인정되지만 이 모의고사는 `StandardScaler` 로 통일합니다." 실제로는 `scaler = MinMaxScaler()` → `pass=false` (스케일러 생성)이고, 지문도 `StandardScaler` 를 지정한다.
- 수정: "`MinMaxScaler` 도 일반적으로 쓸 수 있지만, 이 문항은 `StandardScaler` 를 지정했으므로 다른 스케일러는 오답입니다."

### M-12. mock03 Q11: "활성화 함수 없음"을 그대로 쓴 `Dense(1, activation=None)`/`'linear'` 가 오답 처리됨
- 증거: 둘 다 `pass=false` (출력층: 노드 1개·활성화 없음). 규칙이 `activation` 인자의 존재 자체를 막는다(`absent: true`). 해설은 "`Dense(1)` 은 기본이 선형 출력(`activation=None`)"이라고 설명하므로 해설과 규칙이 어긋난다.
- 수정: `validation_rules[3]` 의 activation 파라미터를 `{"kw":"activation","value":["None","'linear'"]}` 로 바꾸고, 같은 규칙에 `any` 를 써서 `absent` 경우와 묶는다. 또는 `forbid` 규칙(`'sigmoid'`, `'softmax'` 등)에 `'relu'` 를 추가하고 `absent` 조건을 빼는 더 단순한 방법도 있다.

---

## LOW

- **L-1 mock01 Q5 hint**: `.drop` 규칙의 hint 는 "`columns=[...]`(또는 `axis=1`)"이라고 쓰지만, 규칙은 `columns=` 키워드만 받는다. skeleton 이 `columns=[___]` 를 고정하므로 실제 피해는 없다. 수정: "(또는 `axis=1`)" 를 삭제한다.
- **L-2 mock01 Q11 Dropout·은닉 노드 regex 경계**: `Dropout(0.65)`, `Dense(0, …)` 이 통과한다(0.6 초과, 노드 0개). 수정: Dropout 패턴을 `0\\.(0[5-9]\\d*|[1-5]\\d*|60*)` 로, 은닉 노드를 `[1-9]\\d*` 로 바꾼다.
- **L-3 mock01 Q11 해설 수치**: "`Input(shape=(2100, 10))` 처럼 샘플 수를 넣는 것은 틀립니다"라고 쓰지만 실제 학습 행 수는 2087 이다. `(2087, 10)` 으로 맞춘다.
- **L-4 mock01 Q10 해설**: expected_output 에서 DecisionTree 와 XGBoost 행이 `0.7453 / 0.5128` 로 완전히 같다. 실제 실행 결과로 우연히 일치한 것이지만, 학습자는 비교표에 같은 예측을 넣은 실수로 오해하기 쉽다. 해설에 "이 데이터에서는 두 모델의 지표가 우연히 같게 나온다(예측이 서로 다른 행도 있음)" 정도의 한 줄을 넣는다.
- **L-5 mock02 Q11 규칙**: compile metrics 대안에 `['acc']` 가 들어 있다. skeleton 이 `metrics=['accuracy']` 를 고정하므로 지금은 해가 없지만, C-3 과 같은 이유로 `["['accuracy']"]` 로 좁혀 두는 것이 안전하다.
- **L-6 mock03 Q7 규칙 관대함**: X 분리 규칙의 첫 대안이 `{"kw":"columns","pos":0,…}` 라서 `df.drop(['energy_kwh'])`(axis 없음, 실행하면 KeyError)도 통과한다. skeleton 이 `columns=[___]` 를 고정해 실제 피해는 없다. 수정: `pos` 를 빼고 `kw` 만 남긴다.
- **L-7 mock03 Q12 규칙 관대함**: 지문은 "학습의 20%"인데 `validation_split` 을 0.1~0.3 범위로 받는다. `"0.2"` 로 고정하거나 지문을 "10~30%"로 바꾼다.
- **L-8 mock03 Q12 expected_output 형식**: `Epoch 1/100 - 1s 8ms/step - loss: …` 는 실제 Keras 3 로그 형식(`Epoch 1/100` 다음 줄에 `40/40 ━━━ …`)이 아니다. 발췌임을 밝히거나 실제 두 줄 형식으로 바꾼다.
- **L-9 공통 Q1 expected_output**: `<class 'pandas.DataFrame'>` 와 Dtype `str` 은 pandas 3.x 의 출력이다. pandas 2.x(시험장·대부분의 로컬)에서는 `pandas.core.frame.DataFrame` 과 `object` 로 나온다. mock01 해설만 "object/str"을 병기하므로, mock02·mock03 Q1 해설에도 "pandas 버전에 따라 `object` 로 표시됨"을 한 줄 넣는다.
- **L-10 공통 Q4·Q5 데이터 누수 설명 일관성**: 세 회차 모두 결측 대체 통계(중앙값·평균)와 IQR 경계를 분리 **전** 전체 데이터에서 계산한다. 이는 시험 표준 흐름이라 코드를 바꿀 필요는 없다. 다만 Q7 이 "평가 데이터의 정보가 변환 규칙에 섞이지 않도록"을 강조하므로, 한 회차(예: mock01 Q4) 해설에 "엄밀히는 대체값도 학습 데이터로만 구하는 것이 원칙이나, 시험에서는 지시대로 전체 데이터에 적용한다"는 한 줄을 넣어 개념 충돌을 막는다.

---

## 파이프라인 논리 점검 결과 (이상 없음 항목)

- 세 회차 모두 Q1→Q14 변수 정의 순서, 타깃의 X 제외, 분리 후 스케일링(fit 은 train 만), Q14 신규 샘플의 `get_dummies → reindex(X.columns, fill_value=0) → scaler.transform` 사슬이 맞다. 회귀(mock03)에서는 stratify 를 금지하고, Q14 에서 신규 샘플 한 행에 `drop_first` 를 쓰지 않는 처리도 올바르다.
- mock02 의 클래스 번호↔이름 대응(`LabelEncoder` 알파벳 순 0=normal, 1=overheat, 2=wear)이 Q6 출력, Q8 `target_names`, Q14 `inverse_transform` 에서 일관된다.
- Q14 신규 샘플의 컬럼이 학습 컬럼과 정렬 가능함을 확인했다: mock01 6→10, mock02 8→12, mock03 7→9(`line_B`, `shift_night` = 1).
- 해설의 수치(혼동행렬→accuracy, precision/recall, summary 파라미터 수, RMSE²≈MSE, EarlyStopping 종료 epoch = 최적 epoch + patience)는 위에 적은 항목을 빼면 모두 expected_output 과 맞다.
- 범위 밖 내용, `input_shape=` 사용, `.keras` 가 아닌 저장 형식은 없다.
