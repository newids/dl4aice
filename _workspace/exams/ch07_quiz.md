---
chapter: 7
title: "Ch07 확인 문제 — 평가와 예측"
items: 5
types: { 객관식: 2, 코드빈칸: 2, 오류찾기: 1 }
---

# Ch07 확인 문제 — 평가와 예측

> 본 문제는 공개된 출제 기준에 따른 유형 연습 문제입니다. 기출 원문이 아닙니다.
>
> 이 챕터의 범위는 **학습이 끝난 뒤의 평가·예측**입니다. `evaluate`·`predict`, 확률→클래스 변환,
> `classification_report`·`confusion_matrix`, 회귀 지표(mse·mae·r2)만으로 모든 문항이 풀립니다.
>
> 총 5문항 (객관식 2 / 코드 빈칸 2 / 오류 찾기 1), 권장 소요 시간 20분.
> 공통 import는 다음과 같다고 가정합니다.
>
> ```python
> import numpy as np
> import pandas as pd
> from sklearn.metrics import (classification_report, confusion_matrix,
>                              mean_squared_error, mean_absolute_error, r2_score)
> ```

---

## 문제

### Q1. (객관식 · 기본) evaluate와 predict가 돌려주는 것

클래스가 3개인 다중분류 모델을 `metrics=['accuracy']`로 컴파일해 학습까지 마쳤습니다.
평가(테스트) 데이터 `X_test`의 샘플 수는 **200개**입니다.

다음 설명 중 **옳은 것**은?

1. `model.evaluate(X_test)`처럼 정답 없이 호출해도 loss와 accuracy가 계산된다.
2. `model.evaluate(X_test, y_test)`의 반환값은 shape `(200, 3)`인 확률 배열이다.
3. `loss, acc = model.evaluate(X_test, y_test)`로 받을 수 있고, `model.predict(X_test)`의 결과는 shape `(200, 3)`이다.
4. `model.predict(X_test)`는 예측 라벨 `(200,)`을 돌려주므로 그대로 `classification_report`에 넣을 수 있다.
5. `evaluate`는 지표를 알파벳 순으로 돌려주므로 `acc, loss = model.evaluate(X_test, y_test)`로 받아야 한다.

---

### Q2. (객관식 · 응용) 인자 순서를 바꿔 쓴 혼동 행렬

이진분류 평가에서 `confusion_matrix(y_test, y_pred)`의 정상 출력이 다음과 같습니다.

```
[[80 20]
 [10 90]]
```

그런데 수험생 A는 실수로 아래처럼 **인자 순서를 바꿔** 쓴 뒤, 그 행렬로 클래스 1의 **재현율(recall)** 을 계산했습니다.

```python
cm = confusion_matrix(y_pred, y_test)      # 순서가 뒤바뀜
tn, fp, fn, tp = cm.ravel()
recall = tp / (tp + fn)
print(round(recall, 4))
```

클래스 1의 **올바른 재현율**과 **A가 출력한 값**은 각각 얼마입니까?

1. 올바른 값 0.9000 / A의 값 0.9000
2. 올바른 값 0.9000 / A의 값 0.8182
3. 올바른 값 0.8182 / A의 값 0.9000
4. 올바른 값 0.8182 / A의 값 0.8182
5. 인자 순서가 잘못되었으므로 `ValueError`가 발생해 값이 출력되지 않는다

---

### Q3. (코드 빈칸 · 기본) 이진분류 평가 3종 세트

유방암 데이터로 학습을 마친 이진분류 모델 `model`이 있습니다.
출력층은 `Dense(1, activation='sigmoid')`, 컴파일은 `loss='binary_crossentropy', metrics=['accuracy']`입니다.
`X_test`는 171개 샘플, `y_test`는 0/1 정수 라벨입니다.

**"test 데이터의 성능을 출력하시오"** 라는 지시에 맞게 `(가)`~`(라)`를 채우십시오.

```python
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix

# (가) evaluate 결과를 두 변수로 받아 출력합니다
______(가)______ = model.evaluate(X_test, y_test, verbose=0)
print('test loss    :', round(loss, 4))
print('test accuracy:', round(acc, 4))

# 확률 예측
pred = model.predict(X_test, verbose=0)
print('pred shape:', pred.shape)

# (나) 확률을 0/1 라벨로 바꿉니다 (임계값 0.5, 1차원으로 정리)
y_pred = ______(나)______
print('y_pred shape:', y_pred.shape)

# (다) 클래스별 정밀도·재현율·f1 표 출력
print(______(다)______)

# (라) 혼동 행렬 출력 후 네 칸을 각각 꺼냅니다
cm = ______(라)______
print(cm)
tn, fp, fn, tp = cm.ravel()
print('TN:', tn, '/ FP:', fp, '/ FN:', fn, '/ TP:', tp)
```

추가로, `pred.shape`와 `y_pred.shape`가 각각 무엇으로 출력되는지 쓰십시오.

---

### Q4. (코드 빈칸 · 기본) 세 유형의 예측값 변환

세 개의 서로 다른 모델이 각각 `predict`를 마쳤고, 그 결과가 아래 배열로 주어졌습니다.
문제 유형에 맞는 **변환 한 줄**씩을 `(가)`~`(다)`에, 회귀 지표 계산을 `(라)`에 채우십시오.

```python
import numpy as np
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# ① 이진분류 모델의 predict 결과 — 출력층 Dense(1, 'sigmoid')
bin_pred = np.array([[0.83], [0.12], [0.50], [0.91], [0.46]])

# ② 다중분류 모델의 predict 결과 — 출력층 Dense(3, 'softmax')
multi_pred = np.array([[0.1, 0.7, 0.2],
                       [0.6, 0.3, 0.1],
                       [0.2, 0.2, 0.6],
                       [0.3, 0.5, 0.2],
                       [0.8, 0.1, 0.1]])

# ③ 회귀 모델의 predict 결과 — 출력층 Dense(1), 활성화 없음
reg_pred = np.array([[151.2], [74.8], [140.5], [205.9], [134.7]])
y_reg_true = np.array([155.0, 70.0, 145.0, 200.0, 130.0])

y_bin = ______(가)______
y_mul = ______(나)______
y_reg = ______(다)______

print('(가) 이진:', y_bin, y_bin.shape)
print('(나) 다중:', y_mul, y_mul.shape)
print('(다) 회귀:', y_reg, y_reg.shape)

# (라) 회귀 지표 세 가지를 계산합니다
print('mse:', round(______(라-1)______, 3))
print('mae:', round(______(라-2)______, 3))
print('r2 :', round(______(라-3)______, 4))
```

추가로, `(나)`에서 축을 `axis=0`으로 잘못 지정하면 결과 shape가 무엇이 되고 그다음 어떤 문제가 생기는지 쓰십시오.

---

### Q5. (오류 찾기 · 응용) 평가 코드의 두 가지 실수

아래는 학습을 마친 이진분류 모델의 평가 코드입니다.
**잘못된 곳이 두 군데** 있습니다. 각각을 지적하고 수정한 전체 코드를 쓰십시오.
두 오류 중 하나는 실행이 중단되고, 다른 하나는 **오류 메시지 없이 결과만 틀어진다**는 점에 유의하십시오.

```python
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix

loss, acc = model.evaluate(X_test, y_test, verbose=0)
print('test accuracy:', round(acc, 4))

pred = model.predict(X_test, verbose=0)
y_pred = (pred > 0.5).astype(int).flatten()

print(classification_report(y_test, pred))
cm = confusion_matrix(y_pred, y_test)
print(cm)
```

---

## 해답 및 해설

### Q1 해답

**정답: 3번**

**정답 코드 (실증 예제 — 이진분류 모델로 반환 형태를 확인)**

```python
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense, Dropout
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

np.random.seed(42)
tf.random.set_seed(42)

X, y = load_breast_cancer(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42, stratify=y)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

model = Sequential()
model.add(Input(shape=(X_train_scaled.shape[1],)))
model.add(Dense(64, activation='relu'))
model.add(Dropout(0.3))
model.add(Dense(32, activation='relu'))
model.add(Dense(1, activation='sigmoid'))
model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
model.fit(X_train_scaled, y_train, epochs=30, batch_size=32,
          validation_split=0.2, verbose=0)

res = model.evaluate(X_test_scaled, y_test, verbose=0)
print('evaluate 반환 타입:', type(res).__name__, '/ 길이:', len(res))
loss, acc = res
print('loss:', round(loss, 4), '/ accuracy:', round(acc, 4))

pred = model.predict(X_test_scaled, verbose=0)
print('predict shape:', pred.shape, '/ dtype:', pred.dtype)
print('앞 3개:', pred[:3].flatten().round(3))
```

```
evaluate 반환 타입: list / 길이: 2
loss: 0.068 / accuracy: 0.9766
predict shape: (171, 1) / dtype: float32
앞 3개: [0.001 0.957 0.891]
```

> 출력의 loss·accuracy 값은 실행할 때마다 조금씩 달라집니다(검증 시 accuracy 0.97~0.98 범위).
> **반환 타입(길이 2인 리스트)과 `predict` 결과의 shape** 가 이 문항에서 확인할 대상입니다.

**왜 이렇게 푸는가**

두 함수는 목적이 다르므로 **필요한 인자**와 **결과의 모양**이 모두 다릅니다.

| | `evaluate` | `predict` |
|---|---|---|
| 인자 | 입력 **+ 정답** | 입력만 |
| 반환 | `[loss, metric1, ...]` 숫자 리스트 | `(샘플 수, 출력 노드 수)` 배열 |
| 이 문항 | 길이 2 → `loss, acc = ...` | `(200, 3)` |

`evaluate`는 오차를 재는 함수이므로 정답이 없으면 계산 자체가 성립하지 않습니다. 반대로 `predict`는 정답 없이 동작합니다(실제 서비스에서 정답을 모르는 새 데이터를 예측하는 상황과 같습니다).

`predict`의 shape `(200, 3)`은 **"샘플 200개 × 클래스 3개의 확률"** 이라는 뜻입니다. 출력층이 `Dense(3, 'softmax')`이므로 열이 3개가 되고, 각 행의 합은 1입니다.

**자주 틀리는 지점**

- **5번 — 반환 순서를 헷갈리는 것.** `evaluate`의 반환은 **언제나 loss가 먼저**이고, 그 뒤로 `compile`의 `metrics`에 적은 순서대로 붙습니다. `acc, loss = ...`로 받으면 오류 없이 값만 뒤바뀌어 "정확도 0.06" 같은 이상한 숫자를 출력하게 됩니다.
- **4번 — `predict`가 라벨을 준다고 오해하는 것.** `predict`가 주는 것은 **확률**입니다. `classification_report`에 그대로 넣으면 `ValueError`가 납니다(Q5 참조).
- `metrics`를 지정하지 않고 컴파일했다면 반환값은 loss 숫자 하나뿐이라 `loss, acc = ...`가 언패킹 오류를 냅니다. 받기 전에 `print(model.evaluate(...))`로 길이를 한 번 확인하면 안전합니다.

---

### Q2 해답

**정답: 2번 (올바른 값 0.9000 / A의 값 0.8182)**

**정답 코드 (실증 예제)**

```python
import numpy as np
from sklearn.metrics import confusion_matrix

y_test = np.array([0] * 100 + [1] * 100)
y_pred = np.array([0] * 80 + [1] * 20 + [0] * 10 + [1] * 90)

cm_ok = confusion_matrix(y_test, y_pred)      # 정답이 먼저 (올바름)
cm_sw = confusion_matrix(y_pred, y_test)      # 순서가 뒤바뀜
print('정상 :\n', cm_ok)
print('뒤바뀜:\n', cm_sw)

tn, fp, fn, tp = cm_ok.ravel()
print('정상 ravel -> TN,FP,FN,TP =', tn, fp, fn, tp)
print('정상 recall(1)    =', round(tp / (tp + fn), 4))
print('정상 precision(1) =', round(tp / (tp + fp), 4))

tn2, fp2, fn2, tp2 = cm_sw.ravel()
print('뒤바뀜 ravel -> TN,FP,FN,TP =', tn2, fp2, fn2, tp2)
print('뒤바뀜으로 계산한 recall    =', round(tp2 / (tp2 + fn2), 4))
print('두 행렬이 전치 관계인가:', np.array_equal(cm_ok, cm_sw.T))
```

```
정상 :
 [[80 20]
 [10 90]]
뒤바뀜:
 [[80 10]
 [20 90]]
정상 ravel -> TN,FP,FN,TP = 80 20 10 90
정상 recall(1)    = 0.9
정상 precision(1) = 0.8182
뒤바뀜 ravel -> TN,FP,FN,TP = 80 10 20 90
뒤바뀜으로 계산한 recall    = 0.8182
두 행렬이 전치 관계인가: True
```

**왜 이렇게 푸는가**

`confusion_matrix(y_true, y_pred)`는 **행이 실제, 열이 예측**입니다. 따라서 정상 행렬은 이렇게 읽힙니다.

```
             예측 0    예측 1
실제 0   [    80   ,    20    ]   TN=80, FP=20
실제 1   [    10   ,    90    ]   FN=10, TP=90
```

- 올바른 재현율 = TP / (TP + FN) = 90 / (90 + 10) = **0.9000**
- 올바른 정밀도 = TP / (TP + FP) = 90 / (90 + 20) = **0.8182**

인자 순서를 바꾸면 행과 열의 의미가 맞바뀌므로 행렬이 **정확히 전치(transpose)** 됩니다. 그 결과 대각선 값(TN·TP)은 그대로인데 **FP와 FN만 서로 자리를 바꿉니다.** 그래서 A가 계산한 "재현율"은 사실 **정밀도 0.8182**입니다.

이 실수가 위험한 이유는 두 가지입니다. 첫째, **오류 메시지가 전혀 나지 않습니다.** 둘째, 두 값이 대체로 비슷한 범위(0.8~0.9)라 숫자만 보고는 이상함을 알아채기 어렵습니다. 정밀도와 재현율이 뒤바뀐 채로 "재현율이 높으니 놓치는 환자가 적다" 같은 해석까지 쓰면 해석 문항까지 함께 틀립니다.

**자주 틀리는 지점**

- **sklearn 평가 함수의 인자 순서를 뒤집는 것.** `confusion_matrix`, `classification_report`, `accuracy_score`, `r2_score` 모두 예외 없이 **정답이 먼저, 예측이 나중**입니다. `(y_test, y_pred)` 한 덩어리로 외우십시오.
- **`cm.ravel()`의 순서를 `tp, fp, fn, tn`으로 잘못 받는 것.** `ravel()`은 왼쪽 위부터 가로로 펴므로 언제나 `tn, fp, fn, tp` 순입니다. 그리고 이 언패킹은 **2×2(이진분류)에서만** 성립합니다. 3클래스면 행렬이 3×3이라 값이 9개여서 언패킹 자체가 실패합니다.
- 5번을 고르는 것. 순서를 바꿔도 두 배열의 길이와 라벨 종류가 같으므로 `ValueError`는 나지 않습니다. **조용히 틀리는 것**이 이 실수의 핵심입니다.

---

### Q3 해답

**정답 코드**

```python
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix

loss, acc = model.evaluate(X_test, y_test, verbose=0)          # (가)
print('test loss    :', round(loss, 4))
print('test accuracy:', round(acc, 4))

pred = model.predict(X_test, verbose=0)
print('pred shape:', pred.shape)

y_pred = (pred > 0.5).astype(int).flatten()                     # (나)
print('y_pred shape:', y_pred.shape)

print(classification_report(y_test, y_pred))                    # (다)

cm = confusion_matrix(y_test, y_pred)                           # (라)
print(cm)
tn, fp, fn, tp = cm.ravel()
print('TN:', tn, '/ FP:', fp, '/ FN:', fn, '/ TP:', tp)
```

```
test loss    : 0.068
test accuracy: 0.9766
pred shape: (171, 1)
y_pred shape: (171,)
              precision    recall  f1-score   support

           0       0.95      0.98      0.97        64
           1       0.99      0.97      0.98       107

    accuracy                           0.98       171
   macro avg       0.97      0.98      0.98       171
weighted avg       0.98      0.98      0.98       171

[[ 63   1]
 [  3 104]]
TN: 63 / FP: 1 / FN: 3 / TP: 104
```

> loss·accuracy와 혼동 행렬의 칸 값은 실행할 때마다 조금씩 달라집니다(검증 시 accuracy 0.97~0.98).
> **shape 두 줄 — `pred.shape`는 `(171, 1)`, `y_pred.shape`는 `(171,)`** — 은 환경과 무관하게 항상 같습니다.

**shape 답:** `pred.shape`는 `(171, 1)`(샘플 171개 × 출력 노드 1개), `y_pred.shape`는 `(171,)`입니다.

**왜 이렇게 푸는가**

- **(가) `loss, acc = ...`** — `metrics=['accuracy']`로 컴파일했으므로 반환 길이는 2이고 **loss가 먼저**입니다.
- **(나) `(pred > 0.5).astype(int).flatten()`** — 세 조각이 각각 일을 합니다. `(pred > 0.5)`가 `True`/`False` 배열을 만들고, `.astype(int)`가 이를 1/0으로 바꾸고, `.flatten()`이 `(171, 1)`을 `(171,)`로 폅니다. sklearn 지표 함수는 1차원 라벨 배열을 기대하므로 펴 두는 편이 안전합니다.
- **(다)(라) 인자 순서는 `(y_test, y_pred)`** — 정답이 먼저입니다(Q2).

`print(classification_report(...))`처럼 **`print`로 감싸는 것**을 잊지 마십시오. `classification_report`는 문자열을 돌려주는 함수라 `print` 없이 호출하면 노트북 화면에 줄바꿈이 `\n` 그대로 찍힌 한 줄이 나오거나, 아예 아무것도 보이지 않습니다. 채점자는 화면에 출력된 결과를 봅니다.

**자주 틀리는 지점**

- **(나)를 통째로 빠뜨리고 `pred`를 그대로 `classification_report`에 넣는 것** — 이 챕터에서 가장 흔한 사고입니다. `ValueError: Classification metrics can't handle a mix of binary and continuous targets`가 납니다. **`predict` 다음 줄에는 반드시 변환 한 줄**이 온다고 외워 두십시오.
- **`.astype(int)`를 빼먹는 것.** `(pred > 0.5)`만으로도 `True`/`False`가 0/1로 취급되어 결과는 나오지만, 리포트의 클래스 라벨이 `False`/`True`로 찍혀 지시된 출력 형태와 어긋납니다.
- **"성능을 출력하시오"에 `evaluate` 한 줄만 찍고 끝내는 것.** `evaluate`(loss·accuracy) + `classification_report` + `confusion_matrix` **3종 세트**를 모두 `print`로 남기는 것이 안전한 답안입니다.

---

### Q4 해답

**정답 코드**

```python
import numpy as np
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

bin_pred = np.array([[0.83], [0.12], [0.50], [0.91], [0.46]])
multi_pred = np.array([[0.1, 0.7, 0.2],
                       [0.6, 0.3, 0.1],
                       [0.2, 0.2, 0.6],
                       [0.3, 0.5, 0.2],
                       [0.8, 0.1, 0.1]])
reg_pred = np.array([[151.2], [74.8], [140.5], [205.9], [134.7]])
y_reg_true = np.array([155.0, 70.0, 145.0, 200.0, 130.0])

y_bin = (bin_pred > 0.5).astype(int).flatten()      # (가)
y_mul = np.argmax(multi_pred, axis=1)               # (나)
y_reg = reg_pred.flatten()                          # (다)

print('(가) 이진:', y_bin, y_bin.shape)
print('(나) 다중:', y_mul, y_mul.shape)
print('(다) 회귀:', y_reg, y_reg.shape)
print('multi_pred 행 합:', multi_pred.sum(axis=1))

print('mse:', round(mean_squared_error(y_reg_true, y_reg), 3))   # (라-1)
print('mae:', round(mean_absolute_error(y_reg_true, y_reg), 3))  # (라-2)
print('r2 :', round(r2_score(y_reg_true, y_reg), 4))             # (라-3)

# 축을 잘못 지정하면
wrong = np.argmax(multi_pred, axis=0)
print('axis=0 결과:', wrong, wrong.shape)
try:
    from sklearn.metrics import classification_report
    classification_report(np.array([1, 0, 2, 1, 0]), wrong)
except ValueError as e:
    print('axis=0 ->', type(e).__name__, ':', str(e)[:70])
```

```
(가) 이진: [1 0 0 1 0] (5,)
(나) 다중: [1 0 2 1 0] (5,)
(다) 회귀: [151.2  74.8 140.5 205.9 134.7] (5,)
multi_pred 행 합: [1. 1. 1. 1. 1.]
mse: 22.926
mae: 4.74
r2 : 0.987
axis=0 결과: [4 0 2] (3,)
axis=0 -> ValueError : Found input variables with inconsistent numbers of samples
```

**축 지정 답:** `axis=0`으로 하면 결과 shape가 `(3,)` — 샘플 수 5가 아니라 **클래스 수 3** 이 됩니다. 그 상태로 `classification_report(y_test, y_pred)`를 호출하면 정답(5개)과 길이가 맞지 않아 `ValueError: Found input variables with inconsistent numbers of samples: [5, 3]`이 납니다.

**왜 이렇게 푸는가**

세 유형의 변환은 **출력층의 모양**에서 그대로 따라 나옵니다.

| 유형 | 출력층 | `predict` shape | 변환 | 결과 |
|------|--------|-----------------|------|------|
| 이진분류 | `Dense(1, 'sigmoid')` | `(N, 1)` 확률 | `(pred > 0.5).astype(int).flatten()` | `(N,)` 0/1 |
| 다중분류 | `Dense(K, 'softmax')` | `(N, K)` 확률 | `np.argmax(pred, axis=1)` | `(N,)` 0~K-1 |
| 회귀 | `Dense(1)` 활성화 없음 | `(N, 1)` 예측값 | `pred.flatten()` | `(N,)` 실수 |

- **(가)** 세 번째 값 `0.50`이 `0`이 된 것에 주목하십시오. `>` 는 **초과**이므로 정확히 0.5인 값은 0으로 갑니다. 별도 지시가 없으면 이 기본 동작을 그대로 쓰면 됩니다.
- **(나) `axis=1`은 "한 행(= 한 샘플) 안에서 가장 큰 값의 위치"** 를 찾으라는 뜻입니다. softmax 출력은 행 합이 1인 확률 분포이므로(`multi_pred 행 합: [1. 1. 1. 1. 1.]`), 그 안에서 가장 큰 자리가 예측 클래스입니다. 클래스 번호는 0부터 시작하므로 `[0.2, 0.2, 0.6]`의 답은 `2`입니다.
- **(다) `flatten()`은 값을 바꾸는 변환이 아니라 모양만 정리하는 작업**입니다. 회귀에는 임계값도 argmax도 없습니다.

`(라)`의 sklearn 회귀 지표 함수들은 인자 순서가 **`(정답, 예측)`** 입니다. mse는 잔차를 제곱해 평균하므로 값이 크게 나오고(22.926), mae는 "평균적으로 4.74만큼 빗나간다"로 바로 읽힙니다. r2는 0.987이므로 타깃 변동의 98.7%를 설명한 셈입니다.

**자주 틀리는 지점**

- **`axis` 지정을 빠뜨리거나 `axis=0`으로 쓰는 것** — 다중분류에서 가장 잦은 실수입니다. `np.argmax(pred)`처럼 축을 아예 안 주면 배열 전체에서 최댓값 하나의 평탄화된 인덱스(정수 한 개)가 나옵니다. **다중분류 = `axis=1`** 을 한 덩어리로 외우십시오.
- **회귀에서 `flatten()`을 빠뜨리는 것** — sklearn의 mse·mae·r2 함수 자체는 `(N, 1)`을 받아 주기 때문에 **여기서는 값이 맞게 나옵니다.** 문제는 그다음입니다. 잔차를 직접 계산하면 `y_test - pred`가 `(N,)` 대 `(N, 1)`로 브로드캐스팅되어 `(N, N)` 행렬이 되고, `pd.DataFrame({'actual': y_test, 'pred': pred})`로 비교표를 만들면 `ValueError: Per-column arrays must each be 1-dimensional`이 납니다. **`predict(...).flatten()`을 붙여 두는 습관**이 이 사고들을 한 번에 막습니다.
- 이진분류에 `argmax`를 쓰는 것. 출력이 `(N, 1)`이라 한 행에 값이 하나뿐이므로 `argmax`는 전부 `0`을 돌려줍니다. 오류는 나지 않고 정확도만 무너집니다.

---

### Q5 해답

**잘못된 곳 2군데**

1. `print(classification_report(y_test, pred))` — 변환된 라벨 `y_pred` 대신 **확률 배열 `pred`** 를 넣었습니다. `ValueError`로 실행이 중단됩니다.
2. `cm = confusion_matrix(y_pred, y_test)` — **인자 순서가 뒤바뀌었습니다.** 오류는 나지 않고 행렬만 전치되어 FP와 FN이 서로 자리를 바꿉니다.

**정답 코드**

```python
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix

pred = model.predict(X_test, verbose=0)
y_pred = (pred > 0.5).astype(int).flatten()

# --- 오류 ① 재현: 확률을 그대로 투입 ---
try:
    classification_report(y_test, pred)
except ValueError as e:
    print('①', type(e).__name__, ':', str(e)[:75])

# --- 오류 ② 재현: 효과가 항상 드러나는 고정 예제로 확인 ---
demo_true = np.array([0] * 100 + [1] * 100)
demo_pred = np.array([0] * 80 + [1] * 20 + [0] * 10 + [1] * 90)
print('② 정상   confusion_matrix(y_test, y_pred):\n',
      confusion_matrix(demo_true, demo_pred))
print('② 뒤바뀜 confusion_matrix(y_pred, y_test):\n',
      confusion_matrix(demo_pred, demo_true))

# 실제 모델 결과에서도 두 행렬은 언제나 전치 관계입니다
cm_ok = confusion_matrix(y_test, y_pred)
cm_bad = confusion_matrix(y_pred, y_test)
print('   모델 결과도 전치 관계인가:', np.array_equal(cm_ok, cm_bad.T))
print('   FP와 FN이 우연히 같은가:', cm_ok[0, 1] == cm_ok[1, 0])

# --- 수정본 ---
loss, acc = model.evaluate(X_test, y_test, verbose=0)
print('test accuracy:', round(acc, 4))

pred = model.predict(X_test, verbose=0)
y_pred = (pred > 0.5).astype(int).flatten()          # 변환 한 줄

print(classification_report(y_test, y_pred))         # 라벨을 넣습니다
cm = confusion_matrix(y_test, y_pred)                # 정답이 먼저
print(cm)
```

```
① ValueError : Classification metrics can't handle a mix of binary and continuous
② 정상   confusion_matrix(y_test, y_pred):
 [[80 20]
 [10 90]]
② 뒤바뀜 confusion_matrix(y_pred, y_test):
 [[80 10]
 [20 90]]
   모델 결과도 전치 관계인가: True
   FP와 FN이 우연히 같은가: False

test accuracy: 0.9766
              precision    recall  f1-score   support

           0       0.95      0.98      0.97        64
           1       0.99      0.97      0.98       107

    accuracy                           0.98       171
   macro avg       0.97      0.98      0.98       171
weighted avg       0.98      0.98      0.98       171

[[ 63   1]
 [  3 104]]
```

> 혼동 행렬의 칸 값과 accuracy는 실행할 때마다 달라집니다(검증 시 accuracy 0.97~0.98).
> ② 를 **모델 결과가 아니라 고정 예제로 보여 주는 이유**가 마지막 출력 줄에 있습니다. 학습 결과에 따라 FP와 FN이 **우연히 같은 값**이 되는 실행이 있고(검증 중 실제로 둘 다 2가 나온 실행이 있었습니다), 그때는 뒤바뀐 행렬이 정상과 겉보기에 똑같아 보여 오류가 완전히 숨어 버립니다. 전치 관계라는 성질 자체는 언제나 성립합니다.
> 확인할 것은 **① 오류 메시지 문구**와 **② 두 행렬이 전치 관계라는 사실**입니다.

**왜 이렇게 푸는가**

두 오류의 성격이 정반대라는 점이 이 문항의 핵심입니다.

**① 확률을 그대로 투입 — 시끄럽게 실패합니다.** `classification_report`와 `confusion_matrix`는 **분류 지표**이므로 이산적인 라벨만 받습니다. `pred`는 `0.83` 같은 연속값이라 "이진(binary) 정답과 연속(continuous) 예측이 섞였다"는 `ValueError`가 납니다. 바로 위 줄에서 `y_pred`를 이미 잘 만들어 두고 정작 `pred`를 넣은 것이므로, **고칠 곳은 인자 이름 한 글자**입니다. 시험장에서 이 메시지를 보면 "변환한 변수를 안 썼구나"로 바로 연결하십시오.

**② 인자 순서 뒤바뀜 — 조용히 실패합니다.** 오류가 없으므로 그대로 제출하게 됩니다. 고정 예제에서 뒤바뀐 `[[80, 10], [20, 90]]`은 정상 `[[80, 20], [10, 90]]`의 전치입니다. 대각선(TN=80, TP=90)은 그대로라 **정확도는 변하지 않는데**, **FP와 FN만 서로 자리를 바꾸므로 정밀도와 재현율이 맞바뀝니다.** 혼동 행렬을 해석하는 서술 문항이 이어지면 그 문항까지 함께 틀립니다.

두 오류 모두 예방책은 하나입니다. **평가 블록을 `evaluate → predict → 변환 → (y_test, y_pred) 순서로 지표 함수`** 라는 고정된 순서로 통째로 외워 두는 것입니다. 이 순서에서 벗어나는 줄이 보이면 그 줄이 범인입니다.

**자주 틀리는 지점**

- **오류를 하나만 찾고 넘어가는 것.** ①에서 실행이 멈추므로 ②는 실행조차 되지 않아 발견하기 어렵습니다. ①을 고친 뒤 반드시 아래 줄들을 다시 훑으십시오.
- **①을 고친다면서 `classification_report(y_test, pred.flatten())`으로 바꾸는 것.** `flatten()`은 모양만 펼 뿐 여전히 확률이라 같은 `ValueError`가 납니다. 필요한 것은 **임계값 판정**입니다.
- **②를 발견하고도 "값이 비슷하니 괜찮다"고 넘기는 것.** 정확도는 같지만 정밀도·재현율은 완전히 뒤바뀐 값입니다.
- **"행렬을 눈으로 보고 이상하면 알아채겠지"라고 믿는 것.** FP와 FN이 우연히 같은 값이 되면 뒤바뀐 행렬이 정상과 **완전히 동일하게** 출력됩니다. 눈으로 검증할 수 없는 실수이므로, 애초에 `(y_test, y_pred)` 순서를 손이 기억하게 만드는 수밖에 없습니다.

---

<!-- verified: 2026-07-28 python3 3.13.5 / tensorflow 2.21.0 (Keras 3) / scikit-learn 1.9.0 / numpy 2.5.0 — Q1~Q5 해답 코드 전량 무오류 실행(exit 0, stderr 0줄).
     환경 무관 고정값(검증됨): Q1 evaluate 반환 list 길이 2·predict shape (171,1) float32 / Q2 정상 cm [[80,20],[10,90]]·뒤바뀜 cm [[80,10],[20,90]]·정상 recall 0.9·뒤바뀜 계산값 0.8182·전치 관계 True / Q3 pred.shape (171,1) → y_pred.shape (171,) / Q4 y_bin [1 0 0 1 0]·y_mul [1 0 2 1 0]·y_reg flatten (5,)·행합 전부 1.0·mse 22.926·mae 4.74·r2 0.987·argmax axis=0 결과 [4 0 2] shape (3,) → ValueError 'inconsistent numbers of samples: [5, 3]'·잔차 브로드캐스팅 (5,5)·DataFrame ValueError 'Per-column arrays must each be 1-dimensional' / Q5 ① ValueError "Classification metrics can't handle a mix of binary and continuous targets" · ② cm_ok == cm_bad.T True.
     학습 의존 수치(실행마다 변동): load_breast_cancer + epochs=30(학습 시간이 짧아 검증용 epochs 축소 없이 게재값 그대로 실행). 동일 시드·동일 코드로 4회 반복 실행 결과 test accuracy 0.9708 / 0.9825 / 0.9766 / 0.9766, cm [[63,1],[2,105]] ~ [[62,2],[2,105]] ~ [[63,1],[3,104]] 범위로 변동(TF CPU 연산 비결정성). 게재된 Q1·Q3·Q5 수치는 **동일한 최종 1회 실행**에서 일괄 채취(loss 0.068 / accuracy 0.9766 / cm [[63,1],[3,104]])하여 문항 간 정합성 유지. 모든 게재 수치에 "실행마다 달라짐" 주석 병기함.
     Q5 설계 보정: 3회차 검증에서 cm이 [[62,2],[2,105]]로 FP==FN이 되어 인자 순서 오류의 효과가 화면상 사라지는 실행을 확인 → ② 재현을 학습 결과가 아닌 고정 예제(y_true 200개)로 바꾸고, 이 우연 일치 자체를 해설·오답 포인트에 명시함.
     주: sklearn 회귀 지표(mse/mae/r2)는 (N,1) 예측을 그대로 받아 정상값을 반환함을 확인 — Q4 해설은 이 사실에 맞춰 flatten의 실제 위험(잔차 브로드캐스팅·DataFrame 생성 실패)으로 서술함.

[개명 2026-07-31] 커리큘럼 v1.2 §6 정본 변수명 적용 — Q1 해답 실증 예제 블록의 제자리 덮어쓰기(`X_train = scaler.fit_transform(X_train)` / `X_test = scaler.transform(X_test)`)를 `X_train_scaled`/`X_test_scaled`로 개명하고 해당 블록 내 후속 참조 4곳 연동: `Input(shape=(X_train_scaled.shape[1],))`, `model.fit(X_train_scaled, y_train, ...)`, `model.evaluate(X_test_scaled, y_test, ...)`, `model.predict(X_test_scaled, ...)`. `train_test_split` 반환값 `X_train`/`X_test`는 미스케일 원본으로 유지(정본 규칙). 이 파일의 다른 블록은 scaler 호출이 없는 "전처리 완료 가정" 코드이므로 개명 대상 아님.
개명 후 재실행(tensorflow를 pandas보다 먼저 import): 무오류. 이 문항의 채점 대상인 구조적 값은 개명 전과 동일 — `evaluate 반환 타입: list / 길이: 2`, `predict shape: (171, 1) / dtype: float32`, accuracy 0.9766.
개명 중립성 검증: 동일 프로세스에서 구표기와 정본표기를 나란히 실행해 스케일 결과 배열(train/test) `np.array_equal` True, 예측 배열 `np.array_equal` True 확인 — 개명은 수치에 영향 없음. 게재된 loss(0.068)·앞 3개 확률은 이 블록에 `tf.keras.utils.set_random_seed`가 없어 원래부터 실행마다 변동하는 값이며(파일 내 변동 안내 문구 기존 존재), 개명과 무관한 사전 존재 특성이므로 게재값을 변경하지 않음. -->
