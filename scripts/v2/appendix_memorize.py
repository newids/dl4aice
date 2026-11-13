#!/usr/bin/env python3
"""부록 「외워야 하는 코드 — 3단 분해 기억법」 원고와 검증.

이 파일이 부록의 정본이다. 단위(UNITS)마다 같은 코드를 세 단계로 나눠 적는다.
  1단 흐름 — 블록 전체를 낱말 몇 개의 순서로
  2단 줄   — 그 순서대로 쓰는 실제 코드
  3단 값   — 문제마다 바뀌는 자리와 넣을 값

사용법:
    python3 scripts/v2/appendix_memorize.py            # _workspace/pages/appendix.html 생성
    python3 scripts/v2/appendix_memorize.py --verify   # 모든 코드를 이어 붙여 실제 실행
"""

from __future__ import annotations

import html
import os
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
OUT = ROOT / "_workspace" / "pages" / "appendix.html"

# 검증 전용 준비 코드(부록에는 싣지 않는다): 시험에서 read_csv 로 받는 df 를 대신한다.
SETUP = """
import os
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
import matplotlib
matplotlib.use("Agg")
import numpy as _np
import pandas as _pd
_rng = _np.random.default_rng(42)
_n = 400
df = _pd.DataFrame({
    "age": _rng.integers(20, 70, _n).astype(float),
    "monthly_fee": _rng.normal(65, 20, _n).round(1),
    "contract": _rng.choice(["month", "year", "two_year"], _n),
})
df["churn"] = ((df["monthly_fee"] > 70) ^ (_rng.random(_n) < 0.15)).astype(int)
df.loc[_rng.choice(_n, 20, replace=False), "age"] = _np.nan
df.loc[_rng.choice(_n, 5, replace=False), "monthly_fee"] = 400.0
"""

UNITS = [
    {
        "id": "ap-import",
        "title": "A. 첫 셀 임포트",
        "where": "문항 1",
        "flow": ["텐서플로", "넘파이·판다스", "그래프 둘", "사이킷런 넷", "케라스 셋"],
        "chant": "텐 → 넘·판 → 맷·시 → 분리·스케일·모델·지표 → 모델·층·콜백",
        "code": """import tensorflow as tf
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import Input, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint""",
        "values": [
            ("스케일러", "<code>StandardScaler</code> / <code>MinMaxScaler</code> — 지문이 정한 것"),
            ("머신러닝 모델", "분류 <code>…Classifier</code>, 회귀 <code>…Regressor</code>. 트리는 <code>sklearn.tree</code>, 랜덤 포레스트는 <code>sklearn.ensemble</code>"),
            ("지표", "분류 <code>accuracy_score</code>·<code>classification_report</code>, 회귀 <code>mean_absolute_error</code>·<code>r2_score</code>"),
            ("층", "<code>BatchNormalization</code>이 지문에 있으면 <code>layers</code> 줄에 추가"),
        ],
        "fixed": "별칭 <code>tf</code>, <code>np</code>, <code>pd</code>, <code>plt</code>, <code>sns</code>와 케라스 세 줄(<code>models</code>, <code>layers</code>, <code>callbacks</code>)의 경로는 바뀌지 않습니다.",
        "recall": [
            "<code>train_test_split</code>은 <code>sklearn</code>의 어느 모듈에 있습니까?",
            "<code>EarlyStopping</code>을 가져오는 줄을 처음부터 끝까지 쓰십시오.",
        ],
    },
    {
        "id": "ap-prep",
        "title": "B. 결측치 · 이상치 · 인코딩",
        "where": "문항 4~6",
        "flow": ["결측치 채우기", "IQR 경계 구하기", "범위 안의 행만 남기기", "인덱스 다시 매기기", "원-핫 인코딩"],
        "chant": "결 → 이 → 인 (채우고, 자르고, 숫자로 바꾼다)",
        "code": """# ① 결측치: 그 컬럼의 중앙값으로 채우고 다시 대입
df['age'] = df['age'].fillna(df['age'].median())

# ② 이상치: Q1, Q3, IQR 을 구한 뒤 경계 안의 행만 남김
q1 = df['monthly_fee'].quantile(0.25)
q3 = df['monthly_fee'].quantile(0.75)
iqr = q3 - q1
df = df[(df['monthly_fee'] >= q1 - 1.5 * iqr) & (df['monthly_fee'] <= q3 + 1.5 * iqr)]
df = df.reset_index(drop=True)

# ③ 인코딩: 문자열 컬럼을 0/1 컬럼으로
df = pd.get_dummies(df, columns=['contract'], dtype=int)""",
        "values": [
            ("채우는 값", "수치형 <code>.median()</code> 또는 <code>.mean()</code>, 범주형 <code>.mode()[0]</code>"),
            ("결측 행 삭제", "지문이 삭제를 요구하면 <code>df = df.dropna()</code>"),
            ("IQR 배수", "<code>1.5</code> — 지문에 다른 값이 없으면 고정"),
            ("인코딩 대상", "<code>columns=[…]</code>에 문자열 컬럼 이름"),
            ("타깃이 문자열일 때", "<code>LabelEncoder().fit_transform(df['target'])</code>"),
        ],
        "fixed": "<code>fillna</code> 결과는 반드시 다시 대입합니다. 행을 지운 뒤에는 <code>reset_index(drop=True)</code>를 붙입니다. <code>dtype=int</code>를 주면 <code>True/False</code>가 아니라 0/1이 됩니다.",
        "recall": [
            "IQR 하한과 상한을 구하는 식을 쓰십시오.",
            "조건 두 개를 묶을 때 쓰는 연산자와 괄호의 위치를 말하십시오.",
        ],
    },
    {
        "id": "ap-split",
        "title": "C. 분리와 스케일링",
        "where": "문항 7",
        "flow": ["X·y 나누기", "학습·평가 분리", "스케일러 만들기", "학습 데이터에 fit_transform", "평가 데이터에 transform"],
        "chant": "나누고 → 쪼개고 → 만들고 → 맞추고 → 따르고",
        "code": """# ① 특성과 타깃
X = df.drop(columns=['churn'])
y = df['churn']

# ② 분리: 변수 네 개의 순서는 X_train, X_test, y_train, y_test
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y)

# ③ 스케일링: 학습 데이터로만 기준을 잡고, 평가 데이터는 변환만
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)""",
        "values": [
            ("타깃 컬럼", "<code>'churn'</code> 자리에 지문의 타깃 이름"),
            ("<code>test_size</code>", "8:2면 <code>0.2</code>, 7:3이면 <code>0.3</code>"),
            ("<code>stratify</code>", "분류는 <code>stratify=y</code>, 회귀는 쓰지 않음"),
            ("스케일러", "<code>StandardScaler()</code> / <code>MinMaxScaler()</code>"),
        ],
        "fixed": "<code>random_state=42</code>, 반환 변수 네 개의 순서, <code>fit_transform</code>은 학습 데이터에만 쓴다는 점은 바뀌지 않습니다.",
        "recall": [
            "<code>train_test_split</code>이 돌려주는 네 변수를 순서대로 쓰십시오.",
            "평가 데이터에 <code>fit_transform</code>을 쓰면 안 되는 이유를 한 문장으로 말하십시오.",
        ],
    },
    {
        "id": "ap-ml",
        "title": "D. 머신러닝 모델 3줄",
        "where": "문항 8~10",
        "flow": ["모델 만들기", "fit", "predict", "지표 출력"],
        "chant": "만들고 → 학습 → 예측 → 점수",
        "code": """rf_model = RandomForestClassifier(n_estimators=100, random_state=42)   # ① 만들기
rf_model.fit(X_train, y_train)                                         # ② 학습
rf_pred = rf_model.predict(X_test)                                     # ③ 예측
print(accuracy_score(y_test, rf_pred))                                 # ④ 점수""",
        "values": [
            ("모델 클래스", "<code>DecisionTreeClassifier(max_depth=5, random_state=42)</code>, <code>RandomForestClassifier(…)</code>, <code>XGBClassifier(…)</code>, <code>LGBMClassifier(…)</code>"),
            ("회귀", "이름 끝을 <code>Regressor</code>로, 지표를 <code>mean_absolute_error</code>·<code>r2_score</code>로"),
            ("변수 이름", "<code>dt_model</code>, <code>rf_model</code>, <code>xgb_model</code> — 지문이 정한 이름"),
            ("입력 데이터", "지문이 스케일링한 데이터를 쓰라고 하면 <code>X_train_scaled</code>, <code>X_test_scaled</code>"),
        ],
        "fixed": "어떤 모델이든 <code>fit(학습 X, 학습 y)</code> → <code>predict(평가 X)</code> → <code>지표(y_test, 예측)</code> 순서입니다. 지표 함수의 첫 인자는 정답입니다.",
        "recall": [
            "<code>accuracy_score</code>에 넣는 두 인자의 순서를 말하십시오.",
            "랜덤 포레스트 분류 모델을 만드는 한 줄을 쓰십시오.",
        ],
    },
    {
        "id": "ap-model",
        "title": "E. 딥러닝 모델 구성",
        "where": "문항 11",
        "flow": ["입력", "은닉층", "Dropout", "은닉층", "출력층"],
        "chant": "입 → 은 → 드 → 은 → 출",
        "code": """# Sequential 방식: 빈 모델에 층을 순서대로 add
model = Sequential()
model.add(Input(shape=(X_train_scaled.shape[1],)))   # ① 입력: 특성 개수
model.add(Dense(64, activation='relu'))              # ② 은닉층
model.add(Dropout(0.3))                              # ③ Dropout
model.add(Dense(32, activation='relu'))              # ④ 은닉층
model.add(Dense(1, activation='sigmoid'))            # ⑤ 출력층""",
        "code2_title": "같은 모델을 함수형(Functional) 방식으로",
        "code2": """inputs = Input(shape=(X_train_scaled.shape[1],))     # ① 입력
x = Dense(64, activation='relu')(inputs)             # ② 앞 층의 결과를 괄호로 넘김
x = Dropout(0.3)(x)                                  # ③
x = Dense(32, activation='relu')(x)                  # ④
outputs = Dense(1, activation='sigmoid')(x)          # ⑤ 출력층
model = Model(inputs=inputs, outputs=outputs)        # ⑥ 처음과 끝을 묶음""",
        "values": [
            ("출력층 — 이진분류", "<code>Dense(1, activation='sigmoid')</code>"),
            ("출력층 — 다중분류", "<code>Dense(클래스 수, activation='softmax')</code>"),
            ("출력층 — 회귀", "<code>Dense(1)</code> — 활성화 함수 없음"),
            ("은닉층 노드 수, Dropout 비율", "지문의 숫자 그대로"),
        ],
        "fixed": "입력은 <code>Input(shape=(특성 수,))</code>이며 쉼표를 빼면 안 됩니다. 은닉층 활성화 함수는 <code>'relu'</code>입니다. 문제 유형이 바뀌어도 고치는 곳은 출력층 한 줄입니다.",
        "recall": [
            "3개 클래스 분류의 출력층 한 줄을 쓰십시오.",
            "함수형 방식에서 마지막에 <code>Model</code>로 묶는 줄을 쓰십시오.",
        ],
    },
    {
        "id": "ap-fit",
        "title": "F. 컴파일 · 콜백 · 학습",
        "where": "문항 11~12",
        "flow": ["compile", "EarlyStopping", "ModelCheckpoint", "fit"],
        "chant": "컴 → 얼 → 체 → 핏 / compile 안은 옵·로·메(optimizer, loss, metrics)",
        "code": """# ① 컴파일: optimizer, loss, metrics
model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

# ② 조기 종료: 무엇을 볼지, 몇 번 참을지, 가장 좋았던 가중치로 되돌릴지
es = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)

# ③ 최적 모델 저장: 파일 이름, 무엇을 볼지, 좋아졌을 때만 저장
mc = ModelCheckpoint('best_model.keras', monitor='val_loss', save_best_only=True)

# ④ 학습: 데이터, 검증, 횟수, 묶음 크기, 콜백
history = model.fit(X_train_scaled, y_train,
                    validation_split=0.2, epochs=50, batch_size=32,
                    callbacks=[es, mc])""",
        "values": [
            ("<code>loss</code> — 이진분류", "<code>'binary_crossentropy'</code>"),
            ("<code>loss</code> — 다중분류", "정수 라벨 <code>'sparse_categorical_crossentropy'</code>, 원-핫 라벨 <code>'categorical_crossentropy'</code>"),
            ("<code>loss</code> — 회귀", "<code>'mse'</code>, 지표는 <code>metrics=['mae']</code>"),
            ("<code>patience</code>, <code>epochs</code>, <code>batch_size</code>", "지문의 숫자 그대로"),
            ("검증 데이터", "<code>validation_split=0.2</code> 또는 <code>validation_data=(X_val, y_val)</code>"),
        ],
        "fixed": "<code>monitor='val_loss'</code>, <code>restore_best_weights=True</code>, <code>save_best_only=True</code>, 저장 확장자 <code>.keras</code>, <code>metrics</code>와 <code>callbacks</code>는 대괄호 리스트라는 점은 바뀌지 않습니다. 분류 지표 이름은 <code>'accuracy'</code>로 풀어 씁니다.",
        "recall": [
            "<code>EarlyStopping</code>의 인자 세 개를 이름과 값으로 쓰십시오.",
            "정수 라벨 다중분류의 <code>loss</code> 문자열을 철자까지 쓰십시오.",
        ],
    },
    {
        "id": "ap-curve",
        "title": "G. 학습 곡선",
        "where": "문항 13",
        "flow": ["loss 선", "val_loss 선", "축 이름", "범례", "show"],
        "chant": "선 둘 → 축 → 범례 → 보여 주기",
        "code": """plt.plot(history.history['loss'], label='loss')           # ① 학습 손실
plt.plot(history.history['val_loss'], label='val_loss')   # ② 검증 손실
plt.xlabel('epoch')                                       # ③ 축 이름
plt.ylabel('loss')
plt.legend()                                              # ④ 범례
plt.show()                                                # ⑤ 출력""",
        "values": [
            ("정확도 곡선", "<code>'accuracy'</code>, <code>'val_accuracy'</code>"),
            ("회귀 지표 곡선", "<code>'mae'</code>, <code>'val_mae'</code>"),
            ("제목", "지문이 요구하면 <code>plt.title('…')</code>"),
        ],
        "fixed": "<code>history.history</code>처럼 <code>history</code>를 두 번 씁니다. 키 이름은 <code>compile</code>의 <code>metrics</code>에 적은 문자열과 같고, 검증 쪽은 앞에 <code>val_</code>이 붙습니다.",
        "recall": [
            "검증 정확도를 꺼내는 식을 쓰십시오.",
            "<code>label</code>을 줬는데 범례가 보이지 않는다면 빠진 줄은 무엇입니까?",
        ],
    },
    {
        "id": "ap-eval",
        "title": "H. 평가와 예측값 변환",
        "where": "문항 14 앞부분",
        "flow": ["evaluate", "predict", "클래스로 변환", "지표 출력"],
        "chant": "평가 → 예측 → 변환 → 보고",
        "code": """loss, acc = model.evaluate(X_test_scaled, y_test)      # ① 손실과 지표
pred = model.predict(X_test_scaled)                    # ② 확률 (N, 1)
y_pred = (pred > 0.5).astype(int).flatten()            # ③ 0/1 로 바꾸고 1차원으로
print(classification_report(y_test, y_pred))           # ④ 클래스별 성능
print(confusion_matrix(y_test, y_pred))""",
        "values": [
            ("변환 — 이진분류", "<code>(pred &gt; 0.5).astype(int).flatten()</code>"),
            ("변환 — 다중분류", "<code>np.argmax(pred, axis=1)</code>"),
            ("변환 — 회귀", "<code>pred.flatten()</code>, 지표는 <code>mean_absolute_error</code>·<code>r2_score</code>"),
            ("클래스 이름으로 되돌리기", "<code>le.inverse_transform(y_pred)</code>"),
        ],
        "fixed": "<code>evaluate</code>는 <code>[손실, 지표]</code> 순서로 돌려줍니다. <code>predict</code>의 결과는 확률이거나 값이므로, 정답과 비교하기 전에 반드시 변환합니다.",
        "recall": [
            "다중분류에서 확률을 클래스 번호로 바꾸는 한 줄을 쓰십시오.",
            "<code>(N, 1)</code> 모양을 <code>(N,)</code>으로 바꾸는 메서드 이름을 말하십시오.",
        ],
    },
    {
        "id": "ap-new",
        "title": "I. 새 입력 한 건 예측",
        "where": "문항 14 뒷부분",
        "flow": ["표로 만들기", "같은 인코딩", "컬럼 맞추기", "같은 스케일러로 변환", "예측"],
        "chant": "표 → 인 → 맞 → 변 → 예",
        "code": """new_data = {'age': 35, 'monthly_fee': 70.0, 'contract': 'month'}

new_df = pd.DataFrame([new_data])                                   # ① 딕셔너리를 대괄호로 감싸 1행 표로
new_df = pd.get_dummies(new_df, columns=['contract'], dtype=int)    # ② 학습 때와 같은 인코딩
new_df = new_df.reindex(columns=X.columns, fill_value=0)            # ③ 학습 때의 컬럼 구성과 순서로
new_scaled = scaler.transform(new_df)                               # ④ 이미 학습된 스케일러로 변환만
new_pred = model.predict(new_scaled)                                # ⑤ 예측
print(new_pred[0][0], int(new_pred[0][0] > 0.5))""",
        "values": [
            ("입력 값", "지문이 준 딕셔너리 그대로"),
            ("인코딩 컬럼", "학습 데이터에 썼던 <code>columns=[…]</code>와 같게"),
            ("결과 해석 — 이진분류", "확률과 <code>&gt; 0.5</code> 판정"),
            ("결과 해석 — 다중분류", "<code>np.argmax(new_pred, axis=1)</code> 뒤 <code>le.inverse_transform</code>"),
            ("결과 해석 — 회귀", "<code>new_pred[0][0]</code> 값 그대로"),
        ],
        "fixed": "<code>reindex(columns=X.columns, fill_value=0)</code>과 <code>scaler.transform</code>은 그대로 씁니다. 새 입력에는 <code>fit</code>이나 <code>fit_transform</code>을 쓰지 않습니다.",
        "recall": [
            "1행짜리 표에 <code>get_dummies</code>를 쓰면 컬럼이 모자라는 이유를 말하십시오.",
            "컬럼을 학습 때와 같게 맞추는 한 줄을 쓰십시오.",
        ],
    },
]

INTRO = """<h1>부록 — 외워야 하는 코드 3단 분해</h1>
<p class="v2-ap-lead">시험은 제한적 오픈북이지만, 아래 아홉 묶음은 찾아보지 않고 바로 써야 시간이 남습니다. 긴 코드를 통째로 외우지 않고 세 단계로 나눠 외웁니다.</p>

<section class="v2-ap v2-wide" aria-labelledby="ap-how">
<h2 id="ap-how">3단 분해로 외우는 방법</h2>
<ol class="v2-ap-steps">
<li><span class="v2-ap-tier v2-ap-tier--1">1단 흐름</span><p>블록 전체를 낱말 네다섯 개의 순서로 줄입니다. 먼저 이 순서만 소리 내어 말할 수 있게 합니다.</p></li>
<li><span class="v2-ap-tier v2-ap-tier--2">2단 줄</span><p>순서의 낱말 하나를 코드 한두 줄로 바꿉니다. 주석의 번호가 1단의 순서와 같습니다.</p></li>
<li><span class="v2-ap-tier v2-ap-tier--3">3단 값</span><p>문제마다 바뀌는 자리와 넣을 값을 따로 외웁니다. 나머지는 손대지 않는 고정 부분입니다.</p></li>
</ol>
<p class="v2-ap-note">연습 순서: 1단을 말한다 → 코드를 가리고 2단을 쓴다 → 문제 유형을 바꿔 3단 값만 갈아 끼운다. 각 묶음 끝의 <strong>가리고 떠올리기</strong> 질문으로 확인합니다.</p>
<div class="table-scroll" role="region" tabindex="0" aria-label="전체 흐름과 묶음 대응표">
<table class="v2-ap-table">
<thead><tr><th>묶음</th><th>문항</th><th>1단 흐름</th></tr></thead>
<tbody>
{overview}
</tbody>
</table>
</div>
<p class="v2-ap-note">전체 순서도 한 줄로 외웁니다: <strong>임포트 → 결·이·인 → 분·스 → 머신러닝 → 구·컴·학 → 곡선 → 평·예</strong> (결측치·이상치·인코딩 / 분리·스케일링 / 구성·컴파일·학습 / 평가·예측).</p>
</section>
"""

OUTRO = """<section class="v2-ap v2-wide" aria-labelledby="ap-types">
<h2 id="ap-types">문제 유형이 바뀔 때 고치는 네 곳</h2>
<p>아홉 묶음 가운데 문제 유형에 따라 값이 달라지는 자리는 네 곳뿐입니다. 이 표를 3단 값의 요약으로 외웁니다.</p>
<div class="table-scroll" role="region" tabindex="0" aria-label="문제 유형별로 바뀌는 네 곳">
<table class="v2-ap-table">
<thead><tr><th>유형</th><th>출력층 (E)</th><th><code>loss</code> (F)</th><th><code>metrics</code> (F)</th><th>예측값 변환 (H)</th></tr></thead>
<tbody>
<tr><th scope="row">이진분류</th><td><code>Dense(1, activation='sigmoid')</code></td><td><code>'binary_crossentropy'</code></td><td><code>['accuracy']</code></td><td><code>(pred &gt; 0.5).astype(int).flatten()</code></td></tr>
<tr><th scope="row">다중분류 (정수 라벨)</th><td><code>Dense(K, activation='softmax')</code></td><td><code>'sparse_categorical_crossentropy'</code></td><td><code>['accuracy']</code></td><td><code>np.argmax(pred, axis=1)</code></td></tr>
<tr><th scope="row">다중분류 (원-핫 라벨)</th><td><code>Dense(K, activation='softmax')</code></td><td><code>'categorical_crossentropy'</code></td><td><code>['accuracy']</code></td><td><code>np.argmax(pred, axis=1)</code></td></tr>
<tr><th scope="row">회귀</th><td><code>Dense(1)</code></td><td><code>'mse'</code></td><td><code>['mae']</code></td><td><code>pred.flatten()</code></td></tr>
</tbody>
</table>
</div>
<p class="v2-ap-note">문항 수와 배점, 지문이 요구하는 세부 값은 회차마다 달라질 수 있습니다. 응시 전 KT AICE 공식 공지를 확인하십시오.</p>
<p class="v2-ap-links"><a href="cheatsheet.html">시험장 치트시트</a><a href="ch08.html">Ch08 유형별 완성 코드</a><a href="mock01.html">모의고사 1회</a><a href="index.html">목차</a></p>
</section>
"""


def code_block(code: str) -> str:
    return f'<pre><code class="language-python">{html.escape(code)}\n</code></pre>'


def render_unit(unit: dict) -> str:
    flow = "".join(f"<li>{html.escape(step)}</li>" for step in unit["flow"])
    rows = "".join(f"<tr><th scope=\"row\">{name}</th><td>{value}</td></tr>" for name, value in unit["values"])
    recall = "".join(f"<li>{q}</li>" for q in unit["recall"])
    second = ""
    if unit.get("code2"):
        second = f'<p class="v2-ap-sub">{html.escape(unit["code2_title"])}</p>\n{code_block(unit["code2"])}\n'
    return f"""<section class="v2-ap v2-wide" aria-labelledby="{unit["id"]}">
<h2 id="{unit["id"]}">{html.escape(unit["title"])}</h2>
<p class="v2-ap-where">쓰는 곳: {html.escape(unit["where"])}</p>

<div class="v2-ap-block">
<p class="v2-ap-head"><span class="v2-ap-tier v2-ap-tier--1">1단 흐름</span></p>
<ol class="v2-ap-flow">{flow}</ol>
<p class="v2-ap-chant">앞 글자로 줄이면: {html.escape(unit["chant"])}</p>
</div>

<div class="v2-ap-block">
<p class="v2-ap-head"><span class="v2-ap-tier v2-ap-tier--2">2단 줄</span></p>
{code_block(unit["code"])}
{second}</div>

<div class="v2-ap-block">
<p class="v2-ap-head"><span class="v2-ap-tier v2-ap-tier--3">3단 값</span></p>
<div class="table-scroll" role="region" tabindex="0" aria-label="{html.escape(unit["title"])} — 바뀌는 자리와 값">
<table class="v2-ap-table">
<thead><tr><th>바뀌는 자리</th><th>넣을 값</th></tr></thead>
<tbody>{rows}</tbody>
</table>
</div>
<p class="v2-ap-fixed"><strong>고정</strong> {unit["fixed"]}</p>
</div>

<details class="v2-ap-recall">
<summary>가리고 떠올리기</summary>
<ol>{recall}</ol>
</details>
</section>
"""


def render() -> str:
    overview = "\n".join(
        f'<tr><th scope="row"><a href="#{u["id"]}">{html.escape(u["title"])}</a></th>'
        f'<td>{html.escape(u["where"])}</td><td>{html.escape(" → ".join(u["flow"]))}</td></tr>'
        for u in UNITS
    )
    parts = [INTRO.replace("{overview}", overview)]
    parts += [render_unit(u) for u in UNITS]
    parts.append(OUTRO)
    return "\n".join(parts)


def verify() -> int:
    """부록의 모든 코드를 실린 순서대로 이어 붙여 실행한다(함수형 모델은 Sequential 뒤에 덮어쓴다)."""
    chunks = [SETUP]
    for unit in UNITS:
        chunks.append(f'print("### {unit["id"]}")')
        chunks.append(unit["code"])
        if unit.get("code2"):
            chunks.append(unit["code2"])
    script = "\n".join(chunks).replace("epochs=50", "epochs=3")
    with tempfile.TemporaryDirectory(prefix="appendix_") as tmp:
        path = Path(tmp) / "run.py"
        path.write_text(script, encoding="utf-8")
        env = dict(os.environ, TF_CPP_MIN_LOG_LEVEL="3", MPLBACKEND="Agg")
        proc = subprocess.run([sys.executable, str(path)], cwd=tmp, capture_output=True, text=True, env=env)
    reached = proc.stdout.count("### ")
    ok = proc.returncode == 0 and reached == len(UNITS)
    print(f'부록 코드 실행 검증: {"PASS" if ok else "FAIL"} — {reached}/{len(UNITS)} 묶음 실행')
    if not ok:
        print(proc.stdout[-800:])
        print(proc.stderr[-2000:])
    return 0 if ok else 1


def main() -> int:
    if "--verify" in sys.argv:
        return verify()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(render(), encoding="utf-8")
    print(f"생성: {OUT.relative_to(ROOT)} ({len(UNITS)}개 묶음)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
