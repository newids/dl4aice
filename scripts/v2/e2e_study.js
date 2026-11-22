#!/usr/bin/env node
/* 스터디 발표 슬라이드(study/html/*.html) 브라우저 검사.
 *
 * 사용법: node scripts/v2/e2e_study.js [스크린샷 디렉터리]
 *   회차마다: 콘솔 에러 0, 방향키로 끝까지 넘어가는지, 장수 표시와 주소(#n) 갱신,
 *   모든 슬라이드가 한 장 안에 들어가는지(가로·세로 넘침 없음), 목록 열기/이동, 타이머 시작.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..", "..");
const DIR = path.join(ROOT, "study", "html");
const SHOTS = process.argv[2] || "";
const decks = fs.readdirSync(DIR).filter((f) => /^\d\d-.*\.html$/.test(f)).sort();

let failures = 0;
function bad(message) {
  failures++;
  console.log("FAIL " + message);
}

(async () => {
  const browser = await chromium.launch();
  for (const viewport of [{ width: 1280, height: 720 }, { width: 1920, height: 1080 }]) {
    const ctx = await browser.newContext({ viewport });
    for (const file of decks) {
      const page = await ctx.newPage();
      const errs = [];
      page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
      page.on("pageerror", (e) => errs.push("PAGEERROR " + e.message));
      await page.goto("file://" + path.join(DIR, file));
      const count = await page.locator(".slide").count();
      const md = fs.readFileSync(path.join(ROOT, "study", file.replace(".html", ".md")), "utf8");
      if (count < 18) bad(file + " 슬라이드 " + count + "장");
      let overflow = [];
      for (let i = 0; i < count; i++) {
        const state = await page.evaluate(() => {
          const cur = document.querySelector(".slide.is-current .slide__inner");
          return {
            shown: document.querySelectorAll(".slide.is-current").length,
            over: cur.scrollHeight - cur.clientHeight,
            wide: Array.from(cur.querySelectorAll("table, .figure")).some((el) => el.scrollWidth > cur.clientWidth + 2),
            label: document.querySelector(".bar__count").textContent,
            hash: location.hash,
            pageWide: document.documentElement.scrollWidth - window.innerWidth
          };
        });
        if (state.shown !== 1) bad(file + " " + (i + 1) + "번째: 보이는 슬라이드 " + state.shown + "장");
        if (state.label !== i + 1 + " / " + count) bad(file + " 장수 표시 " + state.label);
        if (state.hash !== "#" + (i + 1)) bad(file + " 주소 " + state.hash + " (기대 #" + (i + 1) + ")");
        if (state.over > 2 || state.wide) overflow.push(i + 1);
        if (state.pageWide > 0) bad(file + " " + (i + 1) + "번째: 화면 가로 넘침");
        if (i < count - 1) await page.keyboard.press("ArrowRight");
      }
      if (overflow.length) bad(file + " @" + viewport.width + " 한 장에 다 들어가지 않는 슬라이드: " + overflow.join(", "));
      const timer = await page.locator(".bar__time").innerText();
      if (/^00:00/.test(timer) && count > 1) {
        await page.waitForTimeout(1100);
        if (/^00:00/.test(await page.locator(".bar__time").innerText())) bad(file + " 타이머가 시작되지 않음");
      }
      /* 목록에서 3번째로 이동 */
      await page.keyboard.press("o");
      if (!(await page.locator(".ov.is-open").count())) bad(file + " 목록이 열리지 않음");
      await page.locator(".ov__item").nth(2).click();
      if ((await page.locator(".bar__count").innerText()) !== "3 / " + count) bad(file + " 목록에서 이동 실패");
      await page.keyboard.press("Home");
      if ((await page.locator(".bar__count").innerText()) !== "1 / " + count) bad(file + " Home 키 동작 안 함");
      const python = (md.match(/```python/g) || []).length;
      const colored = await page.locator("pre code.language-python .tok-kw, pre code.language-python .tok-fn, pre code.language-python .tok-str").count();
      if (python > 0 && colored === 0) bad(file + " 코드에 색이 입혀지지 않음");
      if (errs.length) bad(file + " 콘솔 에러: " + errs.join(" | "));
      if (SHOTS && viewport.width === 1280 && /05-ch05|09-mock01/.test(file)) {
        for (const n of [1, 3, 4, 8]) {
          await page.goto("file://" + path.join(DIR, file) + "#" + n);
          await page.reload();
          await page.waitForTimeout(150);
          await page.screenshot({ path: path.join(SHOTS, file.replace(".html", "") + "-" + n + ".png") });
        }
      }
      await page.close();
    }
    await ctx.close();
    console.log("  " + viewport.width + "x" + viewport.height + " 검사 완료 (" + decks.length + "개 회차)");
  }
  const index = await (await browser.newContext()).newPage();
  await index.goto("file://" + path.join(DIR, "index.html"));
  if ((await index.locator(".index li a").count()) !== decks.length) bad("index.html 회차 링크 수 불일치");
  await browser.close();
  console.log(failures ? "스터디 슬라이드 검사: " + failures + "건 실패" : "스터디 슬라이드 검사: ALL PASS");
  process.exit(failures ? 1 : 0);
})();
