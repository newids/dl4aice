# dl4aice v2.0 — 공용 명세 (데이터 스키마 · 모듈 인터페이스 · CSS 규칙)

이 문서는 v2 작업에 참여하는 모든 에이전트의 **단일 계약서**다. 여기 적힌 필드명·함수명·클래스명을 그대로 쓴다.

## 0. 아키텍처 원칙

- 프레임워크·번들러·외부 CDN·외부 폰트 금지. Vanilla JS(IIFE, `"use strict"`), 빌드 시간 0초.
- 사이트 루트는 `book/`(그리고 그 복사본 `docs/`). **정본 소스는 리포 루트의 `assets/`** 이며 빌드 스크립트가 `book/assets/`, `docs/assets/` 로 복사한다. → 에이전트는 `assets/` 와 `_workspace/` 만 수정한다. `book/`, `docs/` 를 직접 고치지 않는다.
- `file://` 로 열어도 동작해야 한다 → JSON 은 빌드가 `assets/data/<name>.js` 래퍼(`window.DL4AICE_DATA[name] = {...}`)로도 내보낸다. 모듈은 **반드시 `DL4AICE.data(name)`(Promise)** 로 데이터를 얻는다. `fetch` 를 직접 부르지 않는다.
- 빌드 산출 HTML 에는 HTML 주석(`<!-- -->`)을 넣지 않는다(자체 검증이 잔존 주석을 결함으로 잡는다).
- 페이지에는 `defer` 스크립트가 이 순서로 붙는다: `assets/data/*.js` → `dl4aice-core.js` → `grader-core.js` → 위젯 모듈들. 위젯은 `DL4AICE.ready(fn)` 안에서 자기 마운트 지점을 찾아 스스로 초기화한다.

## 1. 공용 런타임 (이미 작성됨 — 읽고 그대로 사용)

- `assets/js/dl4aice-core.js` → `window.DL4AICE`
  - `data(name)` → Promise<json> (`"arch_patterns" | "chapter_drills" | "mock_exams_14q" | "openbook_refs"`)
  - `store.get(key, fallback) / store.set(key, value) / store.remove(key)` (localStorage, 접두사 `dl4aice.v2.`)
  - `progress.markDrill(questionId, passed)`, `progress.isDrillDone(questionId)`, `progress.chapterStats(questionIds)`, `progress.recordMock(mockId, score, detail)`, `progress.mock(mockId)`, `progress.read()`; 변경 시 `document` 에 `dl4aice:progress` 이벤트
  - `toast(message, { type: "ok"|"err"|"info", title, timeout, html })`
  - `highlight(pythonCode)` → 이스케이프된 HTML (`.v2-tok-kw/.v2-tok-str/.v2-tok-num/.v2-tok-com/.v2-tok-fn/.v2-tok-blank`)
  - `richText(text)` → 지문용 미니 마크업(`` `code` ``, `**굵게**`, 빈 줄=문단, `- ` 목록) HTML
  - `escapeHtml(text)`, `el(tag, attrs, children)`, `copy(text)` → Promise<boolean>, `ready(fn)`, `theme.toggle()`
- `assets/js/grader-core.js` → `window.DL4AICE.grader` (Node 에서는 `require`)
  - `grade(code, rules)` → `{ pass, passed, total, blanks, empty, results: [{ ok, label, hint, detail }], normalized }`
  - `normalize(code)`, `countBlanks(code)`, `variants(code)`

## 2. 채점 규칙 (`validation_rules`) 문법

채점기는 코드를 실행하지 않는다. 주석·공백·줄바꿈을 버리고 따옴표를 `'` 로, 숫자를 표준형(`.20` → `0.2`)으로 통일한 **토큰열**에 규칙을 적용한다. 답안에 `___` 가 하나라도 남으면 자동 오답.

모든 규칙 공통 필드: `type`, `label`(체크리스트에 보일 짧은 이름, 한국어), `hint`(오답 시 보여줄 구체적 힌트 — **정답을 통째로 주지 말고** 무엇을 확인할지 알려준다).

| type | 필드 | 의미 |
|------|------|------|
| `call` | `callee`, `assign?`, `params?` | 해당 함수/클래스 **호출 1건**이 조건을 모두 만족. 키워드 인자 순서 무관 |
| `assign` | `var`, `contains?` | `var = ...` 대입문 존재. `contains` 가 있으면 우변에 그 토큰열 포함 |
| `token` | `value` | 토큰열이 연속으로 존재 (`"model.summary()"`) |
| `regex` | `pattern`, `flags?` | **정규화된 코드 문자열**에 정규식 매칭 (공백 없음·작은따옴표 기준으로 작성) |
| `forbid` | `value` 또는 `pattern` | 존재하면 오답 (`"input_shape"` 등 금지 패턴) |
| `order` | `values` | 토큰열들이 이 순서로 등장 (`["fit_transform(X_train)", "transform(X_test)"]`) |
| `any` / `all` | `rules` | 하위 규칙 중 하나 / 전부 통과 |

`call` 상세:
- `callee`: `"Dense"`(앞에 `layers.` 가 붙어도 매칭), `"model.compile"`, `"pd.get_dummies"`, `".fillna"`(앞 점 = 수신자 무관). 배열이면 대안.
- `assign`: 그 호출이 들어 있는 문장의 좌변. `"es"`, `"X_train, X_test, y_train, y_test"`. **문제에서 변수명을 지정했다면 반드시 넣는다.**
- `params`: `[{ "kw": "monitor", "value": "'val_loss'" }, { "pos": 0, "kw": "units", "value": "1" }]`
  - `kw` 만: 키워드 인자 필수. `pos` 만: 그 위치의 위치 인자. 둘 다: 어느 쪽으로 써도 인정.
  - `value`: 파이썬 소스 조각 문자열(문자열 값은 따옴표 포함: `"'relu'"`). 배열 = 대안(`["['accuracy']", "['acc']"]`). `"*"` = 값 무관(존재만). 객체: `{ "min": 1, "max": 50, "int": true }` 숫자 범위, `{ "re": "^\\d+$" }` 정규식, `{ "contains": ".median()" }` 토큰열 포함.
  - `"absent": true` → 그 인자가 **없어야** 통과.
- `value`, `token.value`, `order.values[i]`, `assign.var`, `assign.contains` 는 배열로 대안을 줄 수 있다.

작성 원칙:
- 문항당 규칙 2~6개. **빈칸/요구사항마다 최소 1개 규칙**이 그것을 직접 검증해야 한다(빈칸을 아무 값으로 채워도 통과되면 안 된다).
- 동치 표현은 대안으로 허용한다: `metrics=['accuracy']`/`['acc']`, `loss='mse'`/`'mean_squared_error'`, `Dense(1)`/`Dense(units=1)`, `axis=1`/`axis=-1` 등.
- 규칙 검증은 `node scripts/v2/test_grader.js <json 파일>` 로 한다(§6).

## 3. `assets/data/chapter_drills.json`

```json
{
  "version": "2.0",
  "items": [
    {
      "chapter": 4,
      "question_id": "ch04-q3",
      "title": "이진분류 모델 구성",
      "source": "Ch04 확인 문제 Q3 (코드 빈칸 · 기본)",
      "difficulty": "기본",
      "prompt": "지문. 요구사항과 **지정 변수명**(`model` 등)을 명시. richText 미니 마크업 사용.",
      "skeleton_code": "model = Sequential()\nmodel.add(Input(shape=(___,)))\n...",
      "answer_code": "빈칸을 모두 채운 모범 답안 전체 코드",
      "validation_rules": [ { "type": "call", "...": "..." } ],
      "negative_tests": [ { "code": "그럴듯한 오답 전체 코드", "reason": "왜 틀렸는가" } ],
      "expected_output": "정답 시 보여줄 가상 실행 결과 (실제 실행 출력을 붙여 넣는다. model.summary() 표 등)",
      "explanation": "해설: 왜 이렇게 푸는가 + 자주 틀리는 지점. richText 미니 마크업."
    }
  ]
}
```

- 기존 확인 문제(`_workspace/exams/ch{NN}_quiz.md`)와 **같은 수, 같은 순서**로 1:1 변환한다: ch01 4 / ch02 6 / ch03 5 / ch04 6 / ch05 6 / ch06 5 / ch07 5 / ch08 5 = 42문항. `question_id` 는 `ch{NN}-q{n}`.
- 객관식·오류 찾기 문항도 같은 개념을 묻는 **주피터 셀 코드 빈칸 채우기**로 바꾼다(오류 찾기 → "오류가 난 코드를 고쳐 완성하시오" 형태의 빈칸).
- `skeleton_code` 의 빈칸은 정확히 `___`(밑줄 3개). 문항당 빈칸 1~5개. 빈칸 외 코드는 완성되어 있어야 한다.
- `negative_tests` 최소 1개(변수명 오타, 잘못된 loss/activation 같은 **실제 수험생 오답**). skeleton 그대로도 자동으로 오답 검사된다.
- `expected_output` 은 가능한 한 모범 답안을 실제 실행해 얻은 출력으로 채운다(이 환경에 tensorflow, scikit-learn, pandas 설치됨).
- 교재 표준을 지킨다: 입력은 `Input(shape=(n,))`(Dense 의 `input_shape` 금지), 저장은 `.keras`, CNN/RNN 등 범위 밖 금지 (`.claude/skills/aice-domain/SKILL.md`).

## 4. `assets/data/mock_exams_14q.json`

```json
{
  "version": "2.0",
  "pass_score": 80,
  "time_limit_min": 90,
  "parts": [
    { "id": "preprocess", "label": "탐색·전처리", "questions": [1,2,3,4,5,6,7] },
    { "id": "ml", "label": "머신러닝", "questions": [8,9,10] },
    { "id": "dl_model", "label": "딥러닝 모델링 (유형 13)", "questions": [11,12,13] },
    { "id": "dl_infer", "label": "딥러닝 추론 (유형 14)", "questions": [14] }
  ],
  "exams": [
    {
      "id": "mock01",
      "title": "실전 모의고사 1회 — 이진분류: 통신사 고객 이탈 예측",
      "task_type": "binary",
      "scenario": "시나리오 설명 2~4문장",
      "dataset": {
        "file": "telecom_churn.csv",
        "target": "churn",
        "description": "데이터 설명",
        "columns": [ { "name": "tenure", "dtype": "int", "desc": "가입 개월 수" } ],
        "setup_code": "독자가 로컬에서 동일 CSV 를 만드는 파이썬 코드 (문제가 아님)"
      },
      "variables": [ { "name": "df", "role": "원본 데이터프레임" } ],
      "questions": [
        {
          "no": 1, "part": "preprocess", "title": "패키지 임포트와 데이터 로드",
          "points": 4, "minutes": 4,
          "prompt": "지시형 지문 (지정 변수명 명시)",
          "skeleton_code": "...___...",
          "answer_code": "...",
          "validation_rules": [],
          "negative_tests": [ { "code": "...", "reason": "..." } ],
          "expected_output": "실제 실행 출력",
          "explanation": "해설 + 자주 틀리는 지점"
        }
      ]
    }
  ]
}
```

14문항 공통 구조와 배점(합계 100, 세 회차 동일):

| no | part | 내용 | points |
|----|------|------|--------|
| 1 | preprocess | 패키지 임포트 + CSV 로드 + shape/info 확인 | 4 |
| 2 | preprocess | 탐색: 타깃 분포·결측 확인 + seaborn 시각화 ① (`countplot`/`histplot`) | 4 |
| 3 | preprocess | 시각화 ② (`boxplot` 또는 상관 `heatmap`) | 6 |
| 4 | preprocess | 결측치 처리 | 6 |
| 5 | preprocess | 이상치 제거(IQR 등) + 불필요 컬럼 제거 | 6 |
| 6 | preprocess | 범주형 인코딩 (`get_dummies` / `LabelEncoder`) | 7 |
| 7 | preprocess | X·y 분리 + `train_test_split` + 스케일링(`StandardScaler`/`MinMaxScaler`) | 7 |
| 8 | ml | `DecisionTree` 학습·평가 | 7 |
| 9 | ml | `RandomForest` 학습·평가 | 7 |
| 10 | ml | `XGBoost` 또는 `LightGBM` 학습·평가 + 세 모델 비교 | 8 |
| 11 | dl_model | 딥러닝 모델 설계 + `compile` | 9 |
| 12 | dl_model | 콜백(`EarlyStopping`, `ModelCheckpoint`) 적용 학습 | 9 |
| 13 | dl_model | `history` 학습 곡선 시각화 | 8 |
| 14 | dl_infer | 검증(테스트) 성능 평가 + **신규 입력 샘플(Simulation Input) 전처리·예측값 도출** | 12 |

- Q11 의 API: mock01 = **Sequential**, mock02 = **Functional**(`Input`, `Dense`, `Model`), mock03 = **Functional**. 해설에는 다른 API 로 쓴 동치 코드를 함께 싣는다.
- 14문항은 **앞 문항 변수를 이어받는 하나의 파이프라인**이다. 표준 변수명: `df`, `X`, `y`, `X_train`, `X_test`, `y_train`, `y_test`, `scaler`, `X_train_scaled`, `X_test_scaled`, `dt_model`, `rf_model`, `xgb_model`(또는 `lgbm_model`), `model`, `history`, `es`, `mc`, `pred`, `y_pred`, `new_data`, `new_scaled`, `new_pred`.
- Q14 는 `model.evaluate` 등 평가 + 지문에 제시한 신규 샘플 1~2건(딕셔너리/DataFrame)을 **학습 때와 같은 전처리(인코딩 컬럼 정렬 `reindex(columns=X.columns, fill_value=0)` → `scaler.transform`)** 로 변환해 예측값(이진: 확률→0/1, 다중: `argmax`→클래스명, 회귀: 값)을 구하게 한다. `scaler.fit_transform` 을 새 샘플에 쓰는 오답을 `forbid`/negative_tests 로 잡는다.
- 모의고사 skeleton 은 실기 시험처럼 빈칸이 넓어도 된다(문항당 빈칸 2~8개, 한 빈칸이 식 하나/인자 하나).
- **검증 필수**: `python3 scripts/v2/run_mock_answers.py <json 파일> <examId>` 가 `setup_code` + Q1~Q14 `answer_code` 를 이어 붙여 실제로 실행한다(epochs 는 자동으로 줄여 실행). 오류 0 이어야 한다. `expected_output` 은 지문의 원래 epochs 로 한 번 돌려 얻은 실제 출력(길면 핵심만 발췌, `...` 로 생략 표시).
- 재현성: `setup_code`·분리·모델에 `random_state=42`, 학습 전 `tf.keras.utils.set_random_seed(42)`.
- 기출 원문 복제 금지. 서두 고지 문구는 페이지가 붙인다.

## 5. `assets/data/arch_patterns.json`

```json
{
  "version": "2.0",
  "apis": [ { "id": "sequential", "label": "Sequential API" }, { "id": "functional", "label": "Functional API" } ],
  "tags": [
    { "id": "input", "label": "입력 shape" }, { "id": "output", "label": "출력층" },
    { "id": "loss", "label": "손실 함수" }, { "id": "metrics", "label": "평가지표" },
    { "id": "postprocess", "label": "예측 후처리" }, { "id": "api", "label": "API 차이" }
  ],
  "types": [
    {
      "id": "binary", "label": "이진분류", "short": "0/1 한 개의 확률",
      "label_format": "y 는 0/1 정수 (N,)",
      "summary": {
        "input_shape": "Input(shape=(n_features,))",
        "output_layer": { "units": "1", "activation": "'sigmoid'", "code": "Dense(1, activation='sigmoid')" },
        "compile": { "optimizer": "'adam'", "loss": "'binary_crossentropy'", "metrics": "['accuracy']" },
        "postprocess": "(pred > 0.5).astype(int)",
        "pitfall": "한 줄 주의점"
      },
      "code": {
        "sequential": [ { "text": "model = Sequential()", "tag": "api" }, { "text": "", "tag": null } ],
        "functional": [ { "text": "inputs = Input(shape=(n_features,))", "tag": "input" } ]
      }
    }
  ]
}
```

- `types` 는 정확히 4개, 이 순서: `binary`, `multiclass_onehot`, `multiclass_sparse`, `regression`.
- `code.*` 는 **줄 단위 배열**. `tag` 는 위 6개 id 중 하나 또는 `null`. 유형/API 를 바꿀 때 달라지는 줄에만 tag 를 단다(Diff 하이라이트 대상).
- 각 코드는 import → 모델 구성 → compile → fit(EarlyStopping 포함) → predict → 후처리까지 이어지는 완결 스니펫(25~40줄)이며 변수명은 `model`, `history`, `es`, `pred`, `y_pred`.

## 6. 검증 도구

- `node scripts/v2/test_grader.js <json>` — 스키마 필수 필드, 모범 답안 100% 통과(원본 + 따옴표/공백/키워드 순서 변형 4종), skeleton·negative_tests 오답 판정을 문항별로 검사.
- `python3 scripts/v2/run_mock_answers.py <json> [examId]` — 모의고사 답안 파이프라인 실제 실행.

## 7. 페이지 마운트 지점 (빌드가 HTML 에 심는다)

| 위젯 | 마운트 요소 | 모듈 |
|------|-------------|------|
| 유형·API 전환 | `<div class="v2-arch" data-v2-arch data-default-type="binary" data-default-api="sequential" data-focus="output,loss"></div>` | `arch-switcher.js` |
| 챕터 실습 셀 | `<section class="v2-drills" data-v2-drills data-chapter="4"></section>` | `code-grader.js` |
| CBT 모의고사 | `<div class="v2-cbt" data-v2-cbt data-mock="mock01"></div>` | `cbt-engine.js` |
| 오픈북 검색 | 마운트 요소 없음 — 모듈이 플로팅 버튼과 모달을 `body` 에 직접 만든다 | `openbook-modal.js` |
| 진도 대시보드 | `<section class="v2-dashboard" data-v2-dashboard></section>` | `dashboard.js` |

localStorage 키(접두사 `dl4aice.v2.` 는 `DL4AICE.store` 가 붙인다): `progress`, `draft.<questionId>`(챕터 실습 작성 중 코드), `cbt.<mockId>`(모의고사 상태), `arch`(마지막 선택), `theme`.

## 8. CSS 규칙

- 각 모듈은 자기 스타일을 `assets/css/_parts/<모듈>.css` 에 쓴다(리더가 `v2-widgets.css` 하나로 합친다). 접두사: `.v2-arch*`, `.v2-cell*`/`.v2-drills*`, `.v2-cbt*`, `.v2-ob*`.
- **색은 반드시 CSS 변수만** 사용한다(다크 모드가 변수 재정의로 동작). 사용할 변수 — 기존: `--ink --primary --primary-soft --accent --accent-soft --success --success-soft --danger --danger-soft --muted --line --line-soft --paper --backdrop --code-bg --code-fg --radius --radius-sm --shadow-sm --shadow-md --font-sans --font-mono --duration --ease`; v2 추가: `--v2-surface`(카드 배경) `--v2-surface-2`(한 단계 들어간 배경) `--v2-text-soft`(본문 보조 글자) `--v2-focus`(포커스 링).
- 공용 클래스(이미 `_parts/00-base.css` 에 정의, 재정의 금지): `.v2-btn`, `.v2-btn--primary`, `.v2-btn--ghost`, `.v2-btn--danger`, `.v2-btn--sm`, `.v2-badge`, `.v2-badge--ok/--warn/--err/--info`, `.v2-tabs` + `.v2-tab`(`aria-selected="true"`), `.v2-code`(다크 코드 블록 `<pre>`), `.v2-kbd`, `.v2-sr-only`, `.v2-toast*`, `.v2-tok-*`.
- 위젯 루트는 본문 그리드 안(`.page-body > *` 는 폭 760px 칼럼)에 놓인다. 더 넓게 쓰려면 루트에 `v2-wide` 클래스를 붙인다(최대 880px).
- 반응형: 320 / 768 / 1024px. 터치 타깃 44px 이상. `:focus-visible` 표시. `prefers-reduced-motion` 존중. 인쇄(`@media print`)에서는 플로팅 UI 숨김.
- 접근성: 탭은 `role="tablist"/"tab"/"tabpanel"` + 좌우 화살표 키, 모달은 `role="dialog" aria-modal="true"` + 포커스 트랩 + Esc 닫기, 상태 변화는 `aria-live`.
- 문구는 한국어, 이모지 사용 금지(아이콘이 필요하면 인라인 SVG 또는 텍스트).
