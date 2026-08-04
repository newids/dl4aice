# Ch04 검수 리포트 — Keras로 모델 만들기

- **검수 일자:** 2026-07-28
- **검수자:** tech-reviewer (incremental QA, 1회차)
- **검수 대상**
  - `_workspace/chapters/ch04.md`
  - `_workspace/diagrams/ch04_keras-4steps.svg`, `ch04_sequential-build.svg`, `ch04_input-shape.svg`, `ch04_output-layer-choice.svg`, `ch04_param-count.svg`, `ch04_dropout-bn-position.svg`
  - `_workspace/exams/ch04_quiz.md`
- **기준 문서:** `_workspace/01_curriculum.md` §2 의존 관계 / §3 Ch04 스펙 / §4 도해 인벤토리 / §5.1 문제 배치 / §6 용어 규칙, `.claude/skills/aice-domain/SKILL.md`
- **실행 환경:** Python 3.13.5 / TensorFlow 2.21.0 (Keras 3) / scikit-learn 1.9.0 / numpy 2.5.0
  (`/Users/newid/.pyenv/versions/3.13.5/bin/python3`)

---

## 판정

**통과 (CRITICAL 0건 / HIGH 0건)**

| 심각도 | 건수 |
|--------|------|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 2 |
| LOW | 5 |
| 회귀(미해결 이월) | 4 |
| 교차 발견(Ch04 범위 밖) | 1 |

**의뢰받은 CRITICAL 항목(Ch04/Ch05 역할 분리)은 본문·도해·문제 3면 모두에서 완전 준수**됩니다. 후속 챕터 진행을 막는 사안 없음.

---

## 0. 최우선 확인 — Ch04/Ch05 역할 분리 (CRITICAL 항목)

**결과: PASS**

커리큘럼 §2 "손실 함수 선택 규칙의 정본 도해는 `ch05_loss-decision`이며 Ch04는 출력층 관점만 다루고 loss 표기 금지" 준수 여부를 3면 전수 스캔했습니다.

### 0.1 손실 함수명 — 0건

`binary_crossentropy` / `categorical_crossentropy` / `sparse_categorical_crossentropy` / `mse` / `mae` 전수 grep 결과 **`ch04.md`·`ch04_quiz.md`·`ch04_*.svg` 전체에서 0건**.

### 0.2 `compile()` / `fit()` — 코드 블록 내 호출 0건

본문 python 코드 블록 8개, 문제 해답 코드 블록 6개 전수 확인 결과 **`compile(`·`fit(` 호출 0건**. 이름이 등장하는 5곳은 전부 **경계 안내(referral) 서술**이며, 그중 4곳은 커리큘럼이 명시적으로 요구한 표기입니다.

| 위치 | 문구 | 성격 | 판정 |
|------|------|------|------|
| `ch04.md` 13행 | "손실 함수와 optimizer 설정은 Ch05에서 다룹니다" | Ch05 이관 안내 | 허용 ✓ |
| `ch04.md` 33행 | "구성만 하고 `compile()`을 빠뜨리면 `fit()`에서 오류가 납니다" | 시험 포인트(범위 경계 경고) | 허용 ✓ |
| `ch04.md` 346행 | "다음 챕터에서 `compile()`과 `fit()`을 붙여" | 다음 챕터 예고 | 허용 ✓ |
| `ch04_quiz.md` 12행 | "`compile()`·`fit()`은 Ch05, 평가는 Ch07" | 출제 범위 고지 | 허용 ✓ |
| `ch04_keras-4steps.svg` 27·35·47행 | 박스 라벨 `loss`·`fit()`, 하단 주석 "compile() 없이 fit()을 부르면 오류가 난다" | **커리큘럼 §3 Ch04 도해 구도 지시가 직접 요구**("컴파일(optimizer/loss) → 학습(fit)") | 허용 ✓ |

`loss`는 compile 인자 이름으로만 1회(muted 라벨) 등장하며 **구체 손실 함수명은 없습니다**.

### 0.3 Ch05 참조 안내 — 정본 지시 정확

- `ch04_output-layer-choice.svg`: 이진/다중/회귀 세 잎 모두에 **"손실 함수는 Ch05 참조"** 만 표기. loss 이름·loss 열 없음. 커리큘럼 구도 지시와 정확히 일치.
- `ch04.md` §4.4 출력층 표: 열 구성이 `문제 유형 / 출력층 코드 / 출력의 의미` 3열로, **loss 열이 없음**.
- `ch04.md` 188~189행 📎 박스: 정본을 `ch05_loss-decision`으로 명시하고 "짝짓기는 Ch05에서"로 이관. 커리큘럼 §4 중복 방지 메모 준수.

---

## 1. 경계면 교차 비교 결과

### 1.1 DIAGRAM 플레이스홀더 ↔ SVG 파일 — PASS (누락 0 / 고아 0)

| # | 플레이스홀더 id (ch04.md) | SVG 파일 | 커리큘럼 §4 | XML | `role`/`aria-label`/`<title>` |
|---|---------------------------|----------|-------------|-----|------------------------------|
| 1 | `ch04_keras-4steps` (20행) | 존재 | #18 ✓ | wellformed | 모두 있음 ✓ |
| 2 | `ch04_sequential-build` (39행) | 존재 | #19 ✓ | wellformed | 모두 있음 ✓ |
| 3 | `ch04_input-shape` (94행) | 존재 | #20 ✓ | wellformed | 모두 있음 ✓ |
| 4 | `ch04_output-layer-choice` (141행) | 존재 | #21 ✓ | wellformed | 모두 있음 ✓ |
| 5 | `ch04_param-count` (198행) | 존재 | #22 ✓ | wellformed | 모두 있음 ✓ |
| 6 | `ch04_dropout-bn-position` (246행) | 존재 | #23 ✓ | wellformed | 모두 있음 ✓ |

- 스펙 요구 6개 = 실제 6개 = 플레이스홀더 6개. `diagrams/ch04_*.svg` 중 본문에서 참조되지 않는 고아 파일 0건.
- 플레이스홀더의 구도 지시 문자열이 커리큘럼 §3 Ch04 표 원문과 6/6 일치.

### 1.2 EXAM 마커 ↔ 문제 파일 — PASS

- `ch04.md` 363행 `<!-- EXAM: ch04 -->` 1건, 본문 말미(핵심 요약 직후) 배치.
- `_workspace/exams/ch04_quiz.md` 존재. front-matter `chapter: 4` — 챕터 번호 일치 ✓.
- front-matter `items: 6`, `types: { 객관식: 2, 코드빈칸: 2, 오류찾기: 2 }` — 커리큘럼 §5.1 Ch04 행(6 / 2 / 2 / 2)과 완전 일치 ✓.
- 실제 문항: Q1 객관식 · Q2 객관식 · Q3 코드빈칸 · Q4 코드빈칸 · Q5 오류찾기 · Q6 오류찾기 = 선언과 일치 ✓.
- 심는 오답 포인트 2종 배치 확인: "입력 shape에 샘플 수 포함"(Q1 선지 1·2, Q5 본문), "출력층 units와 클래스 수 불일치"(Q4 자주 틀리는 지점, Q6 오류 ①) ✓.
- 해설 3단 구성(정답 코드 / 왜 이렇게 푸는가 / 자주 틀리는 지점) — 6/6 문항 모두 충족 ✓.
- 기출 변형 고지문("공개된 출제 기준에 따른 유형 연습 문제입니다") 10행에 존재 ✓.

### 1.3 도해 수치·용어 ↔ 본문 대조 — PASS (불일치 0건, 전 수치 재계산 검증)

**`ch04_param-count` (의뢰 지정 확인 항목)**

| 도해 표기 | 본문 대응(§4.5) | 재계산 | 실행 검증 |
|-----------|-----------------|--------|-----------|
| `(4 x 5) + 5 = 25` | "첫 층은 `(4 × 5) + 5 = 25`" | 20+5=25 ✓ | summary Param # = 25 ✓ |
| "가중치 4 x 5 = 20개 + 편향 5개" | "앞부분은 가중치, 뒤에 더하는 것은 노드마다 하나씩 있는 편향" | ✓ | ✓ |
| `(5 x 1) + 1 = 6` | "둘째 층은 `(5 × 1) + 1 = 6`" | 5+1=6 ✓ | summary Param # = 6 ✓ |
| `Total params: 31` | "합이 31입니다" / 본문 재현표 `Total params: 31` | 25+6=31 ✓ | **실행 결과 Total params: 31** ✓ |
| 표 행 `dense (Dense) / (None, 5) / 25`, `dense_1 (Dense) / (None, 1) / 6` | 본문 재현표와 문자 단위 일치 | — | 실제 Keras 3 출력과 층명·shape·Param # 일치 ✓ |
| "파라미터 수 = (앞 층 노드 x 이 층 노드) + 이 층 노드" | §4.5 및 핵심 요약의 계산식과 동일 | — | — |
| 구조 그림 실측 | 입력 원 4개(cx=120) / 은닉 원 5개(cx=300) / 연결선 20개 | 4×5=20 ✓ | — |

연결선을 20개 전부 좌표 검산했습니다. 도해가 "가중치 20개"라고 쓴 것과 실제 그려진 선 개수가 일치합니다.

**표준 코드 출력 수치 (의뢰 지정 확인 항목)**

| 항목 | 본문 표기 | 실행 결과 | 판정 |
|------|-----------|-----------|------|
| `dense` Param # | 1984 | 1,984 (30×64+64) | 값 일치 ✓ |
| `batch_normalization` Param # | 256 | 256 (64×4) | ✓ |
| `dense_1` Param # | 2080 | 2,080 (64×32+32) | ✓ |
| `dense_2` Param # | 33 | 33 (32×1+1) | ✓ |
| **Total params** | **4,353** | **4,353** | ✓ |
| Trainable params | 4,225 | 4,225 | ✓ |
| **Non-trainable params** | **128** | **128** | ✓ |
| Dropout Param # | 0 | 0 | ✓ |

§4.6 서술 "파라미터가 노드 수의 4배(64 × 4 = 256)로 잡히고, 그중 절반이 Non-trainable"도 실측(256, non-trainable 128)과 일치합니다. 근거 설명("학습으로 조정하는 값 두 종류 + 학습 중 관찰한 통계 두 종류")은 gamma·beta / moving_mean·moving_variance 구조와 기술적으로 정확합니다.

**나머지 4개 도해**

| 도해 | 도해 표기 | 본문 대응 | 판정 |
|------|-----------|-----------|------|
| `ch04_keras-4steps` | 구성(Sequential/Dense) → 컴파일(optimizer/loss, Ch05) → 학습(fit(), Ch05) → 평가(evaluate()/predict(), Ch07). 구성만 primary(#dbeafe/#2563eb), 나머지 muted | §4.1 "구성 → 컴파일 → 학습 → 평가", 핵심 요약 "구성 → 컴파일(Ch05) → 학습(Ch05) → 평가(Ch07)" | 담당 챕터 번호까지 완전 일치 ✓ |
| `ch04_sequential-build` | `Input(shape=(8,))` / `Dense(64,'relu')` / `Dense(32,'relu')` / `Dense(1,'sigmoid')`, 층 라벨 "입력 특성 8개 / 은닉층 1 노드 64 / 은닉층 2 노드 32 / 출력층 노드 1", 주석 `len(model.layers) = 3` | §4.2 코드(n_features=8, 64→32→1) 및 "출력은 `3`입니다" | 코드·노드 수·층 개수 4/4 일치 ✓ |
| `ch04_input-shape` | "1,000행 (샘플 수)" / "8열 특성 수" → `Input(shape=(8,))`, `8 = X_train.shape[1]`, danger `Input(shape=(1000, 8))` | §4.3 "1,000행 8열이라면 `shape=(8,)`", `X_train.shape[1]`, 시험 포인트 "`Input(shape=(1000, 8))`처럼 샘플 수를 넣는 것이 가장 흔한 실수" | 오답 예시까지 동일 ✓ |
| `ch04_dropout-bn-position` | Input(shape=(30,)) → Dense(64,'relu') → BatchNormalization() → Dropout(0.3) → Dense(32,'relu') → Dropout(0.3) → Dense(1,'sigmoid'), 출력층 뒤 Dropout에 적색 원 X(dc2626) + "출력층 뒤에는 넣지 않는다", "0.3 = 끄는 비율" | §4.6 코드 블록과 완전 동일한 층 순서·인자, 위치 표, 시험 포인트 "출력층 뒤에는 Dropout을 넣지 않습니다" | 7층 순서·특성 수 30·노드 64/32/1 모두 일치 ✓ |
| `ch04_output-layer-choice` | 이진 units=1/'sigmoid'/`Dense(1, activation='sigmoid')`, 다중 units=K/'softmax'/`Dense(K, activation='softmax')`, 회귀 units=1/activation "쓰지 않음"(accent)/`Dense(1)` | §4.4 표 3행과 코드 블록 (1)(2)(3) | 3/3 일치 ✓ |

도해가 3층인데 본문이 4층인 유형의 구조 불일치는 **0건**입니다.

### 1.4 문제 범위 ↔ 본문에서 가르친 범위

| 문항 | 요구 지식 | 본문 근거 | 판정 |
|------|-----------|-----------|------|
| Q1 | `Input(shape=(n,))`, 샘플 수 제외, 1원소 튜플 쉼표 | §4.3 전체 + 시험 포인트 | 범위 내 ✓ |
| Q2 | `(앞 층 × 이 층) + 이 층` 누적 합, softmax 출력층 | §4.5 계산식, §4.4 표 | 범위 내 ✓ |
| Q3 | `X.shape[1]`, `Input`, `Dense(1,'sigmoid')`, 은닉층 2개 | §4.2 / §4.3 / §4.4 | 범위 내 ✓ |
| Q4 | `len(np.unique(y))`, BN→Dropout 순서, `Dense(K,'softmax')`, BN Param # 256·Non-trainable 128 | §4.4 코드(`len(np.unique)`), §4.6 표·서술 | 범위 내 ✓ |
| Q5 | `shape=X.shape` 오류 진단 | §4.3 시험 포인트 | 범위 내 ✓ |
| Q6 | 출력층 units ↔ 클래스 수, 출력층 뒤 Dropout 금지 | §4.4 186행, §4.6 시험 포인트 | 범위 내 ✓ |

- **범위 초과(Ch05·Ch07 침범) 0건**: 문제·해답 어디에도 `compile`/`fit`/loss/평가지표가 없습니다.
- **AICE Associate 범위 밖 주제(CNN/RNN/Transformer/PyTorch) 0건**.
- 단, 검증 도구로 쓰인 `model.output_shape`(8회)·`model.count_params()`(1회)가 본문 미소개 API입니다 → **M-1**.

### 1.5 커리큘럼 학습 목표 ↔ 챕터 실제 내용 — PASS (3/3)

| # | 학습 목표 | 담당 절 | 문제 대응 | 판정 |
|---|-----------|---------|-----------|------|
| 1 | `Sequential`·`Dense`로 은닉층 2개 이상 모델 작성 | §4.2(add 방식·리스트 방식·은닉층 개수 시험 포인트) | Q3 | 충족 ✓ |
| 2 | 입력 shape와 출력층(units·activation)을 유형에 맞게 결정 | §4.3, §4.4 | Q1·Q3·Q4·Q5·Q6 | 충족 ✓ |
| 3 | `Dropout`·`BatchNormalization` 위치 + `summary()` 확인 | §4.5, §4.6 | Q2·Q4·Q6 | 충족 ✓ |

커리큘럼 §3 Ch04 "핵심 코드 패턴" 대조:

| 요구 | ch04.md | 판정 |
|------|---------|------|
| `Sequential` + `Input(shape=(n_features,))` 표준 | §4.2·§4.3·§4.6·시험장 표준 코드 전부 `Input` 사용 | ✓ |
| `Dense(64,relu)` → `Dropout(0.3)` → `Dense(32,relu)` → `Dense(1,sigmoid)` → `summary()` | 시험장 표준 코드에 BatchNormalization 추가된 상위 집합 | ✓ (학습 목표 3 반영) |
| 구버전 `input_shape=` 참고 병기 | §4.3 128~132행, "새로 쓸 때는 Input" 명시 | ✓ |
| `model.save('model.keras')` 기본, `.h5` 참고 병기 | 322행 `model.save('my_model.keras')  # 구버전 표기: 'my_model.h5'` | ✓ |

### 1.6 용어·표기 통일 (커리큘럼 §6) — 위반 0건

- 금지 표기 전수 grep(오버피팅·히든 레이어·숨은층·액티베이션·비용 함수·로스·콜백함수·러닝 커브·에포크·배치사이즈) → **0건**.
- "은닉층", "활성화 함수(activation function)"(30행 첫 등장 병기), "과적합" 규정 표기 준수 ✓.
- 경어체 통일 준수, 난이도 단정 표현("쉽죠?" 등) 0건 ✓.
- 전 코드 `tensorflow.keras` 경로 준수 ✓.

### 1.7 SVG 내부 id 충돌 — 실제 충돌 0건

현재 존재하는 SVG 37개 전체 대상 `id="..."` 교차 grep 결과:

| ch04 파일 | 내부 id | 전역 출현 |
|-----------|---------|-----------|
| `ch04_keras-4steps.svg` | `k4s-arrow` | 1회 |
| `ch04_sequential-build.svg` | `sqb-arrow` | 1회 |
| `ch04_input-shape.svg` | `ish-a-e`, `ish-a-s`, `ish-p-e`, `ish-p-s` | 각 1회 |
| `ch04_output-layer-choice.svg` | `olc-arrow` | 1회 |
| `ch04_param-count.svg` | `pc-p-e` | 1회 |
| `ch04_dropout-bn-position.svg` | `dbp-d-e`, `dbp-p-e` | 각 1회 |

**ch04 도해 10개 id 모두 책 전체에서 유일** — 인라인 임베드 시 즉시 깨지는 문제 없음. 다만 접두어에 챕터 표식이 없어 미제작 도해와의 장래 충돌 여지가 남습니다 → **L-3**(ch03 M-2 이월).

---

## 2. 코드 실행 검증

### 2.1 본문 코드 블록 (8/8 통과)

`ch04.md`의 python 코드 블록 8개를 전량 추출해 실행했습니다.

| # | 위치 | 실행 방식 | 결과 | 본문 기대값 대조 |
|---|------|-----------|------|------------------|
| 1 | §4.2 기본 모델 | 단독 | exit 0 | `print(len(model.layers))` → **3** = 본문 "출력은 `3`입니다" ✓ |
| 2 | §4.2 리스트 표기 | 블록1 누적 | exit 0 | `len(model.layers)`=3, `output_shape`=(None,1) — 본문 "같은 결과를 냅니다" 검증됨 ✓ (단독 실행은 불가 → L-5) |
| 3 | §4.3 breast_cancer 전처리 | 단독 | exit 0 | `(398, 30)` / `30` = 주석 `# (398, 30)`, `# 30` ✓ |
| 4 | §4.3 구버전 `input_shape` | 블록1 누적 | exit 0 | `UserWarning: Do not pass an 'input_shape'/'input_dim' argument to a layer. ... prefer using an 'Input(shape)' object` 발생 후 정상 동작 — 본문 "Keras 3에서 권장되지 않습니다" 서술과 정확히 일치 ✓ |
| 5 | §4.4 3유형 출력층 | 단독 | exit 0 | `print(n_class)` → **3** = 주석 `# 3` ✓ |
| 6 | §4.5 demo `summary()` | 단독 | exit 0 | Param # 25 / 6, **Total 31 / Trainable 31 / Non-trainable 0** = 본문 재현표 3/3 일치 ✓ |
| 7 | §4.6 BN·Dropout 배치 | 단독 | exit 0 | 1,984 / 256 / 0 / 2,080 / 0 / 33, **Total 4,353 / Trainable 4,225 / Non-trainable 128** ✓ |
| 8 | 시험장 표준 코드 | 단독 | exit 0 | `입력 특성 수: 30`, 위와 동일한 summary, `my_model.keras` 44,738 B 생성 확인 ✓ |

**의뢰 지정 확인 지점 3건 전부 실측 일치:** `len(model.layers)` = **3** / BatchNormalization Non-trainable = **128** / Total params = **4,353**.

deprecated API·import 누락·shape 오류 **0건**. Keras 2/3 양립 표준(`Input(shape=(n,))`, `.keras`) 위반 0건.

### 2.2 문제 해답 코드 (6/6 통과) 및 서술 주장 재검증

| 문항 | 실행 결과 | 해답 표기 | 판정 |
|------|-----------|-----------|------|
| Q1 | `(1200, 12)` / `12` / `(None, 32)` | 동일 | ✓ |
| Q2 | `count_params()` = **339**, 손 계산 176+136+27=339 | 정답 4번(339) | ✓ |
| Q3 | Total **3,137**(1,024+2,080+33), `len(model.layers)`=3, `(None, 1)` | 동일, 계산식 표기도 일치 | ✓ |
| Q4 | Total **3,812** / Trainable **3,684** / Non-trainable **128**, BN Param # **256**, n_class **4**, `(None, 4)` | 동일 | ✓ |
| Q5 | 잘못된 코드 `(None, 1000, 1)` → 수정 후 `(None, 1)` | 동일 | ✓ |
| Q6 | 수정 후 `(None, 4)` / 마지막 층 `Dense`, Total **3,556** | 동일 | ✓ |

**해설 속 주장 4건을 별도 실행으로 확인했습니다.**

| 주장 위치 | 주장 | 실측 | 판정 |
|-----------|------|------|------|
| Q1 자주 틀리는 지점 | `shape=(12)`는 `ValueError: Cannot convert '12' to a shape.` | 메시지 문자열까지 정확히 일치 | ✓ |
| Q5 자주 틀리는 지점 | `shape=(8)`은 `ValueError: Cannot convert '8' to a shape.` | 정확히 일치 | ✓ |
| Q6 493행 | 수정 전 코드는 `출력 shape: (None, 2)`, `마지막 층: Dropout` | 정확히 일치 | ✓ |
| §4.5 240행 / Q2 자주 틀리는 지점 | `Input` 누락 시 "Total params가 0이거나 build되지 않았다는 메시지" | Keras 3: 표에 `0 (unbuilt)` + `Total params: 0`, `count_params()`는 `ValueError: ... layer isn't built`. "이거나"로 양쪽을 포괄하므로 서술 정확 | ✓ |

문제 파일 510행의 exam-writer 자체 검증 주석에 적힌 기대값도 **전 항목 재현 확인**했습니다(독립 재검증 완료).

---

## 3. 지적 사항

### CRITICAL — 0건

없습니다. AICE Associate 범위 필수 항목 누락 없음, 기술적 오류 없음, 역할 분리 위반 없음.

### HIGH — 0건

없습니다. 본문 ↔ 도해 ↔ 문제 ↔ 커리큘럼 4면 정합성이 깨진 지점이 없습니다.

### MEDIUM — 2건

#### M-1. 본문이 소개하지 않은 API(`model.output_shape`, `model.count_params()`)가 문제 지문·해답에서 핵심 확인 수단으로 쓰임

**담당: chapter-writer (1순위) / exam-writer (대안)**
· 위치: `ch04_quiz.md` 143행(Q5 지문), 194·236·298·358·416·423·474행(해답) — `output_shape` 8회, `count_params` 1회
· 대조: `chapters/ch01.md`~`ch08.md` 전수 grep 결과 `output_shape` **0건**, `count_params` **0건**

`ch04.md` §4.5는 "Output Shape는 `summary()` 표에서 읽는다"까지만 가르칩니다. 그런데 문제 쪽은 `model.output_shape` 속성을 6문항 중 5문항의 검증 수단으로 쓰고, **Q5는 지문에 주어진 코드 자체에 `print(model.output_shape)`가 들어 있습니다.**

경계면 체크리스트 4항(본문 미교육 함수 출제)에 해당하나, 다음 두 이유로 HIGH가 아닌 MEDIUM으로 분류했습니다.

1. 학습자가 **답안으로 작성해야 하는 코드에는 포함되지 않습니다.** Q5의 정답은 `Input` 줄 수정이고, Q3의 정답은 빈칸 3개입니다. 몰라도 문항을 풀 수 있습니다.
2. 출력 형식이 `(None, 1)`로 §4.5에서 가르친 Output Shape 표기와 동일해, 개념 자체는 이미 전달되어 있습니다. 새로운 것은 접근자 이름뿐입니다.

**권고(택 1, 1순위 권장):**
- **(권장) `ch04.md` §4.5에 한 줄 추가** — 230행 "Output Shape의 `None`" 문단 뒤에 "표 전체를 보지 않고 최종 출력 형태만 빠르게 확인하려면 `print(model.output_shape)`를 쓸 수 있습니다. 결과는 표의 마지막 행과 같습니다." 정도. Ch05~Ch08 문제도 같은 idiom을 쓸 가능성이 높아 여기서 한 번 소개해 두는 편이 총비용이 낮습니다.
- (대안) 문제 쪽에서 `model.output_shape`를 `model.summary()` 확인으로 치환. 단 Q5는 "출력 shape가 의도와 다르다"가 문항의 축이라 치환 시 지문이 장황해집니다.
- `count_params()`는 Q2 해답 1곳뿐이므로, 위 문장에 "`model.count_params()`는 Total params와 같은 값을 돌려줍니다" 반절을 덧붙이면 함께 해소됩니다.

#### M-2. Q2 오답 선지 2번(208)·5번(360)이 특정 오개념에 대응하지 않음

**담당: exam-writer**
· 위치: `ch04_quiz.md` 54~58행

Q2의 5개 선지 중 진단 가치가 있는 것은 3개뿐입니다.

| 선지 | 대응 오개념 | 해설 언급 |
|------|-------------|-----------|
| 1. 27 | 마지막 층만 셈 | 간접 언급(272행) |
| 2. **208** | **대응 없음** | 없음 |
| 3. 312 | 편향 누락(160+128+24) | 명시 ✓ |
| 4. 339 | 정답 | ✓ |
| 5. **360** | **대응 없음** | 없음 |

오답 선지는 "왜 그 답을 골랐는지"가 곧 진단이 되어야 합니다. 208·360은 정답 주변 숫자일 뿐이라 함정 기능을 하지 못하고, 소거법으로 정답률만 올립니다. 커리큘럼 §5.1이 Ch04에 심으라고 지정한 오답 포인트는 "입력 shape에 샘플 수 포함 / 출력층 units와 클래스 수 불일치"인데, Q2는 param 계산 문항이라 이 두 축과 무관한 만큼 자체 함정 설계가 더 중요합니다.

**권고:** 두 선지를 진단 가능한 값으로 교체.
- `Input`의 10을 앞 층으로 쓰지 않고 첫 층을 `16×16+16=272`로 잘못 세는 경우 → **435**(272+136+27)
- 편향을 층마다 1개로 오해 → **315**(160+1+128+1+24+1)
- 또는 `Input`을 층으로 세어 앞 층 노드 수를 한 칸씩 밀어 계산한 값

교체 시 해설 "자주 틀리는 지점"에 각 선지의 진단 의미를 1줄씩 덧붙이기를 권합니다.

### LOW — 5건

#### L-1. 시험장 표준 코드 재현표의 천 단위 구분 표기가 내부·문서 간 불일치

**담당: chapter-writer**
· 위치: `ch04.md` 332·335행

같은 표 안에서 `1984`·`2080`은 쉼표 없이, `Total params: 4,353`·`4,225`는 쉼표를 넣어 표기했습니다. 실제 Keras 3 출력은 **`1,984` / `2,080`** 으로 모두 쉼표를 넣습니다. `ch04_quiz.md`의 재현표(`1,024`·`2,080`·`1,344`)와도 어긋납니다.

부수적으로 333행 `batch_normalization (BatchNor…)`의 말줄임표는 실제 출력(2줄 줄바꿈 `batch_normalization` / `(BatchNormalization)`)과 다른 형태입니다. §4.5에는 "표 서식은 Keras 버전에 따라 조금 다르게 보일 수 있습니다"라는 완충 문장이 있지만 이 표(325행 "예상 출력 요지입니다.") 앞에는 없습니다.

**권고:** `1,984`·`2,080`으로 통일하고, 325행에도 §4.5와 같은 서식 완충 문장 1줄 추가.

#### L-2. §4.4 예제가 특성 수 30을 하드코딩해, 같은 챕터의 "숫자를 직접 적지 말라" 원칙과 표면적으로 충돌

**담당: chapter-writer**
· 위치: `ch04.md` 170·176·180행 (`build_hidden(30)` 3회)

§4.3 121행은 "숫자를 직접 세어 적지 말고 **항상 이 방식으로 뽑으십시오**"라고 강조하고, 186행은 클래스 수에 대해 같은 원칙을 반복합니다. 그런데 바로 그 사이의 §4.4 예제는 `build_hidden(30)`으로 30을 세 번 직접 적습니다. 출력층 비교가 목적인 축약 예제라 기술적 오류는 아니지만, 방금 강조한 원칙을 예제가 스스로 어기는 모양새가 됩니다.

**권고:** 예제 앞에 `n_features = X_train.shape[1]  # 앞 절에서 뽑은 값, 여기서는 30` 한 줄을 두고 `build_hidden(n_features)`로 호출. 원칙과 예제가 일치합니다.

#### L-3. SVG 내부 id 접두어에 챕터 표식이 없음 (ch03 M-2 이월, 현재 실제 충돌 0건)

**담당: diagram-designer**
· 위치: `ch04_keras-4steps.svg`(`k4s-`), `ch04_sequential-build.svg`(`sqb-`), `ch04_input-shape.svg`(`ish-`), `ch04_output-layer-choice.svg`(`olc-`), `ch04_param-count.svg`(`pc-`), `ch04_dropout-bn-position.svg`(`dbp-`)

`ebook-builder`가 도해 46개를 한 HTML 문서에 인라인 임베드하므로 SVG 내부 id는 책 전체에서 유일해야 합니다. **현재 ch04 id 10개는 전부 유일해 지금 깨지는 것은 없습니다.** 다만 `pc-`(param-count)는 미제작 도해에서 "precision/recall"·"prob-to-class" 등으로 재사용될 개연성이 있고, ch03 리포트 M-2가 이미 같은 권고를 냈으나 ch04에는 반영되지 않았습니다.

**권고:** ch03 M-2와 동일하게 `ch04k4s-`·`ch04pc-` 등 챕터 표식 포함 접두어로 통일. 잔여 도해(ch05·ch06·ch08 일부) 제작 전에 규칙을 확정해 두면 소급 수정 범위가 줄어듭니다.

#### L-4. 분량이 스펙 하한 미달 — 전 챕터 공통 사안 (ch01 M-3 / ch03 X-2 이월)

**담당: curriculum-architect (단위 정의) → 리더 판단 후 chapter-writer**

| 측정 방식 | Ch04 실측 | 스펙 | 비율 |
|-----------|-----------|------|------|
| 산문 어절(코드 블록·HTML 주석 제외) | 1,345 | 2,000~2,400 | 67% |
| 코드 포함 전체 어절 | 1,799 | 2,000~2,400 | 90% |
| 산문 한글 문자수 | 2,928 | — | — |

Ch04만의 문제가 아니라 8개 챕터가 일관되게 하한을 밑돕니다(산문 어절: Ch01 1,185 / Ch02 1,702 / Ch03 1,463 / Ch04 1,345 / Ch05 1,586 / Ch06 1,370 / Ch07 1,765 / Ch08 1,742). ch03 리포트 X-2가 지적한 대로 커리큘럼 §3의 "단어" 단위(어절/문자/코드 포함 여부)가 정의되지 않은 것이 근본 원인입니다.

**권고:** 커리큘럼에 측정 단위를 먼저 명문화. 콘텐츠 밀도 자체는 부족하지 않으므로(수치·코드·시험 포인트 밀도 양호) 무리한 증량보다 기준 재정의가 적절합니다.

#### L-5. §4.2 리스트 표기 코드 블록이 단독 실행 불가

**담당: chapter-writer (조치 불필요 판단도 가능)**
· 위치: `ch04.md` 76~83행

이 블록은 앞 블록의 `n_features`·`Sequential`·`Input`·`Dense`에 의존해 단독 실행 시 `NameError`가 납니다. 직전 문장이 "리스트로 한 번에 넘기는 표기도 같은 결과를 냅니다"로 연속 맥락임을 밝히고 있어 독해상 문제는 없습니다. 다만 skill 기준의 "복붙 가능한 표준 코드 블록"이라는 성격과는 어긋나므로, HTML e-book에서 블록 단위 복사 버튼을 붙일 경우 혼선 여지가 있습니다.

**권고:** 그대로 두되, ebook-builder가 복사 버튼을 도입한다면 "앞 블록에 이어서 실행" 표식을 붙일 수 있도록 리더가 정책만 정해 두면 충분합니다.

---

## 4. 회귀(regression) — 이전 리포트 지적의 반영 여부

Ch04는 1회차 검수이므로 자체 회귀는 없습니다. **Ch04에 영향을 주는 선행 리포트 지적의 현재 상태**를 확인했습니다.

| 출처 | 지적 | 현재 상태 | Ch04 영향 |
|------|------|-----------|-----------|
| ch03 리포트 **L-3** | `ch03.md` 149행 "출력층과 손실 함수의 짝은 **Ch04와 Ch05에서** 확정합니다" → "출력층은 Ch04, 짝은 Ch05"로 분리 권고 | **미반영** (원문 그대로) | **실질 영향 발생.** Ch04는 커리큘럼대로 loss를 전혀 다루지 않는데, Ch03이 독자에게 "Ch04에서 짝을 확정한다"고 예고합니다. Ch04 §4.4의 📎 박스가 "정본은 Ch05"라고 다시 안내해 파손까지 가지는 않으나, Ch03→Ch04 이행 시 기대 불일치가 남습니다. → **chapter-writer 조치 권고(우선순위 상향)** |
| ch03 리포트 **M-2** | SVG 내부 id에 챕터 표식 부여 | **미반영** | ch04 6개 파일에 동일 패턴 반복 → 본 리포트 **L-3** |
| ch01 M-3 / ch03 X-2 | 챕터 분량 스펙 단위 미정의 | **미반영** | 본 리포트 **L-4** |
| ch03 리포트 **X-1** | Ch02 도해 7개가 `ah-ink` id 공유 | **미반영** (재확인: 7개 파일 그대로) | Ch04 범위 밖 → 아래 X-1 |

---

## 5. 교차 발견 (Ch04 범위 밖 — 리더 전달용)

### X-1. Ch02 도해 7개의 `id="ah-ink"` 중복 여전 (MEDIUM · ch03 X-1 재확인)

**담당: diagram-designer**

`ch02_data-pipeline` / `ch02_encoding-compare` / `ch02_metric-map` / `ch02_missing-strategy` / `ch02_ml-vs-dl` / `ch02_scaling-effect` / `ch02_split-leakage` 7개 파일이 동일한 `id="ah-ink"` marker를 정의합니다. 인라인 임베드 시 HTML id 중복이 되어, 브라우저가 첫 정의만 사용하므로 **7개 도해의 화살표 머리 색이 모두 첫 파일 기준으로 통일되는 렌더링 오류**가 발생합니다. 현재 SVG 37개 중 실제 충돌은 이 1건뿐입니다. ch03 리포트에서 지적된 뒤 변화가 없어 재보고합니다.

---

## 6. 담당 에이전트별 조치 요약

| 담당 | 항목 | 심각도 | 조치 |
|------|------|--------|------|
| **chapter-writer** | M-1 | MEDIUM | `ch04.md` §4.5에 `model.output_shape`(+`count_params()`) 소개 1~2줄 추가 |
| **chapter-writer** | L-1 | LOW | 332·335행 `1,984`·`2,080`으로 수정, 325행에 서식 완충 문장 추가 |
| **chapter-writer** | L-2 | LOW | §4.4 `build_hidden(30)` → `n_features` 변수 경유 |
| **chapter-writer** | 회귀(ch03 L-3) | LOW→상향 권고 | `ch03.md` 149행 "Ch04와 Ch05에서" → "출력층은 Ch04에서, 손실 함수와의 짝은 Ch05에서" |
| **exam-writer** | M-2 | MEDIUM | Q2 선지 2번·5번을 진단 가능한 오답 값으로 교체 + 해설 보강 |
| **diagram-designer** | L-3 | LOW | ch04 SVG 6개 내부 id에 챕터 표식 접두어 부여 |
| **diagram-designer** | X-1 | MEDIUM | Ch02 도해 7개의 `ah-ink` id 개별화 (Ch04 범위 밖) |
| **curriculum-architect / 리더** | L-4 | LOW | 커리큘럼 §3 "분량(단어)" 측정 단위 명문화 |

**Ch05 진행 차단 사유 없음.** M-1·M-2는 Ch05 이후 문항이 같은 idiom·선지 설계를 답습하기 전에 처리하는 편이 유리하므로, Ch05 집필과 병행 처리를 권합니다.

---

## 7. 검수 증적

- **실행 인터프리터:** `/Users/newid/.pyenv/versions/3.13.5/bin/python3` (Python 3.13.5, TensorFlow 2.21.0 / Keras 3, scikit-learn 1.9.0, numpy 2.5.0)
- **본문 코드:** 8개 블록 추출 → 6개 단독 실행 + 2개 누적 실행, 전량 exit 0. 실행 미검증 블록 **0개**.
- **문제 해답 코드:** 6개 블록 전량 단독 실행, exit 0. exam-writer 자체 검증 주석(510행) 기대값 전 항목 독립 재현.
- **추가 주장 검증:** `ValueError: Cannot convert '12'/'8' to a shape.` 메시지 문자열, Q6 수정 전 `(None, 2)`/`Dropout`, `Input` 누락 시 `0 (unbuilt)`·`Total params: 0` — 4건 별도 실행 확인.
- **SVG:** 6개 XML 파싱 통과, `role`/`aria-label`/`<title>` 6/6 보유, 내부 id 전역 유일성 확인(전 37개 파일 교차 grep).
- **`ch04.md` 365행 `<!-- verified: pending -->` 마커를 본 검수의 실제 실행 결과로 갱신했습니다.** (chapter-writer가 tech-reviewer 기입용으로 남긴 자리이며, 검증 증적 기록 외의 본문 수정은 하지 않았습니다.)


---

# 개명 재검증 (H-3 / 2026-07-31, tech-reviewer)

> 대상: 리더 결정 H-3 — 스케일링 결과 변수명을 `X_train_scaled`/`X_test_scaled`로 개명.
> 성격: 전체 재검수가 아니라 **개명으로 인한 회귀만** 확인하는 좁은 범위의 재검증.

환경: python3 3.13.5 · tensorflow 2.21.0 (Keras 3) · scikit-learn 1.9.0 · numpy 2.5.0 · pandas 3.0.3 · matplotlib(Agg).
E-1 회피 적용 — 모든 실행 스크립트 첫 줄에서 `import tensorflow`를 pandas보다 먼저 수행(교착 0건).

## 판정: 통과 (회귀 0건)

### 1. 코드 실행 — NameError 0건

`ch04.md`의 python 코드 블록 8개를 전량 재추출해 **누적 단일 프로세스**로 실행. `EXIT=0`, `Traceback`/`NameError` **0건**.

| 블록 | 위치 | 결과 |
|---|---|---|
| b01 | L54 | `3` |
| b02 | L76 | (출력 없음, 리스트 표기) |
| b03 | L102 | `(398, 30)` / `30` |
| b04 | L127 | 구버전 `input_shape=` — UserWarning 후 정상(본문 L132 서술과 일치) |
| b05 | L155 | `3` |
| b06 | L204 | Param # 25·6 / Total 31 / Trainable 31 / Non-trainable 0 |
| b07 | L259 | Param # 1,984·256·0·2,080·0·33 / Total 4,353 |
| b08 | L285 | `입력 특성 수: 30` / Total 4,353 · Trainable 4,225 · Non-trainable 128 |

개명 지점(L113·114·116·117·121·303·304·306)이 모두 정의→참조 순으로 연결됨을 실행으로 확인.

### 2. 게재 수치 무변경

위 8블록의 게재값 전량이 2026-07-28 verified 스탬프의 실측값과 **자릿수까지 동일**. 로직 무변경 확인.

### 3. 산문·요약표 표기 정합

정규식 `\b(X_train|X_test)(?!_scaled)\b`로 주석 밖 전수 스캔 → 잔존 6곳 전부 **정당 잔존**(L108·L299 `train_test_split` 반환, L113·L114·L303·L304 `fit_transform`/`transform` 인자). 산문·요약표의 옛 표기 **0건**. 핵심 요약 L355도 `n_features = X_train_scaled.shape[1]`로 갱신 확인.

### 4. 구조 무결성

코드 펜스 22개(짝수)·EOF depth 0 · HTML 주석 `<!--` 9 / `-->` 9 · DIAGRAM 6개 ↔ SVG 6개 1:1 · `EXAM: ch04` ↔ `exams/ch04_quiz.md` 존재.

## 신규 지적

### M-R1 (MEDIUM · 담당: diagram-designer) `ch04_input-shape.svg` 라벨이 개명에서 누락

- **위치:** `diagrams/ch04_input-shape.svg` 52행 — `8 = X_train.shape[1]`
- **본문:** L117 `n_features = X_train_scaled.shape[1]`, L121 해설, 핵심 요약 L355 모두 `X_train_scaled.shape[1]`
- **판단:** 수치(8)는 스케일링 전후가 동일하므로 **오류는 아니지만**, 커리큘럼 §6 정본("모델 투입·`Input` shape는 항상 `_scaled` 계열")과 본문이 같은 표현을 쓰는데 도해만 옛 표기다. 본문 §4.3이 "이 방식으로 뽑으십시오"라며 표현 자체를 암기 대상으로 제시하므로 도해가 다른 이름을 보이면 학습 방해.
- **조치:** 52행을 `8 = X_train_scaled.shape[1]`로 교체(라벨 1곳, 폭 여유 확인 필요).
