#!/usr/bin/env node
/* dl4aice v2 — 채점기 단위 테스트.
 *
 * 사용법: node scripts/v2/test_grader.js [json 파일 ...]
 *   인자가 없으면 assets/data/chapter_drills.json, mock_exams_14q.json 을 검사한다.
 *
 * 문항마다 확인하는 것:
 *   1) 필수 필드 존재, 빈칸(___) 규칙
 *   2) 모범 답안(answer_code) 100% 통과
 *   3) 따옴표 변환 / 공백 삽입 / 공백 제거 / 키워드 인자 순서 변경 변형도 통과
 *   4) skeleton_code 그대로는 오답
 *   5) negative_tests 는 전부 오답
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const grader = require(path.join(ROOT, "assets", "js", "grader-core.js"));

const REQUIRED = [
  "prompt", "skeleton_code", "answer_code", "validation_rules", "expected_output", "explanation", "negative_tests"
];
const RULE_TYPES = new Set(["call", "assign", "token", "regex", "forbid", "order", "any", "all"]);

function collect(json) {
  /* [{ id, item }] — 드릴 파일(items)과 모의고사 파일(exams[].questions) 모두 지원 */
  const out = [];
  if (Array.isArray(json.items)) {
    json.items.forEach((item) => out.push({ id: item.question_id, item, kind: "drill" }));
  }
  const exams = Array.isArray(json.exams) ? json.exams : json.questions ? [json] : [];
  exams.forEach((exam) => {
    (exam.questions || []).forEach((q) => out.push({ id: `${exam.id}-q${q.no}`, item: q, kind: "mock", exam }));
  });
  return out;
}

function checkRules(rules, errors, where) {
  (rules || []).forEach((rule, i) => {
    if (!RULE_TYPES.has(rule.type)) errors.push(`${where}[${i}]: 알 수 없는 type "${rule.type}"`);
    if (rule.type === "any" || rule.type === "all") {
      checkRules(rule.rules, errors, `${where}[${i}].rules`);
      return;
    }
    if (where === "validation_rules" && !rule.hint) errors.push(`${where}[${i}]: hint 누락`);
    if (where === "validation_rules" && !rule.label) errors.push(`${where}[${i}]: label 누락`);
    if (rule.type === "regex") {
      try { new RegExp(rule.pattern, rule.flags || ""); } catch (e) { errors.push(`${where}[${i}]: 정규식 오류 ${e.message}`); }
    }
    if (rule.type === "call" && !rule.callee) errors.push(`${where}[${i}]: callee 누락`);
  });
}

function failed(result) {
  return result.results.filter((r) => !r.ok).map((r) => `      - [${r.label || r.type}] ${r.detail}`).join("\n");
}

function testItem(entry) {
  const { item, kind } = entry;
  const errors = [];

  REQUIRED.forEach((field) => {
    const value = item[field];
    if (value === undefined || value === null || value === "" || (Array.isArray(value) && !value.length)) {
      errors.push(`필드 누락/빈 값: ${field}`);
    }
  });
  if (kind === "drill") {
    ["chapter", "question_id", "title"].forEach((f) => { if (item[f] === undefined) errors.push(`필드 누락: ${f}`); });
  } else {
    ["no", "part", "title", "points"].forEach((f) => { if (item[f] === undefined) errors.push(`필드 누락: ${f}`); });
  }
  if (errors.length) return errors;

  checkRules(item.validation_rules, errors, "validation_rules");

  const blanks = grader.countBlanks(item.skeleton_code);
  if (blanks < 1) errors.push("skeleton_code 에 빈칸(___)이 없습니다");
  if (/_{4,}/.test(item.skeleton_code)) errors.push("빈칸은 정확히 밑줄 3개(___)여야 합니다");
  if (grader.countBlanks(item.answer_code) > 0) errors.push("answer_code 에 빈칸이 남아 있습니다");
  if (/placeholder|TODO|생략|\.\.\.\s*\(중략\)/i.test(item.answer_code)) errors.push("answer_code 에 플레이스홀더 흔적");

  const base = grader.grade(item.answer_code, item.validation_rules);
  if (!base.pass) errors.push(`모범 답안이 통과하지 못함 (${base.passed}/${base.total})\n${failed(base)}`);

  const variants = grader.variants(item.answer_code);
  Object.keys(variants).forEach((name) => {
    const res = grader.grade(variants[name], item.validation_rules);
    if (!res.pass) errors.push(`변형 '${name}' 이 통과하지 못함\n${failed(res)}`);
  });

  /* 빈칸을 지워도(=아무것도 안 채워도) 통과하면 규칙이 빈칸을 검증하지 않는 것 */
  const hollow = item.skeleton_code.replace(/_{3,}/g, "");
  if (grader.grade(hollow, item.validation_rules).pass) {
    errors.push("빈칸을 비운 코드가 통과함 — 규칙이 빈칸 내용을 검증하지 않습니다");
  }
  const dummy = item.skeleton_code.replace(/_{3,}/g, "zzz_wrong");
  if (grader.grade(dummy, item.validation_rules).pass) {
    errors.push("빈칸에 엉뚱한 값(zzz_wrong)을 넣어도 통과함 — 규칙을 강화하세요");
  }

  (item.negative_tests || []).forEach((neg, i) => {
    if (!neg || !neg.code || !neg.reason) { errors.push(`negative_tests[${i}]: code/reason 누락`); return; }
    if (grader.grade(neg.code, item.validation_rules).pass) {
      errors.push(`negative_tests[${i}] 가 정답 처리됨 (${neg.reason})`);
    }
  });
  return errors;
}

function testFile(file) {
  let json;
  try {
    json = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    console.log(`FAIL ${file}\n  JSON 파싱 오류: ${e.message}`);
    return { items: 0, failures: 1 };
  }
  const entries = collect(json);
  let failures = 0;
  const seen = new Set();
  entries.forEach((entry) => {
    const errors = testItem(entry);
    if (seen.has(entry.id)) errors.push("id 중복");
    seen.add(entry.id);
    if (errors.length) {
      failures++;
      console.log(`  FAIL ${entry.id}`);
      errors.forEach((e) => console.log(`    · ${e}`));
    }
  });

  /* 모의고사 구조 검사 */
  const exams = Array.isArray(json.exams) ? json.exams : json.questions ? [json] : [];
  exams.forEach((exam) => {
    const qs = exam.questions || [];
    const total = qs.reduce((sum, q) => sum + (q.points || 0), 0);
    const nos = qs.map((q) => q.no).join(",");
    if (qs.length !== 14) { failures++; console.log(`  FAIL ${exam.id}: 문항 수 ${qs.length} (14 여야 함)`); }
    if (nos !== "1,2,3,4,5,6,7,8,9,10,11,12,13,14") { failures++; console.log(`  FAIL ${exam.id}: 문항 번호 ${nos}`); }
    if (total !== 100) { failures++; console.log(`  FAIL ${exam.id}: 배점 합계 ${total} (100 이어야 함)`); }
    const partOf = (no) => (no <= 7 ? "preprocess" : no <= 10 ? "ml" : no <= 13 ? "dl_model" : "dl_infer");
    qs.forEach((q) => {
      if (q.part !== partOf(q.no)) { failures++; console.log(`  FAIL ${exam.id}-q${q.no}: part "${q.part}" (기대 ${partOf(q.no)})`); }
    });
    ["id", "title", "task_type", "scenario", "dataset", "variables"].forEach((f) => {
      if (exam[f] === undefined) { failures++; console.log(`  FAIL ${exam.id}: 필드 누락 ${f}`); }
    });
    if (exam.dataset && !exam.dataset.setup_code) { failures++; console.log(`  FAIL ${exam.id}: dataset.setup_code 누락`); }
  });

  console.log(`${failures ? "FAIL" : "PASS"} ${path.relative(ROOT, file)} — ${entries.length}문항, 실패 ${failures}건`);
  return { items: entries.length, failures };
}

const args = process.argv.slice(2);
const files = args.length
  ? args.map((f) => path.resolve(f))
  : ["chapter_drills.json", "mock_exams_14q.json"].map((f) => path.join(ROOT, "assets", "data", f));

let totalItems = 0;
let totalFailures = 0;
files.forEach((file) => {
  const res = testFile(file);
  totalItems += res.items;
  totalFailures += res.failures;
});
console.log(`\n채점기 단위 테스트: ${totalItems}문항 / 실패 ${totalFailures}건 → ${totalFailures ? "FAIL" : "ALL PASS"}`);
process.exit(totalFailures ? 1 : 0);
