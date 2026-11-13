/* dl4aice v2 — openbook-modal.js
 * "오픈북 검색 + 30초 트레이너". 시험장에서 공식 문서를 짧게 찾아보는 상황을 연습하는 위젯.
 * - body 에 플로팅 버튼(FAB)과 모달을 직접 만든다 (마운트 요소 없음).
 * - 데이터: DL4AICE.data("openbook_refs") — 첫 오픈 때 지연 로드.
 * - 공개 API: DL4AICE.openbook = { open(query?), close(), isOpen(), _search(query, entries), ... }
 * 순수 검색 함수는 Node 에서도 require 로 시험할 수 있다 (module.exports).
 */
(function () {
  "use strict";

  /* ======================================================================
     1. 순수 함수 — 정규화 · 초성 · 검색 (DOM 무관)
     ====================================================================== */
  var CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
  var KEEP_RE = /[0-9a-zㄱ-ㆎ가-힣]/;

  /* 소문자화 후 영문·숫자·한글만 남긴다 (_ . 공백 - 괄호 등 제거). */
  function norm(text) {
    return String(text == null ? "" : text).toLowerCase().replace(/[^0-9a-zㄱ-ㆎ가-힣]/g, "");
  }

  /* 한글 음절 -> 초성. 음절 = 0xAC00 + (초성*21 + 중성)*28 + 종성  =>  초성 = floor((code-0xAC00)/588).
     이미 자음 자모(ㄱ-ㅎ)면 그대로 두고, 그 밖의 글자는 버린다. */
  function chosung(text) {
    var s = String(text == null ? "" : text);
    var out = "";
    for (var i = 0; i < s.length; i++) {
      var code = s.charCodeAt(i);
      if (code >= 0xac00 && code <= 0xd7a3) out += CHO.charAt(Math.floor((code - 0xac00) / 588));
      else if (code >= 0x3131 && code <= 0x314e) out += s.charAt(i);
    }
    return out;
  }

  /* 공백을 뺀 질의가 자음 자모로만 이뤄졌고 2자 이상이면 초성 검색. */
  function isChosungQuery(raw) {
    var t = String(raw || "").replace(/\s+/g, "");
    return t.length >= 2 && /^[ㄱ-ㅎ]+$/.test(t);
  }

  function esc(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var cache = typeof WeakMap !== "undefined" ? new WeakMap() : null;

  /* 항목마다 한 번만 만드는 검색 색인 */
  function prepare(entry) {
    var hit = cache && cache.get(entry);
    if (hit) return hit;
    var name = String(entry.name || "");
    var bare = name.replace(/\([^)]*\)/g, " ");
    var full = norm(bare);
    var tokens = [];
    bare.split(/[\s\/·.]+/).forEach(function (t) {
      var n = norm(t);
      if (n && n !== full && tokens.indexOf(n) < 0) tokens.push(n);
    });
    var params = (entry.params || []).map(function (p) { return p.name + " " + p.desc; }).join(" ");
    var prepared = {
      full: full,
      withNote: norm(name),
      tokens: tokens,
      kws: (entry.keywords || []).map(function (k) { return { raw: k, n: norm(k), c: chosung(k) }; }),
      sumN: norm(entry.summary),
      sumC: chosung(entry.summary),
      mod: norm(entry.module),
      par: norm((entry.signature || "") + " " + params),
      hay: ""
    };
    prepared.hay = [prepared.full, prepared.withNote, prepared.tokens.join(" "), prepared.sumN, prepared.mod]
      .concat(prepared.kws.map(function (k) { return k.n; })).join(" ");
    if (cache) cache.set(entry, prepared);
    return prepared;
  }

  function subsequenceSpan(text, q) {
    var pos = -1;
    var first = -1;
    for (var i = 0; i < q.length; i++) {
      pos = text.indexOf(q.charAt(i), pos + 1);
      if (pos < 0) return -1;
      if (first < 0) first = pos;
    }
    return pos - first + 1;
  }

  function better(cur, score, tier, via) {
    return !cur || score > cur.score ? { score: score, tier: tier, via: via || "" } : cur;
  }

  function scoreChosung(p, qc) {
    var best = null;
    p.kws.forEach(function (k) {
      if (!k.c) return;
      if (k.c === qc) best = better(best, 650, "chosung", k.raw);
      else if (k.c.indexOf(qc) === 0) best = better(best, 600, "chosung", k.raw);
      else if (k.c.indexOf(qc) >= 0) best = better(best, 520, "chosung", k.raw);
    });
    if (p.sumC.indexOf(qc) >= 0) best = better(best, 380, "summary", "");
    return best;
  }

  function scoreText(p, q, rawTokens) {
    var best = null;
    var i;
    /* 이름: 일치 > 접두 > 부분 */
    if (p.full === q) best = better(best, 1000, "name");
    for (i = 0; i < p.tokens.length; i++) if (p.tokens[i] === q) best = better(best, 960, "name");
    if (p.full.indexOf(q) === 0) best = better(best, 900 - Math.min(50, p.full.length - q.length), "name");
    for (i = 0; i < p.tokens.length; i++) {
      if (p.tokens[i].indexOf(q) === 0) best = better(best, 850 - Math.min(50, p.tokens[i].length - q.length), "name");
    }
    var at = p.full.indexOf(q);
    if (at > 0) best = better(best, 700 - Math.min(50, at), "name");
    at = p.withNote.indexOf(q);
    if (at >= 0) best = better(best, 650 - Math.min(50, at), "name");
    if (q.length < 2) return best;
    /* 키워드 */
    p.kws.forEach(function (k) {
      if (!k.n) return;
      if (k.n === q) best = better(best, 600, "keyword", k.raw);
      else if (k.n.indexOf(q) === 0) best = better(best, 550, "keyword", k.raw);
      else if (k.n.indexOf(q) >= 0) best = better(best, 500, "keyword", k.raw);
    });
    if (q.length >= 3 && p.mod.indexOf(q) >= 0) best = better(best, 400, "module");
    if (p.sumN.indexOf(q) >= 0) best = better(best, 350, "summary");
    if (rawTokens.length >= 2) {
      var all = rawTokens.every(function (t) { return t && p.hay.indexOf(t) >= 0; });
      if (all) best = better(best, 320, "tokens");
    }
    if (q.length >= 4 && p.par.indexOf(q) >= 0) best = better(best, 300, "param");
    if (!best && q.length >= 3) {
      var span = subsequenceSpan(p.full, q);
      if (span > 0 && span <= q.length * 3 + 2) best = better(best, 200 - (span - q.length), "fuzzy");
    }
    return best;
  }

  /* search(query, entries) -> [{ entry, score, tier, via }]  (점수 내림차순, 동점은 데이터 순서) */
  function search(query, entries) {
    var raw = String(query == null ? "" : query).trim();
    if (!raw || !entries) return [];
    var chosungMode = isChosungQuery(raw);
    var qc = chosungMode ? chosung(raw) : "";
    var q = norm(raw);
    var rawTokens = raw.split(/\s+/).map(norm).filter(Boolean);
    var out = [];
    entries.forEach(function (entry, index) {
      var p = prepare(entry);
      var hit = chosungMode ? scoreChosung(p, qc) : q ? scoreText(p, q, rawTokens) : null;
      if (hit) out.push({ entry: entry, score: hit.score, tier: hit.tier, via: hit.via, index: index });
    });
    out.sort(function (a, b) { return b.score - a.score || a.index - b.index; });
    return out;
  }

  /* 이름에서 질의와 맞는 부분을 <mark> 로 감싼 HTML (이스케이프 포함) */
  function highlightName(name, query) {
    var text = String(name == null ? "" : name);
    var q = norm(query);
    if (!q || isChosungQuery(query)) return esc(text);
    var kept = "";
    var idx = [];
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i).toLowerCase();
      if (ch.length === 1 && KEEP_RE.test(ch)) { kept += ch; idx.push(i); }
    }
    var ranges = [];
    var at = kept.indexOf(q);
    if (at >= 0) {
      ranges.push([idx[at], idx[at + q.length - 1] + 1]);
    } else if (q.length >= 3) {
      var pos = -1;
      var marks = [];
      for (var j = 0; j < q.length; j++) {
        pos = kept.indexOf(q.charAt(j), pos + 1);
        if (pos < 0) { marks = []; break; }
        marks.push(idx[pos]);
      }
      marks.forEach(function (m) {
        var last = ranges[ranges.length - 1];
        if (last && last[1] === m) last[1] = m + 1;
        else ranges.push([m, m + 1]);
      });
    }
    if (!ranges.length) return esc(text);
    var html = "";
    var cur = 0;
    ranges.forEach(function (r) {
      html += esc(text.slice(cur, r[0])) + '<mark class="v2-ob__hl">' + esc(text.slice(r[0], r[1])) + "</mark>";
      cur = r[1];
    });
    return html + esc(text.slice(cur));
  }

  var pure = { search: search, chosung: chosung, norm: norm, isChosungQuery: isChosungQuery, highlightName: highlightName };
  if (typeof module !== "undefined" && module.exports) module.exports = pure;
  if (typeof window === "undefined" || !window.DL4AICE) return;

  /* ======================================================================
     2. 브라우저 위젯
     ====================================================================== */
  var D = window.DL4AICE;
  var el = D.el;
  var GOAL_SEC = 30;
  var STORE_KEY = "openbook";
  var uid = "v2-ob";

  var isMac = /Mac|iPhone|iPad|iPod/i.test((navigator.platform || "") + " " + (navigator.userAgent || ""));
  var modKey = isMac ? "⌘" : "Ctrl";

  function reducedMotion() {
    try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  }
  function stacked() {
    try { return window.matchMedia("(max-width: 760px)").matches; } catch (e) { return false; }
  }
  function now() {
    return window.performance && performance.now ? performance.now() : Date.now();
  }
  function fmt(sec) {
    return (Math.round(sec * 10) / 10).toFixed(1);
  }

  var state = {
    built: false,
    open: false,
    loaded: false,
    failed: false,
    entries: [],
    categories: {},
    categoryList: [],
    category: "",
    query: "",
    rows: [],
    active: -1,
    opener: null
  };
  var ui = {};

  /* ---------- 저장소 ---------- */
  function readStat() {
    var s = D.store.get(STORE_KEY, null);
    if (!s || typeof s !== "object") s = {};
    return {
      count: Number(s.count) || 0,
      total: Number(s.total) || 0,
      best: typeof s.best === "number" ? s.best : null,
      recent: Array.isArray(s.recent) ? s.recent.filter(function (x) { return typeof x === "string"; }).slice(0, 5) : []
    };
  }
  function writeStat(stat) {
    D.store.set(STORE_KEY, stat);
  }
  function pushRecent(id) {
    var stat = readStat();
    stat.recent = [id].concat(stat.recent.filter(function (x) { return x !== id; })).slice(0, 5);
    writeStat(stat);
  }

  /* ---------- 30초 트레이너 ---------- */
  var timer = { status: "idle", t0: 0, elapsed: 0, handle: null };

  function paintTimer() {
    var remaining = Math.max(0, GOAL_SEC - timer.elapsed);
    var over = timer.elapsed > GOAL_SEC;
    ui.fill.style.transform = "scaleX(" + (remaining / GOAL_SEC).toFixed(4) + ")";
    var cls = "v2-ob__timer";
    if (timer.status === "done") cls += over ? " is-done is-slow" : " is-done is-fast";
    else if (over) cls += " is-over";
    else if (remaining <= 10) cls += " is-warn";
    ui.timer.className = cls;
    if (timer.status === "done") {
      ui.timeText.textContent = fmt(timer.elapsed) + "초";
    } else if (over) {
      ui.timeText.textContent = "30초 초과";
    } else {
      ui.timeText.textContent = fmt(remaining) + "초";
    }
    ui.reset.hidden = timer.status !== "done";
  }

  function timerStop() {
    if (timer.handle) { clearInterval(timer.handle); timer.handle = null; }
  }

  function timerStart() {
    timerStop();
    timer.status = "running";
    timer.t0 = now();
    timer.elapsed = 0;
    ui.result.textContent = "";
    ui.note.textContent = "";
    paintTimer();
    timer.handle = setInterval(function () {
      timer.elapsed = (now() - timer.t0) / 1000;
      paintTimer();
    }, reducedMotion() ? 1000 : 100);
  }

  function timerFound(entryId) {
    if (timer.status !== "running") return;
    timer.elapsed = (now() - timer.t0) / 1000;
    timerStop();
    timer.status = "done";
    var sec = timer.elapsed;
    ui.result.textContent = fmt(sec) + "초 만에 찾음";
    ui.note.textContent = sec > GOAL_SEC ? "시험장에서는 30초 안에 찾는 연습이 필요합니다" : "";
    var stat = readStat();
    stat.count += 1;
    stat.total += Math.min(sec, 300);
    stat.best = stat.best == null ? sec : Math.min(stat.best, sec);
    stat.recent = [entryId].concat(stat.recent.filter(function (x) { return x !== entryId; })).slice(0, 5);
    writeStat(stat);
    paintTimer();
    paintStat();
  }

  function paintStat() {
    var stat = readStat();
    ui.stat.textContent = stat.count
      ? "내 기록  찾은 횟수 " + stat.count + "회 · 평균 " + fmt(stat.total / stat.count) + "초 · 최고 " + fmt(stat.best) + "초"
      : "내 기록  아직 없습니다. 스니펫이나 import 를 복사하면 기록됩니다.";
  }

  /* ---------- 복사 ---------- */
  function copyText(text, label, entry, button) {
    D.copy(text).then(function (ok) {
      if (ok) {
        D.toast(label + "을(를) 복사했습니다.", { type: "ok", timeout: 2200 });
        if (entry) timerFound(entry.id);
        if (button) {
          var original = button.getAttribute("data-label") || button.textContent;
          button.setAttribute("data-label", original);
          button.textContent = "복사됨";
          setTimeout(function () { if (button.isConnected) button.textContent = original; }, 1600);
        }
      } else {
        D.toast("복사하지 못했습니다. 코드를 직접 선택해 복사해 주세요.", { type: "err" });
      }
    });
  }

  /* ---------- 상세 패널 ---------- */
  function currentEntry() {
    var row = state.rows[state.active];
    return row ? row.entry : null;
  }

  function renderDetail(entry) {
    var pane = ui.detail;
    pane.textContent = "";
    pane.scrollTop = 0;
    if (!entry) {
      pane.appendChild(el("p", { class: "v2-ob__placeholder", text: "항목을 고르면 시그니처, 매개변수, 예제 코드가 여기에 표시됩니다." }));
      return;
    }
    var catLabel = state.categories[entry.category] || "";
    pane.appendChild(
      el("header", { class: "v2-ob__d-head" }, [
        el("h3", { class: "v2-ob__d-name", text: entry.name }),
        el("div", { class: "v2-ob__d-meta" }, [
          el("code", { class: "v2-ob__d-mod", text: entry.module }),
          catLabel ? el("span", { class: "v2-badge v2-badge--info", text: catLabel }) : null
        ])
      ])
    );
    pane.appendChild(el("p", { class: "v2-ob__d-sum", text: entry.summary }));

    var imp = String(entry["import"] || "");
    if (imp) {
      var impBox;
      if (/^\s*\(/.test(imp)) {
        impBox = el("p", { class: "v2-ob__soft", text: "사용 방법: " + imp.replace(/^\s*\(|\)\s*$/g, "") });
      } else {
        impBox = el("div", { class: "v2-ob__row" }, [
          el("pre", { class: "v2-code v2-ob__code" }, [el("code", { html: D.highlight(imp) })]),
          el("button", {
            type: "button", class: "v2-btn v2-btn--sm", "data-act": "copy-import", text: "import 복사",
            onclick: function (ev) { copyText(imp, "import 문", entry, ev.currentTarget); }
          })
        ]);
      }
      pane.appendChild(section("import", impBox));
    }

    pane.appendChild(section("시그니처", el("pre", { class: "v2-code v2-ob__code v2-ob__code--wrap" }, [el("code", { html: D.highlight(entry.signature) })])));

    if (entry.params && entry.params.length) {
      var dl = el("dl", { class: "v2-ob__params" });
      entry.params.forEach(function (p) {
        dl.appendChild(el("dt", null, [el("code", { text: p.name })]));
        dl.appendChild(el("dd", { text: p.desc }));
      });
      pane.appendChild(section("주요 매개변수", dl));
    }

    pane.appendChild(
      section("예제 코드", el("div", { class: "v2-ob__row" }, [
        el("pre", { class: "v2-code v2-ob__code" }, [el("code", { html: D.highlight(entry.snippet) })]),
        el("button", {
          type: "button", class: "v2-btn v2-btn--primary v2-btn--sm", "data-act": "copy-snippet", text: "코드 복사",
          "aria-keyshortcuts": modKey === "⌘" ? "Meta+Enter" : "Control+Enter",
          onclick: function (ev) { copyText(entry.snippet, "예제 코드", entry, ev.currentTarget); }
        })
      ]))
    );

    if (entry.pitfall) {
      pane.appendChild(
        el("div", { class: "v2-ob__pitfall", role: "note" }, [
          el("span", { class: "v2-badge v2-badge--warn", text: "주의" }),
          el("p", { text: entry.pitfall })
        ])
      );
    }
  }

  function section(title, body) {
    return el("section", { class: "v2-ob__sec" }, [el("h4", { class: "v2-ob__sec-title", text: title }), body]);
  }

  /* ---------- 목록 ---------- */
  var VIA_LABEL = { keyword: "키워드", chosung: "초성", summary: "설명", module: "모듈", param: "매개변수", tokens: "단어 조합", fuzzy: "유사 이름" };

  function buildRows() {
    var q = state.query.trim();
    var sections = [];
    var inCategory = function (e) { return !state.category || e.category === state.category; };
    if (q) {
      var found = search(q, state.entries).filter(function (r) { return inCategory(r.entry); });
      sections.push({ title: "", rows: found });
    } else if (state.category) {
      sections.push({
        title: state.categories[state.category] || "",
        rows: state.entries.filter(inCategory).map(function (e) { return { entry: e, tier: "", via: "" }; })
      });
    } else {
      var byId = {};
      state.entries.forEach(function (e) { byId[e.id] = e; });
      var recent = readStat().recent.map(function (id) { return byId[id]; }).filter(Boolean);
      var top = state.entries.filter(function (e) { return e.top; });
      if (recent.length) sections.push({ title: "최근 찾아본 항목", rows: recent.map(function (e) { return { entry: e, tier: "", via: "" }; }) });
      sections.push({ title: "시험장 빈출 TOP", rows: top.map(function (e) { return { entry: e, tier: "", via: "" }; }) });
    }
    return sections;
  }

  function render() {
    var list = ui.list;
    list.textContent = "";
    state.rows = [];
    if (state.failed) {
      list.appendChild(el("p", { class: "v2-ob__empty", text: "검색 자료를 불러오지 못했습니다. 페이지를 새로 고친 뒤 다시 열어 주세요." }));
      finishRender();
      return;
    }
    if (!state.loaded) {
      list.appendChild(el("p", { class: "v2-ob__empty", text: "검색 자료를 불러오는 중입니다..." }));
      finishRender();
      return;
    }
    var q = state.query.trim();
    var sections = buildRows();
    var total = sections.reduce(function (n, s) { return n + s.rows.length; }, 0);
    if (!total) {
      list.appendChild(el("p", { class: "v2-ob__empty", text: "일치하는 항목이 없습니다. 영문 함수명, 한글 키워드, 초성(예: ㅈㄱㅈㄹ)으로 검색해 보세요." }));
      finishRender();
      return;
    }
    sections.forEach(function (sec, si) {
      var host = list;
      if (sec.title) {
        var gid = uid + "-g" + si;
        host = el("div", { role: "group", "aria-labelledby": gid, class: "v2-ob__group" });
        host.appendChild(el("div", { id: gid, class: "v2-ob__group-title", text: sec.title }));
        list.appendChild(host);
      }
      sec.rows.forEach(function (row) {
        var i = state.rows.length;
        state.rows.push(row);
        var e = row.entry;
        var name = el("span", { class: "v2-ob__opt-name", html: q ? highlightName(e.name, q) : esc(e.name) });
        var via = row.via && VIA_LABEL[row.tier] && row.tier !== "name"
          ? el("span", { class: "v2-ob__opt-via", text: (VIA_LABEL[row.tier]) + (row.via ? " · " + row.via : "") })
          : null;
        host.appendChild(
          el("div", { role: "option", id: uid + "-o" + i, class: "v2-ob__opt", "aria-selected": "false", "data-i": String(i) }, [
            el("span", { class: "v2-ob__opt-top" }, [name, el("span", { class: "v2-ob__opt-mod", text: e.module })]),
            el("span", { class: "v2-ob__opt-sum", text: e.summary }),
            via
          ])
        );
      });
    });
    finishRender();
  }

  function finishRender() {
    var has = state.rows.length > 0;
    ui.input.setAttribute("aria-expanded", has ? "true" : "false");
    setActive(has ? 0 : -1, false);
    var q = state.query.trim();
    ui.status.textContent = !state.loaded ? "" : has ? (q ? "검색 결과 " + state.rows.length + "개" : "항목 " + state.rows.length + "개") : "검색 결과 없음";
  }

  function setActive(i, scroll) {
    state.active = i;
    var opts = ui.list.querySelectorAll('[role="option"]');
    for (var k = 0; k < opts.length; k++) opts[k].setAttribute("aria-selected", k === i ? "true" : "false");
    if (i >= 0 && opts[i]) {
      ui.input.setAttribute("aria-activedescendant", opts[i].id);
      if (scroll) scrollIntoList(opts[i]);
    } else {
      ui.input.removeAttribute("aria-activedescendant");
    }
    renderDetail(currentEntry());
  }

  function scrollIntoList(node) {
    var box = ui.list;
    var top = node.offsetTop;
    var bottom = top + node.offsetHeight;
    var parent = node.offsetParent;
    /* 그룹 래퍼 안에 있으면 offsetTop 이 래퍼 기준이므로 getBoundingClientRect 로 계산 */
    var nr = node.getBoundingClientRect();
    var br = box.getBoundingClientRect();
    if (nr.top < br.top) box.scrollTop -= br.top - nr.top + 4;
    else if (nr.bottom > br.bottom) box.scrollTop += nr.bottom - br.bottom + 4;
    void top; void bottom; void parent;
  }

  function move(delta) {
    var n = state.rows.length;
    if (!n) return;
    setActive((state.active + delta + n) % n, true);
  }

  /* Enter: 항목을 확정하고 [코드 복사] 버튼으로 포커스를 옮긴다 (한 번 더 Enter 로 복사). */
  function choose() {
    var entry = currentEntry();
    if (!entry) return;
    pushRecent(entry.id);
    var btn = ui.detail.querySelector('[data-act="copy-snippet"]');
    if (btn) {
      btn.focus();
      if (stacked()) btn.scrollIntoView({ block: "center", behavior: reducedMotion() ? "auto" : "smooth" });
    }
  }

  function copyActiveSnippet() {
    var entry = currentEntry();
    if (!entry) return;
    var btn = ui.detail.querySelector('[data-act="copy-snippet"]');
    copyText(entry.snippet, "예제 코드", entry, btn);
  }

  /* ---------- 카테고리 칩 ---------- */
  function renderChips() {
    ui.chips.textContent = "";
    var items = [{ id: "", label: "전체" }].concat(state.categoryList);
    items.forEach(function (c, i) {
      ui.chips.appendChild(
        el("button", {
          type: "button", class: "v2-ob__chip", "data-cat": c.id, text: c.label,
          "aria-pressed": c.id === state.category ? "true" : "false",
          tabindex: c.id === state.category ? "0" : "-1"
        })
      );
      void i;
    });
  }

  function setCategory(id) {
    state.category = id;
    var chips = ui.chips.querySelectorAll(".v2-ob__chip");
    for (var i = 0; i < chips.length; i++) {
      var on = chips[i].getAttribute("data-cat") === id;
      chips[i].setAttribute("aria-pressed", on ? "true" : "false");
      chips[i].tabIndex = on ? 0 : -1;
    }
    render();
  }

  function onChipKey(ev) {
    var chips = Array.prototype.slice.call(ui.chips.querySelectorAll(".v2-ob__chip"));
    var at = chips.indexOf(document.activeElement);
    if (at < 0) return;
    var to = -1;
    if (ev.key === "ArrowRight") to = (at + 1) % chips.length;
    else if (ev.key === "ArrowLeft") to = (at - 1 + chips.length) % chips.length;
    else if (ev.key === "Home") to = 0;
    else if (ev.key === "End") to = chips.length - 1;
    if (to < 0) return;
    ev.preventDefault();
    chips.forEach(function (c, i) { c.tabIndex = i === to ? 0 : -1; });
    chips[to].focus();
  }

  /* ---------- 열기 / 닫기 ---------- */
  function scrollbarWidth() {
    return Math.max(0, window.innerWidth - document.documentElement.clientWidth);
  }

  function lockScroll() {
    var html = document.documentElement;
    html.style.setProperty("--v2-ob-sbw", scrollbarWidth() + "px");
    html.classList.add("v2-ob-lock");
  }
  function unlockScroll() {
    var html = document.documentElement;
    html.classList.remove("v2-ob-lock");
    html.style.removeProperty("--v2-ob-sbw");
  }

  function ensureData() {
    if (state.loaded || state.failed || state.loading) return;
    state.loading = true;
    var done = function () { state.loading = false; if (state.open) render(); };
    var p;
    try { p = D.data("openbook_refs"); } catch (e) { p = Promise.reject(e); }
    p.then(function (json) {
      state.entries = (json && Array.isArray(json.entries)) ? json.entries : [];
      state.categoryList = (json && Array.isArray(json.categories)) ? json.categories : [];
      state.categories = {};
      state.categoryList.forEach(function (c) { state.categories[c.id] = c.label; });
      state.loaded = state.entries.length > 0;
      state.failed = !state.loaded;
      if (state.loaded) renderChips();
      done();
    }, function () {
      state.failed = true;
      done();
    });
  }

  function open(query) {
    build();
    var preset = typeof query === "string" ? query : null;
    if (state.open) {
      if (preset !== null) { ui.input.value = preset; state.query = preset; render(); }
      ui.input.focus();
      return;
    }
    state.opener = document.activeElement && document.activeElement !== document.body ? document.activeElement : ui.fab;
    state.open = true;
    ui.root.hidden = false;
    lockScroll();
    ui.fab.setAttribute("aria-expanded", "true");
    state.query = preset !== null ? preset : "";
    ui.input.value = state.query;
    timerStart();
    paintStat();
    ensureData();
    render();
    ui.input.focus();
    if (preset) ui.input.select();
  }

  function close() {
    if (!state.open) return;
    state.open = false;
    timerStop();
    ui.root.hidden = true;
    unlockScroll();
    ui.fab.setAttribute("aria-expanded", "false");
    var back = state.opener;
    state.opener = null;
    if (!back || !back.isConnected || (back.focus && back.offsetParent === null && back !== ui.fab)) back = ui.fab;
    try { back.focus(); } catch (e) { ui.fab.focus(); }
  }

  function toggle() {
    if (state.open) close();
    else open();
  }

  /* ---------- 키보드 ---------- */
  function focusables() {
    var nodes = ui.dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])');
    return Array.prototype.filter.call(nodes, function (n) {
      return !n.hidden && (n.offsetWidth || n.offsetHeight || n.getClientRects().length);
    });
  }

  function onDialogKey(ev) {
    if (ev.key === "Tab") {
      var f = focusables();
      if (!f.length) { ev.preventDefault(); return; }
      var first = f[0];
      var last = f[f.length - 1];
      var cur = document.activeElement;
      if (ev.shiftKey && (cur === first || !ui.dialog.contains(cur))) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && (cur === last || !ui.dialog.contains(cur))) { ev.preventDefault(); first.focus(); }
      return;
    }
    if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) {
      ev.preventDefault();
      copyActiveSnippet();
    }
  }

  function onInputKey(ev) {
    if (ev.isComposing || ev.keyCode === 229) return;
    if (ev.key === "ArrowDown") { ev.preventDefault(); move(1); }
    else if (ev.key === "ArrowUp") { ev.preventDefault(); move(-1); }
    else if (ev.key === "Enter" && !ev.ctrlKey && !ev.metaKey) { ev.preventDefault(); choose(); }
  }

  function onDocKey(ev) {
    var k = (ev.key || "").toLowerCase();
    if ((ev.ctrlKey || ev.metaKey) && !ev.altKey && !ev.shiftKey && (k === "k" || ev.code === "KeyK")) {
      ev.preventDefault();
      toggle();
      return;
    }
    if (state.open && ev.key === "Escape") {
      ev.preventDefault();
      ev.stopPropagation();
      close();
    }
  }

  function onFocusIn(ev) {
    if (state.open && !ui.dialog.contains(ev.target) && !(ev.target.closest && ev.target.closest(".v2-toasts"))) ui.input.focus();
  }

  /* ---------- DOM 생성 ---------- */
  function icon() {
    var wrap = document.createElement("span");
    wrap.innerHTML =
      '<svg class="v2-ob-fab__icon" viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false">' +
      '<circle cx="8.5" cy="8.5" r="5.5"></circle><path d="M13 13l4.5 4.5"></path></svg>';
    return wrap.firstChild;
  }

  function build() {
    if (state.built) return;
    state.built = true;

    ui.fab = el("button", {
      type: "button", class: "v2-ob-fab", "aria-haspopup": "dialog", "aria-expanded": "false",
      "aria-label": "오픈북 검색 열기 (" + modKey + " K)",
      "aria-keyshortcuts": isMac ? "Meta+K" : "Control+K",
      onclick: function () { toggle(); }
    }, [
      icon(),
      el("span", { class: "v2-ob-fab__label", text: "오픈북 검색" }),
      el("span", { class: "v2-ob-fab__short", "aria-hidden": "true", text: "오픈북" }),
      el("kbd", { class: "v2-kbd v2-ob-fab__kbd", "aria-hidden": "true", text: modKey + " K" })
    ]);

    var titleId = uid + "-title";
    var listId = uid + "-list";

    ui.fill = el("i", { class: "v2-ob__timer-fill" });
    ui.timeText = el("span", { class: "v2-ob__timer-text", text: "30.0초" });
    ui.result = el("span", { class: "v2-ob__timer-result", role: "status", "aria-live": "polite" });
    ui.note = el("span", { class: "v2-ob__timer-note" });
    ui.reset = el("button", {
      type: "button", class: "v2-ob__timer-reset", text: "다시 시작", hidden: true,
      onclick: function () { timerStart(); ui.input.focus(); }
    });
    ui.timer = el("div", { class: "v2-ob__timer" }, [
      el("span", { class: "v2-ob__timer-label", text: "30초 트레이너" }),
      el("span", { class: "v2-ob__timer-bar", "aria-hidden": "true" }, [ui.fill]),
      ui.timeText,
      ui.result,
      ui.note,
      ui.reset
    ]);

    ui.input = el("input", {
      type: "text", class: "v2-ob__input", id: uid + "-input", role: "combobox", autocomplete: "off", autocapitalize: "off",
      spellcheck: "false", enterkeyhint: "search", placeholder: "함수명, 한글 키워드, 초성으로 검색 (예: earlystop, 결측, ㅈㄱㅈㄹ)",
      "aria-label": "오픈북 검색어", "aria-autocomplete": "list", "aria-expanded": "false", "aria-controls": listId
    });
    ui.chips = el("div", { class: "v2-ob__chips", role: "toolbar", "aria-label": "분류 필터" });
    ui.list = el("div", { class: "v2-ob__list", id: listId, role: "listbox", "aria-label": "검색 결과" });
    ui.detail = el("section", { class: "v2-ob__detail", "aria-label": "선택한 항목 상세" });
    ui.status = el("div", { class: "v2-sr-only", role: "status", "aria-live": "polite" });
    ui.stat = el("span", { class: "v2-ob__stat" });

    function kbd(t) { return el("kbd", { class: "v2-kbd", text: t }); }
    ui.dialog = el("div", { class: "v2-ob__dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": titleId, tabindex: "-1" }, [
      el("header", { class: "v2-ob__head" }, [
        el("h2", { class: "v2-ob__title", id: titleId, text: "오픈북 검색" }),
        ui.timer,
        el("button", { type: "button", class: "v2-ob__close", "aria-label": "오픈북 검색 닫기", onclick: close }, [
          (function () {
            var s = document.createElement("span");
            s.innerHTML = '<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M5 5l10 10M15 5L5 15"></path></svg>';
            return s.firstChild;
          })()
        ])
      ]),
      el("div", { class: "v2-ob__searchbar" }, [ui.input]),
      ui.chips,
      el("div", { class: "v2-ob__body" }, [ui.list, ui.detail]),
      el("footer", { class: "v2-ob__foot" }, [
        el("span", { class: "v2-ob__hint" }, [
          kbd("↑"), kbd("↓"), " 이동 · ", kbd("Enter"), " 선택하고 [코드 복사]로 이동 · ", kbd(modKey + "+Enter"), " 바로 복사 · ", kbd("Esc"), " 닫기"
        ]),
        ui.stat
      ]),
      ui.status
    ]);

    ui.root = el("div", { class: "v2-ob", hidden: true }, [ui.dialog]);
    document.body.appendChild(ui.fab);
    document.body.appendChild(ui.root);

    renderChips();
    renderDetail(null);

    ui.input.addEventListener("input", function () {
      var prev = state.query;
      state.query = ui.input.value;
      if (prev.trim() && !state.query.trim()) timerStart();
      render();
    });
    ui.input.addEventListener("keydown", onInputKey);
    ui.dialog.addEventListener("keydown", onDialogKey);
    ui.chips.addEventListener("keydown", onChipKey);
    ui.chips.addEventListener("click", function (ev) {
      var b = ev.target.closest ? ev.target.closest(".v2-ob__chip") : null;
      if (!b) return;
      var id = b.getAttribute("data-cat");
      setCategory(id === state.category ? "" : id);
    });
    ui.list.addEventListener("mousedown", function (ev) {
      /* 입력창 포커스를 유지한다 (모바일에서는 click 에서 키보드를 접는다) */
      if (ev.target.closest && ev.target.closest(".v2-ob__opt")) ev.preventDefault();
    });
    ui.list.addEventListener("click", function (ev) {
      var o = ev.target.closest ? ev.target.closest(".v2-ob__opt") : null;
      if (!o) return;
      setActive(parseInt(o.getAttribute("data-i"), 10), false);
      var entry = currentEntry();
      if (entry) pushRecent(entry.id);
      if (stacked()) {
        ui.input.blur();
        ui.detail.scrollIntoView({ block: "start", behavior: reducedMotion() ? "auto" : "smooth" });
      }
    });
    var downOn = null;
    ui.root.addEventListener("mousedown", function (ev) { downOn = ev.target; });
    ui.root.addEventListener("click", function (ev) {
      if (ev.target === ui.root && downOn === ui.root) close();
      downOn = null;
    });
    document.addEventListener("focusin", onFocusIn);
    paintStat();
    paintTimer();
  }

  function init() {
    if (D.openbook && D.openbook._ready) return;
    build();
    document.addEventListener("keydown", onDocKey);
  }

  D.openbook = {
    _ready: true,
    open: open,
    close: close,
    isOpen: function () { return state.open; },
    _search: search,
    _chosung: chosung,
    _norm: norm,
    _isChosungQuery: isChosungQuery,
    _highlightName: highlightName
  };

  D.ready(init);
})();
