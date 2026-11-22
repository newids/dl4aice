#!/usr/bin/env python3
"""그룹 스터디 발표 자료(study/*.md)를 한 장씩 넘기는 HTML 슬라이드로 만든다.

    python3 scripts/v2/build_study_slides.py

- 입력: study/NN-*.md (Marp 호환 마크다운, `---` 로 슬라이드 구분)
- 출력: study/html/NN-*.html + study/html/index.html
- 파일 하나로 동작한다(스타일·스크립트·도해 SVG 를 모두 파일 안에 넣는다). 외부 자원 없음.
- 교재 빌드(scripts/build_ebook.py)가 이 디렉터리를 book/study/, docs/study/ 로 복사해 사이트에서도 열린다.
"""

from __future__ import annotations

import html
import re
import sys
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent.parent.parent
STUDY = ROOT / "study"
OUT = STUDY / "html"
CORE_JS = ROOT / "assets" / "js" / "dl4aice-core.js"
SITE = "https://newids.github.io/dl4aice/"

IMAGE = re.compile(r"!\[([^\]]*)\]\(([^)\s]+)\)")
MINUTES = re.compile(r"\((\d+)분\)\s*$")

CSS = r"""
:root {
  color-scheme: light;
  --bg: #eef1f6; --paper: #ffffff; --ink: #1a2332; --soft: #475569; --muted: #64748b;
  --line: #cbd5e1; --line-soft: #e2e8f0; --primary: #2563eb; --primary-soft: #dbeafe;
  --chip-bg: #eef2f7; --chip-fg: #0f2a5e; --code-bg: #0d1424; --code-fg: #d6deeb;
  --font: "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif;
  --mono: "SFMono-Regular", "JetBrains Mono", Menlo, Consolas, "D2Coding", monospace;
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --bg: #0a0f1a; --paper: #111827; --ink: #e6eaf2; --soft: #c3cddd; --muted: #9aa8bd;
  --line: #334155; --line-soft: #243044; --primary: #6ea8fe; --primary-soft: #1b2f4f;
  --chip-bg: #22304a; --chip-fg: #cfe0ff;
}
* { box-sizing: border-box; }
html, body { height: 100%; }
body {
  margin: 0; background: var(--bg); color: var(--ink); font-family: var(--font);
  word-break: keep-all; overflow-wrap: anywhere; overflow: hidden;
}
.deck { position: fixed; inset: 0 0 3.25rem 0; display: grid; place-items: center; padding: 1.2vmin; }
.slide {
  display: none; width: min(100%, calc((100vh - 3.25rem - 2.4vmin) * 16 / 9)); aspect-ratio: 16 / 9;
  background: var(--paper); border: 1px solid var(--line-soft); border-radius: 14px;
  box-shadow: 0 18px 50px -28px rgba(15, 23, 42, 0.45); overflow: hidden;
}
.slide.is-current { display: block; }
.slide__inner {
  --scale: 1; height: 100%; padding: 4.2% 5.4% 3.6%; overflow: auto;
  font-size: calc(clamp(13px, 1.72vw, 30px) * var(--scale)); line-height: 1.55;
}
.slide h1, .slide h2 { margin: 0 0 0.7em; line-height: 1.28; letter-spacing: -0.02em; }
.slide h1 { font-size: 2.1em; margin-top: 12%; }
.slide h2 { font-size: 1.42em; padding-bottom: 0.35em; border-bottom: 1px solid var(--line-soft); }
.slide h3 { font-size: 1.08em; margin: 0.9em 0 0.4em; }
.slide p { margin: 0 0 0.6em; }
.slide ul, .slide ol { margin: 0 0 0.6em; padding-left: 1.25em; }
.slide li { margin-bottom: 0.3em; }
.slide li > ul, .slide li > ol { margin-top: 0.3em; }
.slide a { color: var(--primary); }
.slide strong { font-weight: 700; }
.slide code {
  font-family: var(--mono); font-size: 0.86em; padding: 0.05em 0.32em; border-radius: 5px;
  color: var(--chip-fg); background: var(--chip-bg); font-variant-ligatures: none;
}
.slide pre {
  margin: 0 0 0.7em; padding: 0.75em 0.95em; border-radius: 10px; overflow-x: auto;
  background: var(--code-bg); color: var(--code-fg); border: 1px solid rgba(148, 163, 184, 0.16);
}
.slide pre code { padding: 0; background: none; color: inherit; font-size: 0.8em; line-height: 1.55; white-space: pre; }
.slide table { width: 100%; margin: 0 0 0.7em; border-collapse: collapse; font-size: 0.88em; }
.slide th, .slide td { padding: 0.42em 0.6em; text-align: left; vertical-align: top; border: 1px solid var(--line-soft); }
.slide thead th { background: var(--chip-bg); color: var(--chip-fg); font-weight: 700; }
.slide blockquote {
  margin: 0 0 0.7em; padding: 0.6em 0.9em; color: var(--soft); background: var(--chip-bg);
  border: 1px solid var(--line-soft); border-radius: 10px;
}
.slide blockquote > :last-child { margin-bottom: 0; }
.figure { margin: 0 0 0.6em; padding: 0.5em; background: #ffffff; border: 1px solid var(--line-soft); border-radius: 10px; text-align: center; }
.figure svg { display: block; width: auto; max-width: 100%; height: auto; max-height: calc(44vh * var(--fig, 1)); margin: 0 auto; }
.figure figcaption { margin-top: 0.3em; font-size: 0.72em; color: #64748b; }
.slide--title .slide__inner { display: flex; flex-direction: column; justify-content: center; }
.slide--title h1 { margin-top: 0; }
.slide--title ul { list-style: none; padding: 0; color: var(--soft); }

.tok-kw { color: #c792ea; } .tok-const { color: #82aaff; font-style: italic; } .tok-str { color: #c3e88d; }
.tok-num { color: #f78c6c; } .tok-com { color: #7c8aa5; font-style: italic; } .tok-fn { color: #82d2ff; }
.tok-builtin { color: #ffcb6b; } .tok-cls { color: #5eead4; } .tok-param { color: #f9a8d4; }
.tok-mod { color: #d6deeb; } .tok-dec { color: #ffcb6b; font-style: italic; } .tok-op { color: #89ddff; }
.tok-blank { color: #0f172a; background: #fbbf24; border-radius: 3px; padding: 0 0.15em; }

.bar {
  position: fixed; inset: auto 0 0 0; height: 3.25rem; display: flex; align-items: center; gap: 0.5rem;
  padding: 0 0.8rem; background: var(--paper); border-top: 1px solid var(--line-soft); font-size: 0.86rem;
}
.bar__title { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--soft); font-weight: 600; }
.bar__count, .bar__time { font-variant-numeric: tabular-nums; color: var(--muted); white-space: nowrap; }
.bar__time strong { color: var(--ink); }
.bar__time.is-over strong { color: #dc2626; }
.btn {
  min-width: 2.5rem; min-height: 2.5rem; padding: 0.3rem 0.7rem; font: inherit; font-weight: 700; color: var(--ink);
  background: var(--paper); border: 1px solid var(--line); border-radius: 8px; cursor: pointer; text-decoration: none;
  display: inline-flex; align-items: center; justify-content: center; white-space: nowrap;
}
.btn:hover { border-color: var(--primary); color: var(--primary); }
.btn:focus-visible, .ov__item:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.btn[disabled] { opacity: 0.4; cursor: default; }
.meter { position: fixed; inset: auto 0 3.25rem 0; height: 3px; background: var(--line-soft); }
.meter span { display: block; height: 100%; width: 0; background: var(--primary); transition: width 180ms ease-out; }

.ov { position: fixed; inset: 0; z-index: 10; display: none; padding: 1.2rem; overflow: auto; background: var(--bg); }
.ov.is-open { display: block; }
.ov__head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin: 0 0 1rem; }
.ov__head h2 { margin: 0; font-size: 1.1rem; }
.ov__grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); gap: 0.6rem; }
.ov__item {
  display: flex; gap: 0.6rem; width: 100%; min-height: 3.2rem; padding: 0.6rem 0.8rem; font: inherit; text-align: left; color: var(--ink);
  background: var(--paper); border: 1px solid var(--line-soft); border-radius: 10px; cursor: pointer;
}
.ov__item:hover { border-color: var(--primary); }
.ov__item[aria-current="true"] { border-color: var(--primary); background: var(--primary-soft); }
.ov__no { flex: none; width: 1.8rem; color: var(--muted); font-variant-numeric: tabular-nums; }
.help { margin: 1rem 0 0; font-size: 0.82rem; color: var(--muted); }
kbd { font-family: var(--mono); font-size: 0.9em; padding: 0.05em 0.4em; border: 1px solid var(--line); border-radius: 5px; background: var(--paper); }

.index { max-width: 54rem; margin: 0 auto; padding: 2.5rem 1.2rem 4rem; overflow: auto; height: 100%; }
.index h1 { font-size: 1.7rem; margin: 0 0 0.5rem; }
.index p { color: var(--soft); line-height: 1.7; }
.index ol { list-style: none; padding: 0; margin: 1.5rem 0; display: grid; gap: 0.6rem; }
.index li a {
  display: flex; gap: 1rem; align-items: baseline; padding: 0.9rem 1.1rem; color: var(--ink); text-decoration: none;
  background: var(--paper); border: 1px solid var(--line-soft); border-radius: 12px;
}
.index li a:hover { border-color: var(--primary); }
.index .no { flex: none; width: 3.6rem; font-weight: 700; color: var(--primary); }
.index .meta { margin-left: auto; font-size: 0.82rem; color: var(--muted); white-space: nowrap; }

@media (max-width: 640px) {
  .bar__title { display: none; }
  .slide { width: 100%; aspect-ratio: auto; height: 100%; }
  .slide__inner { font-size: calc(15px * var(--scale)); }
}
@media print {
  @page { size: 297mm 167mm; margin: 0; }
  html, body { height: auto; overflow: visible; background: #fff; }
  .bar, .meter, .ov { display: none !important; }
  .deck { position: static; display: block; padding: 0; }
  .slide { display: block !important; width: 297mm; height: 167mm; aspect-ratio: auto; border: 0; border-radius: 0; box-shadow: none; break-after: page; }
  .slide__inner { font-size: 15pt; overflow: hidden; }
}
"""

JS = r"""
(function () {
  "use strict";
  var D = window.DL4AICE || {};
  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var count = slides.length;
  var current = 0;
  var bar = document.querySelector(".bar");
  var countEl = bar.querySelector(".bar__count");
  var titleEl = bar.querySelector(".bar__title");
  var timeEl = bar.querySelector(".bar__time");
  var meter = document.querySelector(".meter span");
  var prev = bar.querySelector("[data-prev]");
  var next = bar.querySelector("[data-next]");
  var overview = document.querySelector(".ov");
  var planned = Number(document.body.getAttribute("data-minutes")) || 35;

  /* 파이썬 코드 색 입히기 (교재와 같은 배색) */
  if (D.highlight) {
    Array.prototype.forEach.call(document.querySelectorAll("pre > code.language-python"), function (code) {
      code.innerHTML = D.highlight(code.textContent).replace(/class="v2-tok-/g, 'class="tok-');
    });
  }

  /* 내용이 넘치면 글자를 조금 줄여 한 장에 맞춘다 */
  function fit(slide) {
    var inner = slide.querySelector(".slide__inner");
    var scale = 1;
    var fig = 1;
    inner.style.setProperty("--scale", "1");
    inner.style.setProperty("--fig", "1");
    /* 먼저 도해를 줄이고(글자는 읽기 좋은 크기로 유지), 그래도 넘치면 글자를 줄인다 */
    while (inner.scrollHeight > inner.clientHeight + 2 && (fig > 0.5 || scale > 0.56)) {
      if (fig > 0.5 && (fig > scale - 0.1 || scale <= 0.56)) fig -= 0.05;
      else scale -= 0.03;
      inner.style.setProperty("--fig", fig.toFixed(2));
      inner.style.setProperty("--scale", scale.toFixed(2));
    }
  }

  function show(index, replace) {
    current = Math.max(0, Math.min(count - 1, index));
    slides.forEach(function (s, i) { s.classList.toggle("is-current", i === current); });
    fit(slides[current]);
    countEl.textContent = current + 1 + " / " + count;
    titleEl.textContent = slides[current].getAttribute("data-title");
    meter.style.width = ((current + 1) / count) * 100 + "%";
    prev.disabled = current === 0;
    next.disabled = current === count - 1;
    Array.prototype.forEach.call(overview.querySelectorAll(".ov__item"), function (item, i) {
      item.setAttribute("aria-current", i === current ? "true" : "false");
    });
    var hash = "#" + (current + 1);
    if (replace) history.replaceState(null, "", hash); else if (location.hash !== hash) history.pushState(null, "", hash);
  }

  function fromHash() {
    var n = parseInt(location.hash.slice(1), 10);
    return isFinite(n) ? n - 1 : 0;
  }

  /* 발표 타이머: 처음 넘길 때 시작, 계획 시간을 넘기면 색으로 알린다 */
  var startedAt = null;
  var timer = null;
  function tick() {
    var sec = Math.floor((Date.now() - startedAt) / 1000);
    var mm = String(Math.floor(sec / 60)).padStart(2, "0");
    var ss = String(sec % 60).padStart(2, "0");
    timeEl.innerHTML = "<strong>" + mm + ":" + ss + "</strong> / " + planned + "분";
    timeEl.classList.toggle("is-over", sec > planned * 60);
  }
  function startTimer() {
    if (startedAt) return;
    startedAt = Date.now();
    timer = setInterval(tick, 1000);
    tick();
  }
  function resetTimer() {
    clearInterval(timer);
    startedAt = null;
    timeEl.innerHTML = "<strong>00:00</strong> / " + planned + "분";
    timeEl.classList.remove("is-over");
  }

  function go(delta) { startTimer(); show(current + delta); }
  function toggleOverview(open) {
    var willOpen = open === undefined ? !overview.classList.contains("is-open") : open;
    overview.classList.toggle("is-open", willOpen);
    if (willOpen) { var cur = overview.querySelector('[aria-current="true"]'); if (cur) cur.focus(); }
  }
  function toggleTheme() {
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    document.documentElement.setAttribute("data-theme", dark ? "light" : "dark");
    try { localStorage.setItem("dl4aice.v2.theme", JSON.stringify(dark ? "light" : "dark")); } catch (e) { /* 저장 불가 */ }
  }
  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
  }

  prev.addEventListener("click", function () { go(-1); });
  next.addEventListener("click", function () { go(1); });
  bar.querySelector("[data-overview]").addEventListener("click", function () { toggleOverview(); });
  bar.querySelector("[data-theme-toggle]").addEventListener("click", toggleTheme);
  bar.querySelector("[data-full]").addEventListener("click", toggleFullscreen);
  timeEl.addEventListener("dblclick", resetTimer);
  overview.querySelector("[data-close]").addEventListener("click", function () { toggleOverview(false); });
  Array.prototype.forEach.call(overview.querySelectorAll(".ov__item"), function (item, i) {
    item.addEventListener("click", function () { show(i); toggleOverview(false); });
  });

  document.addEventListener("keydown", function (event) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    var key = event.key;
    if (overview.classList.contains("is-open")) {
      if (key === "Escape" || key === "o" || key === "O") { toggleOverview(false); event.preventDefault(); }
      return;
    }
    if (key === "ArrowRight" || key === "PageDown" || key === " " || key === "Enter") { go(1); event.preventDefault(); }
    else if (key === "ArrowLeft" || key === "PageUp" || key === "Backspace") { go(-1); event.preventDefault(); }
    else if (key === "Home") { show(0); event.preventDefault(); }
    else if (key === "End") { show(count - 1); event.preventDefault(); }
    else if (key === "o" || key === "O") { toggleOverview(true); }
    else if (key === "f" || key === "F") { toggleFullscreen(); }
    else if (key === "t" || key === "T") { toggleTheme(); }
    else if (key === "r" || key === "R") { resetTimer(); }
  });

  /* 터치: 좌우로 밀어 넘기기 */
  var touchX = null;
  document.addEventListener("touchstart", function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
  document.addEventListener("touchend", function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
  }, { passive: true });

  window.addEventListener("hashchange", function () { show(fromHash(), true); });
  window.addEventListener("resize", function () { fit(slides[current]); });
  resetTimer();
  show(fromHash(), true);
})();
"""

THEME_BOOT = (
    "<script>try{if(JSON.parse(localStorage.getItem('dl4aice.v2.theme'))==='dark')"
    "document.documentElement.setAttribute('data-theme','dark')}catch(e){}</script>"
)


def split_slides(text: str) -> list[str]:
    body = re.sub(r"(?s)\A---\n.*?\n---\n", "", text, count=1)
    slides, current, in_fence = [], [], False
    for line in body.split("\n"):
        if line.strip().startswith("```"):
            in_fence = not in_fence
        if line.strip() == "---" and not in_fence:
            slides.append("\n".join(current))
            current = []
        else:
            current.append(line)
    slides.append("\n".join(current))
    return [s.strip("\n") for s in slides if s.strip()]


def inline_svg(path: Path) -> str:
    svg = path.read_text(encoding="utf-8")
    svg = re.sub(r"(?s)^\s*<\?xml.*?\?>\s*", "", svg)
    svg = re.sub(r"(?s)^\s*<!DOCTYPE[^>]*>\s*", "", svg).strip()
    return re.sub(r"(?s)<!--.*?-->", "", svg)


def render_slide(md_text: str, source: Path) -> tuple[str, str, bool]:
    figures: list[str] = []

    def take(match: re.Match[str]) -> str:
        alt, target = match.group(1), match.group(2)
        path = (source.parent / target).resolve()
        figures.append(
            f'<figure class="figure">{inline_svg(path)}<figcaption>{html.escape(alt)}</figcaption></figure>'
        )
        return f"\n\nFIGURE{len(figures) - 1}TOKEN\n\n"

    text = IMAGE.sub(take, md_text)
    # 맨 주소도 눌러서 열 수 있게 한다(마크다운 링크·코드 안의 주소는 그대로 둔다)
    text = "\n".join(
        line if line.lstrip().startswith(("```", "    ")) else re.sub(r"(?<!\]\()(?<![<`\"])(https?://[^\s)<>`]+)", r"<\1>", line)
        for line in text.split("\n")
    )
    body = markdown.markdown(text, extensions=["fenced_code", "tables", "sane_lists"], output_format="html5")
    for i, fig in enumerate(figures):
        body = body.replace(f"<p>FIGURE{i}TOKEN</p>", fig)
    body = re.sub(r'<a href="(https?://[^"]+)"', r'<a target="_blank" rel="noopener" href="\1"', body)
    heading = re.search(r"<h([12])>(.*?)</h\1>", body, re.S)
    title = re.sub(r"<[^>]+>", "", heading.group(2)).strip() if heading else ""
    return body, title, bool(heading and heading.group(1) == "1")


def plan_minutes(slides: list[str]) -> int:
    plan = next((s for s in slides if re.search(r"^##\s+.*진행 순서", s, re.M)), "")
    rows = [r for r in plan.split("\n") if r.strip().startswith("|") and "질의응답" not in r]
    return sum(int(m.group(1)) for r in rows for m in [re.search(r"(\d+)\s*분", r)] if m)


def build_deck(source: Path, core_js: str, order: list[tuple[str, str]]) -> tuple[str, int, int]:
    raw = split_slides(source.read_text(encoding="utf-8"))
    rendered = [render_slide(s, source) for s in raw]
    deck_title = rendered[0][1]
    minutes = plan_minutes(raw) or 35
    sections = "\n".join(
        f'<section class="slide{" slide--title" if is_title else ""}" data-title="{html.escape(title)}" '
        f'aria-label="{i} / {len(rendered)}"><div class="slide__inner">{body}</div></section>'
        for i, (body, title, is_title) in enumerate(rendered, start=1)
    )
    items = "\n".join(
        f'<li><button class="ov__item" type="button"><span class="ov__no">{i}</span>'
        f"<span>{html.escape(title)}</span></button></li>"
        for i, (_, title, _) in enumerate(rendered, start=1)
    )
    names = [name for name, _ in order]
    at = names.index(source.stem)
    nav_prev = f'<a class="btn" href="{names[at - 1]}.html" title="이전 회차">이전 회차</a>' if at else ""
    nav_next = f'<a class="btn" href="{names[at + 1]}.html" title="다음 회차">다음 회차</a>' if at + 1 < len(names) else ""
    page = f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{html.escape(deck_title)} — 스터디 발표 자료</title>
<style>{CSS}</style>
{THEME_BOOT}
</head>
<body data-minutes="{minutes}">
<main class="deck" aria-live="polite">
{sections}
</main>
<div class="meter" aria-hidden="true"><span></span></div>
<nav class="bar" aria-label="슬라이드 이동">
<a class="btn" href="index.html" title="회차 목록">회차</a>
<button class="btn" type="button" data-overview title="슬라이드 목록 (O)">목록</button>
<span class="bar__title"></span>
<span class="bar__time" title="발표 타이머 — 두 번 누르면 0으로 (R)"></span>
<button class="btn" type="button" data-theme-toggle title="밝게/어둡게 (T)">명암</button>
<button class="btn" type="button" data-full title="전체 화면 (F)">전체</button>
<button class="btn" type="button" data-prev aria-label="이전 슬라이드">&#8592;</button>
<span class="bar__count"></span>
<button class="btn" type="button" data-next aria-label="다음 슬라이드">&#8594;</button>
</nav>
<div class="ov" role="dialog" aria-label="슬라이드 목록">
<div class="ov__head"><h2>{html.escape(deck_title)}</h2><span>{nav_prev} {nav_next} <button class="btn" type="button" data-close>닫기</button></span></div>
<ol class="ov__grid">
{items}
</ol>
<p class="help"><kbd>→</kbd> <kbd>Space</kbd> 다음 · <kbd>←</kbd> 이전 · <kbd>Home</kbd> <kbd>End</kbd> 처음/끝 · <kbd>O</kbd> 목록 · <kbd>F</kbd> 전체 화면 · <kbd>T</kbd> 명암 · <kbd>R</kbd> 타이머 초기화 · 인쇄하면 한 장에 한 슬라이드씩 PDF로 저장됩니다.</p>
</div>
<script>{core_js}</script>
<script>{JS}</script>
</body>
</html>
"""
    return page, len(rendered), minutes


def build_index(rows: list[tuple[str, str, int, int]]) -> str:
    items = "\n".join(
        f'<li><a href="{name}.html"><span class="no">{int(name[:2])}회차</span>'
        f"<span>{html.escape(title.split('—', 1)[-1].strip())}</span>"
        f'<span class="meta">{count}장 · 발표 {minutes}분 + 질의응답 20분</span></a></li>'
        for name, title, count, minutes in rows
    )
    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>그룹 스터디 발표 자료 — AICE Associate 딥러닝 실전 교본</title>
<style>{CSS}
body {{ overflow: auto; }}</style>
{THEME_BOOT}
</head>
<body>
<main class="index">
<h1>그룹 스터디 발표 자료</h1>
<p>회차를 고르면 한 장씩 넘기는 슬라이드가 열립니다. 방향키나 스페이스로 넘기고, <kbd>O</kbd>로 목록, <kbd>F</kbd>로 전체 화면, <kbd>T</kbd>로 밝기를 바꿉니다. 아래쪽 타이머는 처음 넘길 때 시작합니다.</p>
<ol>
{items}
</ol>
<p><a href="{SITE}">교재 사이트로 가기</a></p>
<p>이 자료와 교재는 Claude Code가 제작했으며, 전문가 검수를 거치지 않은 비공인 학습 자료입니다. 문항 수와 배점, 오픈북 정책은 회차마다 달라질 수 있으니 응시 전에 KT AICE 공식 공지를 확인하십시오.</p>
</main>
</body>
</html>
"""


def main() -> int:
    sources = sorted(p for p in STUDY.glob("[0-9][0-9]-*.md"))
    if not sources:
        print("study/*.md 가 없습니다")
        return 1
    core_js = CORE_JS.read_text(encoding="utf-8").replace("</script", "<\\/script")
    OUT.mkdir(parents=True, exist_ok=True)
    order = [(p.stem, "") for p in sources]
    rows = []
    for source in sources:
        page, count, minutes = build_deck(source, core_js, order)
        (OUT / f"{source.stem}.html").write_text(page, encoding="utf-8")
        title = re.search(r"^#\s+(.+)$", source.read_text(encoding="utf-8"), re.M).group(1)
        rows.append((source.stem, title, count, minutes))
    (OUT / "index.html").write_text(build_index(rows), encoding="utf-8")
    print(f"슬라이드 HTML 생성: {len(rows)}개 회차 + index.html → {OUT.relative_to(ROOT)}/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
