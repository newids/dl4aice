---
mock: 1
title: "실전 모의고사 1회 — 이진분류: 통신사 고객 이탈 예측"
items: 12
points: 100
minutes: 90
type: 이진분류
---

# 실전 모의고사 1회 — 이진분류: 통신사 고객 이탈 예측

> **본 문제는 공개된 출제 기준에 따른 유형 연습 문제입니다.** 기출 문제 원문이 아니며, 공개된 출제 범위·문항 흐름을 바탕으로 재구성한 **기출 변형 문제**입니다.

| 항목 | 내용 |
|------|------|
| 문항 수 | 12문항 (Q1 → Q12 연속 구조) |
| 총 배점 | 100점 |
| 권장 소요 시간 | 90분 |
| 문제 유형 | **이진분류** (타깃 `churn` 0/1) |
| 다루는 범위 | 탐색 → 전처리(결측·인코딩·분리·스케일링) → 머신러닝 베이스라인 → 딥러닝 → 평가 |

> ⚠️ **배점에 관한 안내**
> 본 모의고사의 문항별 배점은 **교재 자체 기준**입니다. AICE Associate 실기의 실제 문항 수·배점 체계는 공개되어 있지 않으며 회차별로 달라질 수 있습니다. 응시 전 **KT AICE 공식 시험 공지 기준을 반드시 확인하십시오.**

---

## 시작하기 전에 — 답안 작성 규칙

실제 시험과 동일한 조건을 만들기 위해 아래 세 가지를 지키면서 푸십시오.

1. **문항 순서대로, 셀을 나눠서 풉니다.** 한 셀에 몰아 쓰면 중간 오류 한 번에 앞 단계 결과까지 잃습니다.
2. **아래 변수명을 그대로 사용합니다.** 뒤 문항이 앞 문항의 변수를 그대로 이어받는 구조입니다.

   | 용도 | 변수명 |
   |------|--------|
   | 원본 데이터프레임 | `df` |
   | 특성 / 타깃 | `X`, `y` |
   | 분리 결과 | `X_train`, `X_test`, `y_train`, `y_test` |
   | 스케일러와 변환 결과 | `scaler`, `X_train_scaled`, `X_test_scaled` |
   | 머신러닝 베이스라인 모델 / 그 예측 | `rf_model`, `rf_pred` |
   | 딥러닝 모델 / 학습 기록 | `model`, `history` |
   | 콜백 | `es`(EarlyStopping), `mc`(ModelCheckpoint) |
   | 예측 확률 / 예측 클래스 | `pred`, `y_pred` |

3. **"출력하시오"라는 지시에는 반드시 `print()`를 씁니다.** 계산만 하고 화면에 남기지 않으면 채점 대상이 되지 않습니다.

4. **타깃(`y`)은 넘파이 배열로 만들어 두면 편합니다.** Keras `fit`이 받는 표준 형태이고, `np.argmax`·비교 연산 등 뒤 문항의 넘파이 계산과 형태가 통일됩니다. 이 회차는 pandas Series 그대로도 정상 동작하지만(2회차는 `to_numpy()`를 지시합니다), **넘파이로 통일하는 습관**을 권합니다.
   (뒤에서 다룰 "학습 셀이 멈추는" 증상은 **import 순서** 문제이며 타깃 자료형과 무관합니다.)

---

## 데이터 준비 (문제 풀이 전 1회 실행)

실제 시험에서는 CSV 파일이 주어집니다. 이 모의고사는 독자가 로컬에서 그대로 재현할 수 있도록, 아래 코드로 **동일한 CSV 파일을 직접 생성**합니다. 이 블록은 문제가 아니므로 그대로 복사해 한 번만 실행하십시오.

> 💡 **로컬 환경 주의 — 반드시 먼저 읽으십시오 (시험장에서는 신경 쓸 필요 없습니다)**
> 일부 로컬 환경(특히 macOS + `pyarrow`가 설치된 pandas 조합)에서는 **`pandas`를 `tensorflow`보다 먼저 import 하면, 뒤의 학습 셀(Q11)에서 `model.fit`이 아무 출력도 없이 멈춥니다.** 그래서 이 교재의 코드 블록은 **데이터 생성 블록과 해답의 공통 import 블록 양쪽 모두 `import tensorflow as tf`를 첫 줄에 두었습니다.** 한쪽만 고치면 효과가 없습니다 — **먼저 실행된 셀이 pandas를 이미 적재**하기 때문입니다.
> **이미 데이터 생성 셀을 pandas 먼저 import한 상태로 실행했다면, 커널을 재시작한 뒤 아래 블록부터 다시 실행하십시오.**

```python
# ===== [문제 아님] 모의고사용 데이터 파일 생성 — 그대로 1회 실행 =====
import tensorflow as tf      # [환경] pandas보다 먼저 import — 위 '로컬 환경 주의' 참고
import numpy as np
import pandas as pd

rng = np.random.default_rng(42)
n = 3000

customer_id = np.array([f'C{i:05d}' for i in range(1, n + 1)])
tenure_months = rng.integers(1, 73, n)
monthly_fee = np.round(rng.normal(65, 18, n).clip(20, 130), 2)
contract_type = rng.choice(['month', 'one_year', 'two_year'], n, p=[0.5, 0.3, 0.2])
internet_service = rng.choice(['dsl', 'fiber', 'no'], n, p=[0.35, 0.45, 0.20])
support_calls = rng.poisson(1.2, n)
total_fee = np.round(tenure_months * monthly_fee * rng.normal(1.0, 0.05, n), 2)

contract_bonus = np.where(contract_type == 'month', 0.9,
                          np.where(contract_type == 'one_year', 0.0, -0.9))
internet_bonus = np.where(internet_service == 'fiber', 0.5,
                          np.where(internet_service == 'dsl', 0.0, -0.5))
score = (-0.045 * tenure_months + 0.015 * monthly_fee
         + 0.40 * support_calls + contract_bonus + internet_bonus)
prob = 1 / (1 + np.exp(-((score - score.mean()) - 1.2)))
churn = rng.binomial(1, prob)

df_raw = pd.DataFrame({
    'customer_id': customer_id,
    'tenure_months': tenure_months,
    'monthly_fee': monthly_fee,
    'total_fee': total_fee,
    'contract_type': contract_type,
    'internet_service': internet_service,
    'support_calls': support_calls,
    'churn': churn,
})
miss_idx = rng.choice(n, size=int(n * 0.05), replace=False)
df_raw.loc[miss_idx, 'total_fee'] = np.nan
df_raw.to_csv('telco_churn.csv', index=False)
print('데이터 파일 생성 완료: telco_churn.csv')
```

### 데이터 명세

`telco_churn.csv` — 통신사 고객 3,000명의 가입 정보와 이탈 여부입니다.

| 컬럼 | 설명 | 자료형 | 비고 |
|------|------|--------|------|
| `customer_id` | 고객 식별 번호 | 문자열 | 예측에 쓰지 않는 식별자 |
| `tenure_months` | 가입 기간(개월) | 정수 | 1~72 |
| `monthly_fee` | 월 요금 | 실수 | — |
| `total_fee` | 누적 결제 금액 | 실수 | **결측치 있음** |
| `contract_type` | 계약 유형 | 문자열 | `month` / `one_year` / `two_year` |
| `internet_service` | 인터넷 서비스 종류 | 문자열 | `dsl` / `fiber` / `no` |
| `support_calls` | 고객센터 문의 횟수 | 정수 | — |
| `churn` | **타깃** — 이탈 여부 | 정수 | 0 = 유지, 1 = 이탈 |

---

## 문제

### Q1. 데이터 로딩과 형태 확인 [5점] — 권장 4분

`telco_churn.csv` 파일을 읽어 데이터프레임 `df`에 저장하시오.
이어서 다음 세 가지를 **출력**하시오.

1. 데이터의 행·열 개수
2. 상위 5개 행
3. 컬럼별 자료형과 결측 여부 요약

---

### Q2. 타깃 분포와 결측치 확인 [5점] — 권장 4분

`df`에 대해 다음 두 가지를 **출력**하시오.

1. 타깃 컬럼 `churn`의 클래스별 개수와 **비율**
2. 컬럼별 결측치 개수

출력 결과를 보고, 이 데이터가 **클래스 불균형** 상태인지 판단할 수 있어야 합니다.

---

### Q3. 시각화 [8점] — 권장 8분

다음 두 개의 그래프를 그리시오. (라이브러리는 `seaborn`, `matplotlib` 사용)

1. **계약 유형(`contract_type`)별 이탈 여부 분포**를 `countplot`으로 그리시오.
   `churn` 값에 따라 막대가 나뉘도록 `hue`를 지정하시오.
2. **수치형 컬럼 간 상관계수**를 `heatmap`으로 그리시오.
   대상 컬럼은 `tenure_months`, `monthly_fee`, `total_fee`, `support_calls`, `churn` 다섯 개이며,
   각 칸에 상관계수 숫자가 표시되도록 하시오.

---

### Q4. 결측치 처리 [7점] — 권장 6분

`total_fee` 컬럼의 결측치를 **해당 컬럼의 중앙값**으로 대체하시오.
처리 후 데이터프레임 전체에 남은 결측치 개수를 **출력**하여 0임을 확인하시오.

> 이후 모든 문항은 결측치가 처리된 `df`를 이어받습니다.

---

### Q5. 불필요한 컬럼 제거 [5점] — 권장 3분

`customer_id` 컬럼은 고객을 구분하기 위한 식별자일 뿐 예측에 도움이 되지 않습니다.
`df`에서 `customer_id` 컬럼을 제거하고, 제거 후의 **컬럼 목록과 데이터 형태를 출력**하시오.

---

### Q6. 범주형 변수 인코딩 [8점] — 권장 8분

문자열로 되어 있는 `contract_type`과 `internet_service` 두 컬럼을 **원-핫 인코딩**하시오.
생성되는 더미 변수는 **0과 1의 정수**가 되도록 하시오.
인코딩 후의 **컬럼 목록과 데이터 형태를 출력**하시오.

---

### Q7. 학습 데이터와 평가 데이터 분리 [8점] — 권장 6분

`churn`을 타깃 `y`로, 나머지 전체 컬럼을 특성 `X`로 나누시오.
이어서 **학습 데이터와 평가 데이터를 7:3으로 분리**하여 `X_train`, `X_test`, `y_train`, `y_test`에 저장하시오.

- `random_state=42`를 사용하시오.
- 타깃의 **클래스 비율이 학습·평가 양쪽에 동일하게 유지**되도록 하시오.

분리 후 `X_train`과 `X_test`의 형태, 그리고 `y_train`·`y_test`의 클래스 비율을 **출력**하시오.

---

### Q8. 스케일링 [8점] — 권장 6분

`StandardScaler`를 사용해 특성을 표준화하시오.

- 스케일러 객체는 `scaler`라는 이름으로 만드시오.
- **평가 데이터의 정보가 변환 규칙에 섞여 들어가지 않도록** 처리하시오.
- 변환 결과는 각각 `X_train_scaled`, `X_test_scaled`에 저장하시오.

변환 후 두 배열의 형태와, `X_train_scaled`의 평균·표준편차를 **출력**하시오.

---

### Q9. 머신러닝 베이스라인 [10점] — 권장 9분

딥러닝 모델의 성능을 비교할 기준선을 만듭니다.
`RandomForestClassifier`로 베이스라인 모델을 학습시키고 평가 데이터 성능을 확인하시오.

- 모델 변수명은 `rf_model`로 하시오. (뒤 문항의 딥러닝 모델 `model`과 겹치지 않게 하기 위함입니다.)
- `n_estimators=100`, `random_state=42`를 사용하시오.
- `X_train_scaled`로 학습하고 `X_test_scaled`로 예측하시오.
- 평가 데이터에 대한 **정확도(accuracy)** 와 **`classification_report`** 를 출력하시오.

---

### Q10. 딥러닝 모델 구성과 컴파일 [12점] — 권장 12분

이 문제 유형에 맞는 딥러닝 모델을 `model`이라는 이름으로 만드시오.

**구성 조건**

- `Sequential` 모델을 사용하시오.
- 입력층은 `X_train_scaled`의 특성 개수에 맞춰 지정하시오.
- **은닉층을 2개 이상** 쌓되, 활성화 함수는 `relu`를 사용하시오.
- 은닉층 사이에 **`Dropout`을 포함**시키시오.
- 출력층은 **이진분류에 맞는 노드 수와 활성화 함수**로 지정하시오.
- 구성 후 `model.summary()`로 구조를 **출력**하시오.

**컴파일 조건**

- optimizer는 `adam`을 사용하시오.
- 손실 함수는 **이진분류에 맞는 것**을 선택하시오.
- metrics로 `accuracy`를 지정하시오.

---

### Q11. 콜백을 적용한 학습 [12점] — 권장 14분

`model`을 학습시키시오.

**학습 조건**

- `X_train_scaled`, `y_train`으로 학습하시오.
- `epochs=100`, `batch_size=32`로 지정하시오.
- 학습 데이터의 **20%를 검증 데이터로 사용**하시오.
- 콜백 두 개를 적용하시오.
  - `es` — `EarlyStopping`: `val_loss`를 관찰하고, `patience=5`, **가장 좋았던 시점의 가중치를 복원**하도록 설정
  - `mc` — `ModelCheckpoint`: `val_loss` 기준으로 **가장 좋은 모델만** `best_model.keras` 파일에 저장
- 학습 결과는 `history`에 저장하시오.

**학습 후**

- **실제로 학습이 진행된 epoch 수**를 출력하시오.
- `history`를 이용해 **학습 곡선**을 그리시오. loss와 accuracy를 각각 학습·검증 두 선으로 표시하시오.

---

### Q12. 평가와 성능 해석 [12점] — 권장 10분

학습된 `model`로 평가 데이터의 성능을 확인하시오.

1. `evaluate`로 평가 데이터의 **loss와 accuracy**를 출력하시오.
2. `predict`로 예측 확률 `pred`를 구하고, **임계값 0.5**를 기준으로 클래스 `y_pred`(0 또는 1)로 변환하시오.
3. `classification_report`와 `confusion_matrix`를 **출력**하시오.
4. **평가 데이터를 전부 0(유지)으로만 예측했을 때의 정확도**를 계산해 함께 출력하고,
   이 데이터에서 **정확도(accuracy)만으로 모델 성능을 판단하면 안 되는 이유**를 주석으로 2줄 이내로 서술하시오.

---

## 해답 및 해설

> 아래 코드는 모두 실제 실행으로 검증되었습니다. 검증 환경과 결과 수치는 문서 맨 아래 검증 주석을 참고하십시오.

### 공통 import

문항을 풀기 전에 아래 import 블록을 한 번 실행해 두면 이후 문항에서 반복하지 않아도 됩니다.

```python
import tensorflow as tf      # [환경] pandas보다 먼저 import — 아래 '로컬 환경 주의' 참고
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint

np.random.seed(42)
tf.random.set_seed(42)
```

> 💡 **로컬 환경 주의 (시험장에서는 신경 쓸 필요 없습니다)**
> 위 블록의 첫 줄이 `import tensorflow as tf`인 것은 오타가 아닙니다. 일부 로컬 환경(macOS + `pyarrow`가 설치된 pandas 조합)에서는 **`pandas`를 `tensorflow`보다 먼저 import 하면 Q11의 `model.fit`이 아무 출력도 없이 멈춥니다.** 데이터 준비 절의 생성 블록과 이 공통 import 블록 **양쪽 모두** 첫 줄을 `tensorflow`로 맞춰야 하며, **한쪽만 고치면 효과가 없습니다.**
> **학습 셀이 진행되지 않고 멈춘다면 커널을 재시작한 뒤 데이터 생성 블록부터 다시 실행하십시오.** 이미 pandas가 먼저 적재된 세션에서는 import 순서를 고쳐도 증상이 남습니다.

---

### Q1 해답 — 데이터 로딩과 형태 확인 [5점]

**정답 코드**

```python
df = pd.read_csv('telco_churn.csv')

print(df.shape)      # 1) 행·열 개수
print(df.head())     # 2) 상위 5개 행
print(df.info())     # 3) 자료형과 결측 여부
```

실행 결과 요지입니다.

```
(3000, 8)
  customer_id  tenure_months  ...  support_calls  churn
0      C00001              7  ...              1      0
...
 #   Column            Non-Null Count  Dtype
 0   customer_id       3000 non-null   str
 ...
 3   total_fee         2850 non-null   float64
```

**왜 이렇게 푸는가**

- **`shape`·`head`·`info` 세 줄이 탐색의 표준 세트**입니다. `shape`로 규모를, `head`로 값의 생김새를, `info`로 자료형과 결측을 한 번에 봅니다.
- 특히 `info()`의 **Non-Null Count 열**이 중요합니다. 전체 3000행인데 `total_fee`만 2850으로 찍히므로, **이 시점에서 이미 "결측 150건"을 알 수 있습니다.** Q4에서 어느 컬럼을 손봐야 하는지가 여기서 결정됩니다.
- `info()`의 Dtype 열에서 `str`(또는 `object`)로 표시된 컬럼 — `customer_id`, `contract_type`, `internet_service` — 이 Q5·Q6에서 처리 대상이 됩니다. **탐색 단계의 출력이 전처리 계획서 역할을 합니다.**

**자주 틀리는 지점**

- `df.info()`를 `print()` 없이 셀 마지막 줄에 두는 것. 노트북에서는 화면에 보이지만, 셀 중간에 있으면 아무것도 출력되지 않습니다. **"출력하시오"라는 지시에는 예외 없이 `print()`를 붙이십시오.**
- 파일 경로를 임의로 바꾸는 것. 문제지에 명시된 파일명을 그대로 써야 채점자가 재현할 수 있습니다.

---

### Q2 해답 — 타깃 분포와 결측치 확인 [5점]

**정답 코드**

```python
print(df['churn'].value_counts())                       # 클래스별 개수
print(df['churn'].value_counts(normalize=True).round(3))  # 클래스별 비율
print(df.isnull().sum())                                # 컬럼별 결측치 개수
```

실행 결과입니다.

```
churn
0    2113
1     887

churn
0    0.704
1    0.296

customer_id           0
tenure_months         0
monthly_fee           0
total_fee           150
contract_type         0
internet_service      0
support_calls         0
churn                 0
```

**왜 이렇게 푸는가**

- **`value_counts()`는 개수, `value_counts(normalize=True)`는 비율**을 줍니다. 문항이 "비율"까지 요구했으므로 두 줄 모두 필요합니다.
- 결과가 **70.4% : 29.6%** — 이 숫자가 이 모의고사 전체를 관통하는 조건입니다. 두 가지 결정이 여기서 나옵니다.
  1. Q7에서 **`stratify=y`를 반드시 넣어야 합니다.** 비율이 한쪽으로 기울어 있으므로, 무작위로 나누면 평가 데이터의 클래스 비율이 원본과 어긋납니다.
  2. Q12에서 **accuracy만 보면 안 됩니다.** 전부 0으로만 찍어도 정확도가 70%가 나오는 데이터이기 때문입니다.
- `isnull().sum()`은 컬럼별 결측 개수를 한 번에 보여 줍니다. Q1의 `info()`로도 알 수 있지만, **"결측치 개수를 출력하시오"라는 지시에 가장 정확히 대응하는 함수**입니다.

**자주 틀리는 지점**

- `df.isnull().sum().sum()`(전체 합계, 스칼라 하나)과 `df.isnull().sum()`(컬럼별 Series)을 혼동하는 것. **어느 컬럼인지**를 묻는 문항에는 `.sum()` 하나만 붙입니다.
- 불균형을 확인해 놓고도 뒤 문항에서 `stratify`를 빠뜨리는 것. Q2의 출력은 보고 끝내는 정보가 아니라 **Q7·Q12로 이어지는 근거**입니다.

---

### Q3 해답 — 시각화 [8점]

**정답 코드**

```python
# 1) 계약 유형별 이탈 분포
sns.countplot(data=df, x='contract_type', hue='churn')
plt.title('contract_type vs churn')
plt.show()

# 2) 수치형 컬럼 상관 heatmap
num_cols = ['tenure_months', 'monthly_fee', 'total_fee', 'support_calls', 'churn']
sns.heatmap(df[num_cols].corr(), annot=True, cmap='Blues')
plt.title('numeric correlation')
plt.show()
```

그래프에서 읽히는 내용입니다(수치로 확인하면 아래와 같습니다).

```
계약유형별 이탈률
  month       0.390
  one_year    0.242
  two_year    0.125
```

**왜 이렇게 푸는가**

- **`countplot`의 `hue`가 이 문항의 채점 포인트**입니다. `hue='churn'`을 지정해야 계약 유형마다 막대가 유지/이탈 두 개로 나뉘어, "월 단위 계약이 이탈률이 높다"는 관계가 눈에 보입니다. `hue`가 없으면 계약 유형별 고객 수만 나올 뿐 이탈과의 관계는 전혀 드러나지 않습니다.
- **`heatmap`에 `annot=True`** 를 넣어야 각 칸에 상관계수 숫자가 찍힙니다. "각 칸에 상관계수 숫자가 표시되도록"이라는 지시가 곧 `annot=True`입니다.
- 대상 컬럼을 `num_cols`로 **명시적으로 골라낸 이유**가 중요합니다. `df.corr()`를 그냥 부르면 `customer_id`·`contract_type` 같은 문자열 컬럼 때문에 오류가 납니다. 실제로 실행하면 이렇습니다.

  ```
  ValueError: could not convert string to float: 'C00001'
  ```

  대안으로 `df.select_dtypes(include='number').corr()`를 써도 됩니다.

**자주 틀리는 지점**

- **문자열 컬럼이 섞인 채 `df.corr()` 호출** — 위 `ValueError`가 나는 가장 흔한 실수입니다. 상관 분석 전에는 수치형만 골라내는 한 줄이 반드시 필요합니다.
- `plt.show()`를 빠뜨려 그래프가 화면에 남지 않는 것. 시각화 문항은 **그림이 출력된 상태**가 답안입니다.
- 시각화 문항의 출제 비중은 회차에 따라 달라질 수 있으므로, 시험 공지 기준을 확인하십시오. 다만 그리는 데 시간을 많이 쓰지는 마십시오. 배점 대비 시간 소모가 큰 구간입니다.

---

### Q4 해답 — 결측치 처리 [7점]

**정답 코드**

```python
df['total_fee'] = df['total_fee'].fillna(df['total_fee'].median())

print('남은 결측치 총합:', df.isnull().sum().sum())
```

실행 결과입니다. (이 데이터에서 `total_fee`의 중앙값은 `2148.03`입니다.)

```
남은 결측치 총합: 0
```

**왜 이렇게 푸는가**

- **`fillna`는 원본을 바꾸지 않고 새 Series를 반환합니다.** 그래서 `df['total_fee'] = ...` 형태로 **다시 대입**해야 합니다. 이 한 가지가 이 문항 배점의 절반입니다.
- **중앙값(`median`)을 쓰라고 지시한 이유**를 이해해 두십시오. `total_fee`는 `가입 개월 × 월 요금`으로 만들어져 값의 범위가 매우 넓고 오른쪽으로 길게 늘어진 분포입니다. 이런 분포에서 평균은 큰 값들에 끌려가지만 중앙값은 영향을 덜 받습니다. **다만 시험에서는 문항이 방법을 직접 지정하는 경우가 대부분이므로, 스스로 판단하기보다 지시된 함수를 정확히 쓰는 것이 우선입니다.**
- 마지막 확인 출력이 `0`이어야 다음 단계로 넘어갈 수 있습니다. 결측치가 남은 채로 딥러닝 학습에 들어가면 오류 없이 **`loss: nan`** 이 나옵니다(Ch08 오류 유형 ③). 여기서 0을 확인해 두는 것이 뒤의 사고를 막습니다.

**자주 틀리는 지점**

- **재대입 누락.** `df['total_fee'].fillna(df['total_fee'].median())`만 쓰고 넘어가는 경우입니다. 실제로 실행해 보면 결측치가 그대로 150건 남아 있습니다.

  ```
  재대입 없이: 150
  재대입 후 : 0
  ```

- `df.fillna(df.median())`처럼 데이터프레임 전체에 거는 것. 문자열 컬럼이 섞여 있어 의도치 않은 동작을 하거나 오류가 납니다. **지시된 컬럼 하나만** 처리하십시오.
- 결측 행을 `dropna()`로 지워 버리는 것. 3,000행 중 150행이 사라지면 뒤 문항의 출력 형태가 전부 달라집니다. 지시는 "중앙값으로 대체"입니다.

---

### Q5 해답 — 불필요한 컬럼 제거 [5점]

**정답 코드**

```python
df = df.drop(columns=['customer_id'])

print(df.shape)
print(df.columns.tolist())
```

실행 결과입니다.

```
(3000, 7)
['tenure_months', 'monthly_fee', 'total_fee', 'contract_type',
 'internet_service', 'support_calls', 'churn']
```

**왜 이렇게 푸는가**

- **`drop`도 새 데이터프레임을 반환합니다.** `df = df.drop(...)`처럼 다시 대입해야 합니다(Q4와 같은 원리입니다).
- `customer_id`를 지우는 이유는 단순히 "쓸모없어서"가 아닙니다. 이 컬럼은 **문자열**이므로 남겨 두면 Q8의 `StandardScaler`에서 곧바로 오류가 납니다. 실제로 남긴 채 스케일링을 시도하면 이렇습니다.

  ```
  ValueError: could not convert string to float: 'C00001'
  ```

  즉 Q5는 독립된 정리 작업이 아니라 **Q8이 성립하기 위한 선행 조건**입니다.
- 만약 `customer_id`가 숫자 ID(예: `1, 2, 3, ...`)였다면 오류는 안 나지만 더 위험합니다. 모델이 의미 없는 번호를 특성으로 학습하기 때문입니다. **식별자 컬럼은 자료형과 무관하게 제거**가 원칙입니다.

**자주 틀리는 지점**

- `df.drop(columns=['customer_id'])`만 쓰고 재대입하지 않는 것.
- `df.drop('customer_id')`처럼 축을 지정하지 않는 것. `drop`의 기본 축은 **행(index)** 이라 `KeyError`가 납니다. 컬럼을 지울 때는 `columns=[...]` 또는 `axis=1`이 필요합니다.

---

### Q6 해답 — 범주형 변수 인코딩 [8점]

**정답 코드**

```python
df = pd.get_dummies(df, columns=['contract_type', 'internet_service'], dtype=int)

print(df.shape)
print(df.columns.tolist())
```

실행 결과입니다.

```
(3000, 11)
['tenure_months', 'monthly_fee', 'total_fee', 'support_calls', 'churn',
 'contract_type_month', 'contract_type_one_year', 'contract_type_two_year',
 'internet_service_dsl', 'internet_service_fiber', 'internet_service_no']
```

**왜 이렇게 푸는가**

- **`columns=[...]`로 대상 컬럼을 명시**합니다. 생략하면 문자 컬럼 전체가 한꺼번에 변환되는데, 이 단계에서는 문제가 없어 보여도 다른 데이터에서는 예상 밖의 컬럼까지 더미로 바뀝니다. 명시하는 습관이 안전합니다.
- **`dtype=int`가 이 문항의 채점 포인트**입니다. pandas 2.x 이후 `get_dummies`의 기본 출력은 **불리언(`True`/`False`)** 입니다. 문항이 "0과 1의 정수"를 요구했으므로 반드시 지정해야 합니다.

  ```
  dtype 미지정: bool
  dtype=int   : int64
  ```

- 컬럼 수 변화를 확인하십시오. 7개 → **11개**입니다. 범주형 2개가 사라지고 각각 3개씩 총 6개의 더미 컬럼이 생겼기 때문입니다(7 − 2 + 6 = 11). **이 11개 중 `churn`을 뺀 10개가 Q10의 입력 특성 수**가 됩니다.
- **라벨 인코딩이 아니라 원-핫 인코딩**을 쓰는 이유는, `month`/`one_year`/`two_year`에 `0`/`1`/`2`를 붙이면 모델이 "two_year가 month의 2배"라는 없던 크기 관계를 학습하기 때문입니다.

**자주 틀리는 지점**

- **`dtype=int` 누락.** 불리언 컬럼도 스케일링·학습은 통과하지만, 지시를 어긴 것이므로 감점 대상입니다.
- **인코딩을 데이터 분리 뒤에 하는 것.** 순서 규칙은 **인코딩은 분리 전, 스케일링은 분리 후**입니다. 분리 후에 각각 인코딩하면 한쪽에만 있는 범주 때문에 컬럼 구성이 달라집니다. 실제로 평가 데이터가 작을 때 재현해 보면 이렇습니다.

  ```
  test 표본 3개일 때: train 컬럼 10개 / test 컬럼 7개
  누락 컬럼 ['contract_type_one_year', 'contract_type_two_year', 'internet_service_dsl']
  ```

  이 상태로 `predict`를 부르면 입력 shape 불일치 오류가 납니다.
- `churn`까지 인코딩 대상에 넣는 것. 타깃은 이미 0/1 정수이므로 건드리지 않습니다.

---

### Q7 해답 — 학습 데이터와 평가 데이터 분리 [8점]

**정답 코드**

```python
X = df.drop(columns=['churn'])
y = df['churn']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42, stratify=y)

print(X_train.shape, X_test.shape)
print(y_train.value_counts(normalize=True).round(3))
print(y_test.value_counts(normalize=True).round(3))
```

실행 결과입니다.

```
(2100, 10) (900, 10)
churn
0    0.704
1    0.296
churn
0    0.704
1    0.296
```

**왜 이렇게 푸는가**

- **`test_size=0.3`이 "7:3"입니다.** 인자가 지정하는 것은 **평가 데이터의 비율**이라는 점을 기억하십시오. 8:2면 `0.2`입니다. `test_size=0.7`로 쓰면 정반대가 됩니다.
- **`random_state=42`** 는 채점자가 같은 결과를 재현하기 위한 장치입니다. 지시된 숫자를 그대로 씁니다.
- **"클래스 비율이 양쪽에 동일하게 유지되도록" = `stratify=y`** 입니다. 문항이 `stratify`라는 단어를 직접 쓰지 않고 "층화 추출", "클래스 비율을 유지하여"처럼 우회 표현하는 경우가 많으므로, 이 표현을 인자로 옮기는 연습이 필요합니다.
- 효과를 수치로 확인하면 이렇습니다. `stratify` 없이 나누면 `random_state` 값에 따라 평가 데이터의 이탈 비율이 흔들립니다.

  ```
  stratify 없음 random_state=0 → test 클래스1 비율 0.2878
  stratify 없음 random_state=1 → test 클래스1 비율 0.2967
  stratify 없음 random_state=7 → test 클래스1 비율 0.3011
  stratify=y                   → test 클래스1 비율 0.2956  (원본 0.2957)
  ```

  `stratify=y`를 쓰면 원본 비율 `0.2957`이 소수 넷째 자리까지 그대로 재현됩니다.
- **`X`는 `churn`을 제외한 전체**입니다. `drop(columns=['churn'])`으로 만들면 Q6에서 생성된 더미 컬럼까지 자동으로 포함되므로, 컬럼을 하나씩 나열하는 것보다 안전합니다.

**자주 틀리는 지점**

- **반환 순서 착각.** `train_test_split`은 `X_train, X_test, y_train, y_test` 순서로 반환합니다. `X_train, y_train, X_test, y_test`로 받으면 오류 없이 진행되다가 학습 단계에서 이해할 수 없는 shape 오류가 납니다.
- `stratify=y` 누락. 이 데이터처럼 불균형이 있을 때 특히 손해가 큽니다.
- `stratify='churn'`처럼 문자열을 넣는 것. **타깃 배열 자체**(`y`)를 넣어야 합니다.

---

### Q8 해답 — 스케일링 [8점]

**정답 코드**

```python
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)   # 학습 데이터: 계산 + 변환
X_test_scaled = scaler.transform(X_test)         # 평가 데이터: 변환만

print(X_train_scaled.shape, X_test_scaled.shape)
print('학습 데이터 평균:', X_train_scaled.mean().round(3),
      '/ 표준편차:', X_train_scaled.std().round(3))
```

실행 결과입니다.

```
(2100, 10) (900, 10)
학습 데이터 평균: 0.0 / 표준편차: 1.0
```

**왜 이렇게 푸는가**

- **"평가 데이터의 정보가 변환 규칙에 섞이지 않도록" = 학습 데이터에만 `fit`** 하라는 뜻입니다. `fit`은 "평균과 표준편차를 계산해 기억하는" 동작입니다. 전체 데이터로 `fit`하면 평가 데이터의 통계량이 변환 규칙에 들어가고, 이것이 **데이터 누수(data leakage)** 입니다. 평가 점수가 실제보다 좋게 나와 모델을 과대평가하게 됩니다.
- 그래서 순서는 세 줄로 고정됩니다. **① 먼저 나눈다 → ② `X_train`에 `fit_transform` → ③ `X_test`에 `transform`.**
- 학습 데이터의 평균이 `0.0`, 표준편차가 `1.0`으로 나오는 것이 `StandardScaler`가 제대로 동작했다는 증거입니다. 반면 **평가 데이터의 평균은 정확히 0이 아닙니다**(이 데이터에서는 `0.011`). 학습 데이터 기준으로 변환했기 때문이며, **이것이 정상**입니다.
- 딥러닝에서 스케일링은 사실상 필수입니다. `total_fee`는 수천 단위, `support_calls`는 한 자릿수인데 이대로 넣으면 큰 값을 가진 특성이 가중치 갱신을 지배해 학습이 제대로 진행되지 않습니다.

**자주 틀리는 지점**

- **평가 데이터에도 `fit_transform`을 쓰는 것.** 가장 흔한 감점 패턴입니다. `X_test_scaled = scaler.fit_transform(X_test)`로 쓰면 평가 데이터의 자체 통계로 다시 변환되어 학습 데이터와 기준이 달라집니다.
- **분리 전에 `scaler.fit_transform(X)` 한 줄로 끝내고 나서 `train_test_split`을 부르는 것.** 오류가 나지 않아 알아채기 어렵습니다.
- 뒤 문항에서 **스케일링 안 된 `X_train`을 그대로 넣는 것.** 딥러닝 모델에는 반드시 `X_train_scaled`를 넣습니다. 변수명이 비슷해 헷갈리기 쉬우니, 학습 코드를 쓸 때 `_scaled`가 붙어 있는지 눈으로 한 번 확인하십시오.

---

### Q9 해답 — 머신러닝 베이스라인 [10점]

**정답 코드**

```python
rf_model = RandomForestClassifier(n_estimators=100, random_state=42)   # 1) 생성
rf_model.fit(X_train_scaled, y_train)                                  # 2) 학습
rf_pred = rf_model.predict(X_test_scaled)                              # 3) 예측

print('RandomForest accuracy:', round(accuracy_score(y_test, rf_pred), 4))
print(classification_report(y_test, rf_pred))
```

실행 결과입니다.

```
RandomForest accuracy: 0.73

              precision    recall  f1-score   support
           0       0.78      0.87      0.82       634
           1       0.56      0.40      0.47       266
    accuracy                           0.73       900
   macro avg       0.67      0.63      0.64       900
weighted avg       0.71      0.73      0.72       900
```

**왜 이렇게 푸는가**

- **sklearn 모델은 "생성 → `fit` → `predict`" 세 줄**이면 끝납니다. 알고리즘이 바뀌어도 클래스 이름만 교체하면 됩니다.
- **`random_state=42`가 여기에도 필요합니다.** 랜덤 포레스트는 이름 그대로 무작위성을 쓰는 모델이라, 지정하지 않으면 실행할 때마다 성능이 달라져 재현이 되지 않습니다. `train_test_split`에만 넣고 모델에는 빠뜨리는 경우가 많습니다.
- **모델 변수명을 `rf_model`로 지정한 것이 이 문항의 숨은 함정입니다.** 교재 표준에서 `model`은 Keras 모델을 가리킵니다. 여기서 `model = RandomForestClassifier(...)`로 써 두면, Q10에서 `model = Sequential()`을 만드는 순간 베이스라인이 사라집니다. 그 자체로는 오류가 아니지만, **"딥러닝이 베이스라인보다 나은가"를 마지막에 다시 비교할 수 없게 됩니다.** 실기에서는 앞뒤 문항이 같은 변수를 이어 쓰므로, 이름 충돌을 미리 피하는 습관이 필요합니다.
- **베이스라인의 목적은 최고 성능이 아니라 기준선**입니다. 뒤에 만들 딥러닝 모델이 이 점수보다 크게 낮다면 전처리나 모델 설정에 문제가 있다는 신호로 읽으면 됩니다.
- 여기서 이미 불균형의 그림자가 보입니다. 전체 accuracy는 `0.73`으로 나쁘지 않아 보이지만, **정작 찾아내야 할 이탈 고객(클래스 1)의 recall은 `0.40`** 입니다. 실제 이탈자 266명 중 107명만 잡아냈다는 뜻입니다. Q12에서 이 관점을 다시 씁니다.

**자주 틀리는 지점**

- 모델에 `random_state`를 빠뜨리는 것.
- **원본 `X_train`을 넣는 것.** 랜덤 포레스트는 스케일링에 둔감해서 성능이 크게 달라지지 않지만, 문항이 `X_train_scaled`를 쓰라고 지시했다면 지시를 따르는 것이 채점 기준입니다.
- `accuracy_score(rf_pred, y_test)`처럼 인자 순서를 바꾸는 것. accuracy는 대칭이라 값이 같지만, `classification_report`는 **첫 번째가 실제값, 두 번째가 예측값**이라는 순서가 지켜져야 precision·recall이 뒤바뀌지 않습니다.

---

### Q10 해답 — 딥러닝 모델 구성과 컴파일 [12점]

**정답 코드**

```python
# ===== 구성 =====
model = Sequential()
model.add(Input(shape=(X_train_scaled.shape[1],)))
model.add(Dense(64, activation='relu'))
model.add(Dropout(0.3))
model.add(Dense(32, activation='relu'))
model.add(Dropout(0.3))
model.add(Dense(1, activation='sigmoid'))      # 이진분류 출력층
model.summary()

# ===== 컴파일 =====
model.compile(optimizer='adam',
              loss='binary_crossentropy',      # 이진분류 손실 함수
              metrics=['accuracy'])
```

`summary()` 출력의 요지입니다.

```
 Layer (type)          Output Shape       Param #
 dense (Dense)         (None, 64)             704
 dropout (Dropout)     (None, 64)               0
 dense_1 (Dense)       (None, 32)           2,080
 dropout_1 (Dropout)   (None, 32)               0
 dense_2 (Dense)       (None, 1)               33
 Total params: 2,817
```

**왜 이렇게 푸는가**

- **입력 shape를 `X_train_scaled.shape[1]`로 자동 계산**합니다. 이 데이터의 특성은 10개지만, 숫자 `10`을 직접 적으면 앞 문항에서 컬럼이 하나만 달라져도 shape 불일치 오류가 납니다. `shape[1]`로 쓰면 Q6·Q7의 결과가 무엇이든 자동으로 맞습니다. **Q10이 Q6·Q7의 결과를 이어받는 지점이 바로 이 한 줄입니다.**
- **출력층 `Dense(1, activation='sigmoid')`** 인 이유는 이진분류이기 때문입니다. 노드가 1개인 것은 "이탈일 확률" 하나만 있으면 충분하기 때문이고(유지 확률은 1에서 빼면 됩니다), `sigmoid`인 것은 출력을 **0~1 확률**로 눌러 주기 위해서입니다.
- **`binary_crossentropy`와 `sigmoid`는 언제나 짝으로 움직입니다.** 손실 함수만 바꾸고 출력층을 그대로 두거나, 그 반대로 하는 것이 가장 흔한 사고입니다.
- **`Dropout`은 은닉층 `Dense` 뒤에만** 넣습니다. 출력층 뒤에 두면 최종 확률값 자체가 무작위로 0이 되어 예측이 망가집니다. 비율 `0.3`은 관례적 기본값이며, 문항에 지정이 없으면 0.2~0.5 범위에서 고르면 됩니다.
- 은닉층 노드 수를 `64 → 32`로 **줄여 가며** 쌓는 것은 관례적인 구성입니다. 성능에 결정적이지는 않으므로 여기에 시간을 쓰지 마십시오. **"은닉층 2개 이상", "Dropout 포함"이라는 지시 조건을 충족했는지가 채점 항목**입니다.

**자주 틀리는 지점**

- **입력 shape에 샘플 수를 넣는 것.** `Input(shape=(2100, 10))`은 틀립니다. 행 수는 넣지 않습니다.
- **출력층에 `softmax`를 쓰는 것.** 노드가 1개인 층에 `softmax`를 걸면 그 값은 언제나 1이 되어 학습이 전혀 되지 않습니다. 오류도 나지 않아 발견이 늦습니다.
- **`metrics='accuracy'`를 리스트 없이 쓰는 것.** 최신 버전에서는 통과하는 경우가 있지만, `metrics=['accuracy']`처럼 **리스트로 감싸는 것이 표준**입니다.
- 구성만 하고 `compile()`을 빠뜨리는 것. 컴파일 없이 `fit`을 부르면 "모델이 컴파일되지 않았다"는 오류가 납니다. **구성과 컴파일은 한 세트**로 붙여 쓰십시오.

---

### Q11 해답 — 콜백을 적용한 학습 [12점]

**정답 코드**

```python
es = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
mc = ModelCheckpoint('best_model.keras', monitor='val_loss', save_best_only=True)

history = model.fit(X_train_scaled, y_train,
                    epochs=100, batch_size=32,
                    validation_split=0.2,
                    callbacks=[es, mc], verbose=0)     # verbose는 0/1 무엇이든 무방

print('실제로 학습한 epoch 수:', len(history.history['loss']))
print('history 키:', list(history.history.keys()))
best_epoch = int(np.argmin(history.history['val_loss'])) + 1
print('최저 val_loss:', round(min(history.history['val_loss']), 4), '@ epoch', best_epoch)

# 학습 곡선
plt.figure(figsize=(10, 4))
plt.subplot(1, 2, 1)
plt.plot(history.history['loss'], label='train loss')
plt.plot(history.history['val_loss'], label='val loss')
plt.xlabel('epoch'); plt.ylabel('loss'); plt.legend()

plt.subplot(1, 2, 2)
plt.plot(history.history['accuracy'], label='train accuracy')
plt.plot(history.history['val_accuracy'], label='val accuracy')
plt.xlabel('epoch'); plt.ylabel('accuracy'); plt.legend()

plt.tight_layout()
plt.show()
```

실행 결과입니다.

```
실제로 학습한 epoch 수: 10
history 키: ['accuracy', 'loss', 'val_accuracy', 'val_loss']
최저 val_loss: 0.5165 @ epoch 5
```

**왜 이렇게 푸는가**

- **`epochs=100`을 지정했는데 10에서 끝난 것이 `EarlyStopping`이 동작했다는 증거**입니다. `val_loss`가 5번째 epoch에서 최저를 찍은 뒤 5번(`patience=5`) 더 지켜봤지만 개선되지 않아 10에서 중단했습니다. `print('실제로 학습한 epoch 수:', len(history.history['loss']))` 한 줄이 그 확인 방법입니다. **중단 시점은 실행마다 달라집니다**(검증 환경에서 10~20 범위). 숫자 자체가 아니라 **상한 100보다 훨씬 앞에서 끝났다는 사실**이 채점 포인트입니다.
- **`verbose`는 0이든 1이든 상관없습니다.** 1이면 epoch마다 진행 로그가 흐르고 0이면 조용합니다. 다만 **화면 로그는 채점 근거가 아니므로**, 어느 쪽을 쓰든 위의 `len(history.history['loss'])` 출력은 남겨야 합니다. (2회차 Q11도 같은 규칙입니다.)
- **`restore_best_weights=True`가 이 문항의 핵심 인자**입니다. 이것을 빠뜨리면 학습은 최저점에서 멈추지만 **모델에 남는 가중치는 중단 시점(10번째)의 것**입니다. 즉 최고 성능 지점을 지나쳐 놓고 그보다 나쁜 상태로 평가하게 됩니다. "가장 좋았던 시점의 가중치를 복원"이라는 지시가 곧 이 인자입니다.
- **`ModelCheckpoint`의 `save_best_only=True`** 는 매 epoch마다 덮어쓰지 않고 `val_loss`가 개선될 때만 파일을 갱신합니다. 확장자는 **`.keras`** 를 쓰십시오. Keras 3에서 `.h5`는 여전히 동작하지만 `.keras`가 표준이며, 확장자 없이 `'best_model'`처럼 쓰면 오류가 납니다.
- **`callbacks=[es, mc]`처럼 리스트로 전달**해야 합니다. 콜백 객체를 만들어 놓고 `fit`에 넘기지 않으면 아무 일도 일어나지 않습니다. 오류도 나지 않아 "EarlyStopping을 넣었는데 100 epoch을 다 돌았다"는 상황이 생깁니다.
- **`validation_split=0.2`** 는 `X_train`의 뒤쪽 20%를 잘라 검증에 씁니다. 여기서 잘라내는 것은 **학습 데이터의 일부**이며, `X_test`는 이 과정에 전혀 관여하지 않습니다. 평가 데이터는 마지막 Q12에서 딱 한 번만 씁니다.
- 학습 곡선은 **`history.history`의 네 개 키**로 그립니다. 키 이름이 기억나지 않으면 `print(history.history.keys())`로 먼저 확인하십시오. 이진분류에서는 `accuracy`/`val_accuracy`지만, 회귀에서는 `mae`/`val_mae`가 되므로 유형에 따라 달라집니다.

**자주 틀리는 지점**

- **`restore_best_weights=True` 누락** — 지시문에 명시된 조건이므로 그 자체로 감점이며, 평가 성능도 손해를 봅니다.
- **`callbacks=[es, mc]` 전달 누락** 또는 `callbacks=es`처럼 리스트 없이 넘기는 것.
- **`validation_split`과 `validation_data` 혼동.** `validation_split`은 비율(숫자), `validation_data`는 `(X_val, y_val)` 튜플입니다. 둘을 바꿔 쓰면 오류가 납니다.
- **`X_train`(스케일링 전)을 넣는 것.** 이 경우 오류는 없지만 accuracy가 낮은 값에서 잘 오르지 않습니다.
- 학습 곡선에서 `history.history['acc']`처럼 옛 키 이름을 쓰는 것. 최신 Keras는 `accuracy`입니다. `KeyError`가 나면 키 목록부터 출력하십시오.

> **시간 관리 조언** — 시험장에서 `epochs=100`을 그대로 걸고 기다리다 시간을 잃는 일이 흔합니다. 먼저 `epochs=20` 정도로 한 번 완주시켜 Q12의 평가 출력까지 만들어 두고, 시간이 남으면 `epochs=100`으로 다시 돌리십시오. **`EarlyStopping`은 어느 쪽이든 반드시 넣어 둡니다**(지시 조건이므로).

---

### Q12 해답 — 평가와 성능 해석 [12점]

**정답 코드**

```python
# 1) evaluate
loss, acc = model.evaluate(X_test_scaled, y_test, verbose=0)
print('test loss:', round(loss, 4), '/ test accuracy:', round(acc, 4))

# 2) predict → 임계값 0.5로 클래스 변환
pred = model.predict(X_test_scaled, verbose=0)
y_pred = (pred > 0.5).astype(int).flatten()

# 3) 상세 지표
print(classification_report(y_test, y_pred, digits=3))
print(confusion_matrix(y_test, y_pred))

# 4) 전부 0으로만 예측했을 때의 정확도
naive = np.zeros(len(y_test), dtype=int)
print('무조건 0 예측 accuracy:', round(accuracy_score(y_test, naive), 4))

# 이 데이터는 유지:이탈이 약 7:3이라 전부 0으로 찍어도 정확도가 0.70이 나온다.
# 따라서 accuracy가 아니라 클래스 1의 recall과 f1으로 판단해야 한다.
```

실행 결과입니다.

```
test loss: 0.4986 / test accuracy: 0.7467

              precision    recall  f1-score   support
           0      0.801     0.852     0.826       634
           1      0.584     0.496     0.537       266
    accuracy                          0.747       900
   macro avg      0.693     0.674     0.681       900
weighted avg      0.737     0.747     0.740       900

[[540  94]
 [134 132]]

무조건 0 예측 accuracy: 0.7044
```

**왜 이렇게 푸는가**

- **`evaluate`와 `predict`는 반환값이 다릅니다.** `evaluate`는 컴파일 때 지정한 `[loss, accuracy]` **두 숫자**를 돌려주고, `predict`는 **샘플별 확률 배열** `(900, 1)`을 돌려줍니다. 문항이 "loss와 accuracy"를 요구하면 `evaluate`, "예측 결과"를 요구하면 `predict`입니다.
- **`(pred > 0.5).astype(int)`가 확률 → 클래스 변환**입니다. `pred`에는 `0.009`, `0.166` 같은 확률이 들어 있고, 이대로는 분류 지표를 계산할 수 없습니다. 실제로 확률을 그대로 넣으면 이런 오류가 납니다.

  ```
  ValueError: Classification metrics can't handle a mix of binary and continuous targets
  ```

  `.flatten()`은 `(900, 1)`을 `(900,)`으로 펴 주는 정리 작업입니다. sklearn은 `(N, 1)` 형태도 받아 주지만, `y_test`와 형태를 맞춰 두면 이후 계산에서 헷갈릴 일이 없습니다.
- **혼동 행렬을 읽는 법**입니다. `[[540, 94], [134, 132]]`는 행이 실제값, 열이 예측값입니다.

  | | 예측 0 | 예측 1 |
  |---|---|---|
  | **실제 0 (유지)** | 540 (맞춤) | 94 (헛짚음) |
  | **실제 1 (이탈)** | **134 (놓침)** | 132 (잡아냄) |

  즉 실제 이탈 고객 266명 중 **134명을 놓쳤습니다.**
- **4번이 이 모의고사 전체의 결론입니다.** 아무 학습도 하지 않고 전부 "유지"로만 찍어도 정확도가 **0.7044**입니다. 우리 모델의 정확도는 **0.7467** — 겨우 4%p 높습니다. **accuracy만 보면 "70% 넘으니 괜찮다"고 오판하게 되는 구조**입니다.
- 실제로 봐야 할 것은 **클래스 1(이탈)의 recall `0.496`과 f1 `0.537`** 입니다. 전부 0으로 찍는 모델은 클래스 1의 recall이 `0.000`이므로, 이 지표에서 우리 모델이 확실한 개선을 보였다는 것이 드러납니다. **`classification_report`가 필요한 이유가 정확히 여기에 있습니다.**
- `support` 열(634 / 266)도 함께 보십시오. **클래스별 표본 수가 크게 다르면 그 자체가 불균형 신호**이고, 이때 `macro avg`(클래스를 동등 취급)와 `weighted avg`(표본 수로 가중)의 차이가 벌어집니다. 여기서도 macro f1 `0.681` vs weighted f1 `0.740`으로 벌어져 있습니다.
- 참고로 Q9의 랜덤 포레스트는 accuracy `0.73` / 클래스 1 recall `0.40`이었습니다. 딥러닝 모델이 **정확도는 비슷하지만 이탈 고객을 더 많이 잡아냈다**는 점이 실질적인 개선입니다. 베이스라인을 남겨 둔 덕분에 이 비교가 가능합니다(Q9에서 변수명을 `rf_model`로 분리한 이유입니다).

**자주 틀리는 지점**

- **확률값을 그대로 `classification_report`에 넣는 것.** 위 `ValueError`가 나는 대표적인 사고입니다. 임계값 변환 한 줄을 반드시 거치십시오.
- **`np.argmax(pred, axis=1)`를 쓰는 것.** 이것은 다중분류용입니다. 이진분류의 `pred`는 열이 1개뿐이라 `argmax`를 걸면 **전부 0**이 나옵니다. 오류가 나지 않아 발견이 매우 늦습니다.
- **accuracy만 출력하고 끝내는 것.** 이 문항은 "정확도만으로 판단하면 안 되는 이유"까지 요구합니다. 불균형 데이터에서는 `classification_report`와 혼동 행렬이 함께 있어야 답안이 완성됩니다.
- `evaluate`의 반환값을 하나로 받는 것. `acc = model.evaluate(...)`로 쓰면 `acc`에 리스트 `[loss, accuracy]`가 통째로 들어갑니다. **컴파일 때 metrics를 몇 개 지정했는지에 따라 반환 개수가 달라진다**는 점을 기억하십시오.

---

## 채점표

| Q | 단계 | 배점 | 핵심 채점 요소 |
|---|------|------|----------------|
| 1 | 로딩·형태 | 5 | `read_csv` / `shape`·`head`·`info` 출력 |
| 2 | 탐색 | 5 | `value_counts` 개수+비율 / `isnull().sum()` |
| 3 | 시각화 | 8 | `countplot`의 `hue='churn'` / `heatmap`의 `annot=True` / 수치형만 선택 |
| 4 | 결측 처리 | 7 | `median()` 사용 / **재대입** / 결과 확인 출력 |
| 5 | 컬럼 정리 | 5 | `drop(columns=[...])` / 재대입 |
| 6 | 인코딩 | 8 | `get_dummies` / `columns` 명시 / **`dtype=int`** |
| 7 | 분리 | 8 | `test_size=0.3` / `random_state=42` / **`stratify=y`** / 반환 순서 |
| 8 | 스케일링 | 8 | train `fit_transform` / test **`transform`만** |
| 9 | 머신러닝 | 10 | `rf_model` 이름 / `n_estimators=100`·`random_state=42` / 성능 출력 |
| 10 | DL 구성·컴파일 | 12 | `Input(shape=(n,))` / 은닉층 2개 이상 + `Dropout` / **`Dense(1,'sigmoid')`** / **`binary_crossentropy`** |
| 11 | 학습 | 12 | `epochs=100`·`batch_size=32` / `validation_split=0.2` / **`restore_best_weights=True`** / `callbacks=[es, mc]` / 학습 곡선 |
| 12 | 평가 | 12 | `evaluate` / **임계값 0.5 변환** / `classification_report`·`confusion_matrix` / **불균형 해석** |
| — | **합계** | **100** | — |

> 배점은 **교재 자체 기준**입니다. 실제 시험의 배점 체계는 공개되어 있지 않으므로 학습 우선순위를 정하는 참고용으로만 사용하십시오.

---

## 이 회차에서 반드시 가져갈 것

| 지점 | 기억할 것 |
|------|-----------|
| 순서 규칙 | **인코딩은 분리 전, 스케일링은 분리 후** |
| 재대입 | `fillna`·`drop`·`get_dummies`는 **새 객체를 반환** — `df = df.…` |
| 불균형 신호 | `value_counts(normalize=True)`가 7:3 이상으로 기울면 `stratify=y` + `classification_report` |
| 이진분류 짝 | `Dense(1,'sigmoid')` ↔ `binary_crossentropy` — **언제나 함께 바꾼다** |
| 콜백 | `restore_best_weights=True`와 `callbacks=[es, mc]` 두 곳을 모두 확인 |
| 예측 변환 | 이진분류는 `(pred > 0.5).astype(int).flatten()` — `argmax` 아님 |
| 최종 판단 | accuracy `0.7467` vs 전부 0 예측 `0.7044` — **차이가 4%p뿐이라면 accuracy는 지표로서 무의미** |

**한 문장으로:** 이 회차의 진짜 문제는 모델이 아니라 **지표를 고르는 눈**입니다. 정확도 0.75를 보고 만족하는 답안과, 클래스 1의 recall 0.50을 짚어내는 답안의 차이가 이 시험이 보려는 것입니다.

---

<!--
verified: 2026-07-28
환경: Python 3.13.5 / numpy 2.5.0 / pandas 3.0.3 / scikit-learn 1.9.0 / matplotlib 3.11.1 / seaborn 0.13.2 / TensorFlow 2.21.0 (Keras 3.15.0), macOS CPU
실행 방식: 데이터 생성 코드 + Q1~Q12 해답 전량을 하나의 스크립트로 실행. 메모리 압박 회피를 위해
  Stage A(Q1~Q9, TF 미사용) / Stage B(Q10~Q12, TF 스레드 1개 제한) 2단 분할 실행. 두 단계 모두 EXIT=0.
  ※ 이 2단 분할은 Stage A가 TF를 아예 import 하지 않는 구조여서, 독자가 한 세션에서 이어 풀 때 발생하는
    import 순서 문제(C-1)를 드러내지 못했다. 아래 [최종 통합 검증]의 무전제 단일 세션 실행이 정본 증적이다.

[Stage A 검증 결과 — 결정적(deterministic), 재실행 시 동일]
  Q1  df.shape == (3000, 8), info() Non-Null: total_fee 2850 (결측 150)
  Q2  churn 0=2113 / 1=887 → 비율 0.704 : 0.296 (불균형 약 7:3)
      isnull().sum(): total_fee 150, 나머지 전 컬럼 0
  Q3  countplot·heatmap 2건 정상 저장. 계약유형별 이탈률 month 0.390 / one_year 0.242 / two_year 0.125
      (반례 검증) 문자열 포함 df.corr() → ValueError: could not convert string to float: 'C00001'
  Q4  total_fee 중앙값 2148.03, 처리 후 df.isnull().sum().sum() == 0
      (반례 검증) fillna 재대입 누락 시 결측 150건 그대로 잔존
  Q5  drop 후 shape (3000, 7)
      (반례 검증) customer_id 잔존 상태로 StandardScaler → ValueError: could not convert string to float
  Q6  get_dummies 후 shape (3000, 11), 더미 6개 생성. dtype 미지정 시 bool / dtype=int 시 int64 확인
      (반례 검증) 분리 후 인코딩 시 test 표본 3개에서 train 10컬럼 vs test 7컬럼 불일치 재현
  Q7  X_train (2100, 10) / X_test (900, 10). stratify=y 적용 시 양쪽 0.704:0.296
      (반례 검증) stratify 없음 → test 클래스1 비율 random_state별 0.2878 / 0.2967 / 0.3011 로 변동
  Q8  X_train_scaled 평균 0.0 / 표준편차 1.0, X_test_scaled 평균 0.011 (정상)
  Q9  RandomForest accuracy 0.7300, 클래스1 precision 0.56 / recall 0.40 / f1 0.47,
      confusion_matrix [[550 84] [159 107]]
  참고 무조건 0 예측 accuracy = 0.7044

[Stage B 검증 결과 — 게재 수치는 아래 '실행 1'의 값]
  실행 1 (지시값 그대로: epochs=100 + EarlyStopping patience=5)
    Q10 Total params 2,817 (704 / 2,080 / 33)
    Q11 EarlyStopping 작동 → 10 epoch에서 중단, 최저 val_loss 0.5165 @ epoch 5
        history 키 ['accuracy','loss','val_accuracy','val_loss'], best_model.keras 생성 확인
    Q12 test loss 0.4986 / test accuracy 0.7467
        클래스0 P0.801 R0.852 F0.826 (support 634) / 클래스1 P0.584 R0.496 F0.537 (support 266)
        macro avg F 0.681 / weighted avg F 0.740
        confusion_matrix [[540 94] [134 132]], 클래스1 예측 226건 vs 실제 266건
  실행 2 (낮은 epochs 검증: epochs=30, 나머지 동일)
    18 epoch에서 중단(최저 val_loss 0.5162 @ epoch 13),
    test accuracy 0.7378 / 클래스1 recall 0.436 / 클래스1 f1 0.496

[게재 수치에 대한 검증 조건]
  Keras CPU 학습은 시드를 고정해도 실행마다 완전히 동일하지 않습니다(위 두 실행의 중단 epoch가 다름).
  따라서 독자 환경에서는 test accuracy 0.73~0.76, 클래스1 recall 0.40~0.55 범위를 정상으로 봅니다.
  해설의 핵심 결론(accuracy가 '무조건 0 예측' 0.7044보다 근소하게 높을 뿐이므로 accuracy 단독 판단 불가)은
  두 실행 모두에서 동일하게 성립함을 확인했습니다.
  Stage A의 모든 수치는 시드 고정으로 완전히 결정적이므로 그대로 재현됩니다.

[최종 통합 검증 — 무전제(無前提) 순차 실행 / 2026-07-31 추가]
  검증 하네스가 한 일: (1) 이 문서에서 ```python 블록 14개를 순서대로 추출, (2) 하나의 네임스페이스에서
  위에서 아래로 exec, (3) 창 표시 방지를 위한 환경변수 MPLBACKEND=Agg 지정.
  검증 하네스가 하지 않은 일(= 전제 없음): **tensorflow 선 import 없음**(인쇄된 코드의 첫 줄이 스스로 책임),
  **fit epochs 상한 패치 없음**(Q11 epochs=100 지시값 그대로), 코드 수정·치환 없음.
  결과: **14/14 블록 EXIT=0, 실패 0, 총 9.6초.** 학습 블록 정지(C-1) 재발 없음.
    (C-1 수정 전 동일 하네스에서는 Q11 해답 블록이 무한 정지했다 — 수정 효과를 실측으로 확인)
  이 실행의 실측치:
    결정적 수치 — 게재값과 일치: RandomForest accuracy 0.73 / 무조건 0 예측 accuracy 0.7044
      (Stage A의 전처리 수치는 시드 고정으로 위 기록과 동일하게 재현)
    학습 의존 수치 — 게재값 대비 허용 대역 내: Q11 epoch 20, 최저 val_loss 0.5206 @ epoch 15
      (게재 10 @ epoch 5 — 본문에 "10~20 범위" 대역 병기함) /
      Q12 test loss 0.5012 · accuracy 0.7356 (게재 0.4986 · 0.7467, 위 판독 조건의 0.73~0.76 대역 내)
    결론 재확인: accuracy 0.7356 vs 무조건 0 예측 0.7044 — 차이가 3%p대에 불과하다는 Q12의 핵심 논지 유지

[QA 반영 이력 — 2026-07-31 (mock_exams_report.md)]
  C-1 데이터 생성 블록·공통 import 블록 **양쪽** 첫 줄에 import tensorflow as tf 배치.
      한쪽만 고치면 무효(먼저 실행된 셀이 pandas를 적재)임을 실측 확인해 안내문에 명시
  M-2 "로컬 환경 주의" 박스를 데이터 준비 절 앞과 공통 import 블록 뒤 두 곳에 배치(2회차와 동일 구성),
      커널 재시작 필요 안내 추가, 답안 작성 규칙에 타깃 넘파이 권고(4번) 추가
  H-4 스탬프에 하네스가 한 일/하지 않은 일 명시. 기존 2단 분할이 C-1을 은폐했다는 사실도 함께 기록
  L-1 Q11 verbose 표기를 2회차와 통일(verbose 0/1 무방 + epoch 수 출력이 근거)
      — 이때 게재 출력 블록에만 있던 'history 키'·'최저 val_loss' 두 줄을 실제 코드에 추가해 코드↔출력 불일치 해소
  L-3 변수명 표에 rf_pred 추가

[제외 문항] 없음 — Q1~Q12 전 문항 해답 코드 무오류 실행 완료.
-->
