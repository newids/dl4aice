/* dl4aice v2 — motion.js
 * 지면 전체의 모션·비주얼 이펙트 계층. 외부 라이브러리 없음.
 *   - 읽기 진행 막대, 스크롤 등장(reveal), 현재 절 표시(scrollspy)
 *   - 카드 스포트라이트(커서 추적 광원), 통계 숫자 카운트업
 *   - 정답·합격 시 축하 파티클, 테마 전환 원형 리빌(View Transitions)
 * 원칙: transform/opacity 만 애니메이션, 화면당 핵심 요소만, prefers-reduced-motion 이면 전부 끈다.
 * 클래스는 자바스크립트가 붙이므로 스크립트가 꺼져 있으면 모든 내용이 그대로 보인다.
 */
(function () {
  "use strict";

  var D = window.DL4AICE;
  if (!D) return;

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var root = document.documentElement;

  /* ---------- 읽기 진행 막대 ---------- */
  function progressBar() {
    var bar = D.el("div", { class: "v2-progress", "aria-hidden": "true" }, D.el("span", { class: "v2-progress__fill" }));
    document.body.appendChild(bar);
    var fill = bar.firstChild;
    var ticking = false;
    function update() {
      ticking = false;
      var max = root.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      fill.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
      document.body.classList.toggle("v2-scrolled", window.scrollY > 12);
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- 스크롤 등장 ---------- */
  var REVEAL_TARGETS = [
    ".page-body > figure.diagram",
    ".page-body > .objectives",
    ".cover__stats .stat",
    ".v2-dash-stat",
    ".v2-dash-panel",
    ".v2-tool",
    ".road__step",
    ".entry",
    ".v2-cs",
    ".pager"
  ].join(",");

  function reveal() {
    if (reduce || !("IntersectionObserver" in window)) return;
    var nodes = Array.prototype.slice.call(document.querySelectorAll(REVEAL_TARGETS));
    if (!nodes.length) return;
    var io = new IntersectionObserver(function (entries) {
      var shown = 0;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var node = entry.target;
        io.unobserve(node);
        node.style.setProperty("--v2-delay", Math.min(shown, 6) * 60 + "ms");
        shown++;
        node.classList.add("is-in");
        /* 등장이 끝나면 클래스를 걷어 hover 변형과 충돌하지 않게 한다 */
        setTimeout(function () {
          node.classList.remove("v2-reveal", "is-in");
          node.style.removeProperty("--v2-delay");
        }, 1100);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    nodes.forEach(function (node) {
      node.classList.add("v2-reveal");
      io.observe(node);
    });
  }

  /* ---------- 현재 절 표시 ---------- */
  function scrollSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.section-nav a[href^="#"]'));
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    var targets = [];
    links.forEach(function (link) {
      var id = decodeURIComponent(link.getAttribute("href").slice(1));
      var target = document.getElementById(id);
      if (target) { map[id] = link; targets.push(target); }
    });
    var current = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        if (current) current.classList.remove("is-current");
        current = map[entry.target.id];
        if (current) current.classList.add("is-current");
      });
    }, { rootMargin: "-15% 0px -70% 0px" });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---------- 카드 스포트라이트 ---------- */
  var SPOT_TARGETS = ".entry, .v2-tool__link, .v2-dash-stat, .stat, .pager__slot:not(.pager__slot--empty)";
  function spotlight() {
    if (!finePointer) return;
    document.addEventListener("pointermove", function (event) {
      var card = event.target.closest ? event.target.closest(SPOT_TARGETS) : null;
      if (!card) return;
      var rect = card.getBoundingClientRect();
      card.style.setProperty("--v2-mx", event.clientX - rect.left + "px");
      card.style.setProperty("--v2-my", event.clientY - rect.top + "px");
    }, { passive: true });
    Array.prototype.forEach.call(document.querySelectorAll(SPOT_TARGETS), function (card) {
      card.classList.add("v2-spot");
    });
  }

  /* ---------- 숫자 카운트업 ---------- */
  function countUp(node, duration) {
    var match = /^(\d+)(.*)$/.exec(node.textContent.trim());
    if (!match || reduce) return;
    var target = Number(match[1]);
    var suffix = match[2];
    if (!target) return;
    var start = null;
    node.style.fontVariantNumeric = "tabular-nums";
    function frame(now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      node.textContent = Math.round(target * eased) + suffix;
      if (t < 1) window.requestAnimationFrame(frame);
    }
    node.textContent = "0" + suffix;
    window.requestAnimationFrame(frame);
  }

  function counters() {
    Array.prototype.forEach.call(document.querySelectorAll(".cover__stats .stat__value"), function (node, i) {
      setTimeout(function () { countUp(node, 900); }, 150 + i * 80);
    });
  }

  /* ---------- 축하 파티클 ---------- */
  var COLORS = ["#2563eb", "#f59e0b", "#059669", "#a855f7", "#ec4899", "#38bdf8"];
  function celebrate(origin, amount) {
    if (reduce) return;
    var rect = origin && origin.getBoundingClientRect ? origin.getBoundingClientRect() : null;
    var x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    var y = rect ? rect.top + Math.min(rect.height / 2, 80) : window.innerHeight / 3;
    x = Math.min(window.innerWidth - 20, Math.max(20, x));
    y = Math.min(window.innerHeight - 20, Math.max(20, y));
    var layer = D.el("div", { class: "v2-confetti", "aria-hidden": "true" });
    layer.style.left = x + "px";
    layer.style.top = y + "px";
    var count = amount || 22;
    for (var i = 0; i < count; i++) {
      var piece = D.el("i");
      var angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      var distance = 60 + Math.random() * (amount ? 220 : 110);
      piece.style.setProperty("--dx", Math.cos(angle) * distance + "px");
      piece.style.setProperty("--dy", Math.sin(angle) * distance - 40 + "px");
      piece.style.setProperty("--rot", Math.round(Math.random() * 720 - 360) + "deg");
      piece.style.background = COLORS[i % COLORS.length];
      piece.style.animationDelay = Math.round(Math.random() * 90) + "ms";
      if (i % 3 === 0) piece.style.borderRadius = "50%";
      layer.appendChild(piece);
    }
    document.body.appendChild(layer);
    setTimeout(function () { if (layer.parentNode) layer.parentNode.removeChild(layer); }, 1600);
  }

  /* 진도 기록 함수를 감싸 "처음 통과한 순간"과 "합격"에만 축하한다 */
  function hookProgress() {
    var progress = D.progress;
    if (!progress || progress._fx) return;
    progress._fx = true;
    var markDrill = progress.markDrill;
    progress.markDrill = function (questionId, passed) {
      var before = progress.isDrillDone(questionId);
      var result = markDrill.apply(progress, arguments);
      if (passed && !before) celebrate(document.activeElement && document.activeElement.closest ? document.activeElement.closest(".v2-cell") : null);
      return result;
    };
    var recordMock = progress.recordMock;
    progress.recordMock = function (mockId, score) {
      var result = recordMock.apply(progress, arguments);
      if (score >= 80) {
        setTimeout(function () { celebrate(document.querySelector(".v2-cbt"), 60); }, 250);
      }
      return result;
    };
  }

  /* ---------- 테마 전환: 버튼에서 퍼지는 원형 리빌 ---------- */
  function hookTheme() {
    var theme = D.theme;
    if (!theme || theme._fx || reduce || !document.startViewTransition) return;
    theme._fx = true;
    var set = theme.set;
    theme.set = function (value) {
      var btn = document.querySelector(".v2-theme-toggle");
      var rect = btn ? btn.getBoundingClientRect() : null;
      root.style.setProperty("--v2-vt-x", (rect ? rect.left + rect.width / 2 : window.innerWidth - 40) + "px");
      root.style.setProperty("--v2-vt-y", (rect ? rect.top + rect.height / 2 : 24) + "px");
      root.classList.add("v2-theme-switching");
      var self = this;
      var args = arguments;
      var transition = document.startViewTransition(function () { set.apply(self, args); });
      transition.finished.then(function () { root.classList.remove("v2-theme-switching"); }, function () {
        root.classList.remove("v2-theme-switching");
      });
    };
  }

  hookProgress();
  hookTheme();

  D.ready(function () {
    root.classList.add("v2-motion");
    progressBar();
    reveal();
    scrollSpy();
    spotlight();
    counters();
  });

  D.fx = { celebrate: celebrate, reducedMotion: reduce };
})();
