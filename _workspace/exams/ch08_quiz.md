---
chapter: 8
title: "Ch08 확인 문제 — 문제 유형별 완성 코드와 시험장 전략"
items: 5
types: { 객관식: 1, 코드빈칸: 2, 오류찾기: 2 }
---

# Ch08 확인 문제 — 문제 유형별 완성 코드와 시험장 전략

> 본 문제는 공개된 출제 기준에 따른 유형 연습 문제입니다. 기출 원문이 아닙니다.
>
> 이 챕터에는 **새로운 개념이 없습니다.** 모든 문항은 Ch02~Ch07에서 익힌 조각을
> **유형 판정 → 네 곳(출력층 / loss / metrics / 예측 변환) 교체**로 이어 붙이는 능력을 묻습니다.
>
> 총 5문항 (객관식 1 / 코드 빈칸 2 / 오류 찾기 2), 권장 소요 시간 25분.
> 공통 import는 다음과 같다고 가정합니다.
>
> ```python
> import numpy as np
> import tensorflow as tf
> from tensorflow.keras.models import Sequential
> from tensorflow.keras.layers import Input, Dense, Dropout
> from tensorflow.keras.callbacks import EarlyStopping
> from sklearn.model_selection import train_test_split
> from sklearn.preprocessing import StandardScaler
> ```

---

## 문제

### Q1. (객관식 · 응용) 유형 판정과 교체 지점

서로 다른 세 문제의 `y_train`을 확인한 결과가 다음과 같습니다.

```python
# 데이터 A
print(y_train[:8])              # [1 1 1 1 1 1 1 0]
print(y_train.dtype)            # int64
print(len(np.unique(y_train)))  # 2

# 데이터 B
print(y_train[:8])              # [0 0 0 0 1 0 2 1]
print(y_train.dtype)            # int64
print(len(np.unique(y_train)))  # 3

# 데이터 C
print(y_train[:8])              # [208. 261. 179. 258. 262.  51. 237.  71.]
print(y_train.dtype)            # float64
print(len(np.unique(y_train)))  # 192
```

세 데이터에 대한 설명 중 **옳은 것**은?

1. A는 서로 다른 값이 2개이므로 출력층을 `Dense(2, activation='softmax')`, loss를 `binary_crossentropy`로 둔다.
2. B는 정수 라벨 3클래스이므로 출력층은 `Dense(3, activation='softmax')`, loss는 `sparse_categorical_crossentropy`, 예측 변환은 `np.argmax(pred, axis=1)`이다.
3. B는 라벨을 먼저 원-핫 인코딩해야 하며, 그렇게 바꾼 뒤에도 loss는 `sparse_categorical_crossentropy`를 그대로 유지한다.
4. C는 서로 다른 값이 192개로 많으므로 출력층을 `Dense(192, activation='softmax')`로 두고 `sparse_categorical_crossentropy`로 다중분류 처리한다.
5. C는 회귀이므로 출력층은 `Dense(1, activation='sigmoid')`, loss는 `'mse'`, metrics는 `['accuracy']`로 둔다.

---

### Q2. (코드 빈칸 · 기본) 이진분류 골격을 다중분류로 교체하기

아래는 이진분류 기준으로 외워 둔 **공통 골격**입니다.
클래스가 3개이고 라벨이 정수(`0/1/2`)인 와인 품종 데이터에 맞게 `(가)`~`(라)`를 채우십시오.
`# 그대로` 주석이 붙은 줄은 유형이 바뀌어도 손대지 않는 부분입니다.

```python
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.datasets import load_wine
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix

np.random.seed(42)
tf.random.set_seed(42)

X, y = load_wine(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42, stratify=y)          # 그대로
scaler = StandardScaler()                                       # 그대로
X_train_scaled = scaler.fit_transform(X_train)                  # 그대로
X_test_scaled = scaler.transform(X_test)                        # 그대로

n_classes = ______(가)______          # 클래스 개수를 데이터에서 뽑습니다
print('클래스 수:', n_classes)

model = Sequential()
model.add(Input(shape=(X_train_scaled.shape[1],)))              # 그대로
model.add(Dense(64, activation='relu'))                         # 그대로
model.add(Dropout(0.3))                                         # 그대로
model.add(Dense(32, activation='relu'))                         # 그대로
model.add(______(나)______)                                      # ★교체 (1) 출력층

model.compile(optimizer='adam',
              loss=______(다)______,                             # ★교체 (2) 손실 함수
              metrics=['accuracy'])                             # ★교체 (3)

es = EarlyStopping(monitor='val_loss', patience=5,
                   restore_best_weights=True)                   # 그대로
history = model.fit(X_train_scaled, y_train, epochs=100, batch_size=16,
                    validation_split=0.2, callbacks=[es], verbose=0)   # 그대로

loss, acc = model.evaluate(X_test_scaled, y_test, verbose=0)
print('test loss:', round(loss, 4), '/ test accuracy:', round(acc, 4))

pred = model.predict(X_test_scaled, verbose=0)
print('predict shape:', pred.shape, '/ 한 행의 합:', round(float(pred[0].sum()), 3))
y_pred = ______(라)______                                        # ★교체 (4) 예측 변환

print(classification_report(y_test, y_pred))
print(confusion_matrix(y_test, y_pred))
```

추가로, `(다)`의 metrics를 `['accuracy']` 그대로 두어도 되는 이유와, `n_classes`를 숫자 `3`으로 직접 적지 않는 이유를 각각 한 줄로 쓰십시오.

---

### Q3. (코드 빈칸 · 기본) 같은 골격을 회귀로 교체하기

이번에는 타깃이 연속값(`151. 75. 141. ...`)인 회귀 문제입니다.
Q2와 **완전히 같은 골격**에서 `(가)`~`(마)`만 바꾸십시오.

```python
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.datasets import load_diabetes
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

np.random.seed(42)
tf.random.set_seed(42)

X, y = load_diabetes(return_X_y=True)
print('타깃 앞 5개:', y[:5], '/ dtype:', y.dtype)      # 유형 판정

# (가) 이진·다중분류에서 쓰던 인자 하나를 반드시 빼야 합니다
X_train, X_test, y_train, y_test = ______(가)______

scaler = StandardScaler()                                       # 그대로
X_train_scaled = scaler.fit_transform(X_train)                  # 그대로
X_test_scaled = scaler.transform(X_test)                        # 그대로

model = Sequential()
model.add(Input(shape=(X_train_scaled.shape[1],)))              # 그대로
model.add(Dense(64, activation='relu'))                         # 그대로
model.add(Dropout(0.3))                                         # 그대로
model.add(Dense(32, activation='relu'))                         # 그대로
model.add(______(나)______)                                      # ★교체 (1) 출력층

model.compile(optimizer='adam',
              loss=______(다-1)______,                           # ★교체 (2)
              metrics=______(다-2)______)                        # ★교체 (3)

es = EarlyStopping(monitor='val_loss', patience=10,
                   restore_best_weights=True)                   # 그대로
history = model.fit(X_train_scaled, y_train, epochs=200, batch_size=32,
                    validation_split=0.2, callbacks=[es], verbose=0)   # 그대로
print('history 키:', list(history.history.keys()))

loss, metric = model.evaluate(X_test_scaled, y_test, verbose=0)
print('keras mse:', round(loss, 2), '/ keras mae:', round(metric, 2))

y_pred = ______(라)______                                        # ★교체 (4) 예측 변환
print('예측 shape:', y_pred.shape, '/ 정답 shape:', y_test.shape)

# (마) 회귀 지표 세 줄
print('mse:', round(______(마-1)______, 2))
print('mae:', round(______(마-2)______, 2))
print('r2 :', round(______(마-3)______, 4))
```

추가로, `print('history 키:', ...)`가 무엇을 출력하는지와, 그것을 확인해야 하는 이유를 쓰십시오.

---

### Q4. (오류 찾기 · 기본) loss만 바꾸고 출력층을 그대로 둔 코드

수험생 B는 이진분류 문제로 만들어 둔 코드를 **3클래스 다중분류** 문제에 재사용하면서
"loss만 다중분류용으로 바꾸면 되겠지"라고 생각해 아래처럼 작성했습니다.

```python
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense
from sklearn.datasets import load_wine
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

X, y = load_wine(return_X_y=True)          # 클래스 3개, 정수 라벨 0/1/2
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42, stratify=y)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

model = Sequential()
model.add(Input(shape=(X_train_scaled.shape[1],)))
model.add(Dense(64, activation='relu'))
model.add(Dense(1, activation='sigmoid'))                     # 이진분류 코드 그대로
model.compile(optimizer='adam',
              loss='sparse_categorical_crossentropy',         # loss만 교체
              metrics=['accuracy'])

history = model.fit(X_train_scaled, y_train, epochs=10, verbose=0)
```

다음 세 가지에 답하십시오.

1. 오류는 **어느 단계**(모델 구성 / 컴파일 / 학습)에서 발생합니까?
2. 오류 메시지의 핵심 문구는 무엇이며, 그것이 왜 나오는지 설명하십시오.
3. 수정한 전체 코드를 쓰십시오.

---

### Q5. (오류 찾기 · 응용) 회귀 코드의 세 가지 실수

아래는 연속 타깃(`y`의 값은 25~346 범위의 실수)을 예측하는 회귀 코드입니다.
**잘못된 곳이 세 군데** 있습니다. 각각을 지적하고 수정한 전체 코드를 쓰십시오.
세 오류 중 하나만 실행을 중단시키고, 나머지 둘은 **오류 없이 조용히 모델을 망가뜨린다**는 점에 유의하십시오.

```python
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense, Dropout
from sklearn.datasets import load_diabetes
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

X, y = load_diabetes(return_X_y=True)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42, stratify=y)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

model = Sequential()
model.add(Input(shape=(X_train_scaled.shape[1],)))
model.add(Dense(64, activation='relu'))
model.add(Dense(32, activation='relu'))
model.add(Dense(1, activation='sigmoid'))

model.compile(optimizer='adam', loss='mse', metrics=['accuracy'])

history = model.fit(X_train_scaled, y_train, epochs=30, batch_size=32,
                    validation_split=0.2, verbose=0)

y_pred = model.predict(X_test_scaled, verbose=0).flatten()
print('r2 :', round(r2_score(y_test, y_pred), 4))
```

---

## 해답 및 해설

### Q1 해답

**정답: 2번**

**정답 코드 (실증 예제 — 세 데이터의 유형을 판정하는 두 줄)**

```python
import numpy as np
from sklearn.datasets import load_breast_cancer, load_wine, load_diabetes
from sklearn.model_selection import train_test_split

for name, loader, strat in [('A', load_breast_cancer, True),
                            ('B', load_wine, True),
                            ('C', load_diabetes, False)]:
    X, y = loader(return_X_y=True)
    kw = dict(test_size=0.3, random_state=42)
    if strat:
        kw['stratify'] = y
    _, _, y_train, _ = train_test_split(X, y, **kw)
    print(f'[{name}] y_train[:8] = {y_train[:8]} | dtype={y_train.dtype} '
          f'| 서로 다른 값={len(np.unique(y_train))}')
```

```
[A] y_train[:8] = [1 1 1 1 1 1 1 0] | dtype=int64 | 서로 다른 값=2
[B] y_train[:8] = [0 0 0 0 1 0 2 1] | dtype=int64 | 서로 다른 값=3
[C] y_train[:8] = [208. 261. 179. 258. 262.  51. 237.  71.] | dtype=float64 | 서로 다른 값=192
```

**왜 이렇게 푸는가**

유형 판정의 근거는 **타깃의 dtype과 서로 다른 값의 개수** 두 가지뿐입니다. 판정이 끝나면 교체할 곳은 네 군데로 정해집니다.

| | A (이진분류) | B (다중분류, 정수 라벨) | C (회귀) |
|---|---|---|---|
| 출력층 | `Dense(1, activation='sigmoid')` | `Dense(3, activation='softmax')` | `Dense(1)` 활성화 없음 |
| loss | `'binary_crossentropy'` | `'sparse_categorical_crossentropy'` | `'mse'` |
| metrics | `['accuracy']` | `['accuracy']` | `['mae']` |
| 예측 변환 | `(pred > 0.5).astype(int).flatten()` | `np.argmax(pred, axis=1)` | `pred.flatten()` |

2번은 이 표의 B 열을 그대로 옮긴 것이므로 옳습니다.

**자주 틀리는 지점**

- **1번 — 이진분류에 `Dense(2, 'softmax')`를 쓰고 loss는 `binary_crossentropy`로 두는 것.** 출력층과 loss가 짝이 맞지 않습니다. 이진분류의 표준은 `Dense(1, 'sigmoid')` + `binary_crossentropy` 한 짝입니다. (`Dense(2, 'softmax')` + `sparse_categorical_crossentropy`로 푸는 것도 이론적으로는 가능하지만, 시험 표준 패턴에서 벗어나고 실수만 늘어납니다.)
- **3번 — 라벨 형태를 바꾸면서 loss를 그대로 두는 것.** 원-핫으로 바꾸면 loss도 `categorical_crossentropy`로 함께 바뀌어야 합니다. 정수 라벨을 원-핫으로 바꿀 이유도 없습니다. **정수 라벨이면 `sparse_`, 원-핫이면 `sparse_` 없이** — 출력층은 둘 다 `Dense(K, 'softmax')`로 같습니다(Ch05 `ch05_loss-decision`).
- **4번 — 값의 종류가 많다고 다중분류로 처리하는 것.** dtype이 `float64`이고 값이 대부분 서로 다르면 회귀입니다. 값의 개수가 아니라 **값의 성질**(순서와 크기의 의미가 있는가)이 기준입니다.
- **5번 — 회귀 출력층에 `sigmoid`를 붙이는 것.** 이 챕터에서 가장 위험한 실수입니다. sigmoid는 출력을 0~1로 눌러 버리므로 타깃이 208·261 같은 값이면 예측이 영원히 1을 넘지 못합니다. 오류가 나지 않으므로 알아채기 어렵습니다(Q5에서 실제 수치로 확인합니다). metrics도 `['accuracy']`가 아니라 `['mae']`입니다.

---

### Q2 해답

**정답 코드**

```python
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.datasets import load_wine
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix

np.random.seed(42)
tf.random.set_seed(42)

X, y = load_wine(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42, stratify=y)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

n_classes = len(np.unique(y_train))                          # (가)
print('클래스 수:', n_classes)

model = Sequential()
model.add(Input(shape=(X_train_scaled.shape[1],)))
model.add(Dense(64, activation='relu'))
model.add(Dropout(0.3))
model.add(Dense(32, activation='relu'))
model.add(Dense(n_classes, activation='softmax'))            # (나)

model.compile(optimizer='adam',
              loss='sparse_categorical_crossentropy',        # (다)
              metrics=['accuracy'])

es = EarlyStopping(monitor='val_loss', patience=5,
                   restore_best_weights=True)
history = model.fit(X_train_scaled, y_train, epochs=100, batch_size=16,
                    validation_split=0.2, callbacks=[es], verbose=0)
print('학습한 epoch 수:', len(history.history['loss']))

loss, acc = model.evaluate(X_test_scaled, y_test, verbose=0)
print('test loss:', round(loss, 4), '/ test accuracy:', round(acc, 4))

pred = model.predict(X_test_scaled, verbose=0)
print('predict shape:', pred.shape, '/ 한 행의 합:', round(float(pred[0].sum()), 3))
y_pred = np.argmax(pred, axis=1)                             # (라)
print('y_pred shape:', y_pred.shape, '/ 앞 8개:', y_pred[:8])

print(classification_report(y_test, y_pred))
print(confusion_matrix(y_test, y_pred))
```

```
클래스 수: 3
학습한 epoch 수: 47
test loss: 0.081 / test accuracy: 0.9815
predict shape: (54, 3) / 한 행의 합: 1.0
y_pred shape: (54,) / 앞 8개: [0 1 0 0 0 0 2 1]
              precision    recall  f1-score   support

           0       1.00      1.00      1.00        18
           1       1.00      0.95      0.98        21
           2       0.94      1.00      0.97        15

    accuracy                           0.98        54
   macro avg       0.98      0.98      0.98        54
weighted avg       0.98      0.98      0.98        54

[[18  0  0]
 [ 0 20  1]
 [ 0  0 15]]
```

> 학습한 epoch 수와 loss·accuracy는 실행할 때마다 달라집니다(EarlyStopping이 멈추는 시점이 다르기 때문입니다. 검증 시 epoch 47, accuracy 0.98 부근).
> 환경과 무관하게 항상 같은 값은 **클래스 수 3 / `predict` shape `(54, 3)` / 행 합 1.0 / `y_pred` shape `(54,)` / 3×3 혼동 행렬**입니다.

**추가 질문 답**

- **metrics를 `['accuracy']`로 두어도 되는 이유:** 다중분류도 "맞혔다/틀렸다"를 셀 수 있는 분류 문제이므로 정확도가 그대로 의미를 가집니다. metrics가 바뀌는 것은 **회귀뿐**(`['mae']`)입니다.
- **`n_classes`를 숫자 3으로 직접 적지 않는 이유:** 시험장에서 클래스 수를 눈으로 세다 틀리는 사고를 막기 위해서입니다. 라벨이 1부터 시작하거나 중간 번호가 비어 있는 데이터에서 특히 자주 어긋납니다.

**왜 이렇게 푸는가**

이진분류 골격에서 실제로 손댄 곳은 **세 줄**뿐입니다.

| 교체 지점 | 이진분류 | → 다중분류 |
|---|---|---|
| (1) 출력층 | `Dense(1, 'sigmoid')` | `Dense(n_classes, 'softmax')` |
| (2) loss | `'binary_crossentropy'` | `'sparse_categorical_crossentropy'` |
| (4) 예측 변환 | `(pred > 0.5).astype(int).flatten()` | `np.argmax(pred, axis=1)` |

`# 그대로` 주석이 붙은 줄들 — 분리, 스케일링, `Input`, 은닉층, `Dropout`, `EarlyStopping`, `fit` — 은 한 글자도 바뀌지 않았습니다. **바뀌지 않는 부분이 훨씬 많다**는 사실이 이 챕터의 핵심입니다.

`predict shape: (54, 3)`과 `한 행의 합: 1.0` 두 줄은 출력층이 제대로 교체되었는지 확인하는 점검 코드입니다. 열이 3개이고 행 합이 1이면 softmax가 정상 동작한 것입니다. 만약 shape가 `(54, 1)`로 나온다면 출력층 교체를 빠뜨린 것입니다.

**자주 틀리는 지점**

- **출력층은 바꿨는데 예측 변환을 `(pred > 0.5)`로 두는 것.** `(54, 3)` 확률 배열에 임계값을 걸면 0/1로 채워진 `(54, 3)` 배열이 나오고, 그대로 `classification_report`에 넣으면 정답 `(54,)`와 모양이 맞지 않아 오류가 납니다.
- **`np.argmax(pred)`처럼 축을 빠뜨리는 것.** 배열 전체에서 최댓값 하나의 인덱스(정수 하나)가 나옵니다. **다중분류 = `axis=1`** 로 묶어 외우십시오.
- **정수 라벨인데 `categorical_crossentropy`(`sparse_` 없이)를 쓰는 것.** 라벨 shape가 맞지 않아 학습 단계에서 오류가 납니다. 원-핫으로 바꿔 두지 않았다면 언제나 `sparse_`가 붙습니다.

---

### Q3 해답

**정답 코드**

```python
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.datasets import load_diabetes
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

np.random.seed(42)
tf.random.set_seed(42)

X, y = load_diabetes(return_X_y=True)
print('타깃 앞 5개:', y[:5], '/ dtype:', y.dtype)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42)                     # (가) stratify 제거

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

model = Sequential()
model.add(Input(shape=(X_train_scaled.shape[1],)))
model.add(Dense(64, activation='relu'))
model.add(Dropout(0.3))
model.add(Dense(32, activation='relu'))
model.add(Dense(1))                                           # (나) 활성화 없음

model.compile(optimizer='adam',
              loss='mse',                                     # (다-1)
              metrics=['mae'])                                # (다-2)

es = EarlyStopping(monitor='val_loss', patience=10,
                   restore_best_weights=True)
history = model.fit(X_train_scaled, y_train, epochs=200, batch_size=32,
                    validation_split=0.2, callbacks=[es], verbose=0)
print('학습한 epoch 수:', len(history.history['loss']))
print('history 키:', list(history.history.keys()))

loss, metric = model.evaluate(X_test_scaled, y_test, verbose=0)
print('keras mse:', round(loss, 2), '/ keras mae:', round(metric, 2))

y_pred = model.predict(X_test_scaled, verbose=0).flatten()    # (라)
print('예측 shape:', y_pred.shape, '/ 정답 shape:', y_test.shape)

print('mse:', round(mean_squared_error(y_test, y_pred), 2))   # (마-1)
print('mae:', round(mean_absolute_error(y_test, y_pred), 2))  # (마-2)
print('r2 :', round(r2_score(y_test, y_pred), 4))             # (마-3)
```

```
타깃 앞 5개: [151.  75. 141. 206. 135.] / dtype: float64
학습한 epoch 수: 152
history 키: ['loss', 'mae', 'val_loss', 'val_mae']
keras mse: 3093.58 / keras mae: 43.6
예측 shape: (133,) / 정답 shape: (133,)
mse: 3093.58
mae: 43.6
r2 : 0.4269
```

> epoch 수·mse·mae·r2는 실행할 때마다 달라집니다(검증 시 epoch 152, r2 0.43 부근).
> 항상 같은 것은 **`history` 키 4개(`loss`·`mae`·`val_loss`·`val_mae`)와 예측/정답 shape가 둘 다 `(133,)`이라는 점**, 그리고 **`evaluate`의 loss와 sklearn `mean_squared_error` 값이 정확히 일치한다**는 점입니다.

**추가 질문 답**

`print('history 키:', ...)`는 `['loss', 'mae', 'val_loss', 'val_mae']`를 출력합니다.
분류에서 쓰던 `accuracy`·`val_accuracy` 키가 **없습니다.** 학습 곡선을 그릴 때 습관적으로 `history.history['accuracy']`를 쓰면 `KeyError: 'accuracy'`가 나므로, 곡선을 그리기 전에 키 이름을 먼저 확인해야 합니다.

**왜 이렇게 푸는가**

- **(가) `stratify` 제거** — `stratify`는 "각 클래스 비율을 유지하며 나누라"는 지시입니다. 타깃이 연속값이면 나눌 클래스가 없으므로 `ValueError`가 납니다(Q5 참조). 회귀에서는 인자를 통째로 뺍니다.
- **(나) `Dense(1)`** — 회귀의 정답은 실수 하나이므로 노드 1개, 그리고 **활성화 인자를 아예 적지 않습니다.** relu를 붙이면 음수를 예측할 수 없게 되고, sigmoid를 붙이면 0~1에 갇힙니다.
- **(다) `loss='mse'`, `metrics=['mae']`** — 회귀는 "맞혔다/틀렸다"가 없으므로 accuracy를 쓸 수 없습니다. mse는 학습에 쓰기 좋지만 단위가 타깃의 제곱이라 읽기 어려우므로, 해석용으로 mae를 함께 봅니다. `keras mae: 43.6`은 "평균적으로 43.6만큼 빗나간다"로 바로 읽힙니다.
- **(라) `.flatten()`** — `predict` 결과는 `(133, 1)`, `y_test`는 `(133,)`입니다. 모양을 맞춰 두면 잔차 계산이나 비교표 작성에서 브로드캐스팅 사고가 생기지 않습니다(Ch07).
- **(마)** sklearn 회귀 지표는 모두 **`(정답, 예측)` 순서**입니다.

`keras mse: 3093.58`과 `mse: 3093.58`이 같은 값인 것도 확인 포인트입니다. `loss='mse'`로 컴파일하면 손실 함수 자체가 평가지표이기 때문입니다.

**자주 틀리는 지점**

- **`stratify=y`를 습관적으로 남겨 두는 것.** 이진·다중분류 코드를 복사해 올 때 가장 먼저 걸리는 지점입니다. 다행히 실행이 중단되므로 바로 알아챌 수 있습니다.
- **출력층에 활성화 함수를 붙이는 것.** `Dense(1, activation='relu')`도 흔한 실수입니다. 타깃에 음수가 있으면 그 구간을 영원히 예측하지 못합니다.
- **`metrics=['accuracy']`를 그대로 두는 것.** 오류가 나지 않고 accuracy가 0.0 근처로 찍힙니다. "모델이 완전히 실패했다"고 오해해 멀쩡한 모델을 뜯어고치게 됩니다.
- **`classification_report`를 회귀 결과에 쓰는 것.** 연속값에는 정밀도·재현율 개념이 없습니다. `ValueError: Classification metrics can't handle a mix of continuous and continuous targets` 계열의 오류가 납니다.

---

### Q4 해답

**1. 오류가 발생하는 단계: 학습(`fit`)**

모델 구성과 컴파일은 아무 말 없이 통과합니다. Keras는 컴파일 시점에 loss 이름만 받아 둘 뿐, **라벨의 실제 값 범위는 첫 배치가 흘러들어 오는 학습 단계에서야 확인**하기 때문입니다.

**2. 오류 메시지의 핵심 문구와 원인**

```
InvalidArgumentError: Graph execution error:
...
Received a label value of 2 which is outside the valid range of [0, 1).
  Label values: 2 1 2 2 0 2 0 0 0 1 2 1 ...
```

`sparse_categorical_crossentropy`는 "출력층 노드가 K개이므로 라벨은 0부터 K-1까지"라고 전제합니다. 그런데 출력층이 `Dense(1, 'sigmoid')`라 K가 **1**이고, 허용 범위는 `[0, 1)` — 즉 **0 하나뿐**입니다. 라벨에 들어 있는 `1`과 `2`가 그 범위를 벗어나므로 오류가 납니다.

즉 **loss는 다중분류로 바꿨는데 출력층이 이진분류인 채로 남아 있다**는 것이 원인입니다. 출력층과 loss는 언제나 **짝**으로 움직입니다.

**3. 정답 코드 (오류 재현 + 수정)**

```python
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense
from sklearn.datasets import load_wine
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

np.random.seed(42)
tf.random.set_seed(42)

X, y = load_wine(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42, stratify=y)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# --- 잘못된 코드: 구성·컴파일은 통과하고 fit에서 터집니다 ---
bad = Sequential()
bad.add(Input(shape=(X_train_scaled.shape[1],)))
bad.add(Dense(64, activation='relu'))
bad.add(Dense(1, activation='sigmoid'))
bad.compile(optimizer='adam', loss='sparse_categorical_crossentropy',
            metrics=['accuracy'])
print('구성·컴파일 통과. 출력층:', bad.layers[-1].units,
      bad.layers[-1].activation.__name__)
try:
    bad.fit(X_train_scaled, y_train, epochs=1, verbose=0)
except Exception as e:
    print('오류 종류:', type(e).__name__)
    key = [ln for ln in str(e).split('\n') if 'label value' in ln]
    print('핵심 문구:', key[0].strip()[:80] if key else str(e)[:80])

# --- 수정: 출력층을 클래스 수에 맞춥니다 ---
n_classes = len(np.unique(y_train))
fixed = Sequential()
fixed.add(Input(shape=(X_train_scaled.shape[1],)))
fixed.add(Dense(64, activation='relu'))
fixed.add(Dense(n_classes, activation='softmax'))            # 출력층도 함께 교체
fixed.compile(optimizer='adam', loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])
history = fixed.fit(X_train_scaled, y_train, epochs=10, verbose=0)
print('수정 후 출력층:', fixed.layers[-1].units,
      fixed.layers[-1].activation.__name__)
print('학습 성공, 마지막 loss:', round(history.history['loss'][-1], 4))
```

```
구성·컴파일 통과. 출력층: 1 sigmoid
오류 종류: InvalidArgumentError
핵심 문구: Received a label value of 2 which is outside the valid range of [0, 1).
수정 후 출력층: 3 softmax
학습 성공, 마지막 loss: 0.4103
```

> `마지막 loss` 값은 실행할 때마다 달라집니다(검증 시 0.4~0.7 범위).
> 확인할 것은 **오류 종류(`InvalidArgumentError`)와 핵심 문구, 그리고 수정 후 출력층이 `3 softmax`가 된다**는 점입니다.

**왜 이렇게 푸는가**

이 문항이 중요한 이유는 **오류가 나는 위치와 원인의 위치가 다르다**는 데 있습니다. 메시지는 loss 계산부(`SparseSoftmaxCrossEntropyWithLogits`)에서 나오지만, 고쳐야 할 곳은 **출력층 한 줄**입니다. 메시지가 가리키는 곳을 그대로 고치려 들면 loss를 `binary_crossentropy`로 되돌리게 되고, 그러면 3클래스 문제를 이진분류로 푸는 더 큰 잘못이 됩니다.

`Dense(1, 'sigmoid')`가 만들 수 있는 것은 "클래스 1일 확률" 하나뿐입니다. 클래스가 3개면 **확률이 3개 필요**하므로 노드도 3개여야 하고, 그 3개의 합을 1로 만들어 주는 활성화 함수가 softmax입니다. `n_classes = len(np.unique(y_train))`로 뽑아 쓰면 이 짝이 자동으로 맞습니다.

`print('구성·컴파일 통과. 출력층:', ...)` 한 줄을 넣어 둔 이유도 함께 보십시오. **모델을 만든 직후 출력층의 units와 activation을 찍어 보는 습관**(Ch08 자가 진단 4번)이 이 오류를 학습 전에 잡아냅니다.

**자주 틀리는 지점**

- **loss만 바꾸고 출력층을 그대로 두는 것** — 이 챕터에서 가장 흔한 사고입니다. 반대 방향(출력층만 바꾸고 loss를 그대로 둠)도 똑같이 자주 나옵니다. **두 줄은 한 덩어리**입니다.
- **오류를 보고 `epochs`나 `batch_size`를 조정하는 것.** 학습 설정과는 무관한 오류입니다.
- **`InvalidArgumentError`의 첫 줄이 `Graph execution error:`라서 원인을 못 찾는 것.** 메시지가 길더라도 `label value`, `expected shape`, `found shape` 같은 **키워드 한 개**만 찾아내면 됩니다.

---

### Q5 해답

**잘못된 곳 3군데**

| # | 잘못된 줄 | 성격 |
|---|-----------|------|
| ① | `train_test_split(..., stratify=y)` | **실행 중단** — 연속 타깃에는 계층이 없습니다 |
| ② | `model.add(Dense(1, activation='sigmoid'))` | 조용히 망가짐 — 예측이 0~1에 갇힙니다 |
| ③ | `model.compile(..., metrics=['accuracy'])` | 조용히 망가짐 — 회귀에 무의미한 지표입니다 |

**정답 코드 (오류 재현 + 수정)**

```python
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.datasets import load_diabetes
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

np.random.seed(42)
tf.random.set_seed(42)

X, y = load_diabetes(return_X_y=True)

# --- 오류 ① 재현 ---
try:
    train_test_split(X, y, test_size=0.3, random_state=42, stratify=y)
except ValueError as e:
    print('①', type(e).__name__, ':', str(e)[:70])

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42)                     # stratify 제거
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# --- 오류 ②③ 재현: 오류 없이 실행됩니다 ---
bad = Sequential()
bad.add(Input(shape=(X_train_scaled.shape[1],)))
bad.add(Dense(64, activation='relu'))
bad.add(Dense(32, activation='relu'))
bad.add(Dense(1, activation='sigmoid'))
bad.compile(optimizer='adam', loss='mse', metrics=['accuracy'])
hb = bad.fit(X_train_scaled, y_train, epochs=30, batch_size=32,
             validation_split=0.2, verbose=0)
print('②③ history 키:', list(hb.history.keys()))
print('③ 마지막 accuracy:', round(hb.history['accuracy'][-1], 4))
yp_bad = bad.predict(X_test_scaled, verbose=0).flatten()
print('② 예측값 범위:', round(float(yp_bad.min()), 4), '~', round(float(yp_bad.max()), 4))
print('   실제값 범위:', float(y_test.min()), '~', float(y_test.max()))
print('   r2 :', round(r2_score(y_test, yp_bad), 4))

# --- 수정본 ---
np.random.seed(42)
tf.random.set_seed(42)

model = Sequential()
model.add(Input(shape=(X_train_scaled.shape[1],)))
model.add(Dense(64, activation='relu'))
model.add(Dropout(0.3))
model.add(Dense(32, activation='relu'))
model.add(Dense(1))                                           # ② 활성화 없음
model.compile(optimizer='adam', loss='mse', metrics=['mae'])  # ③ mae

es = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
history = model.fit(X_train_scaled, y_train, epochs=200, batch_size=32,
                    validation_split=0.2, callbacks=[es], verbose=0)
print('수정 history 키:', list(history.history.keys()))

y_pred = model.predict(X_test_scaled, verbose=0).flatten()
print('수정 예측값 범위:', round(float(y_pred.min()), 2), '~', round(float(y_pred.max()), 2))
print('mse:', round(mean_squared_error(y_test, y_pred), 2))
print('mae:', round(mean_absolute_error(y_test, y_pred), 2))
print('r2 :', round(r2_score(y_test, y_pred), 4))
```

```
① ValueError : The least populated classes in y have only 1 member, which is
②③ history 키: ['accuracy', 'loss', 'val_accuracy', 'val_loss']
③ 마지막 accuracy: 0.0
② 예측값 범위: 0.9839 ~ 1.0
   실제값 범위: 37.0 ~ 310.0
   r2 : -4.0042
수정 history 키: ['loss', 'mae', 'val_loss', 'val_mae']
수정 예측값 범위: 30.62 ~ 279.15
mse: 3093.58
mae: 43.6
r2 : 0.4269
```

> 학습에 의존하는 수치는 실행할 때마다 달라집니다(검증 시 잘못된 코드 r2 -4.00, 수정본 r2 0.43 부근).
> 실행 환경과 무관하게 반드시 나타나는 신호는 셋입니다. **① `ValueError` / ② 예측값이 1을 넘지 못함 → r2가 크게 음수 / ③ accuracy가 0.0 고정.**

**왜 이렇게 푸는가**

**① `stratify`는 분류 전용 인자입니다.** "각 클래스 비율을 유지하며 나누라"는 지시인데, 연속 타깃은 값이 거의 다 다르므로 sklearn이 각 값을 하나의 클래스로 보고 "구성원이 1명뿐인 클래스가 있어 나눌 수 없다"는 `ValueError`를 냅니다. 세 오류 중 유일하게 **친절한** 오류입니다.

**② sigmoid는 출력을 0~1로 누릅니다.** 타깃 범위는 37~310인데 예측값 범위는 `0.9839 ~ 1.0`입니다. 모델이 아무리 학습해도 1을 넘을 수 없으므로, 손실을 줄이는 유일한 방법이 "전부 최댓값 1로 밀어붙이기"가 된 것입니다. 그 결과 r2가 **-4.0042** — 음수라는 것은 **타깃의 평균값으로 찍는 것보다도 못하다**는 뜻입니다. 오류 메시지는 전혀 나오지 않습니다.

**③ 회귀에 accuracy는 의미가 없습니다.** accuracy는 "예측값과 정답이 정확히 같은 비율"을 세는데, 실수 예측이 소수점까지 정확히 일치할 일은 없으므로 `0.0`이 나옵니다. 모델 성능과 무관한 숫자입니다. 회귀의 보조 지표는 `['mae']`입니다.

수정 후 예측값 범위가 `30.62 ~ 279.15`로 실제값 범위와 겹치고 r2가 양수(0.4269)로 돌아온 것이 세 수정이 모두 반영되었다는 증거입니다.

**자주 틀리는 지점**

- **①만 고치고 실행이 되니 끝났다고 판단하는 것.** ①은 실행을 멈춰 주지만 ②③은 멈추지 않습니다. **"오류가 없다 = 맞다"가 아닙니다.** 회귀에서는 반드시 **예측값의 범위**를 실제값 범위와 비교해 보십시오. 이 한 줄이 ②를 즉시 잡아냅니다.
- **r2가 음수인 것을 보고 "데이터가 어렵다"로 넘기는 것.** r2가 0 부근이면 데이터 문제일 수 있지만, **-4처럼 크게 음수면 코드가 잘못된 것**입니다.
- **회귀 출력층에 `relu`를 붙이는 것.** sigmoid만큼 극적이지는 않지만 음수 구간을 예측할 수 없게 됩니다. 회귀 출력층은 `Dense(1)`, 활성화 인자 자체를 적지 않습니다.
- **`metrics`를 확인하지 않고 학습 곡선을 그리는 것.** ③을 고치면 `history` 키가 `accuracy`에서 `mae`로 바뀝니다. `print(history.history.keys())`를 먼저 찍는 습관이 `KeyError`를 막습니다.

---

<!-- verified: 2026-07-28 python3 3.13.5 / tensorflow 2.21.0 (Keras 3) / scikit-learn 1.9.0 / numpy 2.5.0 — Q1~Q5 해답 코드 전량 무오류 실행(exit 0).
     환경 무관 고정값(검증됨): Q1 A[1 1 1 1 1 1 1 0]/int64/2, B[0 0 0 0 1 0 2 1]/int64/3, C[208. 261. ...]/float64/192 / Q2 n_classes 3·predict shape (54,3)·행 합 1.0·y_pred shape (54,)·3x3 혼동 행렬 / Q3 history 키 ['loss','mae','val_loss','val_mae']·예측/정답 shape 둘 다 (133,)·evaluate loss == sklearn mean_squared_error 동일값(3093.58) / Q4 구성·컴파일 통과 후 fit에서 InvalidArgumentError, 핵심 문구 "Received a label value of 2 which is outside the valid range of [0, 1)." 확인·수정 후 출력층 '3 softmax' / Q5 ① ValueError "The least populated classes in y have only 1 member..."·② sigmoid 출력 예측 범위 0.9839~1.0 vs 실제 37.0~310.0·③ history 키에 accuracy 포함, 마지막 accuracy 0.0.
     학습 의존 수치(실행마다 변동, 게재값은 검증 1회 기준): Q2 epoch 47/test accuracy 0.9815, Q3 epoch 152/mse 3093.58/mae 43.6/r2 0.4269, Q4 수정 후 마지막 loss 0.4103(0.4~0.7 변동), Q5 잘못된 코드 r2 -4.0042/수정본 r2 0.4269. 모든 게재 수치에 "실행할 때마다 달라집니다" 주석 병기함.
     딥러닝 학습 검증 조건: Q2 epochs=100 + EarlyStopping(patience=5), Q3/Q5 수정본 epochs=200 + EarlyStopping(patience=10), Q5 잘못된 코드 epochs=30(콜백 없음), Q4 epochs=1(오류 재현)·10(수정 확인) — 모두 문제지 게재값 그대로 실행하여 검증(축소 미적용). -->
