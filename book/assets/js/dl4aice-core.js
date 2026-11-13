/* dl4aice v2 — dl4aice-core.js
 * 모든 v2 위젯이 공유하는 최소 런타임: 데이터 로더, localStorage 저장소, 진도 기록,
 * 토스트, 파이썬 코드 하이라이터, 클립보드, 라이트/다크 테마.
 * 외부 의존성 없음. file:// 로 열어도 동작하도록 데이터는 assets/data/*.js 래퍼
 * (window.DL4AICE_DATA)에서 먼저 찾고, 없을 때만 fetch 로 JSON 을 읽는다.
 */
(function () {
  "use strict";

  var NS = "dl4aice.v2.";
  var D = (window.DL4AICE = window.DL4AICE || {});

  /* ---------- 유틸 ---------- */
  function escapeHtml(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* 문제 지문용 미니 마크업: `code`, **굵게**, 빈 줄 = 문단, 줄바꿈 = <br>, "- " 목록 */
  function richText(text) {
    var source = String(text == null ? "" : text).replace(/\r\n?/g, "\n");
    /* ```코드 펜스``` 는 먼저 떼어 내어 코드 블록으로 렌더링한다 */
    var fences = [];
    source = source.replace(/```[a-zA-Z]*\n([\s\S]*?)\n?```/g, function (_, code) {
      fences.push(code);
      return "\n\n\u0000FENCE" + (fences.length - 1) + "\u0000\n\n";
    });
    var blocks = source.split(/\n{2,}/).filter(function (b) { return b.trim() !== ""; });
    return blocks
      .map(function (block) {
        var fence = /^\u0000FENCE(\d+)\u0000$/.exec(block.trim());
        if (fence) {
          return '<pre class="v2-code"><code>' + highlight(fences[Number(fence[1])]) + "</code></pre>";
        }
        var lines = block.split("\n");
        var inline = function (line) {
          return escapeHtml(line)
            .replace(/`([^`]+)`/g, "<code>$1</code>")
            .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
        };
        if (lines.every(function (l) { return /^\s*[-•]\s+/.test(l); })) {
          return "<ul>" + lines.map(function (l) { return "<li>" + inline(l.replace(/^\s*[-•]\s+/, "")) + "</li>"; }).join("") + "</ul>";
        }
        if (lines.every(function (l) { return /^\s*\d+[.)]\s+/.test(l); })) {
          return "<ol>" + lines.map(function (l) { return "<li>" + inline(l.replace(/^\s*\d+[.)]\s+/, "")) + "</li>"; }).join("") + "</ol>";
        }
        return "<p>" + lines.map(inline).join("<br>") + "</p>";
      })
      .join("");
  }

  var KEYWORDS = /^(?:False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)$/;
  var TOKEN_RE = /(#[^\n]*)|((?:[rRbBfFuU]{1,2})?(?:'''[\s\S]*?'''|"""[\s\S]*?"""|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"))|(\b\d[\d_]*\.?\d*(?:[eE][+-]?\d+)?\b)|(_{3,})|([A-Za-z_][A-Za-z0-9_]*)/g;

  /* 파이썬 코드 -> 하이라이트된 HTML (이스케이프 포함) */
  function highlight(code) {
    var src = String(code == null ? "" : code);
    var out = "";
    var last = 0;
    var m;
    TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(src))) {
      out += escapeHtml(src.slice(last, m.index));
      var text = escapeHtml(m[0]);
      if (m[1]) out += '<span class="v2-tok-com">' + text + "</span>";
      else if (m[2]) out += '<span class="v2-tok-str">' + text + "</span>";
      else if (m[3]) out += '<span class="v2-tok-num">' + text + "</span>";
      else if (m[4]) out += '<span class="v2-tok-blank">' + text + "</span>";
      else if (KEYWORDS.test(m[5])) out += '<span class="v2-tok-kw">' + text + "</span>";
      else if (src[TOKEN_RE.lastIndex] === "(") out += '<span class="v2-tok-fn">' + text + "</span>";
      else out += text;
      last = TOKEN_RE.lastIndex;
    }
    return out + escapeHtml(src.slice(last));
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === false || value == null) return;
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key === "html") node.innerHTML = value;
      else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? "" : value);
    });
    (Array.isArray(children) ? children : children == null ? [] : [children]).forEach(function (child) {
      if (child == null || child === false) return;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  /* ---------- 저장소 ---------- */
  var memory = {};
  var store = {
    get: function (key, fallback) {
      try {
        var raw = window.localStorage.getItem(NS + key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (e) {
        return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : fallback;
      }
    },
    set: function (key, value) {
      memory[key] = value;
      try {
        window.localStorage.setItem(NS + key, JSON.stringify(value));
        return true;
      } catch (e) {
        return false;
      }
    },
    remove: function (key) {
      delete memory[key];
      try { window.localStorage.removeItem(NS + key); } catch (e) { /* 저장소 사용 불가 */ }
    }
  };

  /* ---------- 진도 ---------- */
  function readProgress() {
    var p = store.get("progress", null) || {};
    p.drills = p.drills || {};
    p.mocks = p.mocks || {};
    return p;
  }

  function announce() {
    try {
      document.dispatchEvent(new CustomEvent("dl4aice:progress", { detail: readProgress() }));
    } catch (e) { /* 구형 브라우저 */ }
  }

  var progress = {
    read: readProgress,
    /* 챕터 실습 문항 통과 기록. questionId 예: "ch04-q3" */
    markDrill: function (questionId, passed) {
      var p = readProgress();
      var prev = p.drills[questionId] || { attempts: 0, ok: false };
      p.drills[questionId] = {
        ok: prev.ok || !!passed,
        attempts: (prev.attempts || 0) + 1,
        ts: Date.now()
      };
      store.set("progress", p);
      announce();
      return p.drills[questionId];
    },
    isDrillDone: function (questionId) {
      var rec = readProgress().drills[questionId];
      return !!(rec && rec.ok);
    },
    /* chapterKey 예: "ch04". questionIds 는 그 챕터 문항 id 배열 */
    chapterStats: function (questionIds) {
      var p = readProgress();
      var done = (questionIds || []).filter(function (id) { return p.drills[id] && p.drills[id].ok; }).length;
      var total = (questionIds || []).length;
      return { done: done, total: total, percent: total ? Math.round((done / total) * 100) : 0 };
    },
    /* 모의고사 채점 결과 기록. detail = { parts: {preprocess:{earned,max},...}, elapsedSec } */
    recordMock: function (mockId, score, detail) {
      var p = readProgress();
      var prev = p.mocks[mockId] || { best: 0, attempts: 0 };
      p.mocks[mockId] = {
        best: Math.max(prev.best || 0, score),
        last: score,
        attempts: (prev.attempts || 0) + 1,
        detail: detail || null,
        ts: Date.now()
      };
      store.set("progress", p);
      announce();
      return p.mocks[mockId];
    },
    mock: function (mockId) {
      return readProgress().mocks[mockId] || null;
    },
    reset: function () {
      store.remove("progress");
      announce();
    }
  };

  /* ---------- 데이터 로더 ---------- */
  var pending = {};
  function data(name) {
    var bag = window.DL4AICE_DATA || {};
    if (bag[name]) return Promise.resolve(bag[name]);
    if (!pending[name]) {
      pending[name] = fetch("assets/data/" + name + ".json")
        .then(function (res) {
          if (!res.ok) throw new Error(name + ".json " + res.status);
          return res.json();
        })
        .then(function (json) {
          (window.DL4AICE_DATA = window.DL4AICE_DATA || {})[name] = json;
          return json;
        });
    }
    return pending[name];
  }

  /* ---------- 토스트 ---------- */
  function toastHost() {
    var host = document.querySelector(".v2-toasts");
    if (!host) {
      host = el("div", { class: "v2-toasts", role: "status", "aria-live": "polite" });
      document.body.appendChild(host);
    }
    return host;
  }

  /* toast("메시지", { type: "ok" | "err" | "info", title, timeout(ms), html }) */
  function toast(message, opts) {
    opts = opts || {};
    var type = opts.type || "info";
    var node = el("div", { class: "v2-toast v2-toast--" + type }, [
      opts.title ? el("strong", { class: "v2-toast__title", text: opts.title }) : null,
      opts.html ? el("div", { class: "v2-toast__body", html: message }) : el("div", { class: "v2-toast__body", text: message }),
      el("button", { class: "v2-toast__close", type: "button", "aria-label": "닫기", text: "×", onclick: function () { dismiss(); } })
    ]);
    var timer = null;
    function dismiss() {
      if (timer) clearTimeout(timer);
      if (node.parentNode) node.parentNode.removeChild(node);
    }
    var host = toastHost();
    while (host.children.length >= 3) host.removeChild(host.firstChild);
    host.appendChild(node);
    var timeout = opts.timeout === undefined ? (type === "err" ? 9000 : 4500) : opts.timeout;
    if (timeout > 0) timer = setTimeout(dismiss, timeout);
    return dismiss;
  }

  /* ---------- 클립보드 ---------- */
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    var area = el("textarea", { class: "v2-sr-only", "aria-hidden": "true" });
    area.value = text;
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(area);
    return ok;
  }

  /* ---------- 테마 ---------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
    var btn = document.querySelector(".v2-theme-toggle");
    if (btn) {
      btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      btn.textContent = theme === "dark" ? "라이트 모드" : "다크 모드";
    }
  }

  var theme = {
    get: function () { return store.get("theme", "light"); },
    set: function (value) { store.set("theme", value); applyTheme(value); },
    toggle: function () { theme.set(theme.get() === "dark" ? "light" : "dark"); }
  };

  /* 깜빡임 방지: 스크립트 로드 즉시 적용 */
  applyTheme(theme.get());

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    var masthead = document.querySelector(".masthead");
    if (masthead && !masthead.querySelector(".v2-theme-toggle")) {
      var tools = masthead.querySelector(".masthead__tools");
      if (!tools) {
        tools = el("span", { class: "masthead__tools" });
        var toc = masthead.querySelector(".masthead__toc");
        masthead.appendChild(tools);
        if (toc) tools.appendChild(toc);
      }
      tools.insertBefore(
        el("button", { class: "v2-theme-toggle", type: "button", onclick: function () { theme.toggle(); } }),
        tools.firstChild
      );
    }
    applyTheme(theme.get());
  });

  /* 접힌 <details>(v1 지면판·해설) 안의 앵커로 이동하면 자동으로 펼친다 */
  function revealHashTarget() {
    var id = decodeURIComponent((window.location.hash || "").slice(1));
    if (!id) return;
    var target = document.getElementById(id);
    if (!target) return;
    var opened = false;
    for (var node = target.parentElement; node; node = node.parentElement) {
      if (node.tagName === "DETAILS" && !node.open) { node.open = true; opened = true; }
    }
    if (opened) target.scrollIntoView();
  }
  ready(revealHashTarget);
  window.addEventListener("hashchange", revealHashTarget);

  D.escapeHtml = escapeHtml;
  D.richText = richText;
  D.highlight = highlight;
  D.el = el;
  D.store = store;
  D.progress = progress;
  D.data = data;
  D.toast = toast;
  D.copy = copy;
  D.theme = theme;
  D.ready = ready;
})();
