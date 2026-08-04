---
mock: 2
title: "실전 모의고사 2회 — 다중분류(+회귀 확장): 설비 센서 기반 불량 유형 분류"
items: 12
extra_items: 3
points: 100
extra_points: 30
minutes: 90
extra_minutes: 20
type: 다중분류(3-class) + 회귀 확장
---

# 실전 모의고사 2회 — 다중분류(+회귀 확장): 설비 센서 기반 불량 유형 분류

> **본 문제는 공개된 출제 기준에 따른 유형 연습 문제입니다.** 기출 문제 원문이 아니며, 공개된 출제 범위·문항 흐름을 바탕으로 재구성한 **기출 변형 문제**입니다.

| 항목 | 내용 |
|------|------|
| 문항 수 | **본편 12문항**(Q1 → Q12 연속 구조) + **회귀 확장 3문항**(R1 → R3) |
| 총 배점 | 본편 100점 / 확장 30점(별도 집계) |
| 권장 소요 시간 | 본편 90분 + 확장 20분 |
| 문제 유형 | **다중분류** (타깃 `defect_type` 0/1/2, **정수 라벨**) → 확장에서 **회귀**(`rul_days`) |
| 다루는 범위 | 탐색 → 전처리(이상치·결측·인코딩·분리·스케일링) → 머신러닝 베이스라인 → 딥러닝(softmax K개) → 평가(argmax·혼동행렬) → 유형 교체(회귀) |

> ⚠️ **배점에 관한 안내**
> 본 모의고사의 문항별 배점은 **교재 자체 기준**입니다. AICE Associate 실기의 실제 문항 수·배점 체계는 공개되어 있지 않으며 회차별로 달라질 수 있습니다. 응시 전 **KT AICE 공식 시험 공지 기준을 반드시 확인하십시오.**

> 📌 **회귀 확장 세트(R1~R3)에 관한 안내**
> 확장 세트는 **추가 연습**입니다. 실제 시험은 한 회차에 **한 가지 유형(분류 또는 회귀)만 출제되는 경우가 많습니다.** 그러나 어느 유형이 나올지는 시험지를 열어 봐야 알 수 있으므로, **같은 데이터·같은 전처리에서 타깃만 바꿔 출력층·loss·지표를 교체하는 훈련**을 여기서 마쳐 두십시오. 본편 12문항을 먼저 끝낸 뒤 진행하십시오.

---

## 시작하기 전에 — 답안 작성 규칙

실제 시험과 동일한 조건을 만들기 위해 아래 네 가지를 지키면서 푸십시오.

1. **문항 순서대로, 셀을 나눠서 풉니다.** 이 회차는 Q3(이상치) → Q4(결측) → Q5(인코딩) → Q6(분리) → Q7(스케일링) → Q9~Q12가 앞 단계 결과를 그대로 이어받는 구조입니다. 한 셀에 몰아 쓰면 중간 오류 한 번에 앞 단계 결과까지 잃습니다.

2. **아래 변수명을 그대로 사용합니다.**

   | 용도 | 변수명 |
   |------|--------|
   | 원본 데이터프레임 | `df` |
   | 특성 / 타깃 | `X`, `y` |
   | 분리 결과 | `X_train`, `X_test`, `y_train`, `y_test` |
   | 스케일러와 변환 결과 | `scaler`, `X_train_scaled`, `X_test_scaled` |
   | 머신러닝 베이스라인 모델 / 그 예측 | `rf_model`, `rf_pred` |
   | 딥러닝 모델 / 학습 기록 | `model`, `history` |
   | 콜백 | `es`(EarlyStopping) |
   | 예측 확률 / 예측 클래스 | `pred`, `y_pred` |
   | 회귀 확장(R1~R3) | 위 이름에 `_r`을 붙입니다: `y_reg`, `X_r`, `X_train_r`, `y_train_r`, `scaler_r`, `X_train_r_scaled`, `model_r`, `history_r`, `es_r`, `y_pred_r` |

3. **"출력하시오"라는 지시에는 반드시 `print()`를 씁니다.** 계산만 하고 화면에 남기지 않으면 채점 대상이 되지 않습니다.

4. **타깃(`y`)은 넘파이 배열로 만들어 사용합니다.** Keras `fit`은 넘파이 배열을 가장 안정적으로 받고, `np.bincount`·`np.unique`·`np.argmax` 같은 뒤 문항의 넘파이 연산이 매끄럽게 이어집니다. 이 회차는 타깃을 만드는 단계(Q6)에서 `to_numpy()`로 변환하도록 지시합니다.
   (참고: 앞서 안내한 "학습 셀이 멈추는" 증상은 **import 순서 문제이며 타깃 자료형과는 무관합니다.** pandas Series를 넘겨도 그 증상 자체는 생기지 않습니다.)

---

## 데이터 준비 (문제 풀이 전 1회 실행)

실제 시험에서는 CSV 파일이 주어집니다. 이 모의고사는 독자가 로컬에서 그대로 재현할 수 있도록, 아래 코드로 **동일한 CSV 파일을 직접 생성**합니다. 이 블록은 문제가 아니므로 그대로 복사해 한 번만 실행하십시오.

> 💡 **로컬 환경 주의 — 반드시 먼저 읽으십시오 (시험장에서는 신경 쓸 필요 없습니다)**
> 일부 로컬 환경(특히 macOS + `pyarrow`가 설치된 pandas 조합)에서는 **`pandas`를 `tensorflow`보다 먼저 import 하면, 뒤의 학습 셀에서 `model.fit`이 아무 출력도 없이 멈춥니다.** 그래서 이 교재의 코드 블록은 **데이터 생성 블록과 해답의 공통 import 블록 양쪽 모두 `import tensorflow as tf`를 첫 줄에 두었습니다.** 한쪽만 고치면 효과가 없습니다 — **먼저 실행된 셀이 pandas를 이미 적재**하기 때문입니다.
> **이미 데이터 생성 셀을 pandas 먼저 import한 상태로 실행했다면, 커널을 재시작한 뒤 아래 블록부터 다시 실행하십시오.** 커널을 재시작하지 않으면 import 순서를 고쳐도 증상이 그대로 남습니다.

```python
# ===== [문제 아님] 모의고사용 데이터 파일 생성 — 그대로 1회 실행 =====
import tensorflow as tf      # [환경] pandas보다 먼저 import — 위 '로컬 환경 주의' 참고
import numpy as np
import pandas as pd

rng = np.random.default_rng(42)
n = 4000

defect_type = rng.choice([0, 1, 2], n, p=[0.60, 0.25, 0.15])
line_id = rng.choice(['L1', 'L2', 'L3'], n, p=[0.4, 0.35, 0.25])
shift = rng.choice(['A', 'B', 'C'], n, p=[0.4, 0.35, 0.25])

temp_shift = np.select([defect_type == 1, defect_type == 2], [2.0, 9.0], 0.0)
vib_shift = np.select([defect_type == 1, defect_type == 2], [2.2, 0.8], 0.0)
pres_shift = np.select([defect_type == 1, defect_type == 2], [-0.25, -0.55], 0.0)
rpm_shift = np.select([defect_type == 1, defect_type == 2], [-40.0, -15.0], 0.0)
cur_shift = np.select([defect_type == 1, defect_type == 2], [0.5, 1.4], 0.0)
line_temp = np.select([line_id == 'L2', line_id == 'L3'], [1.5, -1.0], 0.0)

temp = np.round(70 + temp_shift + line_temp + rng.normal(0, 6.0, n), 2)
vibration = np.round((3.0 + vib_shift + rng.normal(0, 1.2, n)).clip(0.1, None), 2)
pressure = np.round(5.0 + pres_shift + rng.normal(0, 0.6, n), 2)
rpm = np.round(1500 + rpm_shift + rng.normal(0, 90, n), 1)
current = np.round(12.0 + cur_shift + rng.normal(0, 1.3, n), 2)
humidity = np.round(45 + rng.normal(0, 8, n), 1)

rul_days = np.round((200
                     - 1.5 * (temp - 70)
                     - 8.0 * (vibration - 3)
                     - 20.0 * (current - 12)
                     + 10.0 * (pressure - 5)
                     + rng.normal(0, 12, n)).clip(1, None), 1)

df_raw = pd.DataFrame({
    'temp': temp,
    'vibration': vibration,
    'pressure': pressure,
    'rpm': rpm,
    'current': current,
    'humidity': humidity,
    'line_id': line_id,
    'shift': shift,
    'defect_type': defect_type,
    'rul_days': rul_days,
})

out_idx = rng.choice(n, size=40, replace=False)                      # 이상치 40건 주입
df_raw.loc[out_idx, 'vibration'] = np.round(rng.uniform(55, 95, 40), 2)
miss_idx = rng.choice(n, size=int(n * 0.04), replace=False)          # 결측 4%
df_raw.loc[miss_idx, 'pressure'] = np.nan
df_raw.to_csv('factory_defect.csv', index=False)
print('데이터 파일 생성 완료: factory_defect.csv')
```

### 데이터 명세

`factory_defect.csv` — 어느 공장 설비에서 4,000회 측정한 센서 기록과, 그때 발생한 불량 유형입니다.

| 컬럼 | 설명 | 자료형 | 비고 |
|------|------|--------|------|
| `temp` | 설비 온도(℃) | 실수 | — |
| `vibration` | 진동(mm/s) | 실수 | **이상치 있음** (센서 오작동으로 기록된 비정상 큰 값) |
| `pressure` | 압력(bar) | 실수 | **결측치 있음** |
| `rpm` | 회전 속도 | 실수 | — |
| `current` | 전류(A) | 실수 | — |
| `humidity` | 습도(%) | 실수 | — |
| `line_id` | 생산 라인 | 문자열 | `L1` / `L2` / `L3` |
| `shift` | 근무 교대조 | 문자열 | `A` / `B` / `C` |
| `defect_type` | **본편 타깃** — 불량 유형 | 정수 | **0 = 정상, 1 = 마모, 2 = 과열** |
| `rul_days` | **확장 타깃** — 잔여 수명(일) | 실수 | 본편(Q1~Q12)에서는 **특성으로 쓰지 않습니다** |

> ⚠️ 이 데이터에는 **타깃이 두 개** 들어 있습니다. 본편에서 예측할 값은 `defect_type`이고, `rul_days`는 회귀 확장에서만 씁니다. **본편의 특성 `X`에 `rul_days`를 넣으면 안 됩니다.** 이유는 Q6 해설에서 설명합니다.

---

## 문제

### Q1. 데이터 로딩과 클래스 분포 확인 [5점] — 권장 5분

`factory_defect.csv` 파일을 읽어 데이터프레임 `df`에 저장하시오.
이어서 다음 네 가지를 **출력**하시오.

1. 데이터의 행·열 개수
2. 상위 5개 행
3. 컬럼별 자료형과 결측 여부 요약
4. 타깃 컬럼 `defect_type`의 **클래스별 개수**와 **비율**

출력 결과에서 다음 두 가지를 스스로 확인하십시오. **뒤 문항의 판단 근거가 여기서 나옵니다.**

- 타깃이 **몇 개의 클래스**로 되어 있고, 값이 **정수인지 문자열인지**
- 어느 컬럼에 **결측치**가 있는지

---

### Q2. 클래스별 센서 분포 시각화 [7점] — 권장 8분

불량 유형에 따라 센서 값이 어떻게 다른지 확인합니다. 다음 두 개의 그래프를 그리시오. (`seaborn`, `matplotlib` 사용)

1. `defect_type`별 **`temp`(온도) 분포**를 `boxplot`으로 그리시오. x축은 `defect_type`, y축은 `temp`로 하시오.
2. `vibration`(진동)의 **분포를 클래스별로 겹쳐 보이도록** `histplot`으로 그리시오. `defect_type`에 따라 색이 나뉘도록 지정하시오.

그래프에 이어, **클래스별로 센서 6종의 평균값**을 표 형태로 **출력**하시오.
(출력 결과에서 "어떤 센서가 클래스를 구분하고, 어떤 센서가 구분에 도움이 안 되는지"를 읽을 수 있어야 합니다.)

---

### Q3. 이상치 처리 [8점] — 권장 10분

`vibration` 컬럼에는 센서 오작동으로 기록된 비정상적으로 큰 값이 섞여 있습니다.
**IQR(사분위 범위) 방식**으로 이상치를 판별하고 처리하시오.

1. `vibration`의 1사분위수(Q1), 3사분위수(Q3), IQR을 구해 **출력**하시오.
2. 이상치 경계를 **하한 = Q1 − 1.5 × IQR**, **상한 = Q3 + 1.5 × IQR** 로 계산해 **출력**하시오.
3. **상한을 초과하는 값의 개수**와 처리 전 `vibration`의 **최댓값**을 **출력**하시오.
4. 이상치를 **삭제하지 말고**, 하한보다 작은 값은 하한으로, 상한보다 큰 값은 상한으로 **바꾸시오(경계값으로 대체)**.
5. 처리 후 `vibration`의 **최댓값**을 **출력**하여 상한 이하로 내려왔음을 확인하시오.

> 행을 삭제하지 않는 이유가 있습니다. 해설에서 확인하십시오.

---

### Q4. 결측치 처리 [6점] — 권장 5분

`pressure` 컬럼의 결측치를 **해당 컬럼의 평균값**으로 대체하시오.

1. 처리 전 `pressure`의 **결측 개수**와 **평균값**을 **출력**하시오.
2. 결측치를 평균으로 대체하시오.
3. 처리 후 **데이터프레임 전체에 남은 결측치 개수**를 **출력**하여 0임을 확인하시오.

---

### Q5. 범주형 변수 인코딩 [8점] — 권장 8분

문자열로 되어 있는 `line_id`와 `shift` 두 컬럼을 **원-핫 인코딩**하시오.

- 생성되는 더미 변수는 **0과 1의 정수**가 되도록 하시오.
- 인코딩 후의 **컬럼 목록**과 **데이터 형태**를 **출력**하시오.

> 타깃 `defect_type`은 이미 정수(0/1/2)입니다. **타깃에는 원-핫 인코딩을 하지 마십시오.** 이 판단이 Q10의 loss 선택과 직결됩니다.

---

### Q6. 특성·타깃 분리와 데이터 분리 [8점] — 권장 8분

1. 타깃 `y`는 `defect_type`으로 만드시오. 이때 **`to_numpy()`로 넘파이 배열로 변환**하시오.
2. 특성 `X`는 **`defect_type`과 `rul_days`를 제외한** 나머지 전체 컬럼으로 만드시오.
3. **학습 데이터와 평가 데이터를 8:2로 분리**하여 `X_train`, `X_test`, `y_train`, `y_test`에 저장하시오.
   - `random_state=42`를 사용하시오.
   - 타깃의 **세 클래스 비율이 학습·평가 양쪽에 동일하게 유지**되도록 하시오.
4. `X`의 형태, `y`의 형태와 자료형, `X_train`·`X_test`의 형태, 그리고 **`y_train`·`y_test`의 클래스별 비율**을 **출력**하시오.

---

### Q7. 스케일링 [7점] — 권장 6분

`MinMaxScaler`를 사용해 특성을 0~1 범위로 변환하시오.

- 스케일러 객체는 `scaler`라는 이름으로 만드시오.
- **평가 데이터의 정보가 변환 규칙에 섞여 들어가지 않도록** 처리하시오.
- 변환 결과는 각각 `X_train_scaled`, `X_test_scaled`에 저장하시오.

변환 후 두 배열의 **형태**와, `X_train_scaled`·`X_test_scaled` 각각의 **최솟값·최댓값**을 **출력**하시오.
(평가 데이터의 최솟값·최댓값이 정확히 0과 1이 아닐 수 있습니다. 그것이 정상인 이유를 해설에서 확인하십시오.)

---

### Q8. 머신러닝 베이스라인 [8점] — 권장 8분

딥러닝 모델과 비교할 기준선을 만듭니다.
`RandomForestClassifier`로 베이스라인 모델을 학습시키고 평가 데이터 성능을 확인하시오.

- 모델 변수명은 `rf_model`로 하시오. (뒤 문항의 딥러닝 모델 `model`과 겹치지 않게 하기 위함입니다.)
- `n_estimators=100`, `random_state=42`를 사용하시오.
- `X_train_scaled`로 학습하고 `X_test_scaled`로 예측하시오.
- 평가 데이터에 대한 **정확도(accuracy)**, **`classification_report`**, **`confusion_matrix`** 를 **출력**하시오.
- 추가로, **평가 데이터를 전부 0(정상)으로만 예측했을 때의 정확도**를 계산해 **출력**하시오.

---

### Q9. 딥러닝 모델 구성 [12점] — 권장 12분

이 문제 유형에 맞는 딥러닝 모델을 `model`이라는 이름으로 만드시오.

**구성 조건**

- `Sequential` 모델을 사용하시오.
- 입력층은 `X_train_scaled`의 **특성 개수에 맞춰** 지정하시오.
- **은닉층을 2개 이상** 쌓되, 활성화 함수는 `relu`를 사용하시오.
- 은닉층 사이에 **`Dropout`을 포함**시키시오.
- 출력층은 **이 문제의 클래스 개수와 유형에 맞는 노드 수·활성화 함수**로 지정하시오.
  - 클래스 개수는 숫자를 직접 적지 말고, **`y_train`에서 계산해** 사용하시오. 그 값을 함께 **출력**하시오.
- 구성 후 `model.summary()`로 구조를 **출력**하시오.

> `summary()`의 마지막 층 Output Shape가 `(None, 3)`인지 확인하십시오. 여기서 어긋나면 Q10~Q12가 전부 무너집니다.

---

### Q10. 컴파일 — 손실 함수 선택 [8점] — 권장 6분

`model`을 컴파일하시오.

1. 먼저 `y_train`의 **앞 10개 값과 자료형(dtype)** 을 **출력**하여, 라벨이 **정수 형태인지 원-핫 형태인지** 확인하시오.
2. 확인한 라벨 형태에 맞는 **손실 함수**를 선택해 컴파일하시오.
   - optimizer는 `adam`을 사용하시오.
   - metrics로 `accuracy`를 지정하시오.
3. 선택한 손실 함수의 이름을 **출력**하고, **왜 그 손실 함수를 골랐는지**를 주석으로 1~2줄 서술하시오.

> 이 문항은 코드 한 줄보다 **판단 근거**를 보는 문항입니다. 다중분류에서 손실 함수가 갈리는 기준은 오직 하나입니다.

---

### Q11. 콜백을 적용한 학습 [11점] — 권장 14분

`model`을 학습시키시오.

**학습 조건**

- `X_train_scaled`, `y_train`으로 학습하시오.
- `epochs=100`, `batch_size=32`로 지정하시오.
- 학습 데이터의 **20%를 검증 데이터로 사용**하시오.
- 콜백을 적용하시오.
  - `es` — `EarlyStopping`: `val_loss`를 관찰하고, `patience=5`, **가장 좋았던 시점의 가중치를 복원**하도록 설정
- 학습 결과는 `history`에 저장하시오.

**학습 후**

- **실제로 학습이 진행된 epoch 수**와 `history`의 **키 목록**을 **출력**하시오.
- `history`를 이용해 **학습 곡선**을 그리시오. loss와 accuracy를 각각 학습·검증 두 선으로 표시하시오.

---

### Q12. 평가와 클래스별 성능 해석 [12점] — 권장 12분

학습된 `model`로 평가 데이터의 성능을 확인하시오.

1. `evaluate`로 평가 데이터의 **loss와 accuracy**를 출력하시오.
2. `predict`로 예측 결과 `pred`를 구하고, **`pred`의 형태**와 **첫 번째 행의 합**을 출력하시오.
3. `pred`를 **예측 클래스 `y_pred`(0/1/2)로 변환**하시오.
4. `classification_report`와 `confusion_matrix`를 **출력**하시오.
5. 출력 결과를 보고 다음 두 가지를 주석으로 **2~3줄 이내** 서술하시오.
   - **어느 클래스의 성능이 가장 낮은지**와 그 이유로 짐작되는 것
   - 혼동 행렬에서 **가장 많이 헷갈린 클래스 쌍**

---

### 회귀 확장 세트 (R1~R3) — 별도 30점

> 📌 **여기서부터는 추가 연습입니다.** 실제 시험은 한 회차에 한 유형만 출제되는 경우가 많으므로, 본편 12문항을 먼저 끝낸 뒤 진행하십시오.
> **상황 설정:** 현장 요구가 바뀌었습니다. "불량 유형을 맞히는 것"이 아니라 **"설비의 잔여 수명(`rul_days`)이 며칠인지"** 를 예측해야 합니다.
> 데이터와 전처리(Q3~Q5까지 처리된 `df`)는 **그대로 재사용**합니다. 변수명은 본편 이름에 `_r`을 붙입니다.

### R1. 타깃 교체와 데이터 준비 [10점] — 권장 7분

Q5까지 전처리를 마친 `df`를 그대로 이어받아, 회귀용 데이터를 준비하시오.

1. 타깃 `y_reg`를 `rul_days`로 만드시오(**`to_numpy()`로 변환**).
2. 특성 `X_r`는 본편과 **동일하게** `defect_type`과 `rul_days`를 제외한 컬럼으로 만드시오. **본편의 `X`를 덮어쓰지 말고 새 이름에 담으시오.**
3. `y_reg`의 **앞 5개 값·자료형**, 그리고 **평균·최솟값·최댓값**을 **출력**하시오.
4. 8:2로 분리하여 `X_train_r`, `X_test_r`, `y_train_r`, `y_test_r`에 저장하시오. `random_state=42`를 사용하시오.
   - **본편 Q6에서 썼던 옵션 중 하나는 여기서 쓸 수 없습니다.** 무엇이며 왜 그런지 주석으로 1줄 서술하시오.
5. `MinMaxScaler`(`scaler_r`)로 `X_train_r_scaled`, `X_test_r_scaled`를 만들고 형태를 **출력**하시오.

---

### R2. 회귀 딥러닝 모델 구성·컴파일·학습 [12점] — 권장 8분

`model_r`이라는 이름으로 회귀 모델을 만들고 학습시키시오.

**구성·컴파일 조건**

- 은닉층 구성은 본편 `model`과 동일한 형태로 두어도 됩니다(`relu` 은닉층 2개 + `Dropout`).
- **출력층을 회귀에 맞게** 지정하시오.
- **손실 함수와 metrics를 회귀에 맞게** 지정하시오. optimizer는 `adam`을 사용하시오.
- `model_r.summary()`를 **출력**하시오.

**학습 조건**

- `epochs=200`, `batch_size=32`, 검증 데이터 20%로 학습하시오.
- `es_r` — `EarlyStopping`: `val_loss` 관찰, `patience=10`, 최적 가중치 복원.
- 학습 결과는 `history_r`에 저장하시오.
- 학습 후 **실제 학습 epoch 수**와 `history_r`의 **키 목록**을 **출력**하고, 학습 곡선(loss, 그리고 회귀용 지표)을 그리시오.

> `history_r`의 키 목록을 반드시 눈으로 확인하십시오. 본편과 **키 이름이 다릅니다.**

---

### R3. 회귀 평가와 해석 [8점] — 권장 5분

`model_r`의 평가 데이터 성능을 확인하시오.

1. `evaluate`로 평가 데이터의 **loss와 metrics 값**을 출력하시오.
2. `predict`로 예측값 `y_pred_r`을 구하시오. **1차원으로 형태를 정리**하시오.
3. sklearn의 **`mean_squared_error`, `mean_absolute_error`, `r2_score`** 를 출력하시오. **RMSE**(mse의 제곱근)도 함께 출력하시오.
4. **비교 기준**으로, "학습 데이터 타깃의 평균값을 모든 샘플에 그대로 답한 경우"의 **mae와 r2**를 계산해 출력하시오.
5. 위 수치를 근거로 **모델이 쓸 만한지**를 주석으로 2줄 이내 서술하시오. `mae`와 `r2`를 각각 어떻게 읽었는지 밝히시오.

> 이 문항에서 `classification_report`나 `argmax`를 쓰면 0점입니다. 이유는 해설에서 확인하십시오.

---

## 해답 및 해설

> 아래 코드는 모두 실제 실행으로 검증되었습니다. 검증 환경과 결과 수치는 문서 맨 아래 검증 주석을 참고하십시오.
> 딥러닝 결과 수치(정확도·epoch 수 등)는 실행 환경과 난수에 따라 **소폭 달라집니다.** 게재된 값은 검증 실행의 실측치이며, 판단 기준은 "값의 자릿수와 대소 관계"로 잡으십시오.

### 공통 import

문항을 풀기 전에 아래 import 블록을 한 번 실행해 두면 이후 문항에서 반복하지 않아도 됩니다.

```python
import tensorflow as tf      # [환경] pandas보다 먼저 import — 아래 '로컬 환경 주의' 참고
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping

np.random.seed(42)
tf.random.set_seed(42)
```

> 💡 **로컬 환경 주의 (시험장에서는 신경 쓸 필요 없습니다)**
> 위 블록의 첫 줄이 `import tensorflow as tf`인 것은 오타가 아닙니다. 일부 로컬 환경(macOS + `pyarrow`가 설치된 pandas 조합)에서는 **`pandas`를 `tensorflow`보다 먼저 import 하면 Q11의 `model.fit`이 아무 출력도 없이 멈춥니다.** 데이터 준비 절의 생성 블록과 이 공통 import 블록 **양쪽 모두** 첫 줄을 `tensorflow`로 맞춰야 하며, **한쪽만 고치면 효과가 없습니다.**
> **학습 셀이 진행되지 않고 멈춘다면 커널을 재시작한 뒤 데이터 생성 블록부터 다시 실행하십시오.** 이미 pandas가 먼저 적재된 세션에서는 import 순서를 고쳐도 증상이 남습니다.

---

### Q1 해답 — 데이터 로딩과 클래스 분포 확인 [5점]

**정답 코드**

```python
df = pd.read_csv('factory_defect.csv')

print(df.shape)                                              # 1) 행·열 개수
print(df.head())                                             # 2) 상위 5개 행
print(df.info())                                             # 3) 자료형·결측 요약
print(df['defect_type'].value_counts().sort_index())         # 4) 클래스별 개수
print(df['defect_type'].value_counts(normalize=True).sort_index().round(3))  # 4) 비율
```

실행 결과 요지입니다.

```
(4000, 10)

 #   Column       Non-Null Count  Dtype
 0   temp         4000 non-null   float64
 1   vibration    4000 non-null   float64
 2   pressure     3840 non-null   float64      ← 결측 160건
 ...
 6   line_id      4000 non-null   str          ← 인코딩 대상
 7   shift        4000 non-null   str          ← 인코딩 대상
 8   defect_type  4000 non-null   int64        ← 타깃(정수)
 9   rul_days     4000 non-null   float64

defect_type
0    2421
1     968
2     611

defect_type
0    0.605
1    0.242
2    0.153
```

**왜 이렇게 푸는가**

- 이 회차의 Q1은 단순 확인이 아니라 **유형 판정 문항**입니다. `value_counts()` 결과가 **세 줄(0/1/2)** 이라는 것 하나로 뒤 문항 세 개가 결정됩니다.
  1. Q9의 출력층은 `Dense(3, 'softmax')`
  2. Q10의 loss는 라벨이 **정수**이므로 `sparse_categorical_crossentropy`
  3. Q12의 예측 변환은 임계값이 아니라 `argmax`
- `value_counts()`에 **`.sort_index()`** 를 붙인 이유는, 기본 정렬이 **개수 내림차순**이라 클래스 번호 순서와 어긋나기 때문입니다. 클래스별 성능을 비교할 문항(Q12)이 뒤에 있으므로 처음부터 번호순으로 읽는 습관을 들이십시오.
- `info()`의 **Non-Null Count**에서 `pressure`만 3840입니다. **이 시점에 이미 "결측 160건"을 알 수 있고**, Q4에서 손볼 컬럼이 확정됩니다. `Dtype`이 `str`(환경에 따라 `object`)인 `line_id`·`shift`는 Q5의 인코딩 대상입니다.
- 비율 **0.605 : 0.242 : 0.153** — 3배 이상 기울어져 있습니다. Q6의 `stratify`와 Q12의 클래스별 지표 해석이 여기서 근거를 얻습니다.

**자주 틀리는 지점**

- `df.info()`를 `print()` 없이 셀 중간에 두는 것. 노트북 셀의 마지막 줄이 아니면 아무것도 출력되지 않습니다. **"출력하시오"에는 예외 없이 `print()`** 입니다.
- 클래스 개수를 "세 개겠지" 하고 눈으로 짐작하는 것. 실제 시험 데이터는 클래스가 4개·5개일 수도 있습니다. **`value_counts()`로 확인한 뒤 Q9에서 `len(np.unique(y_train))`으로 계산**하는 흐름이 안전합니다.

---

### Q2 해답 — 클래스별 센서 분포 시각화 [7점]

**정답 코드**

```python
# 1) 클래스별 온도 분포
sns.boxplot(data=df, x='defect_type', y='temp')
plt.title('temp by defect_type')
plt.show()

# 2) 클래스별 진동 분포
sns.histplot(data=df, x='vibration', hue='defect_type', bins=30)
plt.title('vibration by defect_type')
plt.show()

# 3) 클래스별 센서 평균
sensor_cols = ['temp', 'vibration', 'pressure', 'rpm', 'current', 'humidity']
print(df.groupby('defect_type')[sensor_cols].mean().round(2))
```

실행 결과입니다.

```
              temp  vibration  pressure      rpm  current  humidity
defect_type
0            70.33       3.78      5.01  1504.23    11.98     44.77
1            71.96       5.80      4.78  1461.87    12.46     45.22
2            79.68       4.74      4.46  1487.41    13.51     45.10
```

**왜 이렇게 푸는가**

- **그래프 종류를 지시대로 골라야 합니다.** "클래스별 수치 분포 비교"는 `boxplot`(중앙값·사분위·이상치를 한눈에), "분포 겹쳐 보기"는 `histplot` + `hue`입니다. `countplot`은 **범주의 개수**를 세는 그래프라서 온도 같은 연속값에는 쓰지 않습니다.
- `hue='defect_type'`이 이 문항의 채점 포인트입니다. `hue`가 없으면 전체 분포 하나만 그려져 **"클래스별"이라는 지시를 만족하지 못합니다.**
- 평균 표에서 읽어야 할 것이 셋입니다.
  1. **클래스 2(과열)는 `temp` 79.7 / `current` 13.5** 로 뚜렷하게 높습니다 → 온도·전류가 강한 단서.
  2. **클래스 1(마모)은 `vibration` 5.80** 으로 높습니다 → 진동이 마모의 단서.
  3. **`humidity`는 44.8 / 45.2 / 45.1로 사실상 차이가 없습니다** → 예측에 거의 기여하지 않는 컬럼입니다. 이런 컬럼이 섞여 있어도 딥러닝은 가중치를 낮게 학습하므로 굳이 지울 필요는 없지만, **"모든 컬럼이 정보를 갖고 있지는 않다"** 는 사실은 Q12에서 성능 한계를 해석할 때 필요합니다.
- `boxplot`의 위쪽 점들(이상치 표시)이 Q3의 근거가 됩니다. 시각화 문항은 **다음 전처리 문항의 이유를 만들어 주는 자리**입니다.

**자주 틀리는 지점**

- `groupby` 뒤에 컬럼을 지정하지 않고 `df.groupby('defect_type').mean()`을 쓰는 것. 문자열 컬럼(`line_id`, `shift`)이 남아 있으면 환경에 따라 **`TypeError`** 가 나거나 해당 컬럼이 조용히 빠집니다. **수치형 컬럼 목록을 명시**하십시오.
- `plt.show()`를 빼먹어 그래프 두 개가 한 그림에 겹쳐 나오는 것. 그래프마다 `show()`로 끊어 주십시오.
- `rul_days`를 평균 표에 함께 넣는 것 자체는 오류가 아니지만, **본편의 특성이 아니므로** 센서 분석에 섞으면 뒤에서 혼동합니다.

---

### Q3 해답 — 이상치 처리 [8점]

**정답 코드**

```python
q1 = df['vibration'].quantile(0.25)
q3 = df['vibration'].quantile(0.75)
iqr = q3 - q1
lower = q1 - 1.5 * iqr
upper = q3 + 1.5 * iqr

print('Q1:', round(q1, 2), '/ Q3:', round(q3, 2), '/ IQR:', round(iqr, 2))
print('하한:', round(lower, 2), '/ 상한:', round(upper, 2))
print('상한 초과 개수:', (df['vibration'] > upper).sum())
print('처리 전 최대:', df['vibration'].max())

df['vibration'] = df['vibration'].clip(lower=lower, upper=upper)   # 경계값으로 대체

print('처리 후 최대:', round(df['vibration'].max(), 2))
```

실행 결과입니다.

```
Q1: 2.7 / Q3: 4.74 / IQR: 2.04
하한: -0.37 / 상한: 7.8
상한 초과 개수: 54
처리 전 최대: 93.51
처리 후 최대: 7.8
```

**왜 이렇게 푸는가**

- **IQR 공식은 외워 두는 것이 빠릅니다.** `Q1 = quantile(0.25)`, `Q3 = quantile(0.75)`, `IQR = Q3 - Q1`, 경계는 `Q1 - 1.5*IQR` ~ `Q3 + 1.5*IQR`. 시험에서 "IQR 방식으로 이상치를 처리하시오"라는 지시가 나오면 이 네 줄이 그대로 답입니다.
- **`clip()`이 "경계값으로 대체"의 정답 함수**입니다. `clip(lower=..., upper=...)`은 하한보다 작은 값은 하한으로, 상한보다 큰 값은 상한으로 눌러 줍니다. 최댓값이 **93.51 → 7.8** 로 내려온 것이 처리가 먹혔다는 증거입니다.
- **행을 삭제하지 않는 이유**가 이 문항의 핵심입니다. 이상치가 있는 54개 행에도 `temp`·`current` 같은 **정상적으로 측정된 다른 센서 값과 정답 라벨이 들어 있습니다.** 행을 지우면 그 정보까지 함께 버립니다. 게다가 이상치 행이 특정 클래스에 몰려 있으면 **삭제가 클래스 비율을 왜곡**합니다. 그래서 "센서 오작동으로 값 하나만 튄 상황"에서는 삭제보다 **클리핑(또는 결측 처리 후 대체)** 이 기본 선택입니다.
- 상한 초과가 **54개**로, 주입된 오작동 값 40개보다 많습니다. 즉 **정상 범위의 큰 진동값 14개도 함께 눌렸습니다.** IQR은 통계적 기준일 뿐이므로 이런 일이 생깁니다. 클래스 1(마모)의 진동이 원래 높다는 점을 생각하면 아쉬운 손실이지만, **93.51 같은 물리적으로 불가능한 값을 그대로 두는 편이 훨씬 위험합니다.** 이상치 처리는 "완벽한 분리"가 아니라 "치명적인 값 제거"가 목표입니다.

**자주 틀리는 지점**

- **재대입 누락** — `df['vibration'].clip(...)` 만 쓰고 대입하지 않는 것. `clip`은 새 Series를 반환하므로 `df['vibration'] = ...` 로 되돌려 넣어야 합니다. 출력만 보고 처리됐다고 착각하는 사고가 가장 많습니다.
- **스케일링 후에 이상치를 처리하는 것.** 93.51이 섞인 채 `MinMaxScaler`를 걸면 **최댓값 93.51이 1.0의 기준**이 되어 정상 값들이 모두 0.03~0.08 근처로 뭉갭니다. **이상치 처리는 스케일링보다 먼저**입니다.
- `(df['vibration'] > upper).sum()`을 `len(...)`으로 세려는 것. 불리언 Series의 `.sum()`이 개수입니다.

---

### Q4 해답 — 결측치 처리 [6점]

**정답 코드**

```python
print('처리 전 pressure 결측:', df['pressure'].isnull().sum())
print('pressure 평균:', round(df['pressure'].mean(), 3))

df['pressure'] = df['pressure'].fillna(df['pressure'].mean())      # 평균 대체

print('처리 후 전체 결측 합:', df.isnull().sum().sum())
```

실행 결과입니다.

```
처리 전 pressure 결측: 160
pressure 평균: 4.872
처리 후 전체 결측 합: 0
```

**왜 이렇게 푸는가**

- 문항이 **"평균값으로 대체"** 라고 지정했으므로 `mean()`입니다. 중앙값(`median()`)이 더 안전한 선택인 상황이 많지만, **시험에서는 지시된 통계량을 그대로 씁니다.** 지시를 벗어난 판단은 감점 요소입니다.
- `fillna()`가 **새 Series를 반환**하므로 `df['pressure'] = ...` 재대입이 필수입니다.
- `df['pressure'].mean()`은 **결측을 제외하고 계산**합니다(pandas 기본 동작). 그래서 "평균을 구해 그 평균으로 채운다"가 한 줄로 성립합니다.
- 확인 출력은 `df.isnull().sum().sum()` — **`.sum()`을 두 번** 붙여 전체 합계 스칼라를 얻습니다. 컬럼별로 보고 싶으면 `.sum()` 한 번입니다. 문항이 "전체에 남은 결측치 개수"를 요구했으므로 두 번이 정확합니다.

**자주 틀리는 지점**

- `df.fillna(df.mean())` 처럼 **데이터프레임 전체에** 적용하는 것. 문자열 컬럼이 섞여 있어 환경에 따라 오류가 나거나, 지시하지 않은 컬럼까지 값이 바뀝니다. **지정된 컬럼만** 처리하십시오.
- `inplace=True`에 의존하는 것. 최신 pandas에서는 경고가 나거나 동작이 달라질 수 있어, **재대입 방식이 안전합니다.**
- 결측을 채우기 전에 스케일링·분리로 넘어가는 것. `NaN`이 남은 상태로 `fit`을 호출하면 sklearn은 **`ValueError: Input contains NaN`** 을 던집니다. 이 메시지를 만나면 되돌아와 Q4를 확인하십시오.

---

### Q5 해답 — 범주형 변수 인코딩 [8점]

**정답 코드**

```python
df = pd.get_dummies(df, columns=['line_id', 'shift'], dtype=int)

print(df.columns.tolist())
print(df.shape)
```

실행 결과입니다.

```
['temp', 'vibration', 'pressure', 'rpm', 'current', 'humidity',
 'defect_type', 'rul_days',
 'line_id_L1', 'line_id_L2', 'line_id_L3', 'shift_A', 'shift_B', 'shift_C']
(4000, 14)
```

**왜 이렇게 푸는가**

- `pd.get_dummies(df, columns=[...])` 는 **지정한 컬럼만** 더미로 바꾸고 나머지는 그대로 둡니다. `columns`를 생략하면 문자열 컬럼 전체가 대상이 되는데, 이 데이터에서는 결과가 같더라도 **의도를 명시하는 편이 안전**합니다.
- **`dtype=int`가 채점 포인트**입니다. 지정하지 않으면 pandas 버전에 따라 더미가 `bool`(True/False)로 생성됩니다. 학습이 되기는 하지만 문항이 "0과 1의 정수"를 요구했으므로 명시해야 합니다.
- 컬럼 10개 → **14개**로 늘었습니다. 3종 범주 두 개가 각각 3개 더미가 되어 `+6`, 원본 문자열 컬럼 2개가 사라져 `-2` 입니다. **숫자로 검산하는 습관**을 들이면 인코딩 누락을 바로 잡아냅니다.
- **타깃 `defect_type`은 손대지 않았습니다.** 정수 라벨을 그대로 유지하는 것이 이 회차의 설계입니다. 이 상태 그대로 Q10에서 `sparse_categorical_crossentropy`를 선택하게 됩니다.

**자주 틀리는 지점**

- **타깃까지 원-핫으로 만드는 것.** `pd.get_dummies(df)` 를 컬럼 지정 없이 부르고 타깃이 문자열이었다면 타깃이 3개 컬럼으로 쪼개집니다. 그러면 loss도 `categorical_crossentropy`로 바꿔야 하는데 한쪽만 바꿔서 **shape 오류**를 만나는 경우가 잦습니다.
- **분리(Q6) 후에 인코딩하는 것.** train과 test에 등장하는 범주가 다르면 컬럼 수가 어긋나 `X_test`에서 **feature 개수 불일치 오류**가 납니다. 순서 규칙은 **인코딩은 분리 전, 스케일링은 분리 후**입니다.
- `drop_first=True`를 임의로 붙이는 것. 다중공선성을 줄이는 기법이지만 문항이 요구하지 않았고, 컬럼 수가 달라져 검산이 어긋납니다. **지시가 없으면 붙이지 않습니다.**

---

### Q6 해답 — 특성·타깃 분리와 데이터 분리 [8점]

**정답 코드**

```python
y = df['defect_type'].to_numpy()                       # 타깃 → 넘파이 배열
X = df.drop(columns=['defect_type', 'rul_days'])       # 두 타깃 컬럼 모두 제외

print('X shape:', X.shape, '/ y shape:', y.shape, '/ y dtype:', y.dtype)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y)

print('X_train:', X_train.shape, '/ X_test:', X_test.shape)
print('y_train 비율:', np.round(np.bincount(y_train) / len(y_train), 3))
print('y_test  비율:', np.round(np.bincount(y_test) / len(y_test), 3))
```

실행 결과입니다.

```
X shape: (4000, 12) / y shape: (4000,) / y dtype: int64
X_train: (3200, 12) / X_test: (800, 12)
y_train 비율: [0.605 0.242 0.153]
y_test  비율: [0.605 0.242 0.152]
```

**왜 이렇게 푸는가**

- **`rul_days`를 반드시 빼야 합니다.** `rul_days`(잔여 수명)는 불량 유형과 같은 원인에서 나온 값이라 **정답을 거의 알려주는 컬럼**입니다. 이런 컬럼을 특성에 넣으면 평가 정확도가 비현실적으로 높게 나오는데, 이것이 **타깃 누수(data leakage)** 입니다. 시험에서 "예측 시점에 알 수 없는 값"이나 "타깃과 같은 사건을 기록한 값"이 컬럼에 섞여 있으면 제거 대상입니다. 컬럼 개수 검산: 14 − 2 = **12개**.
- **`to_numpy()`로 타깃을 넘파이 배열로 만든 이유**가 두 가지입니다.
  1. Keras `fit`은 넘파이 배열을 **가장 표준적인 입력 형태**로 받습니다. pandas Series를 넘겨도 대부분 동작하지만, 인덱스가 딸려 다니므로 슬라이싱·비교 과정에서 예상 밖의 정렬이 생길 여지를 없애 둡니다.
  2. `np.bincount`, `np.unique`, `argmax` 비교 등 뒤 문항의 넘파이 연산이 매끄럽게 이어집니다. 특히 Q12의 `y_pred`(넘파이 배열)와 `y_test`를 비교할 때 형태가 통일되어 있으면 헷갈리지 않습니다.
  타깃을 numpy로 바꿔도 `train_test_split`·`stratify`·`classification_report`는 모두 그대로 동작합니다.
  (문서 앞의 "학습 셀이 멈추는" 증상은 **import 순서 때문이며 타깃 자료형과 무관**합니다. `to_numpy()`는 그 증상의 해결책이 아닙니다.)
- **`test_size=0.2`가 8:2** 입니다. 7:3이었던 1회차와 숫자가 다릅니다. **문항이 지시한 비율을 그때그때 확인**하십시오.
- **`stratify=y`가 채점 포인트**입니다. 클래스가 0.605 / 0.242 / 0.153으로 기울어 있어, 넣지 않으면 평가 데이터의 소수 클래스(2번, 과열) 비율이 흔들립니다. `stratify=y`를 넣은 결과 train·test 양쪽이 **0.605 / 0.242 / 0.152** 로 원본과 일치합니다.
- `np.bincount(y_train) / len(y_train)` 은 정수 라벨의 클래스 비율을 구하는 간단한 방법입니다. `pd.Series(y_train).value_counts(normalize=True)` 를 써도 됩니다.

**자주 틀리는 지점**

- **`drop(columns=['defect_type'])` 만 하고 `rul_days`를 남기는 것.** 오류가 나지 않고 정확도가 훌쩍 올라가기 때문에 **끝까지 못 알아채는 가장 위험한 실수**입니다.
- **반환 순서를 바꿔 받는 것.** `train_test_split`은 항상 `X_train, X_test, y_train, y_test` 순서입니다. `X_train, y_train, X_test, y_test`로 받으면 이후 모든 문항이 조용히 어긋납니다.
- **`stratify=y_train`처럼 잘못된 대상을 넣는 것.** 분리 전 전체 타깃 `y`를 넣습니다.
- `y = df['defect_type']` 로 Series를 그대로 쓰는 것. 오류는 나지 않지만 문항이 `to_numpy()`를 **지시**했으므로 지시를 따릅니다.

---

### Q7 해답 — 스케일링 [7점]

**정답 코드**

```python
scaler = MinMaxScaler()
X_train_scaled = scaler.fit_transform(X_train)     # train에서만 fit
X_test_scaled = scaler.transform(X_test)           # test는 transform만

print(X_train_scaled.shape, X_test_scaled.shape)
print('train min/max:', X_train_scaled.min().round(3), X_train_scaled.max().round(3))
print('test  min/max:', X_test_scaled.min().round(3), X_test_scaled.max().round(3))
```

실행 결과입니다.

```
(3200, 12) (800, 12)
train min/max: 0.0 1.0
test  min/max: -0.007 1.0
```

**왜 이렇게 푸는가**

- **`fit`은 train에만, test는 `transform`만** — 이 회차에서도 같은 규칙입니다. `MinMaxScaler`의 변환 규칙은 `(x - min) / (max - min)` 이고, 이 `min`·`max`는 **학습 데이터에서만** 얻어야 합니다. test의 최솟값·최댓값을 섞으면 평가 데이터 정보가 모델 학습에 흘러드는 **데이터 누수**입니다.
- **test의 최솟값이 −0.007로 음수인 것이 정상입니다.** 평가 데이터에 train의 최솟값보다 더 작은 값이 하나라도 있으면 변환 결과가 0보다 작아집니다. 0~1을 벗어났다고 해서 잘못 푼 것이 아니며, **오히려 `test min/max`가 정확히 0과 1이면 test로 `fit`했다는 신호**일 수 있습니다.
- `StandardScaler`가 아니라 `MinMaxScaler`인 이유는 **문항이 지정**했기 때문입니다. 둘 다 시험 범위이며, 문항이 지정한 스케일러를 그대로 씁니다. 사용법(`fit_transform` / `transform`)은 완전히 동일합니다.
- 결과가 넘파이 배열이라는 점도 기억하십시오. `X_train_scaled.shape[1]` 로 **특성 개수 12**를 얻어 Q9의 `Input(shape=(12,))`에 그대로 씁니다.

**자주 틀리는 지점**

- **`scaler.fit_transform(X_test)`** — 가장 흔한 누수 사고입니다. test에는 `transform`만 씁니다.
- 스케일링을 **분리 전에** 하는 것. 전체 데이터로 `fit`하면 test 정보가 이미 섞입니다. **인코딩은 분리 전, 스케일링은 분리 후.**
- 원-핫 더미 컬럼까지 스케일링되는 것을 걱정하는 것. 이미 0/1이므로 `MinMaxScaler`를 통과해도 값이 그대로입니다. **전체 특성에 한 번에 적용해도 문제가 없습니다.**
- 스케일링 결과를 다시 `X_train`에 대입해 원본을 잃는 것. 변수명 `X_train_scaled`를 지시대로 쓰면 뒤 문항에서 비교·재현이 쉽습니다.

---

### Q8 해답 — 머신러닝 베이스라인 [8점]

**정답 코드**

```python
rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
rf_model.fit(X_train_scaled, y_train)
rf_pred = rf_model.predict(X_test_scaled)

print('RF accuracy:', round(accuracy_score(y_test, rf_pred), 4))
print(classification_report(y_test, rf_pred, digits=3))
print(confusion_matrix(y_test, rf_pred))
print('전부 0으로 예측한 정확도:', round((y_test == 0).mean(), 4))
```

실행 결과입니다.

```
RF accuracy: 0.7863

              precision    recall  f1-score   support
           0      0.832     0.888     0.859       484
           1      0.722     0.629     0.672       194
           2      0.675     0.631     0.653       122
    accuracy                          0.786       800
   macro avg      0.743     0.716     0.728       800
weighted avg      0.781     0.786     0.782       800

[[430  33  21]
 [ 56 122  16]
 [ 31  14  77]]

전부 0으로 예측한 정확도: 0.605
```

**왜 이렇게 푸는가**

- **베이스라인의 목적은 "기준선"** 입니다. 딥러닝 정확도 0.79를 단독으로 보면 좋은지 나쁜지 알 수 없습니다. 랜덤 포레스트 **0.7863**, 무조건 0 예측 **0.605** 라는 두 기준이 있어야 Q12의 해석이 성립합니다.
- **`rf_model`로 이름을 분리**한 이유는 Q9에서 딥러닝 모델을 `model`로 만들기 때문입니다. 같은 이름을 쓰면 베이스라인이 덮여 비교가 불가능해집니다.
- 다중분류에서도 `RandomForestClassifier`의 사용법은 이진분류와 **완전히 동일**합니다. `predict`가 확률이 아니라 **클래스 번호(0/1/2)를 바로** 반환하므로 변환 없이 지표에 넣을 수 있습니다. 이 편리함이 딥러닝(softmax 확률 → `argmax`)과의 차이입니다.
- **`classification_report`가 세 줄**로 나오는 것을 확인하십시오. 클래스 0의 f1이 0.859인데 클래스 2는 0.653입니다. **소수 클래스가 어렵다**는 사실이 베이스라인에서부터 드러납니다.
- 혼동 행렬은 **3×3**입니다. `cm.ravel()`로 TN/FP/FN/TP를 꺼내는 이진분류 방식은 여기서 성립하지 않습니다. 표 전체를 보고 행(실제) × 열(예측)로 읽습니다.

**자주 틀리는 지점**

- **`accuracy_score(rf_pred, y_test)`처럼 인수 순서를 바꾸는 것.** accuracy는 순서가 바뀌어도 값이 같아 넘어가지만, **`confusion_matrix`는 행과 열이 뒤바뀌어** 완전히 다른 해석이 나옵니다. 순서는 항상 **(정답, 예측)** 입니다.
- 스케일링하지 않은 `X_train`을 넣는 것. 트리 모델은 스케일링에 둔감해서 결과가 비슷하게 나오지만, 문항이 `X_train_scaled`를 지시했으므로 지시를 따릅니다.
- `n_estimators`·`random_state`를 지정하지 않는 것. 지정하지 않으면 **실행마다 결과가 달라져** 채점자가 재현할 수 없습니다.

---

### Q9 해답 — 딥러닝 모델 구성 [12점]

**정답 코드**

```python
n_classes = len(np.unique(y_train))          # 클래스 수를 코드로 계산
print('클래스 수:', n_classes)

model = Sequential()
model.add(Input(shape=(X_train_scaled.shape[1],)))     # 특성 12개
model.add(Dense(64, activation='relu'))
model.add(Dropout(0.3))
model.add(Dense(32, activation='relu'))
model.add(Dense(n_classes, activation='softmax'))      # 다중분류: K개 + softmax
model.summary()
```

실행 결과 요지입니다.

```
클래스 수: 3

 Layer (type)              Output Shape        Param #
 dense (Dense)             (None, 64)              832
 dropout (Dropout)         (None, 64)                0
 dense_1 (Dense)           (None, 32)            2,080
 dense_2 (Dense)           (None, 3)                99
 Total params: 3,011
```

**왜 이렇게 푸는가**

- **출력층이 이 문항의 전부입니다.** 다중분류의 출력층은 `Dense(클래스 수, activation='softmax')`. softmax는 K개의 출력을 **합이 1인 확률 분포**로 만들어 "어느 클래스일 가능성이 가장 큰가"를 표현합니다. 이진분류의 `Dense(1, 'sigmoid')`와 여기가 갈립니다.
- **`n_classes = len(np.unique(y_train))`** 로 계산한 이유는 시험장에서 클래스 수를 눈으로 세다가 틀리는 일을 막기 위해서입니다. 숫자 `3`을 직접 써도 정답이지만, **데이터가 바뀌어도 그대로 통하는 코드**가 실전에서 강합니다.
- **`Input(shape=(X_train_scaled.shape[1],))`** — 입력 shape에는 **샘플 수를 넣지 않습니다.** `(3200, 12)` 중 뒤의 12만 씁니다. `shape=(12,)`처럼 콤마를 포함한 튜플로 적는 것도 잊지 마십시오. `summary()`의 Output Shape에 찍히는 `None`이 바로 샘플 수 자리이며, 배치 크기에 따라 달라지는 값이라 모델 정의에서는 비워 둡니다.
- **은닉층 활성화는 `relu`** 입니다. 은닉층에 softmax나 sigmoid를 넣으면 학습이 느려지거나 정보가 뭉갭니다. **softmax는 출력층에만.**
- `summary()`의 마지막 줄 Output Shape가 **`(None, 3)`** 인지 반드시 확인하십시오. 여기가 `(None, 1)`이면 Q10~Q12가 전부 오류입니다.
- 파라미터 검산: 12×64+64 = **832**, 64×32+32 = **2,080**, 32×3+3 = **99**. `Dropout`은 학습 파라미터가 **0**입니다(끄고 켜는 규칙일 뿐 가중치가 없습니다).

**자주 틀리는 지점**

- **출력층 노드 수를 1로 두는 것.** 이진분류 코드를 복사해 오면 `Dense(1, 'softmax')`가 되는데, 노드가 1개인 softmax는 **항상 1.0만 출력**합니다. 오류가 나지 않고 정확도가 클래스 0 비율(0.605)에 붙어 버려 원인을 찾기 어렵습니다.
- **출력층에 `relu`를 쓰는 것.** 확률이 아니라 0 이상의 임의 값이 나와 `argmax` 결과가 엉킵니다.
- **`Dropout`을 출력층 바로 뒤에 넣는 것.** Dropout은 은닉층 뒤에 둡니다. 출력 확률을 무작위로 0으로 만들면 학습이 망가집니다.
- `input_shape=` 를 `Dense`의 인수로 쓰는 구버전 표기. 동작하더라도 Keras 3에서는 비권장이므로 **`Input(shape=(n,))`** 을 표준으로 쓰십시오.

---

### Q10 해답 — 컴파일: 손실 함수 선택 [8점]

**정답 코드**

```python
# 1) 라벨 형태 확인 — loss 선택의 유일한 근거
print('y_train 앞 10개:', y_train[:10], '/ dtype:', y_train.dtype)

# 2) 정수 라벨 → sparse_categorical_crossentropy
model.compile(optimizer='adam',
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])

print('선택한 loss:', model.loss)
# 라벨이 [0 2 0 0 ...] 처럼 정수 하나로 되어 있으므로 sparse_ 계열을 선택했다.
# 원-핫([1,0,0])이었다면 categorical_crossentropy를 썼을 것이다. 출력층은 둘 다 Dense(3,'softmax')로 같다.
```

실행 결과입니다.

```
y_train 앞 10개: [0 2 0 0 0 2 2 2 0 1] / dtype: int64
선택한 loss: sparse_categorical_crossentropy
```

**왜 이렇게 푸는가**

- **다중분류에서 loss가 갈리는 기준은 오직 "라벨의 형태" 하나입니다.**

  | 라벨 형태 | 예시 | loss | 출력층 |
  |---|---|---|---|
  | **정수 라벨** | `0`, `2`, `1` | **`sparse_categorical_crossentropy`** | `Dense(3, 'softmax')` |
  | 원-핫 | `[1,0,0]`, `[0,0,1]` | `categorical_crossentropy` | `Dense(3, 'softmax')` |

  **출력층은 두 경우가 똑같습니다.** 바뀌는 것은 loss 이름뿐입니다. 이 표를 외워 두면 이 문항은 10초에 끝납니다.
- 우리는 Q5에서 **타깃을 일부러 원-핫으로 만들지 않았습니다.** `y_train`이 `[0 2 0 0 ...]` 정수이므로 `sparse_` 접두어가 붙은 쪽입니다. `sparse`는 "정답을 인덱스 하나로 희소하게 표현했다"는 뜻으로 이해하면 기억에 남습니다.
- **`metrics=['accuracy']`는 유형과 무관하게 분류라면 동일**합니다. loss와 metrics를 혼동해 `metrics=['sparse_categorical_crossentropy']`를 쓰는 답안이 있는데, 그러면 화면에 정확도가 나오지 않아 Q11·Q12의 학습 곡선 지시를 만족할 수 없습니다.
- optimizer는 지시대로 `'adam'`입니다. 시험에서 특별한 언급이 없으면 adam이 무난한 기본값입니다.

**자주 틀리는 지점**

- **정수 라벨에 `categorical_crossentropy`를 쓰는 것** — 이 회차 최다 감점 포인트입니다. 학습이 시작되자마자 다음과 같은 shape 오류가 납니다.

  ```
  ValueError: Shapes (32, 1) and (32, 3) are incompatible
  ```

  메시지의 `(32, 1)`이 정수 라벨, `(32, 3)`이 softmax 출력입니다. **이 조합을 보면 곧바로 `sparse_`를 붙이십시오.**
- **거꾸로, 라벨을 원-핫으로 바꿔 놓고 `sparse_categorical_crossentropy`를 유지하는 것.** `to_categorical()`을 썼다면 loss도 함께 `categorical_crossentropy`로 바꿔야 합니다. **둘은 항상 짝으로 움직입니다.**
- **이진분류의 `binary_crossentropy`를 그대로 두는 것.** 클래스가 3개인데 binary를 쓰면 오류 없이 학습이 진행되면서 정확도가 이상하게 높거나 낮게 나옵니다. 출력층·loss·예측 변환 **세 곳을 함께** 점검하십시오.
- 컴파일을 건너뛰고 `fit`을 부르는 것. `RuntimeError: You must compile your model before training` 이 납니다.

---

### Q11 해답 — 콜백을 적용한 학습 [11점]

**정답 코드**

```python
es = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)

history = model.fit(X_train_scaled, y_train,
                    epochs=100, batch_size=32,
                    validation_split=0.2,
                    callbacks=[es],          # 리스트로 전달
                    verbose=0)

print('실제 학습 epoch 수:', len(history.history['loss']))
print('history 키:', list(history.history.keys()))

h = history.history
plt.figure(figsize=(10, 4))
plt.subplot(1, 2, 1)
plt.plot(h['loss'], label='train')
plt.plot(h['val_loss'], label='val')
plt.title('loss'); plt.legend()
plt.subplot(1, 2, 2)
plt.plot(h['accuracy'], label='train')
plt.plot(h['val_accuracy'], label='val')
plt.title('accuracy'); plt.legend()
plt.show()
```

실행 결과입니다.

```
실제 학습 epoch 수: 23
history 키: ['accuracy', 'loss', 'val_accuracy', 'val_loss']
```

> 멈추는 시점은 실행마다 달라집니다. 검증 환경에서는 **20~47 epoch** 사이에서 끝났습니다. 숫자를 맞히는 것이 목적이 아니라, **지시한 상한 100보다 훨씬 앞에서 끝났다는 사실**을 확인하는 것이 목적입니다.

**왜 이렇게 푸는가**

- **`epochs=100`을 지시받았지만 실제로는 23에서 끝났습니다.** `EarlyStopping`이 `val_loss`가 5 epoch 연속 개선되지 않는 것을 보고 멈춘 것입니다. **"지시한 epochs는 상한이고, 실제 학습 길이는 콜백이 정한다"** 는 것이 이 문항의 핵심이며, `len(history.history['loss'])`가 그 증거입니다.
- **`restore_best_weights=True`가 채점 포인트**입니다. 이 옵션이 없으면 "가장 나빠진 마지막 시점"의 가중치로 평가하게 됩니다. 멈추는 시점은 최적점보다 `patience`만큼 뒤이므로, **복원 옵션 없이 멈추면 일부러 과적합된 모델을 제출하는 셈**입니다.
- **`callbacks=[es]`** — 리스트로 감싸야 합니다. `callbacks=es`로 쓰면 오류가 나거나 무시됩니다. 콜백을 만들어 놓고 `fit`에 전달하지 않는 실수도 흔한데, 이때는 오류 없이 100 epoch를 전부 돌아 버려 **"왜 멈추지 않지"** 하고 시간을 잃습니다.
- `validation_split=0.2`는 **학습 데이터의 뒤쪽 20%** 를 검증용으로 떼어 씁니다(3200 → 학습 2560 / 검증 640). `EarlyStopping`이 관찰하는 `val_loss`가 여기서 나오므로, **검증 데이터 없이는 `val_loss`가 존재하지 않아** 콜백이 동작하지 않습니다.
- **`history` 키 4개를 확인하는 습관**을 들이십시오. 분류이므로 `accuracy`·`val_accuracy`가 있습니다. 회귀로 바꾸면 이 이름이 `mae`·`val_mae`로 달라집니다(R2에서 확인합니다). **키 이름을 확인하지 않고 그래프 코드를 복사하면 `KeyError`** 가 납니다.
- 학습 곡선을 읽는 법: 검증 loss가 내려가다 **평평해지거나 다시 올라가는 지점**이 과적합 시작점입니다. EarlyStopping이 멈춘 위치가 대체로 그 근처여야 정상입니다.

**자주 틀리는 지점**

- **`monitor='val_loss'`인데 `validation_split`(또는 `validation_data`)을 주지 않는 것.** 관찰 대상이 없어 콜백이 작동하지 않고 경고만 나옵니다.
- **`patience`를 1처럼 너무 작게 두는 것.** loss는 오르내리며 내려가므로 진짜 최적점 전에 멈춰 버립니다. 문항이 지시한 값(여기서는 5)을 그대로 쓰십시오.
- **`verbose=0`으로 학습 로그를 끈 채, "실제 epoch 수"까지 출력하지 않는 것.** 문항이 요구한 출력이 사라집니다. `verbose`를 0으로 두든 1로 두든 상관없지만, **`len(history.history['loss'])` 한 줄은 반드시 남기십시오.** 화면 로그는 채점 대상이 아니라 이 출력이 근거입니다.
- 학습 결과를 `history`에 받지 않고 `model.fit(...)` 만 호출하는 것. 학습 곡선을 그릴 재료가 사라집니다.
- (환경 이슈) 학습 셀에서 **아무 출력도 없이 멈추는** 경우 — 코드 잘못이 아니라 **import 순서** 문제입니다. 이 문서 앞의 "로컬 환경 주의"대로 커널을 재시작하고, **데이터 생성 블록과 공통 import 블록 양쪽** 첫 줄이 `import tensorflow as tf`인 상태에서 처음부터 다시 실행하십시오. 타깃을 `to_numpy()`로 바꾸는 것은 이 증상과 무관합니다.

---

### Q12 해답 — 평가와 클래스별 성능 해석 [12점]

**정답 코드**

```python
# 1) 평가
loss, acc = model.evaluate(X_test_scaled, y_test, verbose=0)
print('test loss:', round(loss, 4), '/ test accuracy:', round(acc, 4))

# 2) 예측 확률
pred = model.predict(X_test_scaled, verbose=0)
print('pred shape:', pred.shape, '/ 첫 행의 합:', pred[0].sum().round(3))

# 3) 확률 → 클래스 (다중분류는 argmax, 축은 1)
y_pred = np.argmax(pred, axis=1)
print('y_pred 앞 10개:', y_pred[:10])

# 4) 지표
print(classification_report(y_test, y_pred, digits=3))
print(confusion_matrix(y_test, y_pred))

# 5) 해석
# 클래스 2(과열)의 f1이 0.669로 가장 낮다. 표본이 122개뿐인 소수 클래스이고,
# 온도·전류 외 센서는 클래스 0과 겹쳐 경계가 흐리기 때문으로 보인다.
# 혼동 행렬에서 가장 많이 헷갈린 쌍은 실제 1 → 예측 0(50건)과 실제 0 → 예측 1(39건)이다.
```

실행 결과입니다.

```
test loss: 0.5385 / test accuracy: 0.7862
pred shape: (800, 3) / 첫 행의 합: 1.0
y_pred 앞 10개: [0 0 2 0 0 0 0 0 0 1]

              precision    recall  f1-score   support
           0      0.848     0.868     0.858       484
           1      0.704     0.649     0.676       194
           2      0.659     0.680     0.669       122
    accuracy                          0.786       800
   macro avg      0.737     0.733     0.734       800
weighted avg      0.784     0.786     0.785       800

[[420  39  25]
 [ 50 126  18]
 [ 25  14  83]]
```

**왜 이렇게 푸는가**

- **`pred.shape`가 `(800, 3)`** 입니다. 이진분류의 `(800, 1)`과 다릅니다. 샘플마다 **클래스 개수만큼의 확률**이 나오고, 첫 행의 합이 **1.0** 인 것이 softmax가 제대로 걸렸다는 증거입니다. 이 두 값을 출력하라고 한 이유가 여기에 있습니다.
- **`np.argmax(pred, axis=1)`** — "각 행에서 가장 큰 값의 **위치(인덱스)**"를 고릅니다. 클래스 번호가 0/1/2이므로 인덱스가 곧 예측 클래스입니다. **`axis=1`(행 방향)** 이 핵심입니다.
- **혼동 행렬을 읽는 법** (행 = 실제, 열 = 예측):

  | | 예측 0 | 예측 1 | 예측 2 |
  |---|---|---|---|
  | **실제 0 (정상, 484)** | **420** | 39 | 25 |
  | **실제 1 (마모, 194)** | **50** | **126** | 18 |
  | **실제 2 (과열, 122)** | 25 | 14 | **83** |

  대각선(420 / 126 / 83)이 맞힌 것이고 나머지가 틀린 것입니다. 가장 큰 오분류는 **실제 1을 0으로 예측한 50건** — 마모 불량을 정상으로 놓친 경우로, 현장에서는 가장 값비싼 실수입니다.
- **클래스별 성능 차이가 이 문항의 결론입니다.** f1이 0.858(정상) → 0.676(마모) → 0.669(과열) 순으로 낮아집니다. 이유는 두 가지입니다.
  1. **표본 수 차이** — support 484 / 194 / 122. 학습 기회 자체가 적습니다.
  2. **특성 겹침** — Q2에서 확인했듯 클래스 1의 단서는 `vibration`, 클래스 2는 `temp`·`current` 하나뿐이고 나머지 센서는 클래스 0과 겹칩니다. `humidity`처럼 정보가 없는 컬럼도 있습니다.
- **`macro avg`(0.734)와 `weighted avg`(0.785)의 차이**를 보십시오. macro는 세 클래스를 동등하게, weighted는 표본 수로 가중해 평균합니다. **둘의 격차가 클수록 "소수 클래스에서 약하다"는 뜻**입니다.
- 세 기준선과 비교하는 것으로 마무리합니다. 무조건 0 예측 **0.605** < 랜덤 포레스트 **0.7863** ≒ 딥러닝 **0.7862**. 즉 **이 데이터에서 딥러닝은 랜덤 포레스트를 이기지 못했습니다.** 이것이 정직한 결론이며, 시험에서도 "딥러닝이 무조건 낫다"고 쓸 필요는 없습니다. 표 형태 데이터에서 트리 계열이 강한 것은 흔한 결과입니다.

**자주 틀리는 지점**

- **확률 `pred`를 그대로 `classification_report`에 넣는 것.**

  ```
  ValueError: Classification metrics can't handle a mix of multiclass and continuous-multioutput targets
  ```

  `argmax` 변환 한 줄을 반드시 거치십시오.
- **이진분류 방식인 `(pred > 0.5).astype(int)`를 쓰는 것.** `(800, 3)` 배열에 임계값을 걸면 0/1로 채워진 **3열 배열**이 나와 지표 계산이 깨집니다. 다중분류는 `argmax`입니다.
- **`axis`를 빼거나 `axis=0`으로 쓰는 것.** `np.argmax(pred)` 는 전체에서 최댓값 위치 **하나**를 반환하고, `axis=0`은 **열 방향**으로 계산해 길이 3의 배열이 나옵니다. 둘 다 `y_test`와 길이가 맞지 않아 오류가 납니다. **행마다 하나씩 → `axis=1`.**
- **`evaluate` 반환값을 하나로 받는 것.** `acc = model.evaluate(...)` 로 쓰면 `acc`에 `[loss, accuracy]` 리스트가 통째로 들어갑니다.
- **accuracy만 출력하고 끝내는 것.** 이 문항은 클래스별 성능 해석까지 요구합니다. 불균형 다중분류에서는 `classification_report`와 혼동 행렬이 함께 있어야 답안이 완성됩니다.

---

### R1 해답 — 타깃 교체와 데이터 준비 [10점]

**정답 코드**

```python
y_reg = df['rul_days'].to_numpy()                       # 타깃 교체
X_r = df.drop(columns=['defect_type', 'rul_days'])      # 특성 구성은 본편과 동일 (본편 X는 그대로 보존)

print('y_reg 앞 5개:', y_reg[:5], '/ dtype:', y_reg.dtype)
print('평균:', round(y_reg.mean(), 2), '/ 최소:', y_reg.min(), '/ 최대:', y_reg.max())

# stratify는 쓸 수 없다: 타깃이 연속값이라 같은 값이 1개뿐인 '계층'이 생겨 분리가 불가능하다.
X_train_r, X_test_r, y_train_r, y_test_r = train_test_split(
    X_r, y_reg, test_size=0.2, random_state=42)

scaler_r = MinMaxScaler()
X_train_r_scaled = scaler_r.fit_transform(X_train_r)
X_test_r_scaled = scaler_r.transform(X_test_r)
print('X_train_r:', X_train_r_scaled.shape, '/ X_test_r:', X_test_r_scaled.shape)
```

실행 결과입니다.

```
y_reg 앞 5개: [129.  164.1 184.1 124.6 221.1] / dtype: float64
평균: 183.08 / 최소: 64.4 / 최대: 304.1
X_train_r: (3200, 12) / X_test_r: (800, 12)
```

**왜 이렇게 푸는가**

- **타깃을 보고 유형을 판정하는 훈련이 이 문항의 목적입니다.** `y_reg`가 `129.0`, `164.1`처럼 **실수이고 값의 종류가 사실상 무한**합니다. `value_counts()`를 찍어 봐야 의미가 없습니다. **dtype이 `float64`이고 값이 연속적이면 회귀**입니다. 반대로 본편의 `defect_type`은 정수 3종이었으므로 분류였습니다.
- **`stratify`를 쓸 수 없습니다.** 넣으면 다음 오류가 납니다.

  ```
  ValueError: The least populated classes in y have only 1 member, which is too few...
  ```

  `stratify`는 "각 클래스 비율을 유지"하는 옵션인데, 연속값은 거의 모든 값이 유일해서 **클래스당 표본 1개**가 됩니다. 나눌 수가 없습니다. **회귀에서는 `stratify`를 지웁니다** — 이것이 회귀 전환 시 놓치기 쉬운 첫 번째 지점입니다.
- **전처리는 그대로 재사용합니다.** 이상치 클리핑(Q3), 결측 평균 대체(Q4), 원-핫 인코딩(Q5), MinMax 스케일링 — 전부 **타깃 유형과 무관한 작업**입니다. 유형이 바뀌어도 전처리 파이프라인은 대개 그대로 갑니다. 바뀌는 곳은 **타깃, 출력층, loss, 지표** 네 군데뿐입니다.
- **특성에서 `defect_type`도 제외한 이유**: 불량 유형은 잔여 수명과 같은 원인에서 나온 결과 지표이므로, 넣으면 또 다른 누수가 됩니다(설비 상태를 미리 알 수 없는 예측 시점을 가정합니다). 특성 개수는 본편과 동일하게 **12개**입니다.
- 타깃 범위(64.4 ~ 304.1, 평균 183.08)를 미리 출력해 두면 R3에서 **"mae 10.5가 큰 오차인가"** 를 판단할 기준이 생깁니다. 회귀 지표는 **타깃의 스케일과 함께 읽어야** 의미가 있습니다.

**자주 틀리는 지점**

- **`stratify=y_reg`를 그대로 복사해 오는 것** — 회귀 전환 최다 오류입니다. 위 `ValueError`를 만나면 `stratify`를 지우십시오.
- **타깃을 스케일링하는 것.** 문항이 지시하지 않았습니다. 타깃을 0~1로 바꾸면 mae·rmse가 원래 단위(일)가 아니라 **해석 불가능한 값**이 되어 R3의 서술이 무너집니다.
- **`rul_days`를 특성에서 빼는 것을 잊는 것.** 타깃이 특성에 들어가면 r2가 1.000에 붙습니다. **r2가 0.99를 넘으면 누수를 의심**하십시오.
- 본편 변수(`X`, `X_train`, `y_train`)를 덮어써 버리는 것. 특성 구성이 같더라도 **`X_r`처럼 새 이름에 담으십시오.** `_r` 접미어를 지시한 이유는 본편 결과를 잃지 않고 **두 세트를 나란히 비교**하기 위해서입니다. 본편 `X`를 덮어쓰면 Q6~Q12를 다시 실행할 때 무엇이 들어 있는지 알 수 없게 됩니다.

---

### R2 해답 — 회귀 딥러닝 모델 구성·컴파일·학습 [12점]

**정답 코드**

```python
model_r = Sequential()
model_r.add(Input(shape=(X_train_r_scaled.shape[1],)))
model_r.add(Dense(64, activation='relu'))
model_r.add(Dropout(0.2))
model_r.add(Dense(32, activation='relu'))
model_r.add(Dense(1))                       # 교체 (1) 노드 1개, 활성화 함수 없음
model_r.compile(optimizer='adam',
                loss='mse',                 # 교체 (2) 회귀 손실
                metrics=['mae'])            # 교체 (3) accuracy 아님
model_r.summary()

es_r = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
history_r = model_r.fit(X_train_r_scaled, y_train_r,
                        epochs=200, batch_size=32,
                        validation_split=0.2,
                        callbacks=[es_r], verbose=0)

print('실제 학습 epoch 수:', len(history_r.history['loss']))
print('history_r 키:', list(history_r.history.keys()))

h = history_r.history
plt.figure(figsize=(10, 4))
plt.subplot(1, 2, 1)
plt.plot(h['loss'], label='train'); plt.plot(h['val_loss'], label='val')
plt.title('loss (mse)'); plt.legend()
plt.subplot(1, 2, 2)
plt.plot(h['mae'], label='train'); plt.plot(h['val_mae'], label='val')
plt.title('mae'); plt.legend()          # accuracy가 아니라 mae
plt.show()
```

실행 결과 요지입니다.

```
 Layer (type)              Output Shape        Param #
 dense (Dense)             (None, 64)              832
 dropout (Dropout)         (None, 64)                0
 dense_1 (Dense)           (None, 32)            2,080
 dense_2 (Dense)           (None, 1)                33
 Total params: 2,945

실제 학습 epoch 수: 85
history_r 키: ['loss', 'mae', 'val_loss', 'val_mae']
```

> 학습 길이는 실행마다 크게 달라집니다. 검증 환경의 두 차례 실행에서 각각 **85 / 118 epoch**에 멈췄습니다(대략 **70~130 범위**). 중요한 것은 숫자 자체가 아니라 **지시한 상한 200보다 앞에서 끝났다는 사실** — `EarlyStopping`이 동작했다는 증거입니다.
> 본편 Q11(20~47)보다 훨씬 길게 도는 이유는 `patience`가 5에서 **10으로 커졌고**, 회귀의 `val_loss`(mse)가 더 늦게까지 조금씩 개선되기 때문입니다.

**왜 이렇게 푸는가**

- **바뀌는 곳은 정확히 세 줄입니다.** 은닉층은 본편과 똑같습니다.

  | 위치 | 다중분류 | 회귀 |
  |---|---|---|
  | 출력층 | `Dense(3, activation='softmax')` | **`Dense(1)`** — 활성화 인자 없음 |
  | loss | `sparse_categorical_crossentropy` | **`mse`** |
  | metrics | `['accuracy']` | **`['mae']`** |

- **출력층에 활성화 함수를 쓰지 않는 이유**가 이 문항의 핵심입니다. 회귀는 **범위가 정해지지 않은 실수 하나**를 그대로 내보내야 합니다. 여기에 `sigmoid`를 붙이면 출력이 0~1로 눌려, 타깃이 64~304인 이 데이터에서는 **예측이 영원히 1을 넘지 못하고 r2가 크게 음수**가 됩니다. `softmax`를 붙이면 노드가 1개이므로 **항상 1.0**만 나옵니다. 둘 다 오류 메시지가 없어서 발견이 늦습니다.
- **`mse`는 loss, `mae`는 metrics** 로 역할이 다릅니다. mse는 오차를 제곱해 큰 오차에 강한 벌점을 주므로 **학습 신호**로 적합하고, mae는 "평균 몇 일 틀렸나"를 그대로 보여 주므로 **사람이 읽는 지표**로 적합합니다. 둘을 바꿔 넣어도 학습은 되지만, 지시된 조합을 쓰십시오.
- **`history_r`의 키가 `['loss', 'mae', 'val_loss', 'val_mae']`** 입니다. `accuracy`가 **없습니다.** 본편의 곡선 코드를 그대로 복사하면 `KeyError: 'accuracy'`가 납니다. `print(history_r.history.keys())`를 먼저 찍는 습관이 여기서 값을 합니다.
- `patience=10`이 본편(5)보다 큰 이유는, 회귀의 `val_loss`(mse)가 값이 크고 출렁임도 커서 **성급하게 멈추기 쉽기** 때문입니다. 문항이 값을 지시했으므로 그대로 씁니다.
- 파라미터 검산: 출력층이 `32×1+1 = 33`. 분류(99)보다 작습니다. **출력 노드 수만 3 → 1로 바뀐 결과**입니다.

**자주 틀리는 지점**

- **`Dense(1, activation='sigmoid')`** — 회귀 최다 오류입니다. 활성화 인자 자체를 적지 않습니다.
- **loss만 `mse`로 바꾸고 출력층을 `Dense(3,'softmax')`로 남겨 두는 것.** "유형을 바꿀 때 한 곳만 고치는" 대표적 사고입니다. **출력층·loss·metrics·예측 변환 네 곳을 세트로** 점검하십시오.
- **`metrics=['accuracy']`를 남겨 두는 것.** 연속값에 정확도는 정의되지 않아 항상 0에 가까운 무의미한 값이 찍힙니다. 오류가 아니라 **조용한 무의미**라서 더 위험합니다.
- 학습 곡선에서 `h['accuracy']`를 참조하는 것 → `KeyError`.

---

### R3 해답 — 회귀 평가와 해석 [8점]

**정답 코드**

```python
# 1) keras 평가 (loss=mse, metrics=mae)
loss_r, mae_keras = model_r.evaluate(X_test_r_scaled, y_test_r, verbose=0)
print('keras mse:', round(loss_r, 2), '/ keras mae:', round(mae_keras, 2))

# 2) 예측 — 1차원으로 정리
y_pred_r = model_r.predict(X_test_r_scaled, verbose=0).flatten()

# 3) sklearn 지표
mse = mean_squared_error(y_test_r, y_pred_r)
print('mse :', round(mse, 2))
print('rmse:', round(np.sqrt(mse), 2))
print('mae :', round(mean_absolute_error(y_test_r, y_pred_r), 2))
print('r2  :', round(r2_score(y_test_r, y_pred_r), 4))

# 4) 비교 기준 — 학습 데이터 평균만 답하는 모델
base = np.full(len(y_test_r), y_train_r.mean())     # 모든 샘플에 평균값 하나만 답한 경우
print('평균 예측 baseline mae:', round(mean_absolute_error(y_test_r, base), 2),
      '/ r2:', round(r2_score(y_test_r, base), 4))

# 5) 해석
# mae 10.54일 → 잔여 수명 예측이 평균 약 10일 오차. 타깃 범위(64~304일, 표준편차 37.9)에
# 비하면 작고, 평균만 답하는 기준선(mae 30.58 / r2 -0.00)을 크게 앞선다. r2 0.879는
# 타깃 분산의 약 88%를 설명한다는 뜻이므로 이 모델은 실용 후보로 볼 수 있다.
```

실행 결과입니다.

```
keras mse: 174.02 / keras mae: 10.54
mse : 174.02
rmse: 13.19
mae : 10.54
r2  : 0.8789
평균 예측 baseline mae: 30.58 / r2: -0.0019
```

**왜 이렇게 푸는가**

- **`.flatten()`이 필요한 이유**: `predict`는 `(800, 1)` 2차원 배열을 반환하는데 `y_test_r`은 `(800,)` 1차원입니다. sklearn 지표는 `(N,1)`도 받아 주지만, 형태를 맞춰 두면 이후 계산에서 헷갈릴 일이 없습니다. **분류의 `argmax` 자리에 회귀에서는 `flatten`이 들어간다**고 기억하십시오.
- **세 지표를 읽는 법**이 이 문항의 전부입니다.

  | 지표 | 값 | 읽는 법 |
  |---|---|---|
  | `mae` | **10.54** | 평균 절대 오차. **"평균 10.5일 틀린다"** — 단위가 타깃과 같아 가장 직관적 |
  | `mse` / `rmse` | 174.02 / **13.19** | mse는 제곱 단위라 해석이 어렵고, **rmse(13.19일)** 가 사람이 읽을 수 있는 형태. rmse > mae 이면 **큰 오차가 일부 섞여 있다**는 신호 |
  | `r2` | **0.8789** | 타깃 분산의 **약 88%를 설명**. 1에 가까울수록 좋고, **0이면 평균만 답한 수준, 음수면 그보다도 못한 상태** |

- **`mae`는 반드시 타깃의 스케일과 함께 판단합니다.** mae 10.54가 큰지 작은지는 값만으로 알 수 없습니다. 타깃 범위가 **64~304일, 표준편차 37.9일** 이므로 10.5일은 작은 편입니다. 만약 타깃이 0~1 범위였다면 mae 10.5는 참담한 성능입니다.
- **4번의 비교 기준이 결론을 만듭니다.** "학습 데이터 평균(약 183일)을 모든 샘플에 그대로 답하는" 모델은 mae **30.58**, r2 **−0.0019** 입니다. r2가 0 근처라는 점을 확인하십시오 — **r2 = 0의 의미가 바로 "평균만 답한 수준"** 입니다. 우리 모델은 mae를 30.58 → 10.54로 3분의 1로 줄였으므로 **분명한 개선**입니다. 회귀 문항에서 "성능이 좋은가"를 묻는다면 이런 기준선과의 비교로 답하는 것이 가장 안전합니다.
- `evaluate`의 반환값이 **`[loss, mae]` 두 개**입니다(compile의 metrics 개수에 따라 달라집니다). sklearn으로 다시 계산한 mse·mae와 값이 일치하는지 대조하면 계산 실수를 잡을 수 있습니다.

**자주 틀리는 지점**

- **`classification_report`나 `confusion_matrix`, `argmax`를 쓰는 것.** 연속값에는 정밀도·재현율·클래스 개념이 없습니다. 실행하면 다음과 같이 거부됩니다.

  ```
  ValueError: continuous is not supported
  ```

  회귀 지표는 **mse / rmse / mae / r2** 넷입니다.
- **`accuracy_score`를 시도하는 것.** 같은 이유로 오류입니다.
- **r2가 음수인데 "0에 가까우니 괜찮다"고 쓰는 것.** 음수 r2는 **평균만 답하는 것보다 못하다**는 뜻으로, 대개 출력층에 활성화 함수를 잘못 붙였거나 타깃 스케일이 어긋난 신호입니다. 원인을 R2의 출력층부터 되짚으십시오.
- `mean_squared_error(..., squared=False)`로 rmse를 구하려는 것. 이 인수는 최신 sklearn에서 제거되었습니다. **`np.sqrt(mse)`** 가 버전에 무관하게 안전합니다.
- 지표 인수 순서를 `(예측, 정답)`으로 넣는 것. mse·mae는 값이 같아 넘어가지만 **r2는 값이 달라집니다.** 항상 **(정답, 예측)** 입니다.

---

## 채점표

**본편 (100점)**

| Q | 단계 | 배점 | 핵심 채점 요소 |
|---|------|------|----------------|
| 1 | 로딩·탐색 | 5 | `read_csv` / `shape`·`head`·`info` / `value_counts` **개수 + 비율** |
| 2 | 시각화 | 7 | `boxplot`(x=`defect_type`) / `histplot`의 **`hue='defect_type'`** / 클래스별 평균 표 |
| 3 | 이상치 | 8 | Q1·Q3·IQR 계산 / 경계 ±1.5×IQR / **`clip()`으로 경계값 대체** / **재대입** / 전후 최댓값 출력 |
| 4 | 결측 처리 | 6 | `mean()` 사용 / **지정 컬럼만** / 재대입 / 처리 후 0 확인 |
| 5 | 인코딩 | 8 | `get_dummies` / `columns` 명시 / **`dtype=int`** / **타깃은 인코딩하지 않음** |
| 6 | 분리 | 8 | **`rul_days` 제외** / `to_numpy()` / `test_size=0.2` / `random_state=42` / **`stratify=y`** |
| 7 | 스케일링 | 7 | `MinMaxScaler` / train `fit_transform` / test **`transform`만** |
| 8 | 머신러닝 | 8 | `rf_model` 이름 / `n_estimators=100`·`random_state=42` / report·혼동행렬 / 무조건 0 예측 기준선 |
| 9 | DL 구성 | 12 | `Input(shape=(12,))` / 은닉층 2개 이상 + `Dropout` / **`Dense(3,'softmax')`** / 클래스 수를 코드로 계산 |
| 10 | 컴파일 | 8 | 라벨 형태 확인 출력 / **`sparse_categorical_crossentropy`** / `metrics=['accuracy']` / 선택 근거 서술 |
| 11 | 학습 | 11 | `epochs=100`·`batch_size=32` / `validation_split=0.2` / **`restore_best_weights=True`** / `callbacks=[es]` / 실제 epoch 수 + 학습 곡선 |
| 12 | 평가 | 12 | `evaluate` / `pred.shape`·행 합 확인 / **`np.argmax(pred, axis=1)`** / report·**3×3 혼동행렬** / **클래스별 성능 해석** |
| — | **합계** | **100** | — |

**회귀 확장 (30점, 별도 집계)**

| Q | 단계 | 배점 | 핵심 채점 요소 |
|---|------|------|----------------|
| R1 | 타깃 교체 | 10 | `rul_days`로 타깃 교체 / 특성에서 두 타깃 모두 제외 / **`stratify` 제거 + 이유 서술** / `scaler_r` 재적용 |
| R2 | 회귀 모델 | 12 | **`Dense(1)` 활성화 없음** / **`loss='mse'`** / **`metrics=['mae']`** / `patience=10` / **`history_r` 키 확인 후 곡선** |
| R3 | 회귀 평가 | 8 | `.flatten()` / mse·**rmse**·mae·r2 / **평균 예측 기준선 비교** / 타깃 스케일과 함께 해석 |
| — | **합계** | **30** | — |

> 배점은 **교재 자체 기준**입니다. 실제 시험의 배점 체계는 공개되어 있지 않으므로 학습 우선순위를 정하는 참고용으로만 사용하십시오.

---

## 이 회차에서 반드시 가져갈 것

| 지점 | 기억할 것 |
|------|-----------|
| 유형 판정 | 타깃 `value_counts()`가 **3줄 + 정수** → 다중분류 / **float 연속값** → 회귀 |
| 다중분류 3종 세트 | `Dense(K,'softmax')` ↔ **정수 라벨이면 `sparse_`** ↔ `np.argmax(pred, axis=1)` |
| loss 갈림길 | 출력층은 정수·원-핫 모두 `Dense(K,'softmax')`로 **같다.** 바뀌는 것은 **loss 이름뿐** |
| 이상치 순서 | **이상치 처리 → 스케일링.** 순서가 뒤집히면 이상치가 스케일 기준이 되어 정상 값이 뭉갠다 |
| 전처리 순서 | **인코딩은 분리 전, 스케일링은 분리 후** |
| 재대입 | `clip`·`fillna`·`get_dummies`는 **새 객체를 반환** — `df = df.…` |
| 누수 컬럼 | 타깃과 같은 사건을 기록한 컬럼(`rul_days`)은 **특성에서 제거.** r2 0.99↑, 정확도 0.99↑는 누수 신호 |
| 타깃 자료형 | `y`는 **`to_numpy()`** 로 — 뒤 문항의 `bincount`·`argmax` 연산과 형태를 통일하기 위함 |
| 유형 교체 4곳 | **출력층 / loss / metrics / 예측 변환** — 언제나 네 곳을 세트로 바꾼다 |
| 회귀 함정 | 출력층 **활성화 없음** / `stratify` 삭제 / `history` 키는 `mae`·`val_mae` / `classification_report` 금지 |
| 성능 해석 | 딥러닝 `0.7862` vs 랜덤 포레스트 `0.7863` vs 무조건 0 예측 `0.605` — **기준선 없이 좋은 성능은 판단할 수 없다** |

**한 문장으로:** 이 회차는 **"타깃을 보고 네 곳을 바꾸는 반사 신경"** 을 시험합니다. 클래스가 3개면 출력층 3 + `softmax` + `sparse_` + `argmax`, 타깃이 연속값이면 `Dense(1)` + `mse` + `mae` + `flatten` — 이 두 세트가 손에 붙으면 어떤 데이터가 나와도 30분 안에 모델링을 끝낼 수 있습니다.

---

<!--
verified: 2026-07-30
환경: Python 3.13.5 / numpy · pandas · scikit-learn 1.9.0 / matplotlib(Agg) / seaborn / TensorFlow 2.21.0 (Keras 3), macOS CPU
실행 방식: 데이터 생성 코드 + Q1~Q12 + R1~R3 해답 전량을 3단계로 분할 실행. 세 단계 모두 EXIT=0.
  Stage A(Q1~Q8, TF 미사용) / Stage B(Q9~Q12, TF) / Stage C(R1~R3, TF)
  Stage B·C는 개별 실행 120초 이내를 지키기 위해 학습 epochs를 조정했다(아래 조건 병기).
  Stage A·B는 캐시(.npy)로 전처리 결과를 전달, Stage C는 Q5까지 전처리된 CSV를 이어받아 실행.

[Stage A 검증 결과 — 결정적(deterministic), 재실행 시 동일]
  Q1  df.shape == (4000, 10) / info() Non-Null: pressure 3840 (결측 160)
      defect_type 0=2421 / 1=968 / 2=611 → 비율 0.605 / 0.242 / 0.153 (3배 이상 불균형)
      dtype: defect_type int64(정수 라벨 확정), line_id·shift str
  Q2  boxplot·histplot 2건 정상 저장. 클래스별 평균(정상/마모/과열):
      temp 70.33 / 71.96 / 79.68, vibration 3.78 / 5.80 / 4.74, pressure 5.01 / 4.78 / 4.46,
      rpm 1504.23 / 1461.87 / 1487.41, current 11.98 / 12.46 / 13.51,
      humidity 44.77 / 45.22 / 45.10 (→ 정보 없는 컬럼임을 수치로 확인)
  Q3  vibration Q1=2.7 / Q3=4.74 / IQR=2.04 → 하한 -0.37 / 상한 7.8
      상한 초과 54건(주입 40건 + 정상 범위 큰 값 14건), 처리 전 최대 93.51 → clip 후 7.8
  Q4  pressure 결측 160건, 평균 4.872 → fillna 후 df.isnull().sum().sum() == 0
  Q5  get_dummies(dtype=int) 후 shape (4000, 14), 더미 6개(line_id_L1~L3, shift_A~C) 생성, 타깃 미변형
  Q6  X (4000, 12) / y (4000,) int64 (rul_days·defect_type 제외 검산 14-2=12)
      X_train (3200, 12) / X_test (800, 12)
      stratify=y 적용 시 y_train [0.605 0.242 0.153] / y_test [0.605 0.242 0.152]
  Q7  MinMaxScaler: X_train_scaled min/max 0.0 / 1.0, X_test_scaled min/max -0.007 / 1.0
      (해설의 "test가 0~1을 벗어나는 것이 정상" 주장 실측 확인)
  Q8  RandomForest accuracy 0.7863
      클래스별 f1 0(정상) 0.859 / 1(마모) 0.672 / 2(과열) 0.653, macro f1 0.728
      confusion_matrix [[430 33 21] [56 122 16] [31 14 77]]
      무조건 0 예측 accuracy 0.605

[Stage B 검증 결과 — 게재 수치는 아래 '실행 2'의 값]
  실행 조건: 문제지 지시대로 epochs=100 / batch_size=32 / validation_split=0.2 / EarlyStopping(patience=5,
  restore_best_weights=True). EarlyStopping이 조기 종료시켜 실측 소요 약 10초(120초 이내). epochs 축소 불필요.
  Q9  n_classes = len(np.unique(y_train)) == 3, 출력층 Output Shape (None, 3)
      Total params 3,011 (832 + 0 + 2,080 + 99) — 해설 검산과 일치
  Q10 y_train[:10] == [0 2 0 0 0 2 2 2 0 1], dtype int64 → sparse_categorical_crossentropy 선택 근거 확인
      model.loss == 'sparse_categorical_crossentropy'
  Q11 history 키 ['accuracy', 'loss', 'val_accuracy', 'val_loss'] / 학습 곡선 2분할 정상 저장
      실제 학습 epoch: 실행 1 = 20, 실행 2 = 23, 무전제 통합 실행 = 47
      (Dropout·스레드 스케줄링 영향으로 실행마다 20~47 범위 변동. 게재 본문에 이 대역을 병기했다.)
  Q12 (실행 2, 게재값) test loss 0.5385 / test accuracy 0.7862
      pred.shape (800, 3), pred[0].sum() == 1.0, y_pred[:10] == [0 0 2 0 0 0 0 0 0 1]
      f1 0=0.858 / 1=0.676 / 2=0.669, macro avg f1 0.734 / weighted avg f1 0.785
      confusion_matrix [[420 39 25] [50 126 18] [25 14 83]]
      (실행 1 대조: accuracy 0.7862, f1 0.857 / 0.679 / 0.672, cm [[418 42 24] [48 128 18] [26 13 83]]
       → 소수 3째 자리만 변동, 클래스별 대소 관계(0 > 1 ≒ 2)는 동일하게 재현)
      해석 근거 확인: 딥러닝 0.7862 ≒ RF 0.7863 > 무조건 0 예측 0.605

[Stage C 검증 결과 — 회귀 확장]
  실행 조건: **문제지 지시 그대로 epochs=200 / patience=10** (축소 없음).
  최초 검증은 시간 제약으로 epochs=60 상한을 걸었으나, 그 값(60)은 EarlyStopping이 아니라 인위적 상한이어서
  R2가 가르치는 교훈("실제 학습 길이는 콜백이 정한다")과 모순됐다 → QA 지적(H-3)에 따라 축소 조건을 폐기하고
  지시값 그대로 재측정했다. 본문 게재값과 아래 수치는 모두 **무축소 실행**의 결과다.
  R1  y_reg[:5] == [129.0 164.1 184.1 124.6 221.1], dtype float64 (→ 회귀 유형 판정 근거)
      평균 183.08 / 최소 64.4 / 최대 304.1, y_test_r 표준편차 37.91
      X_train_r (3200, 12) / X_test_r (800, 12)
      (반례 검증) stratify=y_reg → ValueError: The least populated classes in y have only 1 member,
      which is too few. — 해설에 인용한 메시지 실측 확인
  R2  출력층 Dense(1) 활성화 없음, Total params 2,945 (출력층 33 = 32×1+1)
      history_r 키 ['loss', 'mae', 'val_loss', 'val_mae'] — accuracy 없음(해설 주장 확인)
      실제 학습 epoch: 실행 A = 85(게재값), 무전제 통합 실행 = 118 → EarlyStopping이 상한 200 앞에서 종료.
      실행마다 70~130 범위로 변동하며, 본문에 이 대역을 병기했다.
  R3  keras mse 174.02 / keras mae 10.54 (sklearn 재계산치와 일치)
      mse 174.02 / rmse 13.19 / mae 10.54 / r2 0.8789
      평균 예측 기준선: mae 30.58 / r2 -0.0019 (→ "r2=0은 평균만 답한 수준" 실측 확인)
      y_pred_r.shape (800,) — .flatten() 적용 확인

[게재 수치 판독 조건]
  - Stage A·R1의 모든 수치는 rng seed 42 고정으로 결정적. 독자 재현 시 동일해야 한다.
  - Stage B·C의 학습 결과(epoch 수, loss, accuracy, r2)는 실행 환경·난수에 따라 변동한다.
    게재값은 검증 실행의 실측치이며, 해설은 "값의 자릿수와 대소 관계"로 판단하도록 안내했다.
    epoch 수는 변동 폭이 커서(Q11 20~47 / R2 70~130) 본문에 대역을 병기했다.
  - 게재 수치에 인위적 축소 조건은 남아 있지 않다. 모든 게재값은 문제지 지시값 그대로의 실행 결과다.

[최종 통합 검증 — 무전제(無前提) 순차 실행 / 2026-07-31 재검증]
  검증 하네스가 한 일: (1) 이 문서에서 ```python 블록 17개를 순서대로 추출, (2) 하나의 네임스페이스에서
  위에서 아래로 exec, (3) 창 표시 방지를 위한 환경변수 MPLBACKEND=Agg 지정.
  검증 하네스가 하지 않은 일(= 전제 없음): **tensorflow 선 import 없음**(인쇄된 코드의 첫 줄이 스스로 책임),
  **fit epochs 상한 패치 없음**(Q11 epochs=100 / R2 epochs=200 지시값 그대로), 코드 수정·치환 없음.
  결과: **17/17 블록 EXIT=0, 실패 0, 총 22.1초.** 학습 블록 정지(C-1) 재발 없음.
    (C-1 수정 전 동일 하네스에서는 Q11 해답 블록이 무한 정지했다 — 수정 효과를 실측으로 확인)
  이 실행의 실측치:
    결정적 수치 — 게재값과 완전 일치: (4000, 10) / vibration Q1 2.7·Q3 4.74·IQR 2.04 / 하한 -0.37·상한 7.8 /
      처리 후 최대 7.8 / 결측 0 / (4000, 14) / X (4000, 12) / y_train 비율 [0.605 0.242 0.153] /
      train min·max 0.0·1.0, test min·max -0.007·1.0 / RF accuracy 0.7863 / 무조건 0 예측 0.605 /
      클래스 수 3 / loss 'sparse_categorical_crossentropy' / X_train_r (3200, 12)·X_test_r (800, 12) /
      평균 예측 기준선 mae 30.58 · r2 -0.0019
    학습 의존 수치 — 게재값 대비 허용 대역 내: Q11 epoch 47 / Q12 test loss 0.5394 · accuracy 0.7850
      (게재 0.5385 · 0.7862) / R2 epoch 118 / R3 mse 172.84 · rmse 13.15 · mae 10.49 · r2 0.8798
      (게재 174.02 · 13.19 · 10.54 · 0.8789 — 소수 2~3째 자리 변동, 해설의 결론·대소 관계 모두 유지)

[QA 반영 이력 — 2026-07-31 (mock_exams_report.md)]
  C-1 데이터 생성 블록·공통 import 블록 **양쪽** 첫 줄에 import tensorflow as tf 배치 + 커널 재시작 안내 추가
  H-1 "Series 타깃이 학습 정지 원인" 인과 서술 4곳 정정(정지 원인은 import 순서 단독, 타깃 자료형 무관).
      to_numpy() 지시는 유지하되 근거를 넘파이 연산 일관성으로 교체
  H-3 R2 게재 epoch 60(하네스 인위 상한) → 지시값 실행 실측 85 + 변동 대역 70~130 병기, 축소 캐비어트 2곳 제거
  H-4 스탬프에 하네스가 한 일/하지 않은 일을 명시. "그대로 실행"은 무전제 실행 성공 기록에만 사용
  M-1 np.full_like → np.full(len(y_test_r), y_train_r.mean())로 교재 관용구 통일
  M-3 R1이 본편 X를 덮어쓰던 문제 → X_r로 분리(문제 지시·해설·변수명 표 동시 반영)
  M-4 회귀 확장 세트 헤딩 H2 → H3
  L-1 Q11 verbose 표기 회차 간 통일(verbose는 0/1 무방, epoch 수 출력이 근거임을 명시)
  L-2 Q11 감점 서술의 방점을 "verbose 값"이 아니라 "epoch 수 출력 누락"으로 명확화
  L-3 변수명 표에 rf_pred(및 X_r) 추가
  H-2(교재 미교육 boxplot)는 리더 결정에 따라 ch02 보강으로 처리 — 본 문서 수정 없음

[제외 문항] 없음. 본편 12문항 + 회귀 확장 3문항 전량 실행 검증 통과.
-->
