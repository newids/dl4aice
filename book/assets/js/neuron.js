/* 뉴런이 하는 일 (Ch03 3.7) — 값을 바꿔 가며 보는 그림 다섯 개.
 * 마운트: <div class="v2-neuron" data-v2-neuron> (본문 조각은 _workspace/widgets/neuron.html)
 * 외부 라이브러리 없음. 색은 58-neuron.css 의 --nr-* 값을 읽는다. */
(function () {
  "use strict";
  if (!document.querySelector("[data-v2-neuron]")) return;
  var NS = "http://www.w3.org/2000/svg";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function el(name, attrs, text) {
    var node = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function fmt(n, d) { return (n < 0 ? "−" : "") + Math.abs(n).toFixed(d === undefined ? 2 : d); }
  function sigmoid(z) { return 1 / (1 + Math.exp(-z)); }
  function relu(z) { return Math.max(0, z); }

  var inputs = [
    { key: "fee", name: "월 요금 수준", x: 0.8, w: 1.6 },
    { key: "calls", name: "최근 상담 전화", x: 0.6, w: 1.1 },
    { key: "tenure", name: "가입 기간", x: 0.3, w: -1.8 }
  ];
  var state = { bias: -1.2, act: "sigmoid" };

  /* ---------- 1단계: 뉴런 그림 ---------- */
  var svg = document.getElementById("nr-neuron");
  var ys = [70, 160, 250];
  var NX = 470, NY = 160, IX = 150;
  var edges = [], dots = [], inVals = [], wLabels = [];
  inputs.forEach(function (inp, i) {
    var line = el("line", { x1: IX + 34, y1: ys[i], x2: NX - 62, y2: NY, "stroke-linecap": "round" });
    svg.appendChild(line);
    edges.push(line);
    var group = [];
    for (var k = 0; k < 3; k++) { var d = el("circle", { r: 4.5 }); svg.appendChild(d); group.push(d); }
    dots.push(group);
    svg.appendChild(el("circle", { cx: IX, cy: ys[i], r: 34, fill: "var(--nr-sunken)", stroke: "var(--nr-line)" }));
    var v = el("text", { x: IX, y: ys[i] + 6, "text-anchor": "middle", "font-size": 17, "font-weight": 600, fill: "var(--nr-fg)", class: "mono" });
    svg.appendChild(v);
    inVals.push(v);
    svg.appendChild(el("text", { x: IX - 46, y: ys[i] + 5, "text-anchor": "end", "font-size": 14, fill: "var(--nr-soft)" }, inp.name));
    var wl = el("text", { x: (IX + NX) / 2 - 6, y: (ys[i] + NY) / 2 + [-12, -12, 30][i], "text-anchor": "middle", "font-size": 13, "font-weight": 600, class: "mono" });
    svg.appendChild(wl);
    wLabels.push(wl);
  });
  svg.appendChild(el("circle", { cx: NX, cy: NY, r: 62, fill: "var(--nr-signal-soft)", stroke: "var(--nr-signal)", "stroke-width": 2 }));
  svg.appendChild(el("text", { x: NX, y: NY - 24, "text-anchor": "middle", "font-size": 12.5, fill: "var(--nr-soft)" }, "곱해서 더하고"));
  var zText = el("text", { x: NX, y: NY + 4, "text-anchor": "middle", "font-size": 19, "font-weight": 600, fill: "var(--nr-fg)", class: "mono" });
  svg.appendChild(zText);
  var actName = el("text", { x: NX, y: NY + 28, "text-anchor": "middle", "font-size": 12.5, fill: "var(--nr-soft)" });
  svg.appendChild(actName);
  var outLine = el("line", { x1: NX + 62, y1: NY, x2: 650, y2: NY, stroke: "var(--nr-signal)", "stroke-linecap": "round" });
  svg.appendChild(outLine);
  var outDot = el("circle", { r: 5, fill: "var(--nr-signal)" });
  svg.appendChild(outDot);
  svg.appendChild(el("rect", { x: 650, y: NY - 30, width: 96, height: 60, rx: 12, fill: "var(--nr-surface)", stroke: "var(--nr-signal)", "stroke-width": 2 }));
  var outText = el("text", { x: 698, y: NY + 7, "text-anchor": "middle", "font-size": 20, "font-weight": 600, fill: "var(--nr-signal)", class: "mono" });
  svg.appendChild(outText);
  svg.appendChild(el("text", { x: 698, y: NY - 42, "text-anchor": "middle", "font-size": 13, fill: "var(--nr-soft)" }, "출력"));
  svg.appendChild(el("text", { x: IX, y: 22, "text-anchor": "middle", "font-size": 13, fill: "var(--nr-soft)" }, "입력"));
  svg.appendChild(el("text", { x: (IX + NX) / 2 - 6, y: 22, "text-anchor": "middle", "font-size": 13, fill: "var(--nr-soft)" }, "가중치"));

  /* 슬라이더 */
  var controls = document.getElementById("nr-controls");
  inputs.forEach(function (inp) {
    var box = document.createElement("div");
    box.className = "ctl";
    box.innerHTML =
      '<span class="ctl__name">' + inp.name + "</span>" +
      '<label for="nr-x-' + inp.key + '">입력값 <input id="nr-x-' + inp.key + '" type="range" min="0" max="1" step="0.05" value="' + inp.x + '"><output></output></label>' +
      '<label for="nr-w-' + inp.key + '">가중치 <input id="nr-w-' + inp.key + '" type="range" min="-2.5" max="2.5" step="0.1" value="' + inp.w + '"><output></output></label>';
    controls.appendChild(box);
    var xs = box.querySelector("#nr-x-" + inp.key), ws = box.querySelector("#nr-w-" + inp.key);
    xs.addEventListener("input", function () { inp.x = Number(xs.value); update(); });
    ws.addEventListener("input", function () { inp.w = Number(ws.value); update(); });
    inp.outs = box.querySelectorAll("output");
  });
  var biasEl = document.getElementById("nr-bias");
  biasEl.addEventListener("input", function () { state.bias = Number(biasEl.value); update(); });
  ["relu", "sigmoid"].forEach(function (name) {
    document.getElementById("nr-act-" + name).addEventListener("click", function () { state.act = name; update(); });
  });

  /* ---------- 2단계: 활성화 함수 곡선 ---------- */
  var plot = document.getElementById("nr-actplot");
  var PX0 = 60, PX1 = 720, PY0 = 30, PY1 = 220, ZMIN = -6, ZMAX = 6;
  function px(z) { return PX0 + ((z - ZMIN) / (ZMAX - ZMIN)) * (PX1 - PX0); }
  function py(a, top) { return PY1 - (a / top) * (PY1 - PY0); }
  plot.appendChild(el("line", { x1: PX0, y1: PY1, x2: PX1, y2: PY1, stroke: "var(--nr-line)" }));
  plot.appendChild(el("line", { x1: px(0), y1: PY0 - 8, x2: px(0), y2: PY1, stroke: "var(--nr-line)", "stroke-dasharray": "4 4" }));
  [-6, -3, 0, 3, 6].forEach(function (z) {
    plot.appendChild(el("text", { x: px(z), y: PY1 + 20, "text-anchor": "middle", "font-size": 12, fill: "var(--nr-muted)", class: "mono" }, z));
  });
  plot.appendChild(el("text", { x: PX1, y: PY1 + 38, "text-anchor": "end", "font-size": 12.5, fill: "var(--nr-soft)" }, "점수 z"));
  var yTop = el("text", { x: PX0 - 10, y: PY0 + 4, "text-anchor": "end", "font-size": 12, fill: "var(--nr-muted)", class: "mono" });
  plot.appendChild(yTop);
  plot.appendChild(el("text", { x: PX0 - 10, y: PY1 + 4, "text-anchor": "end", "font-size": 12, fill: "var(--nr-muted)", class: "mono" }, "0"));
  var curve = el("path", { fill: "none", stroke: "var(--nr-signal)", "stroke-width": 3, "stroke-linecap": "round" });
  plot.appendChild(curve);
  var guideV = el("line", { stroke: "var(--nr-warm)", "stroke-dasharray": "3 4" });
  var guideH = el("line", { stroke: "var(--nr-warm)", "stroke-dasharray": "3 4" });
  plot.appendChild(guideV); plot.appendChild(guideH);
  var marker = el("circle", { r: 8, fill: "var(--nr-warm)", stroke: "var(--nr-surface)", "stroke-width": 2 });
  plot.appendChild(marker);
  var markLabel = el("text", { "font-size": 13, "font-weight": 600, fill: "var(--nr-fg)", class: "mono" });
  plot.appendChild(markLabel);

  /* ---------- 3단계: 작은 신경망 ---------- */
  var net = document.getElementById("nr-net");
  var W1 = [[1.4, 0.9, -1.6], [-0.8, 1.7, 0.4], [0.6, -1.1, 1.5], [1.1, 1.2, -0.3]];
  var B1 = [-0.3, -0.4, -0.2, -0.9];
  var W2 = [1.5, 0.9, -1.4, 1.2], B2 = -1.1;
  var WM = [[1.2, -0.4, 0.3, 0.8], [-0.6, 1.3, 0.2, -0.3], [0.1, -0.2, 1.4, -0.9]];
  var WR = [18, 9, -6, 14], BR = 42;
  var LX = [110, 380, 650], iy = [75, 165, 255], hy = [48, 126, 204, 282];
  var netEdges1 = [], netEdges2 = [], hCircles = [], hTexts = [], iTexts = [], oCircle, oText;
  W1.forEach(function (row, h) {
    row.forEach(function (w, i) {
      var line = el("line", { x1: LX[0] + 30, y1: iy[i], x2: LX[1] - 30, y2: hy[h], class: "pulse", "stroke-linecap": "round" });
      net.appendChild(line);
      netEdges1.push({ line: line, w: w });
    });
  });
  W2.forEach(function (w, h) {
    var line = el("line", { x1: LX[1] + 30, y1: hy[h], x2: LX[2] - 34, y2: 165, class: "pulse", "stroke-linecap": "round" });
    net.appendChild(line);
    netEdges2.push({ line: line, w: w });
  });
  inputs.forEach(function (inp, i) {
    net.appendChild(el("circle", { cx: LX[0], cy: iy[i], r: 30, fill: "var(--nr-sunken)", stroke: "var(--nr-line)" }));
    var t = el("text", { x: LX[0], y: iy[i] + 5, "text-anchor": "middle", "font-size": 15, "font-weight": 600, fill: "var(--nr-fg)", class: "mono" });
    net.appendChild(t);
    iTexts.push(t);
  });
  hy.forEach(function (y) {
    var c = el("circle", { cx: LX[1], cy: y, r: 30, stroke: "var(--nr-signal)", "stroke-width": 1.5, class: "pulse" });
    net.appendChild(c);
    hCircles.push(c);
    var t = el("text", { x: LX[1], y: y + 5, "text-anchor": "middle", "font-size": 15, "font-weight": 600, fill: "var(--nr-fg)", class: "mono" });
    net.appendChild(t);
    hTexts.push(t);
  });
  oCircle = el("circle", { cx: LX[2], cy: 165, r: 34, stroke: "var(--nr-signal)", "stroke-width": 2, class: "pulse" });
  net.appendChild(oCircle);
  oText = el("text", { x: LX[2], y: 171, "text-anchor": "middle", "font-size": 17, "font-weight": 600, fill: "var(--nr-fg)", class: "mono" });
  net.appendChild(oText);
  [["입력층", 0], ["은닉층 (relu)", 1], ["출력층 (sigmoid)", 2]].forEach(function (pair) {
    net.appendChild(el("text", { x: LX[pair[1]], y: 322, "text-anchor": "middle", "font-size": 13, fill: "var(--nr-soft)" }, pair[0]));
  });

  var netOut = { hidden: [0, 0, 0, 0], out: 0 };

  function update() {
    var z = state.bias, terms = [];
    inputs.forEach(function (inp, i) {
      z += inp.x * inp.w;
      var color = inp.w >= 0 ? "var(--nr-pos)" : "var(--nr-neg)";
      edges[i].setAttribute("stroke", color);
      edges[i].setAttribute("stroke-width", 1.5 + Math.abs(inp.w) * 3.2);
      edges[i].setAttribute("opacity", 0.35 + Math.min(0.6, Math.abs(inp.w) * 0.3));
      dots[i].forEach(function (d) { d.setAttribute("fill", color); d.setAttribute("opacity", inp.x < 0.03 ? 0 : 1); });
      inVals[i].textContent = inp.x.toFixed(2);
      wLabels[i].textContent = "× " + fmt(inp.w, 1);
      wLabels[i].setAttribute("fill", color);
      inp.outs[0].textContent = inp.x.toFixed(2);
      inp.outs[1].textContent = fmt(inp.w, 1);
      terms.push('<b>' + inp.x.toFixed(2) + '</b> × <b class="' + (inp.w >= 0 ? "t-pos" : "t-neg") + '">' + fmt(inp.w, 1) + "</b>");
      iTexts[i].textContent = inp.x.toFixed(2);
    });
    var a = state.act === "relu" ? relu(z) : sigmoid(z);
    document.getElementById("nr-bias-out").textContent = fmt(state.bias, 1);
    zText.textContent = "z = " + fmt(z);
    actName.textContent = state.act + " 적용";
    outText.textContent = a.toFixed(2);
    outLine.setAttribute("stroke-width", 2 + Math.min(1, a) * 6);
    outDot.setAttribute("opacity", a < 0.02 ? 0 : 1);
    document.getElementById("nr-calc").innerHTML =
      "z = " + terms.join(" + ") + ' + <b class="t-warm">(' + fmt(state.bias, 1) + ")</b> = <b>" + fmt(z) + "</b>\n" +
      '출력 = ' + state.act + "(" + fmt(z) + ') = <b class="t-sig">' + a.toFixed(2) + "</b>" +
      (state.act === "sigmoid" ? "   → 해지할 가능성을 " + Math.round(a * 100) + "%로 본다는 뜻" : (a === 0 ? "   → 점수가 음수라 출력이 0" : "   → 이 값을 다음 층에 전달"));
    document.getElementById("nr-act-relu").setAttribute("aria-pressed", state.act === "relu");
    document.getElementById("nr-act-sigmoid").setAttribute("aria-pressed", state.act === "sigmoid");
    state.z = z; state.a = a;

    /* 곡선 */
    var top = state.act === "relu" ? 6 : 1, path = "";
    for (var s = 0; s <= 120; s++) {
      var zz = ZMIN + (s / 120) * (ZMAX - ZMIN);
      var aa = state.act === "relu" ? relu(zz) : sigmoid(zz);
      path += (s ? "L" : "M") + px(zz).toFixed(1) + " " + py(aa, top).toFixed(1);
    }
    curve.setAttribute("d", path);
    yTop.textContent = top;
    var zc = Math.max(ZMIN, Math.min(ZMAX, z)), ac = Math.min(top, a);
    var mx = px(zc), my = py(ac, top);
    marker.setAttribute("cx", mx); marker.setAttribute("cy", my);
    guideV.setAttribute("x1", mx); guideV.setAttribute("x2", mx); guideV.setAttribute("y1", my); guideV.setAttribute("y2", PY1);
    guideH.setAttribute("x1", PX0); guideH.setAttribute("x2", mx); guideH.setAttribute("y1", my); guideH.setAttribute("y2", my);
    markLabel.textContent = "z " + fmt(z) + " → " + a.toFixed(2);
    var right = mx > 560;
    markLabel.setAttribute("x", right ? mx - 14 : mx + 14);
    markLabel.setAttribute("text-anchor", right ? "end" : "start");
    markLabel.setAttribute("y", my > PY1 - 40 ? my - 14 : my + 26);

    /* 신경망 */
    var xs = inputs.map(function (i) { return i.x; });
    netOut.hidden = W1.map(function (row, h) { return relu(row[0] * xs[0] + row[1] * xs[1] + row[2] * xs[2] + B1[h]); });
    var zo = B2; netOut.hidden.forEach(function (h, i) { zo += h * W2[i]; });
    netOut.out = sigmoid(zo);
    netOut.hidden.forEach(function (h, i) {
      hCircles[i].setAttribute("fill", "color-mix(in srgb, var(--nr-signal) " + Math.round(Math.min(1, h / 2) * 70) + "%, var(--nr-surface))");
      hTexts[i].textContent = h.toFixed(2);
    });
    oCircle.setAttribute("fill", "color-mix(in srgb, var(--nr-signal) " + Math.round(netOut.out * 70) + "%, var(--nr-surface))");
    oText.textContent = netOut.out.toFixed(2);
    netEdges1.concat(netEdges2).forEach(function (e) {
      e.line.setAttribute("stroke", e.w >= 0 ? "var(--nr-pos)" : "var(--nr-neg)");
      e.line.setAttribute("stroke-width", 0.8 + Math.abs(e.w) * 1.5);
      e.line.setAttribute("opacity", 0.4);
    });

    /* 쓰임 카드 */
    document.getElementById("nr-u-bin").textContent = netOut.out.toFixed(2);
    var v = document.getElementById("nr-u-bin-v");
    var yes = netOut.out > 0.5;
    v.textContent = yes ? "0.5보다 큼 → 1 (해지)" : "0.5 이하 → 0 (유지)";
    v.className = "verdict " + (yes ? "verdict--yes" : "verdict--no");
    var logits = WM.map(function (row) { return row.reduce(function (s, w, i) { return s + w * netOut.hidden[i]; }, 0); });
    var mx2 = Math.max.apply(null, logits);
    var exps = logits.map(function (l) { return Math.exp(l - mx2); });
    var sum = exps.reduce(function (s, e) { return s + e; }, 0);
    var probs = exps.map(function (e) { return e / sum; });
    var best = probs.indexOf(Math.max.apply(null, probs));
    document.getElementById("nr-u-multi").innerHTML = probs.map(function (p, i) {
      return '<div class="bar' + (i === best ? " is-top" : "") + '"><span>클래스 ' + i + '</span><span class="bar__track"><span class="bar__fill" style="width:' + (p * 100).toFixed(1) + '%"></span></span><span>' + p.toFixed(2) + "</span></div>";
    }).join("") + '<div style="font-size:.85rem;color:var(--nr-soft)">가장 큰 값은 ' + best + "번 → 답은 클래스 " + best + "</div>";
    var reg = BR; netOut.hidden.forEach(function (h, i) { reg += h * WR[i]; });
    document.getElementById("nr-u-reg").textContent = reg.toFixed(1);
  }

  /* 흐르는 점과 층별 깜빡임 */
  var t0 = null;
  function frame(now) {
    if (t0 === null) t0 = now;
    var t = (now - t0) / 1000;
    inputs.forEach(function (inp, i) {
      var speed = 0.12 + inp.x * 0.5;
      dots[i].forEach(function (d, k) {
        var p = (t * speed + k / 3) % 1;
        d.setAttribute("cx", IX + 34 + (NX - 62 - IX - 34) * p);
        d.setAttribute("cy", ys[i] + (NY - ys[i]) * p);
      });
    });
    var po = (t * (0.15 + Math.min(1, state.a || 0) * 0.5)) % 1;
    outDot.setAttribute("cx", NX + 62 + (650 - NX - 62) * po);
    outDot.setAttribute("cy", NY);
    var phase = Math.floor((t % 3.2) / 0.8);
    netEdges1.forEach(function (e) { e.line.setAttribute("opacity", phase === 0 ? 0.9 : 0.35); });
    hCircles.forEach(function (c) { c.setAttribute("stroke-width", phase === 1 ? 3.5 : 1.5); });
    netEdges2.forEach(function (e) { e.line.setAttribute("opacity", phase === 2 ? 0.9 : 0.35); });
    oCircle.setAttribute("stroke-width", phase === 3 ? 4.5 : 2);
    window.requestAnimationFrame(frame);
  }

  /* ---------- 4단계: 학습 시연 ---------- */
  var seed = 7;
  function rnd() { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }
  function gauss() { return Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd()); }
  var data = [];
  for (var n = 0; n < 44; n++) {
    var cls = n % 2;
    data.push({ x: (cls ? 0.66 : 0.34) + gauss() * 0.11, y: (cls ? 0.62 : 0.36) + gauss() * 0.12, t: cls });
  }
  var model, history, running = false, timer = null;
  function resetModel() {
    model = { w1: (rnd() - 0.5) * 8, w2: (rnd() - 0.5) * 8, b: (rnd() - 0.5) * 3, epoch: 0 };
    history = [];
    evaluate();
    draw();
  }
  function predict(p) { return sigmoid(model.w1 * (p.x - 0.5) * 4 + model.w2 * (p.y - 0.5) * 4 + model.b); }
  function evaluate() {
    var loss = 0, right = 0;
    data.forEach(function (p) {
      var a = Math.min(1 - 1e-7, Math.max(1e-7, predict(p)));
      loss += -(p.t * Math.log(a) + (1 - p.t) * Math.log(1 - a));
      if ((a > 0.5 ? 1 : 0) === p.t) right++;
    });
    model.loss = loss / data.length;
    model.acc = right / data.length;
  }
  function stepOnce() {
    var g1 = 0, g2 = 0, gb = 0;
    data.forEach(function (p) {
      var d = predict(p) - p.t;
      g1 += d * (p.x - 0.5) * 4; g2 += d * (p.y - 0.5) * 4; gb += d;
    });
    var lr = 0.35, m = data.length;
    model.w1 -= lr * g1 / m; model.w2 -= lr * g2 / m; model.b -= lr * gb / m;
    model.epoch++;
    evaluate();
    history.push(model.loss);
    if (history.length > 240) history.shift();
  }
  function css(name) { return getComputedStyle(document.querySelector(".v2-neuron")).getPropertyValue(name).trim(); }
  var cv = document.getElementById("nr-plot"), cx = cv.getContext("2d");
  var lc = document.getElementById("nr-losscurve"), lx = lc.getContext("2d");
  function draw() {
    var W = cv.width, H = cv.height, pad = 46;
    var L = 92, R = 28, T = 12, B = 58, PW = W - L - R, PH = H - T - B;
    function X(v) { return L + v * PW; }
    function Y(v) { return T + (1 - v) * PH; }
    cx.clearRect(0, 0, W, H);
    var pos = css("--nr-pos"), neg = css("--nr-neg"), fg = css("--nr-fg"), line = css("--nr-line"), muted = css("--nr-muted");
    cx.save();
    cx.beginPath(); cx.rect(L, T, PW, PH); cx.clip();
    /* 예측 영역을 옅게 칠한다 */
    var cell = 22;
    for (var gx = 0; gx < PW; gx += cell) {
      for (var gy = 0; gy < PH; gy += cell) {
        var a = predict({ x: (gx + cell / 2) / PW, y: 1 - (gy + cell / 2) / PH });
        cx.globalAlpha = 0.05 + Math.abs(a - 0.5) * 0.28;
        cx.fillStyle = a > 0.5 ? neg : pos;
        cx.fillRect(L + gx, T + gy, cell, cell);
      }
    }
    cx.globalAlpha = 1;
    /* 경계선: w1*u + w2*v + b = 0 */
    var pts = [];
    function push(x, y) { if (x >= -0.001 && x <= 1.001 && y >= -0.001 && y <= 1.001) pts.push([x, y]); }
    var w1 = model.w1 * 4, w2 = model.w2 * 4, c = model.b - model.w1 * 2 - model.w2 * 2;
    if (Math.abs(w2) > 1e-6) { push(0, -c / w2); push(1, -(c + w1) / w2); }
    if (Math.abs(w1) > 1e-6) { push(-c / w1, 0); push(-(c + w2) / w1, 1); }
    if (pts.length >= 2) {
      cx.beginPath();
      cx.moveTo(X(pts[0][0]), Y(pts[0][1]));
      cx.lineTo(X(pts[1][0]), Y(pts[1][1]));
      cx.strokeStyle = fg; cx.lineWidth = 4; cx.lineCap = "round"; cx.stroke();
    }
    data.forEach(function (p) {
      var wrong = (predict(p) > 0.5 ? 1 : 0) !== p.t;
      cx.beginPath();
      cx.arc(X(p.x), Y(p.y), 9, 0, Math.PI * 2);
      cx.fillStyle = p.t ? neg : pos; cx.fill();
      cx.lineWidth = wrong ? 4 : 2; cx.strokeStyle = wrong ? fg : css("--nr-surface"); cx.stroke();
    });
    cx.restore();
    /* 그림 바깥: 테두리, 눈금, 축 이름 */
    cx.strokeStyle = muted; cx.lineWidth = 1.5; cx.strokeRect(L, T, PW, PH);
    cx.fillStyle = muted; cx.font = "19px " + css("--nr-mono");
    [0, 0.2, 0.4, 0.6, 0.8, 1].forEach(function (v) {
      cx.beginPath(); cx.moveTo(X(v), T + PH); cx.lineTo(X(v), T + PH + 7); cx.moveTo(L - 7, Y(v)); cx.lineTo(L, Y(v)); cx.stroke();
      cx.textAlign = "center"; cx.fillText(v.toFixed(1), X(v), T + PH + 27);
      cx.textAlign = "right"; cx.fillText(v.toFixed(1), L - 11, Y(v) + 7);
    });
    cx.font = "600 20px " + css("--nr-font"); cx.fillStyle = css("--nr-soft");
    cx.textAlign = "center"; cx.fillText("특성 1", L + PW / 2, H - 8);
    cx.save(); cx.translate(19, T + PH / 2); cx.rotate(-Math.PI / 2); cx.fillText("특성 2", 0, 0); cx.restore();
    cx.textAlign = "left";

    /* 손실 곡선 */
    var LW = lc.width, LH = lc.height, LL = 62, LB = 44, LT = 14, LR = 30;
    var top = Math.max(0.8, history.length ? Math.max.apply(null, history) : 0.8);
    var span = Math.max(40, history.length);
    lx.clearRect(0, 0, LW, LH);
    lx.strokeStyle = muted; lx.lineWidth = 1.5;
    lx.beginPath(); lx.moveTo(LL, LT); lx.lineTo(LL, LH - LB); lx.lineTo(LW - LR, LH - LB); lx.stroke();
    lx.fillStyle = muted; lx.font = "17px " + css("--nr-mono");
    [0, top / 2, top].forEach(function (v) {
      var y = (LH - LB) - (v / top) * (LH - LB - LT);
      lx.beginPath(); lx.moveTo(LL - 6, y); lx.lineTo(LL, y); lx.stroke();
      lx.textAlign = "right"; lx.fillText(v.toFixed(1), LL - 10, y + 6);
    });
    [0, Math.round(span / 2), span].forEach(function (v) {
      var x = LL + (v / span) * (LW - LL - LR);
      lx.beginPath(); lx.moveTo(x, LH - LB); lx.lineTo(x, LH - LB + 6); lx.stroke();
      lx.textAlign = "center"; lx.fillText(v, x, LH - LB + 24);
    });
    lx.font = "600 17px " + css("--nr-font"); lx.fillStyle = css("--nr-soft");
    lx.textAlign = "right"; lx.fillText("최근 반복 횟수", LW - LR, LH - 4);
    lx.textAlign = "left"; lx.fillText("손실", LL + 10, LT + 16);
    if (history.length > 1) {
      lx.beginPath();
      history.forEach(function (v, i) {
        var x = LL + (i / (span - 1)) * (LW - LL - LR), y = (LH - LB) - (v / top) * (LH - LB - LT);
        if (i) lx.lineTo(x, y); else lx.moveTo(x, y);
      });
      lx.strokeStyle = css("--nr-signal"); lx.lineWidth = 4; lx.lineJoin = "round"; lx.stroke();
    }
    document.getElementById("nr-t-epoch").textContent = model.epoch;
    document.getElementById("nr-t-loss").textContent = model.loss.toFixed(3);
    document.getElementById("nr-t-acc").textContent = Math.round(model.acc * 100) + "%";
    document.getElementById("nr-t-w").innerHTML =
      "가중치 1 = <b>" + fmt(model.w1) + "</b>\n가중치 2 = <b>" + fmt(model.w2) + "</b>\n편향    = <b>" + fmt(model.b) + "</b>";
  }
  var runBtn = document.getElementById("nr-t-run");
  function setRunning(on) {
    running = on;
    runBtn.textContent = on ? "멈춤" : "학습 시작";
    clearInterval(timer);
    if (on) timer = setInterval(function () { stepOnce(); draw(); if (model.epoch >= 400) setRunning(false); }, reduce ? 160 : 60);
  }
  runBtn.addEventListener("click", function () { if (model.epoch >= 400) resetModel(); setRunning(!running); });
  document.getElementById("nr-t-step").addEventListener("click", function () { setRunning(false); stepOnce(); draw(); });
  document.getElementById("nr-t-reset").addEventListener("click", function () { setRunning(false); resetModel(); });
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq.addEventListener) mq.addEventListener("change", draw);
  }
  new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  update();
  resetModel();
  if (!reduce) window.requestAnimationFrame(frame);
  else {
    inputs.forEach(function (inp, i) { dots[i].forEach(function (d, k) { var p = (k + 0.5) / 3; d.setAttribute("cx", IX + 34 + (NX - 62 - IX - 34) * p); d.setAttribute("cy", ys[i] + (NY - ys[i]) * p); }); });
    outDot.setAttribute("cx", (NX + 62 + 650) / 2); outDot.setAttribute("cy", NY);
  }
})();

/* 작은 다층 신경망(2 → H → H → 1). useAct=false 면 은닉층에 활성화 함수가 없다. 브라우저와 Node 양쪽에서 쓴다. */
(function (root) {
  "use strict";
  function makeRng(seed) {
    var s = seed >>> 0;
    function rnd() { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }
    function gauss() { return Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd()); }
    return { rnd: rnd, gauss: gauss };
  }
  function ringData(seed) {
    var r = makeRng(seed), pts = [];
    for (var i = 0; i < 36; i++) {
      var a = r.rnd() * Math.PI * 2, d = Math.abs(r.gauss()) * 0.11;
      pts.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, t: 1 });
    }
    for (var j = 0; j < 44; j++) {
      var b = r.rnd() * Math.PI * 2, e = 0.36 + r.gauss() * 0.035;
      pts.push({ x: Math.cos(b) * e, y: Math.sin(b) * e, t: 0 });
    }
    return pts;
  }
  function create(seed, hidden, useAct) {
    var r = makeRng(seed), sizes = [2, hidden, hidden, 1], W = [], B = [];
    for (var l = 0; l < 3; l++) {
      var w = [], scale = Math.sqrt(2 / sizes[l]);
      for (var o = 0; o < sizes[l + 1]; o++) {
        var row = [];
        for (var i = 0; i < sizes[l]; i++) row.push(r.gauss() * scale);
        w.push(row);
      }
      W.push(w);
      B.push(new Array(sizes[l + 1]).fill(0));
    }
    return { W: W, B: B, useAct: useAct, epoch: 0, loss: 0, acc: 0 };
  }
  function forward(net, x, y) {
    var acts = [[x * 4, y * 4]], zs = [];
    for (var l = 0; l < 3; l++) {
      var prev = acts[l], z = [], a = [];
      for (var o = 0; o < net.W[l].length; o++) {
        var s = net.B[l][o];
        for (var i = 0; i < prev.length; i++) s += net.W[l][o][i] * prev[i];
        z.push(s);
        if (l === 2) a.push(1 / (1 + Math.exp(-s)));
        else a.push(net.useAct ? Math.max(0, s) : s);
      }
      zs.push(z); acts.push(a);
    }
    return { acts: acts, zs: zs, out: acts[3][0] };
  }
  function step(net, data, lr) {
    var gW = net.W.map(function (w) { return w.map(function (row) { return row.map(function () { return 0; }); }); });
    var gB = net.B.map(function (b) { return b.map(function () { return 0; }); });
    var loss = 0, right = 0;
    data.forEach(function (p) {
      var f = forward(net, p.x, p.y), a = Math.min(1 - 1e-7, Math.max(1e-7, f.out));
      loss += -(p.t * Math.log(a) + (1 - p.t) * Math.log(1 - a));
      if ((a > 0.5 ? 1 : 0) === p.t) right++;
      var delta = [f.out - p.t];
      for (var l = 2; l >= 0; l--) {
        var prev = f.acts[l], next = new Array(prev.length).fill(0);
        for (var o = 0; o < delta.length; o++) {
          gB[l][o] += delta[o];
          for (var i = 0; i < prev.length; i++) {
            gW[l][o][i] += delta[o] * prev[i];
            next[i] += delta[o] * net.W[l][o][i];
          }
        }
        if (l > 0) {
          for (var k = 0; k < next.length; k++) if (net.useAct && f.zs[l - 1][k] <= 0) next[k] = 0;
        }
        delta = next;
      }
    });
    var m = data.length;
    for (var l2 = 0; l2 < 3; l2++) {
      for (var o2 = 0; o2 < net.W[l2].length; o2++) {
        net.B[l2][o2] -= lr * gB[l2][o2] / m;
        for (var i2 = 0; i2 < net.W[l2][o2].length; i2++) net.W[l2][o2][i2] -= lr * gW[l2][o2][i2] / m;
      }
    }
    net.epoch++; net.loss = loss / m; net.acc = right / m;
  }
  var api = { ringData: ringData, create: create, forward: forward, step: step };
  root.DL4AICE_MLP = api;
})(typeof self !== "undefined" ? self : this);

(function () {
  "use strict";
  if (!document.querySelector("[data-v2-neuron]")) return;
  var NS = "http://www.w3.org/2000/svg";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function el(name, attrs, text) {
    var node = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function css(name) { return getComputedStyle(document.querySelector(".v2-neuron")).getPropertyValue(name).trim(); }

  /* ---------- 직접 보기 ①: 꺾인 선 더하기 ---------- */
  var svg = document.getElementById("nr-bend");
  var X0 = 50, X1 = 730, Y0 = 24, Y1 = 262;
  function target(x) { return 0.12 + 0.76 * Math.pow(Math.sin(Math.PI * x), 2) * (0.75 + 0.25 * x); }
  function sx(x) { return X0 + x * (X1 - X0); }
  function sy(y) { return Y1 - y * (Y1 - Y0); }
  function pathOf(fn) {
    var d = "";
    for (var i = 0; i <= 160; i++) { var x = i / 160; d += (i ? "L" : "M") + sx(x).toFixed(1) + " " + sy(Math.max(-0.08, Math.min(1.08, fn(x)))).toFixed(1); }
    return d;
  }
  svg.appendChild(el("line", { x1: X0, y1: Y1, x2: X1, y2: Y1, stroke: "var(--nr-line)" }));
  svg.appendChild(el("line", { x1: X0, y1: Y0, x2: X0, y2: Y1, stroke: "var(--nr-line)" }));
  svg.appendChild(el("text", { x: X1, y: Y1 + 34, "text-anchor": "end", "font-size": 12.5, fill: "var(--nr-soft)" }, "하루 커피 잔 수"));
  svg.appendChild(el("text", { x: X0 + 8, y: Y0 - 6, "font-size": 12.5, fill: "var(--nr-soft)" }, "집중도 점수"));
  [0, 2, 4, 6, 8].forEach(function (c) {
    svg.appendChild(el("text", { x: sx(c / 8), y: Y1 + 17, "text-anchor": "middle", "font-size": 12, fill: "var(--nr-muted)", class: "mono" }, c));
  });
  [0, 50, 100].forEach(function (v) {
    svg.appendChild(el("text", { x: X0 - 8, y: sy(v / 100) + 4, "text-anchor": "end", "font-size": 12, fill: "var(--nr-muted)", class: "mono" }, v));
  });
  var pieces = el("g", {});
  svg.appendChild(pieces);
  svg.appendChild(el("path", { d: pathOf(target), fill: "none", stroke: "var(--nr-muted)", "stroke-width": 2.5, "stroke-dasharray": "7 7" }));
  var sumPath = el("path", { fill: "none", stroke: "var(--nr-signal)", "stroke-width": 4, "stroke-linecap": "round", "stroke-linejoin": "round" });
  svg.appendChild(sumPath);
  var knots = el("g", {});
  svg.appendChild(knots);
  var probe = el("line", { y1: Y0, y2: Y1, stroke: "var(--nr-fg)", "stroke-width": 1.5, "stroke-dasharray": "3 5" });
  svg.appendChild(probe);
  var probeSum = el("circle", { r: 7, fill: "var(--nr-signal)", stroke: "var(--nr-surface)", "stroke-width": 2 });
  var probeTarget = el("circle", { r: 5, fill: "var(--nr-muted)", stroke: "var(--nr-surface)", "stroke-width": 2 });
  svg.appendChild(probeTarget); svg.appendChild(probeSum);
  var bend = { n: 1, act: true, timer: null, cups: 5 };
  function num(v, d) { return (v < 0 ? "−" : "") + Math.abs(v).toFixed(d === undefined ? 1 : d); }

  function fitLine() {
    var n = 200, sxx = 0, sxy = 0, mx = 0, my = 0, i, x;
    for (i = 0; i <= n; i++) { x = i / n; mx += x; my += target(x); }
    mx /= n + 1; my /= n + 1;
    for (i = 0; i <= n; i++) { x = i / n; sxx += (x - mx) * (x - mx); sxy += (x - mx) * (target(x) - my); }
    var a = sxy / sxx;
    return { a: a, b: my - a * mx };
  }
  var best = fitLine();

  function drawBend() {
    var n = bend.n, fn, parts = [], gap = 0, rows = [], x = bend.cups / 8, cups = bend.cups, head, foot;
    while (pieces.firstChild) pieces.removeChild(pieces.firstChild);
    while (knots.firstChild) knots.removeChild(knots.firstChild);
    if (bend.act) {
      /* 꺾이는 자리를 고르게 놓고, 그 자리에서 목표선과 만나도록 기울기를 정한다 */
      var ks = [], slopes = [], coef = [];
      for (var i = 0; i < n; i++) { ks.push(i / n); slopes.push((target((i + 1) / n) - target(i / n)) * n); }
      slopes.forEach(function (s, i) { coef.push(i ? s - slopes[i - 1] : s); });
      fn = function (x) { var y = target(0); for (var j = 0; j < n; j++) y += coef[j] * Math.max(0, x - ks[j]); return y; };
      /* 계산표: 잔 수와 점수 단위로 환산 (기울기는 "잔당 몇 점") */
      var start = target(0) * 100, total = start;
      ks.forEach(function (k, j) {
        var knot = k * 8, r = Math.max(0, cups - knot), slope = coef[j] * 100 / 8, add = slope * r;
        total += add;
        rows.push('<tr class="' + (r > 0 ? "" : "is-off") + '"><td>뉴런 ' + (j + 1) + "</td><td>" + knot.toFixed(1) + "잔</td><td>" +
          (r > 0 ? cups.toFixed(1) + " − " + knot.toFixed(1) + " = " + r.toFixed(1) : "0 (아직 꺾이는 자리 전)") + "</td><td>" + num(slope) + "</td><td>" + num(add) + "</td></tr>");
      });
      head = "<tr><th>뉴런</th><th>꺾이는 자리 (편향이 정함)</th><th>relu(입력 − 자리)</th><th>× 가중치 (잔당 점수)</th><th>더해지는 값</th></tr>";
      foot = '<tr><td colspan="4">시작값 ' + start.toFixed(1) + " + 더해지는 값의 합 = 뉴런들이 낸 답</td><td>" + total.toFixed(1) + "점</td></tr>";
      ks.forEach(function (k, j) {
        parts.push(function (x) { return target(k) * 0 + 0.5 + coef[j] * Math.max(0, x - k) * 0.5; });
        if (j) knots.appendChild(el("circle", { cx: sx(k), cy: sy(fn(k)), r: 6, fill: "var(--nr-warm)", stroke: "var(--nr-surface)", "stroke-width": 2 }));
      });
    } else {
      /* 직선 n개: 기울기가 제각각이어도 합은 직선 하나(가장 잘 맞춘 직선) */
      for (var q = 0; q < n; q++) {
        (function (q) {
          var d = n > 1 ? (q - (n - 1) / 2) * 0.5 : 0;
          parts.push(function (x) { return 0.5 + (best.a / n + d) * (x - 0.5); });
        })(q);
      }
      fn = function (x) { return best.a * x + best.b; };
      var total2 = 0;
      for (var q2 = 0; q2 < n; q2++) {
        var dd = n > 1 ? (q2 - (n - 1) / 2) * 0.5 : 0;
        var slope2 = (best.a / n + dd) * 100 / 8, base2 = best.b * 100 / n, val = slope2 * cups + base2;
        total2 += val;
        rows.push("<tr><td>뉴런 " + (q2 + 1) + "</td><td>" + num(slope2) + "</td><td>" + cups.toFixed(1) + "</td><td>" + num(base2) + "</td><td>" + num(val) + "</td></tr>");
      }
      head = "<tr><th>뉴런</th><th>가중치 (잔당 점수)</th><th>× 입력 (잔 수)</th><th>+ 편향 (기본값)</th><th>이 뉴런의 값</th></tr>";
      foot = '<tr><td colspan="4">뉴런들의 값을 모두 더한 답 (기울기를 다 더하면 잔당 ' + num(best.a * 100 / 8) + "점인 직선 하나)</td><td>" + total2.toFixed(1) + "점</td></tr>";
    }
    var answer = fn(x) * 100, truth = target(x) * 100;
    document.getElementById("nr-b-table").innerHTML = "<thead>" + head + "</thead><tbody>" + rows.join("") + "</tbody><tfoot>" + foot + "</tfoot>";
    document.getElementById("nr-b-x-out").textContent = cups.toFixed(1) + "잔";
    document.getElementById("nr-b-work").textContent =
      "커피 " + cups.toFixed(1) + "잔일 때 실제 집중도(점선)는 " + truth.toFixed(1) + "점이고, 뉴런들이 낸 답(굵은 선)은 " + answer.toFixed(1) +
      "점입니다. 차이는 " + Math.abs(answer - truth).toFixed(1) + "점입니다." +
      (bend.act ? " 꺾이는 자리를 아직 지나지 않은 뉴런은 0을 내므로 합에 영향을 주지 않습니다(흐리게 표시)." : " 어느 뉴런도 꺾이지 않으므로, 잔 수가 늘면 모든 뉴런의 값이 일정한 비율로만 변합니다.");
    probe.setAttribute("x1", sx(x)); probe.setAttribute("x2", sx(x));
    probeSum.setAttribute("cx", sx(x)); probeSum.setAttribute("cy", sy(Math.max(-0.08, Math.min(1.08, fn(x)))));
    probeTarget.setAttribute("cx", sx(x)); probeTarget.setAttribute("cy", sy(target(x)));
    parts.forEach(function (part) {
      pieces.appendChild(el("path", { d: pathOf(part), fill: "none", stroke: "var(--nr-warm)", "stroke-width": 1.5, opacity: 0.55 }));
    });
    sumPath.setAttribute("d", pathOf(fn));
    for (var s = 0; s <= 100; s++) gap += Math.abs(fn(s / 100) - target(s / 100));
    gap /= 101;
    document.getElementById("nr-b-n").value = n;
    document.getElementById("nr-b-n-out").textContent = n;
    document.getElementById("nr-b-on").setAttribute("aria-pressed", bend.act);
    document.getElementById("nr-b-off").setAttribute("aria-pressed", !bend.act);
    document.getElementById("nr-b-msg").textContent = bend.act
      ? "뉴런 " + n + "개: 선이 " + (n - 1) + "번 꺾였습니다. 목표선과의 평균 차이는 " + gap.toFixed(3) + "입니다. 뉴런이 늘수록 꺾이는 자리가 늘어 굽은 선에 가까워집니다."
      : "뉴런 " + n + "개: 가는 선들의 기울기는 서로 다르지만, 더한 결과는 여전히 직선 하나입니다. 평균 차이 " + gap.toFixed(3) + "에서 더 줄지 않습니다.";
  }
  function stopBend() { clearInterval(bend.timer); bend.timer = null; document.getElementById("nr-b-play").textContent = "뉴런 늘려 보기"; }
  document.getElementById("nr-b-on").addEventListener("click", function () { bend.act = true; drawBend(); });
  document.getElementById("nr-b-off").addEventListener("click", function () { bend.act = false; drawBend(); });
  document.getElementById("nr-b-n").addEventListener("input", function (e) { stopBend(); bend.n = Number(e.target.value); drawBend(); });
  document.getElementById("nr-b-x").addEventListener("input", function (e) { bend.cups = Number(e.target.value); drawBend(); });
  document.getElementById("nr-b-play").addEventListener("click", function () {
    if (bend.timer) { stopBend(); return; }
    bend.n = 1; drawBend();
    document.getElementById("nr-b-play").textContent = "멈춤";
    bend.timer = setInterval(function () {
      if (bend.n >= 8) { stopBend(); return; }
      bend.n++; drawBend();
    }, reduce ? 1200 : 750);
  });
  drawBend();

  /* ---------- 직접 보기 ②: 두 신경망 나란히 학습 ---------- */
  var data = DL4AICE_MLP.ringData(11), seeds = [5, 3, 21], round = 0, nets, timer = null;
  var cvOff = document.getElementById("nr-d-off"), cvOn = document.getElementById("nr-d-on");
  function reset() {
    var seed = seeds[round % seeds.length];
    nets = { off: DL4AICE_MLP.create(seed, 8, false), on: DL4AICE_MLP.create(seed, 8, true) };
    DL4AICE_MLP.step(nets.off, data, 0); DL4AICE_MLP.step(nets.on, data, 0);
    nets.off.epoch = 0; nets.on.epoch = 0;
    paint();
  }
  function paintOne(cv, net) {
    var c = cv.getContext("2d"), W = cv.width, H = cv.height, cell = 12;
    var L = 86, R = 26, T = 12, B = 56, PW = W - L - R, PH = H - T - B;
    var pos = css("--nr-pos"), neg = css("--nr-neg"), fg = css("--nr-fg"), surface = css("--nr-surface"), muted = css("--nr-muted");
    function X(v) { return L + (v + 0.5) * PW; }
    function Y(v) { return T + (0.5 - v) * PH; }
    c.clearRect(0, 0, W, H);
    c.save();
    c.beginPath(); c.rect(L, T, PW, PH); c.clip();
    for (var gx = 0; gx < PW; gx += cell) {
      for (var gy = 0; gy < PH; gy += cell) {
        var a = DL4AICE_MLP.forward(net, (gx + cell / 2) / PW - 0.5, 0.5 - (gy + cell / 2) / PH).out;
        c.globalAlpha = 0.06 + Math.abs(a - 0.5) * 0.5;
        c.fillStyle = a > 0.5 ? neg : pos;
        c.fillRect(L + gx, T + gy, cell, cell);
      }
    }
    /* (0, 0)을 지나는 옅은 기준선 */
    c.globalAlpha = 0.45; c.strokeStyle = muted; c.lineWidth = 1;
    c.beginPath(); c.moveTo(L, Y(0)); c.lineTo(L + PW, Y(0)); c.moveTo(X(0), T); c.lineTo(X(0), T + PH); c.stroke();
    c.globalAlpha = 1;
    /* 출력이 0.5를 넘나드는 칸의 변에 경계를 긋는다 */
    c.strokeStyle = fg; c.lineWidth = 4; c.lineCap = "round";
    var step = 9, cols = Math.ceil(PW / step), rows = Math.ceil(PH / step), grid = [];
    for (var i = 0; i <= cols; i++) {
      grid.push([]);
      for (var j = 0; j <= rows; j++) grid[i].push(DL4AICE_MLP.forward(net, (i * step) / PW - 0.5, 0.5 - (j * step) / PH).out > 0.5);
    }
    c.beginPath();
    for (var x = 0; x < cols; x++) {
      for (var y = 0; y < rows; y++) {
        if (grid[x][y] !== grid[x + 1][y]) { c.moveTo(L + (x + 0.5) * step, T + y * step - step / 2); c.lineTo(L + (x + 0.5) * step, T + y * step + step / 2); }
        if (grid[x][y] !== grid[x][y + 1]) { c.moveTo(L + x * step - step / 2, T + (y + 0.5) * step); c.lineTo(L + x * step + step / 2, T + (y + 0.5) * step); }
      }
    }
    c.stroke();
    data.forEach(function (p) {
      var wrong = (DL4AICE_MLP.forward(net, p.x, p.y).out > 0.5 ? 1 : 0) !== p.t;
      c.beginPath();
      c.arc(X(p.x), Y(p.y), 8, 0, Math.PI * 2);
      c.fillStyle = p.t ? neg : pos; c.fill();
      c.lineWidth = wrong ? 4 : 2; c.strokeStyle = wrong ? fg : surface; c.stroke();
    });
    c.restore();
    /* 그림 바깥: 테두리, 눈금, 축 이름 */
    c.strokeStyle = muted; c.lineWidth = 1.5; c.strokeRect(L, T, PW, PH);
    c.fillStyle = muted; c.font = "17px " + css("--nr-mono");
    [-0.4, -0.2, 0, 0.2, 0.4].forEach(function (v) {
      var label = (v < 0 ? "−" : "") + Math.abs(v).toFixed(1);
      c.beginPath(); c.moveTo(X(v), T + PH); c.lineTo(X(v), T + PH + 7); c.moveTo(L - 7, Y(v)); c.lineTo(L, Y(v)); c.stroke();
      c.textAlign = "center"; c.fillText(label, X(v), T + PH + 25);
      c.textAlign = "right"; c.fillText(label, L - 11, Y(v) + 6);
    });
    c.font = "600 18px " + css("--nr-font"); c.fillStyle = css("--nr-soft");
    c.textAlign = "center"; c.fillText("특성₁", L + PW / 2, H - 8);
    c.save(); c.translate(17, T + PH / 2); c.rotate(-Math.PI / 2); c.fillText("특성₂", 0, 0); c.restore();
    c.textAlign = "left";
  }
  function paint() {
    paintOne(cvOff, nets.off); paintOne(cvOn, nets.on);
    document.getElementById("nr-d-epoch").textContent = "반복 " + nets.on.epoch;
    document.getElementById("nr-d-acc-off").textContent = "정확도 " + Math.round(nets.off.acc * 100) + "%";
    document.getElementById("nr-d-acc-on").textContent = "정확도 " + Math.round(nets.on.acc * 100) + "%";
    /* 활성화 함수가 없는 쪽: 세 층을 합치면 z = a*x1 + c*x2 + d 한 줄이 된다 */
    var n = nets.off, W1 = n.W[0], W2 = n.W[1], W3 = n.W[2][0], a = 0, c = 0, d = n.B[2][0];
    for (var k = 0; k < W3.length; k++) {
      d += W3[k] * n.B[1][k];
      for (var j = 0; j < W2[k].length; j++) {
        a += W3[k] * W2[k][j] * W1[j][0] * 4;
        c += W3[k] * W2[k][j] * W1[j][1] * 4;
        d += W3[k] * W2[k][j] * n.B[0][j];
      }
    }
    function sg(v) { return (v < 0 ? "− " : "+ ") + Math.abs(v).toFixed(2); }
    document.getElementById("nr-d-eq").innerHTML =
      "활성화 함수 없음:  z = <b>" + (a < 0 ? "−" : "") + Math.abs(a).toFixed(2) + "</b> × 특성₁ <b>" + sg(c) + "</b> × 특성₂ <b>" + sg(d) + "</b> = 0\n" +
      "                  층이 세 개여도 합치면 이 한 줄이고, 이 식을 만족하는 점들은 직선입니다.\n" +
      "relu 있음:        z = 출력층( relu( 층 2( relu( 층 1(특성₁, 특성₂) ) ) ) ) = 0\n" +
      "                  relu가 사이에 있어 한 줄로 합쳐지지 않고, 구역마다 다른 직선이 이어진 꺾인 선이 됩니다.";
  }
  var runBtn = document.getElementById("nr-d-run");
  function setRun(on) {
    clearInterval(timer); timer = null;
    runBtn.textContent = on ? "멈춤" : (nets.on.epoch >= 400 ? "다시 학습" : "둘 다 학습 시작");
    if (!on) return;
    timer = setInterval(function () {
      for (var k = 0; k < 4; k++) { DL4AICE_MLP.step(nets.off, data, 0.1); DL4AICE_MLP.step(nets.on, data, 0.1); }
      paint();
      if (nets.on.epoch >= 400) {
        setRun(false);
        document.getElementById("nr-d-msg").textContent =
          "반복 " + nets.on.epoch + "번 뒤: 활성화 함수가 없는 쪽은 정확도 " + Math.round(nets.off.acc * 100) +
          "%에서 멈췄고 경계가 직선입니다. relu가 있는 쪽은 " + Math.round(nets.on.acc * 100) +
          "%이고 경계가 가운데 무리를 둘러쌉니다. 층 수와 뉴런 수는 두 쪽이 같습니다.";
      }
    }, reduce ? 200 : 50);
  }
  runBtn.addEventListener("click", function () {
    if (timer) { setRun(false); return; }
    if (nets.on.epoch >= 400) { round++; reset(); }
    setRun(true);
  });
  document.getElementById("nr-d-reset").addEventListener("click", function () { setRun(false); round++; reset(); runBtn.textContent = "둘 다 학습 시작"; });
  new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq.addEventListener) mq.addEventListener("change", paint);
  }
  reset();
})();
