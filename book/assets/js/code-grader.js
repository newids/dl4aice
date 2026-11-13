/* dl4aice v2 — code-grader.js
 * 1) DL4AICE.cell.create(options): 주피터 셀 스타일 코드 빈칸 채우기 + 정적 채점 컴포넌트
 * 2) DL4AICE.drills.mount(el): [data-v2-drills] 챕터 실습 섹션 (데이터: chapter_drills)
 * 의존: dl4aice-core.js, grader-core.js. 외부 라이브러리 없음.
 */
(function () {
  "use strict";

  var D = (window.DL4AICE = window.DL4AICE || {});
  var uid = 0;

  function $(tag, attrs, children) { return D.el(tag, attrs, children); }
  function esc(s) { return D.escapeHtml(s); }

  /* 이스케이프 후 `code` -> <code> */
  function inlineCode(text) {
    return esc(text).replace(/`([^`]+)`/g, "<code>$1</code>");
  }

  var SVG_NS = "http://www.w3.org/2000/svg";
  function mark(ok) {
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    var path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", ok ? "M3 8.5l3.2 3.2L13 4.8" : "M4 4l8 8M12 4l-8 8");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "2.2");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);
    return svg;
  }

  function countBlanks(code) {
    if (D.grader && D.grader.countBlanks) return D.grader.countBlanks(code);
    return (String(code).match(/_{3,}/g) || []).length;
  }

  /* ======================================================================
     Part A. 셀
     ====================================================================== */
  function createCell(options) {
    options = options || {};
    var id = ++uid;
    var n = options.n == null ? " " : options.n;
    var skeleton = options.skeleton != null ? options.skeleton : options.code != null ? options.code : "";
    var initial = options.code != null ? options.code : skeleton;
    var rules = options.rules || [];
    var runLabel = options.runLabel || "실행 및 채점";
    var disabled = false;
    var changeTimer = null;
    var escapeArmed = false;
    var lastBlankCount = -1;

    /* ----- DOM ----- */
    var ta = $("textarea", {
      class: "v2-cell__editor",
      spellcheck: "false",
      autocapitalize: "off",
      autocomplete: "off",
      autocorrect: "off",
      wrap: "off",
      rows: "3",
      "aria-label": "코드 입력 (In [" + n + "])",
      "aria-describedby": "v2-cell-hint-" + id + " v2-cell-status-" + id
    });
    ta.value = initial;

    var hint = $("span", {
      class: "v2-sr-only",
      id: "v2-cell-hint-" + id,
      text: "Shift+Enter 로 실행합니다. Tab 은 들여쓰기입니다. 편집기를 벗어나려면 Esc 를 누른 뒤 Tab 을 누르세요. Alt+N 은 다음 빈칸으로 이동합니다."
    });
    var printView = $("pre", { class: "v2-code v2-cell__print", "aria-hidden": "true" });
    var status = $("span", { class: "v2-cell__status", id: "v2-cell-status-" + id, "aria-live": "polite" });

    var runBtn = $("button", { class: "v2-btn v2-btn--primary", type: "button" }, [
      runLabel + " ",
      $("span", { class: "v2-cell__keyhint", text: "(Shift+Enter)" })
    ]);
    var nextBtn = $("button", { class: "v2-btn", type: "button", title: "다음 빈칸으로 이동 (Alt+N)", text: "다음 빈칸" });
    var resetBtn = $("button", { class: "v2-btn v2-btn--ghost", type: "button", text: "초기화" });
    var confirmBox = $("span", { class: "v2-cell__confirm", hidden: true, role: "group", "aria-label": "초기화 확인" });
    var yesBtn = $("button", { class: "v2-btn v2-btn--danger v2-btn--sm", type: "button", text: "예, 처음 상태로" });
    var noBtn = $("button", { class: "v2-btn v2-btn--ghost v2-btn--sm", type: "button", text: "취소" });
    confirmBox.appendChild($("span", { class: "v2-cell__confirm-msg", text: "작성한 코드를 지울까요?" }));
    confirmBox.appendChild(yesBtn);
    confirmBox.appendChild(noBtn);

    var actions = $("div", { class: "v2-cell__actions" }, [runBtn, nextBtn, resetBtn, confirmBox]);
    (options.toolbar || []).forEach(function (node) { if (node) actions.appendChild(node); });

    var feedbackBox = $("div", { class: "v2-cell__feedback", "aria-live": "polite" });
    var outputBox = $("div", { class: "v2-cell__output" });
    var outBody = $("div", { class: "v2-cell__out-body" }, [feedbackBox, outputBox]);
    var outRow = $("div", { class: "v2-cell__row v2-cell__row--out", hidden: true }, [
      $("div", { class: "v2-cell__gutter v2-cell__gutter--out", "aria-hidden": "true", text: "Out [" + n + "]:" }),
      outBody
    ]);

    var root = $("div", { class: "v2-cell" }, [
      $("div", { class: "v2-cell__row v2-cell__row--in" }, [
        $("div", { class: "v2-cell__gutter", "aria-hidden": "true", text: "In [" + n + "]:" }),
        $("div", { class: "v2-cell__editor-wrap" }, [ta, hint, printView])
      ]),
      $("div", { class: "v2-cell__bar" }, [status, actions]),
      outRow
    ]);

    /* ----- 내부 ----- */
    function autosize() {
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + 2 + "px";
    }

    function updateStatus() {
      var count = countBlanks(ta.value);
      if (count === lastBlankCount) return;
      lastBlankCount = count;
      status.textContent = count > 0 ? "빈칸 " + count + "개 남음" : "빈칸 없음";
      status.classList.toggle("is-clear", count === 0);
      nextBtn.disabled = disabled || count === 0;
    }

    function syncPrint() { printView.textContent = ta.value; }

    function refreshAll() {
      autosize();
      updateStatus();
      syncPrint();
    }

    function markStale() { outRow.classList.add("is-stale"); }

    function showOutRow() {
      var has = feedbackBox.childNodes.length || outputBox.childNodes.length;
      outRow.hidden = !has;
    }

    function selectBlank(from) {
      var text = ta.value;
      var re = /_{3,}/g;
      var m;
      var first = null;
      var pick = null;
      while ((m = re.exec(text))) {
        if (!first) first = m;
        if (m.index >= from) { pick = m; break; }
      }
      pick = pick || first;
      if (!pick) return false;
      ta.focus();
      ta.setSelectionRange(pick.index, pick.index + pick[0].length);
      scrollSelectionIntoView(pick.index);
      return true;
    }

    /* 가로 스크롤 상태에서도 선택 위치가 보이도록 줄/열 계산으로 스크롤 보정 */
    function scrollSelectionIntoView(index) {
      var before = ta.value.slice(0, index);
      var line = before.split("\n").length - 1;
      var col = before.length - (before.lastIndexOf("\n") + 1);
      var cs = window.getComputedStyle(ta);
      var lh = parseFloat(cs.lineHeight) || 22;
      var cw = parseFloat(cs.fontSize) * 0.6;
      var x = col * cw;
      if (x < ta.scrollLeft || x > ta.scrollLeft + ta.clientWidth - cw * 6) {
        ta.scrollLeft = Math.max(0, x - ta.clientWidth / 3);
      }
      var rect = ta.getBoundingClientRect();
      var y = rect.top + line * lh + parseFloat(cs.paddingTop);
      if (y < 60 || y > window.innerHeight - 80) {
        window.scrollBy({ top: y - window.innerHeight / 3, behavior: "auto" });
      }
    }

    function insertText(text, start, end) {
      ta.focus();
      ta.setSelectionRange(start, end);
      var done = false;
      try { done = document.execCommand("insertText", false, text); } catch (e) { done = false; }
      if (!done || ta.value.slice(start, start + text.length) !== text) {
        ta.setRangeText(text, start, end, "end");
        ta.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }

    function indentSelection(outdent) {
      var v = ta.value;
      var s = ta.selectionStart;
      var e = ta.selectionEnd;
      var multi = v.slice(s, e).indexOf("\n") !== -1;
      if (!outdent && !multi) { insertText("    ", s, e); return; }
      var ls = v.lastIndexOf("\n", s - 1) + 1;
      var le = e;
      if (e > s && v[e - 1] === "\n") le = e - 1;
      var lineEnd = v.indexOf("\n", le);
      if (lineEnd === -1) lineEnd = v.length;
      var block = v.slice(ls, lineEnd);
      var lines = block.split("\n");
      var firstDelta = 0;
      var total = 0;
      var changed = lines.map(function (line, i) {
        var out;
        if (outdent) {
          var m = /^( {1,4}|\t)/.exec(line);
          var cut = m ? m[0].length : 0;
          out = line.slice(cut);
          if (i === 0) firstDelta = -cut;
          total -= cut;
        } else {
          out = "    " + line;
          if (i === 0) firstDelta = 4;
          total += 4;
        }
        return out;
      });
      var replaced = changed.join("\n");
      if (replaced === block) return;
      insertText(replaced, ls, lineEnd);
      var ns = Math.max(ls, s + firstDelta);
      ta.setSelectionRange(ns, e + total);
    }

    function scheduleChange() {
      if (typeof options.onChange !== "function") return;
      clearTimeout(changeTimer);
      changeTimer = setTimeout(function () { options.onChange(ta.value); }, 300);
    }

    function flushChange() {
      if (changeTimer) {
        clearTimeout(changeTimer);
        changeTimer = null;
        if (typeof options.onChange === "function") options.onChange(ta.value);
      }
    }

    /* ----- 피드백 ----- */
    function renderFeedback(result) {
      feedbackBox.textContent = "";
      outRow.classList.remove("is-stale");
      if (!result) { showOutRow(); return; }

      var pass = !!result.pass;
      var head = $("div", { class: "v2-cell__verdict" }, [
        $("span", { class: "v2-badge " + (pass ? "v2-badge--ok" : "v2-badge--err") }, [mark(pass), pass ? "정답" : "오답"]),
        $("span", { class: "v2-cell__score", text: result.passed + "/" + result.total + " 조건 통과" })
      ]);
      feedbackBox.appendChild(head);

      if (result.empty) {
        feedbackBox.appendChild($("p", { class: "v2-cell__note", text: "셀이 비어 있습니다. 코드를 작성한 뒤 실행하세요." }));
      } else if (result.blanks > 0) {
        feedbackBox.appendChild($("p", { class: "v2-cell__note", text: "빈칸이 " + result.blanks + "개 남아 있습니다. 모든 ___ 를 채워야 채점됩니다." }));
      }

      var list = $("ul", { class: "v2-cell__checks" });
      (result.results || []).forEach(function (r) {
        var li = $("li", { class: "v2-cell__check " + (r.ok ? "is-ok" : "is-fail") });
        li.appendChild($("span", { class: "v2-cell__mark", "aria-hidden": "true" }, [mark(r.ok)]));
        var body = $("div", { class: "v2-cell__check-body" });
        body.appendChild($("span", { class: "v2-sr-only", text: r.ok ? "통과: " : "미통과: " }));
        body.appendChild($("span", { class: "v2-cell__check-label", html: inlineCode(r.label || "") }));
        if (!r.ok) {
          if (r.detail) body.appendChild($("div", { class: "v2-cell__detail", html: inlineCode(r.detail) }));
          if (r.hint) body.appendChild($("div", { class: "v2-cell__hint", html: "<span>힌트</span> " + inlineCode(r.hint) }));
        }
        li.appendChild(body);
        list.appendChild(li);
      });
      feedbackBox.appendChild(list);
      showOutRow();
    }

    function renderOutput(payload) {
      outputBox.textContent = "";
      if (!payload) { showOutRow(); return; }
      outRow.classList.remove("is-stale");

      if (payload.expected_output) {
        outputBox.appendChild($("div", { class: "v2-cell__sub", text: "가상 실행 결과" }));
        outputBox.appendChild($("pre", { class: "v2-code v2-cell__result", text: String(payload.expected_output) }));
      }
      if (payload.explanation) {
        outputBox.appendChild($("div", { class: "v2-cell__sub", text: "해설" }));
        outputBox.appendChild($("div", { class: "v2-cell__explain", html: D.richText(payload.explanation) }));
      }
      if (payload.answer_code) {
        var code = String(payload.answer_code);
        var copyBtn = $("button", { class: "v2-btn v2-btn--sm", type: "button", text: "코드 복사" });
        copyBtn.addEventListener("click", function () {
          D.copy(code).then(function (ok) {
            copyBtn.textContent = ok ? "복사됨" : "복사 실패";
            setTimeout(function () { copyBtn.textContent = "코드 복사"; }, 1600);
          });
        });
        var pre = $("pre", { class: "v2-code" });
        pre.appendChild($("code", { html: D.highlight(code) }));
        outputBox.appendChild($("details", { class: "v2-cell__answer" }, [
          $("summary", { text: "모범 답안 보기" }),
          $("div", { class: "v2-cell__answer-body" }, [pre, $("div", { class: "v2-cell__answer-tools" }, [copyBtn])])
        ]));
      }
      showOutRow();
    }

    /* ----- 실행 ----- */
    function toastFor(result) {
      if (options.quiet) return;
      if (result.pass) {
        D.toast("모든 조건을 통과했습니다.", { type: "ok", timeout: 3000 });
        return;
      }
      var items = [];
      if (result.empty) items.push("셀이 비어 있습니다.");
      else if (result.blanks > 0) items.push("빈칸이 " + result.blanks + "개 남아 있습니다.");
      (result.results || []).forEach(function (r) {
        if (!r.ok && items.length < 3) items.push(r.detail || r.hint || r.label);
      });
      var html = "<ul>" + items.slice(0, 3).map(function (t) { return "<li>" + inlineCode(t) + "</li>"; }).join("") + "</ul>";
      D.toast(html, { type: "err", title: "오답 — 이 부분을 확인하세요", html: true });
    }

    function run() {
      var code = ta.value;
      if (!D.grader || !D.grader.grade) {
        D.toast("채점 모듈을 불러오지 못했습니다. 페이지를 새로 고쳐 보세요.", { type: "err" });
        return null;
      }
      flushChange();
      var result;
      try {
        result = D.grader.grade(code, rules);
      } catch (e) {
        D.toast("채점 중 오류가 발생했습니다.", { type: "err" });
        return null;
      }
      renderFeedback(result);
      if (typeof options.onRun === "function") options.onRun(result, code);
      toastFor(result);
      return result;
    }

    function setCode(code) {
      ta.value = code == null ? "" : String(code);
      refreshAll();
    }

    function reset() {
      setCode(skeleton);
      renderFeedback(null);
      renderOutput(null);
      hideConfirm();
      if (typeof options.onChange === "function") {
        clearTimeout(changeTimer);
        changeTimer = null;
        options.onChange(ta.value);
      }
    }

    function setDisabled(flag) {
      disabled = !!flag;
      ta.readOnly = disabled;
      ta.disabled = false;
      root.classList.toggle("is-disabled", disabled);
      runBtn.disabled = disabled;
      resetBtn.disabled = disabled;
      lastBlankCount = -1;
      updateStatus();
    }

    function hideConfirm() {
      confirmBox.hidden = true;
      resetBtn.hidden = false;
    }

    /* ----- 이벤트 ----- */
    ta.addEventListener("input", function () {
      refreshAll();
      markStale();
      scheduleChange();
    });

    ta.addEventListener("keydown", function (e) {
      var key = e.key;
      if (key === "Escape") { escapeArmed = true; return; }
      if (key === "Tab") {
        if (escapeArmed || e.ctrlKey || e.metaKey || e.altKey) { escapeArmed = false; return; }
        if (disabled) return;
        e.preventDefault();
        indentSelection(e.shiftKey);
        return;
      }
      escapeArmed = false;
      if (key === "Enter" && (e.shiftKey || e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (!disabled) run();
        return;
      }
      if (e.altKey && (e.code === "KeyN" || key === "n" || key === "N")) {
        e.preventDefault();
        selectBlank(ta.selectionEnd);
      }
    });
    ta.addEventListener("blur", function () { escapeArmed = false; flushChange(); });
    ta.addEventListener("focus", autosize);

    runBtn.addEventListener("click", run);
    nextBtn.addEventListener("click", function () {
      if (!selectBlank(ta.selectionEnd)) {
        D.toast("남은 빈칸이 없습니다.", { type: "info", timeout: 2000 });
      }
    });
    resetBtn.addEventListener("click", function () {
      resetBtn.hidden = true;
      confirmBox.hidden = false;
      yesBtn.focus();
    });
    noBtn.addEventListener("click", function () {
      hideConfirm();
      resetBtn.focus();
    });
    yesBtn.addEventListener("click", function () {
      reset();
      ta.focus();
    });
    confirmBox.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.stopPropagation(); hideConfirm(); resetBtn.focus(); }
    });

    window.addEventListener("resize", autosize);
    window.addEventListener("beforeprint", function () { syncPrint(); });

    refreshAll();
    /* 접힌/숨겨진 상태로 만들어진 경우를 대비해 붙은 뒤 한 번 더 높이를 맞춘다 */
    setTimeout(autosize, 0);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(autosize);

    return {
      root: root,
      textarea: ta,
      getCode: function () { return ta.value; },
      setCode: setCode,
      reset: reset,
      run: run,
      renderFeedback: renderFeedback,
      renderOutput: renderOutput,
      setDisabled: setDisabled,
      focusFirstBlank: function () { return selectBlank(0); }
    };
  }

  D.cell = { create: createCell };

  /* ======================================================================
     Part B. 챕터 실습 섹션
     ====================================================================== */
  function readDrillProgress() {
    return D.progress.read();
  }

  function mountDrills(host) {
    if (!host || host.getAttribute("data-v2-mounted") === "1") return;
    host.setAttribute("data-v2-mounted", "1");
    host.classList.add("v2-drills");
    var chapter = parseInt(host.getAttribute("data-chapter"), 10);

    host.textContent = "";
    host.appendChild($("p", { class: "v2-drills__note", text: "실습 셀을 불러오는 중입니다." }));

    D.data("chapter_drills").then(function (json) {
      var items = ((json && json.items) || []).filter(function (it) { return it.chapter === chapter; });
      build(host, chapter, items);
    }).catch(function () {
      host.textContent = "";
      host.appendChild($("h2", { class: "v2-drills__title", text: "실습 셀 — 코드 빈칸 채우기" }));
      host.appendChild($("p", { class: "v2-drills__note", text: "실습 데이터를 불러오지 못했습니다. 페이지를 새로 고치거나 잠시 후 다시 시도해 주세요." }));
    });
  }

  function build(host, chapter, items) {
    host.textContent = "";
    var titleId = "v2-drills-title-" + (++uid);
    host.setAttribute("aria-labelledby", titleId);
    var title = $("h2", { class: "v2-drills__title", id: titleId, text: "실습 셀 — 코드 빈칸 채우기" });
    host.appendChild(title);

    if (!items.length) {
      host.appendChild($("p", { class: "v2-drills__note", text: "이 챕터에는 아직 실습 셀이 없습니다." }));
      return;
    }

    host.appendChild($("p", { class: "v2-drills__intro", html:
      "빈칸 <code>___</code> 을 채우고 <span class=\"v2-kbd\">Shift</span>+<span class=\"v2-kbd\">Enter</span> 로 채점하세요. " +
      "채점은 코드를 실행하지 않고 <strong>필수 코드가 들어 있는지</strong> 정적으로 검사합니다. " +
      "따옴표 종류, 공백, 키워드 인자의 순서는 달라도 되지만 <strong>변수명</strong>은 문제에서 정한 대로 써야 합니다."
    }));

    var ids = items.map(function (it) { return it.question_id; });

    var fill = $("div", { class: "v2-drills__fill" });
    var bar = $("div", { class: "v2-drills__bar", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(ids.length), "aria-label": "이 챕터 실습 진행도" }, [fill]);
    var progressText = $("span", { class: "v2-drills__count", "aria-live": "polite" });
    var clearBtn = $("button", { class: "v2-btn v2-btn--ghost v2-btn--sm", type: "button", text: "이 챕터 기록 초기화" });
    var clearMsg = $("span", { class: "v2-drills__confirm", hidden: true, role: "group", "aria-label": "기록 초기화 확인" });
    var clearYes = $("button", { class: "v2-btn v2-btn--danger v2-btn--sm", type: "button", text: "예, 초기화" });
    var clearNo = $("button", { class: "v2-btn v2-btn--ghost v2-btn--sm", type: "button", text: "취소" });
    clearMsg.appendChild($("span", { text: "작성한 코드와 완료 기록이 지워집니다." }));
    clearMsg.appendChild(clearYes);
    clearMsg.appendChild(clearNo);

    host.appendChild($("div", { class: "v2-drills__meter" }, [
      $("div", { class: "v2-drills__meter-top" }, [progressText, $("span", { class: "v2-drills__clear" }, [clearBtn, clearMsg])]),
      bar
    ]));

    var cards = [];

    function refreshProgress() {
      var st = D.progress.chapterStats(ids);
      progressText.textContent = st.done + " / " + st.total + " 완료";
      fill.style.width = st.percent + "%";
      bar.setAttribute("aria-valuenow", String(st.done));
      bar.setAttribute("aria-valuetext", st.done + " / " + st.total + " 완료");
      cards.forEach(function (c) { c.syncDone(); });
    }

    /* 오픈북 버튼 가시성 */
    var openbookBtns = [];
    function syncOpenbook() {
      var has = !!(D.openbook && typeof D.openbook.open === "function");
      openbookBtns.forEach(function (b) { b.hidden = !has; });
    }

    var list = $("div", { class: "v2-drills__list" });
    items.forEach(function (item, idx) {
      var card = buildCard(item, idx + 1, openbookBtns, refreshProgress);
      cards.push(card);
      list.appendChild(card.root);
    });
    host.appendChild(list);

    refreshProgress();
    syncOpenbook();
    D.ready(syncOpenbook);
    window.addEventListener("load", syncOpenbook);
    document.addEventListener("dl4aice:progress", refreshProgress);

    clearBtn.addEventListener("click", function () {
      clearBtn.hidden = true;
      clearMsg.hidden = false;
      clearYes.focus();
    });
    clearNo.addEventListener("click", function () {
      clearMsg.hidden = true;
      clearBtn.hidden = false;
      clearBtn.focus();
    });
    clearYes.addEventListener("click", function () {
      var p = readDrillProgress();
      ids.forEach(function (id) {
        D.store.remove("draft." + id);
        delete p.drills[id];
      });
      D.store.set("progress", p);
      cards.forEach(function (c) { c.wipe(); });
      try { document.dispatchEvent(new CustomEvent("dl4aice:progress", { detail: p })); } catch (e) { refreshProgress(); }
      refreshProgress();
      clearMsg.hidden = true;
      clearBtn.hidden = false;
      clearBtn.focus();
      D.toast("이 챕터의 작성 코드와 실습 기록을 지웠습니다.", { type: "info", timeout: 3000 });
    });
  }

  function buildCard(item, number, openbookBtns, onProgress) {
    var qid = item.question_id;
    var fails = 0;
    var cardId = "v2-drill-" + qid;

    var doneBadge = $("span", { class: "v2-badge v2-badge--ok", hidden: true }, [mark(true), "완료"]);
    var badges = $("div", { class: "v2-drill__badges" });
    if (item.difficulty) badges.appendChild($("span", { class: "v2-badge v2-badge--info", text: item.difficulty }));
    badges.appendChild(doneBadge);

    var head = $("header", { class: "v2-drill__head" }, [
      $("span", { class: "v2-drill__no", "aria-hidden": "true", text: String(number) }),
      $("h3", { class: "v2-drill__title" }, [$("span", { class: "v2-sr-only", text: "실습 " + number + ". " }), item.title || qid]),
      badges
    ]);

    var parts = [head];
    if (item.source) {
      parts.push($("details", { class: "v2-drill__source" }, [$("summary", { text: "출처" }), $("p", { text: item.source })]));
    }
    parts.push($("div", { class: "v2-drill__prompt", html: D.richText(item.prompt || "") }));

    var saved = D.store.get("draft." + qid, null);
    var startCode = typeof saved === "string" && saved !== "" ? saved : item.skeleton_code || "";

    var obBtn = $("button", { class: "v2-btn", type: "button", text: "오픈북 검색", hidden: true });
    obBtn.addEventListener("click", function () {
      if (D.openbook && typeof D.openbook.open === "function") D.openbook.open();
      else D.toast("오픈북 검색을 사용할 수 없습니다.", { type: "info", timeout: 2500 });
    });
    openbookBtns.push(obBtn);

    var revealBox = $("div", { class: "v2-drill__reveal", hidden: true });
    var revealBtn = $("button", { class: "v2-btn", type: "button", text: "모범 답안과 해설 보기" });
    revealBox.appendChild(revealBtn);

    var cell = createCell({
      n: number,
      code: startCode,
      skeleton: item.skeleton_code || "",
      rules: item.validation_rules || [],
      toolbar: [obBtn],
      onChange: function (code) {
        if (code === (item.skeleton_code || "")) D.store.remove("draft." + qid);
        else D.store.set("draft." + qid, code);
      },
      onRun: function (result) {
        var wasDone = D.progress.isDrillDone(qid);
        D.progress.markDrill(qid, result.pass);
        if (result.pass) {
          cell.renderOutput({ expected_output: item.expected_output, explanation: item.explanation, answer_code: item.answer_code });
          revealBox.hidden = true;
        } else {
          fails++;
          cell.renderOutput(null);
          if (fails >= 2) revealBox.hidden = false;
        }
        if (!wasDone) onProgress();
      }
    });

    revealBtn.addEventListener("click", function () {
      cell.renderOutput({ expected_output: item.expected_output, explanation: item.explanation, answer_code: item.answer_code });
      revealBox.hidden = true;
      var d = cell.root.querySelector(".v2-cell__answer");
      if (d) d.open = true;
      var sub = cell.root.querySelector(".v2-cell__output");
      if (sub && sub.scrollIntoView) sub.scrollIntoView({ block: "nearest" });
    });

    parts.push(cell.root);
    parts.push(revealBox);

    var root = $("article", { class: "v2-drill", id: cardId }, parts);

    function syncDone() {
      var done = D.progress.isDrillDone(qid);
      doneBadge.hidden = !done;
      root.classList.toggle("is-done", done);
    }

    function wipe() {
      fails = 0;
      cell.setCode(item.skeleton_code || "");
      cell.renderFeedback(null);
      cell.renderOutput(null);
      revealBox.hidden = true;
    }

    syncDone();
    return { root: root, syncDone: syncDone, wipe: wipe, cell: cell };
  }

  D.drills = { mount: mountDrills };

  D.ready(function () {
    var hosts = document.querySelectorAll("[data-v2-drills]");
    Array.prototype.forEach.call(hosts, mountDrills);
  });
})();
