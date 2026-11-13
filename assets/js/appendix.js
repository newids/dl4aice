/* dl4aice v2 — appendix.js
 * 부록 「외워야 하는 코드 3단 분해」의 연습 기능.
 *   1) 가리고 떠올리기: 2단 코드에서 이름·값만(값 가리기) 또는 주석만 남기고(줄 가리기) 가린다.
 *      가린 자리를 누르면 하나씩 열린다.
 *   2) 보지 않고 써 보기: 1단 흐름만 주석으로 남긴 셀에 코드를 쓰고 정적 채점으로 확인한다.
 *   3) 간격 복습: 통과하면 다음 복습일이 1·3·7·14·30일로 늘어난다(이 브라우저에 저장).
 * 스크립트가 꺼져 있으면 부록은 전체 코드가 보이는 읽기 전용 페이지로 남는다.
 */
(function () {
  "use strict";

  var D = window.DL4AICE;
  if (!D) return;
  var el = D.el;
  var DAY = 24 * 60 * 60 * 1000;
  var STORE_KEY = "appendix";
  var MASK_TOKENS = ".v2-tok-str, .v2-tok-num, .v2-tok-fn, .v2-tok-cls, .v2-tok-builtin, .v2-tok-param, .v2-tok-mod";

  function readState() {
    return D.store.get(STORE_KEY, {}) || {};
  }

  function startOfDay(ts) {
    var d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  function daysUntil(due) {
    return Math.round((startOfDay(due) - startOfDay(Date.now())) / DAY);
  }

  /* ---------- 1) 가리고 떠올리기 ---------- */
  function setupMask(block) {
    var frames = Array.prototype.slice.call(block.querySelectorAll(".v2-cb"));
    if (!frames.length) return;
    var modes = [
      { id: "all", label: "전체 보기" },
      { id: "values", label: "값 가리기" },
      { id: "lines", label: "줄 가리기" }
    ];
    var status = el("span", { class: "v2-ap-mask__status", "aria-live": "polite" });
    var buttons = modes.map(function (mode) {
      return el("button", {
        class: "v2-btn v2-btn--sm",
        type: "button",
        "aria-pressed": mode.id === "all" ? "true" : "false",
        text: mode.label,
        onclick: function () { apply(mode.id); }
      });
    });
    var bar = el("div", { class: "v2-ap-mask", role: "group", "aria-label": "가리고 떠올리기" }, buttons.concat([status]));
    var head = block.querySelector(".v2-ap-head");
    head.parentNode.insertBefore(bar, head.nextSibling);

    function clear() {
      frames.forEach(function (frame) {
        frame.classList.remove("is-mask-values", "is-mask-lines");
        Array.prototype.forEach.call(frame.querySelectorAll(".is-open"), function (node) { node.classList.remove("is-open"); });
        Array.prototype.forEach.call(frame.querySelectorAll("[data-ap-hide]"), function (node) {
          node.removeAttribute("data-ap-hide");
          node.removeAttribute("tabindex");
          node.removeAttribute("role");
          node.removeAttribute("aria-label");
        });
      });
    }

    function count() {
      var total = 0;
      var open = 0;
      frames.forEach(function (frame) {
        total += frame.querySelectorAll("[data-ap-hide]").length;
        open += frame.querySelectorAll("[data-ap-hide].is-open").length;
      });
      status.textContent = total ? "가린 곳 " + total + "개 중 " + open + "개 열림" : "";
    }

    function apply(modeId) {
      clear();
      buttons.forEach(function (btn, i) { btn.setAttribute("aria-pressed", modes[i].id === modeId ? "true" : "false"); });
      if (modeId === "values") {
        frames.forEach(function (frame) {
          frame.classList.add("is-mask-values");
          Array.prototype.forEach.call(frame.querySelectorAll(MASK_TOKENS), function (tok) {
            if (tok.closest(".v2-tok-com")) return;
            mark(tok, "가린 값");
          });
        });
      } else if (modeId === "lines") {
        frames.forEach(function (frame) {
          frame.classList.add("is-mask-lines");
          Array.prototype.forEach.call(frame.querySelectorAll(".v2-cb__line"), function (line) {
            var text = line.textContent.trim();
            if (!text || text.charAt(0) === "#") return;
            mark(line, "가린 줄");
          });
        });
      }
      count();
    }

    function mark(node, label) {
      node.setAttribute("data-ap-hide", "1");
      node.setAttribute("tabindex", "0");
      node.setAttribute("role", "button");
      node.setAttribute("aria-label", label + " — 눌러서 열기");
    }

    function toggle(target) {
      var node = target.closest ? target.closest("[data-ap-hide]") : null;
      if (!node) return false;
      node.classList.toggle("is-open");
      node.setAttribute("aria-label", node.classList.contains("is-open") ? node.textContent.trim() : "가린 곳 — 눌러서 열기");
      count();
      return true;
    }

    block.addEventListener("click", function (event) { toggle(event.target); });
    block.addEventListener("keydown", function (event) {
      if ((event.key === "Enter" || event.key === " ") && toggle(event.target)) event.preventDefault();
    });
  }

  /* ---------- 2) 보지 않고 써 보기 + 3) 간격 복습 ---------- */
  function setupPractice(mount, unit, intervals, refreshReview) {
    if (!D.cell || !D.cell.create) return;
    var draftKey = "draft.appendix." + unit.id;
    var note = el("p", { class: "v2-ap-practice__note", "aria-live": "polite" });

    function describe() {
      var rec = readState()[unit.id];
      if (!rec) { note.textContent = "아직 통과 기록이 없습니다."; return; }
      var left = daysUntil(rec.due);
      note.textContent =
        "통과 " + rec.level + "회 · 다음 복습 " + (left <= 0 ? "오늘" : left + "일 뒤") +
        (rec.level >= intervals.length ? " (마지막 간격)" : "");
    }

    var cell = D.cell.create({
      n: unit.title.charAt(0),
      code: D.store.get(draftKey, unit.skeleton),
      skeleton: unit.skeleton,
      rules: unit.rules,
      runLabel: "확인",
      onChange: function (code) { D.store.set(draftKey, code); },
      onRun: function (result) {
        if (!result.pass) return;
        var state = readState();
        var prev = state[unit.id] || { level: 0, due: 0 };
        /* 같은 날 여러 번 통과해도 간격은 한 번만 늘린다 */
        var already = prev.last && startOfDay(prev.last) === startOfDay(Date.now());
        var level = already ? prev.level : Math.min(prev.level + 1, intervals.length);
        var gap = intervals[Math.max(0, level - 1)];
        state[unit.id] = { level: level, due: startOfDay(Date.now()) + gap * DAY, last: Date.now() };
        D.store.set(STORE_KEY, state);
        cell.renderOutput({ answer_code: unit.answer_code });
        describe();
        refreshReview();
      }
    });

    var again = el("button", {
      class: "v2-btn v2-btn--ghost v2-btn--sm",
      type: "button",
      text: "이 묶음 기록 지우기",
      onclick: function () {
        var state = readState();
        delete state[unit.id];
        D.store.set(STORE_KEY, state);
        D.store.remove(draftKey);
        cell.reset();
        describe();
        refreshReview();
      }
    });

    mount.appendChild(el("h3", { class: "v2-ap-practice__title", text: "보지 않고 써 보기" }));
    mount.appendChild(el("div", { class: "v2-ap-practice__task", html: D.richText(unit.task) }));
    mount.appendChild(cell.root);
    mount.appendChild(el("div", { class: "v2-ap-practice__foot" }, [note, again]));
    describe();
  }

  function renderReview(mount, units) {
    var state = readState();
    var due = 0;
    var items = units.map(function (unit) {
      var rec = state[unit.id];
      var badge;
      if (!rec) badge = el("span", { class: "v2-badge", text: "아직 안 함" });
      else {
        var left = daysUntil(rec.due);
        if (left <= 0) { due++; badge = el("span", { class: "v2-badge v2-badge--warn", text: "오늘 복습" }); }
        else badge = el("span", { class: "v2-badge v2-badge--ok", text: left + "일 뒤" });
      }
      return el("li", { class: "v2-ap-review__item" }, [
        el("a", { href: "#" + unit.id, text: unit.title }),
        badge
      ]);
    });
    var done = units.filter(function (u) { return state[u.id]; }).length;
    mount.textContent = "";
    mount.appendChild(el("p", { class: "v2-ap-review__title" }, [
      el("strong", { text: "복습 일정" }),
      el("span", { text: " · 한 번 이상 통과 " + done + " / " + units.length + (due ? " · 오늘 복습할 묶음 " + due + "개" : "") })
    ]));
    mount.appendChild(el("ul", { class: "v2-ap-review__list" }, items));
  }

  D.ready(function () {
    var unitsOnPage = document.querySelectorAll("[data-ap-unit]");
    if (!unitsOnPage.length) return;
    Array.prototype.forEach.call(document.querySelectorAll("[data-ap-code]"), setupMask);

    D.data("appendix_units").then(function (data) {
      var review = document.querySelector("[data-ap-review]");
      var refresh = function () { if (review) renderReview(review, data.units); };
      data.units.forEach(function (unit) {
        var mount = document.querySelector('[data-ap-practice="' + unit.id + '"]');
        if (mount) setupPractice(mount, unit, data.intervals_days || [1, 3, 7, 14, 30], refresh);
      });
      refresh();
    }, function () {
      var review = document.querySelector("[data-ap-review]");
      if (review) review.textContent = "연습 데이터를 불러오지 못했습니다. 코드는 그대로 읽을 수 있습니다.";
    });
  });
})();
