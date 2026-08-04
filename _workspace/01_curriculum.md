# 01. 커리큘럼 설계서 (Source of Truth)

> 이 문서는 chapter-writer, diagram-designer, exam-writer, tech-reviewer, ebook-builder가 공유하는 **단일 기준**이다.
> 여기에 없는 챕터·도해·문제는 만들지 않는다. 변경이 필요하면 이 문서를 먼저 고치고 관련 에이전트에 통지한다.

---

## 1. 교재 정보

- **제목:** 『AICE Associate 딥러닝 실전 교본 — 도해로 익히고 코드로 끝낸다』
- **부제:** 90분 실기 시험을 통과하는 Keras 표준 패턴 8강
- **콘셉트 한 줄:** 시험에 나오는 딥러닝만, 그림으로 이해하고 시험장에서 그대로 쓰는 코드로 끝내는 수험서.
- **대상 독자:** Python 기초는 있으나 딥러닝은 처음인 AICE Associate 수험생
- **산출 형태:** 오프라인 열람 가능한 HTML e-book (`book/`)
- **총 규모:** 4개 Part / 8개 챕터 / 도해 46개 / 확인 문제 42문항 / 실전 모의고사 2회(27문항)

---

## 2. 전체 목차와 학습 순서 의존 관계

학습 순서 원칙: **개념 → 데이터 준비 → 모델링 → 학습/개선 → 평가 → 실전**

```
Part I. 시험의 지도                      Part III. 학습과 개선
  Ch01 AICE Associate 시험 구조            Ch05 컴파일과 학습
  Ch02 전제 지식 압축 정리 (전처리·ML)      Ch06 과적합 진단과 대응
        │                                        │
        ▼                                        ▼
Part II. 딥러닝의 뼈대                   Part IV. 평가와 실전
  Ch03 딥러닝은 어떻게 배우는가            Ch07 평가와 예측
  Ch04 Keras로 모델 만들기                 Ch08 문제 유형별 완성 코드
                                                 │
                                                 ▼
                                        모의고사 1회(이진분류) / 2회(다중분류+회귀)
```

| Part | Ch | 제목 | 선행 챕터 | 역할 |
|------|----|------|-----------|------|
| I. 시험의 지도 | 01 | AICE Associate 시험 구조와 학습 지도 | — | 시험 형식·범위·시간 배분 파악 |
| I. 시험의 지도 | 02 | 전제 지식 압축 정리 — 데이터 준비와 머신러닝 | 01 | 딥러닝 이전 단계를 1개 챕터로 압축 |
| II. 딥러닝의 뼈대 | 03 | 딥러닝은 어떻게 배우는가 | 02 | 뉴런·층·활성화·순전파/역전파 직관 |
| II. 딥러닝의 뼈대 | 04 | Keras로 모델 만들기 | 03 | Sequential/Dense/출력층 설계 |
| III. 학습과 개선 | 05 | 컴파일과 학습 | 04 | optimizer·loss 선택, fit, history |
| III. 학습과 개선 | 06 | 과적합 진단과 대응 | 05 | 학습 곡선, Dropout, 콜백 |
| IV. 평가와 실전 | 07 | 평가와 예측 | 05 (06 권장) | evaluate/predict, 분류·회귀 지표 |
| IV. 평가와 실전 | 08 | 문제 유형별 완성 코드와 시험장 전략 | 02~07 전부 | 3종 end-to-end 템플릿 + 오류 대응 |
| — | 모의 1 | 이진분류 실전 모의고사 | 08 | 전 범위 통합 |
| — | 모의 2 | 다중분류(+회귀 확장) 실전 모의고사 | 08 | 전 범위 통합 |

**의존 관계 주의사항 (에이전트용)**

- Ch03 이전에는 Keras API를 쓰지 않는다(개념은 numpy 수동 계산으로 설명).
- 손실 함수 선택 규칙의 **정본 도해는 `ch05_loss-decision`** 이다. Ch04는 출력층 관점(`ch04_output-layer-choice`)만 다루고 loss 표는 Ch05를 참조하도록 한다(중복 금지).
- 평가지표 개념 지도는 Ch02(`ch02_metric-map`), 계산·해석은 Ch07이 담당한다.
- Ch08은 새 개념을 도입하지 않는다. Ch02~07의 조합·정리만 한다.

---

## 3. 챕터별 스펙

각 도해는 chapter-writer가 본문에 아래 형식으로 삽입한다:
`<!-- DIAGRAM: {id} | {캡션} | {구도 지시} -->`

---

### Ch01. AICE Associate 시험 구조와 학습 지도

| 항목 | 내용 |
|------|------|
| 분량 | 1,500~1,800 단어 |
| 확인 문제 | **4문항** (객관식 3 / 코드 빈칸 1) |
| 선행 | 없음 |

**학습 목표 (3개)**
1. AICE Associate 실기 시험의 문항 흐름과 채점 단위를 설명할 수 있다.
2. 시험 범위에 포함되는 딥러닝 주제와 범위 밖 주제를 구분할 수 있다.
3. 90분을 단계별로 배분하는 자기 기준을 세울 수 있다.

**필수 도해 (4개)**

| id | 캡션 | 구도 지시 | 유형 |
|----|------|-----------|------|
| `ch01_exam-flow` | AICE Associate 실기 시험의 문항 흐름 | 좌→우 파이프라인 박스 체인: 데이터 로딩·탐색 → 전처리 → 데이터 분리 → 머신러닝 → 딥러닝 → 평가. 각 박스 하단에 예상 문항 수 주석(12px muted). 딥러닝 구간 2박스만 primary 채움, 나머지 muted | 파이프라인 |
| `ch01_scope-map` | 이 교재가 다루는 범위와 다루지 않는 범위 | 중앙의 큰 둥근 사각형(범위 안)에 Dense·활성화 함수·loss 선택·콜백·평가지표를 primary-soft 태그로 배치. 바깥에 CNN·RNN/LSTM·Transformer·PyTorch를 muted 텍스트 + danger 점선 테두리 영역으로 배치 | 비교도 |
| `ch01_time-budget` | 90분 시험 시간 배분 예시 | 가로 막대 타임라인(총 90분)을 탐색 15 / 전처리 25 / 머신러닝 15 / 딥러닝 25 / 검토 10 구간으로 분할. 각 구간 위에 단계명, 아래에 누적 경과 시각. 딥러닝 구간 primary | 파이프라인 |
| `ch01_learning-path` | 교재 학습 경로와 챕터 의존 관계 | 상→하 계층 흐름도. Ch01~Ch08 노드를 Part 단위 배경 박스 4개로 묶고, 노드마다 키워드 한 단어. 하단에 모의고사 1·2회 노드를 accent 테두리로 배치 | 파이프라인 |

**핵심 코드 패턴**
- 시험 환경 확인: `import tensorflow as tf; print(tf.__version__)`
- 표준 import 블록(pandas/numpy/matplotlib/seaborn/sklearn/tf.keras) — 이후 전 챕터 공통으로 재사용
- 노트북 셀 실행 순서와 `print()`로 결과를 남기는 답안 습관

**시험 포인트 (2개 이상 배치)**: 문항 간 결과 의존 구조 / 지시된 변수명·`random_state` 준수

---

### Ch02. 전제 지식 압축 정리 — 데이터 준비와 머신러닝

| 항목 | 내용 |
|------|------|
| 분량 | 2,600~3,000 단어 (압축 요약이지만 범위가 넓음) |
| 확인 문제 | **6문항** (객관식 2 / 코드 빈칸 2 / 오류 찾기 2) |
| 선행 | Ch01 |

**학습 목표 (3개)**
1. 결측치·인코딩·스케일링을 상황에 맞는 함수로 처리할 수 있다.
2. 데이터 누수 없이 학습/평가 데이터를 분리하는 순서를 지킬 수 있다.
3. 머신러닝 모델의 3줄 패턴과 딥러닝 4단계 패턴의 차이를 설명할 수 있다.

**필수 도해 (7개)**

| id | 캡션 | 구도 지시 | 유형 |
|----|------|-----------|------|
| `ch02_data-pipeline` | 데이터 준비 5단계 파이프라인 | 좌→우 박스 체인: 로딩 → 탐색 → 결측·이상치 처리 → 인코딩·스케일링 → 분리. 각 박스 하단에 대표 함수명을 코드체 라벨(`read_csv`, `info`, `fillna`, `get_dummies`, `train_test_split`) | 파이프라인 |
| `ch02_missing-strategy` | 결측치 처리 방법 선택 분기 | 상→하 의사결정 트리. 마름모 질문: "결측 비율이 매우 큰가?" → 예: 컬럼 삭제 / 아니오 → "수치형인가?" → 예: 평균·중앙값 대체 / 아니오: 최빈값 대체. 잎 노드는 primary-soft | 판단 분기도 |
| `ch02_encoding-compare` | 라벨 인코딩과 원-핫 인코딩의 결과 차이 | 좌우 2패널. 왼쪽: 원본 범주 컬럼 3행 표. 오른쪽 상단: 라벨 인코딩 결과(0,1,2)와 "크기 의미가 생김" 주석 danger. 오른쪽 하단: `get_dummies` 결과 3컬럼 0/1 표 success | 비교도 |
| `ch02_scaling-effect` | 스케일링 전후 특성 분포의 변화 | 좌우 2패널 산점도 개략도. 왼쪽: x축 0~1000, y축 0~1로 찌그러진 분포(muted). 오른쪽: 표준화 후 두 축 균형 잡힌 분포(success). "실데이터 아닌 개념 개략도" 주석 | 그래프 개념도 |
| `ch02_split-leakage` | 스케일러 fit 시점과 데이터 누수 | 상하 2행 비교. 위: 전체 데이터 fit → 분리(danger, "테스트 정보가 새어 들어감"). 아래: 분리 → train에 `fit_transform` → test에 `transform`(success) | 비교도 |
| `ch02_ml-vs-dl` | 머신러닝 3줄 패턴과 딥러닝 4단계 패턴 | 중앙 공유 입력 데이터 박스에서 좌우로 분기. 왼쪽: sklearn 3줄(생성→fit→predict). 오른쪽: Keras 4단계(구성→컴파일→학습→평가). 단계 수 대비가 보이도록 세로 정렬 | 비교도 |
| `ch02_metric-map` | 문제 유형별 평가지표 지도 | 상→하 분기. 최상단 마름모 "타깃이 범주인가 숫자인가" → 분류: 이진/다중 → accuracy·precision·recall·f1·혼동행렬 / 회귀 → mse·mae·r2. 잎 노드에 sklearn 함수명 병기 | 판단 분기도 |

**핵심 코드 패턴**
- 탐색: `read_csv` → `head` / `info` / `describe` / `isnull().sum()` / `value_counts()`
- 시각화: `sns.countplot`, `sns.histplot`, `sns.heatmap(df.corr(), annot=True)`
- 결측·이상치: `dropna`, `fillna(median)`, `fillna(mode)[0]`
- 인코딩·스케일링: `pd.get_dummies(df, columns=[...])`, `StandardScaler` / `MinMaxScaler`
  → 결과는 `X_train_scaled` / `X_test_scaled`에 담는다(§6 변수명 정본)
- 분리: `train_test_split(X, y, test_size=0.3, random_state=42, stratify=y)`
- 머신러닝 베이스라인: `RandomForestClassifier` / `LogisticRegression` → `fit` → `predict` → `classification_report`

---

### Ch03. 딥러닝은 어떻게 배우는가

| 항목 | 내용 |
|------|------|
| 분량 | 1,800~2,200 단어 |
| 확인 문제 | **5문항** (객관식 3 / 코드 빈칸 2) |
| 선행 | Ch02 |

**학습 목표 (3개)**
1. 뉴런 하나의 계산(가중합 + 편향 → 활성화)을 그림과 수식 한 줄로 설명할 수 있다.
2. relu·sigmoid·softmax의 출력 범위와 사용 위치를 구분할 수 있다.
3. 순전파와 역전파가 한 epoch 안에서 반복되는 흐름을 설명할 수 있다.

**필수 도해 (6개)**

| id | 캡션 | 구도 지시 | 유형 |
|----|------|-----------|------|
| `ch03_neuron` | 뉴런 하나가 값을 계산하는 과정 | 좌→우. 입력 원 3개(x1,x2,x3) → 각 화살표에 가중치 라벨(w1,w2,w3) → 합산 노드(원 안 "sum")에 편향 b 입력 화살표 → 활성화 함수 박스 → 출력 a. 하단에 `a = f(w1*x1 + w2*x2 + w3*x3 + b)` 한 줄. 아래첨자는 ASCII 표기 | 구조도 |
| `ch03_layer-stack` | 입력층·은닉층·출력층의 계층 구조 | 좌→우 4컬럼 신경망. 입력 4노드(muted) → 은닉 5노드 → 은닉 5노드 → 출력 1노드(primary). 연결선 muted 얇게. 각 컬럼 하단에 층 이름과 `Dense(units)` 표기 | 구조도 |
| `ch03_activation-shapes` | 주요 활성화 함수의 모양과 사용 위치 | 3분할 세로 패널. 각 패널에 relu / sigmoid / softmax 곡선(softmax는 막대 3개 확률 합=1로 표현) + 출력 범위 라벨 + 사용 위치 라벨(은닉층 / 이진 출력 / 다중 출력) | 그래프 개념도 |
| `ch03_forward-backward` | 순전파와 역전파의 방향 | 같은 신경망 위에 2단 화살표. 위쪽: 좌→우 primary 실선 "순전파: 예측값 계산". 아래쪽: 우→좌 accent 점선 "역전파: 오차로 가중치 수정". 오른쪽 끝에 손실 계산 노드 배치 | 구조도 |
| `ch03_learning-loop` | 학습 한 번의 반복 루프 | 사각 순환 흐름도(시계 방향): 배치 입력 → 예측 → 손실 계산 → 기울기 계산 → 가중치 갱신 → 다시 배치. 루프 바깥에 "이 한 바퀴 = 1 step, 전체 데이터 1회 = 1 epoch" 주석 | 파이프라인 |
| `ch03_width-depth` | 층 수와 노드 수가 모델에 미치는 영향 | 좌우 2패널 구조도. 왼쪽: 층 1개·노드 3개(단순, "표현력 부족" muted). 오른쪽: 층 3개·노드 8개("표현력 크지만 과적합 위험" danger 주석). 중앙 구분선 | 비교도 |

**핵심 코드 패턴**
- numpy로 뉴런 1개 수동 계산: `np.dot(w, x) + b` → `np.maximum(0, z)`
- sigmoid: `1 / (1 + np.exp(-z))`, softmax: `np.exp(z) / np.exp(z).sum()` → 합이 1임을 출력으로 확인
- (Keras API는 이 챕터에서 쓰지 않는다)

---

### Ch04. Keras로 모델 만들기

| 항목 | 내용 |
|------|------|
| 분량 | 2,000~2,400 단어 |
| 확인 문제 | **6문항** (객관식 2 / 코드 빈칸 2 / 오류 찾기 2) |
| 선행 | Ch03 |

**학습 목표 (3개)**
1. `Sequential`과 `Dense`로 은닉층 2개 이상의 모델을 작성할 수 있다.
2. 입력 shape와 출력층(units·activation)을 문제 유형에 맞게 정할 수 있다.
3. `Dropout`·`BatchNormalization`을 올바른 위치에 넣고 `summary()`로 확인할 수 있다.

**필수 도해 (6개)**

| id | 캡션 | 구도 지시 | 유형 |
|----|------|-----------|------|
| `ch04_keras-4steps` | Keras 모델 제작 4단계 | 좌→우 박스 체인: 구성(Sequential/Dense) → 컴파일(optimizer/loss) → 학습(fit) → 평가(evaluate/predict). 이 챕터 범위인 "구성"만 primary, 나머지 muted + 담당 챕터 번호 주석(Ch05, Ch07) | 파이프라인 |
| `ch04_sequential-build` | 코드 한 줄과 층 하나의 대응 | 좌우 대응도. 왼쪽: `model.add(...)` 4줄 코드 박스. 오른쪽: 대응하는 층 4개 세로 스택. 같은 순번끼리 점선으로 연결하고 동일 색조 사용 | 구조도 |
| `ch04_input-shape` | 입력 shape를 정하는 규칙 | 왼쪽: 표(행 1000 × 열 8) 그림, 행/열에 치수 라벨. 화살표 → 오른쪽: `Input(shape=(8,))` 코드 박스. 하단 accent 주석 "행 수(샘플 수)는 넣지 않는다" | 구조도 |
| `ch04_output-layer-choice` | 문제 유형별 출력층 설계 | 상→하 분기도. 마름모 "문제 유형?" → 이진분류: `Dense(1, 'sigmoid')` / 다중분류(K클래스): `Dense(K, 'softmax')` / 회귀: `Dense(1)` 활성화 없음. 각 잎에 대응 loss는 "Ch05 참조"로만 표기 | 판단 분기도 |
| `ch04_param-count` | 파라미터 수가 계산되는 방식 | 상단: 입력 4노드 → 은닉 5노드 연결 구조. 중앙: `(4 x 5) + 5 = 25` 계산식 박스. 하단: `model.summary()` 출력 표를 재현하고 해당 행에 화살표로 연결 | 구조도 |
| `ch04_dropout-bn-position` | Dropout과 BatchNormalization을 넣는 위치 | 상→하 층 스택: Input → Dense(relu) → BatchNormalization → Dropout → Dense(relu) → Dropout → 출력층. 출력층 뒤 Dropout에 danger X 표시와 "출력층 뒤에는 넣지 않는다" 주석 | 구조도 |

**핵심 코드 패턴**
```python
model = Sequential()
model.add(Input(shape=(n_features,)))     # Keras 2/3 양립 표준
model.add(Dense(64, activation='relu'))
model.add(Dropout(0.3))
model.add(Dense(32, activation='relu'))
model.add(Dense(1, activation='sigmoid')) # 유형별 교체 지점
model.summary()
```
- 구버전 표기 `Dense(64, activation='relu', input_shape=(n,))`는 참고로만 병기
- `n_features`는 `X_train_scaled.shape[1]`로 얻는다(§6 변수명 정본)
- 저장은 `model.save('model.keras')` 기본, `.h5`는 참고 병기

---

### Ch05. 컴파일과 학습

| 항목 | 내용 |
|------|------|
| 분량 | 2,200~2,600 단어 |
| 확인 문제 | **6문항** (객관식 2 / 코드 빈칸 2 / 오류 찾기 2) |
| 선행 | Ch04 |

**학습 목표 (3개)**
1. 문제 유형과 라벨 형태에 맞는 손실 함수를 선택할 수 있다.
2. `fit`의 epochs·batch_size·validation 인자를 의도에 맞게 설정할 수 있다.
3. `history`로 학습 곡선을 그리고 학습 진행 상태를 읽을 수 있다.

**필수 도해 (6개)**

| id | 캡션 | 구도 지시 | 유형 |
|----|------|-----------|------|
| `ch05_compile-triple` | compile의 세 인자와 역할 | 중앙 `model.compile()` 박스에서 3갈래 방사. optimizer("가중치를 어떻게 갱신할까" / adam), loss("오차를 어떻게 잴까" / 유형별), metrics("사람이 볼 지표" / accuracy). loss 갈래만 primary | 구조도 |
| `ch05_loss-decision` | 손실 함수와 출력층 짝 선택 분기 **(교재 최중요 도해)** | 상→하 의사결정 트리. 루트 마름모 "타깃이 숫자인가 범주인가" → 회귀: `mse`/`mae` + `Dense(1)` / 분류 → "클래스가 2개인가" → 예: `binary_crossentropy` + `Dense(1,'sigmoid')` / 아니오 → "라벨이 정수인가 원-핫인가" → 정수: `sparse_categorical_crossentropy` / 원-핫: `categorical_crossentropy`, 둘 다 `Dense(K,'softmax')`. 잎 노드는 primary-soft 채움, 각 잎에 loss와 출력층을 한 박스 안에 짝으로 표기 | 판단 분기도 |
| `ch05_epoch-batch` | epoch, batch_size, step의 관계 | 가로 긴 띠로 표현한 1000행 데이터를 32행 단위 블록으로 분할. 한 블록 = 1 step, 띠 전체 1회 통과 = 1 epoch. 하단에 `step = ceil(1000/32) = 32` 계산 주석 | 그래프 개념도 |
| `ch05_validation-split` | validation_split이 데이터를 나누는 방식 | 가로 막대 3단. 최상단: 전체 데이터 → train/test 분할(test는 별도 danger 아닌 muted 박스로 "학습에 절대 쓰지 않음"). 중간: train을 0.8/0.2로 재분할. 하단 주석 "validation_split은 뒤쪽에서 잘라낸다 — 정렬된 데이터는 미리 섞어야 한다" | 구조도 |
| `ch05_history-curve` | 학습 곡선의 구성 요소 | 축 그래프 개략도(x=epoch, y=loss). train loss 실선 primary, val loss 점선 accent, 범례 박스, y축 라벨. "개념 개략도" 주석 | 그래프 개념도 |
| `ch05_optimizer-lr` | 학습률에 따른 수렴 모습 | 3분할 패널. 각 패널에 U자 손실 곡면 + 공이 내려가는 궤적. 왼쪽: 너무 작음(짧은 보폭, muted "느림"), 중앙: 적절(success), 오른쪽: 너무 큼(진동·발산, danger) | 그래프 개념도 |

**핵심 코드 패턴**
```python
model.compile(optimizer='adam',
              loss='binary_crossentropy',   # 유형별 교체 지점
              metrics=['accuracy'])
history = model.fit(X_train_scaled, y_train,
                    epochs=50, batch_size=32,
                    validation_split=0.2, verbose=1)
print(history.history.keys())
```
- 학습 곡선 플롯 함수(loss/val_loss, accuracy/val_accuracy 2패널)를 재사용 가능한 형태로 제공
- `validation_data=(X_val_scaled, y_val)` 대안 표기 병기

---

### Ch06. 과적합 진단과 대응

| 항목 | 내용 |
|------|------|
| 분량 | 2,000~2,400 단어 |
| 확인 문제 | **5문항** (객관식 2 / 코드 빈칸 2 / 오류 찾기 1) |
| 선행 | Ch05 |

**학습 목표 (3개)**
1. 학습 곡선을 보고 과적합·과소적합·정상 학습을 판별할 수 있다.
2. Dropout이 학습과 추론에서 다르게 동작한다는 점을 설명할 수 있다.
3. `EarlyStopping`·`ModelCheckpoint`를 시험 표준 인자로 적용할 수 있다.

**필수 도해 (6개)**

| id | 캡션 | 구도 지시 | 유형 |
|----|------|-----------|------|
| `ch06_overfit-vs-good` | 과적합 곡선과 정상 학습 곡선 비교 | 좌우 2패널 학습 곡선. 왼쪽: train loss 계속 하강, val loss 중간부터 상승(danger)하며 분기점에 세로 점선 + "과적합 시작". 오른쪽: 두 곡선이 함께 하강해 수렴(success). 중앙 구분선 | 비교도 |
| `ch06_underfit-overfit-fit` | 과소적합·적정·과적합의 결정 경계 | 3분할 패널 산점도 개략도(두 클래스 점). 왼쪽: 직선 경계(과소적합), 중앙: 완만한 곡선(적정, success), 오른쪽: 점 하나하나 감싸는 구불구불한 경계(과적합, danger) | 비교도 |
| `ch06_dropout-mechanism` | Dropout이 학습 중 뉴런을 끄는 방식 | 좌우 2패널 동일 신경망. 왼쪽(학습 시): 은닉 노드 중 30%를 muted 빗금 + 연결선 제거, "매 step마다 다른 노드가 꺼짐". 오른쪽(추론 시): 전 노드 활성 primary, "예측할 때는 끄지 않음" | 비교도 |
| `ch06_earlystopping` | EarlyStopping이 학습을 멈추는 지점 | 학습 곡선(val loss) 위에 최저점 success 마커("best epoch"), 그 이후 patience 구간을 accent 브래킷으로 표시, 중단 지점 세로선, best로 되돌아가는 곡선 화살표 + `restore_best_weights=True` 라벨 | 그래프 개념도 |
| `ch06_callback-flow` | 콜백이 학습 루프에 끼어드는 위치 | 상→하 흐름도: epoch 종료 → 검증 지표 계산 → 마름모 "이전 최고보다 개선?" → 예: 가중치 저장·개선 없음 카운터 초기화 / 아니오: 개선 없음 카운터+1 → 마름모 "개선 없음 카운터가 patience에 도달했는가? (>=)" → 예: 학습 중단 / 아니오: 다음 epoch로 순환. **부등호 주의:** Keras 실제 동작은 `wait >= patience`이므로 `>`(초과)로 그리지 않는다. 이 조건에서 "중단 epoch = 최저 epoch + patience"가 성립하며, 본문·문제집의 검산 규칙이 여기에 의존한다 | 판단 분기도 |
| `ch06_regularization-menu` | 과적합 대응 수단 비교 | 4행 표 도해: Dropout / EarlyStopping / 데이터 늘리기 / 모델 크기 줄이기 × (효과, 시험 출제 빈도). 시험 빈출 2개(Dropout, EarlyStopping) 행만 primary 배경 | 비교도 |

**핵심 코드 패턴**
```python
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint

es = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
mc = ModelCheckpoint('best_model.keras', monitor='val_loss', save_best_only=True)
history = model.fit(X_train_scaled, y_train, epochs=100, batch_size=32,
                    validation_split=0.2, callbacks=[es, mc], verbose=1)
```
- `load_model('best_model.keras')`로 최적 모델 복원
- Dropout 비율 조정 전후 학습 곡선 비교 실험 1건

---

### Ch07. 평가와 예측

| 항목 | 내용 |
|------|------|
| 분량 | 2,200~2,600 단어 |
| 확인 문제 | **5문항** (객관식 2 / 코드 빈칸 2 / 오류 찾기 1) |
| 선행 | Ch05 (Ch06 권장) |

**학습 목표 (3개)**
1. `evaluate`와 `predict`의 반환값 차이를 알고 목적에 맞게 쓸 수 있다.
2. 확률 예측값을 임계값·`argmax`로 클래스 라벨로 변환할 수 있다.
3. 혼동 행렬과 `classification_report`, 회귀 지표를 해석할 수 있다.

**필수 도해 (6개)**

| id | 캡션 | 구도 지시 | 유형 |
|----|------|-----------|------|
| `ch07_evaluate-predict` | evaluate와 predict의 반환값 차이 | 중앙 학습된 모델 박스 + `X_test_scaled` 입력에서 좌우 2갈래. 왼쪽: `evaluate` → `[0.31, 0.88]` 리스트와 "loss, metrics 값". 오른쪽: `predict` → shape (N,1) 확률 배열 예시 표와 "샘플별 확률" | 비교도 |
| `ch07_prob-to-class` | 확률 예측값을 클래스로 바꾸는 방법 | 상하 2행. 위(이진): `0.83` → 임계값 0.5 기준 박스 → `1`, 코드 `(pred > 0.5).astype(int)`. 아래(다중): `[0.1, 0.7, 0.2]` 막대 3개 → argmax 화살표 → `1`, 코드 `np.argmax(pred, axis=1)` | 파이프라인 |
| `ch07_confusion-matrix` | 혼동 행렬의 네 칸 읽는 법 | 2x2 격자(행=실제, 열=예측). 각 칸에 TP/FP/FN/TN 라벨과 한 줄 의미. 정밀도는 예측 열 방향 화살표(primary), 재현율은 실제 행 방향 화살표(accent)로 계산 방향 표시 | 구조도 |
| `ch07_precision-recall` | 정밀도와 재현율이 중요해지는 상황 | 좌우 2패널 상황도. 왼쪽: 스팸 필터 — 정상 메일을 스팸으로 잘못 분류한 아이콘 danger, "정밀도 중요". 오른쪽: 질병 검진 — 환자를 정상으로 놓친 아이콘 danger, "재현율 중요" | 비교도 |
| `ch07_report-read` | classification_report 읽는 순서 | `classification_report` 실제 출력 형태를 표로 재현. 읽는 순서를 번호 뱃지 1~3으로 표시(① 클래스별 precision/recall/f1 → ② support로 클래스 불균형 확인 → ③ macro avg와 weighted avg 차이). 불균형 시 accuracy만 보면 안 된다는 accent 주석 | 구조도 |
| `ch07_regression-metrics` | 회귀 지표 mse·mae·r2의 초점 차이 | 좌: 실제값 대비 예측값 산점도 개략도 + 대각선 기준선 + 잔차 세로선 강조. 우: 3행 표 — mse(큰 오차에 민감), mae(평균 오차 크기), r2(설명력, 1에 가까울수록 좋음) | 그래프 개념도 |

**핵심 코드 패턴**
```python
loss, acc = model.evaluate(X_test_scaled, y_test)
pred = model.predict(X_test_scaled)
y_pred = (pred > 0.5).astype(int)          # 이진
# y_pred = np.argmax(pred, axis=1)         # 다중
print(classification_report(y_test, y_pred))
print(confusion_matrix(y_test, y_pred))
```
- 회귀: `mean_squared_error`, `mean_absolute_error`, `r2_score`, `pred.flatten()` 형태 맞추기

---

### Ch08. 문제 유형별 완성 코드와 시험장 전략

| 항목 | 내용 |
|------|------|
| 분량 | 2,400~3,000 단어 (코드 비중 높음) |
| 확인 문제 | **5문항** (객관식 1 / 코드 빈칸 2 / 오류 찾기 2) |
| 선행 | Ch02~Ch07 전부 |

**학습 목표 (3개)**
1. 이진분류·다중분류·회귀 각각의 end-to-end 코드를 처음부터 끝까지 작성할 수 있다.
2. 세 유형에서 달라지는 지점(출력층·loss·평가지표)만 정확히 교체할 수 있다.
3. 시험장에서 만나는 대표 오류를 메시지만 보고 원인과 조치를 판단할 수 있다.

**필수 도해 (5개)**

| id | 캡션 | 구도 지시 | 유형 |
|----|------|-----------|------|
| `ch08_endtoend-binary` | 이진분류 문제의 전체 코드 지도 | 좌→우 8단계 파이프라인(로딩→탐색→전처리→분리→구성→컴파일→학습→평가). 각 박스 하단에 대표 코드 한 줄 코드체. 딥러닝 3단계(구성·컴파일·학습) primary | 파이프라인 |
| `ch08_three-templates` | 유형별로 바뀌는 세 곳 | 3열 × 3행 비교표 도해. 열: 이진분류/다중분류/회귀. 행: 출력층 / loss / 주 평가지표. 나머지(전처리·은닉층·콜백)는 하단에 muted 공통 박스로 "동일" 표시 | 비교도 |
| `ch08_error-triage` | 자주 만나는 오류와 원인 판별 | 상→하 4분기. 각 분기: 오류 증상 박스(danger) → 원인 → 조치 박스(success). 증상은 shape 불일치 / loss-활성화 불일치 / loss가 nan / accuracy가 0.5에서 고정 | 판단 분기도 |
| `ch08_exam-checklist` | 제출 전 최종 점검 순서 | 세로 체크리스트 카드 6줄: 셀을 위에서부터 다시 실행 / 지시된 변수명 사용 / random_state 확인 / 결과를 print로 출력 / 저장 파일명 확인 / 남은 시간 배분. 각 줄 앞 체크박스 사각형 | 구조도 |
| `ch08_score-strategy` | 부분 점수를 지키는 답안 구성 | 좌우 비교. 왼쪽: 한 셀에 전 과정을 몰아 쓴 답안 — 중간 오류 시 전체 실패(danger). 오른쪽: 단계별 셀 분리 + 각 셀 말미 print — 오류가 나도 앞 단계 점수 유지(success) | 비교도 |

**핵심 코드 패턴**
- 템플릿 A: 이진분류 end-to-end (합성 데이터 생성 → 전처리 → 모델 → EarlyStopping → classification_report)
- 템플릿 B: 다중분류 end-to-end (`sparse_categorical_crossentropy` + softmax + argmax)
- 템플릿 C: 회귀 end-to-end (`mse` + 출력 활성화 없음 + mae/r2)
- 세 템플릿 모두 모델 투입은 `X_train_scaled` / `X_test_scaled`로 통일한다(§6 변수명 정본)
- 오류 재현·수정 스니펫 4종(`ch08_error-triage`의 각 분기와 1:1 대응)

---

## 4. 도해 총괄 인벤토리 (46개)

파일명은 `_workspace/diagrams/{id}.svg`. **id 중복·유사 주제 중복 금지** — 중복 후보는 아래 "중복 방지 메모" 참조.

| # | id | 챕터 | 유형 |
|---|----|------|------|
| 1 | `ch01_exam-flow` | 01 | 파이프라인 |
| 2 | `ch01_scope-map` | 01 | 비교도 |
| 3 | `ch01_time-budget` | 01 | 파이프라인 |
| 4 | `ch01_learning-path` | 01 | 파이프라인 |
| 5 | `ch02_data-pipeline` | 02 | 파이프라인 |
| 6 | `ch02_missing-strategy` | 02 | 판단 분기도 |
| 7 | `ch02_encoding-compare` | 02 | 비교도 |
| 8 | `ch02_scaling-effect` | 02 | 그래프 개념도 |
| 9 | `ch02_split-leakage` | 02 | 비교도 |
| 10 | `ch02_ml-vs-dl` | 02 | 비교도 |
| 11 | `ch02_metric-map` | 02 | 판단 분기도 |
| 12 | `ch03_neuron` | 03 | 구조도 |
| 13 | `ch03_layer-stack` | 03 | 구조도 |
| 14 | `ch03_activation-shapes` | 03 | 그래프 개념도 |
| 15 | `ch03_forward-backward` | 03 | 구조도 |
| 16 | `ch03_learning-loop` | 03 | 파이프라인 |
| 17 | `ch03_width-depth` | 03 | 비교도 |
| 18 | `ch04_keras-4steps` | 04 | 파이프라인 |
| 19 | `ch04_sequential-build` | 04 | 구조도 |
| 20 | `ch04_input-shape` | 04 | 구조도 |
| 21 | `ch04_output-layer-choice` | 04 | 판단 분기도 |
| 22 | `ch04_param-count` | 04 | 구조도 |
| 23 | `ch04_dropout-bn-position` | 04 | 구조도 |
| 24 | `ch05_compile-triple` | 05 | 구조도 |
| 25 | `ch05_loss-decision` | 05 | 판단 분기도 |
| 26 | `ch05_epoch-batch` | 05 | 그래프 개념도 |
| 27 | `ch05_validation-split` | 05 | 구조도 |
| 28 | `ch05_history-curve` | 05 | 그래프 개념도 |
| 29 | `ch05_optimizer-lr` | 05 | 그래프 개념도 |
| 30 | `ch06_overfit-vs-good` | 06 | 비교도 |
| 31 | `ch06_underfit-overfit-fit` | 06 | 비교도 |
| 32 | `ch06_dropout-mechanism` | 06 | 비교도 |
| 33 | `ch06_earlystopping` | 06 | 그래프 개념도 |
| 34 | `ch06_callback-flow` | 06 | 판단 분기도 |
| 35 | `ch06_regularization-menu` | 06 | 비교도 |
| 36 | `ch07_evaluate-predict` | 07 | 비교도 |
| 37 | `ch07_prob-to-class` | 07 | 파이프라인 |
| 38 | `ch07_confusion-matrix` | 07 | 구조도 |
| 39 | `ch07_precision-recall` | 07 | 비교도 |
| 40 | `ch07_report-read` | 07 | 구조도 |
| 41 | `ch07_regression-metrics` | 07 | 그래프 개념도 |
| 42 | `ch08_endtoend-binary` | 08 | 파이프라인 |
| 43 | `ch08_three-templates` | 08 | 비교도 |
| 44 | `ch08_error-triage` | 08 | 판단 분기도 |
| 45 | `ch08_exam-checklist` | 08 | 구조도 |
| 46 | `ch08_score-strategy` | 08 | 비교도 |

**유형 분포:** 파이프라인 9 / 구조도 13 / 비교도 15 / 판단 분기도 7 / 그래프 개념도 8 — 특정 유형 편중 없음.

**중복 방지 메모 (diagram-designer·tech-reviewer 확인용)**

| 유사 쌍 | 구분 기준 |
|---------|-----------|
| `ch01_exam-flow` ↔ `ch02_data-pipeline` ↔ `ch08_endtoend-binary` | 시험 문항 흐름 / 데이터 준비 세부 단계 / 실제 코드가 붙은 전체 지도 |
| `ch04_output-layer-choice` ↔ `ch05_loss-decision` | 출력층만 / loss와 출력층 짝(정본). Ch04는 loss 표기 금지 |
| `ch02_metric-map` ↔ `ch07_confusion-matrix`·`ch07_regression-metrics` | 지표 "선택" 지도 / 지표 "해석" 방법 |
| `ch03_layer-stack` ↔ `ch04_sequential-build` | 개념적 층 구조 / 코드 줄과 층의 대응 |
| `ch05_history-curve` ↔ `ch06_overfit-vs-good` ↔ `ch06_earlystopping` | 곡선 구성 요소 / 정상 vs 과적합 판별 / 중단 지점 표시 |
| `ch04_dropout-bn-position` ↔ `ch06_dropout-mechanism` | 넣는 위치(코드) / 동작 원리(학습 vs 추론) |

---

## 5. 문제 배치 계획

### 5.1 챕터 확인 문제 (총 42문항)

파일: `_workspace/exams/ch{NN}_quiz.md`, 본문 말미 `<!-- EXAM: ch{NN} -->`로 삽입.

| Ch | 총 | 객관식 | 코드 빈칸 | 오류 찾기 | 심는 오답 포인트 |
|----|----|--------|-----------|-----------|------------------|
| 01 | 4 | 3 | 1 | 0 | 범위 밖 주제(CNN 등)를 시험 범위로 오인 |
| 02 | 6 | 2 | 2 | 2 | 전체 데이터에 스케일러 fit / `stratify` 누락 |
| 03 | 5 | 3 | 2 | 0 | 은닉층에 sigmoid 남용 / softmax를 이진에 사용 |
| 04 | 6 | 2 | 2 | 2 | 입력 shape에 샘플 수 포함 / 출력층 units와 클래스 수 불일치 |
| 05 | 6 | 2 | 2 | 2 | 정수 라벨에 `categorical_crossentropy` / metrics·loss 혼동 |
| 06 | 5 | 2 | 2 | 1 | `restore_best_weights` 누락 / `callbacks` 리스트 미전달 |
| 07 | 5 | 2 | 2 | 1 | 확률값을 그대로 `classification_report`에 투입 / argmax 축 오지정 |
| 08 | 5 | 1 | 2 | 2 | 유형 교체 시 loss만 바꾸고 출력층 유지 / 회귀 출력층에 sigmoid |

난이도 배분: 기본 70% / 응용 30% (`exam-authoring` 규격 준수). 각 문항 해설은 3단 구성(정답 코드 / 왜 이렇게 푸는가 / 자주 틀리는 지점).

### 5.2 실전 모의고사

#### 모의고사 1회 — 이진분류: 통신사 고객 이탈 예측

- 파일: `_workspace/exams/mock_exam_1.md`
- 데이터: 합성 데이터 생성 코드 문제지 포함. 3,000행 / 컬럼 8개
  - `customer_id`(불필요 컬럼), `tenure_months`(가입 개월), `monthly_fee`, `total_fee`(**결측 5%**), `contract_type`(범주 3종), `internet_service`(범주 3종), `support_calls`, `churn`(타깃 0/1, 불균형 약 7:3)
- 배점 100점 / 예상 소요 90분 / **12문항**

| Q | 단계 | 지시 요지 | 배점 |
|---|------|-----------|------|
| 1 | 로딩·형태 | `read_csv`, `shape`·`info` 출력 | 5 |
| 2 | 탐색 | 타깃 `value_counts`, 결측 개수 출력 | 5 |
| 3 | 시각화 | 계약유형별 이탈 `countplot`, 수치형 상관 `heatmap` | 8 |
| 4 | 결측 처리 | `total_fee` 결측을 중앙값으로 대체 | 7 |
| 5 | 컬럼 정리 | `customer_id` 제거 | 5 |
| 6 | 인코딩 | 범주 2개 컬럼 원-핫 인코딩 | 8 |
| 7 | 분리 | `train_test_split` 7:3, `random_state=42`, `stratify` | 8 |
| 8 | 스케일링 | train fit → test transform (누수 방지), 결과는 `X_train_scaled`/`X_test_scaled` | 8 |
| 9 | 머신러닝 | RandomForest 베이스라인 정확도 출력 | 10 |
| 10 | DL 구성·컴파일 | 은닉층 2개 이상 + Dropout, sigmoid 출력, `binary_crossentropy` | 12 |
| 11 | 학습 | `EarlyStopping`(patience=5, restore_best_weights) + `ModelCheckpoint` 적용 `fit`, 학습 곡선 시각화 | 12 |
| 12 | 평가 | test `evaluate`, 임계값 0.5 변환 후 `classification_report`·혼동행렬 출력 | 12 |

- 의존 구조: Q4→Q6→Q7→Q8→Q10~Q12가 앞 단계 결과를 이어받는다(실제 시험 재현).
- 채점 포인트 강조: 불균형 데이터에서 accuracy만으로 판단하지 않기(Q12 해설).

#### 모의고사 2회 — 다중분류(+회귀 확장): 설비 센서 기반 불량 유형 분류

- 파일: `_workspace/exams/mock_exam_2.md`
- 데이터: 합성 데이터 생성 코드 문제지 포함. 4,000행 / 컬럼 10개
  - 센서 수치 6종(`temp`, `vibration`, `pressure`, `rpm`, `current`, `humidity` — `vibration`에 **이상치**, `pressure`에 **결측 4%**), `line_id`(범주 3종), `shift`(범주 3종), 타깃 `defect_type`(0=정상 / 1=마모 / 2=과열, **정수 라벨**), 확장용 연속 타깃 `rul_days`(잔여 수명)
- 배점 100점(본편) + 확장 3문항 / 예상 소요 90분 + 20분 / **본편 12문항 + 회귀 확장 3문항**

| Q | 단계 | 지시 요지 | 배점 |
|---|------|-----------|------|
| 1 | 로딩·탐색 | 타깃 클래스 분포 출력 | 5 |
| 2 | 시각화 | 클래스별 센서 분포 `histplot` 또는 `boxplot` | 7 |
| 3 | 이상치 | `vibration` 이상치 확인 후 지정 방식으로 처리 | 8 |
| 4 | 결측 처리 | `pressure` 결측을 평균으로 대체 | 6 |
| 5 | 인코딩 | `line_id`, `shift` 원-핫 인코딩 | 8 |
| 6 | 분리 | 8:2 분리, `random_state=42`, `stratify` | 8 |
| 7 | 스케일링 | `MinMaxScaler` train fit → test transform, 결과는 `X_train_scaled`/`X_test_scaled` | 7 |
| 8 | 머신러닝 | 분류 베이스라인 성능 출력 | 8 |
| 9 | DL 구성 | 은닉층 2개 이상 + Dropout, 출력층 `Dense(3,'softmax')` | 12 |
| 10 | 컴파일 | 정수 라벨에 맞는 `sparse_categorical_crossentropy` 선택 | 8 |
| 11 | 학습 | `EarlyStopping` 적용 `fit` + 학습 곡선 | 11 |
| 12 | 평가 | `predict`→`argmax`→`classification_report`·혼동행렬, 클래스별 성능 차이 서술 | 12 |

**회귀 확장 세트 (별도 표기 — "추가 연습, 실제 시험은 한 유형만 출제되는 경우가 많음")**

| Q | 단계 | 지시 요지 |
|---|------|-----------|
| R1 | 타깃 교체 | 타깃을 `rul_days`로 바꾸고 동일 전처리 재사용 |
| R2 | 회귀 모델 | 출력층 `Dense(1)`(활성화 없음), `loss='mse'`, `metrics=['mae']` |
| R3 | 평가 | `mean_squared_error`, `mean_absolute_error`, `r2_score` 출력·해석 |

- 두 모의고사 모두 서두에 "본 문제는 공개된 출제 기준에 따른 유형 연습 문제입니다" 문구 필수.
- 해답 코드는 `exam-authoring` 검증 절차대로 실행 후 `<!-- verified: ... -->` 증적 남긴다.

---

## 6. 용어·표기 통일 규칙 (전 에이전트 공통)

| 개념 | 교재 표기(고정) | 금지 표기 |
|------|------------------|-----------|
| hidden layer | 은닉층 | 숨은층, 히든 레이어 |
| activation function | 활성화 함수(activation function) 첫 등장 병기 | 액티베이션 |
| loss function | 손실 함수 | 비용 함수, 로스 |
| overfitting | 과적합 | 오버피팅 |
| callback | 콜백 | 콜백함수 |
| learning curve | 학습 곡선 | 러닝 커브 |
| epoch / batch_size | epoch, batch_size (코드 표기 유지) | 에포크, 배치사이즈(본문 서술 시에도 코드체 유지) |
| 데이터 분리 | 학습 데이터 / 검증 데이터 / 평가(테스트) 데이터 | 트레인/밸리드/테스트 혼용 |
| **스케일링 결과 변수명 (정본)** | **스케일링 결과는 `X_train_scaled`/`X_test_scaled`에 담는다. 모델 투입(`fit`/`evaluate`/`predict`/`Input` shape)은 항상 `_scaled` 계열을 쓴다.** 검증 데이터를 따로 만들면 `X_val_scaled` | `X_train = scaler.fit_transform(X_train)` 형태의 **제자리 덮어쓰기 표기(폐지)**, 모델에 원본 `X_train`·`X_test` 투입 |

- 경어체("~합니다") 통일, 난이도 단정 표현("쉽죠?") 금지.
- 모든 코드는 `tensorflow.keras` 경로, 입력은 `Input(shape=(n,))`, 저장은 `.keras`.

---

## 7. 확인 필요 항목 (임의 확정하지 않음)

| 항목 | 현재 교재 기술 | 확인 필요 사유 | 출처 후보 |
|------|----------------|----------------|-----------|
| 실기 문항 수(약 14문항) | "약 14문항 내외 — 시험 공지 기준 확인" 병기 | 회차별 변동 가능 | KT AICE 공식 사이트(aice.study) 시험 안내, 응시 가이드 PDF |
| 문항별 배점 체계 | 모의고사 배점은 **교재 자체 기준**임을 명시 | 실제 배점 비공개 | 공식 시험 안내, 응시 후기 아님(비신뢰) |
| 시험 환경 TensorFlow/Keras 버전 | Keras 2/3 양립 패턴으로 회피 | 환경 버전 공지 변동 | 공식 응시 환경 안내 페이지 |
| 시각화 문항 포함 여부·비중 | Ch02·모의고사에 포함하되 비중 낮게 | 회차별 출제 편차 | 공식 출제 범위 안내 |
| 머신러닝 문항 포함 여부 | 베이스라인 1문항 수준으로 배치 | 딥러닝 중심 교재 범위 판단 | 공식 출제 범위 안내 |

→ chapter-writer는 위 항목을 단정 서술하지 말고 "시험 공지 기준을 반드시 확인하십시오" 안내를 병기한다.

---

## 8. 제작 체크리스트 (tech-reviewer 최종 정합성 확인용)

- [ ] 챕터 8개 모두 존재, 각 챕터 도해 수가 스펙과 일치(4~7개)
- [ ] 도해 46개 id가 인벤토리와 1:1 일치, 고아·누락 0건
- [ ] 확인 문제 총 42문항, 챕터별 유형 배분 준수
- [ ] 모의고사 2회 존재, 해답 코드 실행 증적 주석 존재
- [ ] 손실 함수 선택 규칙이 Ch05 정본과 Ch04·Ch08에서 모순 없음
- [ ] 범위 밖 주제(CNN/RNN/Transformer/PyTorch)가 "더 알아보기 — 시험 무관" 표시 없이 등장하지 않음
- [ ] 용어 통일 규칙 위반 0건
- [ ] **스케일링 결과 변수명이 전 챕터·도해·모의고사에서 `X_train_scaled`/`X_test_scaled`로 통일(제자리 덮어쓰기 0건, 모델 투입에 원본 `X_train`/`X_test` 0건)**
- [ ] 모든 코드가 `Input(shape=(n,))` / `.keras` 표준 준수

---

## 변경 이력

| 일자 | 버전 | 변경 내용 | 사유 |
|------|------|-----------|------|
| 2026-07-28 | v1.0 | 최초 설계 (4 Part / 8 챕터 / 도해 46 / 확인문제 42 / 모의고사 2회) | 초기 실행 |
| 2026-07-28 | v1.1 | §3 Ch06 `ch06_callback-flow` 구도 지시의 중단 조건을 `"카운터 > patience?"` → `"개선 없음 카운터가 patience에 도달했는가? (>=)"`로 정정하고, 부등호 주의 문구(`wait >= patience`, "중단 epoch = 최저 epoch + patience") 추가 | `qa/ch06_report.md` H-2. Keras `EarlyStopping.on_epoch_end`는 개선이 없으면 `wait += 1` 후 `wait >= patience`에서 중단하므로, 기존 `>`(초과) 표기는 중단 시점을 `최저 + patience + 1`로 만드는 off-by-one 오류였다. 이 스펙이 도해와 본문 서술의 **원본 오류원**이며, 커리큘럼을 고치지 않으면 재작업 시 동일 오류가 재발한다. 또한 본문 §6.4·문제집 Q3·Q4의 검산 규칙("두 숫자의 차이가 patience와 다르면 잘못된 것")과도 모순되므로 스펙 측 정정이 필수 |
| 2026-07-30 | v1.2 | **지시 2곳:** ① §6 용어·표기 통일 규칙에 "스케일링 결과 변수명 (정본)" 행 추가(`X_train_scaled`/`X_test_scaled`, 모델 투입은 항상 `_scaled` 계열, 검증용은 `X_val_scaled`, 제자리 덮어쓰기 금지) ② §3 `ch07_evaluate-predict` 구도 지시의 `X_test` → `X_test_scaled`. **파생 정합(리더 확인 요청):** ③ §3 Ch05·Ch06·Ch07 핵심 코드 패턴의 `model.fit(X_train, ...)`·`evaluate/predict(X_test, ...)`·`validation_data=(X_val, y_val)`를 `_scaled` 계열로 교체, Ch02·Ch04·Ch08 코드 패턴과 모의고사 1·2회 스케일링 단계에 정본 참조 한 줄 추가, §8 체크리스트에 변수명 통일 항목 추가 | `qa/ch08_report.md` H-3 + **리더 결정**. Ch02·Ch08은 `X_train_scaled`, Ch04~Ch07은 제자리 덮어쓰기(`X_train = scaler.fit_transform(X_train)`)로 갈려 같은 골격의 "시험장 표준 코드"가 챕터마다 다른 이름을 쓰는 상태였다(H-3: 독자가 Ch05에서 외운 골격을 Ch08에서 다른 이름으로 다시 만남). 리더가 `_scaled` 계열을 교재 전체 정본으로 확정하고 ch02·ch04~ch08 본문·모의고사를 통일했으므로 스펙에도 정본을 명시한다. ③은 H-3이 "커리큘럼 §3의 핵심 코드 패턴도 `model.fit(X_train, y_train, ...)`"을 불일치 원인으로 지목했고, 스펙만 구표기로 남으면 v1.1과 동일한 "원본 스펙이 오류원" 상태가 되어 재작업 시 재발하므로 함께 정정했다. 지시 범위를 넘는 부분이므로 리더 확인을 받는다 |
