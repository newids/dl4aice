/* dl4aice v2 — cbt-engine.js
 * 14문항 · 90분 CBT 모의고사 엔진.
 * 화면 3단계: 시작(intro) -> 시험(exam) -> 결과(result). 모든 상태는
 * DL4AICE.store 의 "cbt.<mockId>" 에 저장되어 새로고침 후에도 복원된다.
 * 채점은 grader-core 의 정적 검사이며, 정답·해설은 제출 전에는 절대 노출하지 않는다.
 * 의존: dl4aice-core.js, grader-core.js, code-grader.js(DL4AICE.cell). 프레임워크·CDN 없음.
 */
(function () {
  "use strict";

  var D = (window.DL4AICE = window.DL4AICE || {});
  var h = function (tag, attrs, kids) { return D.el(tag, attrs, kids); };

  var PART_ADVICE = {
    preprocess: {
      text: "결측치 처리, 이상치 제거, 범주형 인코딩, X·y 분리와 스케일링의 순서를 다시 점검하세요. 스케일러는 학습 데이터에만 fit 하고 테스트 데이터에는 transform 만 적용합니다.",
      links: [{ href: "ch02.html", label: "2장 데이터 준비와 머신러닝" }]
    },
    ml: {
      text: "모델 객체 변수명(dt_model, rf_model 등), random_state, fit/predict 호출과 평가 지표 함수의 인자 순서를 복습하세요.",
      links: [{ href: "ch02.html", label: "2장 데이터 준비와 머신러닝" }]
    },
    dl_model: {
      text: "입력 Input(shape=...) 과 출력층(units, activation), compile 의 loss·metrics 조합, 콜백(EarlyStopping, ModelCheckpoint)과 history 시각화를 복습하세요.",
      links: [
        { href: "ch04.html", label: "4장 Keras로 모델 만들기" },
        { href: "ch05.html", label: "5장 컴파일과 학습" },
        { href: "ch06.html", label: "6장 과적합 진단과 대응" }
      ]
    },
    dl_infer: {
      text: "평가(evaluate)와 신규 샘플 예측의 전처리를 학습 때와 똑같이 맞추세요. 인코딩 컬럼 정렬(reindex) 후 scaler.transform 을 쓰고, 확률은 임계값으로 클래스로 바꿉니다.",
      links: [
        { href: "ch07.html", label: "7장 평가와 예측" },
        { href: "ch08.html", label: "8장 유형별 완성 코드와 전략" }
      ]
    }
  };

  var KIND_RULES = [
    { id: "name", label: "변수명 불일치", test: /변수명|대입하는 문장|변수 `/ },
    { id: "call", label: "함수·클래스 호출 누락 또는 철자 오류", test: /호출을 찾지 못/ },
    { id: "arg", label: "인자 누락 또는 인자 값 오류", test: /인자|값이 요구사항/ },
    { id: "code", label: "필수 코드 누락", test: /필수 코드|필수 패턴|내용이 요구사항/ },
    { id: "forbid", label: "쓰면 안 되는 코드 사용", test: /쓰면 안/ },
    { id: "order", label: "실행 순서 오류", test: /순서/ }
  ];

  /* ---------- 작은 유틸 ---------- */
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function fmtTime(sec) {
    sec = Math.max(0, Math.ceil(sec));
    return pad2(Math.floor(sec / 60)) + ":" + pad2(sec % 60);
  }
  function fmtElapsed(sec) {
    sec = Math.max(0, Math.round(sec));
    var m = Math.floor(sec / 60);
    return m + "분 " + pad2(sec % 60) + "초";
  }
  function normCode(code) {
    return String(code == null ? "" : code).replace(/\r\n?/g, "\n").split("\n").map(function (l) { return l.replace(/\s+$/, ""); }).join("\n").trim();
  }
  function icon(name) {
    var paths = {
      check: '<path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      pause: '<path d="M5 3.5v9M11 3.5v9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
      play: '<path d="M5 3.2l8 4.8-8 4.8z" fill="currentColor"/>',
      reset: '<path d="M3.2 8a4.8 4.8 0 1 0 1.5-3.5M3 2.8v2.9h2.9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
      bookmark: '<path d="M4 2.5h8v11l-4-3-4 3z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>',
      bookmarkOff: '<path d="M4 2.5h8v11l-4-3-4 3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
      chevron: '<path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
    };
    var s = h("span", { class: "v2-cbt__icon", "aria-hidden": "true" });
    s.innerHTML = '<svg viewBox="0 0 16 16" width="16" height="16" focusable="false">' + (paths[name] || "") + "</svg>";
    return s;
  }
  function note(text, kind) {
    return h("p", { class: "v2-cbt__note" + (kind ? " v2-cbt__note--" + kind : ""), role: kind === "err" ? "alert" : null, text: text });
  }
  function tableWrap(headers, rows, label) {
    var thead = h("thead", {}, h("tr", {}, headers.map(function (t) { return h("th", { scope: "col", text: t }); })));
    var tbody = h("tbody", {}, rows.map(function (r) {
      return h("tr", {}, r.map(function (c, i) {
        var td = h("td", {});
        if (c && c.nodeType) td.appendChild(c);
        else if (i === 0 && headers.length > 1 && r.codeFirst !== false && /^[A-Za-z_][\w.]*$/.test(String(c))) td.appendChild(h("code", { text: String(c) }));
        else td.textContent = String(c == null ? "" : c);
        return td;
      }));
    }));
    return h("div", { class: "v2-cbt__tablewrap", role: "region", tabindex: "0", "aria-label": label || "표" }, h("table", { class: "v2-cbt__table" }, [thead, tbody]));
  }
  function codeBlock(code, label) {
    var pre = h("pre", { class: "v2-code v2-cbt__codeblock", tabindex: "0", "aria-label": label || "코드" });
    pre.appendChild(h("code", { html: D.highlight(code) }));
    return pre;
  }
  function debounce(fn, ms) {
    var t = null;
    var wrapped = function () { var a = arguments, self = this; clearTimeout(t); t = setTimeout(function () { t = null; fn.apply(self, a); }, ms); };
    wrapped.flush = function () { clearTimeout(t); t = null; };
    return wrapped;
  }

  /* ---------- 접근성 모달 ---------- */
  var FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function openDialog(host, opts) {
    var prevFocus = document.activeElement;
    var idBase = "v2-cbt-dlg-" + Math.random().toString(36).slice(2, 8);
    var closed = false;
    var buttons = (opts.actions || []).map(function (a) {
      return h("button", {
        type: "button",
        class: "v2-btn " + (a.cls || ""),
        text: a.label,
        onclick: function () { close(); if (a.onClick) a.onClick(); }
      });
    });
    var dialog = h("div", { class: "v2-cbt__dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": idBase + "-t", "aria-describedby": idBase + "-d" }, [
      h("h2", { class: "v2-cbt__dialog-title", id: idBase + "-t", text: opts.title }),
      h("div", { class: "v2-cbt__dialog-body", id: idBase + "-d" }, opts.body),
      h("div", { class: "v2-cbt__dialog-actions" }, buttons)
    ]);
    var backdrop = h("div", { class: "v2-cbt__modal" }, dialog);
    backdrop.addEventListener("mousedown", function (e) { if (e.target === backdrop) close(); });
    backdrop.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); close(); return; }
      if (e.key !== "Tab") return;
      var items = Array.prototype.slice.call(dialog.querySelectorAll(FOCUSABLE));
      if (!items.length) { e.preventDefault(); return; }
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    });
    host.appendChild(backdrop);
    document.documentElement.classList.add("v2-cbt-modal-open");
    (buttons[opts.focusIndex == null ? 0 : opts.focusIndex] || dialog).focus();
    function close() {
      if (closed) return;
      closed = true;
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      document.documentElement.classList.remove("v2-cbt-modal-open");
      if (prevFocus && prevFocus.focus && document.contains(prevFocus)) prevFocus.focus();
      if (opts.onClose) opts.onClose();
    }
    return { close: close, el: backdrop };
  }

  /* ---------- 마운트 ---------- */
  function mount(root) {
    if (!root || root.__v2cbt) return;
    root.__v2cbt = true;
    root.classList.add("v2-cbt", "v2-wide");
    var mockId = root.getAttribute("data-mock") || "mock01";
    root.setAttribute("aria-busy", "true");
    root.appendChild(note("모의고사를 불러오는 중입니다.", "info"));

    D.data("mock_exams_14q").then(function (bundle) {
      root.removeAttribute("aria-busy");
      root.textContent = "";
      var exam = bundle && (bundle.exams || []).filter(function (e) { return e.id === mockId; })[0];
      if (!exam || !(exam.questions || []).length) {
        root.appendChild(note("모의고사 데이터를 찾지 못했습니다. 페이지를 새로고침하거나 목차에서 다시 들어와 주세요.", "err"));
        return;
      }
      if (!D.grader || !D.grader.grade) {
        root.appendChild(note("채점 모듈(grader-core.js)을 불러오지 못해 모의고사를 시작할 수 없습니다.", "err"));
        return;
      }
      try { new App(root, mockId, bundle, exam); }
      catch (err) {
        if (window.console) console.error(err);
        root.textContent = "";
        root.appendChild(note("모의고사 화면을 만드는 중 문제가 생겼습니다. 페이지를 새로고침해 주세요.", "err"));
      }
    }, function () {
      root.removeAttribute("aria-busy");
      root.textContent = "";
      root.appendChild(note("모의고사 데이터를 불러오지 못했습니다. 네트워크 상태를 확인하고 새로고침해 주세요.", "err"));
    });
  }

  function App(root, mockId, bundle, exam) {
    var self = this;
    var STORE_KEY = "cbt." + mockId;
    var passScore = Number(bundle.pass_score) || 80;
    var limitSec = (Number(bundle.time_limit_min) || 90) * 60;
    var questions = exam.questions.slice().sort(function (a, b) { return a.no - b.no; });
    var total = questions.length;
    var byNo = {};
    questions.forEach(function (q) { byNo[q.no] = q; });
    var maxScore = questions.reduce(function (s, q) { return s + (Number(q.points) || 0); }, 0);

    /* 파트 목록: 데이터의 parts 우선, 없으면 문항의 part 에서 유도 */
    var parts = (bundle.parts || []).map(function (p) { return { id: p.id, label: p.label, nos: p.questions || [] }; });
    if (!parts.length) {
      questions.forEach(function (q) {
        var id = q.part || "all";
        var p = parts.filter(function (x) { return x.id === id; })[0];
        if (!p) parts.push((p = { id: id, label: id, nos: [] }));
        p.nos.push(q.no);
      });
    }
    function partIdOf(q) {
      if (q.part) return q.part;
      for (var i = 0; i < parts.length; i++) if (parts[i].nos.indexOf(q.no) >= 0) return parts[i].id;
      return parts[0] ? parts[0].id : "all";
    }
    function partIndex(id) { for (var i = 0; i < parts.length; i++) if (parts[i].id === id) return i; return 0; }
    function partLabel(id) { return (parts[partIndex(id)] || {}).label || id; }

    /* ---------- 상태 ---------- */
    var S = loadState();
    var status = {}; /* no -> "blank" | "edit" | "pass" */
    var cellApi = null;
    var timerId = null;
    var tickCount = 0;
    var screen = "intro";
    var ui = {};
    var dialog = null;
    var confirming = { reset: false };

    function freshState() {
      return { v: 1, started: false, submitted: false, current: 1, answers: {}, bookmarks: [], remaining: limitSec, running: false, ts: 0, result: null };
    }
    function loadState() {
      var raw = D.store.get(STORE_KEY, null);
      var base = freshState();
      if (!raw || typeof raw !== "object") return base;
      Object.keys(base).forEach(function (k) { if (raw[k] !== undefined) base[k] = raw[k]; });
      if (!base.answers || typeof base.answers !== "object") base.answers = {};
      if (!Array.isArray(base.bookmarks)) base.bookmarks = [];
      if (!byNo[base.current]) base.current = questions[0].no;
      if (typeof base.remaining !== "number" || !isFinite(base.remaining)) base.remaining = limitSec;
      return base;
    }
    var saveSoon = debounce(save, 350);
    function save() { saveSoon.flush(); D.store.set(STORE_KEY, S); }

    function curRemaining() {
      if (!S.running) return S.remaining;
      return Math.max(0, S.remaining - (Date.now() - S.ts) / 1000);
    }
    function checkpointTime() {
      if (S.running) { S.remaining = curRemaining(); S.ts = Date.now(); }
    }

    /* ---------- 채점 보조 ---------- */
    function codeOf(q) { return S.answers[q.no] != null ? S.answers[q.no] : q.skeleton_code || ""; }
    function untouched(q, code) { return normCode(code) === normCode(q.skeleton_code); }
    function gradeQ(q, code) { return D.grader.grade(code, q.validation_rules || []); }
    function classify(q, code, res) {
      if (untouched(q, code)) return "blank";
      res = res || gradeQ(q, code);
      return res.pass ? "pass" : "edit";
    }
    function recalcAll() { questions.forEach(function (q) { status[q.no] = classify(q, codeOf(q)); }); }
    function score() {
      return questions.reduce(function (s, q) { return s + (status[q.no] === "pass" ? Number(q.points) || 0 : 0); }, 0);
    }
    function stateLabel(st) { return st === "pass" ? "통과" : st === "edit" ? "작성 중" : "미작성"; }
    function isBookmarked(no) { return S.bookmarks.indexOf(no) >= 0; }

    /* ---------- 화면 전환 ---------- */
    function clearScreen() {
      stopTimer();
      if (dialog) { dialog.close(); dialog = null; }
      cellApi = null;
      ui = {};
      root.textContent = "";
    }
    function show(next) {
      clearScreen();
      screen = next;
      root.setAttribute("data-screen", next);
      if (next === "intro") renderIntro();
      else if (next === "exam") renderExam();
      else renderResult();
    }

    /* ==========================================================
       1. 시작 화면
       ========================================================== */
    function renderIntro() {
      var qs = questions;
      var resumable = S.started && !S.submitted;
      var best = D.progress && D.progress.mock ? D.progress.mock(mockId) : null;
      var ds = exam.dataset || {};

      var wrap = h("div", { class: "v2-cbt__intro" });
      wrap.appendChild(h("p", { class: "v2-cbt__eyebrow", text: "CBT 실전 모의고사" }));
      wrap.appendChild(h("h2", { class: "v2-cbt__title", text: "시험 안내" }));
      if (exam.scenario) wrap.appendChild(h("div", { class: "v2-cbt__scenario", html: D.richText(exam.scenario) }));

      var facts = [
        [total + "문항", "연속 파이프라인"],
        [maxScore + "점", "배점 합계"],
        [Math.round(limitSec / 60) + "분", "제한 시간"],
        ["합격 " + passScore + "점", "정적 검사 기준"]
      ];
      wrap.appendChild(h("ul", { class: "v2-cbt__facts", "aria-label": "시험 개요" }, facts.map(function (f) {
        return h("li", {}, [h("strong", { text: f[0] }), h("span", { text: f[1] })]);
      })));

      wrap.appendChild(h("h3", { class: "v2-cbt__h3", text: "파트 구성과 배점" }));
      var partRows = parts.map(function (p) {
        var members = qs.filter(function (q) { return partIdOf(q) === p.id; });
        var pts = members.reduce(function (s, q) { return s + (Number(q.points) || 0); }, 0);
        var nos = members.map(function (q) { return q.no; });
        var range = nos.length > 1 ? nos[0] + "~" + nos[nos.length - 1] + "번" : nos.length ? nos[0] + "번" : "-";
        return [p.label, range, members.length + "문항", pts + "점"];
      });
      partRows.forEach(function (r) { r.codeFirst = false; });
      wrap.appendChild(tableWrap(["파트", "문항", "수", "배점"], partRows, "파트 구성과 배점"));

      wrap.appendChild(h("h3", { class: "v2-cbt__h3", text: "데이터셋" }));
      var dsBox = h("div", { class: "v2-cbt__card" });
      var meta = h("p", { class: "v2-cbt__dsmeta" });
      if (ds.file) meta.appendChild(h("span", {}, ["파일 ", h("code", { text: ds.file })]));
      if (ds.target) meta.appendChild(h("span", {}, ["타깃 ", h("code", { text: ds.target })]));
      if (meta.childNodes.length) dsBox.appendChild(meta);
      if (ds.description) dsBox.appendChild(h("div", { class: "v2-cbt__desc", html: D.richText(ds.description) }));
      dsBox.appendChild(columnsTable(ds));
      wrap.appendChild(dsBox);

      wrap.appendChild(h("h3", { class: "v2-cbt__h3", text: "문제에서 쓰는 변수" }));
      wrap.appendChild(variablesTable());
      wrap.appendChild(h("p", { class: "v2-cbt__hint", text: "문항은 앞 문항의 변수를 이어받는 하나의 파이프라인입니다. 지정된 변수명으로 코드를 작성하세요." }));

      if (ds.setup_code) {
        var det = h("details", { class: "v2-cbt__details" });
        det.appendChild(h("summary", { text: "데이터 직접 만들어 보기 (선택)" }));
        var body = h("div", { class: "v2-cbt__details-body" });
        body.appendChild(h("p", { text: "아래 코드를 로컬 Jupyter 에서 실행하면 동일한 CSV 를 만들 수 있어, 작성한 코드를 실제로 돌려 볼 수 있습니다. 이 페이지의 채점과는 무관하며 문제가 아닙니다." }));
        var pre = codeBlock(ds.setup_code, "데이터 생성 코드");
        var copyBtn = h("button", { type: "button", class: "v2-btn v2-btn--sm", text: "코드 복사" });
        copyBtn.addEventListener("click", function () {
          D.copy(ds.setup_code).then(function (ok) {
            copyBtn.textContent = ok ? "복사됨" : "복사 실패";
            setTimeout(function () { copyBtn.textContent = "코드 복사"; }, 1800);
          });
        });
        body.appendChild(h("div", { class: "v2-cbt__codebar" }, copyBtn));
        body.appendChild(pre);
        det.appendChild(body);
        wrap.appendChild(det);
      }

      wrap.appendChild(h("div", { class: "v2-cbt__callout" }, [
        h("strong", { text: "채점 방식 안내" }),
        h("p", { text: "이 페이지의 채점은 코드를 실행하지 않는 정적 검사입니다. 필수 변수명과 핵심 인자가 맞는지만 확인하며, 따옴표 종류·공백·키워드 인자 순서는 따지지 않습니다. 문항은 전부 맞아야 배점을 받는 방식(부분 점수 없음)입니다. 시험 중에는 정답·출력·해설을 볼 수 없고, 제출 후 결과 화면에서 공개됩니다." })
      ]));

      if (best) {
        wrap.appendChild(h("p", { class: "v2-cbt__best" }, [
          "지금까지의 최고 점수 ",
          h("strong", { text: best.best + "점" }),
          " (최근 " + best.last + "점 · 응시 " + best.attempts + "회)"
        ]));
      }

      var actions = h("div", { class: "v2-cbt__actions" });
      if (resumable) {
        wrap.appendChild(h("p", { class: "v2-cbt__note v2-cbt__note--info", text: "저장된 응시 기록이 있습니다. 남은 시간 " + fmtTime(S.remaining) + (S.running ? "" : " (일시정지됨)") + "." }));
        actions.appendChild(h("button", { type: "button", class: "v2-btn v2-btn--primary", text: "이어서 풀기", onclick: function () { resumeAttempt(); } }));
        var again = h("button", { type: "button", class: "v2-btn", text: "처음부터 다시" });
        again.addEventListener("click", function () {
          if (again.dataset.confirm !== "1") {
            again.dataset.confirm = "1";
            again.textContent = "정말 지울까요? 한 번 더 누르세요";
            again.classList.add("v2-btn--danger");
            setTimeout(function () { if (again.isConnected) { again.dataset.confirm = ""; again.textContent = "처음부터 다시"; again.classList.remove("v2-btn--danger"); } }, 4000);
            return;
          }
          S = freshState();
          save();
          show("intro");
        });
        actions.appendChild(again);
      } else {
        actions.appendChild(h("button", { type: "button", class: "v2-btn v2-btn--primary", text: "시험 시작", onclick: function () { startAttempt(); } }));
      }
      wrap.appendChild(actions);
      root.appendChild(wrap);
    }

    function columnsTable(ds) {
      var cols = ds.columns || [];
      if (!cols.length) return note("컬럼 정보가 없습니다.");
      return tableWrap(["컬럼", "자료형", "설명"], cols.map(function (c) { return [c.name, c.dtype || "", c.desc || ""]; }), "데이터 컬럼 표");
    }
    function variablesTable() {
      var vars = exam.variables || [];
      if (!vars.length) return note("변수 목록이 없습니다.");
      return tableWrap(["변수명", "역할"], vars.map(function (v) {
        var cell = h("span", {});
        String(v.name || "").split(/\s*,\s*/).forEach(function (n, i) { if (i) cell.appendChild(document.createTextNode(" ")); cell.appendChild(h("code", { text: n })); });
        return [cell, v.role || ""];
      }), "변수명 표");
    }

    function startAttempt() {
      S = freshState();
      S.started = true;
      S.running = true;
      S.ts = Date.now();
      S.remaining = limitSec;
      save();
      show("exam");
    }
    function resumeAttempt() {
      if (!S.running) { S.running = true; S.ts = Date.now(); }
      save();
      show("exam");
    }

    /* ==========================================================
       2. 시험 화면
       ========================================================== */
    function renderExam() {
      recalcAll();
      var wrap = h("div", { class: "v2-cbt__exam" });
      ui.wrap = wrap;

      /* ----- 상단 고정 바 ----- */
      var bar = h("div", { class: "v2-cbt__bar" });
      var timerBox = h("div", { class: "v2-cbt__timerbox" }, [
        h("span", { class: "v2-cbt__timer-label", text: "남은 시간" }),
        h("span", { class: "v2-cbt__timer", role: "timer", "aria-label": "남은 시간", text: fmtTime(curRemaining()) })
      ]);
      ui.timer = timerBox.querySelector(".v2-cbt__timer");
      ui.timerBox = timerBox;

      var ctrls = h("div", { class: "v2-cbt__ctrls" });
      ui.ctrls = ctrls;

      var scoreBox = h("div", { class: "v2-cbt__scorebox" }, [
        h("div", { class: "v2-cbt__scoreline" }, [
          "현재 예상 득점 ",
          h("strong", { class: "v2-cbt__score", text: "0" }),
          h("span", { class: "v2-cbt__score-max", text: " / " + maxScore }),
          h("span", { class: "v2-cbt__passline", text: "합격선 " + passScore + "점" })
        ]),
        h("div", { class: "v2-cbt__meter", role: "progressbar", "aria-label": "예상 득점 (합격선 " + passScore + "점)", "aria-valuemin": "0", "aria-valuemax": String(maxScore), "aria-valuenow": "0" }, [
          h("div", { class: "v2-cbt__meter-fill" }),
          h("div", { class: "v2-cbt__meter-line", "aria-hidden": "true", style: "left:" + Math.min(100, (passScore / maxScore) * 100) + "%" }),
        ]),
        h("span", { class: "v2-sr-only", "aria-live": "polite" })
      ]);
      ui.score = scoreBox.querySelector(".v2-cbt__score");
      ui.meter = scoreBox.querySelector(".v2-cbt__meter");
      ui.meterFill = scoreBox.querySelector(".v2-cbt__meter-fill");
      ui.scoreLive = scoreBox.querySelector(".v2-sr-only");
      ui.scoreBox = scoreBox;

      var submitBtn = h("button", { type: "button", class: "v2-btn v2-btn--danger v2-cbt__submit", onclick: function () { openSubmitDialog(); } }, [
        h("span", { class: "v2-cbt__submit-long", text: "시험 종료 및 채점" }),
        h("span", { class: "v2-cbt__submit-short", "aria-hidden": "true", text: "종료·채점" })
      ]);
      submitBtn.setAttribute("aria-label", "시험 종료 및 채점");

      var toggle = h("button", { type: "button", class: "v2-btn v2-btn--sm v2-cbt__ptoggle", "aria-expanded": "false", "aria-controls": "v2-cbt-palette-" + mockId }, [
        h("span", { class: "v2-cbt__ptoggle-text", text: "문항 이동" }), icon("chevron")
      ]);
      ui.toggle = toggle;

      bar.appendChild(timerBox);
      bar.appendChild(ctrls);
      bar.appendChild(scoreBox);
      bar.appendChild(submitBtn);
      bar.appendChild(toggle);

      var paletteWrap = h("div", { class: "v2-cbt__palette-wrap", id: "v2-cbt-palette-" + mockId });
      var palette = h("div", { class: "v2-cbt__palette", role: "group", "aria-label": "문항 팔레트" });
      ui.palette = palette;
      ui.pbtn = {};
      parts.forEach(function (p, pi) {
        var group = h("div", { class: "v2-cbt__pgroup v2-cbt__pgroup--p" + (pi % 4), role: "group", "aria-label": p.label, title: p.label });
        questions.filter(function (q) { return partIdOf(q) === p.id; }).forEach(function (q) {
          var b = h("button", { type: "button", class: "v2-cbt__q", "data-no": String(q.no) });
          b.appendChild(h("span", { class: "v2-cbt__q-no", text: String(q.no) }));
          var chk = icon("check");
          chk.classList.add("v2-cbt__q-check");
          b.appendChild(chk);
          b.addEventListener("click", function () { goTo(q.no, true); });
          ui.pbtn[q.no] = b;
          group.appendChild(b);
        });
        palette.appendChild(group);
      });
      paletteWrap.appendChild(palette);
      bar.appendChild(paletteWrap);
      toggle.addEventListener("click", function () {
        var open = bar.getAttribute("data-palette") !== "open";
        bar.setAttribute("data-palette", open ? "open" : "closed");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      bar.setAttribute("data-palette", "closed");
      wrap.appendChild(bar);
      ui.bar = bar;

      /* ----- 본문 ----- */
      var legend = h("ul", { class: "v2-cbt__legend", "aria-label": "범례" });
      parts.forEach(function (p, pi) {
        var members = questions.filter(function (q) { return partIdOf(q) === p.id; });
        legend.appendChild(h("li", { class: "v2-cbt__legend-item v2-cbt__legend-item--p" + (pi % 4) }, [
          h("span", { class: "v2-cbt__swatch", "aria-hidden": "true" }),
          p.label + (members.length ? " (" + members[0].no + (members.length > 1 ? "~" + members[members.length - 1].no : "") + ")" : "")
        ]));
      });
      wrap.appendChild(legend);

      var stage = h("div", { class: "v2-cbt__stage" });
      ui.stage = stage;
      ui.qwrap = h("div", { class: "v2-cbt__question" });
      stage.appendChild(ui.qwrap);
      ui.overlay = h("div", { class: "v2-cbt__pause", hidden: true, role: "status" }, [
        h("div", { class: "v2-cbt__pause-card" }, [
          h("strong", { text: "일시정지됨" }),
          h("p", { text: "시간이 멈춰 있고 문제는 가려져 있습니다. 재개하면 이어서 풀 수 있습니다." }),
          h("button", { type: "button", class: "v2-btn v2-btn--primary", text: "재개", onclick: function () { setPaused(false); } })
        ])
      ]);
      stage.appendChild(ui.overlay);
      wrap.appendChild(stage);
      root.appendChild(wrap);

      renderCtrls();
      updatePalette();
      updateScore(true);
      buildQuestion(S.current);
      applyPaused();
      measureTop();
      if (S.running) startTimer();
      tickTimer();
    }

    /* ----- 타이머 · 컨트롤 ----- */
    function renderCtrls() {
      var c = ui.ctrls;
      if (!c) return;
      c.textContent = "";
      if (confirming.reset) {
        c.appendChild(h("span", { class: "v2-cbt__confirm-text", role: "alert", text: "타이머를 " + fmtTime(limitSec) + "로 되돌릴까요?" }));
        var yes = h("button", { type: "button", class: "v2-btn v2-btn--sm v2-btn--danger", text: "초기화", onclick: function () {
          confirming.reset = false;
          S.remaining = limitSec; S.ts = Date.now();
          save(); renderCtrls(); tickTimer();
        } });
        c.appendChild(yes);
        c.appendChild(h("button", { type: "button", class: "v2-btn v2-btn--sm", text: "취소", onclick: function () { confirming.reset = false; renderCtrls(); } }));
        yes.focus();
        return;
      }
      var paused = !S.running;
      var pb = h("button", { type: "button", class: "v2-btn v2-btn--sm v2-cbt__pause-btn", "aria-pressed": paused ? "true" : "false", onclick: function () { setPaused(S.running); } }, [
        icon(paused ? "play" : "pause"), h("span", { text: paused ? "재개" : "일시정지" })
      ]);
      ui.pauseBtn = pb;
      var rb = h("button", { type: "button", class: "v2-btn v2-btn--sm v2-cbt__reset-btn", onclick: function () { confirming.reset = true; renderCtrls(); } }, [icon("reset"), h("span", { text: "초기화" })]);
      rb.setAttribute("aria-label", "타이머 초기화");
      c.appendChild(pb);
      c.appendChild(rb);
    }

    function setPaused(pause) {
      if (S.submitted) return;
      if (pause && S.running) {
        S.remaining = curRemaining();
        S.running = false;
        stopTimer();
      } else if (!pause && !S.running) {
        S.running = true;
        S.ts = Date.now();
        startTimer();
      }
      save();
      renderCtrls();
      applyPaused();
      tickTimer();
      if (ui.pauseBtn && document.activeElement === document.body) ui.pauseBtn.focus();
    }
    function applyPaused() {
      var paused = !S.running;
      if (ui.overlay) ui.overlay.hidden = !paused;
      if (ui.qwrap) {
        if (paused) ui.qwrap.setAttribute("inert", ""); else ui.qwrap.removeAttribute("inert");
        ui.qwrap.setAttribute("aria-hidden", paused ? "true" : "false");
      }
      if (cellApi && cellApi.setDisabled) cellApi.setDisabled(paused);
      if (ui.wrap) ui.wrap.classList.toggle("is-paused", paused);
      if (paused && ui.overlay) { var rb = ui.overlay.querySelector("button"); if (rb && root.contains(document.activeElement) === false) rb.focus({ preventScroll: true }); }
    }

    function startTimer() {
      stopTimer();
      timerId = setInterval(tickTimer, 1000);
    }
    function stopTimer() {
      if (timerId) { clearInterval(timerId); timerId = null; }
    }
    var announced = {};
    function tickTimer() {
      if (screen !== "exam" || !ui.timer) return;
      var rem = curRemaining();
      var txt = fmtTime(rem);
      if (ui.timer.textContent !== txt) ui.timer.textContent = txt;
      var level = rem <= 0 ? "danger" : rem < 180 ? "danger" : rem < 600 ? "warn" : "ok";
      if (ui.timerBox.getAttribute("data-level") !== level) ui.timerBox.setAttribute("data-level", level);
      [[600, "남은 시간 10분입니다."], [180, "남은 시간 3분입니다."], [60, "남은 시간 1분입니다."]].forEach(function (m) {
        if (rem <= m[0] && rem > 0 && !announced[m[0]] && S.running) {
          announced[m[0]] = true;
          if (rem > m[0] - 5 && ui.scoreLive) ui.scoreLive.textContent = m[1];
        }
      });
      if (S.running) {
        tickCount++;
        if (tickCount % 5 === 0) { checkpointTime(); save(); }
        if (rem <= 0) submit(true);
      }
    }

    /* ----- 팔레트 · 점수 ----- */
    function updatePalette() {
      questions.forEach(function (q) {
        var b = ui.pbtn && ui.pbtn[q.no];
        if (!b) return;
        var st = status[q.no] || "blank";
        var bm = isBookmarked(q.no);
        var cur = q.no === S.current;
        b.setAttribute("data-state", st);
        if (bm) b.setAttribute("data-bm", "1"); else b.removeAttribute("data-bm");
        if (cur) { b.setAttribute("aria-current", "true"); b.setAttribute("data-current", "1"); } else { b.removeAttribute("aria-current"); b.removeAttribute("data-current"); }
        b.setAttribute("aria-label", q.no + "번, " + stateLabel(st) + (bm ? ", 북마크" : "") + (cur ? ", 현재 문항" : ""));
      });
      if (ui.toggle) ui.toggle.querySelector(".v2-cbt__ptoggle-text").textContent = "문항 이동 · " + S.current + "/" + total;
    }
    var lastScore = -1;
    function updateScore(force) {
      var sc = score();
      if (!ui.score) return;
      ui.score.textContent = String(sc);
      ui.meterFill.style.width = Math.min(100, (sc / maxScore) * 100) + "%";
      ui.meter.setAttribute("aria-valuenow", String(sc));
      ui.scoreBox.classList.toggle("is-pass", sc >= passScore);
      if (sc !== lastScore && !force && ui.scoreLive) ui.scoreLive.textContent = "현재 예상 득점 " + sc + "점";
      lastScore = sc;
    }
    function measureTop() {
      var m = document.querySelector(".masthead");
      var hgt = m ? Math.round(m.getBoundingClientRect().height) : 0;
      root.style.setProperty("--v2-cbt-top", hgt + "px");
    }
    window.addEventListener("resize", debounce(measureTop, 120));

    /* ----- 문항 화면 ----- */
    function goTo(no, user) {
      if (!byNo[no] || S.submitted) return;
      var changed = no !== S.current;
      S.current = no;
      save();
      if (ui.bar) { ui.bar.setAttribute("data-palette", "closed"); ui.toggle.setAttribute("aria-expanded", "false"); }
      if (changed || !ui.qwrap.firstChild) buildQuestion(no);
      updatePalette();
      if (user) scrollToQuestion();
    }
    function scrollToQuestion() {
      var top = parseFloat(getComputedStyle(root).getPropertyValue("--v2-cbt-top")) || 0;
      var barH = ui.bar ? ui.bar.getBoundingClientRect().height : 0;
      var y = ui.stage.getBoundingClientRect().top + window.pageYOffset - top - barH - 8;
      if (y < window.pageYOffset) {
        var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: Math.max(0, y), behavior: reduce ? "auto" : "smooth" });
      }
    }

    function buildQuestion(no) {
      var q = byNo[no];
      var qw = ui.qwrap;
      qw.textContent = "";
      cellApi = null;
      if (!q) { qw.appendChild(note("문항을 찾지 못했습니다.", "err")); return; }
      var idx = questions.indexOf(q);

      var bmBtn = h("button", { type: "button", class: "v2-btn v2-btn--sm v2-cbt__bm", "aria-pressed": isBookmarked(no) ? "true" : "false", onclick: function () { toggleBookmark(no); } });
      ui.bmBtn = bmBtn;
      paintBookmark();

      var head = h("div", { class: "v2-cbt__qhead" }, [
        h("div", { class: "v2-cbt__qmeta" }, [
          h("span", { class: "v2-cbt__qcount", text: "문항 " + no + " / " + total }),
          h("span", { class: "v2-cbt__partchip v2-cbt__partchip--p" + (partIndex(partIdOf(q)) % 4), text: partLabel(partIdOf(q)) })
        ]),
        h("div", { class: "v2-cbt__qtitlebar" }, [
          h("h3", { class: "v2-cbt__qtitle", tabindex: "-1", text: q.title || ("문항 " + no) }),
          bmBtn
        ]),
        h("p", { class: "v2-cbt__qfacts" }, [
          h("span", { class: "v2-badge v2-badge--info", text: (q.points || 0) + "점" }),
          " ",
          h("span", { class: "v2-badge", text: "권장 " + (q.minutes || 0) + "분" })
        ])
      ]);
      qw.appendChild(head);
      ui.qtitle = head.querySelector(".v2-cbt__qtitle");

      qw.appendChild(h("div", { class: "v2-cbt__prompt", html: D.richText(q.prompt || "") }));

      var ref = h("details", { class: "v2-cbt__details v2-cbt__ref" });
      ref.appendChild(h("summary", { text: "데이터·변수 참고표 (시험 중 열람 가능)" }));
      var refBody = h("div", { class: "v2-cbt__details-body" });
      var ds = exam.dataset || {};
      if (ds.file || ds.target) {
        var meta = h("p", { class: "v2-cbt__dsmeta" });
        if (ds.file) meta.appendChild(h("span", {}, ["파일 ", h("code", { text: ds.file })]));
        if (ds.target) meta.appendChild(h("span", {}, ["타깃 ", h("code", { text: ds.target })]));
        refBody.appendChild(meta);
      }
      refBody.appendChild(columnsTable(ds));
      refBody.appendChild(h("h4", { class: "v2-cbt__h4", text: "변수명" }));
      refBody.appendChild(variablesTable());
      ref.appendChild(refBody);
      qw.appendChild(ref);

      var cellHost = h("div", { class: "v2-cbt__cellhost" });
      qw.appendChild(cellHost);
      cellApi = buildCell(q);
      cellHost.appendChild(cellApi.root);

      var prev = questions[idx - 1], next = questions[idx + 1];
      var nav = h("div", { class: "v2-cbt__nav" }, [
        h("button", { type: "button", class: "v2-btn", disabled: !prev, "aria-label": "이전 문항", onclick: function () { if (prev) goTo(prev.no, true); } }, "이전 문항"),
        h("span", { class: "v2-cbt__navhint" }, [h("span", { class: "v2-kbd", text: "Alt" }), "+", h("span", { class: "v2-kbd", text: "←" }), " ", h("span", { class: "v2-kbd", text: "→" }), "  ", h("span", { class: "v2-kbd", text: "Alt" }), "+", h("span", { class: "v2-kbd", text: "B" }), " 북마크"]),
        h("button", { type: "button", class: "v2-btn" + (next ? "" : " v2-btn--primary"), onclick: function () { if (next) goTo(next.no, true); else openSubmitDialog(); } }, next ? "다음 문항" : "시험 종료 및 채점")
      ]);
      if (!prev) nav.querySelector("button").disabled = true;
      qw.appendChild(nav);
      if (!S.running && cellApi.setDisabled) cellApi.setDisabled(true);
    }

    function buildCell(q) {
      var toolbar = [];
      if (D.openbook && typeof D.openbook.open === "function") {
        toolbar.push(h("button", { type: "button", class: "v2-btn v2-btn--sm", text: "오픈북 검색", onclick: function () { D.openbook.open(); } }));
      }
      var opts = {
        n: q.no,
        code: codeOf(q),
        skeleton: q.skeleton_code || "",
        rules: q.validation_rules || [],
        runLabel: "실행 (정적 검사)",
        quiet: true,
        toolbar: toolbar,
        onChange: function (code) { onEdit(q, code); },
        onRun: function (res, code) { onEdit(q, code, res); }
      };
      if (D.cell && typeof D.cell.create === "function") return D.cell.create(opts);
      /* 셀 모듈이 없을 때의 최소 대체 편집기 */
      var ta = h("textarea", { class: "v2-cbt__fallback", rows: "10", spellcheck: "false", "aria-label": "코드 입력" });
      ta.value = opts.code;
      ta.addEventListener("input", function () { onEdit(q, ta.value); });
      var box = h("div", { class: "v2-cbt__fallback-wrap" }, [note("코드 편집기 모듈을 불러오지 못해 기본 입력창을 표시합니다.", "info"), ta]);
      return { root: box, textarea: ta, getCode: function () { return ta.value; }, setDisabled: function (b) { ta.disabled = !!b; }, run: function () {}, focusFirstBlank: function () { ta.focus(); } };
    }

    /* 셀이 이미 300ms 디바운스하므로 여기서는 바로 판정한다(문항 이동 직후 도착한 변경도 올바른 문항에 반영) */
    function onEdit(q, code, res) {
      if (S.submitted) return;
      S.answers[q.no] = code;
      saveSoon();
      status[q.no] = classify(q, code, res);
      if (screen === "exam") { updatePalette(); updateScore(); }
    }

    function paintBookmark() {
      var b = ui.bmBtn;
      if (!b) return;
      var on = isBookmarked(S.current);
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.textContent = "";
      b.appendChild(icon(on ? "bookmark" : "bookmarkOff"));
      b.appendChild(h("span", { text: on ? "북마크됨" : "북마크" }));
    }
    function toggleBookmark(no) {
      var i = S.bookmarks.indexOf(no);
      if (i >= 0) S.bookmarks.splice(i, 1); else S.bookmarks.push(no);
      S.bookmarks.sort(function (a, b) { return a - b; });
      save();
      paintBookmark();
      updatePalette();
      if (ui.scoreLive) ui.scoreLive.textContent = no + "번 문항 북마크 " + (i >= 0 ? "해제" : "설정");
    }

    /* 키보드 단축키 (시험 화면에서만) */
    document.addEventListener("keydown", function (e) {
      if (screen !== "exam" || !root.isConnected || dialog || !S.running || !e.altKey || e.ctrlKey || e.metaKey) return;
      var idx = questions.indexOf(byNo[S.current]);
      if (e.key === "ArrowLeft" && questions[idx - 1]) { e.preventDefault(); goTo(questions[idx - 1].no, true); }
      else if (e.key === "ArrowRight" && questions[idx + 1]) { e.preventDefault(); goTo(questions[idx + 1].no, true); }
      else if (e.key === "b" || e.key === "B") { e.preventDefault(); toggleBookmark(S.current); }
    });

    /* 탭 전환·종료 시 시간 기준점 저장 */
    function persistClock() { if (screen === "exam" && S.running) { checkpointTime(); save(); } }
    window.addEventListener("pagehide", persistClock);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") persistClock(); else tickTimer();
    });

    /* ----- 제출 확인 ----- */
    function openSubmitDialog() {
      if (dialog || S.submitted) return;
      var counts = { blank: [], edit: [], pass: [] };
      questions.forEach(function (q) { counts[status[q.no] || "blank"].push(q.no); });
      var list = function (arr) { return arr.length ? " (" + arr.join(", ") + "번)" : ""; };
      var body = h("div", {}, [
        h("p", { text: "제출하면 바로 채점되고 이후에는 답안을 고칠 수 없습니다." }),
        h("ul", { class: "v2-cbt__sumlist" }, [
          h("li", {}, [h("strong", { text: "미작성 " + counts.blank.length + "문항" }), list(counts.blank)]),
          h("li", {}, [h("strong", { text: "작성 중 " + counts.edit.length + "문항" }), list(counts.edit)]),
          h("li", {}, [h("strong", { text: "통과 " + counts.pass.length + "문항" }), " · 예상 득점 " + score() + "점"]),
          h("li", {}, [h("strong", { text: "북마크 " + S.bookmarks.length + "문항" }), list(S.bookmarks)]),
          h("li", {}, ["남은 시간 ", h("strong", { text: fmtTime(curRemaining()) })])
        ])
      ]);
      dialog = openDialog(root, {
        title: "시험을 종료하고 채점할까요?",
        body: body,
        actions: [
          { label: "계속 풀기", cls: "" },
          { label: "제출하고 채점", cls: "v2-btn--danger", onClick: function () { dialog = null; submit(false); } }
        ],
        onClose: function () { dialog = null; }
      });
    }

    /* ==========================================================
       3. 채점 · 결과
       ========================================================== */
    function submit(timeout) {
      if (S.submitted) return;
      if (dialog) { dialog.close(); dialog = null; }
      var rem = curRemaining();
      stopTimer();
      S.remaining = rem;
      S.running = false;
      S.submitted = true;

      var prevRec = D.progress && D.progress.mock ? D.progress.mock(mockId) : null;
      var partsRes = {};
      parts.forEach(function (p) { partsRes[p.id] = { earned: 0, max: 0, label: p.label }; });
      var perQ = questions.map(function (q) {
        var code = codeOf(q);
        var blank = untouched(q, code);
        var res = gradeQ(q, code);
        var pass = !blank && res.pass;
        var pid = partIdOf(q);
        if (!partsRes[pid]) partsRes[pid] = { earned: 0, max: 0, label: pid };
        var pts = Number(q.points) || 0;
        partsRes[pid].max += pts;
        if (pass) partsRes[pid].earned += pts;
        return {
          no: q.no, part: pid, points: pts, earned: pass ? pts : 0, pass: pass,
          state: pass ? "pass" : blank ? "blank" : "edit",
          code: code, blanks: res.blanks, empty: res.empty,
          failed: res.results.filter(function (r) { return !r.ok; }).map(function (r) { return { label: r.label, hint: r.hint, detail: r.detail }; })
        };
      });
      var sc = perQ.reduce(function (s, r) { return s + r.earned; }, 0);
      var elapsed = Math.max(0, limitSec - rem);
      var partsForProgress = {};
      Object.keys(partsRes).forEach(function (id) { partsForProgress[id] = { earned: partsRes[id].earned, max: partsRes[id].max }; });

      S.result = {
        score: sc, max: maxScore, pass: sc >= passScore, parts: partsRes, perQ: perQ,
        elapsedSec: elapsed, timeout: !!timeout, ts: Date.now(),
        prevBest: prevRec ? prevRec.best : null
      };
      save();
      try { D.progress.recordMock(mockId, sc, { parts: partsForProgress, elapsedSec: Math.round(elapsed) }); } catch (e) { /* 진도 기록 실패는 결과 표시에 영향 없음 */ }
      show("result");
      if (timeout && D.toast) D.toast("제한 시간이 끝나 자동으로 제출했습니다.", { type: "info", title: "시간 종료" });
      try { root.scrollIntoView({ block: "start" }); window.scrollTo(0, Math.max(0, root.getBoundingClientRect().top + window.pageYOffset - 70)); } catch (e) { /* 무시 */ }
    }

    function renderResult() {
      var R = S.result;
      if (!R || !R.perQ) {
        root.appendChild(note("저장된 결과를 읽지 못했습니다. 다시 풀기를 눌러 새로 시작해 주세요.", "err"));
        root.appendChild(h("button", { type: "button", class: "v2-btn v2-btn--primary", text: "다시 풀기", onclick: function () { S = freshState(); save(); show("intro"); } }));
        return;
      }
      var wrap = h("div", { class: "v2-cbt__result" });
      var pass = R.score >= passScore;

      /* 요약 */
      var hero = h("section", { class: "v2-cbt__hero " + (pass ? "is-pass" : "is-fail"), "aria-labelledby": "v2-cbt-res-h" }, [
        h("h2", { class: "v2-cbt__title", id: "v2-cbt-res-h", text: (exam.title || "모의고사") + " 결과" }),
        h("div", { class: "v2-cbt__herorow" }, [
          h("div", { class: "v2-cbt__bigscore" }, [h("strong", { text: String(R.score) }), h("span", { text: " / " + (R.max || maxScore) + "점" })]),
          h("div", { class: "v2-cbt__verdict", role: "status" }, pass ? "합격" : "불합격")
        ]),
        h("p", { class: "v2-cbt__heronote", text: pass ? "합격 기준 " + passScore + "점을 넘었습니다." : "합격 기준 " + passScore + "점까지 " + (passScore - R.score) + "점 부족합니다." })
      ]);
      wrap.appendChild(hero);

      var stats = h("dl", { class: "v2-cbt__stats" });
      function stat(k, v) { stats.appendChild(h("div", {}, [h("dt", { text: k }), h("dd", { text: v })])); }
      stat("소요 시간", fmtElapsed(R.elapsedSec) + (R.timeout ? " (시간 종료)" : ""));
      stat("통과 문항", R.perQ.filter(function (r) { return r.pass; }).length + " / " + R.perQ.length);
      if (R.prevBest == null) stat("이전 최고 점수", "첫 응시");
      else {
        var diff = R.score - R.prevBest;
        stat("이전 최고 점수", R.prevBest + "점 (" + (diff > 0 ? "+" + diff + "점 갱신" : diff < 0 ? diff + "점" : "동점") + ")");
      }
      wrap.appendChild(stats);

      wrap.appendChild(analysisSection(R));
      wrap.appendChild(reviewSection(R));

      var actions = h("div", { class: "v2-cbt__actions v2-cbt__noprint" });
      var retryBox = h("span", { class: "v2-cbt__retry" });
      function drawRetry(confirm) {
        retryBox.textContent = "";
        if (!confirm) {
          retryBox.appendChild(h("button", { type: "button", class: "v2-btn v2-btn--primary", text: "다시 풀기", onclick: function () { drawRetry(true); } }));
        } else {
          retryBox.appendChild(h("span", { class: "v2-cbt__confirm-text", role: "alert", text: "답안과 이번 응시 기록을 지우고 처음부터 시작할까요? (최고 점수는 유지됩니다)" }));
          var yes = h("button", { type: "button", class: "v2-btn v2-btn--danger", text: "지우고 다시 풀기", onclick: function () { S = freshState(); D.store.remove(STORE_KEY); show("intro"); window.scrollTo(0, 0); } });
          retryBox.appendChild(yes);
          retryBox.appendChild(h("button", { type: "button", class: "v2-btn", text: "취소", onclick: function () { drawRetry(false); } }));
          yes.focus();
        }
      }
      drawRetry(false);
      actions.appendChild(retryBox);
      actions.appendChild(h("a", { class: "v2-btn", href: "index.html", text: "목차로" }));
      actions.appendChild(h("button", { type: "button", class: "v2-btn v2-btn--ghost", text: "결과 인쇄", onclick: function () { window.print(); } }));
      wrap.appendChild(actions);
      root.appendChild(wrap);
    }

    function analysisSection(R) {
      var sec = h("section", { class: "v2-cbt__analysis", "aria-labelledby": "v2-cbt-ana-h" });
      sec.appendChild(h("h3", { class: "v2-cbt__h3", id: "v2-cbt-ana-h", text: "파트별 취약점 분석 리포트" }));
      var rows = parts.map(function (p, pi) {
        var r = R.parts[p.id] || { earned: 0, max: 0 };
        return { id: p.id, label: p.label, earned: r.earned, max: r.max, pct: r.max ? Math.round((r.earned / r.max) * 100) : 0, pi: pi };
      });
      var list = h("ul", { class: "v2-cbt__bars" });
      rows.forEach(function (r) {
        list.appendChild(h("li", { class: "v2-cbt__bar-row" }, [
          h("div", { class: "v2-cbt__bar-label" }, [h("span", { text: r.label }), h("span", { class: "v2-cbt__bar-val", text: r.earned + " / " + r.max + "점 (" + r.pct + "%)" + (r.pct < 60 ? " · 취약" : "") })]),
          h("div", { class: "v2-cbt__track", role: "progressbar", "aria-label": r.label, "aria-valuemin": "0", "aria-valuemax": String(r.max), "aria-valuenow": String(r.earned), "aria-valuetext": r.earned + "점 / " + r.max + "점, " + r.pct + "퍼센트" },
            h("div", { class: "v2-cbt__fill v2-cbt__fill--p" + (r.pi % 4) + (r.pct < 60 ? " is-low" : ""), style: "width:" + r.pct + "%" }))
        ]));
      });
      sec.appendChild(list);

      var weak = rows.filter(function (r) { return r.max && r.pct < 100; }).sort(function (a, b) { return a.pct - b.pct || a.pi - b.pi; });
      var adv = h("div", { class: "v2-cbt__advice" });
      if (!weak.length) {
        adv.appendChild(h("p", { html: "<strong>모든 파트에서 만점입니다.</strong> 시험장에서 바로 꺼내 볼 요약본으로 마무리 점검만 하세요." }));
      } else {
        var lowest = weak[0].pct;
        var primary = weak.filter(function (r) { return r.pct === lowest; });
        var secondary = weak.filter(function (r) { return r.pct !== lowest && r.pct < 70; });
        adv.appendChild(h("p", { class: "v2-cbt__weakline" }, [
          "가장 취약한 파트: ",
          h("strong", { text: primary.map(function (r) { return r.label + " (" + r.pct + "%)"; }).join(", ") })
        ]));
        primary.concat(secondary).forEach(function (r, i) {
          var a = PART_ADVICE[r.id];
          if (!a) return;
          adv.appendChild(h("div", { class: "v2-cbt__advice-item" }, [
            h("h4", { class: "v2-cbt__h4", text: (i < primary.length ? "우선 보강 · " : "추가 점검 · ") + r.label }),
            h("p", { text: a.text }),
            h("p", { class: "v2-cbt__links" }, ["복습: "].concat(a.links.map(function (l, li) { return [li ? " · " : "", h("a", { href: l.href, text: l.label })]; }).reduce(function (x, y) { return x.concat(y); }, [])))
          ]));
        });
      }
      adv.appendChild(h("p", { class: "v2-cbt__links" }, [h("a", { href: "cheatsheet.html", text: "시험장 치트시트 열기" }), " — 유형별 완성 코드를 빠르게 확인할 수 있습니다."]));
      sec.appendChild(adv);

      /* 오답 규칙 유형 집계 */
      var tally = {};
      var failedTotal = 0;
      R.perQ.forEach(function (r) {
        if (r.pass) return;
        if (r.blanks > 0) { tally.blank = (tally.blank || 0) + 1; failedTotal++; }
        r.failed.forEach(function (f) {
          var kind = "etc";
          for (var i = 0; i < KIND_RULES.length; i++) { if (KIND_RULES[i].test.test(f.detail || "")) { kind = KIND_RULES[i].id; break; } }
          tally[kind] = (tally[kind] || 0) + 1;
          failedTotal++;
        });
      });
      var labels = { blank: "빈칸(___) 미작성 문항", etc: "기타 요구사항 미충족" };
      KIND_RULES.forEach(function (k) { labels[k.id] = k.label; });
      var kinds = Object.keys(tally).sort(function (a, b) { return tally[b] - tally[a]; });
      if (kinds.length) {
        sec.appendChild(h("h4", { class: "v2-cbt__h4", text: "자주 틀린 요구사항 유형" }));
        var maxT = tally[kinds[0]];
        sec.appendChild(h("ul", { class: "v2-cbt__kinds" }, kinds.map(function (k) {
          return h("li", {}, [
            h("span", { class: "v2-cbt__kind-name", text: labels[k] }),
            h("span", { class: "v2-cbt__kind-bar", "aria-hidden": "true" }, h("span", { style: "width:" + Math.round((tally[k] / maxT) * 100) + "%" })),
            h("span", { class: "v2-cbt__kind-n", text: tally[k] + "건" })
          ]);
        })));
        sec.appendChild(h("p", { class: "v2-cbt__hint", text: "변수명 불일치가 많다면 지문의 지정 변수명을 먼저 확인하고, 인자 오류가 많다면 오픈북·치트시트에서 핵심 인자(loss, activation, random_state 등)를 점검하세요." }));
      }
      return sec;
    }

    function reviewSection(R) {
      var sec = h("section", { class: "v2-cbt__review", "aria-labelledby": "v2-cbt-rev-h" });
      var headRow = h("div", { class: "v2-cbt__review-head" });
      headRow.appendChild(h("h3", { class: "v2-cbt__h3", id: "v2-cbt-rev-h", text: "문항별 리뷰" }));
      var all = h("button", { type: "button", class: "v2-btn v2-btn--sm v2-cbt__noprint", text: "모두 펼치기" });
      headRow.appendChild(all);
      sec.appendChild(headRow);
      var items = [];
      R.perQ.forEach(function (r) {
        var q = byNo[r.no] || {};
        var det = h("details", { class: "v2-cbt__rev v2-cbt__rev--" + r.state });
        items.push(det);
        det.appendChild(h("summary", {}, [
          h("span", { class: "v2-cbt__rev-no", text: r.no + "번" }),
          h("span", { class: "v2-cbt__rev-title", text: q.title || "" }),
          h("span", { class: "v2-badge " + (r.pass ? "v2-badge--ok" : r.state === "blank" ? "v2-badge--warn" : "v2-badge--err"), text: r.pass ? "통과" : r.state === "blank" ? "미작성" : "오답" }),
          h("span", { class: "v2-cbt__rev-pts", text: r.earned + " / " + r.points + "점" })
        ]));
        var body = h("div", { class: "v2-cbt__rev-body" });
        body.appendChild(h("h4", { class: "v2-cbt__h4", text: "제출한 코드" }));
        body.appendChild(codeBlock(r.code, r.no + "번 제출 코드"));
        if (!r.pass) {
          body.appendChild(h("h4", { class: "v2-cbt__h4", text: "충족하지 못한 요구사항" }));
          var fl = h("ul", { class: "v2-cbt__failed" });
          if (r.blanks > 0) fl.appendChild(h("li", {}, [h("strong", { text: "빈칸(___) " + r.blanks + "곳이 남아 있습니다. " }), "빈칸이 남아 있으면 자동으로 오답 처리됩니다."]));
          r.failed.forEach(function (f) {
            fl.appendChild(h("li", {}, [h("strong", { text: (f.label || "요구사항") + " " }), f.detail ? h("span", { html: D.richText(f.detail).replace(/^<p>|<\/p>$/g, "") }) : null, f.hint ? h("span", { class: "v2-cbt__fhint", text: " 힌트: " + f.hint }) : null]));
          });
          if (!fl.childNodes.length) fl.appendChild(h("li", { text: "코드를 작성하지 않았습니다." }));
          body.appendChild(fl);
        }
        if (q.expected_output) {
          body.appendChild(h("h4", { class: "v2-cbt__h4", text: "예상 출력" }));
          body.appendChild(h("pre", { class: "v2-cbt__out", tabindex: "0", "aria-label": "예상 출력" }, h("code", { text: q.expected_output })));
        }
        if (q.explanation) {
          body.appendChild(h("h4", { class: "v2-cbt__h4", text: "해설" }));
          body.appendChild(h("div", { class: "v2-cbt__prompt", html: D.richText(q.explanation) }));
        }
        if (q.answer_code) {
          body.appendChild(h("h4", { class: "v2-cbt__h4", text: "모범 답안" }));
          body.appendChild(codeBlock(q.answer_code, r.no + "번 모범 답안"));
        }
        det.appendChild(body);
        sec.appendChild(det);
      });
      var allOpen = false;
      all.addEventListener("click", function () {
        allOpen = !allOpen;
        items.forEach(function (d) { d.open = allOpen; });
        all.textContent = allOpen ? "모두 접기" : "모두 펼치기";
      });
      /* 인쇄 시 접힌 항목도 출력 */
      var restore = [];
      window.addEventListener("beforeprint", function () {
        restore = items.map(function (d) { return d.open; });
        items.forEach(function (d) { d.open = true; });
      });
      window.addEventListener("afterprint", function () {
        items.forEach(function (d, i) { d.open = !!restore[i]; });
      });
      return sec;
    }

    /* ---------- 시작 ---------- */
    self.show = show;
    if (S.submitted && S.result) show("result");
    else if (S.started && S.running) {
      if (curRemaining() <= 0) { S.remaining = 0; show("exam"); }
      else show("exam");
    } else show("intro");
  }

  D.cbt = { mount: mount };

  D.ready(function () {
    var nodes = document.querySelectorAll("[data-v2-cbt]");
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  });
})();
