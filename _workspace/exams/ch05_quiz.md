---
chapter: 5
title: "Ch05 확인 문제 — 컴파일과 학습"
items: 6
types: { 객관식: 2, 코드빈칸: 2, 오류찾기: 2 }
---

# Ch05 확인 문제 — 컴파일과 학습

> 본 문제는 공개된 출제 기준에 따른 유형 연습 문제입니다. 기출 원문이 아닙니다.
>
> 이 챕터의 범위는 **`compile()`과 `fit()`, 그리고 `history`까지**입니다.
> 콜백(`EarlyStopping` 등)은 Ch06, `evaluate`·`predict`는 Ch07에서 다루므로 여기서는 쓰지 않습니다.
>
> **Q1은 이 교재 전체에서 가장 자주 출제되는 지점(손실 함수와 출력층의 짝)입니다.** 틀렸다면 Ch05 2절의 표로 반드시 되돌아가십시오.
>
> 총 6문항 (객관식 2 / 코드 빈칸 2 / 오류 찾기 2), 권장 소요 시간 25분.
> 공통 import는 다음과 같다고 가정합니다.
>
> ```python
> import numpy as np
> import tensorflow as tf
> from tensorflow.keras.models import Sequential
> from tensorflow.keras.layers import Input, Dense
> ```

---

## 문제

### Q1. (객관식 · 기본) 손실 함수와 출력층의 짝 — 네 유형 판별

네 개의 서로 다른 과제에서 전처리를 마친 뒤 `print(y_train[:5])`와 `print(y_train.shape)`를 실행한 결과입니다.

| 상황 | 과제 | `y_train[:5]` 출력 | `y_train.shape` |
|------|------|--------------------|-----------------|
| (가) | 고객 이탈 여부 예측 | `[0 1 0 0 1]` | `(2100,)` |
| (나) | 설비 불량 유형 3종 분류 | `[1 1 1 0 2]` | `(1600,)` |
| (다) | 설비 불량 유형 3종 분류 | `[[0. 1. 0.] [1. 0. 0.] [0. 0. 1.] ...]` | `(1600, 3)` |
| (라) | 장비 잔여 수명(일) 예측 | `[199.4 235.6 123.7 121. 158.2]` | `(640,)` |

각 상황의 **출력층과 `loss`** 를 옳게 짝지은 것은?

1. (가) `Dense(1,'sigmoid')` + `binary_crossentropy` / (나) `Dense(3,'softmax')` + `categorical_crossentropy` / (다) `Dense(3,'softmax')` + `sparse_categorical_crossentropy` / (라) `Dense(1)` + `mse`
2. (가) `Dense(2,'softmax')` + `categorical_crossentropy` / (나) `Dense(3,'softmax')` + `sparse_categorical_crossentropy` / (다) `Dense(3,'softmax')` + `categorical_crossentropy` / (라) `Dense(1,'sigmoid')` + `mse`
3. (가) `Dense(1,'sigmoid')` + `binary_crossentropy` / (나) `Dense(3,'softmax')` + `sparse_categorical_crossentropy` / (다) `Dense(3,'softmax')` + `categorical_crossentropy` / (라) `Dense(1)` + `mse`
4. (가) `Dense(1,'sigmoid')` + `binary_crossentropy` / (나) `Dense(1,'softmax')` + `sparse_categorical_crossentropy` / (다) `Dense(3,'sigmoid')` + `categorical_crossentropy` / (라) `Dense(1)` + `binary_crossentropy`
5. (가) `Dense(1,'relu')` + `mse` / (나) `Dense(3,'softmax')` + `categorical_crossentropy` / (다) `Dense(3,'softmax')` + `sparse_categorical_crossentropy` / (라) `Dense(1,'sigmoid')` + `mae`

---

### Q2. (객관식 · 기본) compile의 세 인자

`model.compile(optimizer=..., loss=..., metrics=...)`에 대한 설명 중 **옳지 않은 것**은?

1. `loss`는 모델이 학습 과정에서 실제로 줄여 나가는 값이다.
2. `metrics`에 넣은 지표는 학습 중 화면과 `history`에 함께 기록되지만, 가중치가 갱신되는 방향에는 영향을 주지 않는다.
3. 같은 데이터·같은 seed·같은 모델에서 `metrics=['accuracy']`를 `metrics=['mae']`로만 바꾸면 학습되는 가중치와 `loss` 값이 달라진다.
4. `optimizer`는 문제에 지시가 없으면 문자열 `'adam'`을 쓰는 것이 무난하다.
5. `loss` 자리에 `'accuracy'`를 넣으면 학습을 시작할 수 없다.

---

### Q3. (코드 빈칸 · 기본) 이진분류 컴파일과 학습

전처리를 마친 `X_train`의 shape는 `(1400, 10)`이고, `y_train`은 0 또는 1인 **이진분류** 타깃입니다.
학습 데이터의 20%를 검증 데이터로 떼어 `epochs=50`, `batch_size=32`로 학습시키십시오.

`(가)`에는 손실 함수를, `(나)`에는 지표를, `(다)`에는 검증 데이터를 떼어내는 인자를 채우십시오.

```python
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense

np.random.seed(42); tf.random.set_seed(42)
X_train = np.random.rand(1400, 10)
y_train = (X_train[:, 0] * 2 + X_train[:, 1] > 1.5).astype(int)
print('y_train[:5] =', y_train[:5], '/ 클래스:', np.unique(y_train))

model = Sequential()
model.add(Input(shape=(X_train.shape[1],)))
model.add(Dense(64, activation='relu'))
model.add(Dense(32, activation='relu'))
model.add(Dense(1, activation='sigmoid'))

model.compile(optimizer='adam',
              loss=______(가)______,
              metrics=______(나)______)

history = model.fit(X_train, y_train,
                    epochs=50, batch_size=32,
                    ______(다)______,
                    verbose=1)

print('history 키:', sorted(history.history.keys()))
```

추가로, 이 코드가 출력하는 **`history` 키 4개**를 쓰십시오.

---

### Q4. (코드 빈칸 · 응용) 다중분류 컴파일과 학습, 그리고 step 수

`X_train`의 shape는 `(2000, 12)`, `y_train`은 아래 출력에서 보듯 **정수 라벨**입니다.
`epochs=60`, `batch_size=50`으로 학습하고, 학습 데이터의 20%를 검증 데이터로 씁니다.

`(가)`에는 클래스 개수를 데이터에서 뽑아내는 코드를, `(나)`에는 출력층 한 줄을, `(다)`에는 손실 함수를, `(라)`에는 검증 인자를 채우십시오.

```python
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense

np.random.seed(42); tf.random.set_seed(42)
X_train = np.random.rand(2000, 12)
y_train = np.random.randint(0, 3, 2000)
print('y_train[:8] =', y_train[:8], '/ shape =', y_train.shape)

n_class = ______(가)______

model = Sequential()
model.add(Input(shape=(X_train.shape[1],)))
model.add(Dense(64, activation='relu'))
model.add(Dense(32, activation='relu'))
model.add(______(나)______)

model.compile(optimizer='adam',
              loss=______(다)______,
              metrics=['accuracy'])

history = model.fit(X_train, y_train,
                    epochs=60, batch_size=50,
                    ______(라)______,
                    verbose=1)
```

추가로 다음 두 가지에 답하십시오.

1. 이 설정에서 **1 epoch당 step 수**는 몇입니까? 계산식과 함께 쓰십시오.
2. `y_train`을 `tf.keras.utils.to_categorical(y_train)`으로 바꾼다면, 위 코드에서 **어느 줄을 어떻게 고쳐야** 합니까?

---

### Q5. (오류 찾기 · 기본) 다중분류 학습에서 나는 오류

아래 코드는 `model.compile()`까지는 아무 문제 없이 지나가지만 `model.fit()`에서 오류가 나며 멈춥니다.
**잘못된 줄 한 곳**을 지적하고, 서로 다른 **두 가지 방법**으로 고친 코드를 각각 쓰십시오.

```python
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense

np.random.seed(42); tf.random.set_seed(42)
X_train = np.random.rand(600, 8)
y_train = np.digitize(X_train[:, 0] * 3 + X_train[:, 1], [0.9, 1.7, 2.5])
print('y_train[:6] =', y_train[:6], '/ shape =', y_train.shape)

model = Sequential()
model.add(Input(shape=(X_train.shape[1],)))
model.add(Dense(32, activation='relu'))
model.add(Dense(4, activation='softmax'))

model.compile(optimizer='adam',
              loss='categorical_crossentropy',
              metrics=['accuracy'])

history = model.fit(X_train, y_train,
                    epochs=20, batch_size=32,
                    validation_split=0.2, verbose=0)
```

---

### Q6. (오류 찾기 · 응용) 회귀 문제로 바꾸다 남은 흔적

`y_train`은 장비의 잔여 수명(일)으로, 값의 범위는 약 88 ~ 278입니다.
이진분류 코드를 복사해 회귀 문제로 고치던 중 **두 군데**를 잘못 두었습니다. 각각을 지적하고 수정한 코드를 쓰십시오.

```python
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense

np.random.seed(42); tf.random.set_seed(42)
X_train = np.random.rand(800, 7)
y_train = (120 * X_train[:, 0] + 60 * X_train[:, 1] + 30 * X_train[:, 2]
           + 80 + np.random.randn(800) * 5)
print('y_train[:4] =', np.round(y_train[:4], 1))

model = Sequential()
model.add(Input(shape=(X_train.shape[1],)))
model.add(Dense(32, activation='relu'))
model.add(Dense(1, activation='sigmoid'))

model.compile(optimizer='adam',
              loss='accuracy',
              metrics=['mse'])

history = model.fit(X_train, y_train,
                    epochs=100, batch_size=32,
                    validation_split=0.2, verbose=0)
```

---

## 해답 및 해설

### Q1 해답

**정답: 3번**

| 상황 | 판단 근거 | 출력층 | `loss` |
|------|-----------|--------|--------|
| (가) | 값이 `0`/`1` 두 종류 → 이진분류 | `Dense(1, activation='sigmoid')` | `'binary_crossentropy'` |
| (나) | 값이 `0`/`1`/`2`, shape가 `(1600,)` → 다중분류 **정수 라벨** | `Dense(3, activation='softmax')` | `'sparse_categorical_crossentropy'` |
| (다) | shape가 `(1600, 3)`, 각 행이 `[0. 1. 0.]` → 다중분류 **원-핫** | `Dense(3, activation='softmax')` | `'categorical_crossentropy'` |
| (라) | 소수점 연속값 → 회귀 | `Dense(1)` — **활성화 없음** | `'mse'` (또는 `'mae'`) |

**정답 코드 (네 유형이 실제로 학습되는지 확인)**

```python
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense
from tensorflow.keras.utils import to_categorical

np.random.seed(42); tf.random.set_seed(42)
X = np.random.rand(200, 6)

cases = [
    ("(가) 이진분류",         np.random.randint(0, 2, 200),
     Dense(1, activation='sigmoid'), 'binary_crossentropy',            ['accuracy']),
    ("(나) 다중분류 정수라벨", np.random.randint(0, 3, 200),
     Dense(3, activation='softmax'), 'sparse_categorical_crossentropy', ['accuracy']),
    ("(다) 다중분류 원-핫",    to_categorical(np.random.randint(0, 3, 200), 3),
     Dense(3, activation='softmax'), 'categorical_crossentropy',        ['accuracy']),
    ("(라) 회귀",             np.random.rand(200) * 200 + 50,
     Dense(1),                       'mse',                             ['mae']),
]

for name, yy, out, loss, met in cases:
    m = Sequential([Input(shape=(6,)), Dense(16, activation='relu'), out])
    m.compile(optimizer='adam', loss=loss, metrics=met)
    m.fit(X, yy, epochs=2, batch_size=32, verbose=0)
    print(f"{name:22s} loss={loss:<32s} 출력 shape={m.output_shape} -> 학습 성공")
```

```
(가) 이진분류           loss=binary_crossentropy             출력 shape=(None, 1) -> 학습 성공
(나) 다중분류 정수라벨   loss=sparse_categorical_crossentropy 출력 shape=(None, 3) -> 학습 성공
(다) 다중분류 원-핫      loss=categorical_crossentropy        출력 shape=(None, 3) -> 학습 성공
(라) 회귀               loss=mse                             출력 shape=(None, 1) -> 학습 성공
```

**왜 이렇게 푸는가**

판단 순서는 언제나 **`y`를 먼저 찍어 보는 것**입니다. 문제 설명의 표현("분류하시오", "예측하시오")이 아니라 **타깃 배열의 실제 형태**가 loss를 결정합니다. Ch05 분기도의 질문 순서를 그대로 따르면 됩니다.

1. **숫자인가 범주인가?** — (라)처럼 소수점이 붙은 연속값이면 회귀입니다. `Dense(1)`에 활성화 함수를 붙이지 않고 `mse`를 씁니다.
2. **클래스가 2개인가?** — (가)처럼 `0`과 `1`만 있으면 이진분류입니다. 출력은 "1일 확률" 하나이므로 `Dense(1,'sigmoid')` + `binary_crossentropy`입니다.
3. **정수인가 원-핫인가?** — (나)와 (다)는 같은 과제이지만 라벨 형태가 다릅니다. **`shape`를 보면 즉시 갈립니다.** `(1600,)`처럼 1차원이면 정수 라벨이므로 `sparse_`를 붙이고, `(1600, 3)`처럼 2차원이면 이미 펼쳐진 원-핫이므로 `sparse_`를 붙이지 않습니다. 출력층은 두 경우 모두 `Dense(3,'softmax')`로 같습니다.

`sparse_`라는 접두어를 **"라벨이 정수 하나로 압축되어 있다"** 로 읽으면 헷갈리지 않습니다.

**자주 틀리는 지점**

- **1번·5번처럼 (나)와 (다)를 맞바꾸는 것** — 이 챕터에서 가장 흔한 오답입니다. 두 상황의 과제 설명이 완전히 같기 때문에, `shape`를 확인하지 않으면 반드시 헷갈립니다. `print(y_train.shape)` 한 줄이 유일한 예방책입니다.
- **2번처럼 이진분류에 `Dense(2,'softmax')`를 쓰는 것** — 원-핫으로 바꾸면 동작은 하지만, 시험 표준 답안은 `Dense(1,'sigmoid')`입니다. 굳이 노드를 2개로 늘려 답을 복잡하게 만들 이유가 없습니다.
- **2번·5번처럼 회귀 출력층에 `sigmoid`를 붙이는 것** — 출력이 0~1로 눌려 88~278 범위의 값을 절대 맞힐 수 없습니다. Q6에서 그 결과를 숫자로 확인합니다.
- **4번처럼 다중분류 출력층 units를 클래스 수와 다르게 두는 것**(`Dense(1,'softmax')`) — softmax는 여러 노드의 값을 합이 1이 되도록 나누는 함수인데 노드가 1개면 항상 1.0만 나옵니다.

---

### Q2 해답

**정답: 3번 (옳지 않은 설명)**

`metrics`를 바꿔도 **학습되는 가중치와 `loss` 값은 전혀 달라지지 않습니다.**

**정답 코드 (선택지 3 반증)**

```python
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense


def train_with(metrics):
    np.random.seed(0)
    X = np.random.rand(300, 5)
    y = (X[:, 0] + X[:, 1] > 1.0).astype(int)
    tf.keras.utils.set_random_seed(7)          # 가중치 초기화까지 고정
    m = Sequential([Input(shape=(5,)), Dense(8, activation='relu'),
                    Dense(1, activation='sigmoid')])
    m.compile(optimizer='adam', loss='binary_crossentropy', metrics=metrics)
    h = m.fit(X, y, epochs=5, batch_size=32, shuffle=False, verbose=0)
    return h.history['loss']


a = train_with(['accuracy'])
b = train_with(['mae'])
print("metrics=['accuracy'] 손실:", [round(v, 6) for v in a])
print("metrics=['mae']      손실:", [round(v, 6) for v in b])
print("두 손실 수열이 완전히 동일한가:", a == b)
```

```
metrics=['accuracy'] 손실: [0.730719, 0.722522, 0.714187, 0.705478, 0.696704]
metrics=['mae']      손실: [0.730719, 0.722522, 0.714187, 0.705478, 0.696704]
두 손실 수열이 완전히 동일한가: True
```

**선택지 5 실증 (`loss='accuracy'`)**

```python
mx = Sequential([Input(shape=(5,)), Dense(1, activation='sigmoid')])
mx.compile(optimizer='adam', loss='accuracy', metrics=['mse'])
print("compile() 자체는 통과함")
try:
    mx.fit(np.random.rand(40, 5), np.random.randint(0, 2, 40), epochs=1, verbose=0)
except Exception as e:
    print("fit ->", type(e).__name__, ":", str(e).split("\n")[0])
```

```
compile() 자체는 통과함
fit -> ValueError : Could not interpret loss identifier: accuracy
```

**왜 이렇게 푸는가**

`loss`와 `metrics`는 이름이 나란히 붙어 있어 대등해 보이지만 역할이 전혀 다릅니다.

- **`loss`는 모델이 실제로 줄이는 대상**입니다. 역전파는 `loss`를 미분한 값으로 가중치를 고칩니다.
- **`metrics`는 계기판**입니다. 매 epoch 끝에 값을 계산해 화면과 `history`에 얹어 줄 뿐, 가중치 갱신 계산에는 한 번도 등장하지 않습니다.

정확도가 `loss`가 될 수 없는 이유도 여기 있습니다. 정확도는 "맞았다/틀렸다"를 세는 계단 모양의 값이라 대부분의 지점에서 기울기가 0입니다. 기울기가 0이면 가중치를 어느 쪽으로 고쳐야 할지 알 수 없습니다. 그래서 Keras는 `'accuracy'`를 손실 함수 이름으로 해석하지 못하고 오류를 냅니다.

**자주 틀리는 지점**

- **`loss`와 `metrics`의 자리를 바꿔 쓰는 것** — `loss='accuracy', metrics=['binary_crossentropy']`처럼 뒤집어 쓰는 답안이 실제로 나옵니다. **"줄일 것은 `loss`, 볼 것은 `metrics`"** 로 자리를 고정해 외우십시오.
- **`compile()`이 통과했으니 맞다고 판단하는 것** — 위 실행 결과에서 보듯 `compile()`은 문자열을 받아 두기만 하고, 실제 해석은 `fit()`이 시작될 때 일어납니다. **오류가 나는 줄과 원인이 있는 줄이 다르다**는 점이 이 함정의 핵심입니다.
- 회귀에 `metrics=['accuracy']`를 그대로 두는 것. 오류는 안 나지만 연속값에 정확도는 의미가 없어 0에 가까운 숫자만 찍힙니다. 회귀 지표는 `['mae']`입니다.

---

### Q3 해답

**정답 코드**

```python
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense

np.random.seed(42); tf.random.set_seed(42)
X_train = np.random.rand(1400, 10)
y_train = (X_train[:, 0] * 2 + X_train[:, 1] > 1.5).astype(int)
print('y_train[:5] =', y_train[:5], '/ 클래스:', np.unique(y_train))

model = Sequential()
model.add(Input(shape=(X_train.shape[1],)))
model.add(Dense(64, activation='relu'))
model.add(Dense(32, activation='relu'))
model.add(Dense(1, activation='sigmoid'))

model.compile(optimizer='adam',
              loss='binary_crossentropy',      # (가)
              metrics=['accuracy'])            # (나)

history = model.fit(X_train, y_train,
                    epochs=50, batch_size=32,
                    validation_split=0.2,      # (다)
                    verbose=1)

print('history 키:', sorted(history.history.keys()))
print('마지막 val_accuracy:', round(history.history['val_accuracy'][-1], 4))
```

```
y_train[:5] = [1 0 0 0 0] / 클래스: [0 1]
history 키: ['accuracy', 'loss', 'val_accuracy', 'val_loss']
마지막 val_accuracy: 0.9821
```

> 위 `val_accuracy`는 문제 지시대로 `epochs=50`, `batch_size=32`, `validation_split=0.2`로 실행한 결과입니다. 환경과 seed에 따라 소수점 아래는 달라집니다.

**`history` 키 4개:** `loss`, `accuracy`, `val_loss`, `val_accuracy`

**왜 이렇게 푸는가**

- **(가) `'binary_crossentropy'`** — `print(y_train[:5])`가 `[1 0 0 0 0]`, `np.unique(y_train)`이 `[0 1]`이므로 클래스 2개짜리 이진분류입니다. 출력층이 이미 `Dense(1,'sigmoid')`로 주어져 있으니 그 짝은 `binary_crossentropy` 하나뿐입니다. **출력층을 먼저 보고 loss를 맞추는 것도 유효한 검산법**입니다.
- **(나) `['accuracy']`** — 분류 문제의 기본 지표입니다. 대괄호를 씌운 **리스트**로 넘긴다는 점에 주의하십시오.
- **(다) `validation_split=0.2`** — "학습 데이터의 20%를 검증 데이터로"라는 지시를 그대로 옮긴 인자입니다. 이 인자가 있어야 `history`에 `val_` 키가 생기고, Ch06의 `EarlyStopping`이 감시할 대상이 만들어집니다.

`history` 키 이름의 규칙은 단순합니다. **`loss`는 항상 있고, 나머지 이름은 `metrics`에 넣은 문자열 그대로**이며, 검증 데이터에서 잰 값에는 `val_` 접두어가 붙습니다. 그래서 `metrics=['mae']`로 컴파일한 회귀 모델이라면 키는 `loss`, `mae`, `val_loss`, `val_mae`가 됩니다.

**자주 틀리는 지점**

- **`metrics='accuracy'`처럼 리스트를 빼는 것** — 최신 버전에서는 통과되기도 하지만 표준 표기는 리스트입니다. 지표를 두 개 이상 넣을 수 있는 자리이므로 `['accuracy']`로 쓰는 습관을 들이십시오.
- **`validation_split`을 빠뜨리는 것** — 오류는 나지 않습니다. 대신 `history` 키가 `['accuracy', 'loss']` 두 개뿐이 되어, 학습 곡선을 두 줄로 그리라는 다음 문항에서 `KeyError: 'val_loss'`가 납니다. **한 문항의 누락이 다음 문항의 오류로 번지는 것이 실기 시험의 전형적인 실점 구조입니다.**
- `validation_split=0.2`와 `validation_data=(...)`를 동시에 쓰는 것. 둘 중 하나만 씁니다.
- `epochs`와 `batch_size`를 문제 지시값과 다르게 적는 것. 지시된 숫자는 그대로 옮겨야 채점됩니다.

---

### Q4 해답

**정답 코드**

```python
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense

np.random.seed(42); tf.random.set_seed(42)
X_train = np.random.rand(2000, 12)
y_train = np.random.randint(0, 3, 2000)
print('y_train[:8] =', y_train[:8], '/ shape =', y_train.shape)

n_class = len(np.unique(y_train))                            # (가)

model = Sequential()
model.add(Input(shape=(X_train.shape[1],)))
model.add(Dense(64, activation='relu'))
model.add(Dense(32, activation='relu'))
model.add(Dense(n_class, activation='softmax'))              # (나)

model.compile(optimizer='adam',
              loss='sparse_categorical_crossentropy',        # (다)
              metrics=['accuracy'])

history = model.fit(X_train, y_train,
                    epochs=60, batch_size=50,
                    validation_split=0.2,                    # (라)
                    verbose=1)

print('n_class =', n_class, '/ 출력 shape =', model.output_shape)
print('history 키:', sorted(history.history.keys()))
```

```
y_train[:8] = [1 1 1 0 0 1 2 2] / shape = (2000,)
n_class = 3 / 출력 shape = (None, 3)
history 키: ['accuracy', 'loss', 'val_accuracy', 'val_loss']
```

**추가 1 — 1 epoch당 step 수: 32**

```
학습에 쓰이는 행 수 = 2000 x (1 - 0.2) = 1600
1 epoch당 step 수   = ceil(1600 / 50) = 32
```

**추가 2 — `to_categorical`로 바꾸는 경우:** `(다)` 한 줄을 `loss='categorical_crossentropy'`로 고칩니다. `(나)`의 출력층은 그대로 둡니다.

```python
from tensorflow.keras.utils import to_categorical

y_oh = to_categorical(y_train, n_class)
print('to_categorical 후 shape:', y_oh.shape, '/ 첫 행:', y_oh[0])

model_b = Sequential([Input(shape=(12,)), Dense(32, activation='relu'),
                      Dense(n_class, activation='softmax')])   # 출력층은 그대로
model_b.compile(optimizer='adam',
                loss='categorical_crossentropy',               # 이 줄만 교체
                metrics=['accuracy'])
model_b.fit(X_train, y_oh, epochs=1, batch_size=50, verbose=0)
print('categorical_crossentropy + 원-핫 -> 학습 성공')
```

```
to_categorical 후 shape: (2000, 3) / 첫 행: [0. 1. 0.]
categorical_crossentropy + 원-핫 -> 학습 성공
```

**왜 이렇게 푸는가**

- **(가) `len(np.unique(y_train))`** — 클래스 개수를 눈으로 세지 않습니다. 라벨이 1부터 시작하거나 중간 번호가 비어 있어도 이 코드는 정확한 개수를 돌려줍니다.
- **(나) `Dense(n_class, activation='softmax')`** — 다중분류 출력은 "각 클래스일 확률"의 목록이므로 노드 수가 클래스 수와 정확히 같아야 하고, softmax가 그 값들의 합을 1로 맞춰 줍니다.
- **(다) `'sparse_categorical_crossentropy'`** — `y_train[:8]`이 `[1 1 1 0 0 1 2 2]`, shape가 `(2000,)`인 **정수 라벨**이기 때문입니다. 1차원이면 `sparse_`입니다.
- **(라) `validation_split=0.2`** — Q3와 같습니다.

**step 수 계산에서 놓치기 쉬운 것은 `validation_split`이 먼저 적용된다는 점입니다.** 2,000행 전체가 아니라 검증분 20%를 뺀 1,600행만 가중치 갱신에 쓰이므로, `ceil(2000/50) = 40`이 아니라 `ceil(1600/50) = 32`가 정답입니다. `verbose=1`로 학습하면 진행 막대 왼쪽에 `32/32`가 찍히는 것으로 확인할 수 있습니다.

추가 2가 알려 주는 것은 **출력층은 라벨 형태와 무관하다**는 사실입니다. 정수 라벨이든 원-핫이든 다중분류 출력층은 언제나 `Dense(K, 'softmax')`이고, 바뀌는 것은 `loss` 한 줄뿐입니다.

**자주 틀리는 지점**

- **`n_class = 3`처럼 숫자를 손으로 적는 것** — 원-핫 인코딩으로 컬럼이 늘거나 이상치 행을 지우는 등 전처리 결과가 바뀌면 그대로 틀린 값이 됩니다.
- **step 수를 `ceil(2000/50) = 40`으로 답하는 것** — 검증분을 빼지 않은 실수입니다.
- **`to_categorical`로 바꾸면서 출력층까지 건드리는 것** — `Dense(1)` 등으로 바꾸면 오히려 shape 오류가 납니다. 고칠 곳은 `loss` 한 줄입니다.
- 반대로 라벨은 정수 그대로 두고 `loss`만 `categorical_crossentropy`로 바꾸는 실수 — 이것이 다음 Q5의 주제입니다.

---

### Q5 해답

**잘못된 줄:** `loss='categorical_crossentropy'`

`y_train`은 `[2 3 1 2 1 0]`처럼 shape가 `(600,)`인 **정수 라벨**인데, `categorical_crossentropy`는 `(600, 4)` 형태의 원-핫 라벨을 기대합니다. 라벨 형태와 손실 함수가 어긋나 `fit()`에서 shape 오류가 납니다.

**정답 코드**

```python
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense
from tensorflow.keras.utils import to_categorical

np.random.seed(42); tf.random.set_seed(42)
X_train = np.random.rand(600, 8)
y_train = np.digitize(X_train[:, 0] * 3 + X_train[:, 1], [0.9, 1.7, 2.5])
print('y_train[:6] =', y_train[:6], '/ shape =', y_train.shape)

# --- 잘못된 코드가 내는 오류 확인 ---
bad = Sequential([Input(shape=(8,)), Dense(32, activation='relu'),
                  Dense(4, activation='softmax')])
bad.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
try:
    bad.fit(X_train, y_train, epochs=1, batch_size=32, validation_split=0.2, verbose=0)
except Exception as e:
    print('[잘못]', type(e).__name__, '->', str(e).split("\n")[0])

# --- 수정 A: loss를 라벨에 맞춘다 (권장) ---
fix_a = Sequential([Input(shape=(8,)), Dense(32, activation='relu'),
                    Dense(4, activation='softmax')])
fix_a.compile(optimizer='adam',
              loss='sparse_categorical_crossentropy',      # 여기만 교체
              metrics=['accuracy'])
fix_a.fit(X_train, y_train, epochs=20, batch_size=32, validation_split=0.2, verbose=0)
print('[수정 A] 성공 — y shape:', y_train.shape, '/ 출력 shape:', fix_a.output_shape)

# --- 수정 B: 라벨을 loss에 맞춘다 ---
y_oh = to_categorical(y_train, 4)
fix_b = Sequential([Input(shape=(8,)), Dense(32, activation='relu'),
                    Dense(4, activation='softmax')])
fix_b.compile(optimizer='adam',
              loss='categorical_crossentropy',             # loss는 그대로
              metrics=['accuracy'])
fix_b.fit(X_train, y_oh, epochs=20, batch_size=32, validation_split=0.2, verbose=0)
print('[수정 B] 성공 — y shape:', y_oh.shape, '/ 출력 shape:', fix_b.output_shape)
```

```
y_train[:6] = [2 3 1 2 1 0] / shape = (600,)
[잘못] ValueError -> Arguments `target` and `output` must have the same rank (ndim). Received: target.shape=(32,), output.shape=(32, 4)
[수정 A] 성공 — y shape: (600,) / 출력 shape: (None, 4)
[수정 B] 성공 — y shape: (600, 4) / 출력 shape: (None, 4)
```

**왜 이렇게 푸는가**

오류 메시지가 원인을 그대로 말해 줍니다. `target.shape=(32,)`는 배치 32개의 정답이 **숫자 하나씩**이라는 뜻이고, `output.shape=(32, 4)`는 모델이 배치마다 **확률 4개씩**을 내놓았다는 뜻입니다. `categorical_crossentropy`는 이 둘의 차원 수가 같아야(둘 다 2차원이어야) 계산할 수 있습니다.

여기서 중요한 것은 **어느 쪽을 고쳐도 된다**는 점입니다.

- **수정 A** — 라벨을 그대로 두고 loss에 `sparse_`를 붙여 "정답은 정수 하나로 들어온다"고 알려 줍니다. 손댈 곳이 한 줄뿐이라 시험에서는 이쪽이 안전합니다.
- **수정 B** — `to_categorical`로 라벨을 `(600, 4)` 원-핫으로 펼쳐 loss가 기대하는 형태에 맞춥니다. 문제가 "원-핫 인코딩된 타깃을 사용하시오"라고 지시했다면 이쪽입니다.

**출력층 `Dense(4,'softmax')`는 두 방법 모두에서 그대로**라는 점을 다시 확인하십시오. 손댈 곳은 loss 또는 y 둘 중 하나입니다.

**자주 틀리는 지점**

- **오류가 `fit()`에서 나니까 `fit()`의 인자를 의심하는 것** — `epochs`나 `batch_size`를 아무리 바꿔도 해결되지 않습니다. shape 오류를 만나면 **`print(y_train.shape)`와 `model.output_shape`를 나란히 찍어 보는 것**이 가장 빠른 진단입니다.
- **출력층 units를 라벨 개수에 맞춘다며 `Dense(1)`로 줄이는 것** — 오류 메시지가 사라지는 방향으로만 고치다 생기는 사고입니다. 클래스가 4개면 출력 노드는 4개여야 합니다.
- **수정 A와 수정 B를 섞는 것** — `to_categorical`로 라벨을 펼쳐 놓고 loss는 `sparse_categorical_crossentropy`로 두면 같은 오류가 반대 방향으로 납니다. **loss와 y는 반드시 한 쌍으로 함께 바꿉니다.**

---

### Q6 해답

**잘못된 곳 2군데**

1. `model.add(Dense(1, activation='sigmoid'))` — **회귀 출력층에 활성화 함수가 남아 있습니다.** `sigmoid`는 출력을 0~1로 눌러 버리므로 88~278 범위의 값을 절대 맞힐 수 없습니다. `Dense(1)`로 고칩니다.
2. `loss='accuracy', metrics=['mse']` — **`loss`와 `metrics`의 자리가 뒤바뀌었습니다.** `'accuracy'`는 손실 함수가 아니어서 `fit()`에서 오류가 납니다. 회귀 표준 조합인 `loss='mse', metrics=['mae']`로 고칩니다.

**정답 코드**

```python
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense

np.random.seed(42); tf.random.set_seed(42)
X_train = np.random.rand(800, 7)
y_train = (120 * X_train[:, 0] + 60 * X_train[:, 1] + 30 * X_train[:, 2]
           + 80 + np.random.randn(800) * 5)
print('y_train[:4] =', np.round(y_train[:4], 1),
      '/ 범위:', round(y_train.min(), 1), '~', round(y_train.max(), 1))

# --- 오류 2 확인: 'accuracy'는 손실 함수가 아니다 ---
tmp = Sequential([Input(shape=(7,)), Dense(1, activation='sigmoid')])
tmp.compile(optimizer='adam', loss='accuracy', metrics=['mse'])
print("compile() 자체는 통과함 (여기서는 오류가 나지 않는다)")
try:
    tmp.fit(X_train, y_train, epochs=1, batch_size=32, verbose=0)
except Exception as e:
    print('fit ->', type(e).__name__, ':', str(e).split("\n")[0])

# --- 오류 1 확인: loss만 고치고 sigmoid를 남겨 두면 ---
tf.keras.utils.set_random_seed(42)
half = Sequential([Input(shape=(7,)), Dense(32, activation='relu'),
                   Dense(1, activation='sigmoid')])           # sigmoid 잔존
half.compile(optimizer='adam', loss='mse', metrics=['mae'])
hh = half.fit(X_train, y_train, epochs=100, batch_size=32,
              validation_split=0.2, verbose=0)
print('sigmoid 잔존 — 마지막 val_mae =', round(hh.history['val_mae'][-1], 2))

# --- 수정 완료본 ---
tf.keras.utils.set_random_seed(42)
model = Sequential()
model.add(Input(shape=(X_train.shape[1],)))
model.add(Dense(32, activation='relu'))
model.add(Dense(1))                                           # 수정 1: 활성화 없음

model.compile(optimizer='adam',
              loss='mse',                                     # 수정 2: 손실 함수
              metrics=['mae'])                                # 수정 2: 지표

history = model.fit(X_train, y_train,
                    epochs=100, batch_size=32,
                    validation_split=0.2, verbose=0)
print('수정본     — 마지막 val_mae =', round(history.history['val_mae'][-1], 2))
print('history 키:', sorted(history.history.keys()))
```

```
y_train[:4] = [199.4 235.6 123.7 121. ] / 범위: 88.8 ~ 277.9
compile() 자체는 통과함 (여기서는 오류가 나지 않는다)
fit -> ValueError : Could not interpret loss identifier: accuracy
sigmoid 잔존 — 마지막 val_mae = 186.05
수정본     — 마지막 val_mae = 24.02
```

> 위 `val_mae` 값은 문제 지시대로 `epochs=100`으로 실행한 결과이며, 환경에 따라 소수점 아래는 달라집니다. `epochs`를 300으로 늘리면 수정본은 4 부근까지 내려가지만 **`sigmoid`가 남은 모델은 186.05에서 전혀 움직이지 않습니다.**

**왜 이렇게 푸는가**

`sigmoid`가 남은 모델의 `val_mae`가 186 근처에서 **한 발짝도 움직이지 않는다**는 것이 이 문제의 핵심입니다.

출력이 0~1 사이로 강제되니 모델이 낼 수 있는 최선의 답은 언제나 1.0이고, 정답의 평균은 약 186입니다. 즉 평균적으로 185 정도씩 틀리는 상태에서 학습이 멈춰 있습니다. 가중치를 아무리 고쳐도 출력 범위 자체가 막혀 있으므로 손실이 줄어들 길이 없습니다.

**이 오류는 오류 메시지를 내지 않습니다.** 학습은 끝까지 정상적으로 돌아가고, `history`도 멀쩡히 만들어집니다. 발견할 수 있는 유일한 단서는 **`mae`가 비정상적으로 크고 전혀 줄지 않는다**는 것뿐입니다. 그래서 회귀 문항에서는 학습 후 `mae`를 타깃의 크기와 비교해 보는 습관이 필요합니다. 타깃 평균이 186인데 `mae`가 186이면 모델이 아무것도 배우지 못한 것입니다.

두 번째 오류는 Q2에서 본 자리 바꿈입니다. 회귀의 표준 조합은 **`loss='mse'` + `metrics=['mae']`** 입니다. `mse`는 오차를 제곱하므로 큰 오차에 민감해 학습 신호가 잘 전달되고, `mae`는 "평균 몇 만큼 틀렸는가"를 사람이 읽기 쉬운 단위로 보여 줍니다.

**자주 틀리는 지점**

- **분류 코드를 복사해 회귀로 고치면서 `loss`만 바꾸는 것** — 이 챕터가 경고하는 대표 사고입니다. 유형을 바꿀 때는 **출력층·loss·metrics 세 줄을 한 묶음으로** 고쳐야 합니다.
- **회귀 출력층에 `relu`를 붙이는 것** — `sigmoid`만큼 치명적이지는 않지만 음수를 낼 수 없게 되므로, 타깃에 음수가 섞인 문제에서는 같은 방식으로 막힙니다. 회귀 출력층은 **활성화 함수를 아예 적지 않는 것**이 정답입니다.
- **`metrics=['accuracy']`를 회귀에 그대로 두는 것** — 오류는 없지만 0에 가까운 무의미한 값만 찍힙니다.
- 오류를 하나만 찾고 넘어가는 것. `loss='accuracy'`는 실행이 멈추니 금방 보이지만, 출력층의 `sigmoid`는 조용히 살아남습니다. **실행이 되기 시작했다고 해서 다 고친 것이 아닙니다.**

---

<!-- verified: 2026-07-28 python3 / tensorflow 2.21.0 (Keras 3) / scikit-learn 1.9.0 / numpy 2.5.0 — Q1~Q6 해답 코드 전량 무오류 실행.
검증된 기대값:
Q1 네 짝(binary_crossentropy·sparse_categorical_crossentropy·categorical_crossentropy·mse) 모두 학습 성공, 출력 shape (None,1)/(None,3)/(None,3)/(None,1). 정수라벨+categorical_crossentropy 교차 배정은 ValueError("target.shape=(None,), output.shape=(None, 3)").
Q2 metrics만 다른 두 학습의 loss 수열 완전 동일(True, [0.730719, 0.722522, 0.714187, 0.705478, 0.696704]). loss='accuracy'는 compile 통과·fit에서 ValueError("Could not interpret loss identifier: accuracy").
Q3 y_train[:5]=[1 0 0 0 0], history 키 ['accuracy','loss','val_accuracy','val_loss'], 지시값 그대로(epochs=50/batch_size=32/validation_split=0.2) 실행 시 val_accuracy 0.9821 — 게재 수치는 이 조건을 본문에 병기함.
Q4 y_train[:8]=[1 1 1 0 0 1 2 2], n_class=3, output_shape (None,3), step=ceil(1600/50)=32, to_categorical 후 (2000,3)·첫 행 [0. 1. 0.] + categorical_crossentropy 학습 성공.
Q5 y_train[:6]=[2 3 1 2 1 0] shape (600,), 잘못된 코드 ValueError("target.shape=(32,), output.shape=(32, 4)"), 수정 A(sparse_)·수정 B(to_categorical) 양쪽 모두 정상 학습·output_shape (None,4).
Q6 y_train 범위 88.8~277.9(평균 185.8), loss='accuracy'는 compile 통과·fit에서 ValueError, sigmoid 잔존 모델 val_mae 186.05(epochs 100/300 모두 동일하게 정체), 수정본 val_mae 24.02(epochs=100) → 4.08(epochs=300).
콜백·evaluate·predict 미사용(Ch06/Ch07 범위 분리 준수) -->
