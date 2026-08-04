---
name: aice-domain
description: AICE Associate 시험의 출제 범위·형식·수준 기준. 교재의 목차 설계, 챕터 집필, 문제 출제, 검수 등 AICE Associate 관련 작업을 할 때 반드시 먼저 읽어야 하는 공유 기준. "AICE", "시험 범위", "출제 기준", "수준 적합성"이 언급되면 이 스킬을 사용할 것.
---

# AICE Associate 도메인 기준

이 교재의 모든 콘텐츠는 이 범위를 벗어나지도, 빠뜨리지도 않아야 한다.
수험서의 가치는 "시험에 나오는 것을 전부, 시험에 안 나오는 것은 최소한으로"에 있다.

## 시험 개요

- **주관:** KT (AICE — AI Certificate for Everyone)
- **형식:** 온라인 실기, 90분, Python 코딩 (Jupyter 유사 환경)
- **문항:** 약 14문항 내외의 코드 작성형 (탐색적 분석 → 전처리 → 모델링 → 평가 흐름)
- **환경:** pandas, numpy, matplotlib, seaborn, scikit-learn, TensorFlow/Keras
- **주의:** 세부 문항 수·정책은 변동될 수 있다. 교재에는 "시험 공지 기준 확인" 안내를 병기한다.

## 출제 범위 (딥러닝 중심 교재 기준)

### 1. 전제 지식 (교재에서 압축 요약으로 다룸)
- 데이터 로딩/탐색: `read_csv`, `info`, `describe`, `value_counts`
- 시각화: matplotlib/seaborn 기본 (histplot, countplot, boxplot, heatmap)
- 전처리: 결측치 처리(`dropna`, `fillna`), 이상치, 라벨/원-핫 인코딩(`get_dummies`), 스케일링(`StandardScaler`, `MinMaxScaler`)
- 데이터 분리: `train_test_split` (stratify 포함)
- 머신러닝 기본: 분류/회귀 개념, 주요 sklearn 모델, 평가지표

### 2. 딥러닝 핵심 범위 (교재의 본론)
- 딥러닝 개념: 뉴런, 가중치/편향, 레이어, 활성화 함수(relu, sigmoid, softmax), 순전파/역전파 직관
- Keras 모델 구성: `Sequential`, `Dense`, `Input`/`input_shape`, `Dropout`, `BatchNormalization`
- 컴파일: optimizer(`adam`), loss 선택 규칙 —
  이진분류 `binary_crossentropy` + sigmoid(1) / 다중분류 `sparse_categorical_crossentropy`(정수 라벨) 또는 `categorical_crossentropy`(원-핫) + softmax(K) / 회귀 `mse`·`mae` + 활성화 없음(1)
- 학습: `fit`(epochs, batch_size, validation_split/validation_data), history 객체
- 콜백: `EarlyStopping`(monitor, patience, restore_best_weights), `ModelCheckpoint`(save_best_only)
- 평가·예측: `evaluate`, `predict`, 예측값 → 클래스 변환(`argmax`, 임계값)
- 과적합 진단·대응: 학습 곡선 해석, Dropout, EarlyStopping
- 성능 지표: accuracy, precision/recall/f1(classification_report), confusion matrix, mse/mae/r2

### 3. 범위 밖 (교재에 넣지 않는다)
- CNN/RNN/LSTM 상세 구현, Transformer, 사전학습 모델, PyTorch
- 역전파 수식 유도, 최적화 이론 심화
- (개념 칼럼 1페이지 수준의 "더 알아보기"는 허용하되 시험 무관 표시 필수)

## 코드 패턴 표준 (Keras 버전 양립)

시험 환경과 독자 로컬 환경의 Keras 메이저 버전(2/3)이 다를 수 있다. 양쪽에서 동작하는 패턴을 표준으로 한다:

- 입력 정의는 `model.add(Input(shape=(n,)))` 를 표준으로 쓴다. `Dense(..., input_shape=(n,))`는 Keras 3에서 비권장이므로 "구버전 표기" 참고로만 언급한다.
- 모델 저장 예시는 `.keras` 확장자를 기본으로 하고, `.h5`는 참고 병기한다.
- 버전 갈림이 있는 API는 교재에 싣기 전 실제 실행으로 확인한다.

## 수준 기준

- 대상 독자: Python 기초는 있으나 딥러닝은 처음인 수험생
- 수식은 최소화하고 도해와 코드로 설명한다
- 코드는 "시험장에서 그대로 쓸 수 있는 패턴" 중심 — 매 챕터에 복붙 가능한 표준 코드 블록 제공

## 출제 유형 기준 (exam-writer용)

기출 원문은 비공개다. 문제는 공개된 범위·유형 기반의 **기출 변형**으로 만들고 교재에 그 사실을 명시한다.
전형적 문항 흐름: 데이터 설명 제시 → "○○ 컬럼의 결측치를 중앙값으로 채우시오" → "학습 70:30으로 분리하시오(random_state=42)" → "은닉층 2개 이상의 딥러닝 모델을 만들고 EarlyStopping을 적용해 학습시키시오" → "test 데이터 성능을 출력하시오" 식의 지시형 단계 문제.
