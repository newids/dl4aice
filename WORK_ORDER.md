# [WORK ORDER] dl4aice v2.0 전면 고도화 자율 실행 지시서

## 1. 프로젝트 개요 및 실행 원칙 (Autonomous Execution Policy)

본 작업은 기존 정적 웹 수험서(`dl4aice`)의 자산(HTML 구조, CSS 디자인, 46개 시각 도해)을 100% 보존하면서, 최신 AICE Associate 실기 출제 기준(14문항 체제, 유형 13 모델링 + 유형 14 시뮬레이션 예측 연계, 제한적 오픈북 환경, Sequential/Functional API 병행)을 반영한 **인터랙티브 CBT 학습 플랫폼**으로 업그레이드하는 것이다.

### 핵심 작동 규칙 (무중단 자율 실행 및 사후 일괄 수정)
1. **Zero-Interruption (인간 승인 최소화)**:
   - Stage 1부터 Stage 5까지는 **사용자에게 중간 확인이나 진행 승인을 요청하지 말고 완료 즉시 다음 Stage로 자동 전환**하여 끝까지 완주하라.
   - 파일 생성, 기존 파일 수정, 디렉토리 구조 변경, 자체 테스트 스크립트 실행 등 모든 작업을 자율적으로 수행하라.
2. **Zero-Migration (기존 아키텍처 보존)**:
   - 무거운 프론트엔드 프레임워크(React, Next.js 등)나 무거운 브라우저 런타임(Pyodide 등)을 도입하지 마라.
   - 기존 Vanilla HTML/CSS 구조 위에 **모듈형 Vanilla JS 컴포넌트 + 정적 JSON 데이터셋 + 정규식/토큰 기반 즉시 채점기**를 결합하여 빌드 시간 0초를 유지하라.
3. **Batch Feedback Loop (완성 후 일괄 피드백 반영)**:
   - 모든 파일 생성과 자체 검증(Stage 5)이 100% 완료된 시점에 단 한 번 최종 완료 리포트를 출력하고, 사용자의 개선 요구사항을 일괄 수집하여 한 번에 패치하는 구조로 동작하라.

---

## 2. 가용 모델별 최적 할당 전략 (Model Routing Matrix)

작업의 성격, 컨텍스트 크기, 추론 난이도에 따라 클로드 맥스(Claude Max) 및 제미나이 프로(Gemini Pro) 환경의 가용 모델을 아래 기준에 맞춰 분배·호출하라.

| 모델 티어 | 권장 할당 작업 (Task Scope) | 운용 방식 |
| :--- | :--- | :--- |
| **Claude Opus**<br>(`claude-opus` / 메인 오케스트레이터) | • 전체 아키텍처 설계 및 모듈 간 인터페이스(데이터 스키마) 정의<br>• 정적 코드 채점기(`code-grader.js`)의 정규식/토큰 판별 로직 및 엣지 케이스 설계<br>• 1~10번(전처리/ML) → 11~14번(딥러닝/추론) 파이프라인의 논리적 정합성 최종 검증<br>• Stage 6 사용자 일괄 피드백 분석 및 통합 패치 지휘 | 단일 메인 세션에서 핵심 의사결정 및 고난도 로직 작성 |
| **Claude Sonnet**<br>(`claude-sonnet` / 병렬 Sub-agents) | • 인터랙티브 UI 위젯 4종(`arch-switcher`, `code-grader`, `cbt-engine`, `openbook-modal`) 병렬 코딩<br>• `ch01~08.html`, `mock01~03.html`, `cheatsheet.html` DOM 조작 및 스타일링<br>• 반응형 레이아웃 및 다크모드 CSS 보정 | `Task` 도구를 활용해 독립적인 서브에이전트 3~4개를 동시에 띄워 병렬 처리 |
| **Claude Haiku**<br>(`claude-haiku` / 고속 탐색·검증) | • 리포지토리 파일 트리 스캔 및 기존 HTML 내 클래스/ID/도해 경로 추출<br>• HTML 링크 무결성 검사, JSON 구문(Syntax) 유효성 체크, 보일러플레이트 태그 일괄 치환 | 단순 반복 작업 및 Stage 5 빠른 정적 검증에 활용 |
| **Gemini Pro**<br>(CLI 연동 가능 시 대용량 데이터 생성기) | • 기존 전체 HTML 소스를 단일 컨텍스트로 입력받아 분석<br>• 42개 빈칸 채우기 문제(`chapter_drills.json`) 및 14문항 모의고사 3회분(`mock_exams_14q.json`) 대량 JSON 생성 및 오타/정규식 교차 감사(Audit) | 로컬 환경에서 Gemini CLI/API 호출이 가능할 경우 대규모 JSON 생성에 우선 활용하고, 불가할 경우 **Sonnet 병렬 서브에이전트**로 즉시 대체하여 중단 없이 진행 |

---

## 3. 단계별 무중단 작업 명세 (Stage-by-Stage Pipeline)

각 Stage는 완료 조건(Exit Criteria)이 충족되면 **사용자 승인 없이 즉시 다음 Stage로 넘어간다.**

### [Stage 1] 리포지토리 스캔 및 표준 데이터 스키마 확정
* **담당 모델**: Haiku (파일 스캔) + Opus (스키마 확정)
* **수행 내용**:
  1. 현재 워크스페이스의 `index.html`, `ch01.html`~`ch08.html`, `mock01.html`~`mock02.html` 및 CSS/이미지 경로를 전수 스캔한다.
  2. 기존 스타일시트의 디자인 토큰(색상, 폰트, 카드 레이아웃, 코드 블록 스타일)을 파악하여 신규 위젯이 이질감 없이 녹아들도록 CSS 클래스 규칙을 정의한다.
  3. `assets/data/` 및 `assets/js/`, `assets/css/` 디렉토리를 생성하고 Stage 2~3에서 사용할 JSON 스키마를 확정한다.
* **Exit Criteria**: 디렉토리 구조 준비 완료 및 기존 HTML 구조 분석 완료 시 즉시 Stage 2 진입.

---

### [Stage 2] 코어 학습 데이터셋(JSON) 3종 일괄 구축
* **담당 모델**: Gemini Pro (대량 JSON 생성) 또는 Sonnet 병렬 서브에이전트 3기
* **수행 내용**: 아래 3개의 JSON 파일을 생략(Placeholder) 없이 완전한 실전 데이터로 작성하여 `assets/data/` 하위에 저장한다.

  1. **`assets/data/arch_patterns.json` (4대 문제 유형 × 2대 API 매핑 데이터)**
     - 대상 유형: ① 이진분류(`binary`), ② 다중분류 원-핫(`multiclass_onehot`), ③ 다중분류 정수 라벨(`multiclass_sparse`), ④ 회귀(`regression`)
     - 각 유형별로 **Sequential API 코드**와 **Functional API (`Input`, `Dense`, `Model`) 코드**를 1:1 매핑.
     - 유형별 핵심 차이점 메타데이터 구조화:
       - 입력 `shape` 정의 방식
       - 출력층 `Dense(units, activation)` (`1/'sigmoid'`, `N/'softmax'`, `1/None`)
       - `model.compile(loss, optimizer, metrics)` 표준 인자
       - `model.predict()` 이후 라벨/값 변환 후처리 코드 (`(pred > 0.5).astype(int)` vs `np.argmax(pred, axis=1)`)

  2. **`assets/data/chapter_drills.json` (Ch01~Ch08 빈칸 채우기 실습 42문항)**
     - 기존 `ch01`~`ch08`의 확인 문제 42개를 실기 시험(Jupyter Notebook) 스타일의 코드 빈칸 채우기 및 핵심 파라미터 작성 문제로 변환.
     - 각 문항 필수 필드: `chapter`, `question_id`, `prompt` (요구사항 지문, 지정 변수명 명시), `skeleton_code` (`___` 빈칸 포함 코드), `validation_rules` (필수 토큰 및 정규식 배열), `expected_output` (가상 실행 결과 텍스트/요약), `explanation` (해설 및 오답 포인트).

  3. **`assets/data/mock_exams_14q.json` (최신 14문항 체제 실전 모의고사 3회분)**
     - **공통 구조 (14문항 / 100점 만점 / 80점 합격 기준)**:
       - 문항 1~3: 패키지 임포트, 데이터 로드, 탐색적 시각화(Seaborn `countplot`, `boxplot`, `heatmap` 등)
       - 문항 4~7: 결측치 처리, 이상치 제거, 범주형 인코딩(`get_dummies`/`LabelEncoder`), 데이터 분리(`train_test_split`), 스케일링(`StandardScaler`/`MinMaxScaler`)
       - 문항 8~10: 머신러닝 모델링(`DecisionTree`, `RandomForest`, `XGBoost`/`LightGBM`) 학습 및 평가
       - 문항 11~13 (유형 13): 딥러닝 모델 설계(`Sequential` 및 `Functional`), 컴파일, 콜백(`EarlyStopping`, `ModelCheckpoint`) 적용 학습, `history` 학습 곡선 시각화
       - 문항 14 (유형 14): 검증 데이터 성능 평가 및 **신규 입력 샘플(Simulation Input)에 대한 전처리·예측값 도출**
     - **3회분 구성**:
       - `mock01`: 이진분류 — 통신사 고객 이탈 예측 (기존 12문항을 14문항으로 확장 개편)
       - `mock02`: 다중분류 — 설비 센서 기반 불량 유형 분류 (기존 12문항을 14문항으로 확장 개편)
       - `mock03`: 회귀(신규) — 스마트팩토리/전력 에너지 소비량 또는 주택 가격 예측 (14문항 전체 파이프라인 신규 작성)

* **Exit Criteria**: 3개 JSON 파일 생성 및 `JSON.parse()` 유효성 통과 시 즉시 Stage 3 진입.

---

### [Stage 3] 4대 인터랙티브 모듈 병렬 개발
* **담당 모델**: Opus (채점 로직 설계) + Sonnet 서브에이전트 4기 병렬 실행
* **수행 내용**:

  1. **Module A: `assets/js/arch-switcher.js` (3대 유형 & API 실시간 변환 위젯)**
     - 상단 탭에서 **[이진분류 | 다중분류(One-hot) | 다중분류(Label) | 회귀]** 및 **[Sequential API | Functional API]** 토글 시 코드 블록과 핵심 변경 지점(하이라이트 배지)이 즉시 전환되는 컴포넌트.
     - 변경되는 라인(출력층, 손실함수, 평가지표, 예측 후처리)에 시각적 강조(Diff Highlight) 적용.

  2. **Module B: `assets/js/code-grader.js` (주피터 셀 스타일 정적 코드 채점기)**
     - 사용자가 빈칸 코드를 입력하고 `[실행 및 채점 (Shift+Enter)]` 클릭 시 즉시 판별.
     - **채점 정규화 로직**: 불필요한 공백 제거, 작은따옴표(`'`)와 큰따옴표(`"`) 통일, 키워드 인자 순서 무관 매칭.
     - **엄격 검사 항목**: 문제에서 지정한 변수명(`model`, `history`, `es`, `mc`, `y_pred` 등) 일치 여부, 필수 하이퍼파라미터(`monitor='val_loss'`, `patience`, `activation`, `loss`) 정확성 검증.
     - 오답 시 어떤 변수명이나 인자가 틀렸는지 구체적인 힌트 토스트 출력, 정답 시 가상 실행 결과(`model.summary()` 테이블 등) 렌더링 및 `localStorage` 진도율 반영.

  3. **Module C: `assets/js/cbt-engine.js` (14문항 90분 CBT 모의고사 엔진)**
     - 상단 고정 바: 90분 카운트다운 타이머(일시정지/초기화 지원), 문항 네비게이션 팔레트(1~14번 풀이 여부 및 북마크 표시), 현재 예상 득점 표시.
     - 답안 자동 저장(`localStorage`) 및 최종 `[시험 종료 및 채점]` 클릭 시 **80점 합격 판정 배지**와 파트별(전처리/ML/DL모델링/DL추론) 취약점 분석 리포트 제공.

  4. **Module D: `assets/js/openbook-modal.js` (제한적 오픈북 30초 공식 문서 검색기)**
     - 화면 우측 하단 플로팅 버튼 또는 단축키(`Ctrl+K` / `Cmd+K`)로 호출되는 모달.
     - 시험장 허용 레퍼런스(Pandas 전처리, Scikit-learn `train_test_split`/스케일러/평가지표, Keras `Sequential`/`Model`/`Dense`/`Dropout`/`BatchNormalization`/`EarlyStopping`/`ModelCheckpoint`)의 함수 시그니처와 실전 스니펫을 키워드 초성/영문으로 1초 만에 검색하고 `[코드 복사]`할 수 있는 트레이너.

* **Exit Criteria**: 4개 JS 모듈 및 전용 스타일시트(`assets/css/v2-widgets.css`) 작성 완료 시 즉시 Stage 4 진입.

---

### [Stage 4] 기존 페이지 통합 및 신규 페이지(`mock03`, `cheatsheet`) 생성
* **담당 모델**: Sonnet 병렬 서브에이전트
* **수행 내용**:
  1. **`index.html` 업데이트**:
     - 전체 진도율 대시보드(`localStorage` 기반 챕터별 완료율 및 모의고사 최고 점수 표시) 추가.
     - 신규 추가된 `mock03.html`(회귀 모의고사) 및 `cheatsheet.html`(시험장 치트시트) 진입 카드 연결.
  2. **`ch01.html` ~ `ch08.html` 고도화 (기존 46개 도해 100% 유지)**:
     - **`ch02.html` 집중 보강**: 1~10번 문항(전처리·머신러닝)에서 11~14번(딥러닝)으로 넘어갈 때 가장 많이 틀리는 **데이터 연결 트러블슈팅 섹션**(결측치 제거 후 인덱스 불일치, `get_dummies` 결과 `bool`/`object` 타입의 `float` 변환, `(N,)` vs `(N, 1)` Shape 에러 방지) 추가.
     - **`ch04`, `ch05`, `ch07`, `ch08`**: `arch-switcher.js` 위젯을 마운트하여 Sequential/Functional API 및 문제 유형별 코드를 즉시 비교할 수 있도록 구성.
     - 모든 챕터 하단 확인 문제를 `code-grader.js` 기반 인터랙티브 실습 셀로 교체 및 오픈북 검색 모달(`openbook-modal.js`) 연결.
  3. **`mock01.html`, `mock02.html` 리뉴얼 및 `mock03.html` 신규 생성**:
     - `cbt-engine.js`와 `mock_exams_14q.json`을 연동하여 14문항 실전 CBT 페이지 3종 완성.
  4. **`cheatsheet.html` (시험장 직전 10분 1페이지 압축 치트시트) 신규 생성**:
     - ① 문제 유형별(이진/다중/회귀) 출력층·손실함수·평가지표·후처리 한눈에 보기 비교표.
     - ② 시험장 빈출 에러 메시지 5선(`Shape mismatch`, `Unrecognized keyword`, `DataFrame object dtype`, `NaN loss`, `metric name error`) 원인과 10초 해결 코드 사전.
     - ③ 1~14번 문항별 표준 변수명 및 필수 임포트 구문 요약.

* **Exit Criteria**: 모든 HTML 페이지 연결 및 스크립트 마운트 완료 시 즉시 Stage 5 진입.

---

### [Stage 5] 자체 자동 검증 및 결함 수정 (Self-Verification Gate)
* **담당 모델**: Haiku (정적/링크 검사) + Opus (채점 로직 테스트)
* **수행 내용**: 사용자에게 완료 보고를 하기 전, 에이전트 스스로 아래 검증 스크립트를 실행하여 발견된 모든 오류를 즉시 자체 수정하라.
  1. **JSON & JS 구문 검사**: Node.js 또는 Python 일회성 스크립트로 모든 `.json` 파일 파싱 테스트 및 `.js` 파일 문법 오류(SyntaxError) 여부 확인.
  2. **채점기(Grader) 단위 테스트**: `chapter_drills.json`과 `mock_exams_14q.json`의 모든 문항에 대해 모범 답안(Model Answer)을 넣었을 때 100% 정답 판정이 나오는지, 작은따옴표/큰따옴표 변환 및 공백 변형 시에도 정상 통과하는지 자동 검증.
  3. **DOM 및 링크 무결성 검사**: `index.html`, `ch01~08.html`, `mock01~03.html`, `cheatsheet.html` 간 내부 링크(`href`), 스크립트(`src`), 스타일시트 경로 중 누락되거나 깨진 파일이 없는지 전수 확인.
  4. **기존 자산 보존 확인**: 기존 46개 도해 요소가 누락 없이 렌더링되는지 확인.

* **Exit Criteria**: 위 4가지 검증 항목에서 에러 0건 달성 시 Stage 6 진입.

---

### [Stage 6] 최종 완료 보고 및 일괄 피드백 대기 (Single Human Review)
* **수행 내용**:
  - Stage 1~5의 모든 작업과 자체 검증이 완료되면 아래 형식으로 **최종 결과 요약 리포트**를 출력하고 사용자의 일괄 수정 지시를 대기한다.
  - **리포트 포함 항목**:
    1. 생성 및 업데이트된 파일 전체 목록
    2. 챕터별(Ch01~Ch08) 및 모의고사(Mock 01~03) 반영 내역 요약
    3. 자체 자동 검증(Stage 5) 통과 결과 (JSON 파싱, 채점기 정답률 테스트, 링크 무결성)
    4. 로컬 프리뷰 실행 명령어 안내 (예: `python3 -m http.server 8000`) 및 **일괄 피드백 요청 안내**