---
chapter: 4
title: "Ch04 확인 문제 — Keras로 모델 만들기"
items: 6
types: { 객관식: 2, 코드빈칸: 2, 오류찾기: 2 }
---

# Ch04 확인 문제 — Keras로 모델 만들기

> 본 문제는 공개된 출제 기준에 따른 유형 연습 문제입니다. 기출 원문이 아닙니다.
>
> 이 챕터의 범위는 **모델 구성까지**입니다. `compile()`·`fit()`은 Ch05, 평가는 Ch07에서 다룹니다.
> 따라서 모든 문항은 `Sequential` / `Input` / `Dense` / `Dropout` / `BatchNormalization` / `summary()`만으로 풀립니다.
>
> 총 6문항 (객관식 2 / 코드 빈칸 2 / 오류 찾기 2), 권장 소요 시간 20분.
> 공통 import는 다음과 같다고 가정합니다.
>
> ```python
> import numpy as np
> from tensorflow.keras.models import Sequential
> from tensorflow.keras.layers import Input, Dense, Dropout, BatchNormalization
> ```

---

## 문제

### Q1. (객관식 · 기본) 입력 정의

전처리를 모두 마친 `X_train`의 shape가 `(1200, 12)`입니다.
이 데이터로 학습할 모델의 **입력 정의**로 옳은 것은?

1. `model.add(Input(shape=(1200, 12)))`
2. `model.add(Input(shape=(1200,)))`
3. `model.add(Input(shape=(12,)))`
4. `model.add(Input(shape=(12)))`
5. `model.add(Input(shape=(12, 1200)))`

---

### Q2. (객관식 · 기본) Param # 읽기

다음과 같이 구성한 모델의 `model.summary()`가 출력하는 **Total params**는 얼마입니까?

```python
model = Sequential()
model.add(Input(shape=(10,)))
model.add(Dense(16, activation='relu'))
model.add(Dense(8, activation='relu'))
model.add(Dense(3, activation='softmax'))
model.summary()
```

1. 27
2. 208
3. 312
4. 339
5. 360

---

### Q3. (코드 빈칸 · 기본) 이진분류 모델 구성

전처리를 마친 `X_tr`의 shape가 `(800, 15)`이고, 타깃은 0 또는 1인 **이진분류** 문제입니다.
은닉층 2개(노드 64 → 32, 활성화 함수는 `relu`)를 두는 모델을 구성하십시오.

`(가)`에는 특성 수를 **데이터에서 뽑아내는 코드**를, `(나)`에는 입력 정의 한 줄을, `(다)`에는 출력층 한 줄을 채우십시오.

```python
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense

X_tr = np.zeros((800, 15))          # 전처리를 마친 학습 데이터라고 가정합니다

n_features = ______(가)______

model = Sequential()
model.add(______(나)______)
model.add(Dense(64, activation='relu'))
model.add(Dense(32, activation='relu'))
model.add(______(다)______)

model.summary()
```

추가로, 이 모델의 **Total params**를 계산식과 함께 쓰십시오.

---

### Q4. (코드 빈칸 · 응용) 다중분류 모델 + 보조 층

`y_train`은 정수 라벨이고, `X_tr`의 특성 수는 20입니다.
첫 은닉층 뒤에 **BatchNormalization → Dropout(0.3)** 순서로 보조 층을 넣고, 두 번째 은닉층 뒤에도 `Dropout(0.3)`을 넣는 **다중분류** 모델을 구성하십시오.

`(가)`에는 클래스 개수를 **데이터에서 뽑아내는 코드**를, `(나)`·`(다)`에는 보조 층 두 줄을, `(라)`에는 출력층 한 줄을 채우십시오.

```python
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense, Dropout, BatchNormalization

X_tr = np.zeros((10, 20))
y_train = np.array([0, 2, 1, 3, 2, 0, 1, 3, 3, 1])

n_features = X_tr.shape[1]
n_class = ______(가)______

model = Sequential()
model.add(Input(shape=(n_features,)))
model.add(Dense(64, activation='relu'))
model.add(______(나)______)
model.add(______(다)______)
model.add(Dense(32, activation='relu'))
model.add(Dropout(0.3))
model.add(______(라)______)

model.summary()
```

추가로, `summary()`에서 `BatchNormalization` 층의 Param #가 몇으로 찍히는지와, 그중 일부가 **Non-trainable params**로 분류되는 이유를 한 줄로 쓰십시오.

---

### Q5. (오류 찾기 · 기본) 입력 정의가 잘못된 모델

아래 코드는 오류 메시지 없이 실행되지만, `summary()`의 출력 shape가 의도와 다릅니다.
**잘못된 줄 한 곳**을 찾아 지적하고, 올바르게 고친 코드를 쓰십시오.

```python
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense

X_train = np.zeros((1000, 8))       # 샘플 1000개, 특성 8개

model = Sequential()
model.add(Input(shape=X_train.shape))
model.add(Dense(32, activation='relu'))
model.add(Dense(1, activation='sigmoid'))

model.summary()
print(model.output_shape)
```

---

### Q6. (오류 찾기 · 응용) 다중분류 모델의 두 가지 오류

`y_train`에는 0, 1, 2, 3 네 종류의 클래스가 들어 있습니다.
아래 모델 구성 코드에는 **잘못된 곳이 두 군데** 있습니다. 각각을 지적하고 수정한 전체 코드를 쓰십시오.

```python
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense, Dropout

y_train = np.array([0, 1, 2, 3, 1, 0, 3, 2])

model = Sequential()
model.add(Input(shape=(20,)))
model.add(Dense(64, activation='relu'))
model.add(Dropout(0.3))
model.add(Dense(32, activation='relu'))
model.add(Dense(2, activation='softmax'))
model.add(Dropout(0.3))

model.summary()
```

---

## 해답 및 해설

### Q1 해답

**정답: 3번 `model.add(Input(shape=(12,)))`**

**정답 코드 (실증 예제)**

```python
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense

X_train = np.zeros((1200, 12))
n_features = X_train.shape[1]        # 12

model = Sequential()
model.add(Input(shape=(n_features,)))
model.add(Dense(32, activation='relu'))
print("X_train.shape :", X_train.shape)
print("n_features    :", n_features)
print("출력 shape    :", model.output_shape)
```

```
X_train.shape : (1200, 12)
n_features    : 12
출력 shape    : (None, 32)
```

**왜 이렇게 푸는가**

`Input(shape=...)`에 넣는 것은 **샘플 한 개의 모양**입니다. 표 형태 데이터에서 샘플 한 개는 컬럼 12개짜리 한 줄이므로 `(12,)`입니다. 샘플이 몇 개 들어올지는 학습할 때 정해지므로 모델은 알 필요가 없고, 그 자리는 `summary()`에서 `None`으로 표시됩니다.

숫자 `12`를 손으로 적지 말고 `X_train.shape[1]`로 뽑는 습관이 중요합니다. 원-핫 인코딩으로 컬럼이 늘거나 불필요한 컬럼을 지우면 특성 수가 바뀌는데, 손으로 적은 숫자는 그때 그대로 틀린 값이 됩니다.

**자주 틀리는 지점**

- **1번·2번처럼 샘플 수(1200)를 넣는 것** — 이 챕터에서 가장 흔한 실수입니다. shape에 행 수는 절대 들어가지 않습니다.
- **4번 `shape=(12)`** — 괄호만 쳤을 뿐 파이썬에서는 그냥 정수 `12`입니다. 원소가 하나인 튜플은 반드시 쉼표를 붙여 `(12,)`로 씁니다. 실제로 실행하면 `ValueError: Cannot convert '12' to a shape.`가 납니다.
- 5번처럼 순서를 뒤집는 것도 같은 오해에서 나옵니다. 정답은 언제나 `(특성 수,)` 하나짜리 튜플입니다.

---

### Q2 해답

**정답: 4번 (339)**

**정답 코드 (실증 예제)**

```python
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense

model = Sequential()
model.add(Input(shape=(10,)))
model.add(Dense(16, activation='relu'))
model.add(Dense(8, activation='relu'))
model.add(Dense(3, activation='softmax'))
model.summary()

hand = (10 * 16 + 16) + (16 * 8 + 8) + (8 * 3 + 3)
print("손 계산 :", (10 * 16 + 16), "+", (16 * 8 + 8), "+", (8 * 3 + 3), "=", hand)
print("실제 값 :", model.count_params())
```

```
Layer (type)              Output Shape        Param #
=====================================================
dense (Dense)             (None, 16)              176
dense_1 (Dense)           (None, 8)               136
dense_2 (Dense)           (None, 3)                27
=====================================================
Total params: 339

손 계산 : 176 + 136 + 27 = 339
실제 값 : 339
```

**왜 이렇게 푸는가**

층마다 계산식은 언제나 동일합니다.

```
파라미터 수 = (앞 층 노드 수 × 이 층 노드 수) + 이 층 노드 수
```

앞부분이 가중치, 뒤에 더하는 것이 **노드마다 하나씩 있는 편향**입니다.

- 1층: `(10 × 16) + 16 = 176`
- 2층: `(16 × 8) + 8 = 136`
- 3층: `(8 × 3) + 3 = 27`
- 합계: **339**

여기서 "앞 층 노드 수"의 첫 값은 `Input(shape=(10,))`의 10입니다. `Input`은 계산을 하지 않으므로 `summary()` 표에 행으로 나타나지 않지만, 첫 `Dense`의 가중치 크기를 정하는 근거가 됩니다.

**자주 틀리는 지점**

- **편향을 빼고 세는 것** — `10×16 + 16×8 + 8×3 = 312`(3번)가 되어 딱 편향 개수(16+8+3=27)만큼 모자랍니다. 오답 3번이 이 함정입니다.
- 출력층(`Dense(3)`)을 파라미터 합계에서 빼먹는 것. 출력층도 가중치와 편향을 가진 학습 대상 층입니다.
- `Input`을 빠뜨린 채 `summary()`를 부르면 Total params가 0으로 나오거나 "모델이 아직 build되지 않았다"는 메시지가 뜹니다. 입력 크기를 모르면 가중치 행렬 크기를 정할 수 없기 때문입니다.

---

### Q3 해답

**정답 코드**

```python
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense

X_tr = np.zeros((800, 15))

n_features = X_tr.shape[1]                       # (가)

model = Sequential()
model.add(Input(shape=(n_features,)))            # (나)
model.add(Dense(64, activation='relu'))
model.add(Dense(32, activation='relu'))
model.add(Dense(1, activation='sigmoid'))        # (다)

model.summary()
print("층 개수(Dense만):", len(model.layers))
print("출력 shape:", model.output_shape)
```

```
Layer (type)              Output Shape        Param #
=====================================================
dense (Dense)             (None, 64)            1,024
dense_1 (Dense)           (None, 32)            2,080
dense_2 (Dense)           (None, 1)                33
=====================================================
Total params: 3,137

층 개수(Dense만): 3
출력 shape: (None, 1)
```

**Total params:** `(15 × 64 + 64) + (64 × 32 + 32) + (32 × 1 + 1) = 1024 + 2080 + 33` → **3,137**

**왜 이렇게 푸는가**

- **(가) `X_tr.shape[1]`** — `shape`는 `(샘플 수, 특성 수)`이므로 필요한 것은 인덱스 1입니다. 숫자 15를 직접 적지 않는 이유는 Q1 해설과 같습니다.
- **(나) `Input(shape=(n_features,))`** — Keras 2와 3 양쪽에서 동작하는 표준 표기입니다. 구버전 표기 `Dense(64, activation='relu', input_shape=(n_features,))`는 읽을 줄만 알면 되고, 새로 쓸 때는 `Input`을 씁니다.
- **(다) `Dense(1, activation='sigmoid')`** — 타깃이 0 또는 1인 이진분류이므로 출력은 "1일 확률" 하나입니다. 노드 1개 + `sigmoid`가 짝입니다.

`print(len(model.layers))`가 3인 것도 확인 포인트입니다. `Input`은 입력 형태 선언일 뿐 연산 층이 아니어서 층 목록에 세지 않습니다.

**자주 틀리는 지점**

- **은닉층 개수 세기** — "은닉층 2개 이상"에서 은닉층은 **입력층과 출력층을 뺀 중간층**입니다. `Dense(64)` 하나만 두고 출력층을 붙이면 은닉층은 1개뿐이라 조건 미달입니다.
- `X_tr.shape[0]`(=800)을 쓰는 실수. 인덱스 0은 샘플 수입니다.
- 출력층에 `activation='relu'`를 그대로 두는 것. relu는 0 이상 아무 값이나 내므로 확률로 해석할 수 없습니다.

---

### Q4 해답

**정답 코드**

```python
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense, Dropout, BatchNormalization

X_tr = np.zeros((10, 20))
y_train = np.array([0, 2, 1, 3, 2, 0, 1, 3, 3, 1])

n_features = X_tr.shape[1]
n_class = len(np.unique(y_train))                 # (가)  -> 4

model = Sequential()
model.add(Input(shape=(n_features,)))
model.add(Dense(64, activation='relu'))
model.add(BatchNormalization())                   # (나)
model.add(Dropout(0.3))                           # (다)
model.add(Dense(32, activation='relu'))
model.add(Dropout(0.3))
model.add(Dense(n_class, activation='softmax'))   # (라)

model.summary()
print("클래스 개수:", n_class)
print("출력 shape:", model.output_shape)
```

```
Layer (type)                     Output Shape       Param #
===========================================================
dense (Dense)                    (None, 64)            1,344
batch_normalization              (None, 64)              256
dropout (Dropout)                (None, 64)                0
dense_1 (Dense)                  (None, 32)            2,080
dropout_1 (Dropout)              (None, 32)                0
dense_2 (Dense)                  (None, 4)               132
===========================================================
Total params: 3,812
Trainable params: 3,684
Non-trainable params: 128

클래스 개수: 4
출력 shape: (None, 4)
```

**BatchNormalization의 Param #:** `64 × 4 = 256`이 찍히고, 그중 **절반인 128이 Non-trainable**입니다. 학습으로 조정하는 값 두 종류와, 학습 중 관찰한 통계를 저장해 두는 값 두 종류가 함께 들어 있기 때문입니다. 오류가 아니므로 그대로 두면 됩니다.

**왜 이렇게 푸는가**

- **(가) `len(np.unique(y_train))`** — 클래스 개수는 눈으로 세지 말고 데이터에서 뽑습니다. 라벨에 0~3이 들어 있으므로 4가 나옵니다. 시험에서는 클래스가 5개, 7개인 데이터도 나오며, 손으로 센 숫자는 전처리 결과가 바뀌면 그대로 틀립니다.
- **(나)(다) `BatchNormalization()` → `Dropout(0.3)` 순서** — 둘 다 은닉층 `Dense` **뒤**에 붙습니다. BatchNormalization이 층을 지나는 값의 분포를 먼저 정돈하고, 그다음 Dropout이 노드 일부를 끕니다. 순서를 바꿔도 실행은 되지만 교재 표준 배치는 `Dense → BatchNormalization → Dropout`입니다.
- **(라) `Dense(n_class, activation='softmax')`** — 다중분류 출력층은 클래스 개수만큼 노드를 두고 softmax로 합이 1인 확률 분포를 만듭니다. 출력 shape가 `(None, 4)`인지 `summary()`로 반드시 확인하십시오.

`Dropout(0.3)`의 0.3은 **끄는 비율**이지 남기는 비율이 아닙니다. Dropout 층의 Param #가 0인 것도 정상입니다. 노드를 끄기만 할 뿐 학습하는 값이 없습니다.

**자주 틀리는 지점**

- **출력층 units와 클래스 수 불일치** — `Dense(3, 'softmax')`처럼 클래스 수보다 적게 두면 구성 단계에서는 아무 말이 없다가 학습 단계에서 라벨과 출력 개수가 맞지 않아 오류가 납니다. `len(np.unique(y))`로 뽑으면 이 사고가 사라집니다.
- `BatchNormalization`을 괄호 없이 `model.add(BatchNormalization)`으로 쓰는 것. 층은 **인스턴스**를 만들어 넣어야 하므로 `()`가 필요합니다.
- BatchNormalization의 Non-trainable params를 보고 "모델이 잘못 만들어졌다"고 판단해 층을 지우는 것. 정상 동작입니다.

---

### Q5 해답

**잘못된 줄:** `model.add(Input(shape=X_train.shape))`
`X_train.shape`는 `(1000, 8)`이므로 **샘플 수 1000이 입력 shape에 그대로 들어갔습니다.**

**정답 코드**

```python
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense

X_train = np.zeros((1000, 8))

# --- 잘못된 코드의 결과 확인 ---
bad = Sequential()
bad.add(Input(shape=X_train.shape))              # (1000, 8) 이 통째로 들어감
bad.add(Dense(32, activation='relu'))
bad.add(Dense(1, activation='sigmoid'))
print("[잘못] 출력 shape:", bad.output_shape)

# --- 수정 ---
fixed = Sequential()
fixed.add(Input(shape=(X_train.shape[1],)))      # 특성 수만 튜플로
fixed.add(Dense(32, activation='relu'))
fixed.add(Dense(1, activation='sigmoid'))
print("[수정] 출력 shape:", fixed.output_shape)
fixed.summary()
```

```
[잘못] 출력 shape: (None, 1000, 1)
[수정] 출력 shape: (None, 1)
```

**왜 이렇게 푸는가**

이 오류가 위험한 이유는 **실행이 성공한다**는 데 있습니다. 오류 메시지가 없으니 그대로 다음 단계로 넘어가기 쉽습니다.

잘못된 코드의 출력 shape는 `(None, 1000, 1)`입니다. "샘플 하나가 1000줄짜리 표"라고 선언한 셈이므로, 모델은 샘플마다 예측을 1,000개씩 만들어 냅니다. 정답 `y_train`은 샘플당 값 하나이므로 학습 단계에서 shape 불일치 오류로 이어집니다.

수정은 `X_train.shape[1]`로 **특성 수만 꺼내 원소 하나짜리 튜플**로 넘기는 것입니다. 수정 후 출력 shape가 `(None, 1)`, 즉 "샘플당 확률 1개"로 바뀝니다.

**자주 틀리는 지점**

- `shape=X_train.shape`처럼 shape를 통째로 넘기는 것. 편해 보이지만 항상 샘플 수가 딸려 들어갑니다.
- 오류가 학습 단계에서 터지기 때문에 **원인을 `fit()` 쪽에서 찾는 것**. 구성 직후 `model.summary()`를 한 번 호출해 출력 shape가 `(None, 1)`인지 눈으로 확인하면 이 시간 낭비를 막을 수 있습니다.
- 고칠 때 `Input(shape=(8))`으로 쉼표를 빠뜨리는 것. `ValueError: Cannot convert '8' to a shape.`가 납니다.

---

### Q6 해답

**잘못된 곳 2군데**

1. `model.add(Dense(2, activation='softmax'))` — `y_train`의 클래스는 **4개**인데 출력층 노드가 2개입니다. 출력 shape가 `(None, 2)`가 되어 클래스 4개를 표현할 수 없습니다.
2. `model.add(Dropout(0.3))`이 **출력층 뒤**에 붙었습니다. 마지막 `Dense`는 언제나 모델의 맨 아래에 있어야 합니다.

**정답 코드**

```python
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense, Dropout

y_train = np.array([0, 1, 2, 3, 1, 0, 3, 2])
n_class = len(np.unique(y_train))                  # 4

model = Sequential()
model.add(Input(shape=(20,)))
model.add(Dense(64, activation='relu'))
model.add(Dropout(0.3))
model.add(Dense(32, activation='relu'))
model.add(Dropout(0.3))                            # 은닉층 뒤로 이동
model.add(Dense(n_class, activation='softmax'))    # units를 클래스 수에 맞춤

model.summary()
print("출력 shape:", model.output_shape)
print("마지막 층 :", type(model.layers[-1]).__name__)
```

```
Layer (type)              Output Shape        Param #
=====================================================
dense (Dense)             (None, 64)            1,344
dropout (Dropout)         (None, 64)                0
dense_1 (Dense)           (None, 32)            2,080
dropout_1 (Dropout)       (None, 32)                0
dense_2 (Dense)           (None, 4)               132
=====================================================
Total params: 3,556

출력 shape: (None, 4)
마지막 층 : Dense
```

수정 전 코드를 그대로 실행하면 `출력 shape: (None, 2)`, `마지막 층: Dropout`이 나옵니다. 이 두 줄만 확인해도 오류 두 개를 동시에 잡아낼 수 있습니다.

**왜 이렇게 푸는가**

- **출력층 units는 클래스 개수와 정확히 같아야 합니다.** 다중분류 출력은 "각 클래스일 확률"의 목록이므로, 노드가 2개면 클래스 4개 중 2개분의 확률만 만들어집니다. 구성 단계에서는 오류가 나지 않고 학습을 시작해야 문제가 드러나므로, `n_class = len(np.unique(y_train))`로 뽑아 쓰는 습관이 유일한 예방책입니다.
- **Dropout은 은닉층 `Dense` 뒤에만 넣습니다.** 출력층 뒤에 두면 최종 확률값 자체가 무작위로 0이 되어 예측 결과가 망가집니다. Dropout은 "학습이 잘 되도록 돕는 보조 층"이지 예측값을 만드는 층이 아니라는 점을 기억하십시오.

두 오류의 공통점은 **`summary()` 한 번이면 잡힌다**는 것입니다. 마지막 행이 `Dense`인지, Output Shape 뒷자리가 클래스 수와 같은지 — 구성 직후 이 두 가지만 확인하는 습관을 들이십시오.

**자주 틀리는 지점**

- 클래스 개수를 눈으로 세다 틀리는 것. 라벨이 1부터 시작하거나(1~4) 중간 번호가 비어 있는 데이터에서 특히 자주 발생합니다.
- 출력층 뒤 `Dropout`을 "마지막에 정규화를 한 번 더 하는 것"으로 잘못 이해하는 것.
- 오류를 하나만 찾고 넘어가는 것. 실기에서는 한 셀 안에 실수가 겹치는 경우가 흔하므로, 구성 코드는 **위에서 아래로 층 순서를 소리 내어 읽듯** 검토하십시오.

---

<!-- verified: 2026-07-28 python3 3.13.5 / tensorflow 2.21.0 (Keras 3) — Q1~Q6 해답 코드 전량 무오류 실행. 검증된 기대값: Q1 output_shape (None,32)·shape=(12)는 ValueError, Q2 count_params()==339(176/136/27), Q3 layers 3개·output_shape (None,1)·params 3137, Q4 n_class==4·output_shape (None,4)·BatchNormalization params 256(non-trainable 128), Q5 잘못된 코드 output_shape (None,1000,1) → 수정 후 (None,1), Q6 잘못된 코드 output_shape (None,2)·마지막 층 Dropout → 수정 후 (None,4)·Dense. compile/fit/loss 미사용(Ch05 범위 분리 준수) -->
