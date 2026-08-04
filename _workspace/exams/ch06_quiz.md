---
chapter: 6
title: "Ch06 확인 문제 — 과적합 진단과 대응"
items: 5
types: { 객관식: 2, 코드빈칸: 2, 오류찾기: 1 }
---

# Ch06 확인 문제 — 과적합 진단과 대응

> 본 문제는 공개된 출제 기준에 따른 유형 연습 문제입니다. 기출 원문이 아닙니다.
>
> 이 챕터의 범위는 **학습 곡선 판독 / Dropout / `EarlyStopping` / `ModelCheckpoint`** 입니다.
> 손실 함수 선택은 Ch05, `evaluate`·`predict`와 지표 해석은 Ch07에서 다룹니다.
>
> 실기 딥러닝 문항은 "**EarlyStopping을 적용해 학습시키시오**"라는 지시를 거의 항상 포함합니다.
> Q3의 세 줄을 손이 기억할 때까지 반복하십시오.
>
> 총 5문항 (객관식 2 / 코드 빈칸 2 / 오류 찾기 1), 권장 소요 시간 22분.
> 공통 import는 다음과 같다고 가정합니다.
>
> ```python
> import numpy as np
> import tensorflow as tf
> from tensorflow.keras.models import Sequential, load_model
> from tensorflow.keras.layers import Input, Dense, Dropout
> from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
> ```

---

## 문제

### Q1. (객관식 · 기본) 학습 곡선 판독

은닉층 2개(노드 256)짜리 모델을 `epochs=50`으로 학습시킨 뒤 `history.history`에서 일부 epoch의 값을 뽑았습니다.

| epoch | `loss` | `val_loss` |
|-------|--------|------------|
| 1 | 0.6777 | 0.6341 |
| 5 | 0.2606 | 0.5973 |
| 10 | 0.0601 | 0.7510 |
| 20 | 0.0057 | 1.0657 |
| 35 | 0.0013 | 1.2844 |
| 50 | 0.0005 | 1.4136 |

마지막 epoch의 `accuracy`는 1.0, `val_accuracy`는 0.7321이었습니다.

이 학습 상태에 대한 **진단과 조치**를 옳게 짝지은 것은?

1. 정상 학습이다. 두 손실이 모두 낮으므로 `epochs`를 100으로 늘려 성능을 더 끌어올린다.
2. 과소적합이다. 은닉층 뒤에 `Dropout(0.5)`를 추가해 표현력을 낮춘다.
3. 과적합이다. `Dropout`을 추가하고 `EarlyStopping`을 적용해 검증 손실이 최저인 지점에서 멈추게 한다.
4. 과적합이다. 은닉층 노드 수를 512로 늘리고 `epochs`를 200으로 늘린다.
5. 학습이 불안정하다. `batch_size`를 1로 줄여 가중치를 더 촘촘히 갱신한다.

---

### Q2. (객관식 · 기본) Dropout의 동작

`model.add(Dropout(0.3))`에 대한 설명 중 **옳은 것**은?

1. 은닉층 노드의 30%를 남기고 70%를 영구히 삭제한다.
2. 학습 중에는 매 step마다 그 층 노드의 30%를 무작위로 골라 끄고, `predict()`로 예측할 때는 아무 노드도 끄지 않는다.
3. Dropout 층은 자체 학습 파라미터를 가지므로 `model.summary()`의 Param #가 0이 아니다.
4. 비율을 0.8로 높일수록 과적합 방지 효과가 커지므로 검증 성능이 항상 좋아진다.
5. 두 손실이 모두 높은 값에서 정체한 상태(과소적합)에서도 비율을 높이는 것이 표준 대응이다.

---

### Q3. (코드 빈칸 · 기본) 콜백 표준 3줄

전처리를 마친 `X_train_scaled`(shape `(398, 30)`), `y_train`(0/1)으로 이진분류 모델을 학습시킵니다.
다음 지시를 코드로 옮기십시오.

- 검증 손실을 기준으로 **5 epoch 동안 개선이 없으면 학습을 중단**하고, **가장 좋았던 시점의 가중치로 되돌린다.**
- 검증 손실이 개선될 때만 `'best_model.keras'` 파일에 저장한다.
- `epochs=100`, `batch_size=32`, 학습 데이터의 20%를 검증 데이터로 사용하며, **위 두 콜백을 학습에 적용한다.**

```python
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import Input, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint

# X_train_scaled, y_train, X_test_scaled, y_test 는 전처리가 끝난 상태라고 가정합니다.

model = Sequential()
model.add(Input(shape=(X_train_scaled.shape[1],)))
model.add(Dense(64, activation='relu'))
model.add(Dropout(0.3))
model.add(Dense(64, activation='relu'))
model.add(Dropout(0.3))
model.add(Dense(1, activation='sigmoid'))
model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

es = ______(가)______
mc = ______(나)______

history = model.fit(X_train_scaled, y_train,
                    epochs=100, batch_size=32,
                    validation_split=0.2,
                    ______(다)______,
                    verbose=1)

print('실제로 학습한 epoch 수:', len(history.history['loss']))
```

추가로, `epochs=100`을 지시했는데도 `len(history.history['loss'])`가 100보다 작게 나오는 이유를 한 줄로 쓰십시오.

---

### Q4. (코드 빈칸 · 응용) 중단 지점 확인과 `val_accuracy` 감시

이번에는 **검증 정확도**를 기준으로 감시하려 합니다.
`patience=8`, 최적 시점 가중치 복원을 적용해 `epochs=200`으로 학습시키고, 실제로 몇 epoch에서 멈췄는지와 최고 시점이 몇 번째였는지를 출력하십시오.

`(가)`에는 실제 학습 epoch 수를, `(나)`에는 `val_accuracy`가 가장 높았던 epoch 번호를, `(다)`에는 콜백 정의 한 줄을 채우십시오.

```python
import numpy as np
from tensorflow.keras.callbacks import EarlyStopping

es = ______(다)______

history = model.fit(X_train_scaled, y_train,
                    epochs=200, batch_size=16,
                    validation_split=0.2,
                    callbacks=[es],
                    verbose=0)

print('실제로 학습한 epoch 수:', ______(가)______)
print('val_accuracy 최고 epoch:', ______(나)______)
```

추가로 다음에 답하십시오.

1. 위 코드의 실행 결과 "val_accuracy 최고 epoch"가 **17**로 나왔다면, "실제로 학습한 epoch 수"는 얼마입니까? 근거와 함께 쓰십시오.
2. `monitor='val_loss'`일 때와 달리 `monitor='val_accuracy'`일 때 **추가로 적어 두는 것이 안전한 인자**는 무엇이며 그 이유는 무엇입니까?

---

### Q5. (오류 찾기 · 응용) 동작하지 않는 EarlyStopping

아래 코드는 오류 없이 끝까지 실행되지만, `EarlyStopping`이 **전혀 제 역할을 하지 못합니다.**
잘못된 곳 **세 군데**를 지적하고 수정한 코드를 쓰십시오.

```python
from tensorflow.keras.callbacks import EarlyStopping

es = EarlyStopping(monitor='loss', patience=5)

history = model.fit(X_train_scaled, y_train,
                    epochs=100, batch_size=32,
                    validation_split=0.2,
                    verbose=0)

print('실제로 학습한 epoch 수:', len(history.history['loss']))
```

---

## 해답 및 해설

### Q1 해답

**정답: 3번**

**정답 코드 (문제의 표를 만든 실험과 조치 후 비교)**

```python
import numpy as np
import tensorflow as tf
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping

np.random.seed(42); tf.random.set_seed(42)
X, y = make_classification(n_samples=400, n_features=30, n_informative=5,
                           n_redundant=0, flip_y=0.10, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42, stratify=y)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)


def build(dropout_rate=0.0, units=256):
    m = Sequential()
    m.add(Input(shape=(X_train_scaled.shape[1],)))
    m.add(Dense(units, activation='relu'))
    if dropout_rate > 0:
        m.add(Dropout(dropout_rate))
    m.add(Dense(units, activation='relu'))
    if dropout_rate > 0:
        m.add(Dropout(dropout_rate))
    m.add(Dense(1, activation='sigmoid'))
    m.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    return m


# 문제의 표를 만든 학습 (대책 없음)
tf.keras.utils.set_random_seed(42)
h = build(0.0).fit(X_train_scaled, y_train, epochs=50, batch_size=16,
                   validation_split=0.2, verbose=0).history

print('epoch |   loss   | val_loss')
for e in [1, 5, 10, 20, 35, 50]:
    print(f'{e:5d} | {h["loss"][e-1]:8.4f} | {h["val_loss"][e-1]:8.4f}')
print('검증 손실 최저 epoch:', int(np.argmin(h['val_loss'])) + 1,
      '/ 최저값:', round(min(h['val_loss']), 4))
print('마지막 train accuracy:', round(h['accuracy'][-1], 4),
      '/ 마지막 val accuracy:', round(h['val_accuracy'][-1], 4))
```

```
epoch |   loss   | val_loss
    1 |   0.6777 |   0.6341
    5 |   0.2606 |   0.5973
   10 |   0.0601 |   0.7510
   20 |   0.0057 |   1.0657
   35 |   0.0013 |   1.2844
   50 |   0.0005 |   1.4136
검증 손실 최저 epoch: 3 / 최저값: 0.5857
마지막 train accuracy: 1.0 / 마지막 val accuracy: 0.7321
```

**왜 이렇게 푸는가**

판별 기준은 한 문장입니다. **`loss`는 계속 내려가는데 `val_loss`가 어느 지점부터 올라가면 과적합입니다.**

표를 그 기준으로 읽으면 이렇습니다.

- `loss`는 0.6777 → 0.0005로 끝없이 내려갑니다. **학습 데이터는 사실상 통째로 외웠습니다**(마지막 `accuracy` 1.0).
- `val_loss`는 5 epoch 부근(0.5973)에서 바닥을 찍고, 그 뒤로 0.7510 → 1.0657 → 1.4136으로 **계속 올라갑니다.**
- 두 선이 갈라지는 그 지점이 학습 곡선 도해의 "과적합 시작" 세로 점선입니다.

조치는 챕터 6.6의 순서를 그대로 따릅니다. **① 곡선으로 과적합 확인 → ② Dropout이 없으면 추가 → ③ EarlyStopping으로 멈추는 지점을 맡김.** 3번이 정확히 이 순서입니다.

**자주 틀리는 지점**

- **1번처럼 학습 손실(0.0005)만 보고 "잘 됐다"고 판단하는 것** — 이 챕터에서 가장 위험한 오독입니다. 정답의 근거는 언제나 **검증 손실(`val_loss`)** 입니다. 마찬가지로 `accuracy`가 1.0이라는 사실도 판단 근거가 되지 못합니다. `val_accuracy`가 0.7321이라는 것이 진짜 성적입니다.
- **2번처럼 진단은 틀렸는데 조치만 그럴듯한 것** — `Dropout(0.5)` 추가는 과적합에 맞는 조치이지만, 이 상태를 "과소적합"으로 진단한 순간 답이 아닙니다. 과소적합은 **두 손실이 모두 높은 값에서 정체**하는 모양입니다.
- **4번처럼 과적합에 모델을 더 키우는 것** — 진단은 맞았지만 조치가 정반대입니다. 노드를 늘리면 표현력이 커져 외우기가 더 쉬워집니다. 과적합 상황에서는 오히려 노드 수를 **줄이는** 것이 다음 카드입니다.
- **5번처럼 `batch_size`를 1로 줄이는 것** — 검증 손실이 위아래로 심하게 튀는 "학습 불안정"과 혼동한 것입니다. 이 표의 `val_loss`는 튀지 않고 **일관되게 상승**하고 있습니다. 게다가 `batch_size`를 줄이면 갱신이 더 잦아져 학습이 더 불안정해집니다.

---

### Q2 해답

**정답: 2번**

**정답 코드 (2·3번 실증과 4·5번 반증)**

```python
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense, Dropout

tf.keras.utils.set_random_seed(42)
d = Sequential()
d.add(Input(shape=(X_train_scaled.shape[1],)))
d.add(Dense(64, activation='relu'))
d.add(Dropout(0.3))
d.add(Dense(1, activation='sigmoid'))
d.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

sample = X_train_scaled[:1]
print('predict 1회차:', np.round(d.predict(sample, verbose=0).ravel(), 4))
print('predict 2회차:', np.round(d.predict(sample, verbose=0).ravel(), 4), '<- 동일')
print('학습 모드 1회차:', np.round(d(sample, training=True).numpy().ravel(), 4))
print('학습 모드 2회차:', np.round(d(sample, training=True).numpy().ravel(), 4), '<- 매번 다름')

dl = [l for l in d.layers if isinstance(l, Dropout)][0]
print('Dropout 층의 학습 파라미터 수:', dl.count_params())

print('\n[비율별 비교]')
for rate in [0.0, 0.3, 0.5, 0.8]:
    tf.keras.utils.set_random_seed(42)
    hh = build(rate).fit(X_train_scaled, y_train, epochs=60, batch_size=16,
                         validation_split=0.2, verbose=0).history
    print(f'  dropout={rate}  최저 val_loss={min(hh["val_loss"]):.4f}  '
          f'마지막 val_loss={hh["val_loss"][-1]:.4f}  '
          f'최고 val_acc={max(hh["val_accuracy"]):.4f}')
```

```
predict 1회차: [0.5059]
predict 2회차: [0.5059] <- 동일
학습 모드 1회차: [0.3552]
학습 모드 2회차: [0.5609] <- 매번 다름
Dropout 층의 학습 파라미터 수: 0

[비율별 비교]
  dropout=0.0  최저 val_loss=0.5857  마지막 val_loss=1.4784  최고 val_acc=0.7321
  dropout=0.3  최저 val_loss=0.5776  마지막 val_loss=1.6485  최고 val_acc=0.7857
  dropout=0.5  최저 val_loss=0.5722  마지막 val_loss=1.2115  최고 val_acc=0.7857
  dropout=0.8  최저 val_loss=0.5633  마지막 val_loss=0.5864  최고 val_acc=0.7143
```

> 위 수치는 `n_samples=400`, `flip_y=0.10`의 잡음 섞인 합성 데이터에 `epochs=60`, `batch_size=16`으로 학습한 조건에서의 값입니다. 데이터와 seed가 바뀌면 숫자는 달라지지만 경향은 동일합니다.

**왜 이렇게 푸는가**

2번이 정답인 근거는 실행 결과의 앞 네 줄입니다.

- **`predict()`를 두 번 불러도 값이 `0.5059`로 같습니다.** 예측할 때는 Dropout이 통과 모드가 되어 아무 노드도 끄지 않기 때문입니다. 예측값이 호출할 때마다 달라지면 평가 자체가 불가능해집니다.
- **`training=True`로 부르면 `0.3552`, `0.5609`로 매번 다릅니다.** 학습 중에는 step마다 꺼지는 노드가 바뀐다는 증거입니다.

`Dropout(0.3)`의 0.3은 **끄는 비율**입니다. 노드 몇 개가 수시로 사라지면 모델은 특정 노드에만 의존하는 지름길을 만들 수 없고, 여러 노드가 나눠서 판단하도록 강제됩니다. 이것이 경계선이 덜 구불구불해지는 이유입니다.

**자주 틀리는 지점**

- **1번처럼 비율의 방향을 뒤집는 것** — "0.3이면 30%를 남긴다"고 외우면 `Dropout(0.8)`을 "80%를 살린다"로 오해하게 됩니다. 실제로는 80%를 끄는 것이고, 위 비교표에서 `dropout=0.8`의 최고 `val_acc`가 0.7143으로 **0.3·0.5보다 오히려 낮습니다.** "영구히 삭제한다"는 표현도 틀렸습니다. 매 step마다 다른 노드가 임시로 꺼질 뿐입니다.
- **3번처럼 Param #를 오해하는 것** — Dropout 층의 학습 파라미터는 **0개**입니다. 노드를 끄기만 할 뿐 학습하는 값이 없습니다. `summary()`에서 0으로 찍히는 것을 보고 "층이 잘못 들어갔다"고 판단해 지우는 일이 없어야 합니다.
- **4번처럼 "높을수록 좋다"고 생각하는 것** — 위 결과에서 `dropout=0.8`의 최저 `val_loss`는 낮지만 `val_acc`는 가장 낮습니다. 노드 대부분이 꺼져 모델이 제대로 학습할 기회를 잃은 것입니다. 실기에서는 **0.2~0.5 사이를 쓰고, 지시가 없으면 0.3**을 기본값으로 삼으십시오.
- **5번처럼 과소적합에 Dropout을 더 넣는 것** — 대응이 정반대입니다. 과소적합에서는 Dropout 비율을 **낮추거나 빼고**, 노드 수와 `epochs`를 늘려야 합니다.

---

### Q3 해답

**정답 코드**

```python
import os
import numpy as np
import tensorflow as tf
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import Input, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint

# 데이터 준비 (Ch02)
X, y = load_breast_cancer(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42, stratify=y)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)
print('X_train_scaled:', X_train_scaled.shape, '/ X_test_scaled:', X_test_scaled.shape)

tf.keras.utils.set_random_seed(42)
model = Sequential()
model.add(Input(shape=(X_train_scaled.shape[1],)))
model.add(Dense(64, activation='relu'))
model.add(Dropout(0.3))
model.add(Dense(64, activation='relu'))
model.add(Dropout(0.3))
model.add(Dense(1, activation='sigmoid'))
model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

es = EarlyStopping(monitor='val_loss', patience=5,
                   restore_best_weights=True)                      # (가)
mc = ModelCheckpoint('best_model.keras', monitor='val_loss',
                     save_best_only=True)                          # (나)

history = model.fit(X_train_scaled, y_train,
                    epochs=100, batch_size=32,
                    validation_split=0.2,
                    callbacks=[es, mc],                            # (다)
                    verbose=1)

print('지시한 epochs: 100')
print('실제로 학습한 epoch 수:', len(history.history['loss']))
print('검증 손실 최저 epoch:', int(np.argmin(history.history['val_loss'])) + 1)
print('파일 생성 확인:', os.path.exists('best_model.keras'))

best_model = load_model('best_model.keras')
loss, acc = best_model.evaluate(X_test_scaled, y_test, verbose=0)
print(f'복원 모델 평가 성능 — loss: {loss:.4f}, accuracy: {acc:.4f}')
```

```
X_train_scaled: (398, 30) / X_test_scaled: (171, 30)
지시한 epochs: 100
실제로 학습한 epoch 수: 40
검증 손실 최저 epoch: 35
파일 생성 확인: True
복원 모델 평가 성능 — loss: 0.0629, accuracy: 0.9708
```

**추가 답:** `EarlyStopping`이 `val_loss` 개선이 5 epoch 동안 없자 100번을 채우기 전에 학습을 중단시켰기 때문입니다. (`35 + 5 = 40`)

**왜 이렇게 푸는가**

- **(가) `EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)`**
  - `monitor='val_loss'` — "검증 손실을 기준으로"라는 지시입니다. **학습 손실(`loss`)이 아니라 검증 손실**을 봐야 과적합 시점을 잡을 수 있습니다.
  - `patience=5` — "5 epoch 동안 개선이 없으면"을 그대로 옮긴 값입니다.
  - `restore_best_weights=True` — "가장 좋았던 시점의 가중치로 되돌린다"에 해당합니다. **기본값이 `False`이므로 직접 적어야 합니다.**
- **(나) `ModelCheckpoint('best_model.keras', monitor='val_loss', save_best_only=True)`**
  - 파일 경로는 첫 번째 위치 인자입니다. 확장자는 `.keras`를 씁니다.
  - `save_best_only=True`가 빠지면 매 epoch마다 덮어써서 결국 **마지막 epoch 모델**이 남습니다. 그러면 파일을 만든 의미가 사라집니다.
- **(다) `callbacks=[es, mc]`** — 콜백은 **만들기만 해서는 아무 일도 하지 않습니다.** `fit()`에 리스트로 넘겨야 Keras가 매 epoch 끝에 불러 줍니다.

실행 결과가 이 세 줄의 효과를 그대로 보여 줍니다. 35번째에서 검증 손실이 바닥을 찍었고, `patience=5`만큼 더 기다린 40번째에서 멈췄습니다. `restore_best_weights=True` 덕분에 메모리 위의 `model`이 들고 있는 가중치는 40번째가 아니라 **35번째의 것**입니다.

`EarlyStopping`을 쓸 때 **`epochs`를 넉넉히(100 이상) 주는 것이 정석**인 이유도 여기 있습니다. 어차피 콜백이 알아서 멈추므로, 작게 주면 오히려 최적점에 닿기 전에 끝나 버립니다.

**자주 틀리는 지점**

- **`restore_best_weights=True`를 빠뜨리는 것** — 오류가 나지 않아 가장 잡기 어려운 감점입니다. 학습은 멈추지만 모델에 남는 것은 최저점이 아니라 `patience`만큼 더 나빠진 마지막 epoch의 가중치입니다.
- **`callbacks=[es, mc]`를 `fit()`에 넘기지 않는 것** — 챕터가 "가장 흔한 감점 지점"으로 지목한 실수입니다. Q5에서 그 결과를 숫자로 확인합니다.
- **`validation_split`을 빠뜨린 채 `monitor='val_loss'`를 쓰는 것** — 검증 손실이 계산되지 않아 `Early stopping conditioned on metric 'val_loss' is not available`라는 경고만 뜨고 콜백은 아무 일도 하지 않습니다. **검증 데이터 지정과 `EarlyStopping`은 항상 한 쌍입니다.**
- **파일명을 `'best_model.h5'`나 확장자 없이 쓰는 것** — Keras 3에서는 오류가 날 수 있습니다. `.keras`를 표준으로 쓰십시오.

---

### Q4 해답

**정답 코드**

```python
import numpy as np
import tensorflow as tf
from tensorflow.keras.callbacks import EarlyStopping

es = EarlyStopping(monitor='val_accuracy', patience=8,
                   mode='max', restore_best_weights=True)            # (다)

tf.keras.utils.set_random_seed(42)
model = build(0.3)                       # Q1에서 정의한 은닉층 2개 + Dropout 모델
history = model.fit(X_train_scaled, y_train,
                    epochs=200, batch_size=16,
                    validation_split=0.2,
                    callbacks=[es],
                    verbose=0)

print('실제로 학습한 epoch 수:', len(history.history['loss']))                  # (가)
print('val_accuracy 최고 epoch:', int(np.argmax(history.history['val_accuracy'])) + 1)  # (나)
print('감시 지표:', es.monitor, '/ mode:', es.mode,
      '/ restore_best_weights:', es.restore_best_weights)
```

```
실제로 학습한 epoch 수: 25
val_accuracy 최고 epoch: 17
감시 지표: val_accuracy / mode: max / restore_best_weights: True
```

**추가 1 — 답: 25 epoch**

`EarlyStopping`은 최고 시점 이후 `patience` 만큼 더 기다렸다가 중단합니다.

```
중단 epoch = 최고 epoch + patience = 17 + 8 = 25
```

**추가 2 — 답: `mode='max'`**

`monitor='val_accuracy'`는 **클수록 좋은 지표**입니다. Keras가 지표 이름으로 방향을 추론해 주기는 하지만, 이름이 낯선 사용자 지정 지표에서는 방향을 잘못 잡아 개선을 "악화"로 판단해 곧바로 멈춰 버릴 수 있습니다. `mode='max'`를 명시하면 이 위험이 사라집니다. (`val_loss`는 작을수록 좋으므로 `mode='min'`이며, 이것이 기본 동작입니다.)

**왜 이렇게 푸는가**

- **(가) `len(history.history['loss'])`** — `history.history`의 각 값은 **실제로 수행된 epoch 수만큼의 길이를 가진 리스트**입니다. 그래서 리스트 길이가 곧 실제 학습 epoch 수가 됩니다. `EarlyStopping`이 정말 동작했는지 확인하는 가장 간단한 방법입니다.
- **(나) `int(np.argmax(history.history['val_accuracy'])) + 1`** — `argmax`는 리스트에서 가장 큰 값의 **인덱스**를 돌려주는데, 인덱스는 0부터 시작하고 epoch 번호는 1부터 세므로 **`+ 1`** 이 필요합니다. `val_loss`를 볼 때는 작을수록 좋으므로 `np.argmin`을 씁니다.
- **(다)** 지시문의 세 조건("검증 정확도 기준", "patience=8", "최적 시점 가중치 복원")을 그대로 인자로 옮기고, 클수록 좋은 지표이므로 `mode='max'`를 덧붙입니다.

`17 + 8 = 25`가 정확히 맞아떨어지는 것을 확인하십시오. 이 산술 관계를 알고 있으면 **답안이 의도대로 동작했는지 스스로 검산할 수 있습니다.** 두 숫자의 차이가 `patience`와 다르면 무언가 잘못된 것입니다.

**자주 틀리는 지점**

- **`argmax`/`argmin`을 반대로 쓰는 것** — `val_loss`는 최소(`argmin`), `val_accuracy`는 최대(`argmax`)입니다. 감시 지표가 바뀌면 함께 바뀝니다.
- **`+ 1`을 빠뜨리는 것** — 인덱스 16을 그대로 "16번째 epoch"라고 답하면 `patience`와의 산술이 한 칸씩 어긋납니다.
- **`epochs=200`을 지시받고 그대로 200으로 두는 것을 낭비라고 생각해 줄이는 것** — 콜백을 쓸 때는 `epochs`를 넉넉히 주는 것이 정석입니다. 작게 주면 콜백이 멈추기 전에 학습이 끝나 `EarlyStopping`을 쓴 의미가 사라집니다.
- **`monitor` 이름을 `'accuracy'`로 적는 것** — 그러면 **학습 정확도**를 감시하게 되어 과적합을 전혀 잡지 못합니다. 검증 지표에는 반드시 `val_` 접두어를 붙이십시오.

---

### Q5 해답

**잘못된 곳 3군데**

1. `monitor='loss'` — **학습 손실**을 감시하고 있습니다. 학습 손실은 과적합이 진행돼도 계속 내려가므로 콜백이 멈출 이유를 찾지 못합니다. `monitor='val_loss'`로 고쳐야 과적합 시점을 잡습니다.
2. `restore_best_weights` 누락 — 기본값이 `False`라, 멈추더라도 모델에는 최저점이 아닌 마지막 epoch의 가중치가 남습니다. `restore_best_weights=True`를 적어야 합니다.
3. `fit()`에 `callbacks` 미전달 — `es`를 만들어 놓고 넘기지 않았습니다. **콜백은 `fit(..., callbacks=[es])`로 전달해야만 동작합니다.** 이 상태에서는 위 두 인자를 어떻게 고쳐도 아무 효과가 없습니다.

**정답 코드**

```python
import numpy as np
import tensorflow as tf
from tensorflow.keras.callbacks import EarlyStopping

# ---------- (1) 잘못된 코드: 콜백을 만들었지만 넘기지 않음 ----------
tf.keras.utils.set_random_seed(42)
bad = build(0.3)
es_bad = EarlyStopping(monitor='loss', patience=5)          # 만들어만 둠
h_bad = bad.fit(X_train_scaled, y_train, epochs=100, batch_size=32,
                validation_split=0.2, verbose=0)            # callbacks 없음
print('[잘못] 학습한 epoch 수:', len(h_bad.history['loss']), '(100 전량 소진)')
print('[잘못] 검증 손실 최저 epoch:', int(np.argmin(h_bad.history['val_loss'])) + 1)
print('[잘못] 최저 val_loss:', round(min(h_bad.history['val_loss']), 4),
      '/ 마지막 val_loss:', round(h_bad.history['val_loss'][-1], 4))

# ---------- (2) 콜백은 넘겼지만 monitor='loss' 인 경우 ----------
tf.keras.utils.set_random_seed(42)
mid = build(0.3)
h_mid = mid.fit(X_train_scaled, y_train, epochs=100, batch_size=32, validation_split=0.2,
                callbacks=[EarlyStopping(monitor='loss', patience=5)], verbose=0)
print("[monitor='loss'] 학습한 epoch 수:", len(h_mid.history['loss']),
      '/ 검증 손실 최저 epoch:', int(np.argmin(h_mid.history['val_loss'])) + 1)

# ---------- (3) 수정된 코드 ----------
tf.keras.utils.set_random_seed(42)
model = build(0.3)
es = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
history = model.fit(X_train_scaled, y_train,
                    epochs=100, batch_size=32,
                    validation_split=0.2,
                    callbacks=[es],
                    verbose=0)
print('[수정] 학습한 epoch 수:', len(history.history['loss']))
print('[수정] 검증 손실 최저 epoch:', int(np.argmin(history.history['val_loss'])) + 1)
```

```
[잘못] 학습한 epoch 수: 100 (100 전량 소진)
[잘못] 검증 손실 최저 epoch: 6
[잘못] 최저 val_loss: 0.5685 / 마지막 val_loss: 1.645
[monitor='loss'] 학습한 epoch 수: 47 / 검증 손실 최저 epoch: 6
[수정] 학습한 epoch 수: 11
[수정] 검증 손실 최저 epoch: 6
```

**`restore_best_weights`만 따로 떼어 본 결과**

```python
from sklearn.model_selection import train_test_split

X_a, X_v, y_a, y_v = train_test_split(X_train_scaled, y_train, test_size=0.2,
                                      random_state=42, stratify=y_train)
for rbw in [False, True]:
    tf.keras.utils.set_random_seed(42)
    m = build(0.3)
    h = m.fit(X_a, y_a, epochs=100, batch_size=32, validation_data=(X_v, y_v),
              callbacks=[EarlyStopping(monitor='val_loss', patience=5,
                                       restore_best_weights=rbw)], verbose=0)
    vl, va = m.evaluate(X_v, y_v, verbose=0)
    print(f'restore_best_weights={rbw!s:<5} 중단={len(h.history["loss"])} '
          f'best시점 val_loss={min(h.history["val_loss"]):.4f} '
          f'마지막 val_loss={h.history["val_loss"][-1]:.4f} '
          f'-> 남은 가중치의 val_loss={vl:.4f}')
```

```
restore_best_weights=False 중단= 11 best시점 val_loss=0.5587 마지막 val_loss=0.5671 -> 남은 가중치의 val_loss=0.5671
restore_best_weights=True  중단= 11 best시점 val_loss=0.5587 마지막 val_loss=0.5671 -> 남은 가중치의 val_loss=0.5587
```

> 위 수치는 `n_samples=400`, `flip_y=0.10`의 잡음 섞인 합성 데이터에 은닉층 2개(노드 256) + `Dropout(0.3)`, `epochs=100`, `batch_size=32` 조건에서 실행한 결과입니다. 데이터·seed가 바뀌면 숫자는 달라지지만 세 경우의 대소 관계는 동일합니다.

**왜 이렇게 푸는가**

세 오류가 어떻게 누적되는지 실행 결과가 단계별로 보여 줍니다.

- **콜백을 넘기지 않으면** 100 epoch를 전부 돕니다. 검증 손실은 6번째에서 0.5685로 바닥을 찍었지만 마지막에는 **1.645**까지 올라갔습니다. 즉 남은 모델은 최적 지점보다 약 3배 나쁜 상태입니다. **`epochs=100`이 그대로 소진됐다는 사실 자체가 "콜백이 동작하지 않았다"는 신호**입니다.
- **콜백은 넘겼지만 `monitor='loss'`이면** 47 epoch까지 갑니다. 학습 손실은 과적합 구간에서도 계속 내려가므로 "개선 없음"이 좀처럼 성립하지 않기 때문입니다. 검증 손실 최저점은 여전히 6번째인데 41 epoch를 더 외우는 데 쓴 셈입니다.
- **`monitor='val_loss'`로 고치면** 11 epoch에서 멈춥니다. `6 + 5 = 11`, 최저점 이후 `patience`만큼 기다린 결과입니다.
- **`restore_best_weights`만 따로 본 실험**에서, 둘 다 11 epoch에서 멈추지만 모델에 남는 가중치가 다릅니다. `False`면 마지막 epoch의 값(`val_loss` 0.5671), `True`면 최저점의 값(`val_loss` 0.5587)입니다. **멈추는 시점은 같고 되돌리는지만 다르다**는 것이 이 인자의 정체입니다.

**자주 틀리는 지점**

- **`monitor`에 `val_` 접두어를 빠뜨리는 것** — `'loss'`와 `'val_loss'`는 한 글자 차이지만 감시 대상이 학습 데이터냐 검증 데이터냐로 완전히 갈립니다. 과적합을 잡는 것이 목적이므로 언제나 **검증 지표**를 봅니다.
- **오류가 안 나니까 맞다고 판단하는 것** — 세 오류 모두 예외를 던지지 않습니다. **`print(len(history.history['loss']))` 한 줄**로 실제 학습 epoch 수를 찍어 보는 것이 유일한 자기 검산 수단입니다. 지시한 `epochs`와 같은 숫자가 나왔다면 콜백을 의심하십시오.
- **정확도만으로 개선 여부를 판단하는 것** — 이 데이터에서 세 경우의 평가 정확도 차이는 크지 않지만 손실은 3배 가까이 벌어집니다. **과적합의 손해는 손실에서 먼저, 훨씬 크게 드러납니다.** `EarlyStopping`이 `val_loss`를 기본 감시 대상으로 삼는 이유가 이것입니다.
- **콜백 객체를 만든 줄만 보고 넘어가는 것** — 답안을 검토할 때는 `es = EarlyStopping(...)` 줄과 `model.fit(...)` 줄을 **반드시 짝지어** 확인하십시오. 만든 콜백이 `callbacks=[...]` 안에 모두 들어 있는지가 채점 포인트입니다.

---

<!-- verified: 2026-07-28 python3 / tensorflow 2.21.0 (Keras 3) / scikit-learn 1.9.0 / numpy 2.5.0 — Q1~Q5 해답 코드 전량 무오류 실행.
검증 데이터: (Q1·Q2·Q4·Q5) make_classification(n_samples=400, n_features=30, n_informative=5, n_redundant=0, flip_y=0.10, random_state=42) → train_test_split(test_size=0.3, random_state=42, stratify=y) + StandardScaler. (Q3) load_breast_cancer 동일 분리.
검증된 기대값:
Q1 표의 6개 (loss, val_loss) 쌍 전부 실측치(epoch 1/5/10/20/35/50 = 0.6777·0.6341 / 0.2606·0.5973 / 0.0601·0.7510 / 0.0057·1.0657 / 0.0013·1.2844 / 0.0005·1.4136), val_loss 최저 epoch 3(0.5857), 마지막 accuracy 1.0 / val_accuracy 0.7321 — 과적합 판별 근거 성립.
Q2 predict 2회 동일(0.5059), training=True 2회 상이(0.3552/0.5609), Dropout count_params()==0, 비율별 최고 val_acc 0.7321/0.7857/0.7857/0.7143 (0.8이 0.3·0.5보다 낮음 → 선택지 4 반증).
Q3 breast_cancer 기준 실제 학습 40 epoch, val_loss 최저 35 epoch(35+5=40), best_model.keras 생성 True, 복원 모델 test loss 0.0629 / accuracy 0.9708.
Q4 monitor='val_accuracy', patience=8, mode='max' → 실제 학습 25 epoch, 최고 epoch 17 (17+8=25 정확히 일치). es.mode=='max', es.restore_best_weights==True 확인.
Q5 callbacks 미전달 → 100 epoch 전량 소진, val_loss 최저 epoch 6(0.5685) vs 마지막 1.645. monitor='loss'만 적용 → 47 epoch. 수정본 → 11 epoch(6+5). restore_best_weights 격리(validation_data 고정): False는 남은 가중치 val_loss 0.5671(=마지막), True는 0.5587(=best) — 정확히 일치.
주의: Keras 3에서 callbacks=es(리스트 아닌 단일 객체)는 오류 없이 동작하므로 출제 근거로 쓰지 않고, '콜백을 fit에 전혀 넘기지 않음'을 오류로 삼았음. compile/loss 선택은 Ch05, evaluate/predict 지표 해석은 Ch07 범위로 분리 준수.

[개명 2026-07-31] 커리큘럼 v1.2 §6 정본 변수명 적용 — 제자리 덮어쓰기(`X_train = scaler.fit_transform(X_train)`) 폐지하고 `X_train_scaled`/`X_test_scaled`로 개명. 변경 지점: Q1 해답 스케일링 2줄 + `build()`의 `Input(shape=(X_train_scaled.shape[1],))` + `build(0.0).fit(...)`, Q2 해답 `Input`·`sample = X_train_scaled[:1]`·`build(rate).fit(...)`, Q3 문제 지문/주석/`Input`/`fit` 및 Q3 해답 스케일링 2줄·shape print(출력 라벨 동반 수정)·`Input`·`fit`·`best_model.evaluate(X_test_scaled, ...)`, Q4 문제·해답 `fit`, Q5 문제·해답 `bad.fit`/`mid.fit`/`model.fit`/`train_test_split(X_train_scaled, y_train, ...)`. `train_test_split` 반환값 `X_train`/`X_test`는 미스케일 원본으로 유지(정본 규칙).
개명 후 재실행(tensorflow를 pandas보다 먼저 import): 무오류, 전 수치 개명 전과 완전 일치 — Q1 표 6쌍 및 최저 epoch 3(0.5857)·accuracy 1.0/val 0.7321, Q2 predict 0.5059 2회 동일·training=True 0.3552/0.5609·Dropout params 0·비율별 최고 val_acc 0.7321/0.7857/0.7857/0.7143, Q3 40 epoch·최저 35·shape print `X_train_scaled: (398, 30) / X_test_scaled: (171, 30)`·복원 모델 loss 0.0629/acc 0.9708, Q4 25 epoch·최고 17(17+8=25), Q5 100→47→11(6+5) 및 restore 격리 False 0.5671/True 0.5587. 로직·수치 무변경 확인. -->
