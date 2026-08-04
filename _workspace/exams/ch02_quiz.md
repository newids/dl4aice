---
chapter: 2
title: "Ch02 확인 문제 — 전제 지식 압축 정리(데이터 준비와 머신러닝)"
items: 6
types: { 객관식: 2, 코드빈칸: 2, 오류찾기: 2 }
---

# Ch02 확인 문제 — 전제 지식 압축 정리(데이터 준비와 머신러닝)

> 본 문제는 공개된 출제 기준에 따른 유형 연습 문제입니다. 기출 원문이 아닌 **기출 변형** 문항입니다.

**구성:** 객관식 2문항 / 코드 빈칸 2문항 / 오류 찾기 2문항
**권장 소요 시간:** 20분

## 공통 데이터

Q3~Q6은 아래 데이터를 사용합니다. 본문 2.1의 예제 데이터에 **범주형 결측치 20건**을 추가로 넣은 것입니다. 실제 시험에서는 이 자리에 `df = pd.read_csv('data.csv')`가 들어갑니다.

```python
import numpy as np
import pandas as pd

rng = np.random.default_rng(42)
n = 1000

tenure_months = rng.integers(1, 72, n)
monthly_fee = rng.normal(60, 15, n).round(2)
support_calls = rng.poisson(1.5, n)
contract_type = rng.choice(['month', 'one_year', 'two_year'], n)

bonus = np.where(contract_type == 'month', 0.8,
                 np.where(contract_type == 'one_year', 0.0, -0.8))
score = -0.04 * tenure_months + 0.02 * monthly_fee + 0.45 * support_calls + bonus
prob = 1 / (1 + np.exp(-(score - score.mean())))

df = pd.DataFrame({
    'tenure_months': tenure_months,
    'monthly_fee': monthly_fee,
    'support_calls': support_calls,
    'contract_type': contract_type,
    'churn': rng.binomial(1, prob),
})

df.loc[rng.choice(n, size=50, replace=False), 'monthly_fee'] = np.nan     # 수치형 결측 50건
df.loc[rng.choice(n, size=20, replace=False), 'contract_type'] = np.nan   # 범주형 결측 20건

print(df.shape)
print(df.isnull().sum())
```

> 출력 요지: `(1000, 5)`, `monthly_fee 50`, `contract_type 20`.

> 각 문항은 **위 코드로 `df`를 새로 만든 직후 상태**에서 시작한다고 보십시오. 앞 문항에서 처리한 결과를 이어받지 않습니다(실기 시험의 의존 구조 연습은 모의고사에서 다룹니다).

---

## 문제

### Q1. (객관식 · 기본) 데이터 준비 순서

범주형 컬럼이 포함된 분류용 데이터를 딥러닝 모델에 넣기 위해 준비하려고 합니다. 데이터 누수를 만들지 않는 **올바른 순서**는?

① 스케일링 → 원-핫 인코딩 → 학습/평가 데이터 분리
② 원-핫 인코딩 → 학습/평가 데이터 분리 → 학습 데이터에 `fit_transform`, 평가 데이터에 `transform`
③ 학습/평가 데이터 분리 → 각각 따로 원-핫 인코딩 → 각각 따로 `fit_transform`
④ 원-핫 인코딩 → 전체 데이터에 `fit_transform` → 학습/평가 데이터 분리
⑤ 학습/평가 데이터 분리 → 전체 데이터에 `fit_transform` → 원-핫 인코딩

---

### Q2. (객관식 · 기본) 인코딩 방식 판별

`contract_type` 컬럼은 `'month'`, `'one_year'`, `'two_year'` 세 값을 갖는 범주형 컬럼입니다. 이 컬럼의 인코딩에 대한 설명으로 **옳은 것**은?

① 라벨 인코딩을 적용하면 컬럼이 3개로 늘어난다
② 원-핫 인코딩은 범주에 없던 크기 관계를 만들어 낸다
③ 계약 기간의 순서를 모델이 알 필요가 없는 상황이라면 `pd.get_dummies`가 기본 선택이다
④ pandas 2.x 이상에서 `pd.get_dummies`는 별도 지정 없이도 0/1 정수 컬럼을 만든다
⑤ `pd.get_dummies(df)`처럼 `columns` 인자를 생략해도 지정한 컬럼 하나만 변환된다

---

### Q3. (코드 빈칸 · 기본) 결측치 처리

`monthly_fee`의 결측치는 **중앙값**으로, `contract_type`의 결측치는 **최빈값**으로 대체하려고 합니다. 빈칸 (가)~(다)를 채우십시오.

```python
df['monthly_fee'] = df['monthly_fee'].____(가)____(df['monthly_fee'].____(나)____())
df['contract_type'] = df['contract_type'].fillna(df['contract_type'].____(다)____[0])

print(df.isnull().sum().sum())
```

> 기대 출력: `0`

---

### Q4. (코드 빈칸 · 응용) 분리와 스케일링

공통 데이터의 `df`를 다음 지시대로 처리하십시오. **결측 처리와 원-핫 인코딩 코드는 이미 채워져 있습니다.**

- 학습 데이터와 평가 데이터를 **8:2**로 분리한다
- `random_state=42`를 사용한다
- 타깃 `churn`의 **클래스 비율을 학습/평가 양쪽에 동일하게 유지**한다
- 모든 특성을 **0~1 범위**로 변환한다 (데이터 누수 없이)

빈칸 (가)~(마)를 채우십시오.

```python
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler

# --- 앞 단계(제시 코드): 결측 처리 → 원-핫 인코딩 ---
df['monthly_fee'] = df['monthly_fee'].fillna(df['monthly_fee'].median())
df['contract_type'] = df['contract_type'].fillna(df['contract_type'].mode()[0])
df_enc = pd.get_dummies(df, columns=['contract_type'], dtype=int)

X = df_enc.drop(columns=['churn'])
y = df_enc['churn']

# --- 여기부터 빈칸 ---
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=____(가)____, random_state=____(나)____, ____(다)____=y)

scaler = MinMaxScaler()
X_train_scaled = scaler.____(라)____(X_train)
X_test_scaled = scaler.____(마)____(X_test)

print(X_train.shape, X_test.shape)
print('NaN:', np.isnan(X_train_scaled).sum(), np.isnan(X_test_scaled).sum())
```

> 기대 출력: `(800, 6) (200, 6)` / `NaN: 0 0`

---

### Q5. (오류 찾기 · 기본) 잘못된 곳 1곳

다음 코드는 오류 메시지 없이 `(700, 6) (300, 6)`을 출력하며 끝까지 실행됩니다. 그러나 채점에서 감점되는 잘못된 처리가 **한 곳** 있습니다. 어디이며 왜 문제인지 밝히고, 올바른 코드로 고치십시오.

```python
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# --- 앞 단계(제시 코드): 결측 처리 → 원-핫 인코딩 ---
df['monthly_fee'] = df['monthly_fee'].fillna(df['monthly_fee'].median())
df['contract_type'] = df['contract_type'].fillna(df['contract_type'].mode()[0])
df_enc = pd.get_dummies(df, columns=['contract_type'], dtype=int)

X = df_enc.drop(columns=['churn'])
y = df_enc['churn']

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.3, random_state=42, stratify=y)

print(X_train.shape, X_test.shape)
```

---

### Q6. (오류 찾기 · 응용) 잘못된 곳 2곳

다음 코드도 오류 없이 끝까지 실행됩니다. 그러나 (1) 결측치가 그대로 남고, (2) 클래스가 불균형한 데이터에서 평가 데이터의 클래스 비율이 원본과 어긋납니다. **두 곳**을 찾아 고치십시오.

```python
df['monthly_fee'].fillna(df['monthly_fee'].median())
df['contract_type'] = df['contract_type'].fillna(df['contract_type'].mode()[0])

df_enc = pd.get_dummies(df, columns=['contract_type'], dtype=int)
X = df_enc.drop(columns=['churn'])
y = df_enc['churn']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42)

print(df['monthly_fee'].isnull().sum())
```

---

## 해답 및 해설

### Q1 해답

**정답: ②**

**정답 코드**

```python
# 인코딩은 분리 '전', 스케일링은 분리 '후'
df_enc = pd.get_dummies(df, columns=['contract_type'], dtype=int)

X = df_enc.drop(columns=['churn'])
y = df_enc['churn']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42, stratify=y)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)   # 학습 데이터: 계산 + 변환
X_test_scaled = scaler.transform(X_test)         # 평가 데이터: 변환만
```

**왜 이렇게 푸는가**

인코딩과 스케일링은 분리 기준으로 **순서 규칙이 반대**입니다.

- **인코딩은 분리 전** — `get_dummies`는 그 데이터에 실제로 존재하는 범주만큼 컬럼을 만듭니다. 분리한 뒤 각각 인코딩하면(③) 한쪽에만 있는 범주 때문에 컬럼 구성이 달라져, 모델 입력 shape이 어긋납니다.
- **스케일링은 분리 후** — `fit`은 "평균과 표준편차(또는 최솟값·최댓값)를 계산해 기억하는" 동작입니다. 전체 데이터로 `fit`하면(①·④·⑤) 평가 데이터의 통계가 변환 규칙에 섞여 들어갑니다. 이것이 **데이터 누수(data leakage)** 이고, 평가 점수가 실제보다 좋게 나옵니다.

기억할 한 줄은 이것입니다. **인코딩은 분리 전, 스케일링은 분리 후.**

**자주 틀리는 지점**

- `scaler.fit_transform(X)` 한 줄로 끝낸 뒤 `train_test_split`을 부르는 코드(④)가 가장 흔한 감점 패턴입니다. 스케일러 관련 코드를 썼다면 `fit_transform`이 **`X_train`에만** 걸려 있는지 항상 확인하십시오.
- 평가 데이터에도 `fit_transform`을 쓰는 실수도 잦습니다. 평가 데이터에는 `transform`만 씁니다.

---

### Q2 해답

**정답: ③**

**실증 코드**

```python
demo = pd.DataFrame({'contract_type': ['month', 'one_year', 'two_year']})

# 아래 cat.codes는 본문에서 다루지 않는 보조 코드입니다.
# 라벨 인코딩의 '결과 모양'을 눈으로 보이기 위한 용도이며, 시험에서 외울 필요는 없습니다.
label = demo['contract_type'].astype('category').cat.codes
print('라벨 인코딩:', label.tolist(), '/ 컬럼 수 1')

onehot = pd.get_dummies(demo, columns=['contract_type'], dtype=int)
print('원-핫 컬럼:', onehot.columns.tolist(), '/ 컬럼 수', onehot.shape[1])

print('dtype 미지정 시:', pd.get_dummies(demo, columns=['contract_type']).dtypes.iloc[0])
```

> 실행 결과: 라벨 인코딩 `[0, 1, 2]` / 컬럼 수 1, 원-핫 컬럼 `['contract_type_month', 'contract_type_one_year', 'contract_type_two_year']` / 컬럼 수 3, `dtype` 미지정 시 `bool`.

**왜 이렇게 푸는가**

라벨 인코딩은 범주에 번호를 붙이므로 컬럼 수가 늘지 않는 대신, `two_year(2)`가 `one_year(1)`보다 "크다"는 **없던 크기 관계**를 만듭니다. 원-핫 인코딩은 범주 개수만큼 0/1 컬럼을 만들어 이 오해를 없앱니다. 계약 유형처럼 순서를 모델이 알 필요가 없는 범주에는 원-핫 인코딩, 즉 `pd.get_dummies`가 기본 선택이며 AICE 실기에서 자주 요구됩니다.

오답 선지를 짚으면 이렇습니다. ①은 라벨과 원-핫의 설명이 뒤바뀌었고, ②는 크기 관계를 만드는 쪽이 라벨 인코딩이므로 반대입니다. ④는 위 실증대로 pandas 2.x 이상에서 `get_dummies`의 기본 결과가 **불리언(True/False)** 이라 틀렸습니다. ⑤는 `columns`를 생략하면 문자 컬럼 **전체**가 한꺼번에 변환되므로 틀렸습니다.

**자주 틀리는 지점**

- `dtype=int`를 빠뜨리면 True/False 컬럼이 만들어집니다. 그대로도 학습은 되지만 스케일링·딥러닝 입력 단계에서 자료형을 확인할 때 혼란이 생기므로, `dtype=int`를 붙이는 습관이 안전합니다.
- `columns=[...]` 생략은 의도치 않은 컬럼까지 원-핫으로 부풀립니다. 대상 컬럼은 항상 명시하십시오.

---

### Q3 해답

**정답 코드**

```python
df['monthly_fee'] = df['monthly_fee'].fillna(df['monthly_fee'].median())   # (가) fillna, (나) median
df['contract_type'] = df['contract_type'].fillna(df['contract_type'].mode()[0])  # (다) mode()

print(df.isnull().sum().sum())
```

> 실행 결과: `0` — 남은 결측치가 없습니다.

**왜 이렇게 푸는가**

- **(가) `fillna`** — 결측치를 지정한 값으로 채우는 함수입니다. `dropna`는 행을 통째로 버리므로, 문항이 "대체하시오"라고 지시했다면 `fillna`입니다.
- **(나) `median`** — 평균(`mean`)과 중앙값(`median`) 중 무엇을 쓸지는 분포가 결정합니다. 이상치가 섞여 있거나 분포가 한쪽으로 치우친 경우 평균은 이상치에 끌려가므로 중앙값이 안전합니다. 다만 실기에서는 대체로 문항이 방법을 직접 지정하므로, **지시된 통계량을 그대로** 쓰는 것이 점수에 직결됩니다.
- **(다) `mode()`** — 범주형은 최빈값으로 채웁니다. `mode()`는 최빈값이 여러 개일 수 있어 **Series를 반환**하므로, `[0]`으로 첫 값을 꺼내야 스칼라가 됩니다.

**자주 틀리는 지점**

- `mode()[0]`의 `[0]`을 빠뜨리면 Series를 채움값으로 넘기게 되어 의도한 대로 채워지지 않습니다. 수치형의 `median()`·`mean()`은 스칼라를 반환하므로 `[0]`이 필요 없다는 점과 짝으로 기억하십시오.
- `df['monthly_fee'].fillna(...)`는 **원본을 바꾸지 않고 새 Series를 반환**합니다. 반드시 `df['col'] = ...`로 다시 대입해야 합니다(Q6 참조).

---

### Q4 해답

**정답 코드**

```python
# --- 앞 단계(제시 코드): 결측 처리 → 원-핫 인코딩 ---
df['monthly_fee'] = df['monthly_fee'].fillna(df['monthly_fee'].median())
df['contract_type'] = df['contract_type'].fillna(df['contract_type'].mode()[0])
df_enc = pd.get_dummies(df, columns=['contract_type'], dtype=int)

X = df_enc.drop(columns=['churn'])
y = df_enc['churn']

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,        # (가) 8:2 분리
    random_state=42,      # (나) 지시된 값 그대로
    stratify=y)           # (다) 클래스 비율 유지

scaler = MinMaxScaler()
X_train_scaled = scaler.fit_transform(X_train)   # (라) 학습 데이터: 계산 + 변환
X_test_scaled = scaler.transform(X_test)         # (마) 평가 데이터: 변환만

print(X_train.shape, X_test.shape)
print('NaN:', np.isnan(X_train_scaled).sum(), np.isnan(X_test_scaled).sum())
print('train 클래스 비율:', y_train.value_counts(normalize=True).round(3).to_dict())
print('test  클래스 비율:', y_test.value_counts(normalize=True).round(3).to_dict())
print('test 스케일 범위:', round(float(X_test_scaled.min()), 4), '~', round(float(X_test_scaled.max()), 4))
```

> 실행 결과: `(800, 6) (200, 6)` / `NaN: 0 0` / train 클래스 비율 `{1: 0.519, 0: 0.481}` / test 클래스 비율 `{1: 0.52, 0: 0.48}` / test 스케일 범위 `-0.1113 ~ 1.0`

**왜 이렇게 푸는가**

- **(가) `test_size=0.2`** — `test_size`는 **평가 데이터의 비율**입니다. "8:2로 나누시오"에서 뒤의 숫자가 평가 몫이므로 0.2이고, "7:3"이면 0.3입니다. 0.8을 넣으면 학습 데이터가 200행이 되어 정반대 결과가 나옵니다.
- **(나) `random_state=42`** — 분리 결과를 고정해 채점자가 같은 결과를 재현할 수 있게 하는 장치입니다. 지정된 숫자를 그대로 씁니다.
- **(다) `stratify=y`** — 타깃 클래스 비율을 학습/평가 양쪽에 동일하게 유지합니다. 문항에 "층화 추출", "클래스 비율을 유지하여"라는 표현이 있으면 이 인자를 뜻합니다.
- **(라)·(마) `fit_transform` / `transform`** — 0~1 범위 변환이라는 지시가 있으므로 `MinMaxScaler`를 쓰고, 최솟값·최댓값 계산(`fit`)은 **학습 데이터에서만** 합니다. 평가 데이터는 그 규칙을 적용받기만 하므로 `transform`입니다.

**자주 틀리는 지점**

- 평가 데이터에 `fit_transform`을 쓰면, `X_test_scaled`의 값이 정확히 0~1에 맞춰지면서 오히려 누수가 생깁니다. 올바른 코드에서는 평가 데이터의 값이 0보다 작거나 1보다 큰 구간으로 나올 수 있으며(검증 실행에서 최솟값 `-0.1113` 관측), 이는 **오류가 아니라 정상**입니다. 이 음수 값을 보고 코드를 "고치려다" 누수를 만드는 사례가 많습니다.
- **결측 처리를 건너뛰고 스케일링으로 직행하면 조용히 망가집니다.** sklearn 스케일러는 `NaN`을 오류 없이 통과시키므로, `X_train_scaled` 안에 `NaN`이 그대로 남은 채 shape과 클래스 비율만 정상으로 보입니다. 그 배열을 딥러닝 모델에 넣으면 손실이 `nan`이 되어 학습이 전혀 진행되지 않습니다. 스케일링 직후 `np.isnan(...).sum()`으로 0을 확인하는 한 줄이 값싼 보험입니다.
- `stratify=y`에 `y_train`이나 `X`를 넣는 실수가 있습니다. 인자에는 분리 대상 타깃 전체(`y`)를 넣습니다.
- 회귀 문제(연속형 타깃)에는 `stratify`를 쓰지 않습니다. 클래스가 없기 때문에 오류가 납니다.

---

### Q5 해답

**잘못된 곳:** 학습/평가 데이터를 분리하기 **전에** 전체 데이터 `X`에 `scaler.fit_transform(X)`을 적용한 부분 — **데이터 누수(data leakage)**

**정답 코드**

```python
# --- 앞 단계(제시 코드 그대로): 결측 처리 → 원-핫 인코딩 ---
df['monthly_fee'] = df['monthly_fee'].fillna(df['monthly_fee'].median())
df['contract_type'] = df['contract_type'].fillna(df['contract_type'].mode()[0])
df_enc = pd.get_dummies(df, columns=['contract_type'], dtype=int)

X = df_enc.drop(columns=['churn'])
y = df_enc['churn']

# 1) 먼저 나눈다  ← 스케일링보다 앞으로 옮긴 것이 수정의 핵심
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42, stratify=y)

# 2) 학습 데이터에만 fit_transform
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)

# 3) 평가 데이터는 transform만
X_test_scaled = scaler.transform(X_test)

print(X_train_scaled.shape, X_test_scaled.shape)
print(pd.Series(scaler.mean_, index=X_train.columns).round(4).to_string())
```

> 실행 결과: `(700, 6) (300, 6)`

**왜 이렇게 푸는가**

`StandardScaler`의 `fit`은 각 컬럼의 평균과 표준편차를 계산해 기억하는 동작입니다. 전체 데이터로 `fit`하면 **평가 데이터의 평균·표준편차가 변환 규칙 안으로 들어옵니다.** 모델이 학습 시점에 알아서는 안 될 정보를 간접적으로 받은 셈이고, 그 결과 평가 점수가 실제보다 좋게 나오며 새 데이터에서는 그 성능이 재현되지 않습니다.

검증 실행에서 두 방식이 기억한 평균값(`scaler.mean_`)이 실제로 달랐습니다. 문항 코드 그대로 실행한 6개 컬럼 전체 결과입니다.

```
컬럼                      전체 데이터로 fit(오답)   학습 데이터로만 fit(정답)
tenure_months                     36.2120                  35.8129
monthly_fee                       59.6398                  59.9597
support_calls                      1.4820                   1.4614
contract_type_month                0.3230                   0.3329
contract_type_one_year             0.3520                   0.3557
contract_type_two_year             0.3250                   0.3114
```

**6개 컬럼 전부에서 기준이 어긋납니다.** 오답 코드의 기준값에는 평가 데이터 300행의 정보가 섞여 있고, 정답 코드의 기준값은 학습 데이터 700행만으로 계산된 값입니다.

또 하나의 증거는 변환 결과입니다. 정답 코드에서 평가 데이터의 변환 후 평균은 정확히 0이 아니라 아래처럼 0 근처의 값으로 흩어집니다.

```
tenure_months  0.0641 / monthly_fee -0.0713 / support_calls          0.0547
month         -0.0697 / one_year    -0.0259 / two_year               0.0977
```

평가 데이터가 자기 자신의 통계가 아니라 **학습 데이터의 기준을 빌려 쓰고 있다**는 뜻이며, 이것이 정상 상태입니다. 반대로 평가 데이터의 평균이 정확히 0이 나온다면 누수를 의심해야 합니다.

**자주 틀리는 지점**

- 이 코드는 오류 없이 실행되고 shape도 정상이므로 스스로 발견하기 어렵습니다. **스케일러 코드를 쓴 직후 `fit_transform`의 인자가 `X_train`인지 확인**하는 것을 고정 절차로 만드십시오.
- `train_test_split`에 `X_scaled`(이미 변환된 배열)를 넘기고 있다는 점도 신호입니다. 분리 함수에는 아직 변환하지 않은 `X`가 들어가는 것이 정상 흐름입니다.
- 누수가 있어도 평가 점수는 오히려 **좋아 보입니다.** 점수가 잘 나왔다는 이유로 순서를 검토하지 않고 넘어가는 것이 가장 위험합니다.

---

### Q6 해답

**잘못된 곳 2군데**

1. `df['monthly_fee'].fillna(...)` — 결과를 **다시 대입하지 않아** 원본 `df`가 그대로입니다.
2. `train_test_split(...)` — 분류 문제인데 **`stratify=y`가 누락**되어 클래스 비율이 유지되지 않습니다.

**정답 코드**

```python
df['monthly_fee'] = df['monthly_fee'].fillna(df['monthly_fee'].median())   # 수정 1: 재대입
df['contract_type'] = df['contract_type'].fillna(df['contract_type'].mode()[0])

df_enc = pd.get_dummies(df, columns=['contract_type'], dtype=int)
X = df_enc.drop(columns=['churn'])
y = df_enc['churn']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42, stratify=y)                      # 수정 2: stratify

print(df['monthly_fee'].isnull().sum())
print(y_test.value_counts(normalize=True).round(3).to_dict())
```

> 실행 결과: 재대입 누락 코드에서는 결측이 `50`건 그대로 남았고, 재대입 후에는 `0`이 되었습니다.

**왜 이렇게 푸는가**

**수정 1** — pandas의 `fillna`는 원본을 바꾸지 않고 **채워진 새 Series를 반환**합니다. 반환값을 받지 않으면 계산만 하고 버리는 셈입니다. 결측 처리 코드를 분명히 썼는데 다음 문항에서 여전히 `NaN`이 나오는 사고는 거의 전부 이 대입 누락입니다. 실행 로그로 확인한 대로, 재대입이 없으면 결측 50건이 그대로 남습니다.

**수정 2** — `stratify=y`가 없으면 분리가 무작위로 이루어져 클래스 비율이 흔들립니다. 클래스가 균형에 가까울 때는 티가 잘 안 나지만, 불균형 데이터에서는 확연합니다. 검증에서 소수 클래스 비율 5%인 데이터로 비교한 결과입니다.

```
원본 소수 클래스 비율        : 0.05
stratify 없이 나눈 test 비율 : 0.04
stratify=y로 나눈 test 비율  : 0.05
```

평가 데이터에 소수 클래스가 덜 들어가면, 그 데이터로 잰 recall·f1이 실제 성능을 반영하지 못합니다. 뒤에 이어지는 딥러닝 문항의 평가까지 함께 흔들리므로 분리 단계에서 잡아야 합니다.

**자주 틀리는 지점**

- 두 오류 모두 **오류 메시지가 나지 않습니다.** 그래서 "코드를 썼으니 됐다"고 넘어가기 쉽습니다. 결측 처리 직후에는 `print(df.isnull().sum())`로, 분리 직후에는 `print(y_train.value_counts(normalize=True))`로 결과를 눈으로 확인하는 습관이 방어책입니다.
- `df['col'].fillna(..., inplace=True)` 형태를 떠올릴 수 있으나, 최신 pandas에서는 권장되지 않는 방향입니다. 이 교재는 **재대입 방식**으로 통일합니다.
- `stratify`는 분류에서만 씁니다. 타깃이 연속형인 회귀 문제에 넣으면 오류가 납니다.

---

## 수정 이력

| 일자 | 대상 | 사유 (QA 리포트 ID) | 조치 |
|------|------|---------------------|------|
| 2026-07-28 | Q5 문제·해답 | QA-CH02-C1 (CRITICAL) — 공통 데이터 실행 규약상 `df_enc` 미정의로 `NameError` 발생, 지문의 "오류 없이 실행된다"가 사실과 반대 | 문제·해답 블록 서두에 결측 처리 2줄 + `get_dummies` 1줄을 제시 코드로 추가해 **자기완결화**. 지문에 실제 출력 `(700, 6) (300, 6)` 명시 |
| 2026-07-28 | Q5 해설 | QA-CH02-H2 (HIGH) — 게재 증적이 3컬럼 조건에서 뽑힌 값이라 문항 코드로 재현 불가 | 수정된 문항 코드로 재실행해 **6컬럼 전체 `scaler.mean_` 대조표**로 교체, 평가 데이터 변환 후 평균 6개 값도 교체 |
| 2026-07-28 | Q4 문제·해답 | QA-CH02-H3 (HIGH) — 지문 "전처리를 마친 `df_enc`"와 달리 결측이 남아 스케일링 결과에 NaN 50개 잔존 | 코드에 결측 처리 2줄 추가, 지문을 "결측 처리와 인코딩 코드는 이미 채워져 있습니다"로 수정. `NaN: 0 0` 검증 출력 및 "스케일러는 NaN을 조용히 통과시킨다" 감점 포인트 추가 |
| 2026-07-28 | Q2 해설 | QA-CH02-M3 (MEDIUM) — 본문 미출제 API `cat.codes` 무설명 사용 | "본문에서 다루지 않는 보조 코드" 주석 2줄 추가 |
| 2026-07-28 | Q2 해설 | QA-CH02-L3 (LOW) — 비공개 기출에 대한 빈도 단정 | "압도적으로 자주 요구됩니다" → "자주 요구됩니다" |

<!-- verified: 2026-07-28 (재검증 v2, QA-CH02-C1/H2/H3 수정 후) python 3.13.5 / pandas 3.0.3 / scikit-learn 1.9.0 / numpy 2.5.0 — 전 문항 코드를 "공통 데이터 직후 상태"에서 각각 독립 실행, ALL CHECKS PASSED.
  Q2 라벨 [0,1,2]·원핫 3컬럼·dtype 미지정 시 bool.
  Q3 isnull().sum().sum() = 0.
  Q4 (800,6) (200,6) / NaN 0,0 (assert 통과) / train {1:0.519, 0:0.481} test {1:0.52, 0:0.48} / MinMax test 범위 -0.1113~1.0.
  Q5 NameError 소거 확인, (700,6) (300,6) 정상 출력. 전체 fit mean_ [36.2120, 59.6398, 1.4820, 0.3230, 0.3520, 0.3250] vs train만 fit mean_ [35.8129, 59.9597, 1.4614, 0.3329, 0.3557, 0.3114] — 6/6 컬럼 전부 불일치. 평가 데이터 변환 후 평균 [0.0641, -0.0713, 0.0547, -0.0697, -0.0259, 0.0977].
  Q6 재대입 누락 시 결측 50건 잔존→재대입 후 0 / stratify 없음 test 소수클래스 0.04 vs 적용 0.05(원본 0.05) / 수정본 test 비율 {1:0.52, 0:0.48}. -->
