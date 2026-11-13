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
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
OUT = ROOT / "_workspace" / "pages" / "appendix.html"
DATA = ROOT / "assets" / "data" / "appendix_units.json"

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


# ---------------------------------------------------------------------------
# 기억을 돕는 장치 (묶음 id → 내용)
#   why   순서에 이유를 붙여 외운다(뜻이 있는 순서는 덜 잊는다)
#   task  "보지 않고 써 보기" 연습의 조건 — 채점 규칙이 요구하는 값은 모두 여기에 적는다
#   rules 정적 채점 규칙(assets/js/grader-core.js 문법, _workspace/v2/SPEC.md §2)
# ---------------------------------------------------------------------------
def _tok(value, label, hint):
    return {"type": "token", "value": value, "label": label, "hint": hint}


def _re(pattern, label, hint):
    return {"type": "regex", "pattern": pattern, "label": label, "hint": hint}


def _call(callee, label, hint, assign=None, params=None):
    rule = {"type": "call", "callee": callee, "label": label, "hint": hint}
    if assign:
        rule["assign"] = assign
    if params:
        rule["params"] = params
    return rule


PRACTICE = {
    "ap-import": {
        "why": "뒤에서 쓰는 순서대로 가져옵니다. 데이터를 다루는 도구, 그리는 도구, 나누고 맞추는 도구, 마지막에 신경망 도구입니다. 텐서플로를 첫 줄에 두면 일부 환경에서 학습 셀이 멈추는 문제를 피할 수 있습니다.",
        "task": "위 2단 코드와 같은 열두 줄을 씁니다. 별칭은 `tf`, `np`, `pd`, `plt`, `sns`입니다.",
        "rules": [
            _tok("import tensorflow as tf", "텐서플로", "첫 줄은 텐서플로이고 별칭은 tf 입니다."),
            _tok("import numpy as np", "넘파이", "별칭 np 를 확인하세요."),
            _tok("import pandas as pd", "판다스", "별칭 pd 를 확인하세요."),
            _tok("import matplotlib.pyplot as plt", "맷플롯립", "matplotlib 뒤에 .pyplot 이 붙고 별칭은 plt 입니다."),
            _tok("import seaborn as sns", "시본", "별칭 sns 를 확인하세요."),
            _tok("from sklearn.model_selection import train_test_split", "분리 함수", "train_test_split 은 sklearn.model_selection 에 있습니다."),
            _re(r"from sklearn\.preprocessing import [^\n]*StandardScaler", "스케일러", "스케일러는 sklearn.preprocessing 에 있습니다."),
            _re(r"from sklearn\.ensemble import [^\n]*RandomForestClassifier", "머신러닝 모델", "랜덤 포레스트는 sklearn.ensemble 에 있습니다."),
            _re(r"from sklearn\.metrics import [^\n]*accuracy_score", "지표", "지표 함수는 sklearn.metrics 에 있습니다."),
            _re(r"from tensorflow\.keras\.models import [^\n]*Sequential", "케라스 모델", "Sequential 과 Model 은 tensorflow.keras.models 에 있습니다."),
            _re(r"from tensorflow\.keras\.layers import [^\n]*Dense", "케라스 층", "Input, Dense, Dropout 은 tensorflow.keras.layers 에 있습니다."),
            _re(r"from tensorflow\.keras\.callbacks import [^\n]*EarlyStopping", "케라스 콜백", "콜백은 tensorflow.keras.callbacks 에 있습니다."),
        ],
    },
    "ap-prep": {
        "why": "빈 값이 있으면 분위수 계산이 흔들리므로 결측치를 먼저 채웁니다. 행을 지우면 인덱스에 구멍이 생기니 바로 다시 매깁니다. 인코딩은 행이 확정된 뒤에 합니다.",
        "task": "`age`의 결측치를 중앙값으로 채우고, `monthly_fee`의 IQR 1.5배 범위 밖 행을 지운 뒤 인덱스를 다시 매기고, `contract`를 정수 0/1로 원-핫 인코딩합니다. 분위수 변수는 `q1`, `q3`, `iqr`입니다.",
        "rules": [
            _call(".fillna", "결측치를 중앙값으로", "age 컬럼의 중앙값을 구해 채우세요.", params=[{"pos": 0, "kw": "value", "value": {"contains": [".median()"]}}]),
            {"type": "assign", "var": "df['age']", "label": "채운 결과 다시 대입", "hint": "fillna 결과를 df['age'] 에 다시 넣어야 반영됩니다."},
            _tok([".quantile(0.25)", ".quantile(q=0.25)"], "Q1", "1사분위수는 quantile(0.25) 입니다."),
            _tok([".quantile(0.75)", ".quantile(q=0.75)"], "Q3", "3사분위수는 quantile(0.75) 입니다."),
            {"type": "assign", "var": "iqr", "contains": ["q3 - q1"], "label": "IQR", "hint": "IQR 은 q3 에서 q1 을 뺀 값입니다."},
            _tok(["1.5 * iqr", "iqr * 1.5"], "경계 1.5배", "하한과 상한에 1.5 * iqr 을 씁니다."),
            _call(".reset_index", "인덱스 다시 매기기", "행을 지운 뒤 reset_index(drop=True) 를 붙이세요.", params=[{"kw": "drop", "value": "True"}]),
            _call("pd.get_dummies", "원-핫 인코딩", "columns 에 contract, dtype 에 int 를 주세요.", assign="df", params=[{"kw": "columns", "value": "['contract']"}, {"kw": "dtype", "value": ["int", "'int'", "'int64'", "np.int64"]}]),
        ],
    },
    "ap-split": {
        "why": "정답을 떼어 내야 나눌 수 있고, 나눈 뒤에야 학습 데이터만으로 기준을 잡을 수 있습니다. 평가 데이터로 기준을 잡으면 시험 문제를 미리 본 것과 같습니다.",
        "task": "타깃은 `churn`입니다. 8:2로 나누고 `random_state=42`, 층화 추출을 씁니다. `StandardScaler`를 `scaler`에 담고 결과를 `X_train_scaled`, `X_test_scaled`에 저장합니다.",
        "rules": [
            _call(".drop", "특성 X", "타깃 컬럼을 뺀 나머지가 X 입니다.", assign="X", params=[{"kw": "columns", "value": ["['churn']", "'churn'"]}]),
            {"type": "assign", "var": "y", "contains": ["df['churn']", "df.churn"], "label": "타깃 y", "hint": "y 는 churn 컬럼입니다."},
            _call("train_test_split", "분리", "변수 네 개의 순서와 test_size, random_state, stratify 를 확인하세요.", assign="X_train, X_test, y_train, y_test",
                  params=[{"kw": "test_size", "value": "0.2"}, {"kw": "random_state", "value": "42"}, {"kw": "stratify", "value": "y"}]),
            _call("StandardScaler", "스케일러 만들기", "StandardScaler() 를 scaler 에 담으세요.", assign="scaler"),
            _call("scaler.fit_transform", "학습 데이터에 fit_transform", "학습 데이터에는 fit_transform 을 씁니다.", assign="X_train_scaled", params=[{"pos": 0, "value": "X_train"}]),
            _call("scaler.transform", "평가 데이터에 transform", "평가 데이터에는 transform 만 씁니다.", assign="X_test_scaled", params=[{"pos": 0, "value": "X_test"}]),
            {"type": "forbid", "value": ["fit_transform(X_test)", "fit(X_test)"], "label": "평가 데이터로 기준을 잡지 않기", "hint": "평가 데이터에 fit 을 쓰면 데이터 누수입니다."},
        ],
    },
    "ap-ml": {
        "why": "모델이 있어야 학습시킬 수 있고, 학습한 뒤에야 예측할 수 있으며, 예측이 있어야 정답과 비교할 수 있습니다.",
        "task": "랜덤 포레스트 분류 모델을 `n_estimators=100`, `random_state=42`로 만들어 `rf_model`에 담고, `X_train`으로 학습해 `X_test`의 예측을 `rf_pred`에 저장한 뒤 정확도를 출력합니다.",
        "rules": [
            _call("RandomForestClassifier", "모델 만들기", "n_estimators 와 random_state 를 확인하세요.", assign="rf_model", params=[{"kw": "n_estimators", "value": "100"}, {"kw": "random_state", "value": "42"}]),
            _call("rf_model.fit", "학습", "fit 에는 학습 X, 학습 y 순서로 넣습니다.", params=[{"pos": 0, "value": "X_train"}, {"pos": 1, "value": "y_train"}]),
            _call("rf_model.predict", "예측", "평가 X 를 넣고 rf_pred 에 담으세요.", assign="rf_pred", params=[{"pos": 0, "value": "X_test"}]),
            _call("accuracy_score", "정확도", "첫 인자가 정답, 둘째가 예측입니다.", params=[{"pos": 0, "kw": "y_true", "value": "y_test"}, {"pos": 1, "kw": "y_pred", "value": "rf_pred"}]),
            _tok("print(", "출력", "결과는 print 로 화면에 남깁니다."),
        ],
    },
    "ap-model": {
        "why": "데이터가 지나가는 순서 그대로입니다. 들어오는 모양을 먼저 알리고, 가운데에서 특징을 뽑고, 마지막 층이 문제 유형에 맞는 답의 모양을 만듭니다.",
        "task": "Sequential 방식으로 씁니다. 입력은 `X_train_scaled`의 특성 수, 은닉층은 64와 32(`relu`), 그 사이에 `Dropout(0.3)`, 출력층은 이진분류입니다. 변수는 `model`입니다.",
        "rules": [
            _call("Sequential", "빈 모델", "Sequential() 을 model 에 담으세요.", assign="model"),
            _call("Input", "입력", "shape 은 (특성 수,) 이며 쉼표가 필요합니다.", params=[{"kw": "shape", "value": ["(X_train_scaled.shape[1],)", "(X_train_scaled.shape[-1],)", "X_train_scaled.shape[1:]"]}]),
            _call("Dense", "은닉층 64", "노드 64, 활성화 relu 입니다.", params=[{"pos": 0, "kw": "units", "value": "64"}, {"kw": "activation", "value": "'relu'"}]),
            _call("Dropout", "Dropout", "비율은 0.3 입니다.", params=[{"pos": 0, "kw": "rate", "value": "0.3"}]),
            _call("Dense", "은닉층 32", "노드 32, 활성화 relu 입니다.", params=[{"pos": 0, "kw": "units", "value": "32"}, {"kw": "activation", "value": "'relu'"}]),
            _call("Dense", "출력층", "이진분류는 노드 1개와 sigmoid 입니다.", params=[{"pos": 0, "kw": "units", "value": "1"}, {"kw": "activation", "value": "'sigmoid'"}]),
            {"type": "forbid", "value": "input_shape", "label": "input_shape 쓰지 않기", "hint": "입력은 Input(shape=…) 으로 정의합니다."},
        ],
    },
    "ap-fit": {
        "why": "학습 방법을 정해야(compile) 학습을 시작할 수 있습니다. 콜백은 학습 도중에 불리므로 fit 보다 먼저 만들어 두어야 합니다.",
        "task": "`adam`, 이진분류 손실, 정확도로 컴파일합니다. `es`는 `val_loss`를 보고 5번 참으며 가장 좋은 가중치로 되돌립니다. `mc`는 `best_model.keras`에 가장 좋은 모델만 저장합니다. 검증 20%, 50 에포크, 배치 32로 학습해 `history`에 담습니다.",
        "rules": [
            _call("model.compile", "컴파일", "optimizer, loss, metrics 세 인자를 확인하세요.", params=[
                {"kw": "optimizer", "value": "'adam'"}, {"kw": "loss", "value": "'binary_crossentropy'"}, {"kw": "metrics", "value": "['accuracy']"}]),
            _call("EarlyStopping", "조기 종료", "monitor, patience, restore_best_weights 를 확인하세요.", assign="es", params=[
                {"kw": "monitor", "value": "'val_loss'"}, {"kw": "patience", "value": "5"}, {"kw": "restore_best_weights", "value": "True"}]),
            _call("ModelCheckpoint", "최적 모델 저장", "파일 이름, monitor, save_best_only 를 확인하세요.", assign="mc", params=[
                {"pos": 0, "kw": "filepath", "value": "'best_model.keras'"}, {"kw": "monitor", "value": "'val_loss'"}, {"kw": "save_best_only", "value": "True"}]),
            _call("model.fit", "학습", "validation_split, epochs, batch_size, callbacks 를 확인하세요.", assign="history", params=[
                {"pos": 0, "kw": "x", "value": "X_train_scaled"}, {"pos": 1, "kw": "y", "value": "y_train"},
                {"kw": "validation_split", "value": "0.2"}, {"kw": "epochs", "value": "50"}, {"kw": "batch_size", "value": "32"},
                {"kw": "callbacks", "value": ["[es, mc]", "[mc, es]"]}]),
        ],
    },
    "ap-curve": {
        "why": "그릴 선을 먼저 올리고, 그 선이 무엇인지 알려 주는 축 이름과 범례를 붙인 다음, 마지막에 화면에 내보냅니다.",
        "task": "학습 손실과 검증 손실을 한 그래프에 그립니다. 선마다 `label`을 주고, x축 `epoch`, y축 `loss`, 범례를 붙여 출력합니다.",
        "rules": [
            _tok("history.history['loss']", "학습 손실", "history 를 두 번 쓰고 키는 'loss' 입니다."),
            _tok("history.history['val_loss']", "검증 손실", "검증 쪽 키는 앞에 val_ 이 붙습니다."),
            _re(r"plt\.plot\([^\n]*label=", "선 이름", "plot 에 label 을 주어야 범례에 나옵니다."),
            _call("plt.xlabel", "x축 이름", "x축은 'epoch' 입니다.", params=[{"pos": 0, "value": "'epoch'"}]),
            _call("plt.ylabel", "y축 이름", "y축은 'loss' 입니다.", params=[{"pos": 0, "value": "'loss'"}]),
            _tok("plt.legend()", "범례", "plt.legend() 가 있어야 label 이 보입니다."),
            _tok("plt.show()", "출력", "마지막 줄은 plt.show() 입니다."),
        ],
    },
    "ap-eval": {
        "why": "먼저 전체 점수를 확인하고, 그다음 한 건씩의 예측을 받아 정답과 같은 모양으로 바꾼 뒤, 클래스별로 어디에서 틀렸는지 봅니다.",
        "task": "테스트 데이터로 평가해 `loss`, `acc`에 받고, 예측 확률을 `pred`에, 0.5 기준으로 바꾼 1차원 결과를 `y_pred`에 저장한 뒤 분류 리포트와 혼동 행렬을 출력합니다.",
        "rules": [
            _call("model.evaluate", "평가", "평가 X, 평가 y 순서이며 결과를 loss, acc 로 받습니다.", assign="loss, acc", params=[{"pos": 0, "kw": "x", "value": "X_test_scaled"}, {"pos": 1, "kw": "y", "value": "y_test"}]),
            _call("model.predict", "예측", "평가 X 를 넣고 pred 에 담으세요.", assign="pred", params=[{"pos": 0, "kw": "x", "value": "X_test_scaled"}]),
            {"type": "assign", "var": "y_pred", "contains": ["pred > 0.5"], "label": "0.5 기준으로 변환", "hint": "확률이 0.5 보다 큰지 비교합니다."},
            _re(r"y_pred=[^\n]*\.astype\((int|'int\d*'|np\.int\d+)\)", "정수로 바꾸기", "비교 결과에 .astype(int) 를 붙입니다."),
            _re(r"y_pred=[^\n]*(\.flatten\(\)|\.ravel\(\)|\.reshape\(-1\)|\.squeeze\(\))", "1차원으로 펴기", "(N, 1) 을 (N,) 으로 펴는 메서드를 붙입니다."),
            _call("classification_report", "분류 리포트", "정답, 예측 순서입니다.", params=[{"pos": 0, "kw": "y_true", "value": "y_test"}, {"pos": 1, "kw": "y_pred", "value": "y_pred"}]),
            _call("confusion_matrix", "혼동 행렬", "정답, 예측 순서입니다.", params=[{"pos": 0, "kw": "y_true", "value": "y_test"}, {"pos": 1, "kw": "y_pred", "value": "y_pred"}]),
        ],
    },
    "ap-new": {
        "why": "새 입력도 학습 데이터가 지나온 길을 똑같이 지나가야 합니다. 표로 만들고, 같은 방법으로 인코딩하고, 같은 컬럼 구성으로 맞추고, 같은 스케일러를 거친 뒤에야 모델에 넣을 수 있습니다.",
        "task": "`new_data`를 1행 표 `new_df`로 만들고, `contract`를 정수 원-핫 인코딩한 뒤 컬럼을 `X.columns`에 맞춥니다. `scaler`로 변환해 `new_scaled`, 예측을 `new_pred`에 저장하고 확률을 출력합니다.",
        "keep": "new_data = {'age': 35, 'monthly_fee': 70.0, 'contract': 'month'}\n",
        "rules": [
            {"type": "any", "label": "1행 표 만들기", "hint": "딕셔너리를 대괄호로 감싸 DataFrame 에 넣습니다.", "rules": [
                _call("pd.DataFrame", "", "", assign="new_df", params=[{"pos": 0, "kw": "data", "value": "[new_data]"}]),
                _call("pd.DataFrame", "", "", assign="new_df", params=[{"pos": 0, "kw": "data", "value": "new_data"}, {"kw": "index", "value": "*"}]),
            ]},
            _call("pd.get_dummies", "같은 인코딩", "학습 때와 같은 columns 를 줍니다.", assign="new_df", params=[{"kw": "columns", "value": "['contract']"}]),
            _call(".reindex", "컬럼 맞추기", "columns 는 X.columns, 없는 컬럼은 0 으로 채웁니다.", assign="new_df", params=[{"kw": "columns", "value": "X.columns"}, {"kw": "fill_value", "value": "0"}]),
            _call("scaler.transform", "같은 스케일러로 변환", "이미 학습된 scaler 로 transform 만 합니다.", assign="new_scaled", params=[{"pos": 0, "value": "new_df"}]),
            _call("model.predict", "예측", "변환한 값을 넣고 new_pred 에 담으세요.", assign="new_pred", params=[{"pos": 0, "kw": "x", "value": "new_scaled"}]),
            {"type": "forbid", "value": ["fit_transform(new_df)", "scaler.fit(new_df)"], "label": "새 입력에 fit 쓰지 않기", "hint": "새 입력에는 fit 을 쓰지 않습니다."},
            _tok("print(", "출력", "결과는 print 로 화면에 남깁니다."),
        ],
    },
}

CIRCLED = "①②③④⑤⑥⑦⑧⑨"
for _unit in UNITS:
    _extra = PRACTICE[_unit["id"]]
    _unit.update(_extra)
    _unit["skeleton"] = _extra.get("keep", "") + "\n".join(
        f"# {CIRCLED[i]} {step}" for i, step in enumerate(_unit["flow"])
    ) + "\n"

INTRO = """<h1>부록 — 외워야 하는 코드 3단 분해</h1>
<p class="v2-ap-lead">시험은 제한적 오픈북이지만, 아래 아홉 묶음은 찾아보지 않고 바로 써야 시간이 남습니다. 긴 코드를 통째로 외우지 않고 세 단계로 나눠 외웁니다.</p>

<section class="v2-ap v2-wide" aria-labelledby="ap-how">
<h2 id="ap-how">3단 분해로 외우는 방법</h2>
<ol class="v2-ap-steps">
<li><span class="v2-ap-tier v2-ap-tier--1">1단 흐름</span><p>블록 전체를 낱말 네다섯 개의 순서로 줄입니다. 먼저 이 순서만 소리 내어 말할 수 있게 합니다.</p></li>
<li><span class="v2-ap-tier v2-ap-tier--2">2단 줄</span><p>순서의 낱말 하나를 코드 한두 줄로 바꿉니다. 주석의 번호가 1단의 순서와 같습니다.</p></li>
<li><span class="v2-ap-tier v2-ap-tier--3">3단 값</span><p>문제마다 바뀌는 자리와 넣을 값을 따로 외웁니다. 나머지는 손대지 않는 고정 부분입니다.</p></li>
</ol>
<p class="v2-ap-note">읽기만 해서는 잘 외워지지 않습니다. 묶음마다 아래 순서로 직접 꺼내 보십시오.</p>
<ol class="v2-ap-howto">
<li><strong>순서의 이유를 읽는다.</strong> 왜 이 순서인지 알면 낱말 순서를 덜 잊습니다.</li>
<li><strong>가리고 떠올린다.</strong> 2단 코드 위의 <em>값 가리기</em>는 이름과 값만, <em>줄 가리기</em>는 주석만 남기고 가립니다. 가린 자리를 누르면 하나씩 열립니다. 열기 전에 먼저 답을 말해 보십시오.</li>
<li><strong>보지 않고 써 본다.</strong> 1단 흐름만 주석으로 남은 셀에 코드를 쓰고 Shift+Enter로 확인합니다. 따옴표 종류와 띄어쓰기는 보지 않고, 변수 이름과 핵심 값을 봅니다.</li>
<li><strong>간격을 두고 다시 한다.</strong> 통과하면 다음 복습 날짜가 1일, 3일, 7일, 14일, 30일로 늘어납니다. 아래 복습 일정에서 오늘 할 묶음을 확인하십시오.</li>
</ol>
<div class="v2-ap-review" data-ap-review aria-live="polite"></div>
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
    return f"""<section class="v2-ap v2-wide" data-ap-unit="{unit["id"]}" aria-labelledby="{unit["id"]}">
<h2 id="{unit["id"]}">{html.escape(unit["title"])}</h2>
<p class="v2-ap-where">쓰는 곳: {html.escape(unit["where"])}</p>

<div class="v2-ap-block">
<p class="v2-ap-head"><span class="v2-ap-tier v2-ap-tier--1">1단 흐름</span></p>
<ol class="v2-ap-flow">{flow}</ol>
<p class="v2-ap-chant">앞 글자로 줄이면: {html.escape(unit["chant"])}</p>
<p class="v2-ap-why"><strong>순서의 이유</strong> {html.escape(unit["why"])}</p>
</div>

<div class="v2-ap-block" data-ap-code>
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
<summary>말로 확인하는 질문</summary>
<ol>{recall}</ol>
</details>

<div class="v2-ap-practice" data-ap-practice="{unit["id"]}"></div>
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


def practice_data() -> dict:
    return {
        "version": "2.0",
        "intervals_days": [1, 3, 7, 14, 30],
        "units": [
            {
                "id": u["id"],
                "title": u["title"],
                "task": u["task"],
                "skeleton": u["skeleton"],
                "answer_code": u.get("keep", "") + u["code"] if u["id"] != "ap-new" else u["code"],
                "rules": u["rules"],
            }
            for u in UNITS
        ],
    }


def verify_rules() -> int:
    """연습 채점 규칙: 2단 코드는 통과하고, 주석만 있는 뼈대는 통과하지 않아야 한다."""
    script = """
const g = require(process.argv[1]);
const d = JSON.parse(require('fs').readFileSync(process.argv[2], 'utf8'));
let bad = 0;
for (const u of d.units) {
  const base = g.grade(u.answer_code, u.rules);
  const fails = [];
  if (!base.pass) fails.push('모범 코드 불통과: ' + base.results.filter(r => !r.ok).map(r => r.label).join(', '));
  const v = g.variants(u.answer_code);
  for (const k of Object.keys(v)) if (!g.grade(v[k], u.rules).pass) fails.push('변형 ' + k + ' 불통과');
  if (g.grade(u.skeleton, u.rules).pass) fails.push('뼈대가 통과함');
  if (fails.length) { bad++; console.log('  FAIL ' + u.id + ': ' + fails.join(' / ')); }
}
console.log('부록 연습 채점 규칙: ' + (bad ? bad + '개 묶음 실패' : d.units.length + '/' + d.units.length + ' 묶음 통과'));
process.exit(bad ? 1 : 0);
"""
    proc = subprocess.run(
        ["node", "-e", script, str(ROOT / "assets" / "js" / "grader-core.js"), str(DATA)],
        capture_output=True, text=True,
    )
    print(proc.stdout.strip() or proc.stderr.strip()[-600:])
    return proc.returncode


def main() -> int:
    if "--verify" in sys.argv:
        return verify() or verify_rules()
    if "--verify-rules" in sys.argv:
        return verify_rules()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(render(), encoding="utf-8")
    DATA.write_text(json.dumps(practice_data(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"생성: {OUT.relative_to(ROOT)}, {DATA.relative_to(ROOT)} ({len(UNITS)}개 묶음)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
