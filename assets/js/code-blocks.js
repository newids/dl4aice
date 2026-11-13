/* dl4aice v2 — code-blocks.js
 * 본문(설명 파트)의 정적 코드 블록을 에디터 창처럼 꾸민다.
 *   - 파이썬 블록: 에디터식 구문 색상 + 줄 번호 + 창 머리(언어 표시, 복사 버튼)
 *   - 언어 표시가 없는 블록(실행 출력·텍스트): 터미널 출력 창 모양, 색상·줄 번호 없음
 * 원본 <pre><code> 텍스트는 그대로 두고 표시만 바꾼다. 자바스크립트가 꺼져 있으면 기존 모양 그대로 보인다.
 */
(function () {
  "use strict";

  var D = window.DL4AICE;
  if (!D) return;
  var el = D.el;

  var WIDGET_SCOPE = "[data-v2-arch],[data-v2-drills],[data-v2-cbt],.v2-ob,[role=dialog]";

  /* 하이라이트된 HTML 을 줄 단위로 나눈다. 여러 줄에 걸친 span(삼중 따옴표 문자열 등)은 줄마다 닫고 다시 연다. */
  function splitLines(html) {
    var lines = [];
    var current = "";
    var open = [];
    var re = /<span class="[^"]*">|<\/span>|\n/g;
    var last = 0;
    var m;
    while ((m = re.exec(html))) {
      current += html.slice(last, m.index);
      last = re.lastIndex;
      if (m[0] === "\n") {
        lines.push(current + open.map(function () { return "</span>"; }).join(""));
        current = open.join("");
      } else if (m[0] === "</span>") {
        open.pop();
        current += m[0];
      } else {
        open.push(m[0]);
        current += m[0];
      }
    }
    current += html.slice(last);
    lines.push(current);
    return lines;
  }

  function copyButton(getText) {
    var btn = el("button", { class: "v2-cb__copy", type: "button", "aria-label": "코드 복사" }, [
      el("span", { class: "v2-cb__copy-label", text: "복사" })
    ]);
    var timer = null;
    btn.addEventListener("click", function () {
      D.copy(getText()).then(function (ok) {
        btn.classList.toggle("is-done", !!ok);
        btn.firstChild.textContent = ok ? "복사됨" : "복사 실패";
        clearTimeout(timer);
        timer = setTimeout(function () {
          btn.classList.remove("is-done");
          btn.firstChild.textContent = "복사";
        }, 1600);
      });
    });
    return btn;
  }

  function enhance(pre) {
    if (pre.getAttribute("data-v2-cb") || pre.closest(WIDGET_SCOPE)) return;
    var code = pre.querySelector(":scope > code");
    if (!code) return;
    pre.setAttribute("data-v2-cb", "1");

    var source = code.textContent.replace(/\n+$/, "");
    var isPython = /\blanguage-python\b/.test(code.className);
    var plainCheat = pre.classList.contains("v2-code");

    /* 치트시트의 압축 코드 카드: 창 장식 없이 색만 입힌다 */
    if (plainCheat) {
      code.innerHTML = D.highlight(source);
      return;
    }

    var lines = isPython ? splitLines(D.highlight(source)) : source.split("\n").map(D.escapeHtml);
    code.innerHTML = lines
      .map(function (line) { return '<span class="v2-cb__line">' + (line || " ") + "</span>"; })
      .join("\n");

    var frame = el("div", { class: "v2-cb" + (isPython ? " v2-cb--code" : " v2-cb--output") });
    var head = el("div", { class: "v2-cb__head" }, [
      el("span", { class: "v2-cb__dots", "aria-hidden": "true" }, [el("i"), el("i"), el("i")]),
      el("span", { class: "v2-cb__lang", text: isPython ? "Python" : "출력" }),
      copyButton(function () { return source; })
    ]);
    pre.parentNode.insertBefore(frame, pre);
    frame.appendChild(head);
    frame.appendChild(pre);
    pre.classList.add("v2-cb__pre");
    if (lines.length >= 100) frame.classList.add("v2-cb--wide-gutter");
  }

  function run(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll(".page-body pre"), enhance);
  }

  D.ready(function () { run(document); });
  D.codeBlocks = { enhance: run, _splitLines: splitLines };
})();
