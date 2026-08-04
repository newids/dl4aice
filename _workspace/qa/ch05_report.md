# Ch05 검수 리포트 — 컴파일과 학습

> **이 문서는 2회 검수분을 담습니다.** §A(재검수 v2, 2026-07-28)가 최신 판정이며, §0 이하는 1회차(v1) 원문을 보존한 것입니다.

---

# §A. 재검수 (v2) — 2026-07-28

- **검수자:** tech-reviewer (재검수 1회, 부분 범위)
- **범위:** v1의 HIGH 3건(H-1·H-2·H-3) + MEDIUM 2건(M-1·M-2) 수정분 및 그 파급 회귀. **전체 재검수 아님**
- **수정 산출물:** `_workspace/chapters/ch05.md` (단독 변경). `ch05_epoch-batch.svg`·`ch05_loss-decision.svg`·`ch05_quiz.md`는 **무변경**(MD5 대조 확인) — 도해 무수정 해소 전략이 성립하는지가 이번 재검수의 핵심 쟁점이었습니다.
- **실행 환경:** v1과 동일 (Python 3.13.5 / TensorFlow 2.21.0 / Keras 3.15.0 / scikit-learn 1.9.0 / numpy 2.5.0 / matplotlib 3.11.1)

## A-0. 판정

**통과 — CRITICAL 0건 / HIGH 0건**

| 심각도 | v1 | v2 | 변동 |
|--------|----|----|------|
| CRITICAL | 0 | **0** | — |
| HIGH | 3 | **0** | **-3 (전건 해소)** |
| MEDIUM | 4 | **2** | -2 (M-1·M-2 해소) |
| LOW | 5 | **5** | 변동 없음 |
| 회귀(이월) | 6 | 6 | 변동 없음 |

**지적 5건 전부 실측 기준으로 해소되었고, 수정으로 인한 신규 결함(회귀) 0건입니다.** 잔여는 MEDIUM 2건(M-3·M-4) + LOW 5건 + 타 챕터 이월 6건이며, 모두 Ch06 진행을 막지 않습니다.

## A-1. 지적별 반영 검증

### H-1 — §4 step 산식 ↔ `validation_split` 전제 모순 → **해소 (실측 일치)**

수정 방식은 **도해를 고치지 않고 본문이 도해의 전제를 명시**하는 쪽이었습니다(120행). 이 전략이 성립하려면 ① 도해의 수치가 명시된 전제 아래에서 참이고 ② 본문이 다른 전제의 결과도 함께 제시해야 하는데, 두 조건 모두 충족합니다.

| 게재 위치 | 새 서술 | 실측 | 판정 |
|-----------|---------|------|------|
| 120행 | "위 도해는 **검증 데이터를 떼지 않고 1,000행 전부를 학습에 쓰는 경우**를 전제로 그린 것입니다 … `ceil(1000/32)=32` step … 총 1,600번 갱신" | `validation_split` 없이 1,000행·batch 32 → **32 step** | ✓ |
| 127행 (신설 공식 블록) | `validation_split 없음 : ceil(1000 / 32) = 32 step` | **32** | ✓ |
| 128행 (신설 공식 블록) | `validation_split=0.2 : 1000 x 0.8 = 800행 → ceil(800 / 32) = 25 step` | Keras 실제 학습 행 수 **800**, 실측 **25 step** | ✓ |
| 125행 (신설 일반식) | `step 수 = ceil( 학습에 실제로 쓰이는 행 수 / batch_size )` | 4개 조건에서 전부 성립 | ✓ |
| 131행 | "step이 32에서 **25**로 줄어듭니다 … 진행 막대(`25/25`)" | `verbose=1` 표준출력에 **문자열 `25/25` 실제 존재** 확인 | ✓ |
| 145행 | "진행 막대는 `32/32`가 아니라 **`25/25`** 로 찍히는 줄이 50번 반복됩니다" | 동일 | ✓ |
| 351행 (핵심 요약 신규 행) | "`ceil(학습에 실제로 쓰이는 행 수 / batch_size)`. **`validation_split`이 먼저 차감**되므로 … `ceil(800/32) = 25` step" | 동일 | ✓ |

**도해 무수정 판단 — 타당함으로 재확인.** `ch05_epoch-batch.svg`(MD5 무변경)의 "step = ceil(1000/32) = 32", "1 epoch = 1,000행 전체를 1회 통과 (step 32회)", "가중치는 총 1,600번 갱신"은 **명시된 전제(검증 미분리) 아래에서 전부 참**이며, 도해 스스로도 "1 epoch = 1,000행 **전체**를 1회 통과"라고 적어 전제를 이미 내포하고 있습니다. v1이 지적한 것은 산술 오류가 아니라 전제 미기재였고, 그 전제가 본문 첫 문장에 들어왔으므로 목적이 달성되었습니다. → **diagram-designer 조치 불필요.** 다만 잔여 LOW 1건(A-3 L-6) 참조.

### H-2 — Q4가 요구하는 "validation_split 선차감" 규칙 미교육 → **해소 (본문 ↔ 해설 용어까지 정합)**

122행에 규칙이 신설되었습니다.

> **여기서 한 가지 규칙을 함께 외워 두어야 합니다.** `fit`에 `validation_split`이 있으면 그 몫이 **먼저 빠지고**, 남은 행만 실제 학습에 쓰입니다. 그래서 step 수는 전체 행이 아니라 **검증분을 뺀 행 수**로 셉니다.

퀴즈 해설과의 정합을 문구 단위로 대조했습니다.

| | 본문 (신설) | `ch05_quiz.md` Q4 해설 494행 | 정합 |
|---|-------------|------------------------------|------|
| 규칙 진술 | "`validation_split`이 있으면 그 몫이 **먼저 빠지고**" | "`validation_split`이 **먼저 적용된다**는 점" | ✓ 동일 개념·동일 표현 계열 |
| 계산 대상 | "**검증분을 뺀 행 수**로 셉니다" | "검증분 20%를 뺀 1,600행만 가중치 갱신에 쓰이므로" | ✓ |
| 일반식 | 125행 `ceil(학습에 실제로 쓰이는 행 수 / batch_size)` | `ceil(1600/50) = 32` | ✓ 일반식에서 그대로 도출 |
| 오답 경계 | 131·145행 "32가 아니라 25" | 501행 "`ceil(2000/50) = 40`으로 답하는 것 — 검증분을 빼지 않은 실수" | ✓ 같은 함정을 본문이 미리 예방 |

**Q4 정답 재실증:** 2,000행 / `batch_size=50` / `validation_split=0.2` 조건에서 콜백 카운터로 측정한 실제 step = **32** (= `ceil(1600/50)`). 해설 주장과 일치하며, **이제 본문 125행 일반식만으로 도출 가능**합니다. 본문만 읽은 학습자가 40을 답하게 되던 경로가 닫혔습니다.

추가로 §5 170행에 상호 참조가 들어가 §4↔§5가 양방향으로 묶였습니다 — "떼어낸 검증 데이터는 **가중치를 고치는 데 쓰이지 않는다**는 점을 기억하십시오. §4에서 본 step 수를 검증분을 뺀 행 수로 세는 이유가 여기 있습니다." ✓

### H-3 — "0.97 안팎" 서술 → **해소 (5회 실행 전부 신규 구간 내)**

321행 신규 서술: "검증 정확도는 **0.98~1.00 구간**에서 형성됩니다(학습 데이터 398행의 20%인 검증 세트가 80건뿐이라 정확도 눈금이 `1/80 = 0.0125` 단위로 성깁니다). 라이브러리 버전과 실행 시점에 따라 소수점 아래는 달라지므로, 자기 결과가 구간 안에 들어오는지만 확인하면 됩니다."

| 검증 항목 | 실측 | 판정 |
|-----------|------|------|
| 마지막 `val_accuracy` (총 5회 실행: v1 2회 + v2 3회) | **1.0, 0.9875, 0.9875, 1.0, 1.0** — 5/5 모두 `0.98~1.00` 구간 내 | ✓ |
| 최근 10 epoch 최솟값 | 3회 모두 **0.9875** (구간 하한 이상) | ✓ |
| 전 구간 최댓값 | 1.0 | ✓ |
| "검증 세트가 80건" | `X_train` 398행 → 학습 318 / **검증 80** | ✓ |
| "눈금이 `1/80 = 0.0125` 단위" | 1/80 = **0.0125**, 관측값이 전부 0.0125 배수(0.9875, 1.0) | ✓ |
| 편차 고지 | 신규 병기 — 실제로 실행마다 0.9875↔1.0으로 갈리므로 **필요한 고지** | ✓ |

구간 표기(점 추정 → 구간 추정)로 바꾼 것은 이 코드의 실제 성질(80건 검증 세트의 성긴 눈금 + 실행 간 변동)에 정확히 대응하는 처방입니다.

### M-1 — `dict_keys` 순서 → **해소**

208행: "출력 요지: `dict_keys(['accuracy', 'loss', 'val_accuracy', 'val_loss'])` … **키가 찍히는 순서는 보장되지 않으므로**(회귀에서는 `['loss', 'mae', ...]` 순으로 나오기도 합니다) 순서로 기억하지 말고 **이름으로 찾으십시오.** 항상 같은 순서로 보고 싶다면 `print(sorted(history.history.keys()))`를 쓰면 됩니다."

| 검증 항목 | 실측 | 판정 |
|-----------|------|------|
| 분류 키 순서 | `['accuracy', 'loss', 'val_accuracy', 'val_loss']` (표준 코드 3회 실행 전부 동일) | ✓ 게재값과 일치 |
| 회귀 키 순서 | `['loss', 'mae', 'val_loss', 'val_mae']` | ✓ 괄호 안 부연과 일치 |
| `sorted()` 대안 | 퀴즈 Q3·Q4가 쓰는 idiom과 동일 — **퀴즈가 `sorted()`를 쓰는 이유가 본문에서 설명됨** | ✓ 부수 효과로 본문↔퀴즈 간극 1건 추가 해소 |

### M-2 — `metrics`에 손실 함수를 넣는 경우 → **해소 (양쪽 분기 모두 실측 부합)**

43행 신규 서술의 두 주장을 각각 실행 검증했습니다.

| 주장 | 실측 | 판정 |
|------|------|------|
| "`compile()`은 통과하더라도 `fit()`을 부르는 순간 `ValueError: Could not interpret loss identifier: accuracy`가 납니다" | `compile()` 통과 확인 → `fit()`에서 **문자열 단위로 동일한** `ValueError: Could not interpret loss identifier: accuracy` | ✓ |
| "`metrics=['binary_crossentropy']` … `compile()`은 통과하지만 `fit()`에서 **타깃 shape가 맞지 않아 오류가 나거나** 통과하더라도 **의미가 없습니다**" | `y`가 1차원(교재 표준) → `ValueError: Arguments 'target' and 'output' must have the same rank (ndim)`. `y`가 `(N,1)` → 통과하되 키가 `['binary_crossentropy', 'loss']`로 **loss와 동일 값 중복** | ✓ **양쪽 분기를 정확히 포괄** |

v1 지적("문법상 가능하지만"이 교재 표준 데이터에서 거짓)이 사라졌고, "오류가 나거나 통과하더라도 의미가 없다"는 표현이 두 경우를 모두 덮습니다.

## A-2. 수정으로 인한 회귀 검사 — **신규 결함 0건**

| 검사 | 결과 |
|------|------|
| **정본 4중 교차 (최우선)** | `ch05.md` §2 정본표 4행 **바이트 단위 무변경**, 핵심 요약 3행 무변경. `ch05_loss-decision.svg`·`ch05_quiz.md` **MD5 무변경**. → **v1의 4중 일치 그대로 유지** ✓ |
| 본문 python 코드 블록 | 10개(개수 변동 없음) 전량 재추출·재실행. 실행 가능 블록 전부 exit 0, 설명용 단편 4개 문맥 주입 후 exit 0. 신규 오류 0건 ✓ |
| §4 신규 서술 ↔ 시험장 표준 코드 | 표준 코드는 `X_train` 398행이라 step이 10회(≠25). 본문 145행이 **"`X_train`이 1,000행이라면"** 으로 조건을 명시해 두어 혼동 없음 ✓ |
| §4 신규 서술 ↔ `ch05_epoch-batch` 도해 | 도해 수치(32 step / 1,600 갱신)는 120행이 명시한 전제 아래 참. 모순 없음 ✓ |
| §4 ↔ §5 | 170행 상호 참조 신설로 양방향 정합 ✓ |
| 범위 경계 (Ch06/Ch07) | `callbacks=` · `.evaluate(` · `.predict(` **0건 유지** ✓ |
| 도해·문제 마커 | `DIAGRAM:` 6건 / `EXAM: ch05` 1건 유지, 플레이스홀더 id 6개 무변경 ✓ |
| 용어·표기 규칙 (커리큘럼 §6) | 금지 표기 **0건 유지**. 신규 문단도 "검증 데이터"·`step`·`batch_size` 규정 표기 준수 ✓ |
| 분량 | 산문 어절 1,625 → **1,834**, 전체 어절 2,029 → **2,275**. **전체 어절 기준으로 스펙 구간(2,200~2,600) 진입** ✓ (L-5 개선) |

## A-3. 잔여 항목 (7건 + 이월 6건)

| ID | 심각도 | 담당 | 요지 | v2 상태 |
|----|--------|------|------|---------|
| M-3 | MEDIUM | exam-writer | `ch05_quiz.md` 409행 "`metrics='accuracy'`는 최신 버전에서 통과되기도" ↔ Keras 3.15는 `compile()`에서 거부 | **미수정** (이번 수정 범위 밖) |
| M-4 | MEDIUM | chapter-writer / exam-writer | 본문 미소개 `model.output_shape` 7회 · `set_random_seed` 3회 (ch04 M-1 미반영 확대) | **미수정** |
| L-1 | LOW | chapter/diagram | 정본 4행 순서가 도해와 본문표에서 다름 | 미수정 |
| L-2 | LOW | chapter/diagram | 회귀 잎 `loss='mae'` 대안 ↔ `metrics=['mae']` 중복 | 미수정 |
| L-3 | LOW | chapter-writer | §6 `model.fit(...)` 리터럴 Ellipsis 블록 실행 불가(의도된 의사코드) | 미수정 (재확인) |
| L-4 | LOW | diagram-designer | `Dense(K, ...)` ↔ `Dense(n_classes, ...)` 표기 혼용 | 미수정 |
| L-5 | LOW | curriculum-architect | 분량 스펙 단위 미정의 | **개선** — 전체 어절 기준 스펙 진입, 산문 기준은 여전히 83% |
| **L-6** | **LOW (신규)** | diagram-designer | `ch05_epoch-batch.svg` 자체에는 "검증 미분리 전제"가 없어, 도해를 본문과 분리해 확대·인용할 경우 단서가 사라짐. **본문 120행이 전제를 명시해 정합성은 확보됨** — 도해 하단 주석에 "(validation_split을 쓰면 검증분을 뺀 행 수로 다시 셉니다)" 반절 추가는 선택 사항 | 신규(선택) |
| R-1~R-6 | — | 각 담당 | ch04 리포트 8개 조치 항목 및 ch03 L-3 — **여전히 반영 0건** | 변동 없음 |

## A-4. 재검수 증적

- **step 실측 6종:** `validation_split` 없음 → 32 / `=0.2` → **25** (콜백 배치 카운터), Keras 실제 학습 행 수 800, `verbose=1` 표준출력에 문자열 `25/25` 존재 확인, 퀴즈 Q4 조건(2,000행·batch 50·split 0.2) → **32**, 표준 코드(398행) → 10.
- **`val_accuracy` 실측:** 수정본 표준 코드 3회 추가 실행(누적 5회) — 마지막 값 `{1.0, 0.9875, 0.9875, 1.0, 1.0}`, 최근 10 epoch 최솟값 3회 모두 0.9875, 검증 세트 80건 확인.
- **예외 메시지 3종 재현:** `Could not interpret loss identifier: accuracy` / `Arguments 'target' and 'output' must have the same rank (ndim)` / `metrics=['binary_crossentropy']` + 2D `y` → 키 `['binary_crossentropy', 'loss']`.
- **코드 블록:** 10개 전량 재추출·재실행, 신규 오류 0건.
- **무변경 확인(MD5):** `ch05_loss-decision.svg`, `ch05_epoch-batch.svg`, `ch05_quiz.md`.
- **`ch05.md` 말미 `verified` 스탬프를 v2 실행 결과로 갱신했습니다.** (검증 증적 기록 외의 본문 수정은 하지 않았습니다.)

---

# §B. 1회차 검수 (v1) — 2026-07-28 · 원문 보존

> 아래 판정표와 지적 사항은 **수정 전 상태**를 기록한 것입니다. H-1·H-2·H-3·M-1·M-2는 §A에서 해소 확인되었습니다.


- **검수 일자:** 2026-07-28
- **검수자:** tech-reviewer (incremental QA, 1회차)
- **검수 대상**
  - `_workspace/chapters/ch05.md`
  - `_workspace/diagrams/ch05_compile-triple.svg`, `ch05_loss-decision.svg`, `ch05_epoch-batch.svg`, `ch05_validation-split.svg`, `ch05_history-curve.svg`, `ch05_optimizer-lr.svg`
  - `_workspace/exams/ch05_quiz.md`
- **기준 문서:** `_workspace/01_curriculum.md` §2 의존 관계 / §3 Ch05 스펙 / §4 도해 인벤토리 / §5.1 문제 배치 / §6 용어 규칙, `.claude/skills/aice-domain/SKILL.md`
- **실행 환경:** Python 3.13.5 / TensorFlow 2.21.0 / Keras 3.15.0 / scikit-learn 1.9.0 / numpy 2.5.0 / matplotlib 3.11.1
  (`/Users/newid/.pyenv/versions/3.13.5/bin/python3`)

---

## 판정

**조건부 통과 — CRITICAL 0건 / HIGH 3건**

| 심각도 | 건수 |
|--------|------|
| CRITICAL | 0 |
| HIGH | 3 |
| MEDIUM | 4 |
| LOW | 5 |
| 회귀(이전 리포트 미반영 이월) | 6 |

**의뢰받은 최중요 항목(loss 정본 4중 일치)은 완전 통과**입니다. HIGH 3건은 모두 **`ceil(1000/32)=32` 계열 수치와 게재 실행 결과**에 몰려 있으며, 손실 함수 정본 체계와는 무관합니다. Ch06 진행을 차단할 사유는 아니나, H-1·H-2는 같은 뿌리라 **Ch06 집필 전에 한 번에 처리**하는 편이 비용이 낮습니다.

---

## 0. 최우선 확인 — loss 정본 4중 교차 일치 검증

**결과: PASS (4면 완전 일치, 불일치 0건)**

`ch05_loss-decision` 도해의 4개 잎 ↔ 본문 §2 정본표 ↔ 퀴즈 Q1 정답(3번) ↔ Ch08 템플릿 표(`ch08.md` §8.1 표 + `ch08_three-templates.svg`)를 셀 단위로 대조했습니다.

| 유형 | ① `ch05_loss-decision` 잎 | ② `ch05.md` §2 정본표 | ③ `ch05_quiz.md` Q1 정답 3번 | ④ `ch08.md` 표 / `ch08_three-templates.svg` | 판정 |
|------|---------------------------|----------------------|------------------------------|---------------------------------------------|------|
| 이진분류 | `Dense(1, activation='sigmoid')` / `'binary_crossentropy'` / `['accuracy']` | 동일 | `Dense(1,'sigmoid')` + `binary_crossentropy` | 동일 | **4/4 일치** ✓ |
| 다중분류 (정수 라벨) | `Dense(K, activation='softmax')` / `'sparse_categorical_crossentropy'` / `['accuracy']` | 동일 | `Dense(3,'softmax')` + `sparse_categorical_crossentropy` | 동일 (변수명만 `n_classes`) | **4/4 일치** ✓ |
| 다중분류 (원-핫) | `Dense(K, activation='softmax')` / `'categorical_crossentropy'` / `['accuracy']` | 동일 | `Dense(3,'softmax')` + `categorical_crossentropy` | Ch08 표에는 없으나 `ch08.md` 241행이 **"정본은 `ch05_loss-decision`"** 으로 이관 — 커리큘럼 §2 중복 금지 준수 | **일치** ✓ |
| 회귀 | `Dense(1)` 활성화 없음 / `'mse'` (또는 `'mae'`) / `['mae']` | 동일 | `Dense(1)` + `mse` | 동일 | **4/4 일치** ✓ |

부수 확인:

- **Ch04 loss 무침범 재확인** — `ch04_output-layer-choice.svg`에 손실 함수명·`mse`·`mae` 문자열 **0건**. `ch04.md` 189행이 정본을 `ch05_loss-decision`으로 지시. 커리큘럼 §2·§4 중복 방지 메모 준수 ✓
- **정본 참조 체인 일관** — `ch04.md` 189행 / `ch06.md` 345행 / `ch08.md` 34·241·579행 / `ch08_quiz.md` 315행이 모두 `ch05_loss-decision`을 정본으로 지목. 경쟁 정본 없음 ✓
- **네 짝이 실제로 학습되는지 실행 확인** — Q1 해답 코드 실행 결과 4유형 전부 학습 성공, 출력 shape `(None,1)`/`(None,3)`/`(None,3)`/`(None,1)` ✓
- 도해와 본문표의 **행 순서만 다릅니다**(도해: 회귀→이진→다중정수→다중원핫 / 본문표: 이진→다중정수→다중원핫→회귀). 내용은 동일 → **L-1**

---

## 1. 경계면 교차 비교 결과

### 1.1 DIAGRAM 플레이스홀더 ↔ SVG 파일 — PASS (누락 0 / 고아 0)

| # | 플레이스홀더 id (ch05.md) | SVG 파일 | 커리큘럼 §4 | XML | `role`/`aria-label`/`<title>` |
|---|---------------------------|----------|-------------|-----|------------------------------|
| 1 | `ch05_compile-triple` (22행) | 존재 | #24 ✓ | wellformed | 모두 있음 ✓ |
| 2 | `ch05_loss-decision` (49행) | 존재 | #25 ✓ | wellformed | 모두 있음 ✓ |
| 3 | `ch05_optimizer-lr` (94행) | 존재 | #29 ✓ | wellformed | 모두 있음 ✓ |
| 4 | `ch05_epoch-batch` (116행) | 존재 | #26 ✓ | wellformed | 모두 있음 ✓ |
| 5 | `ch05_validation-split` (143행) | 존재 | #27 ✓ | wellformed | 모두 있음 ✓ |
| 6 | `ch05_history-curve` (184행) | 존재 | #28 ✓ | wellformed | 모두 있음 ✓ |

- 스펙 요구 6개 = 실제 6개 = 플레이스홀더 6개. `diagrams/ch05_*.svg` 고아 파일 0건.
- 플레이스홀더의 구도 지시 문자열이 커리큘럼 §3 Ch05 표 원문과 6/6 일치.
- 본문 배치 순서는 §3 optimizer 절이 먼저라 `ch05_optimizer-lr`가 `ch05_epoch-batch`보다 앞에 옵니다. 커리큘럼 표 순서와 다르나 서술 흐름상 타당하며 스펙 위반 아님.
- 팔레트 일관: `#2563eb`(primary) / `#dbeafe`(primary-soft) / `#94a3b8`(muted) / `#f59e0b`(accent) / `#dc2626`(danger) / `#059669`(success) — ch04와 동일 체계 ✓

### 1.2 EXAM 마커 ↔ 문제 파일 — PASS

- `ch05.md` 338행 `<!-- EXAM: ch05 -->` 1건, 핵심 요약 직후 배치 ✓
- `_workspace/exams/ch05_quiz.md` 존재. front-matter `chapter: 5` — 챕터 번호 일치 ✓
- front-matter `items: 6`, `types: { 객관식: 2, 코드빈칸: 2, 오류찾기: 2 }` — 커리큘럼 §5.1 Ch05 행(6 / 2 / 2 / 2)과 완전 일치 ✓
- 실제 문항: Q1 객관식 · Q2 객관식 · Q3 코드빈칸 · Q4 코드빈칸 · Q5 오류찾기 · Q6 오류찾기 = 선언과 일치 ✓
- 난이도 배분: 기본 4(Q1·Q2·Q3·Q5) / 응용 2(Q4·Q6) = 67:33 — 규격 70:30 근사 ✓
- 심는 오답 포인트 2종 배치 확인: **"정수 라벨에 `categorical_crossentropy`"**(Q5 전체 주제, Q1 오답 1·5번) / **"metrics·loss 혼동"**(Q2 3·5번, Q6 오류 ②) ✓
- 해설 3단 구성(정답 코드 / 왜 이렇게 푸는가 / 자주 틀리는 지점) — 6/6 문항 충족 ✓
- 기출 변형 고지문 10행 존재 ✓

### 1.3 도해 수치·용어 ↔ 본문 대조

| 도해 | 도해 표기 | 본문 대응 | 재계산 | 판정 |
|------|-----------|-----------|--------|------|
| `ch05_epoch-batch` | `step = ceil(1000 / 32) = 32` | §4 120행 동일 | ceil(31.25)=32 ✓ | 산술 일치 (단, 문맥 문제 → **H-1**) |
| `ch05_epoch-batch` | `1,000 = 31 x 32 + 8`, "마지막 step은 8행" | 본문 미언급(도해 단독 보강) | 31×32=992, +8=1000 ✓ | 정확 ✓ |
| `ch05_epoch-batch` | 배치 블록 실측 **31개(폭 19.46) + 1개(폭 4.86)** = 32블록 | "step 32회" | 4.86/19.46 = 0.25 = 8/32 ✓ | 그림과 수치 일치 ✓ |
| `ch05_epoch-batch` | "epochs=50 이면 … 가중치는 총 1,600번 갱신" | §4 120행 동일 | 32×50=1600 ✓ | 산술 일치 (문맥 문제 → **H-1**) |
| `ch05_optimizer-lr` | `learning_rate=0.001 (Adam 기본값)` | §3 100행 "Adam의 기본 학습률은 `0.001`", 코드 `Adam(learning_rate=0.001)` | Keras 3 기본값 0.001 ✓ | 일치 ✓ |
| `ch05_optimizer-lr` | "튀거나 발산 (nan)" | §3 110행 "손실이 … `nan`으로 튀면 학습률이 너무 큰 경우를 의심" | — | 일치 ✓ |
| `ch05_compile-triple` | loss 갈래만 primary(#dbeafe/#2563eb), "모델이 실제로 줄이는 값" / metrics "학습에 영향 없음" | §1 표 3행 + 40행 서술 | — | 강조 지점까지 일치 ✓ |
| `ch05_validation-split` | 3단(전체 → 학습 70%/평가 30% → 학습 80%/검증 20%), `train_test_split(test_size=0.3)` | §5 표 3행 + 시험장 표준 코드 `test_size=0.3`, `validation_split=0.2` | 412/515=80.0% ✓ | 일치 ✓ |
| `ch05_validation-split` | "학습 데이터의 뒤쪽 20%를 섞지 않고 그대로 잘라냅니다" | §5 178행 시험 포인트 동일 | — | 일치 ✓ |
| `ch05_history-curve` | `history.history['loss']` / `['val_loss']` 범례, val이 train 위(손실 더 큼), 두 줄 동반 하강 | §6 "두 줄이 함께 내려가면 정상" | — | 일치 ✓ |
| `ch05_loss-decision` | 4잎 × (출력층/loss/metrics) | §2 정본표 4행 | — | **4중 일치**(§0) ✓ |

**도해가 3층인데 본문이 4층인 유형의 구조 불일치는 0건**입니다. 단 `ch05_epoch-batch`의 step 수치는 본문의 인접 코드 블록과 전제가 어긋납니다(→ H-1).

### 1.4 문제 범위 ↔ 본문에서 가르친 범위

| 문항 | 요구 지식 | 본문 근거 | 판정 |
|------|-----------|-----------|------|
| Q1 | 타깃 형태 → loss·출력층 짝, `y.shape` 1D/2D 판별 | §2 정본표·분기도·`sparse_` 설명 | 범위 내 ✓ |
| Q2 | loss vs metrics 역할, `loss='accuracy'` 불가 | §1 표 + 40·43행 시험 포인트 | 범위 내 ✓ |
| Q3 | `binary_crossentropy`, `['accuracy']`, `validation_split=0.2`, history 키 4개 | §1·§2·§5·§6 | 범위 내 ✓ |
| Q4 | `len(np.unique(y))`, `Dense(K,'softmax')`, `sparse_`, `validation_split`, `to_categorical` | §2 80·83행, Ch04 §4.4 | 범위 내 ✓ |
| Q4 추가1 | **step = ceil(N×0.8 / batch)** — 검증분 선차감 | **본문 미교육** | → **H-2** |
| Q5 | 정수 라벨 ↔ `categorical_crossentropy` shape 오류, 두 가지 수정법 | §2 83행 시험 포인트(양쪽 수정법까지 명시) | 범위 내 ✓ |
| Q6 | 회귀 출력층 활성화 제거, `mse`+`mae` 자리 | §2 88행 시험 포인트, §1 43행 | 범위 내 ✓ |

- **Ch06/Ch07 침범 0건** — `callbacks=` 인자 사용 0회, `EarlyStopping()`·`ModelCheckpoint()` 생성 0회, `.evaluate(`·`.predict(`·`classification_report`·`confusion_matrix` 0회. 본문 137·155·248행과 퀴즈 13·403행의 `EarlyStopping` 언급은 전부 **"Ch06에서 다룹니다" 형태의 이관 안내**이며, 퀴즈 13행은 아예 범위 고지문입니다. **의뢰 지정 확인 항목 — 통과** ✓
- **AICE Associate 범위 밖 주제(CNN/RNN/Transformer/PyTorch) 0건** ✓
- 본문 미소개 API 2종이 해답 코드에 사용됨: `model.output_shape` 7회, `tf.keras.utils.set_random_seed` 3회 → **M-4**

### 1.5 커리큘럼 학습 목표 ↔ 챕터 실제 내용 — PASS (3/3)

| # | 학습 목표 | 담당 절 | 문제 대응 | 판정 |
|---|-----------|---------|-----------|------|
| 1 | 문제 유형·라벨 형태에 맞는 손실 함수 선택 | §2 정본표·분기도 | Q1·Q3·Q4·Q5·Q6 | 충족 ✓ |
| 2 | `fit`의 epochs·batch_size·validation 인자 설정 | §4, §5 | Q3·Q4 | 충족 ✓ (단 step-검증분 상호작용 누락 → H-2) |
| 3 | `history`로 학습 곡선을 그리고 상태 읽기 | §6 | Q3(키 4개) | 충족 ✓ |

커리큘럼 §3 Ch05 "핵심 코드 패턴" 대조:

| 요구 | ch05.md | 판정 |
|------|---------|------|
| `compile(optimizer='adam', loss=..., metrics=['accuracy'])` | §1 26~30행, 시험장 표준 코드 291~293행 | ✓ |
| `fit(epochs=50, batch_size=32, validation_split=0.2, verbose=1)` | §4 128~131행, 시험장 표준 코드 296~299행 | ✓ |
| `print(history.history.keys())` | §6 190행, 301행 | ✓ |
| **학습 곡선 플롯 함수(loss/val_loss, metric/val_metric 2패널) 재사용 가능 형태** | §6 `plot_history(history)` — 지표 이름 자동 탐지, `val_` 유무 방어 | ✓ (실행 확인) |
| **`validation_data=(X_val, y_val)` 대안 표기 병기** | §5 "방법 B" 165~172행 | ✓ |
| `Input(shape=(n,))` / `.keras` / `tensorflow.keras` 경로 | 전 코드 준수, `Input(shape=(X_train.shape[1],))` | ✓ |

### 1.6 용어·표기 통일 (커리큘럼 §6) — 위반 0건

- 금지 표기 전수 grep(오버피팅·히든 레이어·숨은층·액티베이션·비용 함수·로스·콜백함수·러닝 커브·에포크·배치사이즈) → **0건** ✓
- "손실 함수", "과적합", "은닉층", "학습 곡선", "콜백", "학습 데이터 / 검증 데이터 / 평가(테스트) 데이터" 규정 표기 준수 ✓
- `epoch`/`batch_size` 코드체 유지 ✓
- 경어체 통일, 난이도 단정 표현("쉽죠?" 등) 0건 ✓
- 첫 등장 병기: "학습률(learning rate)"(§3), "`mse`(mean squared error, 평균제곱오차)"·"`mae`(mean absolute error, 평균절대오차)"(§2) ✓

### 1.7 SVG 내부 id 충돌 — **ch05 실제 충돌 0건 (`ld-arrow` 보고 건 무근거)**

의뢰에서 지목된 `ld-arrow` 충돌 가능성을 **현존 SVG 43개 전체 대상 교차 grep**으로 확인했습니다.

| ch05 파일 | 내부 id | 책 전체 출현 횟수 |
|-----------|---------|-------------------|
| `ch05_compile-triple.svg` | `ct-arrow-muted`, `ct-arrow-primary` | 각 1회 |
| `ch05_loss-decision.svg` | **`ld-arrow`** | **1회 — 충돌 없음** |
| `ch05_optimizer-lr.svg` | `lr-arrow-muted`, `lr-arrow-success`, `lr-arrow-danger` | 각 1회 |
| `ch05_validation-split.svg` | `vs-arrow` | 1회 |
| `ch05_epoch-batch.svg`, `ch05_history-curve.svg` | (marker 미사용, id 없음) | — |

**ch05 id 7개 모두 책 전체에서 유일**합니다. 인라인 임베드 시 즉시 깨지는 문제 없음. 다만 접두어에 챕터 표식이 없어 장래 충돌 여지는 남습니다(ch03 M-2 / ch04 L-3 이월 → **R-2**).

책 전체에서 실제 중복은 여전히 `ah-ink` 7건(Ch02 도해)뿐입니다 → **R-3**.

---

## 2. 코드 실행 검증

### 2.1 본문 코드 블록 (10개 — 실행 가능 5/5 통과, 단편 5개 문맥 실행 확인)

`ch05.md`의 python 코드 블록 10개를 전량 추출해 실행했습니다.

| # | 위치 | 성격 | 실행 방식 | 결과 |
|---|------|------|-----------|------|
| 1 | §1 26행 `compile` 3인자 | 단편(설명용) | 모델 문맥 주입 | exit 0 ✓ |
| 2 | §2 66행 3유형 출력층+compile | 단편 | 모델 문맥 주입 | exit 0 ✓ |
| 3 | §3 102행 `Adam(learning_rate=0.001)` | 단편 | 모델 문맥 주입 | exit 0 ✓ |
| 4 | §4 128행 `fit` 표준형 | 단편 | compile 문맥 주입 | exit 0 ✓ |
| 5 | §5 159행 방법 A / 방법 B | 단편 | compile 문맥 주입 | exit 0 ✓ (`stratify=y_train` 포함 정상) |
| 6 | §6 188행 `model.fit(...)` | **의사코드**(리터럴 `...`) | — | `ValueError: Unrecognized data type: x=Ellipsis` — 의도된 자리표시자, 실행 대상 아님 → **L-3** |
| 7 | §6 201행 `plot_history` | 실행 가능 | 블록 9 누적 | exit 0 ✓ 2패널 그림 생성, 지표 자동 탐지 `['accuracy']` 정상 |
| 8 | §6 242행 history 값 추출 | 실행 가능 | 블록 9 누적 | exit 0 ✓ `총 학습 epoch 수: 50` |
| 9 | **시험장 표준 코드 256행** | **단독 실행** | 단독 | exit 0 ✓ (아래 상세) |
| 10 | 310행 유형 교체 3줄 | 단편 | 모델 문맥 주입 | exit 0 ✓ |

**시험장 표준 코드(블록 9) 실측 대조 — 의뢰 지정 확인 항목**

| 본문 게재(306행) | 실측 | 판정 |
|------------------|------|------|
| `X shape: (569, 30) / y 앞 5개: [0 0 0 0 0]` | **정확히 일치** | ✓ |
| epoch당 `loss`/`accuracy`/`val_loss`/`val_accuracy` 4값 × 50줄 | 일치 (X_train (398,30) / X_test (171,30), 검증 80행, 10 step/epoch) | ✓ |
| `dict_keys(['loss', 'accuracy', 'val_loss', 'val_accuracy'])` (193행) | **`dict_keys(['accuracy', 'loss', 'val_accuracy', 'val_loss'])`** | **순서 불일치 → M-1** |
| **"검증 정확도는 0.97 안팎에서 형성됩니다"** | **마지막 `val_accuracy` = 1.0 / 0.9875 (2회 실행), 최근 10 epoch 평균 0.995, 전 구간 최댓값 1.0** | **불일치 → H-3** |

`history.history['val_accuracy']` 전 구간 실측: `[0.9125, 0.9375, 0.95, 0.95, 0.95, 0.9625, 0.975, 0.975, 0.9875, … (이후 0.9875와 1.0 사이에서만 진동) …, 1.0, 1.0]`

deprecated API·import 누락·shape 오류 **0건**. Keras 2/3 양립 표준(`Input(shape=(n,))`) 위반 0건.

### 2.2 문제 해답 코드 (12블록 전량 실행) 및 서술 주장 재검증

| 문항 | 실행 결과 | 문제지 표기 | 판정 |
|------|-----------|-------------|------|
| Q1 | 4유형 전부 학습 성공, shape `(None,1)`/`(None,3)`/`(None,3)`/`(None,1)` | 동일 | ✓ |
| Q2 | `metrics=['accuracy']`·`['mae']` 두 학습의 loss 수열 **완전 동일** `[0.730719, 0.722522, 0.714187, 0.705478, 0.696704]`, `True` | 동일(자릿수까지) | ✓ |
| Q2 보조 | `loss='accuracy'` → compile 통과, fit에서 `ValueError: Could not interpret loss identifier: accuracy` | 동일 | ✓ |
| Q3 | `y_train[:5] = [1 0 0 0 0] / 클래스: [0 1]`, 키 `['accuracy','loss','val_accuracy','val_loss']`, **`마지막 val_accuracy: 0.9821`** | 동일 | ✓ **게재 수치 재현 성공** |
| Q4 | `n_class = 3 / 출력 shape = (None, 3)`, 진행 막대 **`32/32`**, `to_categorical` 후 `(2000, 3)` 첫 행 `[0. 1. 0.]` | 동일 | ✓ |
| Q4 step 주장 | 별도 실험: 1,000행·batch 32에서 `validation_split` 없음 → **32 step**, `validation_split=0.2` → **25 step** | `ceil(1600/50)=32` 논리 실증 | ✓ **정답 근거 확립** |
| Q5 | 문제지 코드 그대로 실행 → `ValueError: Arguments 'target' and 'output' must have the same rank (ndim). Received: target.shape=(32,), output.shape=(32, 4)` | 동일(문자열 단위) | ✓ |
| Q5 | 수정 A/B 양쪽 정상 학습, `y shape (600,)` / `(600, 4)`, 출력 shape 둘 다 `(None, 4)` | 동일 | ✓ |
| Q6 | 문제지 코드 그대로 → `ValueError: Could not interpret loss identifier: accuracy` | 동일 | ✓ |
| Q6 | `y_train` 범위 **88.8 ~ 277.9**, sigmoid 잔존 `val_mae = 186.05`, 수정본 `val_mae = 24.02`, 키 `['loss','mae','val_loss','val_mae']` | 동일(소수 2자리까지) | ✓ |

**exam-writer 자체 검증 주석(669~677행) 기대값 전 항목 독립 재현 확인.** 특히 Q3의 `val_accuracy 0.9821`은 지시값(`epochs=50`/`batch_size=32`/`validation_split=0.2`) 그대로 재현되었고, 조건 병기 문장(395행)과 환경 편차 고지도 적절합니다.

**추가로 검증한 본문·해설 주장 6건**

| 위치 | 주장 | 실측 | 판정 |
|------|------|------|------|
| `ch05.md` 43행 | "`metrics=['binary_crossentropy']`처럼 손실 함수를 지표 자리에 넣는 것은 **문법상 가능하지만** 의미가 없습니다" | `y`가 1차원 `(N,)`(교재 표준)이면 **fit에서 `ValueError` rank 불일치**. `y`를 `(N,1)`로 만들면 통과 | **부정확 → M-2** |
| `ch05.md` 134행 | "`batch_size`를 지정하지 않으면 기본값 `32`" | 200행 → 7 step = ceil(200/32) ✓ | 정확 ✓ |
| `ch05.md` 155행 | "검증 데이터를 지정하지 않으면 `history`에 `val_loss`가 생기지 않고" | 키 `['accuracy','loss']`만 생성 ✓ | 정확 ✓ |
| `ch05.md` 197행 | "회귀에서 `metrics=['mae']`면 키는 `mae`, `val_mae`" | `['loss','mae','val_loss','val_mae']` ✓ | 정확 ✓ |
| `ch05_quiz.md` 409행 | "`metrics='accuracy'`처럼 리스트를 빼는 것 — **최신 버전에서는 통과되기도 하지만**" | Keras 3.15: `ValueError: Expected 'metrics' argument to be a list, tuple, or dict.` **통과하지 않음** | **오해 소지 → M-3** |
| `ch05_quiz.md` 351·664행 | 회귀에 `metrics=['accuracy']` → "0에 가까운 숫자만 찍힙니다" | `[0.0, 0.0]` ✓ | 정확 ✓ |

---

## 3. 지적 사항

### CRITICAL — 0건

없습니다. AICE Associate 범위 필수 항목 누락 없음, loss 정본 체계 오류 없음, 코드 실행 실패 없음.

### HIGH — 3건

#### H-1. §4의 step·갱신 횟수 산식이 바로 아래 코드 블록의 `validation_split=0.2`와 모순 (본문 + 도해 2면)

**담당: chapter-writer (주) / diagram-designer (부)**
· 위치: `ch05.md` 120행, 128~131행 코드 블록 / `ch05_epoch-batch.svg` 63·65·66행

본문 120행은 이렇게 씁니다.

> 학습 데이터가 1,000행이고 `batch_size=32`라면 … `ceil(1000 / 32) = 32` step이 필요하고 … `epochs=50`이면 … 가중치는 총 **1,600번** 갱신됩니다.

그런데 **여덟 줄 아래**(128~131행) 이 설명의 실행 형태로 제시되는 코드는 `validation_split=0.2`를 포함합니다.

```python
history = model.fit(X_train, y_train,
                    epochs=50, batch_size=32,
                    validation_split=0.2, verbose=1)
```

실측 결과 두 전제는 다른 답을 냅니다.

| 조건 | 실측 step/epoch | 50 epoch 총 갱신 |
|------|-----------------|------------------|
| `validation_split` 없음 | **32** | 1,600 |
| `validation_split=0.2` | **25** | 1,250 |

즉 본문이 제시한 코드를 1,000행 데이터에 그대로 돌리면 화면에는 `32/32`가 아니라 **`25/25`가 찍힙니다.** 학습자가 진행 막대와 본문을 대조하는 순간 어긋납니다. `ch05_epoch-batch` 도해도 같은 전제로 "step 32회", "총 1,600번 갱신"을 단정합니다.

산술 자체는 옳습니다(ceil(1000/32)=32, 32×50=1600). 문제는 **적용 조건이 명시되지 않은 것**입니다.

**권고(최소 수정):**
- `ch05.md` 120행 문장 끝에 조건 명시 — "(이 계산은 검증 데이터를 떼지 않았을 때 기준입니다. `validation_split`을 쓰면 검증분을 뺀 행 수로 다시 계산합니다 — §5 참조)"
- `ch05_epoch-batch.svg` 66행 주석에 같은 단서 반절 추가 — "(validation_split을 쓰면 검증분을 뺀 행 수 기준으로 다시 셉니다)"
- 대안: §4 코드 블록에서 `validation_split=0.2`를 빼고 §5에서 처음 도입 — 다만 §4 표의 `verbose` 행과 커리큘럼 §3 표준 패턴이 이 인자를 포함하므로 **단서 추가 쪽을 권합니다.**

#### H-2. Q4가 정답 조건으로 요구하는 "validation_split 선차감" 규칙을 본문이 가르치지 않음

**담당: chapter-writer (1순위) / exam-writer (대안)**
· 위치: `ch05_quiz.md` 142행(추가 질문 1), 458~463행(해답), 494행(해설) ↔ `ch05.md` §4·§5 전체

Q4 추가 질문 1은 `X_train (2000, 12)`, `batch_size=50`, `validation_split=0.2`에서 step 수를 묻고, 정답은 **`ceil(1600/50) = 32`** 입니다. 해설 494행도 "**step 수 계산에서 놓치기 쉬운 것은 `validation_split`이 먼저 적용된다는 점**"이라고 명시하며, 오답 `ceil(2000/50)=40`을 "자주 틀리는 지점"으로 지정합니다.

그런데 **본문 어디에도 이 규칙이 없습니다.**

- §4는 검증 분리를 언급하지 않은 채 `ceil(전체행/batch)` 공식만 제시합니다(H-1).
- §5는 `validation_split`이 학습 데이터의 20%를 떼어낸다고 설명하지만, **그 결과 step 수가 줄어든다는 연결은 하지 않습니다.**

본문만 읽고 §4 공식을 적용한 학습자는 정확히 해설이 오답으로 지목한 **40**을 답하게 됩니다. 경계면 체크리스트 4항("본문에서 가르치지 않은 것을 출제 → HIGH")에 정면으로 해당합니다.

사용된 함수·인자(`validation_split`, `batch_size`, `ceil`)는 전부 범위 안이고 해설의 설명도 정확하므로, **문항을 뺄 사안이 아니라 본문 한 문장을 채울 사안**입니다. H-1과 뿌리가 같아 **같은 수정으로 동시 해소됩니다.**

**권고:** H-1의 §4 단서 추가에 한 줄만 더 붙입니다 — "예를 들어 1,000행에 `validation_split=0.2`를 쓰면 실제 학습에 쓰이는 행은 800이므로 `ceil(800/32) = 25` step이 됩니다." 이 한 문장이 H-1·H-2를 함께 닫습니다.

#### H-3. 시험장 표준 코드의 "검증 정확도는 0.97 안팎" 서술이 실측과 불일치

**담당: chapter-writer**
· 위치: `ch05.md` 306행

> 검증 정확도는 **0.97 안팎**에서 형성됩니다.

지시된 설정 그대로(`load_breast_cancer`, `test_size=0.3`, `random_state=42`, `stratify=y`, `StandardScaler`, 64→Dropout(0.3)→32→1, `epochs=50`, `batch_size=32`, `validation_split=0.2`) 2회 실행한 실측입니다.

| 항목 | 실측 |
|------|------|
| 마지막 `val_accuracy` | **1.0** (1회차) / **0.9875** (2회차) |
| 최근 10 epoch 평균 | **0.995** |
| 전 구간 최댓값 | 1.0 |
| 0.975 이하로 내려간 구간 | epoch 1~8 (초기 상승 구간)뿐 |
| 마지막 `val_loss` | 0.0168 / 0.0183 |

구조적으로도 0.97은 나올 수 없는 값입니다. 학습 데이터 398행의 20%인 **검증 세트가 80개**뿐이라 `val_accuracy`의 눈금은 1/80 = 0.0125 단위이고, 0.97 근처의 가능한 값은 **0.9625 또는 0.975**입니다. 수렴 구간의 실제 값은 **0.9875와 1.0 두 개 사이에서만 진동**합니다.

학습자는 이 코드를 시험장 리허설로 돌려 보고 자기 결과(0.99~1.00)와 본문(0.97)을 대조합니다. 실제보다 낮게 적힌 기대값은 "내 모델이 더 좋은가?"라는 불필요한 의심을 만듭니다.

또한 이 서술에는 **환경 편차 고지가 없습니다.** `ch05_quiz.md` 395행은 같은 성격의 수치에 "환경과 seed에 따라 소수점 아래는 달라집니다"를 병기하고 있어, 본문 쪽만 기준이 헐겁습니다(실제로 본 검수의 2회 실행도 1.0 ↔ 0.9875로 갈렸습니다).

**권고:** 306행을 "검증 정확도는 **0.98~1.00** 구간에서 형성됩니다(검증 세트가 80건뿐이라 눈금이 0.0125 단위입니다). 환경과 실행마다 소수점 아래는 달라집니다." 로 교체.

### MEDIUM — 4건

#### M-1. §6의 `dict_keys(...)` 게재 순서가 실제 출력과 다름

**담당: chapter-writer**
· 위치: `ch05.md` 193행

본문은 `print(history.history.keys())`의 출력을 이렇게 적습니다.

> 출력 요지: `dict_keys(['loss', 'accuracy', 'val_loss', 'val_accuracy'])`

실측(Keras 3.15, 분류)은 **`dict_keys(['accuracy', 'loss', 'val_accuracy', 'val_loss'])`** 입니다. 시험장 표준 코드 301행의 실행 결과도 동일합니다.

흥미롭게도 **회귀는 본문 순서와 일치**합니다(`['loss', 'mae', 'val_loss', 'val_mae']`). 즉 순서는 지표 이름에 따라 갈리며 보장되지 않습니다. `ch05_quiz.md`가 Q3·Q4에서 `sorted(history.history.keys())`를 쓴 것은 이 불안정성을 이미 우회한 설계로 보입니다.

키 **이름**과 §6의 명명 규칙 설명(`val_` 접두어, `metrics` 이름 그대로)은 전부 정확하므로 개념 전달에는 문제가 없습니다. 다만 학습자가 화면과 한 글자씩 대조하는 지점이라 바로잡는 편이 좋습니다.

**권고:** 193행을 실측 순서로 교체하고 "키의 **순서는 보장되지 않으므로** 이름으로 찾으십시오. 정렬해 보려면 `sorted(history.history.keys())`를 쓰면 됩니다." 한 줄 추가. 퀴즈가 `sorted()`를 쓰는 이유도 함께 설명됩니다.

#### M-2. §1의 "`metrics=['binary_crossentropy']`는 문법상 가능" 서술이 교재 표준 데이터에서는 거짓

**담당: chapter-writer**
· 위치: `ch05.md` 43행

> 반대로 `metrics=['binary_crossentropy']`처럼 손실 함수를 지표 자리에 넣는 것은 **문법상 가능하지만** 의미가 없습니다.

실측 결과는 `y`의 형태에 따라 갈립니다.

| `y` 형태 | 결과 |
|----------|------|
| `(N,)` — **교재 전체가 쓰는 표준 형태** | `fit()`에서 `ValueError: Arguments 'target' and 'output' must have the same rank (ndim). Received: target.shape=(None,), output.shape=(None, 1)` |
| `(N, 1)` | 통과, 키 `['binary_crossentropy', 'loss']` |

`compile()`은 양쪽 모두 통과합니다. 즉 교재의 표준 데이터 형태에서 이 코드는 **동작하지 않습니다.** 같은 문단이 바로 앞에서 `loss='accuracy'`의 실패를 정확히 설명하고 있어 대비가 더 두드러집니다.

교육적 의도(자리를 바꾸지 말라)는 옳고, 오히려 실제 결과가 의도를 더 강하게 뒷받침합니다.

**권고:** "문법상 가능하지만 의미가 없습니다" → "`compile()`은 통과하지만 `fit()`에서 shape 오류가 나거나, 통과하더라도 의미가 없습니다. **`loss`와 `metrics`는 서로의 자리에 넣는 값이 아닙니다.**"

#### M-3. Q3 해설의 "`metrics='accuracy'`는 최신 버전에서 통과되기도" 서술이 검증 환경과 반대

**담당: exam-writer**
· 위치: `ch05_quiz.md` 409행

> `metrics='accuracy'`처럼 리스트를 빼는 것 — **최신 버전에서는 통과되기도 하지만** 표준 표기는 리스트입니다.

문제 파일 자신이 검증 환경으로 명시한 Keras 3(TF 2.21.0)에서 실측하면 `compile()` 단계에서 곧바로 거부됩니다.

```
ValueError: Expected `metrics` argument to be a list, tuple, or dict. Received instead: metrics=accuracy of type <class 'str'>
```

"통과되기도 하지만"이라는 완충 표현 때문에 명백한 거짓은 아니지만, **검증 환경에서는 정반대 방향**입니다. 학습자가 "리스트를 빼도 어지간하면 돌아간다"고 받아들이면 시험장에서 그대로 실점합니다. 결론(리스트로 쓰라)은 옳으므로 근거만 강화하면 됩니다.

**권고:** "Keras 3(현행 시험 환경 계열)에서는 아예 `ValueError: Expected 'metrics' argument to be a list, tuple, or dict`가 납니다. 반드시 `['accuracy']`로 씁니다."

#### M-4. 본문 미소개 API 2종이 해답 코드에서 사용됨 (ch04 M-1 미반영 + 확대)

**담당: chapter-writer (1순위) / exam-writer (대안)**
· 위치: `ch05_quiz.md` — `model.output_shape` 7회(252·448·543·553·576행 등), `tf.keras.utils.set_random_seed` 3회(300·614·623행)

| API | 챕터 본문 등장 | 퀴즈 사용 |
|-----|----------------|-----------|
| `model.output_shape` | `ch04.md` 0건 / `ch05.md` 0건 | ch04_quiz 8회 + **ch05_quiz 7회** |
| `tf.keras.utils.set_random_seed` | 전 챕터 0건 (본문 표준은 `np.random.seed` + `tf.random.set_seed`) | ch05_quiz 3회 |

`output_shape`는 **ch04 리포트 M-1에서 이미 지적됐으나 반영되지 않았고**, Ch05에서 사용처가 오히려 늘었습니다(→ 회귀 R-1). 두 API 모두 **학습자가 답안으로 써야 하는 코드가 아니라 검증·시연 코드에만** 등장하므로 문항 풀이는 가능하며, 그래서 MEDIUM을 유지합니다.

`set_random_seed`는 Q2의 "metrics를 바꿔도 loss가 동일하다"는 반증을 성립시키기 위해 가중치 초기화까지 고정하는 목적이라 기술적으로 타당한 선택입니다. 다만 본문이 `np.random.seed` + `tf.random.set_seed` 조합만 가르치므로 학습자는 왜 여기만 다른지 알 수 없습니다.

**권고:**
- ch04 M-1 권고(`ch04.md` §4.5에 `model.output_shape` 1줄 소개)를 우선 이행. Ch05~Ch08 문항이 계속 같은 idiom을 쓰므로 한 곳에서 해소하는 편이 총비용이 낮습니다.
- `set_random_seed`는 Q2 해답 코드 300행 주석을 "`tf.keras.utils.set_random_seed(7)` — `np.random.seed`+`tf.random.set_seed`를 한 번에 거는 함수. 여기서는 가중치 초기화까지 완전히 같게 만들려고 씁니다" 정도로 확장하면 충분합니다.

### LOW — 5건

#### L-1. 정본 4행의 순서가 도해와 본문표에서 다름

**담당: chapter-writer 또는 diagram-designer (택 1로 통일)**
· 위치: `ch05_loss-decision.svg` 잎 1~4 ↔ `ch05.md` §2 표 57~62행

| 위치 | 순서 |
|------|------|
| 도해 | 회귀 → 이진분류 → 다중분류(정수) → 다중분류(원-핫) |
| 본문 정본표 | 이진분류 → 다중분류(정수) → 다중분류(원-핫) → 회귀 |
| 핵심 요약 표 | 이진분류 → 다중분류 → 회귀 (본문표와 동일) |
| Q1 보기 (가)~(라) | 이진 → 다중정수 → 다중원핫 → 회귀 (본문표와 동일) |

**내용은 4중 완전 일치**하므로 정합성 문제는 아닙니다. 다만 본문이 "**시험장에서 이 표 한 장만 떠올리면**"이라며 통암기를 요구하는 표인데, 바로 위 도해와 순서가 다르면 회상 단서가 두 벌이 됩니다. 도해는 "연속된 숫자인가?"를 첫 질문으로 두는 분기 논리상 회귀가 먼저 나올 수밖에 없으므로, **본문표를 도해 순서에 맞추는 쪽**이 자연스럽습니다.

#### L-2. 회귀 잎의 `loss='mae'` 대안과 `metrics=['mae']`가 겹칠 수 있음

**담당: chapter-writer / diagram-designer**
· 위치: `ch05_loss-decision.svg` 56~58행, `ch05.md` §2 표 62행

두 곳 모두 회귀를 `loss: 'mse' (또는 'mae')` + `metrics: ['mae']`로 표기합니다. `'mae'`를 골랐을 때 loss와 metrics가 같아져 `history` 키가 `loss`·`mae`로 사실상 중복됩니다. 본문 85행이 "지시가 없는 한 `loss='mse'`를 기본으로"라고 정리하고 있어 실질 혼선은 낮습니다.

**권고:** 도해 회귀 잎의 "(또는 'mae')"를 muted 각주로 낮추거나 "문제에 `mae`를 지시하면 교체" 정도로 조건을 붙임.

#### L-3. §6의 `model.fit(...)` 블록이 리터럴 `...`라 실행 불가 (ch04 L-5 동일 성격)

**담당: chapter-writer (조치 불필요 판단도 가능)**
· 위치: `ch05.md` 188~191행

```python
history = model.fit(...)
print(history.history.keys())
```

`ValueError: Unrecognized data type: x=Ellipsis`가 납니다. 앞뒤 문맥상 자리표시자임이 분명하고 §4·시험장 표준 코드에 완전한 형태가 있어 독해 문제는 없습니다. ebook에 블록 단위 복사 버튼을 붙일 경우에만 혼선 여지가 있습니다.

**권고:** 그대로 두되 ebook-builder 복사 버튼 정책(ch04 L-5)과 함께 리더가 일괄 결정.

#### L-4. `Dense(K, ...)` ↔ `Dense(n_classes, ...)` 표기 혼용

**담당: chapter-writer (경미) 또는 diagram-designer**
· 위치: `ch05_loss-decision.svg` 80·92행 / `ch05.md` §2 표 = `Dense(K, ...)` ↔ `ch08_three-templates.svg` = `Dense(n_classes, activation='softmax')`, `ch08.md` 표 = `Dense(K, ...)`

Ch05는 `K`, Ch08 도해는 `n_classes`, Ch08 본문표는 `K`, Ch05 퀴즈 해답은 `n_class`(단수)입니다. 의미 전달에는 지장 없고 각각 문맥상 자연스럽지만, 정본을 관통하는 기호이므로 한 벌로 통일하면 암기 부담이 줄어듭니다.

**권고:** 개념 표기는 `K`, 코드 변수는 `n_class`로 규칙을 정하고 Ch08 도해만 맞춤(가장 적은 수정).

#### L-5. 분량이 스펙 하한 미달 — 전 챕터 공통 (ch01 M-3 / ch03 X-2 / ch04 L-4 이월)

**담당: curriculum-architect (단위 정의) → 리더 판단**

| 측정 방식 | Ch05 실측 | 스펙 | 비율 |
|-----------|-----------|------|------|
| 산문 어절(코드 블록·HTML 주석 제외) | 1,625 | 2,200~2,600 | 74% |
| 코드 포함 전체 어절 | 2,029 | 2,200~2,600 | 92% |

Ch04(67% / 90%)보다 개선됐고 8개 챕터 중 상위입니다. 근본 원인은 커리큘럼 §3의 "단어" 단위가 미정의된 것으로, ch03 리포트 X-2 이후 변화 없습니다. 콘텐츠 밀도(도해 6·시험 포인트 4·표 6·코드 10블록)는 충분하므로 무리한 증량보다 기준 재정의가 적절합니다.

---

## 4. 회귀(regression) — 이전 리포트 지적의 반영 여부

**ch04 리포트(2026-07-28)에서 지적한 8개 조치 항목 중 반영 0건.** Ch05 자체 검수는 1회차이므로 자체 회귀는 없습니다.

| ID | 출처 | 지적 | 현재 상태 | Ch05 영향 |
|----|------|------|-----------|-----------|
| **R-1** | ch04 **M-1** | `model.output_shape`·`count_params()`를 `ch04.md` §4.5에 소개 | **미반영** (`ch04.md` `output_shape` 0건) | **영향 확대.** ch05_quiz에서 `output_shape` 7회 추가 사용 → 본 리포트 **M-4** |
| **R-2** | ch03 M-2 / ch04 **L-3** | SVG 내부 id에 챕터 표식 접두어 | **미반영** | ch05 7개 id도 챕터 표식 없음(`ld-`, `ct-`, `lr-`, `vs-`). **현재 실제 충돌 0건**이나 `lr-`은 learning-rate·`ch07_report-read` 등과 장래 충돌 여지 |
| **R-3** | ch03 X-1 / ch04 **X-1** | Ch02 도해 7개의 `id="ah-ink"` 중복 | **미반영** (재확인: 7개 그대로) | Ch05 범위 밖. 책 전체에서 **유일하게 남은 실제 id 충돌** — 인라인 임베드 시 7개 도해 화살표 머리 색이 첫 파일 기준으로 통일되는 렌더링 오류 |
| **R-4** | ch03 L-3 (ch04에서 상향 권고) | `ch03.md` 149행 "출력층과 손실 함수의 짝은 **Ch04와 Ch05에서** 확정합니다" | **미반영** (원문 그대로) | **Ch05에서 실질 해소되나 예고는 여전히 틀림.** Ch04는 loss를 전혀 다루지 않으므로 "Ch04와 Ch05에서"는 부정확. Ch05 정본이 완성된 지금 **"출력층은 Ch04에서, 손실 함수와의 짝은 Ch05에서"** 로 고치면 정본 체계가 Ch03부터 일관됩니다. **우선순위 상향 유지** |
| **R-5** | ch04 M-2 | `ch04_quiz.md` Q2 선지 2번(208)·5번(360)을 진단 가능한 값으로 교체 | **미반영** (55·58행 그대로) | Ch05 범위 밖. 참고로 **ch05_quiz Q1·Q2는 전 선지가 특정 오개념에 대응**하며 해설에서 각각 진단됩니다 — 같은 결함 재발 없음 ✓ |
| **R-6** | ch04 L-1 / L-2 | `1984`→`1,984` 표기 통일, `build_hidden(30)` → 변수 경유 | **미반영** (332·335행, 3회 그대로) | Ch05 범위 밖. Ch05 본문은 하드코딩 없이 `X_train.shape[1]`·`len(np.unique())` 원칙을 일관 준수 ✓ |

---

## 5. 담당 에이전트별 조치 요약

| 담당 | 항목 | 심각도 | 조치 |
|------|------|--------|------|
| **chapter-writer** | **H-1** | HIGH | `ch05.md` 120행에 "이 계산은 검증 데이터를 떼지 않았을 때 기준" 단서 추가 |
| **chapter-writer** | **H-2** | HIGH | 같은 자리에 "`validation_split=0.2`면 `ceil(800/32)=25` step" 예시 한 줄 추가 (H-1과 동시 해소) |
| **chapter-writer** | **H-3** | HIGH | 306행 "0.97 안팎" → "0.98~1.00 구간" + 환경 편차 고지 병기 |
| **chapter-writer** | M-1 | MEDIUM | 193행 `dict_keys` 순서를 실측(`['accuracy','loss','val_accuracy','val_loss']`)으로 교체 + "순서 미보장, `sorted()` 사용 가능" 1줄 |
| **chapter-writer** | M-2 | MEDIUM | 43행 "문법상 가능하지만" → "`compile()`은 통과하지만 `fit()`에서 shape 오류" |
| **chapter-writer** | M-4 / R-1 | MEDIUM | `ch04.md` §4.5에 `model.output_shape` 소개 1~2줄 (ch04 M-1 이행) |
| **chapter-writer** | R-4 | LOW→상향 | `ch03.md` 149행 "Ch04와 Ch05에서" → "출력층은 Ch04에서, 손실 함수와의 짝은 Ch05에서" |
| **chapter-writer** | L-1 · L-2 · L-4 | LOW | 정본표 순서·`mae` 중복·`K` 표기 통일 |
| **exam-writer** | M-3 | MEDIUM | `ch05_quiz.md` 409행을 Keras 3 실측 오류 메시지 기반으로 교체 |
| **exam-writer** | M-4 | MEDIUM | Q2 해답 300행 `set_random_seed` 주석 보강 (chapter-writer 조치 시 불필요) |
| **diagram-designer** | **H-1** | HIGH | `ch05_epoch-batch.svg` 66행 주석에 `validation_split` 단서 반절 추가 |
| **diagram-designer** | L-1 · L-2 · L-4 | LOW | 잎 순서 통일 판단, 회귀 잎 `(또는 'mae')` 격하, `n_classes`↔`K` 통일 |
| **diagram-designer** | R-2 · R-3 | LOW / MEDIUM | SVG id 챕터 접두어 규칙 확정(잔여 도해 제작 전), Ch02 `ah-ink` 7건 개별화 |
| **curriculum-architect / 리더** | L-5 | LOW | 커리큘럼 §3 "분량(단어)" 측정 단위 명문화 |

**Ch06 진행 차단 사유 없음.** 다만 H-1·H-2는 Ch06이 `EarlyStopping`·`epochs=100`을 다루며 step·epoch 개념을 그대로 상속하므로, **Ch06 집필 착수 전 처리**를 권합니다. H-3은 독립적이라 병행 가능합니다.

---

## 6. 검수 증적

- **실행 인터프리터:** `/Users/newid/.pyenv/versions/3.13.5/bin/python3` (Python 3.13.5, TensorFlow 2.21.0 / Keras 3.15.0, scikit-learn 1.9.0, numpy 2.5.0, matplotlib 3.11.1)
- **본문 코드:** python 블록 10개 전량 추출. 실행 가능 블록 5개(§6 `plot_history`, §6 history 추출, 시험장 표준 코드, + 문맥 결합 2건) 전부 exit 0. 설명용 단편 4개는 최소 문맥(`Sequential`+`Input`+`Dense`, 필요 시 `compile`) 주입 후 전부 exit 0. **실행 미검증 블록 0개** (§6 188행 `model.fit(...)`는 리터럴 `...`의 의도된 의사코드로 판정 → L-3).
- **문제 해답 코드:** python 블록 12개 전량 실행. 문제지 코드 2개(Q5·Q6)는 **의도된 오류 재현**으로 기대 예외 발생 확인, 해답 코드 6개는 exit 0. exam-writer 자체 검증 주석(669~677행) 기대값 전 항목 독립 재현.
- **정본 4중 교차:** `ch05_loss-decision.svg` 4잎 × 3필드(출력층/loss/metrics) = 12셀을 본문 §2 표·Q1 정답 3번·`ch08.md` 표·`ch08_three-templates.svg`와 문자 단위 대조 — 불일치 0건.
- **별도 실험 3건:** ① `validation_split` 유무에 따른 실제 step 수 측정(32 vs 25, 콜백 카운터) ② `val_accuracy` 전 50 epoch 시계열 추출 ③ `metrics=['binary_crossentropy']`의 `y` 1D/2D별 동작 분기.
- **주장 검증 6건:** `batch_size` 기본값 32 / 검증 미지정 시 키 2개 / 회귀 키 순서 / `metrics='accuracy'` 문자열 거부 / 회귀+accuracy = 0.0 / `loss='accuracy'` 예외 메시지.
- **SVG:** 6개 XML 파싱 통과, `role="img"`/`aria-label`/`<title>` 6/6 보유, 내부 id 7개 전역 유일성 확인(현존 43개 파일 교차 grep). **의뢰 지목 `ld-arrow` 충돌은 사실이 아님 — 책 전체 1회 출현.**
- **`ch05.md` 340행 `<!-- verified: pending -->` 마커를 본 검수의 실제 실행 결과로 갱신했습니다.** (chapter-writer가 tech-reviewer 기입용으로 남긴 자리이며, 검증 증적 기록 외의 본문 수정은 하지 않았습니다.)


---

# 개명 재검증 (H-3 / 2026-07-31, tech-reviewer)

> 대상: 리더 결정 H-3 — 스케일링 결과 변수명 `X_train_scaled`/`X_test_scaled` 개명.
> 성격: 개명 회귀 검사(전체 재검수 아님).

환경: python3 3.13.5 · tensorflow 2.21.0 (Keras 3) · scikit-learn 1.9.0 · numpy 2.5.0 · pandas 3.0.3 · matplotlib(Agg).
E-1 회피 적용 — 모든 실행 스크립트 첫 줄에서 `import tensorflow`를 pandas보다 먼저 수행(교착 0건).

## 판정: 통과 (회귀 0건)

### 1. 코드 실행 — NameError 0건

python 코드 블록 10개 전량 재추출. 실행 단위 2개로 분할, 양쪽 `EXIT=0` / `NameError` **0건**.

- **단위 A(연쇄):** b09(시험장 표준 코드 L271) → **b05(§5 방법 A·B L174)** → b07(plot_history L216) → b08(L257)
- **단위 B(단편 5개):** b01(L26)·b02(L66)·b03(L102)·b04(L139)·b10(L325) — 선행 문맥 주입 후 실행(epochs 2로 축소). b06(L203 `model.fit(...)`)은 리터럴 Ellipsis 자리표시자로 실행 대상 아님(v2 스탬프와 동일 판정).

### 2. 지정 위험 지점 — §5 방법 B

L182-183 `train_test_split(X_train_scaled, y_train, test_size=0.2, random_state=42, stratify=y_train)` 를 시험장 표준 코드(b09) 실행 직후 문맥에서 실행 → **정상**. 개명된 `X_train_scaled`(398×30)를 입력으로 받아 `X_tr`/`X_val` 분리 후 `validation_data=(X_val, y_val)`로 `fit` 완료. `stratify=y_train`도 `X_train_scaled`와 행 수가 일치하므로 문제 없음(개명이 배열 길이를 바꾸지 않음).

### 3. 게재 수치 무변경

| 항목 | 게재 | 실측 |
|---|---|---|
| L321 `X shape` / `y 앞 5개` | `(569, 30)` / `[0 0 0 0 0]` | 일치 |
| L208 history 키 | `['accuracy','loss','val_accuracy','val_loss']` | 일치 |
| L321 검증 정확도 대역 | 0.98~1.00 | `1.0` — 대역 내 |
| L260 총 학습 epoch 수 | 50 | 50 |

### 4. 산문·요약표 표기 정합

주석 밖 전수 스캔 → 잔존 3곳 전부 정당(L290 `train_test_split` 반환, L294·L295 `fit_transform`/`transform` 인자). §4 L140·L145, §5 L176·L183, §6, 시험장 표준 코드 L299·L311 모두 `_scaled` 계열. 옛 표기 **0건**.

### 5. 구조 무결성

코드 펜스 22개(짝수)·EOF depth 0 · 주석 9/9 · DIAGRAM 6 ↔ SVG 6 · `EXAM: ch05` 정상.
`ch05_validation-split.svg` 27행의 `X_train, y_train`은 **`train_test_split` 직후 단계**를 그린 것이므로 개명 대상 아님(정당). 수정 불필요.

## 신규 지적: 없음
