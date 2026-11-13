/* dl4aice v2 — dashboard.js
 * 표지(index.html)의 전체 진도 대시보드.
 * 빌드가 심어 둔 JSON(<script type="application/json" data-v2-dashboard-data>)에서
 * 챕터별 실습 문항 id 와 모의고사 목록을 읽고, localStorage 진도와 합쳐 그린다.
 */
(function () {
  "use strict";

  var D = window.DL4AICE;
  if (!D) return;
  var el = D.el;

  function formatDate(ts) {
    if (!ts) return "";
    var d = new Date(ts);
    return d.getFullYear() + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + String(d.getDate()).padStart(2, "0");
  }

  function bar(percent, tone) {
    var fill = el("span", { class: "v2-meter__fill" + (tone ? " v2-meter__fill--" + tone : "") });
    fill.style.width = Math.max(0, Math.min(100, percent)) + "%";
    return el("span", { class: "v2-meter", role: "img", "aria-label": percent + "% 완료" }, fill);
  }

  function render(root, config) {
    var body = root.querySelector("[data-v2-dashboard-body]");
    if (!body) return;
    var progress = D.progress.read();
    var pass = config.pass_score || 80;

    var totalDone = 0;
    var totalAll = 0;
    var next = null;
    var rows = config.chapters.map(function (ch) {
      var stats = D.progress.chapterStats(ch.ids);
      totalDone += stats.done;
      totalAll += stats.total;
      if (!next && stats.total && stats.done < stats.total) next = ch;
      return el("li", { class: "v2-dash-row" }, [
        el("a", { class: "v2-dash-row__name", href: ch.href }, [
          el("span", { class: "v2-dash-row__label", text: ch.label }),
          el("span", { class: "v2-dash-row__title", text: ch.title })
        ]),
        bar(stats.percent, stats.percent === 100 ? "ok" : ""),
        el("span", { class: "v2-dash-row__count", text: stats.total ? stats.done + " / " + stats.total : "준비 중" })
      ]);
    });
    var overall = totalAll ? Math.round((totalDone / totalAll) * 100) : 0;

    var best = 0;
    var passed = 0;
    var mocks = config.mocks.map(function (mock) {
      var rec = progress.mocks[mock.id];
      var badge;
      if (!rec) badge = el("span", { class: "v2-badge", text: "미응시" });
      else if (rec.best >= pass) badge = el("span", { class: "v2-badge v2-badge--ok", text: "합격권" });
      else badge = el("span", { class: "v2-badge v2-badge--warn", text: "재도전" });
      if (rec) {
        best = Math.max(best, rec.best);
        if (rec.best >= pass) passed++;
      }
      return el("li", { class: "v2-dash-mock" }, [
        el("a", { class: "v2-dash-mock__link", href: mock.href }, [
          el("span", { class: "v2-dash-mock__label", text: mock.label }),
          el("span", { class: "v2-dash-mock__title", text: mock.title.replace(/^실전 모의고사 \d회\s*—\s*/, "") })
        ]),
        el("div", { class: "v2-dash-mock__score" }, [
          el("strong", { text: rec ? String(rec.best) : "–" }),
          el("span", { text: " / 100 최고점" })
        ]),
        bar(rec ? rec.best : 0, rec && rec.best >= pass ? "ok" : "warn"),
        el("div", { class: "v2-dash-mock__meta" }, [
          badge,
          el("span", { text: rec ? "응시 " + rec.attempts + "회 · 최근 " + rec.last + "점 · " + formatDate(rec.ts) : "합격 기준 " + pass + "점" })
        ])
      ]);
    });

    var started = totalDone > 0 || Object.keys(progress.mocks).length > 0;
    var summary = el("div", { class: "v2-dash-summary" }, [
      el("div", { class: "v2-dash-stat" }, [
        el("span", { class: "v2-dash-stat__value", text: overall + "%" }),
        el("span", { class: "v2-dash-stat__label", text: "실습 셀 진도 (" + totalDone + " / " + totalAll + ")" }),
        bar(overall, overall === 100 ? "ok" : "")
      ]),
      el("div", { class: "v2-dash-stat" }, [
        el("span", { class: "v2-dash-stat__value", text: started && best ? String(best) : "–" }),
        el("span", { class: "v2-dash-stat__label", text: "모의고사 최고 점수 (합격 " + pass + "점)" }),
        bar(best, best >= pass ? "ok" : "warn")
      ]),
      el("div", { class: "v2-dash-stat" }, [
        el("span", { class: "v2-dash-stat__value", text: passed + " / " + config.mocks.length }),
        el("span", { class: "v2-dash-stat__label", text: "합격권에 든 모의고사" }),
        next
          ? el("a", { class: "v2-btn v2-btn--primary v2-btn--sm", href: next.href, text: next.label + " 실습 이어하기" })
          : el("a", { class: "v2-btn v2-btn--primary v2-btn--sm", href: config.mocks[0] ? config.mocks[0].href : "#", text: "모의고사 풀기" })
      ])
    ]);

    var resetBtn = el("button", { class: "v2-btn v2-btn--ghost v2-btn--sm", type: "button", text: "학습 기록 초기화" });
    resetBtn.addEventListener("click", function () {
      if (resetBtn.getAttribute("data-armed") === "1") {
        D.progress.reset();
        D.toast("이 브라우저에 저장된 진도와 모의고사 점수를 지웠습니다.", { type: "info" });
        return;
      }
      resetBtn.setAttribute("data-armed", "1");
      resetBtn.textContent = "한 번 더 누르면 모두 지웁니다";
      setTimeout(function () {
        resetBtn.removeAttribute("data-armed");
        resetBtn.textContent = "학습 기록 초기화";
      }, 4000);
    });

    body.textContent = "";
    body.appendChild(summary);
    body.appendChild(
      el("div", { class: "v2-dash-grid" }, [
        el("div", { class: "v2-dash-panel" }, [
          el("h3", { class: "v2-dash-panel__title", text: "챕터별 실습 완료율" }),
          el("ul", { class: "v2-dash-rows" }, rows)
        ]),
        el("div", { class: "v2-dash-panel" }, [
          el("h3", { class: "v2-dash-panel__title", text: "CBT 모의고사" }),
          el("ul", { class: "v2-dash-mocks" }, mocks)
        ])
      ])
    );
    body.appendChild(
      el("p", { class: "v2-dash-foot" }, [
        el("span", { text: "기록은 이 브라우저(localStorage)에만 저장됩니다. " }),
        resetBtn
      ])
    );
  }

  D.ready(function () {
    var root = document.querySelector("[data-v2-dashboard]");
    if (root) {
      var blob = root.querySelector("[data-v2-dashboard-data]");
      var config = null;
      try {
        config = JSON.parse(blob.textContent);
      } catch (e) {
        config = null;
      }
      if (config) {
        var draw = function () { render(root, config); };
        draw();
        document.addEventListener("dl4aice:progress", draw);
        window.addEventListener("storage", draw);
        window.addEventListener("pageshow", draw);
      }
    }

    /* 표지의 "오픈북 검색" 카드 → 모달 열기 */
    Array.prototype.forEach.call(document.querySelectorAll("[data-v2-openbook]"), function (btn) {
      btn.addEventListener("click", function () {
        if (D.openbook && D.openbook.open) D.openbook.open();
      });
    });
  });
})();
