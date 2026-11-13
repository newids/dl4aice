#!/usr/bin/env node
/* dl4aice v2 — 브라우저 통합 검증 (Playwright/Chromium).
 *
 * 사용법: node scripts/v2/e2e_browser.js [기준 URL] [스크린샷 디렉터리]
 *   기준 URL 기본값: file://<repo>/book/   (file:// 로도 전 기능이 동작해야 한다)
 *
 * 검사 항목
 *   1) 전 페이지 × 1280px/375px: 콘솔 에러 0, 가로 스크롤 0, 위젯 마운트, 오픈북 버튼·테마 토글
 *   2) 실습 셀: 42문항에 모범 답안(큰따옴표 변형)을 입력해 Shift+Enter → 전부 통과, 진도 저장
 *   3) CBT: 모의고사 3회분에 모범 답안 입력 → 채점 결과·합격 배지·기록 저장
 *   4) 표지 대시보드 진도 반영, 오픈북 Ctrl+K + 초성 검색
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..", "..");
const BASE = process.argv[2] || "file://" + path.join(ROOT, "book") + "/";
const SHOTS = process.argv[3] || "";
const PAGES = ["index", "ch01", "ch02", "ch03", "ch04", "ch05", "ch06", "ch07", "ch08", "mock01", "mock02", "mock03", "cheatsheet", "appendix"];
const ARCH_PAGES = ["ch04", "ch05", "ch07", "ch08"];

const drills = JSON.parse(fs.readFileSync(path.join(ROOT, "assets/data/chapter_drills.json"), "utf8")).items;
const mocks = JSON.parse(fs.readFileSync(path.join(ROOT, "assets/data/mock_exams_14q.json"), "utf8")).exams;

let failures = 0;
function bad(message) {
  failures++;
  console.log("FAIL " + message);
}

function watch(page, sink) {
  page.on("console", (m) => { if (m.type() === "error") sink.push(m.text()); });
  page.on("pageerror", (e) => sink.push("PAGEERROR " + e.message));
}

async function shot(page, name, opts) {
  if (SHOTS) await page.screenshot(Object.assign({ path: path.join(SHOTS, name) }, opts || {}));
}

(async () => {
  const browser = await chromium.launch();

  /* 1) 전 페이지 정적 점검 */
  for (const width of [1280, 375]) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 } });
    for (const name of PAGES) {
      const page = await ctx.newPage();
      const errs = [];
      watch(page, errs);
      await page.goto(BASE + name + ".html");
      await page.waitForTimeout(350);
      const info = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        figures: document.querySelectorAll("figure.diagram svg").length,
        arch: Array.from(document.querySelectorAll("[data-v2-arch]")).map((e) => e.querySelectorAll("[role=tab]").length),
        cells: document.querySelectorAll("[data-v2-drills] .v2-cell").length,
        cbt: document.querySelector("[data-v2-cbt]") ? document.querySelector("[data-v2-cbt]").children.length : -1,
        openbook: !!document.querySelector('[class*="v2-ob"]'),
        toggle: !!document.querySelector(".v2-theme-toggle")
      }));
      if (errs.length) bad(`${name}@${width} 콘솔 에러: ${errs.join(" | ")}`);
      if (info.overflow > 0) bad(`${name}@${width} 가로 넘침 ${info.overflow}px`);
      if (!info.openbook) bad(`${name}@${width} 오픈북 버튼 없음`);
      if (!info.toggle) bad(`${name}@${width} 테마 토글 없음`);
      if (/^ch/.test(name)) {
        const want = drills.filter((d) => "ch0" + d.chapter === name).length;
        if (info.cells !== want) bad(`${name}@${width} 실습 셀 ${info.cells}/${want}`);
        if (ARCH_PAGES.includes(name) && !(info.arch.length === 1 && info.arch[0] >= 6)) {
          bad(`${name}@${width} 유형×API 위젯 미마운트 ${JSON.stringify(info.arch)}`);
        }
      }
      if (/^mock/.test(name) && info.cbt < 1) bad(`${name}@${width} CBT 미마운트`);
      if (width === 1280) {
        console.log(`  ${name.padEnd(10)} 도해 ${info.figures} · 실습 셀 ${info.cells} · arch ${info.arch.length} · cbt ${info.cbt > 0 ? "O" : "-"}`);
      }
      await page.close();
    }
    await ctx.close();
  }

  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const errs = [];

  /* 2) 실습 셀 */
  for (let ch = 1; ch <= 8; ch++) {
    const page = await ctx.newPage();
    watch(page, errs);
    await page.goto(BASE + `ch0${ch}.html`);
    await page.waitForSelector("[data-v2-drills] .v2-cell");
    const items = drills.filter((d) => d.chapter === ch);
    const areas = await page.$$("[data-v2-drills] .v2-cell textarea");
    for (let i = 0; i < items.length; i++) {
      await areas[i].focus();
      if (i === 0) {
        await page.keyboard.press("Shift+Enter"); /* 빈칸 그대로 → 오답 처리 경로 */
        await page.waitForTimeout(60);
        const ok = await page.evaluate((id) => {
          const p = JSON.parse(localStorage.getItem("dl4aice.v2.progress") || "{}");
          return !!(p.drills && p.drills[id] && p.drills[id].ok);
        }, items[i].question_id);
        if (ok) bad(`${items[i].question_id} 빈칸 상태가 정답 처리됨`);
      }
      await areas[i].fill(items[i].answer_code.replace(/'/g, '"'));
      await areas[i].focus();
      await page.keyboard.press("Shift+Enter");
      await page.waitForTimeout(50);
    }
    const state = await page.evaluate(() => JSON.parse(localStorage.getItem("dl4aice.v2.progress")).drills);
    items.forEach((item) => {
      if (!(state[item.question_id] && state[item.question_id].ok)) bad(`${item.question_id} 모범 답안이 브라우저에서 통과하지 못함`);
    });
    if (ch === 4) {
      await page.locator("[data-v2-drills]").scrollIntoViewIfNeeded();
      await shot(page, "ch04-drills.png");
    }
    await page.close();
  }

  /* 3) CBT — mock03 은 14번을 비워 88점(합격) 경계도 확인 */
  for (const exam of mocks) {
    const page = await ctx.newPage();
    watch(page, errs);
    await page.goto(BASE + exam.id + ".html");
    await page.waitForTimeout(300);
    if (exam.id === "mock01") await shot(page, "mock01-intro.png");
    await page.getByRole("button", { name: /시험 시작/ }).click();
    await page.waitForSelector(".v2-cbt textarea");
    const skip = exam.id === "mock03" ? 14 : exam.id === "mock02" ? 11 : 0;
    for (const q of exam.questions) {
      if (q.no === skip) continue;
      await page.locator(`.v2-cbt button[aria-label^="${q.no}번"]`).first().click({ force: true });
      await page.waitForTimeout(40);
      const area = page.locator(".v2-cbt textarea").first();
      await area.fill(q.answer_code);
      await area.blur();
      await page.waitForTimeout(40);
    }
    await page.waitForTimeout(500);
    if (exam.id === "mock01") await shot(page, "mock01-exam.png");
    await page.getByRole("button", { name: /시험 종료 및 채점/ }).first().click();
    await page.waitForTimeout(200);
    await page.locator("[role=dialog]").getByRole("button", { name: /채점|종료|제출/ }).last().click();
    await page.waitForTimeout(500);
    const rec = await page.evaluate((id) => JSON.parse(localStorage.getItem("dl4aice.v2.progress")).mocks[id], exam.id);
    const lost = skip ? exam.questions.find((q) => q.no === skip).points : 0;
    const want = 100 - lost;
    const text = await page.locator(".v2-cbt").innerText();
    const passBadge = /(^|[^불])합격/.test(text) && !/불합격/.test(text.split("\n").slice(0, 12).join("\n"));
    console.log(`  ${exam.id} 채점 ${rec ? rec.last : "?"}점 (기대 ${want}) · ${passBadge ? "합격" : "불합격"} 표시`);
    if (!rec || rec.last !== want) bad(`${exam.id} 점수 ${rec && rec.last} != ${want}`);
    if (want >= 80 && !passBadge) bad(`${exam.id} 합격 배지 없음`);
    if (!rec || !rec.detail || !rec.detail.parts || Object.keys(rec.detail.parts).length !== 4) bad(`${exam.id} 파트별 분석 기록 없음`);
    if (exam.id === "mock03") await shot(page, "mock03-result.png", { fullPage: true });
    await page.close();
  }

  /* 4) 표지 대시보드 + 오픈북 */
  const page = await ctx.newPage();
  watch(page, errs);
  await page.goto(BASE + "index.html");
  await page.waitForTimeout(300);
  const dash = await page.locator("[data-v2-dashboard]").innerText();
  if (!/100%/.test(dash) || !dash.includes(`${drills.length} / ${drills.length}`)) bad("대시보드에 실습 진도가 반영되지 않음");
  if (!/3 \/ 3/.test(dash)) bad("대시보드에 모의고사 합격 현황이 반영되지 않음");
  await shot(page, "index.png", { fullPage: true });
  await page.keyboard.press("Control+k");
  await page.waitForTimeout(300);
  await page.keyboard.type("ㅈㄱㅈㄹ");
  await page.waitForTimeout(250);
  const modal = await page.locator("[role=dialog]").innerText();
  if (!/EarlyStopping/.test(modal)) bad("오픈북 초성 검색(ㅈㄱㅈㄹ → EarlyStopping) 실패");
  await shot(page, "openbook.png");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
  if (await page.locator("[role=dialog]").isVisible().catch(() => false)) bad("오픈북 모달이 Esc 로 닫히지 않음");

  if (errs.length) bad("E2E 콘솔 에러: " + Array.from(new Set(errs)).join(" | "));
  await browser.close();
  console.log(failures ? `\n브라우저 통합 검증: ${failures}건 실패` : "\n브라우저 통합 검증: ALL PASS");
  process.exit(failures ? 1 : 0);
})();
