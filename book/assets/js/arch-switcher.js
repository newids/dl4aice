/* dl4aice v2 — arch-switcher.js
 * "문제 유형 x API 실시간 변환 위젯". [data-v2-arch] 마운트 지점마다 자동 초기화한다.
 * 데이터: DL4AICE.data("arch_patterns") (SPEC §5). 공개 API: DL4AICE.archSwitcher.mount(el)
 */
(function () {
  "use strict";

  var D = window.DL4AICE;
  if (!D) return;

  var FLASH_MS = 2500;
  var uid = 0;

  function el(tag, attrs, children) { return D.el(tag, attrs, children); }

  /* 줄 단위 비교: b 에서 a 와의 LCS 에 속하지 않는 (새로 생기거나 바뀐) 줄 인덱스 집합. 빈 줄은 무시. */
  function changedLines(a, b) {
    var n = a.length, m = b.length, i, j;
    var t = [];
    for (i = 0; i <= n; i++) { t.push(new Array(m + 1)); for (j = 0; j <= m; j++) t[i][j] = 0; }
    for (i = n - 1; i >= 0; i--) {
      for (j = m - 1; j >= 0; j--) {
        t[i][j] = a[i].text === b[j].text ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1]);
      }
    }
    var keep = {};
    i = 0; j = 0;
    while (i < n && j < m) {
      if (a[i].text === b[j].text) { keep[j] = true; i++; j++; }
      else if (t[i + 1][j] >= t[i][j + 1]) i++;
      else j++;
    }
    var out = {};
    for (j = 0; j < m; j++) if (!keep[j] && String(b[j].text).trim() !== "") out[j] = true;
    return out;
  }

  function findBy(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function codeOf(type, api) {
    var c = type && type.code && type.code[api];
    return Array.isArray(c) ? c : [];
  }

  function summaryItems(type) {
    var s = type.summary || {};
    var out = s.output_layer || {};
    var cmp = s.compile || {};
    return [
      { key: "input", tag: "input", label: "입력 shape", value: s.input_shape },
      { key: "output", tag: "output", label: "출력층", value: typeof out === "string" ? out : out.code },
      { key: "loss", tag: "loss", label: "손실 함수", value: cmp.loss },
      { key: "metrics", tag: "metrics", label: "평가지표", value: cmp.metrics },
      { key: "post", tag: "postprocess", label: "예측 후처리", value: s.postprocess },
      { key: "label", tag: "", label: "라벨 형태", value: type.label_format }
    ];
  }

  function mount(root) {
    if (!root || root.getAttribute("data-v2-arch-ready")) return;
    root.setAttribute("data-v2-arch-ready", "1");

    D.data("arch_patterns").then(function (data) {
      if (!data || !Array.isArray(data.types) || !data.types.length || !Array.isArray(data.apis) || !data.apis.length) {
        throw new Error("arch_patterns schema");
      }
      build(root, data);
    }).catch(function () {
      root.className = (root.className ? root.className + " " : "") + "v2-arch v2-wide";
      root.textContent = "";
      root.appendChild(el("p", { class: "v2-arch__error", role: "status",
        text: "코드 비교 데이터를 불러오지 못했습니다. 페이지를 새로 고침한 뒤 다시 시도해 주세요." }));
    });
  }

  function build(root, data) {
    var id = "v2arch" + (++uid);
    var types = data.types, apis = data.apis, tags = data.tags || [];
    var saved = D.store.get("arch", null) || {};

    var typeId = (findBy(types, root.getAttribute("data-default-type")) || findBy(types, saved.type) || types[0]).id;
    var apiId = (findBy(apis, root.getAttribute("data-default-api")) || findBy(apis, saved.api) || apis[0]).id;

    var filter = {};
    (root.getAttribute("data-focus") || "").split(",").forEach(function (t) {
      t = t.trim();
      if (t && findBy(tags, t)) filter[t] = true;
    });

    var state = { type: typeId, api: apiId, compare: false, prev: null };
    var flashTimer = null;

    root.classList.add("v2-arch", "v2-wide");
    root.textContent = "";

    /* ---------- 뼈대 ---------- */
    var typeTabs = el("div", { class: "v2-tabs v2-arch__tabs", role: "tablist", "aria-label": "문제 유형" });
    var apiTabs = el("div", { class: "v2-tabs v2-arch__tabs v2-arch__tabs--api", role: "tablist", "aria-label": "Keras API" });
    var live = el("p", { class: "v2-arch__live", "aria-live": "polite", "aria-atomic": "true" });
    var strip = el("div", { class: "v2-arch__strip" });
    var legend = el("div", { class: "v2-arch__legend", role: "group", "aria-label": "태그 필터" });
    var copyBtn = el("button", { class: "v2-btn v2-btn--sm v2-btn--primary", type: "button", text: "코드 복사" });
    var cmpBtn = el("button", { class: "v2-btn v2-btn--sm v2-arch__cmp", type: "button", "aria-pressed": "false", text: "나란히 비교" });
    var panes = el("div", { class: "v2-arch__panes" });
    var codePanel = el("div", { class: "v2-arch__codepanel", role: "tabpanel", id: id + "-code" }, [panes]);
    var typePanel = el("div", { class: "v2-arch__panel", role: "tabpanel", id: id + "-panel" }, [
      strip,
      el("div", { class: "v2-arch__tools" }, [legend, el("div", { class: "v2-arch__actions" }, [cmpBtn, copyBtn])]),
      codePanel
    ]);

    root.appendChild(el("div", { class: "v2-arch__head" }, [
      el("h3", { class: "v2-arch__title", text: "문제 유형 × API 코드 비교" }),
      el("p", { class: "v2-arch__hint", text: "유형이나 API를 바꾸면 달라지는 줄이 표시됩니다." })
    ]));
    root.appendChild(el("div", { class: "v2-arch__controls" }, [
      el("div", { class: "v2-arch__row" }, [el("span", { class: "v2-arch__rowlabel", "aria-hidden": "true", text: "문제 유형" }), typeTabs]),
      el("div", { class: "v2-arch__row" }, [el("span", { class: "v2-arch__rowlabel", "aria-hidden": "true", text: "API" }), apiTabs])
    ]));
    root.appendChild(live);
    root.appendChild(typePanel);

    /* ---------- 탭 ---------- */
    function makeTabs(host, items, kind, controls) {
      var btns = items.map(function (it) {
        var b = el("button", { class: "v2-tab", type: "button", role: "tab", id: id + "-" + kind + "-" + it.id,
          "aria-controls": controls, "aria-selected": "false", tabindex: "-1", text: it.label });
        b.addEventListener("click", function () { select(kind, it.id); });
        host.appendChild(b);
        return b;
      });
      host.addEventListener("keydown", function (e) {
        var i = btns.indexOf(document.activeElement);
        if (i < 0) return;
        var n = btns.length, next = -1;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % n;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + n) % n;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = n - 1;
        if (next < 0) return;
        e.preventDefault();
        btns[next].focus();
        select(kind, items[next].id);
      });
      return btns;
    }
    var typeBtns = makeTabs(typeTabs, types, "type", id + "-panel");
    var apiBtns = makeTabs(apiTabs, apis, "api", id + "-code");

    function syncTabs() {
      typeBtns.forEach(function (b, i) {
        var on = types[i].id === state.type;
        b.setAttribute("aria-selected", on ? "true" : "false");
        b.tabIndex = on ? 0 : -1;
        if (on) typePanel.setAttribute("aria-labelledby", b.id);
      });
      apiBtns.forEach(function (b, i) {
        var on = apis[i].id === state.api;
        b.setAttribute("aria-selected", on ? "true" : "false");
        b.tabIndex = on ? 0 : -1;
        if (on) codePanel.setAttribute("aria-labelledby", b.id);
      });
    }

    /* ---------- 요약 띠 ---------- */
    function renderStrip(prevType) {
      var type = findBy(types, state.type);
      var items = summaryItems(type);
      var before = prevType ? summaryItems(prevType) : null;
      strip.textContent = "";
      var grid = el("dl", { class: "v2-arch__cards" });
      items.forEach(function (it, i) {
        var changed = before && String(before[i].value) !== String(it.value);
        grid.appendChild(el("div", { class: "v2-arch__card" + (changed ? " is-changed" : ""), "data-tag": it.tag || "label" }, [
          el("dt", { class: "v2-arch__cardlabel" }, [it.label, changed ? el("span", { class: "v2-arch__mark", text: "변경" }) : null]),
          el("dd", { class: "v2-arch__cardvalue", text: it.value == null ? "-" : String(it.value) })
        ]));
      });
      strip.appendChild(el("p", { class: "v2-arch__striptitle", text: "핵심 변경 지점" }));
      strip.appendChild(grid);
      if (type.summary && type.summary.pitfall) {
        strip.appendChild(el("p", { class: "v2-arch__pitfall" }, [
          el("strong", { text: "주의 " }), String(type.summary.pitfall)
        ]));
      }
    }

    /* ---------- 범례 ---------- */
    function renderLegend() {
      legend.textContent = "";
      legend.appendChild(el("span", { class: "v2-arch__legendlabel", text: "태그 강조" }));
      tags.forEach(function (t) {
        var on = !!filter[t.id];
        var chip = el("button", { class: "v2-arch__chip", type: "button", "data-tag": t.id, "aria-pressed": on ? "true" : "false" }, [
          el("span", { class: "v2-arch__swatch", "aria-hidden": "true" }), t.label
        ]);
        chip.addEventListener("click", function () {
          if (filter[t.id]) delete filter[t.id]; else filter[t.id] = true;
          renderLegend();
          applyFilter();
        });
        legend.appendChild(chip);
      });
      if (Object.keys(filter).length) {
        var reset = el("button", { class: "v2-arch__chip v2-arch__chip--reset", type: "button", text: "해제" });
        reset.addEventListener("click", function () { filter = {}; renderLegend(); applyFilter(); });
        legend.appendChild(reset);
      }
    }

    function applyFilter() {
      var active = Object.keys(filter).length > 0;
      panes.classList.toggle("is-filtering", active);
      var lines = panes.querySelectorAll(".v2-arch__line");
      for (var i = 0; i < lines.length; i++) {
        var tag = lines[i].getAttribute("data-tag");
        lines[i].classList.toggle("is-dim", active && !(tag && filter[tag]));
      }
    }

    /* ---------- 코드 ---------- */
    function tagLabel(tid) { var t = findBy(tags, tid); return t ? t.label : tid; }

    function renderPane(api, lines, changed) {
      var selected = api.id === state.api;
      var box = el("div", { class: "v2-code v2-arch__code", tabindex: "0", role: "region",
        "aria-label": api.label + " 코드" });
      var inner = el("div", { class: "v2-arch__lines" });
      lines.forEach(function (ln, i) {
        var row = el("div", { class: "v2-arch__line" + (ln.tag ? " has-tag" : "") + (changed[i] ? " is-changed" : ""), "data-n": String(i + 1) });
        if (ln.tag) row.setAttribute("data-tag", ln.tag);
        row.appendChild(el("span", { class: "v2-arch__src", html: D.highlight(ln.text) }));
        var side = el("span", { class: "v2-arch__side" });
        if (changed[i]) side.appendChild(el("span", { class: "v2-arch__mark", text: "변경" }));
        if (ln.tag) side.appendChild(el("span", { class: "v2-arch__tagbadge", text: tagLabel(ln.tag) }));
        if (side.firstChild) row.appendChild(side);
        inner.appendChild(row);
      });
      box.appendChild(inner);
      return el("div", { class: "v2-arch__pane" + (selected ? " is-selected" : "") }, [
        state.compare ? el("div", { class: "v2-arch__panehead" }, [api.label, selected ? el("span", { class: "v2-badge v2-badge--info", text: "선택됨" }) : null]) : null,
        box
      ]);
    }

    function renderCode() {
      var type = findBy(types, state.type);
      var prevType = state.prev ? findBy(types, state.prev.type) : null;
      panes.textContent = "";
      panes.classList.toggle("is-compare", state.compare);
      var shown = state.compare ? apis : [findBy(apis, state.api)];
      var primaryChanged = {};
      shown.forEach(function (api) {
        var lines = codeOf(type, api.id);
        var changed = {};
        if (state.prev) {
          /* 직전에 보던 같은 API 의 코드와 비교. 단일 보기에서 API 만 바뀌면 직전에 보던 스니펫과 비교한다. */
          var prevApiId = state.compare ? api.id : state.prev.api;
          changed = changedLines(codeOf(prevType, prevApiId), lines);
        }
        if (api.id === state.api) primaryChanged = changed;
        panes.appendChild(renderPane(api, lines, changed));
      });
      applyFilter();
      return primaryChanged;
    }

    function describe(changed) {
      var type = findBy(types, state.type), api = findBy(apis, state.api);
      var lines = codeOf(type, state.api);
      if (!state.prev) return "현재: " + type.label + " · " + api.label + " (" + lines.length + "줄)";
      var pt = findBy(types, state.prev.type), pa = findBy(apis, state.prev.api);
      var head;
      if (pt.id !== type.id && pa.id !== api.id) head = pt.label + " · " + pa.label + " → " + type.label + " · " + api.label;
      else if (pt.id !== type.id) head = pt.label + " → " + type.label;
      else head = pa.label + " → " + api.label;
      var idx = Object.keys(changed);
      if (!idx.length) return head + ": 변경된 줄 없음";
      var seen = {};
      idx.forEach(function (i) { var tg = lines[i].tag; if (tg) seen[tg] = true; });
      var names = tags.filter(function (t) { return seen[t.id]; }).map(function (t) { return t.label; });
      return head + ": " + idx.length + "줄 변경" + (names.length ? " (" + names.join(" · ") + ")" : "");
    }

    function render(prevType) {
      syncTabs();
      renderStrip(prevType);
      var changed = renderCode();
      live.textContent = describe(changed);
      cmpBtn.setAttribute("aria-pressed", state.compare ? "true" : "false");
      clearTimeout(flashTimer);
      if (state.prev) {
        flashTimer = setTimeout(function () {
          var marks = root.querySelectorAll(".is-changed");
          for (var i = 0; i < marks.length; i++) marks[i].classList.remove("is-changed");
          var badges = root.querySelectorAll(".v2-arch__mark");
          for (var j = 0; j < badges.length; j++) badges[j].parentNode.removeChild(badges[j]);
        }, FLASH_MS);
      }
    }

    function select(kind, value) {
      var nextType = kind === "type" ? value : state.type;
      var nextApi = kind === "api" ? value : state.api;
      if (nextType === state.type && nextApi === state.api) return;
      state.prev = { type: state.type, api: state.api };
      var prevType = findBy(types, state.type);
      state.type = nextType;
      state.api = nextApi;
      D.store.set("arch", { type: state.type, api: state.api });
      render(prevType);
    }

    cmpBtn.addEventListener("click", function () {
      state.compare = !state.compare;
      state.prev = null;
      render(null);
    });

    copyBtn.addEventListener("click", function () {
      var api = findBy(apis, state.api);
      var text = codeOf(findBy(types, state.type), state.api).map(function (l) { return l.text; }).join("\n");
      D.copy(text).then(function (ok) {
        if (ok) D.toast(api.label + " 코드를 복사했습니다.", { type: "ok", timeout: 2500 });
        else D.toast("복사하지 못했습니다. 코드를 직접 선택해 복사해 주세요.", { type: "err" });
      });
    });

    renderLegend();
    render(null);
  }

  D.archSwitcher = { mount: mount };

  D.ready(function () {
    var nodes = document.querySelectorAll("[data-v2-arch]");
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  });
})();
