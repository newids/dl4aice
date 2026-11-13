/* dl4aice v2 — grader-core.js
 * 주피터 셀 스타일 "정적" 코드 채점 엔진 (DOM 비의존, Node/브라우저 겸용).
 *
 * 실제로 파이썬을 실행하지 않는다. 답안 코드를 파이썬 토큰으로 나눈 뒤
 *  - 공백/줄바꿈/주석 제거, 따옴표 통일(' 로), 숫자 표기 통일(0.20 == .2)
 *  - 함수 호출 단위로 인자를 분해해 키워드 인자 순서와 무관하게 비교
 * 하는 규칙(validation_rules)으로 판정한다.
 *
 * 공개 API (브라우저: window.DL4AICE.grader / Node: require)
 *   tokenize(code) -> Token[]
 *   normalize(code) -> string
 *   countBlanks(code) -> number
 *   grade(code, rules, opts?) -> { pass, passed, total, blanks, results[], normalized }
 *   variants(code) -> { quotes, spaced, compact, reordered }   (자체 검증용 변형)
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.DL4AICE = root.DL4AICE || {};
    root.DL4AICE.grader = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var OPS = [
    "**=", "//=", ">>=", "<<=", "...",
    "==", "!=", ">=", "<=", "->", "**", "//", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", ":=", "<<", ">>"
  ];
  var NAME_START = /[A-Za-z_ -￿]/;
  var NAME_PART = /[A-Za-z0-9_ -￿]/;
  var OPEN = { "(": ")", "[": "]", "{": "}" };
  var CLOSE = { ")": true, "]": true, "}": true };

  function normNumber(raw) {
    var cleaned = raw.replace(/_/g, "");
    if (/^0[xXoObB]/.test(cleaned) || /[jJ]$/.test(cleaned)) return cleaned.toLowerCase();
    var n = Number(cleaned);
    return isFinite(n) ? String(n) : cleaned;
  }

  /* ---------- 토크나이저 ---------- */
  function tokenize(code) {
    var src = String(code == null ? "" : code).replace(/\r\n?/g, "\n");
    var tokens = [];
    var i = 0;
    var depth = 0;
    var len = src.length;

    function push(t, v) {
      tokens.push({ t: t, v: v, d: depth });
    }

    while (i < len) {
      var ch = src[i];

      if (ch === " " || ch === "\t" || ch === "\f") { i++; continue; }
      if (ch === "\\" && src[i + 1] === "\n") { i += 2; continue; }
      if (ch === "#") {
        while (i < len && src[i] !== "\n") i++;
        continue;
      }
      if (ch === "\n") {
        if (depth === 0 && tokens.length && tokens[tokens.length - 1].t !== "nl") push("nl", "\n");
        i++;
        continue;
      }
      if (ch === ";" && depth === 0) {
        if (tokens.length && tokens[tokens.length - 1].t !== "nl") push("nl", "\n");
        i++;
        continue;
      }

      /* 문자열 (접두사 r/b/f/u 허용, 삼중 따옴표 포함) */
      var sm = /^([rRbBfFuU]{0,2})('''|"""|'|")/.exec(src.slice(i, i + 5));
      if (sm && (sm[1] === "" || !(i > 0 && NAME_PART.test(src[i - 1])))) {
        var quote = sm[2];
        var j = i + sm[0].length;
        var body = "";
        var closed = false;
        while (j < len) {
          if (src[j] === "\\" && j + 1 < len) { body += src[j] + src[j + 1]; j += 2; continue; }
          if (src.substr(j, quote.length) === quote) { closed = true; j += quote.length; break; }
          if (quote.length === 1 && src[j] === "\n") break;
          body += src[j];
          j++;
        }
        if (!closed && quote.length === 1) {
          /* 닫히지 않은 문자열: 줄 끝까지를 문자열로 취급 */
        }
        var prefix = sm[1].toLowerCase().replace(/u/g, "");
        push("str", prefix + "'" + body.replace(/\\(['"])/g, "$1") + "'");
        i = j;
        continue;
      }

      /* 숫자 */
      if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(src[i + 1] || ""))) {
        var nm = /^(0[xXoObB][0-9a-fA-F_]+|(?:[0-9][0-9_]*)?\.?[0-9_]*(?:[eE][+-]?[0-9]+)?[jJ]?)/.exec(src.slice(i));
        var rawNum = nm && nm[0] ? nm[0] : ch;
        push("num", normNumber(rawNum));
        i += rawNum.length;
        continue;
      }

      /* 이름 / 빈칸(___) */
      if (NAME_START.test(ch)) {
        var k = i + 1;
        while (k < len && NAME_PART.test(src[k])) k++;
        var word = src.slice(i, k);
        if (/^_{3,}$/.test(word)) push("blank", "___");
        else push("name", word);
        i = k;
        continue;
      }

      /* 연산자 / 구두점 */
      var matched = null;
      for (var o = 0; o < OPS.length; o++) {
        if (src.substr(i, OPS[o].length) === OPS[o]) { matched = OPS[o]; break; }
      }
      if (!matched) matched = ch;
      if (OPEN[matched]) { push("op", matched); depth++; }
      else if (CLOSE[matched]) { depth = Math.max(0, depth - 1); push("op", matched); }
      else push("op", matched);
      i += matched.length;
    }
    while (tokens.length && tokens[tokens.length - 1].t === "nl") tokens.pop();
    return tokens;
  }

  function isWordy(tok) {
    return tok.t === "name" || tok.t === "num" || tok.t === "str" || tok.t === "blank";
  }

  function joinTokens(tokens) {
    var out = "";
    for (var i = 0; i < tokens.length; i++) {
      var tok = tokens[i];
      if (tok.t === "nl") { out += "\n"; continue; }
      if (i > 0 && isWordy(tok) && isWordy(tokens[i - 1])) out += " ";
      out += tok.v;
    }
    return out;
  }

  function normalize(code) {
    return joinTokens(tokenize(code));
  }

  function countBlanks(code) {
    return tokenize(code).filter(function (t) { return t.t === "blank"; }).length;
  }

  /* 규칙 문자열 -> 토큰열 (줄바꿈 토큰 제거) */
  function seq(text) {
    return tokenize(text).filter(function (t) { return t.t !== "nl"; });
  }

  function sameTok(a, b) {
    return a.t === b.t && a.v === b.v;
  }

  /* tokens 안에서 needle 토큰열이 연속으로 나타나는 시작 인덱스들 */
  function findSeq(tokens, needle, from) {
    var hits = [];
    if (!needle.length) return hits;
    for (var i = from || 0; i + needle.length <= tokens.length; i++) {
      var ok = true;
      for (var j = 0; j < needle.length; j++) {
        if (!sameTok(tokens[i + j], needle[j])) { ok = false; break; }
      }
      if (ok) hits.push(i);
    }
    return hits;
  }

  function asList(value) {
    if (value === undefined || value === null) return [];
    return Array.isArray(value) ? value : [value];
  }

  /* ---------- 문장(statement) / 호출(call) 분해 ---------- */
  function statementBounds(tokens, index) {
    var start = index;
    while (start > 0 && tokens[start - 1].t !== "nl") start--;
    var end = index;
    while (end < tokens.length && tokens[end].t !== "nl") end++;
    return [start, end];
  }

  /* 문장의 대입 좌변(없으면 null). 깊이 0의 첫 '=' 기준 */
  function statementLhs(tokens, start, end) {
    var base = tokens[start] ? tokens[start].d : 0;
    for (var i = start; i < end; i++) {
      var tok = tokens[i];
      if (tok.t === "op" && tok.v === "=" && tok.d === base) {
        return joinTokens(tokens.slice(start, i));
      }
    }
    return null;
  }

  function matchClose(tokens, openIndex) {
    var level = 0;
    for (var i = openIndex; i < tokens.length; i++) {
      var tok = tokens[i];
      if (tok.t !== "op") continue;
      if (OPEN[tok.v]) level++;
      else if (CLOSE[tok.v]) {
        level--;
        if (level === 0) return i;
      }
    }
    return tokens.length;
  }

  function parseArgs(tokens, openIndex, closeIndex) {
    var args = [];
    var current = [];
    var level = 0;
    for (var i = openIndex + 1; i < closeIndex; i++) {
      var tok = tokens[i];
      if (tok.t === "op" && OPEN[tok.v]) level++;
      if (tok.t === "op" && CLOSE[tok.v]) level--;
      if (tok.t === "op" && tok.v === "," && level === 0) {
        args.push(current);
        current = [];
        continue;
      }
      current.push(tok);
    }
    if (current.length) args.push(current);

    var positional = [];
    var kwargs = {};
    var order = [];
    args.forEach(function (arg) {
      if (!arg.length) return;
      if (arg.length >= 2 && arg[0].t === "name" && arg[1].t === "op" && arg[1].v === "=") {
        kwargs[arg[0].v] = joinTokens(arg.slice(2));
        order.push(arg[0].v);
      } else {
        positional.push(joinTokens(arg));
      }
    });
    return { positional: positional, kwargs: kwargs, order: order, raw: args };
  }

  /* callee 예: "Dense", "model.compile", ".fillna"(수신자 무관), "pd.get_dummies" */
  function findCalls(tokens, callee) {
    var needle = seq(callee);
    var calls = [];
    if (!needle.length) return calls;
    findSeq(tokens, needle).forEach(function (at) {
      var after = at + needle.length;
      var open = tokens[after];
      if (!open || open.t !== "op" || open.v !== "(") return;
      var first = needle[0];
      var before = tokens[at - 1];
      /* "Dense" 가 "MyDense" 일 수는 없다(토큰 단위). 단, 이름으로 시작하는 callee 앞의 '.' 은 허용(layers.Dense) */
      if (first.t === "op" && first.v === "." && !before) return;
      var close = matchClose(tokens, after);
      var bounds = statementBounds(tokens, at);
      calls.push({
        callee: callee,
        index: at,
        args: parseArgs(tokens, after, close),
        lhs: statementLhs(tokens, bounds[0], bounds[1]),
        statement: joinTokens(tokens.slice(bounds[0], bounds[1]))
      });
    });
    return calls;
  }

  /* ---------- 값 비교 ---------- */
  function valueMatches(actual, expected) {
    if (actual === undefined || actual === null) return false;
    if (expected === "*" || expected === undefined) return true;
    if (Array.isArray(expected)) {
      return expected.some(function (e) { return valueMatches(actual, e); });
    }
    if (expected && typeof expected === "object") {
      if (expected.re !== undefined) {
        try { return new RegExp(expected.re, expected.flags || "").test(actual); } catch (e) { return false; }
      }
      if (expected.min !== undefined || expected.max !== undefined) {
        var n = Number(actual);
        if (!isFinite(n) || actual === "") return false;
        if (expected.min !== undefined && n < expected.min) return false;
        if (expected.max !== undefined && n > expected.max) return false;
        if (expected.int && Math.floor(n) !== n) return false;
        return true;
      }
      if (expected.contains !== undefined) {
        var hay = seq(actual);
        return asList(expected.contains).some(function (c) { return findSeq(hay, seq(String(c))).length > 0; });
      }
      return false;
    }
    return actual === normalize(String(expected));
  }

  function describeExpected(expected) {
    if (Array.isArray(expected)) return expected.map(describeExpected).join(" 또는 ");
    if (expected && typeof expected === "object") return "조건에 맞는 값";
    return String(expected);
  }

  function paramName(param) {
    if (param.kw && param.pos !== undefined) return param.kw + "(또는 " + (param.pos + 1) + "번째 위치 인자)";
    if (param.kw) return param.kw;
    return (param.pos + 1) + "번째 위치 인자";
  }

  function readParam(call, param) {
    if (param.kw && Object.prototype.hasOwnProperty.call(call.args.kwargs, param.kw)) {
      return call.args.kwargs[param.kw];
    }
    if (param.pos !== undefined && param.pos < call.args.positional.length) {
      return call.args.positional[param.pos];
    }
    return undefined;
  }

  /* ---------- 규칙 평가 ---------- */
  function ruleCall(rule, tokens) {
    var callees = asList(rule.callee);
    var calls = [];
    callees.forEach(function (c) { calls = calls.concat(findCalls(tokens, c)); });
    var shown = "`" + callees[0].replace(/^\./, "") + "(...)`";
    if (!calls.length) {
      return { ok: false, detail: shown + " 호출을 찾지 못했습니다. 함수(클래스) 이름의 철자와 대소문자를 확인하세요." };
    }
    var wantLhs = asList(rule.assign).map(function (a) { return normalize(a); });
    var params = rule.params || [];
    var best = null;
    for (var i = 0; i < calls.length; i++) {
      var call = calls[i];
      var problems = [];
      if (wantLhs.length && wantLhs.indexOf(call.lhs) < 0) {
        problems.push(
          call.lhs === null
            ? shown + " 결과를 변수 `" + rule_first(rule.assign) + "` 에 대입해야 합니다."
            : "변수명이 다릅니다: " + shown + " 결과는 `" + rule_first(rule.assign) + "` 에 담아야 합니다 (현재: `" + call.lhs + "`)."
        );
      }
      for (var p = 0; p < params.length; p++) {
        var param = params[p];
        var actual = readParam(call, param);
        if (param.absent) {
          if (actual !== undefined) problems.push(shown + " 에서 `" + paramName(param) + "` 인자는 쓰지 않아야 합니다.");
          continue;
        }
        if (actual === undefined) {
          problems.push(shown + " 에 `" + paramName(param) + "` 인자가 없습니다.");
        } else if (!valueMatches(actual, param.value)) {
          problems.push(shown + " 의 `" + paramName(param) + "` 값이 요구사항과 다릅니다 (입력값: `" + actual + "`).");
        }
      }
      if (!problems.length) return { ok: true, detail: "" };
      if (!best || problems.length < best.length) best = problems;
    }
    return { ok: false, detail: best.join(" ") };
  }

  function rule_first(value) {
    return asList(value)[0];
  }

  function ruleAssign(rule, tokens) {
    var want = asList(rule["var"]).map(function (v) { return normalize(v); });
    var seen = false;
    var start = 0;
    for (var i = 0; i <= tokens.length; i++) {
      if (i === tokens.length || tokens[i].t === "nl") {
        var lhs = statementLhs(tokens, start, i);
        if (lhs !== null && want.indexOf(lhs) >= 0) {
          seen = true;
          if (rule.contains === undefined) return { ok: true, detail: "" };
          var eq = start;
          while (eq < i && !(tokens[eq].t === "op" && tokens[eq].v === "=" && tokens[eq].d === tokens[start].d)) eq++;
          var rhs = tokens.slice(eq + 1, i);
          var found = asList(rule.contains).some(function (c) { return findSeq(rhs, seq(c)).length > 0; });
          if (found) return { ok: true, detail: "" };
        }
        start = i + 1;
      }
    }
    if (seen) {
      return { ok: false, detail: "`" + rule_first(rule["var"]) + "` 에 대입하는 식의 내용이 요구사항과 다릅니다." };
    }
    return { ok: false, detail: "지정 변수명 `" + rule_first(rule["var"]) + "` 에 결과를 대입하는 문장이 없습니다. 변수명 철자를 확인하세요." };
  }

  function hasToken(tokens, value) {
    return asList(value).some(function (v) { return findSeq(tokens, seq(v)).length > 0; });
  }

  function ruleRegex(rule, normalized) {
    try {
      return new RegExp(rule.pattern, rule.flags || "").test(normalized);
    } catch (e) {
      return false;
    }
  }

  function evalRule(rule, tokens, normalized) {
    switch (rule.type) {
      case "call":
        return ruleCall(rule, tokens);
      case "assign":
        return ruleAssign(rule, tokens);
      case "token": {
        var ok = hasToken(tokens, rule.value);
        return { ok: ok, detail: ok ? "" : "필수 코드 `" + rule_first(rule.value) + "` 가 보이지 않습니다." };
      }
      case "regex": {
        var hit = ruleRegex(rule, normalized);
        return { ok: hit, detail: hit ? "" : "필수 패턴과 일치하는 코드가 없습니다." };
      }
      case "forbid": {
        var bad = (rule.value !== undefined && hasToken(tokens, rule.value)) ||
          (rule.pattern !== undefined && ruleRegex(rule, normalized));
        return { ok: !bad, detail: bad ? "쓰면 안 되는 코드가 포함되어 있습니다" + (rule.value !== undefined ? ": `" + rule_first(rule.value) + "`" : "") + "." : "" };
      }
      case "order": {
        var cursor = 0;
        var values = rule.values || [];
        for (var i = 0; i < values.length; i++) {
          var candidates = asList(values[i]);
          var next = -1;
          for (var c = 0; c < candidates.length; c++) {
            var hits = findSeq(tokens, seq(candidates[c]), cursor);
            if (hits.length && (next < 0 || hits[0] < next)) next = hits[0];
          }
          if (next < 0) {
            return { ok: false, detail: "`" + rule_first(values[i]) + "` 가 없거나 순서가 잘못되었습니다." };
          }
          cursor = next + 1;
        }
        return { ok: true, detail: "" };
      }
      case "any": {
        var subs = (rule.rules || []).map(function (r) { return evalRule(r, tokens, normalized); });
        var pass = subs.some(function (s) { return s.ok; });
        return { ok: pass, detail: pass ? "" : (subs[0] ? subs[0].detail : "") };
      }
      case "all": {
        var parts = (rule.rules || []).map(function (r) { return evalRule(r, tokens, normalized); });
        var failed = parts.filter(function (s) { return !s.ok; });
        return { ok: !failed.length, detail: failed.length ? failed[0].detail : "" };
      }
      default:
        return { ok: false, detail: "알 수 없는 규칙 유형: " + rule.type };
    }
  }

  function grade(code, rules, opts) {
    opts = opts || {};
    var tokens = tokenize(code);
    var normalized = joinTokens(tokens);
    var blanks = tokens.filter(function (t) { return t.t === "blank"; }).length;
    var results = (rules || []).map(function (rule, index) {
      var res = evalRule(rule, tokens, normalized);
      return {
        index: index,
        ok: res.ok,
        type: rule.type,
        label: rule.label || "",
        hint: rule.hint || "",
        detail: res.detail || ""
      };
    });
    var passed = results.filter(function (r) { return r.ok; }).length;
    var empty = tokens.length === 0;
    var blankFail = !opts.allowBlanks && blanks > 0;
    return {
      pass: !empty && !blankFail && passed === results.length,
      passed: passed,
      total: results.length,
      blanks: blanks,
      empty: empty,
      results: results,
      normalized: normalized
    };
  }

  /* ---------- 자체 검증용 답안 변형 ---------- */
  function renderTokens(tokens, style) {
    var out = "";
    for (var i = 0; i < tokens.length; i++) {
      var tok = tokens[i];
      var prev = tokens[i - 1];
      if (tok.t === "nl") { out += "\n"; continue; }
      var text = tok.v;
      if (tok.t === "str" && style.doubleQuotes && text.indexOf('"') < 0 && text.slice(text.indexOf("'") + 1, -1).indexOf("'") < 0) {
        var q = text.indexOf("'");
        text = text.slice(0, q) + '"' + text.slice(q + 1, -1) + '"';
      }
      if (style.spaced) {
        if (prev && prev.t !== "nl") out += style.wide && tok.t === "op" && /^[=,]$/.test(tok.v) ? "   " : " ";
      } else if (prev && isWordy(tok) && isWordy(prev)) {
        out += " ";
      }
      out += text;
    }
    return out;
  }

  /* 모든 호출의 키워드 인자 순서를 뒤집는다(위치 인자는 앞에 유지) */
  function reorderKwargs(tokens) {
    var out = tokens.slice();
    for (var i = 0; i < out.length; i++) {
      if (!(out[i].t === "op" && out[i].v === "(")) continue;
      var close = matchClose(out, i);
      var parsed = parseArgs(out, i, close);
      var kw = parsed.raw.filter(function (a) {
        return a.length >= 2 && a[0].t === "name" && a[1].t === "op" && a[1].v === "=";
      });
      if (kw.length < 2) continue;
      var firstKw = parsed.raw.indexOf(kw[0]);
      var allKwAfter = parsed.raw.slice(firstKw).every(function (a) { return kw.indexOf(a) >= 0 || !a.length; });
      if (!allKwAfter) continue;
      var rebuilt = [];
      var comma = { t: "op", v: ",", d: out[i].d + 1 };
      parsed.raw.slice(0, firstKw).concat(kw.slice().reverse()).forEach(function (arg, n) {
        if (n) rebuilt.push(comma);
        rebuilt = rebuilt.concat(arg);
      });
      out = out.slice(0, i + 1).concat(rebuilt, out.slice(close));
    }
    return out;
  }

  function variants(code) {
    var tokens = tokenize(code);
    return {
      quotes: renderTokens(tokens, { doubleQuotes: true }),
      spaced: renderTokens(tokens, { spaced: true, wide: true }),
      compact: renderTokens(tokens, {}),
      reordered: renderTokens(reorderKwargs(tokens), { doubleQuotes: true, spaced: true })
    };
  }

  return {
    tokenize: tokenize,
    normalize: normalize,
    countBlanks: countBlanks,
    findCalls: findCalls,
    grade: grade,
    variants: variants,
    version: "2.0.0"
  };
});
