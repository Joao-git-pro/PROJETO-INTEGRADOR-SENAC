(function () {
  "use strict";
  /* Não rodar dentro de iframe de outro site (clickjacking). */
  try { if (window.top !== window.self) { document.documentElement.textContent = ""; window.top.location = window.self.location; return; } } catch (e) { document.documentElement.textContent = ""; return; }
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var NS = "http://www.w3.org/2000/svg";
  function svg(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function h(tag, attrs, text) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function hhmm(min) { min = Math.round(min); return pad(Math.floor(min / 60) % 24) + ":" + pad(min % 60); }
  function toMin(s) { var p = s.split(":"); return +p[0] * 60 + +p[1]; }
  function hash(str) { var x = 2166136261; for (var i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
  function rng(seed) { var s = seed || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function store(key, val) {
    try { if (val === undefined) { var v = localStorage.getItem(key); return v && v.length < 100000 ? JSON.parse(v) : null; } localStorage.setItem(key, JSON.stringify(val)); } catch (e) { return null; }
    return null;
  }
  var toastT = null;
  function toast(msg) { var t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 4000); }

  /* ---------- Sons (sintetizados no aparelho) e efeitos ---------- */
  var AC = null, soundOn = store("mre-som") !== false;
  function ac() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } }
    if (AC && AC.state === "suspended") { try { AC.resume(); } catch (e) {} }
    return AC;
  }
  function tone(f, t0, dur, type, vol, to) {
    if (!soundOn) return; var a = ac(); if (!a) return;
    var t = a.currentTime + t0, o = a.createOscillator(), g = a.createGain();
    o.type = type || "sine"; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.03);
  }
  var SND = {
    tap: function () { tone(660, 0, 0.05, "triangle", 0.06); },
    pop: function () { tone(880, 0, 0.06, "sine", 0.08, 1300); },
    select: function () { tone(520, 0, 0.07, "sine", 0.09); tone(780, 0.05, 0.1, "sine", 0.09); },
    tab: function () { tone(420, 0, 0.07, "sine", 0.07, 560); },
    start: function () { [392, 523, 659, 784].forEach(function (f, i) { tone(f, i * 0.07, 0.25, "sine", 0.09); }); },
    ok: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.09, 0.26, "sine", 0.12); }); },
    coin: function () { tone(988, 0, 0.08, "square", 0.05); tone(1319, 0.08, 0.28, "square", 0.05); },
    bip: function () { tone(1760, 0, 0.09, "square", 0.06); tone(2349, 0.11, 0.16, "square", 0.06); },
    err: function () { tone(240, 0, 0.18, "sawtooth", 0.07, 170); tone(200, 0.2, 0.24, "sawtooth", 0.07, 140); },
    bell: function () { tone(988, 0, 0.4, "sine", 0.12); tone(1319, 0.14, 0.55, "sine", 0.1); }
  };
  var sndBtn = $("#sndbtn");
  function setSnd(on) { soundOn = on; sndBtn.setAttribute("aria-pressed", on ? "true" : "false"); sndBtn.setAttribute("aria-label", on ? "Sons ligados" : "Sons desligados"); store("mre-som", on); }
  sndBtn.addEventListener("click", function () { setSnd(!soundOn); if (soundOn) SND.pop(); });
  setSnd(soundOn);
  document.addEventListener("click", function (e) { ac(); var b = e.target.closest && e.target.closest("button"); if (b && b !== sndBtn && !b.disabled) SND.tap(); }, true);
  function vib(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

  /* ondinha ao tocar */
  document.addEventListener("pointerdown", function (e) {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var t = e.target.closest && e.target.closest(".btn,.chip,.lchip,.dest,.trip,.cd,.seat,.rbtn,.zbtn,.tipo,.meth,.time");
    if (!t || t.disabled) return;
    var r = t.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2, s = document.createElement("span");
    s.className = "rp"; s.style.width = s.style.height = d + "px"; s.style.left = (e.clientX - r.left - d / 2) + "px"; s.style.top = (e.clientY - r.top - d / 2) + "px";
    t.appendChild(s); setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 700);
  });

  /* entrada escalonada das listas */
  ["#r-destlist", "#r-viagens", "#w-hist", "#c-grid", "#lista", "#h-paradas", "#h-times", "#lsel", "#r-minhas", "#w-valores"].forEach(function (sel0) {
    var box = $(sel0); if (!box) return; box.classList.add("stg");
    function num() { for (var i = 0; i < box.children.length; i++) box.children[i].style.setProperty("--i", Math.min(i, 14)); }
    num(); new MutationObserver(num).observe(box, { childList: true });
  });
  ["#r-erro", "#w-erro"].forEach(function (id) {
    var el = $(id); new MutationObserver(function () { if (el.textContent) { SND.err(); vib(60); } }).observe(el, { childList: true, characterData: true, subtree: true });
  });

  /* confete */
  var fxc = document.createElement("canvas"), fxp = [], fxRun = false;
  fxc.setAttribute("aria-hidden", "true"); fxc.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:40";
  document.body.appendChild(fxc);
  function burst(px, py) {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    fxc.width = innerWidth * dpr; fxc.height = innerHeight * dpr;
    var cols = ["#2FD89B", "#09825A", "#FFE27A", "#FFFFFF", "#5AA2FF", "#FF7AA8"];
    for (var i = 0; i < 80; i++) {
      var a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, v = 6 + Math.random() * 9;
      fxp.push({ x: innerWidth * px * dpr, y: innerHeight * py * dpr, vx: Math.cos(a) * v * dpr, vy: Math.sin(a) * v * dpr, w: (5 + Math.random() * 6) * dpr, hh: (3 + Math.random() * 4) * dpr, c: cols[i % cols.length], r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, life: 0 });
    }
    if (!fxRun) { fxRun = true; requestAnimationFrame(fxLoop); }
  }
  function fxLoop() {
    var ctx = fxc.getContext("2d"); ctx.clearRect(0, 0, fxc.width, fxc.height);
    fxp = fxp.filter(function (p) { return p.life < 110 && p.y < fxc.height + 40; });
    fxp.forEach(function (p) {
      p.life++; p.vy += 0.38 * (fxc.width / innerWidth); p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - p.life / 110); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.hh / 2, p.w, p.hh); ctx.restore();
    });
    if (fxp.length) requestAnimationFrame(fxLoop); else { fxRun = false; ctx.clearRect(0, 0, fxc.width, fxc.height); }
  }
  function okMark(bad) {
    var d = h("div", { class: bad ? "okmark bad" : "okmark", "aria-hidden": "true" });
    d.innerHTML = bad ? '<svg viewBox="0 0 24 24"><path d="M12 6v8M12 18v.4"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>';
    return d;
  }
  var lastBal = null;
  function countTo(el, from, to) {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var t0 = performance.now(), D = 800;
    (function step(t) { var k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3); el.textContent = brl(Math.round(from + (to - from) * e)); if (k < 1) requestAnimationFrame(step); })(t0);
  }

  /* ---------- Letras maiores ---------- */
  var bigBtn = $("#bigtxt");
  function setBig(on) { document.documentElement.classList.toggle("big", on); bigBtn.setAttribute("aria-pressed", on ? "true" : "false"); store("mre-big", on); }
  bigBtn.addEventListener("click", function () { setBig(!document.documentElement.classList.contains("big")); });
  if (store("mre-big")) setBig(true);

  /* ---------- Linhas urbanas de exemplo (coordenadas do mapa 800 x 940) ---------- */
  var PERIOD = 22, SPEED = 40, KM = 0.015, W = 800, H = 940;
  var LINES = [
    { id: "101", name: "Aeroporto – Barra", color: "--l1", stops: [["Aeroporto", 110, 160], ["", 150, 250], ["Vila Conceição", 180, 340], ["", 270, 410], ["Centro", 390, 456], ["", 440, 520], ["Porto", 480, 570], ["", 560, 610], ["Barra", 610, 670]] },
    { id: "102", name: "Santa Terezinha – São José", color: "--l2", stops: [["Santa Terezinha", 600, 260], ["", 540, 330], ["Rodoviária", 460, 380], ["Centro", 390, 456], ["", 300, 520], ["São José", 240, 600]] },
    { id: "103", name: "São Joaquim – Centro", color: "--l3", stops: [["São Joaquim", 300, 790], ["", 260, 700], ["São José", 240, 600], ["Gaspar", 300, 510], ["", 340, 480], ["Centro", 390, 456]] },
    { id: "104", name: "Vermelho – Santa Terezinha", color: "--l4", stops: [["Vermelho", 680, 840], ["", 650, 760], ["Barra", 610, 670], ["", 690, 570], ["", 700, 470], ["", 660, 360], ["Santa Terezinha", 600, 260]] }
  ];
  function smooth(pts) {
    var out = [], N = pts.length, i, st;
    for (i = 0; i < N - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(N - 1, i + 2)];
      out.push({ n: p1.n, x: p1.x, y: p1.y });
      var steps = Math.max(4, Math.round(Math.hypot(p2.x - p1.x, p2.y - p1.y) / 12));
      for (st = 1; st < steps; st++) {
        var t = st / steps, t2 = t * t, t3 = t2 * t;
        out.push({ n: "",
          x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
          y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3) });
      }
    }
    out.push({ n: pts[N - 1].n, x: pts[N - 1].x, y: pts[N - 1].y });
    return out;
  }
  LINES.forEach(function (ln) {
    ln.pts = smooth(ln.stops.map(function (s) { return { n: s[0], x: s[1], y: s[2] }; }));
    ln.cum = [0];
    for (var i = 1; i < ln.pts.length; i++) ln.cum[i] = ln.cum[i - 1] + Math.hypot(ln.pts[i].x - ln.pts[i - 1].x, ln.pts[i].y - ln.pts[i - 1].y);
    ln.L = ln.cum[ln.cum.length - 1];
    ln.named = ln.pts.map(function (p, i) { return p.n ? i : -1; }).filter(function (i) { return i >= 0; });
    ln.first = ln.pts[0].n; ln.last = ln.pts[ln.pts.length - 1].n;
  });
  function pointAt(ln, d) {
    for (var i = 0; i < ln.cum.length - 1; i++) {
      if (d <= ln.cum[i + 1] || i === ln.cum.length - 2) {
        var t = (d - ln.cum[i]) / (ln.cum[i + 1] - ln.cum[i]); t = Math.max(0, Math.min(1, t));
        return { x: ln.pts[i].x + (ln.pts[i + 1].x - ln.pts[i].x) * t, y: ln.pts[i].y + (ln.pts[i + 1].y - ln.pts[i].y) * t };
      }
    }
  }
  var OCC = ["Baixa", "Média", "Alta"];
  var BUSES = [];
  LINES.forEach(function (ln, li) {
    [0, 0.5].forEach(function (off, k) {
      var n = 3000 + li * 11 + k * 5 + 7;
      BUSES.push({ key: ln.id + "-" + k, line: ln, off: off + li * 0.13, veh: n, acc: (n % 2 === 0), occ: (n + k) % 3, ang: 0, shown: 999 });
    });
  });
  function updateBuses(simMin) {
    BUSES.forEach(function (b) {
      var ln = b.line, ph = (simMin / PERIOD + b.off) % 2;
      var u = ph < 1 ? ph : 2 - ph; b.dir = ph < 1 ? 1 : -1;
      var d = u * ln.L, p = pointAt(ln, d); b.x = p.x; b.y = p.y;
      var p2 = pointAt(ln, Math.max(0, Math.min(ln.L, d + b.dir * 14)));
      if (Math.abs(p2.x - p.x) + Math.abs(p2.y - p.y) > 0.01) b.ang = Math.atan2(p2.y - p.y, p2.x - p.x) * 180 / Math.PI;
      var idx = -1, i;
      if (b.dir > 0) { for (i = 0; i < ln.named.length; i++) if (ln.cum[ln.named[i]] > d + 0.5) { idx = ln.named[i]; break; } if (idx < 0) idx = ln.named[ln.named.length - 1]; }
      else { for (i = ln.named.length - 1; i >= 0; i--) if (ln.cum[ln.named[i]] < d - 0.5) { idx = ln.named[i]; break; } if (idx < 0) idx = ln.named[0]; }
      b.next = ln.pts[idx].n;
      var rem = Math.abs(ln.cum[idx] - d);
      b.eta = Math.max(1, Math.round(rem / ln.L * PERIOD));
      b.km = rem * KM;
      b.toward = b.dir > 0 ? ln.last : ln.first;
    });
  }
  function kmFmt(v) { return v.toFixed(1).replace(".", ","); }

  /* ---------- Ônibus 2,5D: modelo 3D simples, girado e projetado a cada quadro ---------- */
  var VK = { y: 0.62, z: 0.78 };
  var FOOT = [[24, -5], [24, 5], [19, 9.5], [-19, 9.5], [-24, 5], [-24, -5], [-19, -9.5], [19, -9.5]];
  var L1 = [-0.55, 0.45, 0.70], L2 = [0.3, 0.6, 0.74];
  var KC = { stripe: [232, 237, 243], glass: [36, 58, 85], wheel: [26, 32, 40], hub: [169, 180, 192], light: [255, 233, 160], tail: [229, 72, 77], ac: [237, 241, 245], sign: [15, 27, 40], bumper: [42, 51, 64] };
  var ALL3D = [];
  function hex2rgb(s) {
    s = s.replace("#", "").trim(); if (s.length === 3) s = s.replace(/./g, function (c) { return c + c; });
    return [parseInt(s.substr(0, 2), 16), parseInt(s.substr(2, 2), 16), parseInt(s.substr(4, 2), 16)];
  }
  function mkFace(pts, nrm, kind, bias) {
    var cx = 0, cy = 0, cz = 0; pts.forEach(function (p) { cx += p[0]; cy += p[1]; cz += p[2]; });
    return { pts: pts, n: nrm, kind: kind, bias: bias || 0, c: [cx / pts.length, cy / pts.length, cz / pts.length], decals: [] };
  }
  function prism(foot, z0, z1, kind, withTop, sc, bias) {
    var out = [], n = foot.length, f2 = foot.map(function (p) { return [p[0] * sc, p[1] * sc]; }), mx = 0, my = 0, i;
    f2.forEach(function (p) { mx += p[0] / n; my += p[1] / n; });
    for (i = 0; i < n; i++) {
      var a = f2[i], b = f2[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), nx = dy / len, ny = -dx / len;
      if (nx * ((a[0] + b[0]) / 2 - mx) + ny * ((a[1] + b[1]) / 2 - my) < 0) { nx = -nx; ny = -ny; }
      out.push(mkFace([[a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1], [a[0], a[1], z1]], [nx, ny, 0], kind, bias));
    }
    if (withTop) out.push(mkFace(f2.map(function (p) { return [p[0], p[1], z1]; }), [0, 0, 1], kind, (bias || 0) + 3));
    return out;
  }
  function quadX(x, y0, y1, z0, z1) { return [[x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1]]; }
  function quadY(y, x0, x1, z0, z1) { return [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]]; }
  function disc(x, y, z, r) { var o = []; for (var i = 0; i < 10; i++) { var a = i / 10 * Math.PI * 2; o.push([x + r * Math.cos(a), y, z + r * Math.sin(a)]); } return o; }
  function buildModel() {
    var low = prism(FOOT, 2, 7, "stripe", false, 0.985, 0);
    var up = prism(FOOT, 7, 16, "body", true, 1, 0.5);
    var roof = prism(FOOT, 16, 17, "body", true, 0.84, 1.2);
    var ac = prism([[-12, -4], [-12, 4], [5, 4], [5, -4]], 17, 19.2, "ac", true, 1, 4);
    var i, s, sd;
    // lados: 2 = direita (+y), 6 = esquerda (-y)
    [[2, 1], [6, -1]].forEach(function (pr) {
      var side = pr[1];
      for (i = 0; i < 5; i++) up[pr[0]].decals.push({ pts: quadY(side * 9.6, -17 + i * 7.15, -17 + i * 7.15 + 5.4, 9.3, 13.7), kind: "glass" });
      [14, -14].forEach(function (wx) {
        low[pr[0]].decals.push({ pts: disc(wx, side * 9.8, 3.4, 3.5), kind: "wheel" });
        low[pr[0]].decals.push({ pts: disc(wx, side * 9.9, 3.4, 1.4), kind: "hub" });
      });
    });
    up[0].decals.push({ pts: quadX(24.1, -4.2, 4.2, 8.6, 14.2), kind: "glass" });
    up[0].decals.push({ pts: quadX(24.1, -3.4, 3.4, 14.6, 15.7), kind: "sign" });
    up[1].decals.push({ pts: [[19.6, 9.9, 8.6], [23.6, 5.4, 8.6], [23.6, 5.4, 14.2], [19.6, 9.9, 14.2]], kind: "glass" });
    up[7].decals.push({ pts: [[19.6, -9.9, 8.6], [23.6, -5.4, 8.6], [23.6, -5.4, 14.2], [19.6, -9.9, 14.2]], kind: "glass" });
    up[4].decals.push({ pts: quadX(-24.1, -3.8, 3.8, 9.2, 13.4), kind: "glass" });
    low[0].decals.push({ pts: quadX(23.7, -4.4, -2.2, 3.4, 5.2), kind: "light", flat: true });
    low[0].decals.push({ pts: quadX(23.7, 2.2, 4.4, 3.4, 5.2), kind: "light", flat: true });
    low[0].decals.push({ pts: quadX(23.7, -4.8, 4.8, 2.1, 3.0), kind: "bumper" });
    low[4].decals.push({ pts: quadX(-23.7, -4.4, -2.2, 3.4, 5.2), kind: "tail", flat: true });
    low[4].decals.push({ pts: quadX(-23.7, 2.2, 4.4, 3.4, 5.2), kind: "tail", flat: true });
    return low.concat(up, roof, ac);
  }
  var MODEL = buildModel();
  function Bus3D(parent, colorVar) {
    var g = svg("g", {}, parent), pool = [], used = 0, body = [30, 100, 200];
    var shadow = svg("polygon", { fill: "#000", "fill-opacity": 0.22 }, g);
    function colors() { body = hex2rgb(getComputedStyle(document.documentElement).getPropertyValue(colorVar)); }
    colors(); ALL3D.push(colors);
    function el(i) { if (!pool[i]) pool[i] = svg("polygon", { "stroke-linejoin": "round", "stroke-width": 0.5 }, g); return pool[i]; }
    function set(ang) {
      var a = ang * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), items = [], i, f;
      for (i = 0; i < MODEL.length; i++) {
        f = MODEL[i];
        var nx = f.n[0] * c - f.n[1] * s, ny = f.n[0] * s + f.n[1] * c;
        if (ny * VK.y + f.n[2] * VK.z <= 0.01) continue;
        items.push({ f: f, nx: nx, ny: ny, d: (f.c[0] * s + f.c[1] * c) * VK.y + f.c[2] * VK.z + f.bias });
      }
      items.sort(function (p, q) { return p.d - q.d; });
      var sp = "";
      for (i = 0; i < FOOT.length; i++) { var q = FOOT[i]; sp += (q[0] * c - q[1] * s + 7).toFixed(1) + "," + ((q[0] * s + q[1] * c) * VK.y + 5).toFixed(1) + " "; }
      shadow.setAttribute("points", sp);
      var n = 0;
      function draw(pts, kind, sh, flat) {
        var p = el(n++), str = "", r;
        for (var k = 0; k < pts.length; k++) { var v = pts[k]; str += (v[0] * c - v[1] * s).toFixed(1) + "," + ((v[0] * s + v[1] * c) * VK.y - v[2] * VK.z).toFixed(1) + " "; }
        r = kind === "body" ? body : KC[kind]; if (flat) sh = 1;
        var col = "rgb(" + Math.min(255, Math.round(r[0] * sh)) + "," + Math.min(255, Math.round(r[1] * sh)) + "," + Math.min(255, Math.round(r[2] * sh)) + ")";
        p.setAttribute("points", str); p.setAttribute("fill", col); p.setAttribute("stroke", col);
        if (p._h) { p.removeAttribute("display"); p._h = false; }
      }
      items.forEach(function (it) {
        var sh = 0.58 + 0.30 * Math.max(0, it.nx * L1[0] + it.ny * L1[1] + it.f.n[2] * L1[2]) + 0.16 * Math.max(0, it.nx * L2[0] + it.ny * L2[1] + it.f.n[2] * L2[2]);
        draw(it.f.pts, it.f.kind, sh, false);
        it.f.decals.forEach(function (dc) { draw(dc.pts, dc.kind, sh, dc.flat); });
      });
      for (i = n; i < pool.length; i++) if (!pool[i]._h) { pool[i].setAttribute("display", "none"); pool[i]._h = true; }
    }
    return { set: set };
  }

  /* ---------- Mapa grande, com câmera que segue o ônibus ---------- */
  var map = $("#mapa"), worldImg = $("#worldimg");
  function cv(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  /* As ruas, o rio e os parques viram uma imagem fixa: mover o mapa vira só um deslocamento, sem redesenhar centenas de linhas. */
  function buildWorld() {
    var S = svg("svg", { viewBox: "-100 -100 1000 1140", width: 1000, height: 1140 });
    var defs = svg("defs", {}, S), clip = svg("clipPath", { id: "cc" }, defs); svg("ellipse", { cx: 390, cy: 456, rx: 300, ry: 220 }, clip);
    svg("rect", { x: -200, y: -200, width: W + 400, height: H + 400, fill: cv("--map") }, S);
    svg("ellipse", { cx: 700, cy: 120, rx: 90, ry: 56, fill: cv("--park") }, S);
    svg("ellipse", { cx: 110, cy: 800, rx: 96, ry: 64, fill: cv("--park") }, S);
    svg("ellipse", { cx: 440, cy: 880, rx: 60, ry: 32, fill: cv("--park") }, S);
    function layer(parent) {
      return {
        e: svg("g", { fill: "none", stroke: cv("--edge"), "stroke-width": 8, "stroke-linecap": "round", "stroke-linejoin": "round" }, parent),
        f: svg("g", { fill: "none", stroke: cv("--street"), "stroke-width": 5.4, "stroke-linecap": "round", "stroke-linejoin": "round" }, parent)
      };
    }
    function street(L, d, w) {
      var a = svg("path", { d: d }, L.e), b = svg("path", { d: d }, L.f);
      if (w) { a.setAttribute("stroke-width", w + 3); b.setAttribute("stroke-width", w); }
    }
    var R = rng(20261009), base = layer(S);
    for (var si = 0; si < 90; si++) {
      var x = R() * 920 - 60, y = R() * 1060 - 60, a = (si % 2 ? 0.45 : 2.0) + (R() - 0.5) * 0.9, d = "M" + x.toFixed(0) + " " + y.toFixed(0);
      for (var k = 0; k < 8; k++) { a += (R() - 0.5) * 0.55; x += Math.cos(a) * 36; y += Math.sin(a) * 36; d += " L" + x.toFixed(0) + " " + y.toFixed(0); }
      street(base, d, 0);
    }
    var gridClip = svg("g", { "clip-path": "url(#cc)" }, S), gridRot = svg("g", { transform: "rotate(36 390 456)" }, gridClip), grid = layer(gridRot);
    for (var gi = -440; gi <= 440; gi += 44) {
      street(grid, "M" + (390 + gi) + " 0 L" + (390 + gi) + " 920", 0);
      street(grid, "M-60 " + (456 + gi) + " L860 " + (456 + gi), 0);
    }
    var maj = layer(S);
    street(maj, "M-20 660 C 180 580, 400 660, 820 500", 13);
    street(maj, "M240 -20 C 300 240, 280 520, 380 960", 13);
    street(maj, "M-20 380 C 240 340, 520 400, 820 240", 11);
    svg("path", { d: "M-20 210 C 160 250, 250 380, 336 472 S 570 660, 820 810", fill: "none", stroke: cv("--rio"), "stroke-width": 40, "stroke-linecap": "round" }, S);
    var rt = svg("text", { x: 40, y: 236, transform: "rotate(14 40 236)", "font-family": "Figtree, Arial, sans-serif", "font-weight": 800, "font-size": 15, "letter-spacing": 3, fill: cv("--label"), stroke: cv("--map"), "stroke-width": 4, "paint-order": "stroke" }, S); rt.textContent = "RIO MURIAÉ";
    worldImg.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(S));
  }
  buildWorld();
  function themeChanged() { buildWorld(); ALL3D.forEach(function (f) { f(); }); }
  var mqDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
  if (mqDark && mqDark.addEventListener) mqDark.addEventListener("change", themeChanged);
  new MutationObserver(themeChanged).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  var routeEls = {}, busEls = {}, pinEls = {};
  LINES.forEach(function (ln) {
    var dd = ln.pts.map(function (p, i) { return (i ? "L" : "M") + p.x + " " + p.y; }).join(" ");
    var g = svg("g", {}, map);
    var cas = svg("path", { d: dd, fill: "none", stroke: "var(--surface)", "stroke-width": 16, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
    var path = svg("path", { d: dd, fill: "none", "stroke-width": 10, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
    path.style.stroke = "var(" + ln.color + ")";
    var flow = svg("path", { d: dd, class: "flow" }, g); flow.style.display = "none";
    routeEls[ln.id] = { g: g, line: path, cas: cas, flow: flow };
  });
  LINES.forEach(function (ln) {
    ln.pts.forEach(function (p) {
      if (!p.n) return;
      if (pinEls[p.n]) { pinEls[p.n].lines.push(ln.id); return; }
      var isR = p.n === "Rodoviária";
      var g = svg("g", {}, map);
      var pin = svg("g", { transform: "translate(" + p.x + " " + p.y + ") scale(1.5)" }, g);
      svg("path", { d: "M0 0 C-5 -7, -9 -10, -9 -15 A9 9 0 1 1 9 -15 C9 -10, 5 -7, 0 0 Z", fill: isR ? "var(--accent)" : "var(--pin)", stroke: isR ? "#0D3B3A" : "none", "stroke-width": 1.8 }, pin);
      svg("circle", { cx: 0, cy: -15, r: isR ? 4.2 : 3.4, fill: isR ? "#0D3B3A" : "#fff" }, pin);
      var right = p.x > 520;
      var t = svg("text", { x: p.x + (right ? -22 : 22), y: p.y - 18, class: "maptext", "text-anchor": right ? "end" : "start" }, g);
      t.textContent = p.n.toUpperCase();
      pinEls[p.n] = { g: g, lines: [ln.id] };
    });
  });
  var sel = "101-0", filter = "101", arts = {};
  BUSES.forEach(function (b) {
    var g = svg("g", { class: "bus", tabindex: 0, role: "button", "aria-label": "Linha " + b.line.id + ", veículo " + b.veh }, map);
    var ring = svg("ellipse", { class: "ring", cx: 4, cy: 4, rx: 40, ry: 16 }, g); ring.style.stroke = "var(" + b.line.color + ")";
    var inner = svg("g", { class: "inner" }, g);
    arts[b.key] = Bus3D(inner, b.line.color);
    var tag = svg("g", { class: "tag", transform: "translate(0 -36) scale(1.2)" }, inner);
    var tr = svg("rect", { x: -17, y: -9.5, width: 34, height: 19, rx: 9.5, fill: "var(--surface)", "stroke-width": 2.8 }, tag); tr.style.stroke = "var(" + b.line.color + ")";
    svg("path", { d: "M-3.5 8.5 L0 13.5 L3.5 8.5 Z", fill: "var(--surface)" }, tag);
    var t = svg("text", { x: 0, y: 4.6, "text-anchor": "middle", style: "font:500 12.5px var(--font-mono);fill:var(--ink)" }, tag); t.textContent = b.line.id;
    g.addEventListener("click", function () { select(b.key); });
    g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(b.key); } });
    busEls[b.key] = g;
  });

  /* câmera */
  var cam = { x: 390, y: 456, z: 340, follow: true };
  var lastS = 0;
  function applyCam() {
    var cw = map.clientWidth || 400, ch = map.clientHeight || 500, w = cam.z, hh = cam.z * ch / cw;
    var x = w >= W + 80 ? (W - w) / 2 : Math.max(-40, Math.min(W + 40 - w, cam.x - w / 2));
    var y = hh >= H + 80 ? (H - hh) / 2 : Math.max(-40, Math.min(H + 40 - hh, cam.y - hh / 2));
    map.setAttribute("viewBox", x.toFixed(1) + " " + y.toFixed(1) + " " + w.toFixed(1) + " " + hh.toFixed(1));
    var s = cw / w;
    if (Math.abs(s - lastS) > 0.002) { lastS = s; worldImg.style.width = (1000 * s).toFixed(1) + "px"; worldImg.style.height = (1140 * s).toFixed(1) + "px"; }
    worldImg.style.transform = "translate3d(" + ((-100 - x) * s).toFixed(1) + "px," + ((-100 - y) * s).toFixed(1) + "px,0)";
  }
  function setFollow(on) { cam.follow = on; $("#z-follow").setAttribute("aria-pressed", on ? "true" : "false"); }
  var drag = null, moved = false, ptrs = {}, pinch = null;
  function nPtr() { return Object.keys(ptrs).length; }
  map.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button > 0) return;
    ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (nPtr() === 1) { drag = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y }; moved = false; }
    else if (nPtr() === 2) { var k = Object.keys(ptrs), a = ptrs[k[0]], b = ptrs[k[1]]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: cam.z }; drag = null; moved = true; }
  });
  window.addEventListener("pointermove", function (e) {
    if (!ptrs[e.pointerId]) return;
    ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (pinch && nPtr() >= 2) {
      var k = Object.keys(ptrs), a = ptrs[k[0]], b = ptrs[k[1]], d = Math.max(10, Math.hypot(a.x - b.x, a.y - b.y));
      cam.z = Math.max(150, Math.min(900, pinch.z * pinch.d / d)); applyCam(); return;
    }
    if (!drag) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!moved && Math.hypot(dx, dy) < 6) return;
    moved = true; var kk = cam.z / (map.clientWidth || 400);
    cam.x = drag.cx - dx * kk; cam.y = drag.cy - dy * kk; setFollow(false); applyCam();
  });
  function endPtr(e) { delete ptrs[e.pointerId]; if (nPtr() < 2) pinch = null; if (nPtr() === 0) drag = null; }
  window.addEventListener("pointerup", endPtr); window.addEventListener("pointercancel", endPtr);
  map.addEventListener("click", function (e) { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
  map.addEventListener("wheel", function (e) { e.preventDefault(); cam.z = Math.max(150, Math.min(900, cam.z * Math.exp(e.deltaY * 0.0015))); applyCam(); }, { passive: false });
  $("#z-in").addEventListener("click", function () { cam.z = Math.max(160, cam.z * 0.75); applyCam(); });
  $("#z-out").addEventListener("click", function () { cam.z = Math.min(900, cam.z * 1.35); applyCam(); });
  $("#z-follow").addEventListener("click", function () { setFollow(!cam.follow); if (cam.follow) jumpToSel(); });
  window.addEventListener("resize", applyCam);
  function curBus() { return BUSES.filter(function (x) { return x.key === sel; })[0]; }
  function jumpToSel() { var b = curBus(); if (b && b.x != null) { cam.x = b.x; cam.y = b.y; } applyCam(); }

  /* ---------- Painel, barra flutuante, seletor de linha e lista ---------- */
  var lista = $("#lista"), info = $("#info"), alerts = {};
  function chip(label, color, pressed, onclick) {
    var c = h("button", { class: "chip", type: "button", "aria-pressed": pressed ? "true" : "false" });
    if (color) { var d = h("span", { class: "dot" }); d.style.color = "var(" + color + ")"; c.appendChild(d); }
    c.appendChild(document.createTextNode(label)); c.addEventListener("click", onclick); return c;
  }
  var rowEls = {};
  BUSES.forEach(function (b) {
    var r = h("button", { class: "row", type: "button", "aria-pressed": "false" });
    var bd = h("span", { class: "badge" }, b.line.id); bd.style.setProperty("--c", "var(" + b.line.color + ")");
    var w = h("span", { class: "what" }); var a = h("span", null, "Veículo " + b.veh); var s = h("span", { class: "small muted" }); w.appendChild(a); w.appendChild(s);
    var m = h("span", { class: "min" });
    r.appendChild(bd); r.appendChild(w); r.appendChild(m);
    r.addEventListener("click", function () { select(b.key); window.scrollTo({ top: 0 }); });
    lista.appendChild(r); rowEls[b.key] = { row: r, sub: s, min: m };
  });
  var ORDER = ["all", "101", "102", "103", "104"];
  function drawChips() {
    var box = $("#lsel"); box.textContent = "";
    ORDER.forEach(function (f) {
      var ln = LINES.filter(function (l) { return l.id === f; })[0];
      var c = h("button", { class: "lchip" + (ln ? "" : " all"), type: "button", "aria-pressed": filter === f ? "true" : "false" });
      var bd = h("span", { class: "badge" }, ln ? ln.id : "Todas"); if (ln) bd.style.setProperty("--c", "var(" + ln.color + ")");
      var nm = h("span", { class: "nm" }); nm.appendChild(h("b", null, ln ? "Linha " + ln.id : "Ver tudo")); nm.appendChild(h("span", null, ln ? ln.name : "Todas as linhas juntas"));
      c.appendChild(bd); c.appendChild(nm);
      c.addEventListener("click", function () { setFilter(f); });
      box.appendChild(c);
    });
  }
  function setFilter(f) {
    filter = f;
    if (f !== "all" && sel.split("-")[0] !== f) sel = f + "-0";
    cam.z = f === "all" ? 620 : 340;
    applyFilter(); drawInfo(); drawChips(); setFollow(true); jumpToSel();
  }
  $("#fb-alt").addEventListener("click", function () { setFilter(ORDER[(ORDER.indexOf(filter) + 1) % ORDER.length]); });
  function applyFilter() {
    var n = 0, ln0 = null;
    BUSES.forEach(function (b) {
      var on = filter === "all" || filter === b.line.id; if (on) n++;
      busEls[b.key].style.display = on ? "" : "none";
      rowEls[b.key].row.hidden = !on;
    });
    LINES.forEach(function (ln) {
      var on = filter === "all" || filter === ln.id, strong = filter === ln.id, r = routeEls[ln.id];
      if (strong) ln0 = ln;
      r.line.setAttribute("stroke-width", strong ? 12 : on ? 10 : 5); r.cas.setAttribute("stroke-width", strong ? 19 : on ? 16 : 9);
      r.g.style.opacity = on ? 1 : 0.28; r.flow.style.display = strong ? "" : "none";
    });
    for (var nm in pinEls) {
      var p = pinEls[nm], on2 = filter === "all" || p.lines.indexOf(filter) >= 0;
      p.g.style.display = on2 ? "" : "none";
    }
    $("#fb-text").textContent = ln0 ? "Linha " + ln0.id + " · " + ln0.name : "Todas as linhas · " + n + " ônibus";
    $(".floatbar .gd").style.background = ln0 ? "var(" + ln0.color + ")" : "var(--green)";
  }
  function select(key) { SND.select(); sel = key; drawInfo(); busEls[key].parentNode.appendChild(busEls[key]); setFollow(true); jumpToSel(); }
  function meter(level) {
    var m = h("span", { class: "meter", role: "img", "aria-label": "Lotação " + OCC[level].toLowerCase() });
    for (var i = 0; i < 3; i++) m.appendChild(h("b", i <= level ? { class: "on" } : null));
    return m;
  }
  var ICON_BELL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>';
  var ICON_ROUTE = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/></svg>';
  function drawInfo() {
    var b = curBus();
    info.innerHTML =
      '<div class="handle"></div>' +
      '<div class="sum"><span id="s-eta"></span><span id="s-km"></span></div>' +
      '<div class="vcard"><span class="ctag">Urbano</span>' +
      '<div class="vl"><div class="vt">Linha ' + b.line.id + '</div><div class="vs">' + b.line.name + '</div><div class="vs" id="i-dir"></div></div>' +
      '<svg class="art" id="i-art" viewBox="-36 -32 72 56" aria-hidden="true"></svg>' +
      '<hr>' +
      '<div class="drv"><span class="av" aria-hidden="true">M</span><div class="dn"><b>Marcos (exemplo)</b><span class="muted small">★ 4,8 · Viação Exemplo</span></div>' +
      '<button class="rbtn" id="b-alert" type="button" aria-label="Avisar quando o ônibus estiver chegando" aria-pressed="' + (alerts[b.key] ? "true" : "false") + '">' + ICON_BELL + '</button>' +
      '<button class="rbtn" id="b-line" type="button" aria-label="Ver só esta linha" aria-pressed="' + (filter === b.line.id ? "true" : "false") + '">' + ICON_ROUTE + '</button></div></div>' +
      '<div class="nextrow"><div><span class="lbl">Próxima parada</span><b id="i-next"></b></div><div class="pillrow" id="i-pills"></div></div>';
    Bus3D($("#i-art"), b.line.color).set(38);
    var pr = $("#i-pills");
    pr.appendChild(h("span", { class: b.acc ? "pill-t" : "pill-t warn" }, b.acc ? "Com rampa" : "Sem rampa"));
    var lot = h("span", { class: b.occ === 2 ? "pill-t warn" : "pill-t" }); lot.appendChild(document.createTextNode("Lotação " + OCC[b.occ].toLowerCase() + " ")); lot.appendChild(meter(b.occ)); pr.appendChild(lot);
    pr.appendChild(h("span", { class: "pill-t neutral" }, "Veículo " + b.veh));
    $("#b-alert").addEventListener("click", function () {
      alerts[b.key] = !alerts[b.key]; this.setAttribute("aria-pressed", alerts[b.key] ? "true" : "false"); b.notified = false;
      SND.pop(); toast(alerts[b.key] ? "Aviso ligado. Você será avisado quando faltar 2 min (simulado)." : "Aviso desligado.");
    });
    $("#b-line").addEventListener("click", function () { setFilter(filter === b.line.id ? "all" : b.line.id); });
    info.classList.remove("enter"); void info.offsetWidth; info.classList.add("enter");
    tickInfo();
  }
  function tickInfo() {
    var cur = curBus(), e = $("#s-eta");
    if (!e) return;
    e.textContent = cur.eta + " min"; $("#s-km").textContent = kmFmt(cur.km) + " km";
    $("#i-next").textContent = cur.next; $("#i-dir").textContent = "Sentido " + cur.toward;
  }
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function tick(simMin, dt) {
    updateBuses(simMin);
    var ka = 1 - Math.exp(-dt * 9), mapOn = !$("#p-mapa").hidden;
    BUSES.forEach(function (b) {
      var vis = filter === "all" || filter === b.line.id;
      if (b.shown === 999) b.shown = b.ang;
      var diff = ((b.ang - b.shown + 540) % 360) - 180;
      b.shown = ((b.shown + diff * ka + 180) % 360 + 360) % 360 - 180;
      if (mapOn && vis) {
        busEls[b.key].setAttribute("transform", "translate(" + b.x.toFixed(1) + " " + b.y.toFixed(1) + ")");
        arts[b.key].set(b.shown);
        var cls = b.key === sel ? "bus sel" : "bus";
        if (b._cls !== cls) { b._cls = cls; busEls[b.key].setAttribute("class", cls); }
      }
      var r = rowEls[b.key]; var pr = b.key === sel ? "true" : "false";
      if (r.row.getAttribute("aria-pressed") !== pr) r.row.setAttribute("aria-pressed", pr);
      var s1 = "Próxima: " + b.next + " · sentido " + b.toward; if (r.sub.textContent !== s1) r.sub.textContent = s1;
      var s2 = b.eta + " min"; if (r.min.textContent !== s2) r.min.textContent = s2;
      if (alerts[b.key]) {
        if (b.eta <= 2 && !b.notified) { b.notified = true; SND.bell(); vib(80); toast("Linha " + b.line.id + " chega em " + b.next + " em " + b.eta + " min"); }
        else if (b.eta > 3) b.notified = false;
      }
    });
    if (cam.follow) { var c = curBus(), k = reduce ? 1 : 1 - Math.exp(-dt * 6); cam.x += (c.x - cam.x) * k; cam.y += (c.y - cam.y) * k; }
    if (mapOn) applyCam();
    tickInfo();
  }
  var start = performance.now(), lastT = start;
  function simNow() { return (performance.now() - start) / 1000 * SPEED / 60 + 3; }
  drawChips(); applyFilter(); updateBuses(simNow()); drawInfo(); jumpToSel(); tick(simNow(), 1);
  if (reduce) { setInterval(function () { tick(simNow(), 2); }, 1500); }
  else { (function loop(t) { var dt = Math.min(0.1, Math.max(0.001, (t - lastT) / 1000)); lastT = t; tick(simNow(), dt); requestAnimationFrame(loop); })(start); }

  /* ---------- Abertura ---------- */
  var spBus = Bus3D($("#sp-art"), "--accent"), spA = 30, spLast = performance.now();
  (function spin(t) { if ($("#splash").hidden) return; spA += Math.min(0.1, (t - spLast) / 1000) * 30; spLast = t; spBus.set(spA); requestAnimationFrame(spin); })(performance.now());
  var guard = [$("#hd"), $("#mn"), $("#nv")];
  guard.forEach(function (el) { el.inert = true; });
  function closeSplash() { $("#splash").hidden = true; guard.forEach(function (el) { el.inert = false; }); applyCam(); }
  $("#sp-go").addEventListener("click", function () { SND.start(); closeSplash(); if (!logged()) openAuth({}); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("#splash").hidden) closeSplash(); });
  try { $("#sp-go").focus(); } catch (e) {}

  /* ---------- Horários ---------- */
  var gd = new Date().getDay();
  var hs = { line: LINES[0], day: gd === 0 ? "dom" : gd === 6 ? "sab" : "util", dir: 1, pick: null };
  var DAYS = { util: ["Dia útil", 5 * 60 + 30, 22 * 60 + 30, 30], sab: ["Sábado", 6 * 60, 21 * 60 + 20, 40], dom: ["Domingo", 7 * 60, 20 * 60, 60] };
  function deps() {
    var d = DAYS[hs.day], out = [], shift = hs.dir > 0 ? 0 : 15;
    for (var m = d[1] + shift; m <= d[2] + shift; m += d[3]) out.push(m);
    return out;
  }
  function radio(box, items, cur, set) {
    box.textContent = "";
    items.forEach(function (it) {
      var c = h("button", { class: "chip", type: "button", role: "radio", "aria-checked": it[0] === cur ? "true" : "false" }, it[1]);
      c.addEventListener("click", function () { set(it[0]); }); box.appendChild(c);
    });
  }
  function drawHorarios() {
    var hl = $("#h-linhas"); hl.textContent = "";
    LINES.forEach(function (ln) { hl.appendChild(chip("Linha " + ln.id, ln.color, hs.line === ln, function () { hs.line = ln; hs.pick = null; drawHorarios(); })); });
    radio($("#h-dia"), [["util", "Dia útil"], ["sab", "Sábado"], ["dom", "Domingo"]], hs.day, function (v) { hs.day = v; hs.pick = null; drawHorarios(); });
    radio($("#h-sentido"), [[1, "Saindo de " + hs.line.first], [-1, "Saindo de " + hs.line.last]], hs.dir, function (v) { hs.dir = v; hs.pick = null; drawHorarios(); });
    $("#h-titulo").textContent = "Linha " + hs.line.id + " · " + hs.line.name;
    var list = deps(), now = new Date(), nm = now.getHours() * 60 + now.getMinutes();
    var isToday = ((now.getDay() === 0 ? "dom" : now.getDay() === 6 ? "sab" : "util") === hs.day);
    var nextIdx = isToday ? list.findIndex(function (m) { return m >= nm; }) : 0;
    if (hs.pick == null || list.indexOf(hs.pick) < 0) hs.pick = nextIdx >= 0 ? list[nextIdx] : list[0];
    var box = $("#h-times"); box.textContent = "";
    list.forEach(function (m) {
      var cls = "time"; if (isToday && m < nm) cls += " past"; if (m === hs.pick) cls += " next";
      var b = h("button", { class: cls, type: "button", "aria-pressed": m === hs.pick ? "true" : "false" }, hhmm(m));
      b.addEventListener("click", function () { hs.pick = m; drawHorarios(); }); box.appendChild(b);
    });
    var from = hs.dir > 0 ? hs.line.first : hs.line.last;
    $("#h-paradas-titulo").textContent = "Saindo de " + from + " às " + hhmm(hs.pick);
    var rows = $("#h-paradas"); rows.textContent = "";
    var ln = hs.line, order = ln.named.slice(); if (hs.dir < 0) order.reverse();
    order.forEach(function (i) {
      var off = (hs.dir > 0 ? ln.cum[i] : ln.L - ln.cum[i]) / ln.L * PERIOD;
      var r = h("div", { class: "row", style: "grid-template-columns:1fr auto" });
      r.appendChild(h("span", { style: "font-weight:700" }, ln.pts[i].n)); r.appendChild(h("span", { style: "font-family:var(--font-mono);font-weight:500;font-size:1.05rem" }, hhmm(hs.pick + off)));
      rows.appendChild(r);
    });
  }

  /* ---------- Passagens (reserva simulada, com calendário) ---------- */
  var ALL = [0, 1, 2, 3, 4, 5, 6], WD = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  var DEST = [
    { n: "Juiz de Fora", uf: "MG", dur: "2h30", days: ALL, deps: ["05:30", "07:00", "09:30", "12:00", "15:00", "18:00"] },
    { n: "Rio de Janeiro", uf: "RJ", dur: "5h30", days: ALL, deps: ["06:00", "10:30", "14:00", "22:30"] },
    { n: "Belo Horizonte", uf: "MG", dur: "6h30", days: [0, 1, 3, 5], deps: ["07:30", "13:00", "21:30"] },
    { n: "São Paulo", uf: "SP", dur: "9h30", days: [0, 2, 4, 5], deps: ["19:30", "21:00"] },
    { n: "Ubá", uf: "MG", dur: "1h20", days: [1, 2, 3, 4, 5, 6], deps: ["06:30", "08:30", "11:00", "13:30", "16:30", "19:00"] },
    { n: "Cataguases", uf: "MG", dur: "1h40", days: [1, 2, 3, 4, 5, 6], deps: ["06:00", "09:00", "12:30", "17:00"] },
    { n: "Leopoldina", uf: "MG", dur: "1h30", days: [2, 4, 6], deps: ["07:00", "10:00", "14:30", "18:30"] },
    { n: "Carangola", uf: "MG", dur: "1h10", days: [1, 2, 3, 4, 5], deps: ["06:15", "09:45", "13:15", "17:45"] },
    { n: "Itaperuna", uf: "RJ", dur: "1h50", days: [1, 2, 3, 4, 5, 6], deps: ["06:30", "11:30", "16:00"] },
    { n: "Campos dos Goytacazes", uf: "RJ", dur: "3h30", days: [1, 3, 5], deps: ["07:00", "14:00"] },
    { n: "Manhuaçu", uf: "MG", dur: "3h00", days: [1, 2, 3, 4, 5], deps: ["06:00", "13:30"] },
    { n: "Miraí", uf: "MG", dur: "0h50", days: ALL, deps: ["07:10", "12:00", "17:30"] }
  ];
  var COMP = ["Viação Exemplo A", "Viação Exemplo B", "Viação Exemplo C"];
  var rs = { dest: null, date: null, trip: null, seat: null, month: null };
  var reservas = cleanReservas(store("mre-reservas"));
  function dayStart(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  var TODAY = dayStart(new Date());
  function iso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function longDate(d) { return d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }); }
  function daysLabel(dest) {
    var s = dest.days.join();
    if (dest.days.length === 7) return "Todos os dias";
    if (s === "1,2,3,4,5,6") return "Seg a sáb";
    if (s === "1,2,3,4,5") return "Seg a sex";
    return dest.days.map(function (i) { return WD[i]; }).join(", ");
  }
  function tripKey(dest, d, t) { return dest.n + "|" + iso(d) + "|" + t; }
  function durMin(s) { var m = /(\d+)h(\d+)?/.exec(s); return m ? +m[1] * 60 + (+m[2] || 0) : 0; }
  function arrival(t, dur) { var a = toMin(t) + durMin(dur); return hhmm(a) + (a >= 1440 ? " (+1)" : ""); }
  function taken(dest, d, t) {
    var key = tripKey(dest, d, t), rnd = rng(hash(key)), set = {};
    for (var s = 1; s <= 40; s++) if (rnd() < 0.35) set[s] = 1;
    reservas.forEach(function (r) { if (r.key === key) set[r.seat] = 1; });
    return set;
  }
  function freeSeats(dest, d, t) { return 40 - Object.keys(taken(dest, d, t)).length; }
  function runsOn(dest, d) { return dest.days.indexOf(d.getDay()) >= 0; }
  function leftTrips(dest, d) {
    if (!runsOn(dest, d) || d < TODAY) return [];
    var now = new Date(), nm = now.getHours() * 60 + now.getMinutes(), today = iso(d) === iso(TODAY);
    return dest.deps.filter(function (t) { return !(today && toMin(t) <= nm); });
  }
  function dayInfo(dest, d) {
    if (d < TODAY) return { s: "past" };
    if (!runsOn(dest, d)) return { s: "none" };
    var tr = leftTrips(dest, d);
    if (!tr.length) return { s: "none", gone: true };
    var free = 0; tr.forEach(function (t) { free += freeSeats(dest, d, t); });
    var cap = 40 * tr.length;
    return { s: free === 0 ? "full" : free / cap < 0.3 ? "few" : "ok", n: tr.length, free: free };
  }
  var STEPS = ["Destino", "Data", "Poltrona", "Reserva"];
  function steps(cur) {
    var box = $("#r-steps"); box.textContent = "";
    STEPS.forEach(function (n, i) { box.appendChild(h("div", { class: "step" + (i < cur ? " done" : i === cur ? " cur" : "") }, n)); });
  }
  var PANELS = ["r-dest", "r-cal", "r-poltrona", "r-ok"];
  function show(id) {
    PANELS.forEach(function (x) { $("#" + x).hidden = x !== id; });
    steps(PANELS.indexOf(id));
  }

  function drawDest() {
    var q = $("#r-q").value.trim().toLowerCase(), box = $("#r-destlist"); box.textContent = "";
    var list = DEST.filter(function (d) { return !q || d.n.toLowerCase().indexOf(q) >= 0; });
    if (!list.length) { box.appendChild(h("p", { class: "muted", style: "padding:16px" }, "Nenhuma cidade encontrada.")); return; }
    list.forEach(function (d) {
      var b = h("button", { class: "dest", type: "button" });
      b.appendChild(h("b", null, d.n));
      b.appendChild(h("span", { class: "sub" }, d.uf + " · " + d.dur + " de viagem · " + brl(ticketPrice(d))));
      b.appendChild(h("span", { class: "dd" }, daysLabel(d)));
      b.addEventListener("click", function () { chooseDest(d); });
      box.appendChild(b);
    });
  }
  $("#r-q").addEventListener("input", drawDest);

  function chooseDest(d) {
    rs.dest = d; rs.date = null;
    for (var i = 0; i < 90; i++) { var x = new Date(TODAY); x.setDate(x.getDate() + i); if (dayInfo(d, x).s === "ok" || dayInfo(d, x).s === "few") { rs.date = x; break; } }
    rs.month = new Date((rs.date || TODAY).getFullYear(), (rs.date || TODAY).getMonth(), 1);
    $("#r-dtitulo").textContent = "Muriaé → " + d.n;
    $("#r-dsub").textContent = d.uf + " · " + d.dur + " de viagem · " + daysLabel(d);
    drawCal(); drawTrips(); show("r-cal"); window.scrollTo(0, 0);
  }
  function drawCal() {
    var m = rs.month, y = m.getFullYear(), mo = m.getMonth();
    $("#c-mes").textContent = m.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    var cur = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
    $("#c-prev").disabled = m <= cur;
    $("#c-next").disabled = (y * 12 + mo) >= (cur.getFullYear() * 12 + cur.getMonth() + 3);
    var g = $("#c-grid"); g.textContent = "";
    ["D", "S", "T", "Q", "Q", "S", "S"].forEach(function (w, i) { g.appendChild(h("span", { class: "wd", "aria-hidden": "true" }, w)); });
    var first = new Date(y, mo, 1).getDay(), n = new Date(y, mo + 1, 0).getDate(), i;
    for (i = 0; i < first; i++) g.appendChild(h("span"));
    for (i = 1; i <= n; i++) {
      (function (day) {
        var d = new Date(y, mo, day), inf = dayInfo(rs.dest, d), isSel = rs.date && iso(rs.date) === iso(d);
        var cls = "cd " + inf.s + (iso(d) === iso(TODAY) ? " today" : "");
        var b = h("button", { class: cls, type: "button", "aria-pressed": isSel ? "true" : "false" });
        var lab = longDate(d) + ". ";
        if (inf.s === "past") lab += "Dia que já passou."; else if (inf.s === "none") lab += inf.gone ? "Hoje não tem mais saída." : "Sem viagem."; else if (inf.s === "full") lab += "Lotado."; else lab += inf.n + (inf.n > 1 ? " saídas" : " saída") + ", " + inf.free + " vagas.";
        b.setAttribute("aria-label", lab);
        b.disabled = inf.s === "past" || inf.s === "none" || inf.s === "full";
        b.appendChild(h("span", null, String(day))); b.appendChild(h("i"));
        b.addEventListener("click", function () { rs.date = d; drawCal(); drawTrips(); var t = $("#r-titulo"); t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); });
        g.appendChild(b);
      })(i);
    }
  }
  $("#c-prev").addEventListener("click", function () { rs.month = new Date(rs.month.getFullYear(), rs.month.getMonth() - 1, 1); drawCal(); });
  $("#c-next").addEventListener("click", function () { rs.month = new Date(rs.month.getFullYear(), rs.month.getMonth() + 1, 1); drawCal(); });
  function drawTrips() {
    var box = $("#r-viagens"); box.textContent = "";
    if (!rs.date) { $("#r-titulo").textContent = "Escolha um dia no calendário"; box.hidden = true; return; }
    box.hidden = false;
    $("#r-titulo").textContent = "Saídas · " + longDate(rs.date);
    var left = leftTrips(rs.dest, rs.date);
    rs.dest.deps.forEach(function (t, i) {
      var gone = left.indexOf(t) < 0;
      if (gone && !runsOn(rs.dest, rs.date)) return;
      var free = freeSeats(rs.dest, rs.date, t);
      var b = h("button", { class: "trip", type: "button" }); b.disabled = gone || free === 0;
      var l = h("span"); l.appendChild(h("div", { class: "hr" }, t)); l.appendChild(h("div", { class: "arr" }, "chega " + arrival(t, rs.dest.dur)));
      b.appendChild(l);
      var w = h("span", { style: "display:flex;flex-direction:column;min-width:0" });
      w.appendChild(h("span", { style: "font-weight:700" }, COMP[(hash(rs.dest.n) + i) % 3]));
      var tags = h("span", { class: "tags" });
      tags.appendChild(h("span", { class: i % 2 ? "tg blue" : "tg" }, i % 2 ? "Executivo" : "Convencional"));
      tags.appendChild(h("span", { class: "tg" }, "Plataforma " + (1 + (hash(rs.dest.n + t) % 6))));
      tags.appendChild(h("span", { class: "tg blue" }, brl(ticketPrice(rs.dest))));
      w.appendChild(tags); b.appendChild(w);
      b.appendChild(h("span", { class: "small", style: "font-weight:700;text-align:right;color:" + (gone ? "var(--muted)" : free < 8 ? "var(--amber)" : "var(--green)") }, gone ? "Já saiu" : free === 0 ? "Lotado" : free + " livres"));
      b.addEventListener("click", function () { rs.trip = { t: t, i: i }; rs.seat = null; drawSeats(); show("r-poltrona"); window.scrollTo(0, 0); });
      box.appendChild(b);
    });
  }
  function drawSeats() {
    var t = rs.trip; $("#r-resumo").textContent = "Muriaé → " + rs.dest.n + " · " + t.t;
    $("#r-resumo2").textContent = longDate(rs.date) + " · " + COMP[(hash(rs.dest.n) + t.i) % 3];
    var tk = taken(rs.dest, rs.date, t.t), box = $("#r-seats"); box.textContent = "";
    for (var row = 0; row < 10; row++) {
      [1, 2, null, 3, 4].forEach(function (c) {
        if (c === null) { box.appendChild(h("span")); return; }
        var n = row * 4 + c, b = h("button", { class: "seat", type: "button", "aria-pressed": rs.seat === n ? "true" : "false", "aria-label": "Poltrona " + n + (tk[n] ? ", ocupada" : "") }, String(n));
        b.disabled = !!tk[n];
        b.addEventListener("click", function () { SND.select(); vib(15); rs.seat = n; drawSeats(); });
        box.appendChild(b);
      });
    }
    $("#r-confirmar").disabled = !rs.seat;
    $("#r-confirmar").textContent = rs.seat ? "Pagar " + brl(ticketPrice(rs.dest)) + " · poltrona " + rs.seat : "Escolha uma poltrona";
    $("#r-erro").textContent = "";
    if (perfil && !$("#r-nome").value) $("#r-nome").value = perfil.nome;
  }
  $("#r-voltar0").addEventListener("click", function () { show("r-dest"); });
  $("#r-voltar1").addEventListener("click", function () { drawCal(); drawTrips(); show("r-cal"); });
  function barcode(code) {
    var s = svg("svg", { class: "bars", viewBox: "0 0 240 40", preserveAspectRatio: "none", "aria-hidden": "true" });
    var rnd = rng(hash(code)), x = 0;
    while (x < 236) { var w = 1 + Math.floor(rnd() * 3), gap = 1 + Math.floor(rnd() * 2); svg("rect", { x: x, y: 0, width: w, height: 40 }, s); x += w + gap; }
    return s;
  }
  function ticketEl(r) {
    var wrap = document.createDocumentFragment();
    var top = h("div", { class: "t-top" }); top.appendChild(h("strong", null, "Rodoviária de Muriaé")); top.appendChild(h("span", { class: "stamp" }, "Reserva de exemplo")); wrap.appendChild(top);
    var body = h("div", { class: "t-body" });
    var rt2 = h("div", { class: "t-route" }); rt2.appendChild(h("span", null, "Muriaé")); rt2.appendChild(h("span", { class: "arrow" }, "→")); rt2.appendChild(h("span", null, r.dest)); body.appendChild(rt2);
    var dl = h("dl", { class: "t-grid", style: "margin:0" });
    [["Data", r.date], ["Saída", r.time], ["Poltrona", String(r.seat)], ["Plataforma", String(1 + (hash(r.dest + r.time) % 6))], ["Pagamento", r.paid ? "Pago com " + r.pay : "No guichê"], ["Valor", r.price != null ? brl(r.price) : "—"]].forEach(function (p) { var d = h("div"); d.appendChild(h("dt", null, p[0])); d.appendChild(h("dd", null, p[1])); dl.appendChild(d); });
    body.appendChild(dl); wrap.appendChild(body);
    wrap.appendChild(h("div", { class: "t-cut" }));
    var foot = h("div", { class: "t-foot" });
    foot.appendChild(h("span", { class: "small muted" }, "Código da reserva"));
    foot.appendChild(h("span", { class: "code" }, r.code));
    foot.appendChild(barcode(r.code));
    foot.appendChild(h("p", { class: "small" }, r.name + " · celular final " + r.last4 + " · " + r.comp));
    foot.appendChild(h("p", { class: "small muted" }, (r.paid ? "Pagamento de exemplo: nenhum valor foi cobrado. " : "Pague no guichê até 1 h antes da saída. ") + "Nenhuma passagem real foi emitida."));
    wrap.appendChild(foot);
    return wrap;
  }
  $("#r-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var nome = $("#r-nome").value.trim(), cel = $("#r-cel").value.replace(/\D/g, "");
    if (!rs.seat) { $("#r-erro").textContent = "Escolha uma poltrona no mapa acima."; return; }
    if (nome.length < 3) { $("#r-erro").textContent = "Digite o nome completo do passageiro."; $("#r-nome").focus(); return; }
    if (cel.length < 10 || cel.length > 11) { $("#r-erro").textContent = "Digite o celular com DDD, por exemplo 32 99999-0000."; $("#r-cel").focus(); return; }
    $("#r-erro").textContent = "";
    if (!logged()) { requireAuth("Entre ou crie sua conta para reservar a passagem.", function () { if ($("#r-form").requestSubmit) $("#r-form").requestSubmit(); else $("#r-confirmar").click(); }); return; }
    var dest = rs.dest, date = rs.date, trip = rs.trip, seat = rs.seat, price = ticketPrice(dest);
    openPay({
      title: "Pagamento da passagem", sub: "Muriaé → " + dest.n + " · " + trip.t + " · poltrona " + seat, amount: price, guiche: true,
      onPaid: function (method, paid) {
        var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", code = "MRE-";
        for (var i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
        var r = { code: code, key: tripKey(dest, date, trip.t), dest: dest.n, date: date.toLocaleDateString("pt-BR"), time: trip.t, seat: seat, name: nome, last4: cel.slice(-4), comp: COMP[(hash(dest.n) + trip.i) % 3], pay: method, paid: paid, price: price };
        reservas.push(r); store("mre-reservas", reservas);
        if (perfil) addHist("passagem", "Passagem para " + dest.n, -price, paid ? method : "A pagar no guichê");
        var tk = $("#r-ticket"); tk.textContent = ""; tk.appendChild(ticketEl(r));
        $("#r-nome").value = ""; $("#r-cel").value = "";
        if (!paid) SND.coin();
        drawMine(); show("r-ok"); window.scrollTo(0, 0);
      }
    });
  });
  $("#r-nova").addEventListener("click", function () { drawDest(); show("r-dest"); });
  var pendingCancel = null;
  function drawMine() {
    var wrap = $("#r-minhas-wrap"), box = $("#r-minhas"); box.textContent = ""; wrap.hidden = reservas.length === 0;
    reservas.forEach(function (r, i) {
      var c = h("div", { class: "mini" });
      c.appendChild(h("span", { class: "code", style: "font-size:1.1rem" }, r.code));
      c.appendChild(h("p", { style: "font-weight:700" }, "Muriaé → " + r.dest + " · " + r.date + " às " + r.time));
      c.appendChild(h("p", { class: "small muted" }, "Poltrona " + r.seat + " · " + r.name + " · " + (r.paid ? "Pago (" + r.pay + ")" : "Pagar no guichê")));
      var b = h("button", { class: "btn danger", type: "button" }, pendingCancel === r.code ? "Confirmar cancelamento" : "Cancelar reserva");
      b.addEventListener("click", function () {
        if (pendingCancel === r.code) { reservas.splice(i, 1); store("mre-reservas", reservas); pendingCancel = null; drawMine(); if (rs.dest && !$("#r-cal").hidden) { drawCal(); drawTrips(); } }
        else { pendingCancel = r.code; drawMine(); }
      });
      c.appendChild(b); box.appendChild(c);
    });
  }

  /* ---------- Carteira, pagamento e NFC (tudo simulado) ---------- */
  var TARIFA = 400;
  var TIPOS = [
    ["comum", "Comum", "Tarifa cheia", 1],
    ["estudante", "Estudante", "Meia tarifa com carteirinha", 0.5],
    ["idoso", "Idoso 65+", "Gratuito, com documento", 0],
    ["servidor", "Funcionário", "Vale-transporte do empregador", 1]
  ];
  function tipoInfo(k) { return TIPOS.filter(function (t) { return t[0] === k; })[0]; }
  /* Dados salvos no navegador podem ter sido editados à mão: validamos tudo ao carregar. */
  function str(v, n) { return typeof v === "string" ? v.slice(0, n) : ""; }
  function int(v, lo, hi, d) { v = Math.round(+v); return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; }
  function isObj(v) { return v && typeof v === "object" && !Array.isArray(v); }
  function cleanConta(c) {
    if (!isObj(c)) return null;
    var nome = str(c.nome, 60).trim(); if (nome.length < 3) return null;
    var ids = LINES.map(function (l) { return l.id; });
    return { nome: nome, via: "SMS", cel: str(c.cel, 30), celHash: str(c.celHash, 40), desde: int(c.desde, 0, 4e12, Date.now()),
      fav: Array.isArray(c.fav) ? c.fav.filter(function (x) { return ids.indexOf(x) >= 0; }).slice(0, 4) : [], av: int(c.av, 0, 5, 0) };
  }
  function cleanPerfil(p, nome) {
    if (!isObj(p) || !tipoInfo(p.tipo)) return null;
    return { nome: str(p.nome, 60) || nome, tipo: p.tipo, inst: str(p.inst, 60), last4: /^\d{0,4}$/.test(p.last4) ? p.last4 : "",
      saldo: int(p.saldo, 0, 1e6, 0), verified: p.verified === true,
      hist: (Array.isArray(p.hist) ? p.hist : []).slice(0, 30).filter(isObj).map(function (x) { return { t: int(x.t, 0, 4e12, 0), k: str(x.k, 20), d: str(x.d, 80), v: int(x.v, -1e6, 1e6, 0), via: str(x.via, 40) }; }) };
  }
  function cleanReservas(a) {
    return (Array.isArray(a) ? a : []).slice(0, 50).filter(function (r) { return isObj(r) && /^MRE-[A-Z2-9]{4}$/.test(r.code); }).map(function (r) {
      return { code: r.code, key: str(r.key, 80), dest: str(r.dest, 40), date: str(r.date, 12), time: str(r.time, 6), seat: int(r.seat, 1, 40, 1), name: str(r.name, 60),
        last4: str(r.last4, 4), comp: str(r.comp, 30), pay: str(r.pay, 30), paid: r.paid === true, price: int(r.price, 0, 1e6, 0) };
    });
  }
  var conta = cleanConta(store("mre-conta")), sessao = !!conta && store("mre-sessao") === true;
  var perfil = sessao ? cleanPerfil(store("mre-perfil"), conta.nome) : null;
  function logged() { return !!(conta && sessao); }
  function savePerfil() { store("mre-perfil", perfil); }
  function brl(c) { return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
  function fare() { return Math.round(TARIFA * tipoInfo(perfil.tipo)[3]); }
  function addHist(k, d, v, via) { perfil.hist.unshift({ t: Date.now(), k: k, d: d, v: v, via: via || "" }); perfil.hist = perfil.hist.slice(0, 30); savePerfil(); }
  var PRICE = { "Juiz de Fora": 5500, "Rio de Janeiro": 14000, "Belo Horizonte": 12500, "São Paulo": 19500, "Ubá": 2800, "Cataguases": 3200, "Leopoldina": 3000, "Carangola": 2200, "Itaperuna": 3800, "Campos dos Goytacazes": 7500, "Manhuaçu": 6500, "Miraí": 1500 };
  function ticketPrice(dest) {
    var p = PRICE[dest.n] || 5000;
    if (perfil && (perfil.tipo === "estudante" || perfil.tipo === "idoso")) p = Math.round(p * 0.5 / 50) * 50;
    return p;
  }
  function lockPage(on) { guard.forEach(function (el) { el.inert = on; }); }
  function qrSvg(seed) {
    var N = 25, rnd = rng(hash(seed)), s = svg("svg", { class: "qr", viewBox: "0 0 " + (N + 2) + " " + (N + 2), role: "img", "aria-label": "QR code de exemplo" });
    function finder(x, y) { svg("rect", { x: x + 1, y: y + 1, width: 7, height: 7, fill: "#0B2233" }, s); svg("rect", { x: x + 2, y: y + 2, width: 5, height: 5, fill: "#fff" }, s); svg("rect", { x: x + 3, y: y + 3, width: 3, height: 3, fill: "#0B2233" }, s); }
    function inF(i, j) { return (i < 8 && j < 8) || (i >= N - 8 && j < 8) || (i < 8 && j >= N - 8); }
    for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) if (!inF(i, j) && rnd() < 0.5) svg("rect", { x: i + 1, y: j + 1, width: 1, height: 1, fill: "#0B2233" }, s);
    finder(0, 0); finder(N - 7, 0); finder(0, N - 7);
    return s;
  }
  function fmtDT(t) { return new Date(t).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); }

  /* pagamento (Pix, cartão de exemplo, guichê) */
  var pay = null;
  function openPay(o) {
    pay = { o: o, method: "pix", step: "choose" };
    $("#pay-t").textContent = o.title; $("#pay-s").textContent = o.sub || ""; $("#pay-v").textContent = brl(o.amount);
    renderPay(); $("#pay").hidden = false; lockPage(true); try { $("#pay-x").focus(); } catch (e) {}
  }
  function closePay() { $("#pay").hidden = true; unlockIfIdle(); pay = null; }
  function renderPay() {
    var box = $("#pay-body"); box.textContent = "";
    if (pay.step === "done") {
      var ok = h("div", { class: "panel center" });
      ok.appendChild(okMark(false)); SND.ok(); vib([40, 40, 80]); setTimeout(function () { burst(0.5, 0.35); }, 150);
      ok.appendChild(h("h2", null, "Pagamento aprovado"));
      ok.appendChild(h("p", { class: "muted" }, "Exemplo: nenhum valor foi cobrado."));
      var go = h("button", { class: "btn primary", type: "button", style: "width:100%" }, "Continuar");
      go.addEventListener("click", function () { var p = pay; closePay(); p.o.onPaid(p.method === "pix" ? "Pix" : "Cartão", true); });
      ok.appendChild(go); box.appendChild(ok); try { go.focus(); } catch (e) {}
      return;
    }
    var list = h("div", { class: "panel", role: "radiogroup", "aria-label": "Forma de pagamento", style: "gap:8px" });
    var methods = [["pix", "Pix", "Aprovação na hora", "Rápido"], ["card", "Cartão de crédito", "Cartão final 4242 (exemplo)", ""]];
    if (pay.o.guiche) methods.push(["guiche", "Pagar no guichê", "Reserve agora e pague na rodoviária até 1 h antes da saída", ""]);
    methods.forEach(function (m) {
      var b = h("button", { class: "meth", type: "button", role: "radio", "aria-checked": pay.method === m[0] ? "true" : "false" });
      b.appendChild(h("b", null, m[1])); if (m[3]) b.appendChild(h("span", { class: "tg blue" }, m[3])); b.appendChild(h("span", { class: "small muted" }, m[2]));
      b.addEventListener("click", function () { pay.method = m[0]; renderPay(); });
      list.appendChild(b);
    });
    box.appendChild(list);
    var act = h("div", { class: "panel", style: "gap:10px" });
    if (pay.method === "pix") {
      var code = "00020126EXEMPLO0014br.gov.bcb.pix" + hash(pay.o.title + pay.o.amount + (pay.o.sub || "")).toString(16).toUpperCase() + "5204000053039865406" + String(pay.o.amount) + "5802BR5913MURIAE EM ROTA6006MURIAE";
      act.appendChild(qrSvg(code));
      act.appendChild(h("div", { class: "pixcode" }, code));
      var cp = h("button", { class: "btn", type: "button" }, "Copiar código Pix");
      cp.addEventListener("click", function () { try { navigator.clipboard.writeText(code); cp.textContent = "Código copiado"; } catch (e) { cp.textContent = "Copie o código acima"; } });
      act.appendChild(cp);
      var pg = h("button", { class: "btn primary", type: "button" }, "Já paguei (simular)");
      pg.addEventListener("click", function () { pg.disabled = true; pg.textContent = "Confirmando…"; pg.classList.add("busy"); setTimeout(function () { if (pay) { pay.step = "done"; renderPay(); } }, 1100); });
      act.appendChild(pg);
    } else if (pay.method === "card") {
      act.appendChild(h("p", { class: "small muted" }, "Este protótipo não pede dados de cartão. Em uma versão real, o cartão seria cadastrado em um provedor de pagamento seguro."));
      var pc = h("button", { class: "btn primary", type: "button" }, "Pagar " + brl(pay.o.amount));
      pc.addEventListener("click", function () { pc.disabled = true; pc.textContent = "Processando…"; pc.classList.add("busy"); setTimeout(function () { if (pay) { pay.step = "done"; renderPay(); } }, 1300); });
      act.appendChild(pc);
    } else {
      act.appendChild(h("p", { class: "small muted" }, "A poltrona fica reservada. Se o pagamento não for feito até 1 hora antes da saída, a reserva pode ser cancelada pela empresa (exemplo)."));
      var gg = h("button", { class: "btn primary", type: "button" }, "Reservar e pagar no guichê");
      gg.addEventListener("click", function () { var p = pay; closePay(); p.o.onPaid("Guichê", false); });
      act.appendChild(gg);
    }
    box.appendChild(act);
  }
  $("#pay-x").addEventListener("click", closePay);

  /* embarque por NFC (simulado) */
  var nfcSt = { line: "101", qr: false, res: null };
  function openNfc() {
    if (!perfil) return;
    nfcSt = { line: filter !== "all" ? filter : "101", qr: false, res: null };
    drawNfc(); $("#nfc").hidden = false; lockPage(true); try { $("#nfc-x").focus(); } catch (e) {}
  }
  function closeNfc() { $("#nfc").hidden = true; unlockIfIdle(); }
  $("#nfc-x").addEventListener("click", closeNfc);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { if (!$("#pay").hidden) closePay(); else if (!$("#nfc").hidden) closeNfc(); } });
  function readCard() {
    var f = fare(), ln = LINES.filter(function (l) { return l.id === nfcSt.line; })[0];
    if (!perfil.verified) nfcSt.res = { ok: false, t: "Carteirinha ainda não verificada", d: "A prefeitura ainda está confirmando seus dados. Tente de novo em instantes." };
    else if (perfil.saldo < f) nfcSt.res = { ok: false, t: "Saldo insuficiente", d: "Faltam " + brl(f - perfil.saldo) + " para esta viagem.", recharge: true };
    else {
      perfil.saldo -= f; addHist("viagem", "Linha " + ln.id + " · " + ln.name, -f);
      nfcSt.res = { ok: true, t: "Embarque liberado", f: f, ln: ln };
      try { if (navigator.vibrate) navigator.vibrate(120); } catch (e) {}
    }
    if (nfcSt.res.ok) { SND.bip(); setTimeout(SND.ok, 280); setTimeout(function () { burst(0.5, 0.4); }, 200); } else { SND.err(); vib([80, 50, 80]); }
    drawNfc();
  }
  function drawNfc() {
    var box = $("#nfc-body"); box.textContent = ""; var r = nfcSt.res;
    if (r) {
      box.appendChild(okMark(!r.ok));
      box.appendChild(h("h2", null, r.t));
      if (r.ok) {
        var kv = h("div", { class: "kv" });
        [["Linha", r.ln.id + " · " + r.ln.name], ["Passageiro", perfil.nome], ["Tarifa", r.f === 0 ? "Gratuito" : brl(r.f)], ["Saldo", brl(perfil.saldo)]].forEach(function (p) { var d = h("div"); d.appendChild(h("span", null, p[0])); d.appendChild(h("b", null, p[1])); kv.appendChild(d); });
        box.appendChild(kv);
      } else box.appendChild(h("p", { class: "s" }, r.d));
      if (r.recharge) { var rb = h("button", { class: "btn primary", type: "button" }, "Recarregar agora"); rb.addEventListener("click", function () { closeNfc(); openTab("tab-carteira"); }); box.appendChild(rb); }
      var cl = h("button", { class: "btn", type: "button" }, "Fechar"); cl.addEventListener("click", closeNfc); box.appendChild(cl);
      try { (box.querySelector(".btn") || cl).focus(); } catch (e) {}
      return;
    }
    box.appendChild(h("h2", { id: "nfc-t" }, "Aproxime o celular do leitor"));
    var rg = h("div", { class: "rings", "aria-hidden": "true" }); rg.appendChild(h("i")); rg.appendChild(h("i")); rg.appendChild(h("i"));
    var core = h("div", { class: "core" }); core.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 7a7 7 0 0 1 0 10M11.5 4.5a11 11 0 0 1 0 15M15 2a15 15 0 0 1 0 20"/></svg>'; rg.appendChild(core); box.appendChild(rg);
    box.appendChild(h("p", { class: "s" }, "Encoste a parte de trás do celular no validador do ônibus, perto da catraca."));
    var lc = h("div", { class: "chips", role: "radiogroup", "aria-label": "Linha do ônibus (simulação)", style: "justify-content:center" });
    LINES.forEach(function (l) { var c = h("button", { class: "chip", type: "button", role: "radio", "aria-checked": nfcSt.line === l.id ? "true" : "false" }, "Linha " + l.id); c.addEventListener("click", function () { nfcSt.line = l.id; drawNfc(); }); lc.appendChild(c); });
    box.appendChild(lc);
    var sim = h("button", { class: "btn primary", type: "button" }, "Simular leitura no validador"); sim.addEventListener("click", readCard); box.appendChild(sim);
    var q = h("button", { class: "btn", type: "button" }, nfcSt.qr ? "Esconder QR code" : "Mostrar QR code do passe"); q.addEventListener("click", function () { nfcSt.qr = !nfcSt.qr; drawNfc(); }); box.appendChild(q);
    if (nfcSt.qr) { box.appendChild(qrSvg(perfil.nome + Math.floor(Date.now() / 30000))); box.appendChild(h("p", { class: "s small" }, "Alternativa sem NFC: o QR code mudaria a cada 30 segundos (exemplo).")); }
  }

  /* perfil e passe */
  var wf = { tipo: "comum", valor: 2000 };
  function drawTipos() {
    var box = $("#w-tipos"); box.textContent = "";
    TIPOS.forEach(function (t) {
      var b = h("button", { class: "tipo", type: "button", role: "radio", "aria-checked": wf.tipo === t[0] ? "true" : "false" });
      b.appendChild(h("b", null, t[1])); b.appendChild(h("span", { class: "small muted" }, t[2]));
      b.addEventListener("click", function () { wf.tipo = t[0]; drawTipos(); });
      box.appendChild(b);
    });
    var k = wf.tipo;
    $("#w-f-inst").hidden = !(k === "estudante" || k === "servidor");
    $("#w-inst-l").textContent = k === "estudante" ? "Escola ou faculdade" : "Empresa ou órgão";
    $("#w-f-cart").hidden = k === "comum";
  }
  $("#w-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var nome = $("#w-nome").value.trim(), k = wf.tipo, inst = $("#w-inst").value.trim(), cart = $("#w-cart").value.replace(/\D/g, ""), er = $("#w-erro");
    if (nome.length < 3) { er.textContent = "Digite seu nome completo."; $("#w-nome").focus(); return; }
    if ((k === "estudante" || k === "servidor") && inst.length < 2) { er.textContent = "Informe " + (k === "estudante" ? "a escola ou faculdade." : "a empresa ou órgão."); $("#w-inst").focus(); return; }
    if (k !== "comum" && cart.length < 4) { er.textContent = "Digite o número da carteirinha."; $("#w-cart").focus(); return; }
    er.textContent = "";
    perfil = { nome: nome, tipo: k, inst: k === "estudante" || k === "servidor" ? inst : "", last4: k === "comum" ? "" : cart.slice(-4), saldo: 0, verified: k === "comum", hist: [] };
    savePerfil(); $("#w-nome").value = ""; $("#w-inst").value = ""; $("#w-cart").value = "";
    if (!perfil.verified) verifySoon();
    drawWallet(); window.scrollTo(0, 0);
  });
  function verifySoon() {
    setTimeout(function () {
      if (!perfil || perfil.verified) return;
      perfil.verified = true; savePerfil(); toast("Carteirinha confirmada pela prefeitura (simulado).");
      if (!$("#p-carteira").hidden) drawWallet();
    }, 2500);
  }
  function drawWallet() {
    var gate = !logged();
    $("#w-gate").hidden = !gate; $("#w-onb").hidden = gate || !!perfil; $("#w-main").hidden = gate || !perfil;
    if (gate) return;
    if (!perfil) { drawTipos(); if (!$("#w-nome").value) $("#w-nome").value = conta.nome; return; }
    var t = tipoInfo(perfil.tipo), p = $("#w-pass"); p.textContent = "";
    var r1 = h("div", { class: "r1" }); r1.appendChild(h("span", { class: "l2" }, "Passe Muriaé"));
    var ic = h("span"); ic.innerHTML = '<svg class="nfc" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7a7 7 0 0 1 0 10M11.5 4.5a11 11 0 0 1 0 15M15 2a15 15 0 0 1 0 20"/></svg>'; r1.appendChild(ic); p.appendChild(r1);
    p.appendChild(h("div", { class: "nm" }, perfil.nome));
    p.appendChild(h("div", { class: "sub" }, t[1] + (perfil.inst ? " · " + perfil.inst : "") + (perfil.last4 ? " · carteirinha final " + perfil.last4 : "")));
    var bw = h("div"); bw.appendChild(h("div", { class: "l2" }, "Saldo")); var bal = h("div", { class: "bal" }, brl(perfil.saldo)); if (lastBal != null && lastBal !== perfil.saldo) countTo(bal, lastBal, perfil.saldo); lastBal = perfil.saldo; bw.appendChild(bal); p.appendChild(bw);
    p.appendChild(h("span", { class: perfil.verified ? "st" : "st wait" }, perfil.verified ? (perfil.tipo === "comum" ? "✓ Passe ativo" : "✓ Carteirinha verificada (exemplo)") : "Verificando com a prefeitura…"));
    p.appendChild(h("div", { class: "sub" }, "Cada viagem: " + (fare() === 0 ? "gratuita" : brl(fare())) + " · " + t[2] + " (valores de exemplo)"));
    $("#w-rec").hidden = perfil.tipo === "idoso";
    var vb = $("#w-valores"); vb.textContent = "";
    [1000, 2000, 5000, 10000].forEach(function (v) {
      var c = h("button", { class: "chip", type: "button", role: "radio", "aria-checked": wf.valor === v ? "true" : "false" }, brl(v));
      c.addEventListener("click", function () { wf.valor = v; drawWallet(); }); vb.appendChild(c);
    });
    $("#w-recarga").textContent = "Recarregar " + brl(wf.valor);
    var vt = $("#w-vt"); vt.hidden = perfil.tipo !== "servidor"; vt.textContent = "Receber o vale-transporte do mês · +" + brl(8800) + " (exemplo)";
    var hist = $("#w-hist"); hist.textContent = "";
    if (!perfil.hist.length) hist.appendChild(h("p", { class: "muted", style: "padding:16px" }, "Nenhuma viagem ainda. Recarregue o passe e toque em Embarcar com NFC."));
    perfil.hist.forEach(function (x) {
      var row = h("div", { class: "row", style: "grid-template-columns:1fr auto" });
      var w = h("span", { class: "what" }); w.appendChild(h("span", null, x.d)); w.appendChild(h("span", { class: "small muted" }, fmtDT(x.t) + (x.via ? " · " + x.via : "")));
      row.appendChild(w);
      var val = x.k === "recarga" || x.k === "beneficio" ? "+" + brl(x.v) : x.v === 0 ? "Grátis" : brl(-x.v);
      row.appendChild(h("span", { style: "font-weight:800;color:" + (x.v > 0 ? "var(--green)" : "var(--ink)") }, val));
      hist.appendChild(row);
    });
  }
  $("#w-nfc").addEventListener("click", openNfc);
  $("#w-recarga").addEventListener("click", function () {
    var v = wf.valor;
    openPay({ title: "Recarga do Passe", sub: "O saldo vale em todas as linhas urbanas", amount: v, guiche: false, onPaid: function (m) { perfil.saldo += v; addHist("recarga", "Recarga do passe", v, m); drawWallet(); toast("Recarga de " + brl(v) + " confirmada (simulado)."); } });
  });
  $("#w-vt").addEventListener("click", function () { SND.coin(); perfil.saldo += 8800; addHist("beneficio", "Vale-transporte do empregador", 8800, "Empregador"); drawWallet(); toast("Vale-transporte creditado (exemplo)."); });
  var sairArm = false;
  $("#w-sair").addEventListener("click", function () {
    var b = $("#w-sair");
    if (!sairArm) { sairArm = true; b.textContent = "Toque de novo para confirmar"; setTimeout(function () { sairArm = false; b.textContent = "Apagar meu perfil deste aparelho"; }, 4000); return; }
    sairArm = false; b.textContent = "Apagar meu perfil deste aparelho"; perfil = null; store("mre-perfil", null); drawWallet();
  });
  if (perfil && !perfil.verified) verifySoon();

  /* ---------- Conta: cadastro, entrada e perfil (tudo simulado, sem senha) ---------- */
  var AV = ["#09825A", "#1E6FD9", "#8B3DC7", "#D6336C", "#D4600B", "#0D3B3A"];
  var au = null, auSpin = false, auBus = Bus3D($("#au-art"), "--accent");
  function unlockIfIdle() { if (["pay", "nfc", "auth", "prof"].every(function (id) { return $("#" + id).hidden; })) lockPage(false); }
  function maskCel(d) { return "(" + d.slice(0, 2) + ") " + (d.length === 11 ? "•••••" : "••••") + "-" + d.slice(-4); }
  function cHash(d) { return String(hash("cel:" + d)); }
  var ICON_USER = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';
  function updateAvatar() {
    var b = $("#avbtn");
    if (logged()) { b.textContent = conta.nome.trim().charAt(0).toUpperCase() || "?"; b.style.background = AV[conta.av || 0]; b.style.color = "#fff"; b.setAttribute("aria-label", "Meu perfil: " + conta.nome); }
    else { b.innerHTML = ICON_USER; b.style.background = ""; b.style.color = ""; b.setAttribute("aria-label", "Entrar ou criar conta"); }
  }
  function refreshViews() { updateAvatar(); if (!$("#p-carteira").hidden) drawWallet(); }
  function sendSms() { au.sms = String(1000 + Math.floor(Math.random() * 9000)); SND.bell(); toast("SMS (exemplo): seu código é " + au.sms); }

  function openAuth(o) {
    o = o || {};
    au = { step: o.step || "home", mode: o.mode || "login", tipo: "comum", reason: o.reason || "", then: o.then, canClose: true, nome: "", cel: "", inst: "", cart: "", via: "SMS", known: false };
    drawAuth(); $("#auth").hidden = false; lockPage(true);
    if (!auSpin) { auSpin = true; var a = 30, last = performance.now(); (function spin(t) { if ($("#auth").hidden) { auSpin = false; return; } a += Math.min(0.1, (t - last) / 1000) * 26; last = t; auBus.set(a); requestAnimationFrame(spin); })(last); }
  }
  function closeAuth() { $("#auth").hidden = true; au = null; unlockIfIdle(); }
  function requireAuth(reason, then) { openAuth({ reason: reason, then: then }); }
  $("#au-x").addEventListener("click", closeAuth);

  function drawAuth() {
    var box = $("#au-body"), s = au.step, i;
    box.textContent = "";
    $("#au-x").hidden = !au.canClose;
    function H(t) { box.appendChild(h("h2", { id: "au-t" }, t)); }
    function P(t, c) { box.appendChild(h("p", { class: c || "muted" }, t)); }
    function B(label, cls, fn, ico) {
      var b = h("button", { class: "btn " + (cls || ""), type: "button" });
      if (ico) b.appendChild(h("span", { class: "pv" }, ico));
      b.appendChild(document.createTextNode(label)); b.addEventListener("click", fn); box.appendChild(b); return b;
    }
    function F(id, label, attrs, val) {
      var f = h("div", { class: "field" }); f.appendChild(h("label", { "for": id }, label));
      attrs.id = id; attrs["class"] = "input"; var inp = h("input", attrs); if (val) inp.value = val; f.appendChild(inp); box.appendChild(f); return inp;
    }
    function ERR() { var e = h("p", { class: "err", id: "au-erro", role: "alert" }); box.appendChild(e); return e; }
    function go(step) { au.step = step; drawAuth(); }
    function bad(er, msg, el) { er.textContent = msg; SND.err(); vib(60); if (el) el.focus(); }

    if (s === "home") {
      H("Bem-vindo!");
      P(au.reason || "Entre para pagar passagens, usar o Passe no ônibus e guardar suas linhas favoritas.");
      if (conta && !sessao) B("Entrar como " + conta.nome.split(" ")[0] + " · " + conta.cel, "primary", function () { au.mode = "login"; au.known = true; sendSms(); go("code"); });
      B("Entrar com celular", conta && !sessao ? "" : "primary", function () { au.mode = "login"; au.known = false; go("phone"); });
      B("Criar conta", "", function () { au.mode = "signup"; go("signup"); });
      var v = h("button", { class: "back", type: "button", style: "align-self:center" }, "Continuar como visitante"); v.addEventListener("click", closeAuth); box.appendChild(v);
      P("Visitantes veem o mapa e os horários. Passe e reservas pedem uma conta.", "muted small");
    } else if (s === "phone") {
      H("Qual é o seu celular?"); P("Vamos enviar um código por SMS. Sem senha para decorar.");
      var c1 = F("au-cel", "Celular com DDD", { type: "tel", inputmode: "numeric", autocomplete: "tel-national", placeholder: "32 99999-0000", maxlength: "16" }, au.cel);
      var e1 = ERR();
      B("Enviar código", "primary", function () { var d = c1.value.replace(/\D/g, ""); if (d.length < 10 || d.length > 11) return bad(e1, "Digite o celular com DDD.", c1); au.cel = d; au.known = false; sendSms(); go("code"); });
      B("Voltar", "", function () { go("home"); });
    } else if (s === "signup") {
      H("Criar conta"); P("Leva menos de 1 minuto."); P("Protótipo de teste: use nome e número inventados. Não digite dados reais.", "muted small");
      var n2 = F("au-nome", "Seu nome", { type: "text", autocomplete: "name", maxlength: "60" }, au.nome);
      var c2 = F("au-cel", "Celular com DDD", { type: "tel", inputmode: "numeric", autocomplete: "tel-national", placeholder: "32 99999-0000", maxlength: "16" }, au.cel);
      var lb = h("label", { "class": "chk" }), ck = h("input", { type: "checkbox", id: "au-ck" }); ck.checked = !!au.ck;
      lb.appendChild(ck); lb.appendChild(h("span", null, "Li e aceito os termos de uso e a política de privacidade (exemplo). Meus dados ficam só neste aparelho.")); box.appendChild(lb);
      var e2 = ERR();
      B("Continuar", "primary", function () {
        var d = c2.value.replace(/\D/g, ""), nm = n2.value.trim();
        if (nm.length < 3) return bad(e2, "Digite seu nome completo.", n2);
        if (d.length < 10 || d.length > 11) return bad(e2, "Digite o celular com DDD.", c2);
        if (!ck.checked) return bad(e2, "Marque que aceita os termos para continuar.", ck);
        if (conta && conta.celHash === cHash(d)) return bad(e2, "Já existe uma conta com esse número. Toque em “Já tenho conta”.");
        au.nome = nm; au.cel = d; au.ck = true; au.mode = "signup"; au.via = "SMS"; au.known = false; sendSms(); go("code");
      });
      B("Já tenho conta", "", function () { au.mode = "login"; go("phone"); });
    } else if (s === "code") {
      H("Digite o código"); P("Enviamos um SMS para " + (au.known ? conta.cel : maskCel(au.cel)) + ".");
      box.appendChild(h("div", { "class": "smshint" }, "Protótipo: nenhum SMS é enviado de verdade. O código desta tela é " + au.sms + "."));
      var c3 = F("au-code", "Código de 4 números", { type: "text", inputmode: "numeric", autocomplete: "one-time-code", maxlength: "4" }); c3.classList.add("codein");
      var e3 = ERR();
      B("Confirmar", "primary", function () {
        if (c3.value.trim() !== au.sms) return bad(e3, "Código incorreto. Confira o código acima.", c3);
        if (au.known) return doLogin(conta);
        if (au.mode === "login") { if (conta && conta.celHash === cHash(au.cel)) doLogin(conta); else go("notfound"); }
        else go("tipo");
      });
      B("Reenviar código", "", function () { sendSms(); drawAuth(); });
      B("Voltar", "", function () { go(au.mode === "signup" ? "signup" : au.known ? "home" : "phone"); });
      try { c3.focus(); } catch (e) {}
    } else if (s === "notfound") {
      H("Conta não encontrada"); P("Não achamos uma conta com esse número neste aparelho. Quer criar uma?");
      B("Criar conta com este número", "primary", function () { au.mode = "signup"; go("signup"); });
      B("Tentar outro número", "", function () { au.cel = ""; go("phone"); });
    } else if (s === "tipo") {
      function save() { var q = function (id) { var e = document.getElementById(id); return e ? e.value : null; }; au.nome = q("au-nome2") != null ? q("au-nome2") : au.nome; au.inst = q("au-inst") != null ? q("au-inst") : au.inst; au.cart = q("au-cart") != null ? q("au-cart") : au.cart; }
      H("Quase lá"); P("Conte como você usa o ônibus para aplicarmos a sua tarifa.");
      var n4 = F("au-nome2", "Seu nome", { type: "text", autocomplete: "name", maxlength: "60" }, au.nome);
      var tl = h("div", { "class": "tipos", role: "radiogroup", "aria-label": "Quem é você no ônibus?" });
      TIPOS.forEach(function (t) {
        var b = h("button", { "class": "tipo", type: "button", role: "radio", "aria-checked": au.tipo === t[0] ? "true" : "false" });
        b.appendChild(h("b", null, t[1])); b.appendChild(h("span", { "class": "small muted" }, t[2]));
        b.addEventListener("click", function () { save(); au.tipo = t[0]; drawAuth(); }); tl.appendChild(b);
      });
      box.appendChild(tl);
      var k = au.tipo;
      if (k === "estudante" || k === "servidor") F("au-inst", k === "estudante" ? "Escola ou faculdade" : "Empresa ou órgão", { type: "text", maxlength: "60" }, au.inst);
      if (k !== "comum") { F("au-cart", "Número da carteirinha", { type: "text", inputmode: "numeric", maxlength: "20" }, au.cart); P("Protótipo: use um número inventado. Só os 4 últimos ficam guardados neste aparelho.", "muted small"); }
      if (au.via !== "SMS") P("Ao continuar, você aceita os termos de uso e a política de privacidade (exemplo).", "muted small");
      var e4 = ERR();
      B("Criar minha conta", "primary", function () {
        save(); var nm = au.nome.trim(), cart = au.cart.replace(/\D/g, "");
        if (nm.length < 3) return bad(e4, "Digite seu nome completo.", n4);
        if ((k === "estudante" || k === "servidor") && au.inst.trim().length < 2) return bad(e4, k === "estudante" ? "Informe a escola ou faculdade." : "Informe a empresa ou órgão.", document.getElementById("au-inst"));
        if (k !== "comum" && cart.length < 4) return bad(e4, "Digite o número da carteirinha.", document.getElementById("au-cart"));
        finishAuth(nm, cart);
      });
      B("Voltar", "", function () { save(); go(au.cel ? "signup" : "home"); });
    }
    for (i = 0; i < box.children.length; i++) box.children[i].style.setProperty("--i", Math.min(i, 9));
  }
  function finishAuth(nm, cart) {
    var k = au.tipo, cel = au.cel || "";
    conta = { nome: nm, via: au.via || "SMS", cel: cel ? maskCel(cel) : au.via + " (sem celular)", celHash: cel ? cHash(cel) : "", desde: Date.now(), fav: [], av: Math.floor(Math.random() * AV.length) };
    perfil = { nome: nm, tipo: k, inst: k === "estudante" || k === "servidor" ? au.inst.trim() : "", last4: k === "comum" ? "" : cart.slice(-4), saldo: 0, verified: k === "comum", hist: [] };
    sessao = true; store("mre-conta", conta); store("mre-sessao", true); savePerfil();
    if (!perfil.verified) verifySoon();
    var then = au.then; closeAuth(); SND.ok(); burst(0.5, 0.3); vib([40, 40, 80]);
    toast("Conta criada! Bem-vindo(a), " + nm.split(" ")[0] + ".");
    refreshViews(); if (then) setTimeout(then, 500);
  }
  function doLogin(c) {
    conta = c; sessao = true; store("mre-sessao", true); perfil = store("mre-perfil");
    if (perfil && !perfil.verified) verifySoon();
    var then = au.then; closeAuth(); SND.ok(); vib(60);
    toast("Bem-vindo(a) de volta, " + c.nome.split(" ")[0] + ".");
    if (conta.fav && conta.fav[0]) setFilter(conta.fav[0]);
    refreshViews(); if (then) setTimeout(then, 500);
  }

  /* perfil */
  var profEdit = false, profDump = false, apagarArm = false;
  function openProf() { profEdit = false; profDump = false; drawProf(); $("#prof").hidden = false; lockPage(true); try { $("#prof-x").focus(); } catch (e) {} }
  function closeProf() { $("#prof").hidden = true; unlockIfIdle(); }
  $("#avbtn").addEventListener("click", openProf);
  $("#prof-x").addEventListener("click", closeProf);
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!$("#auth").hidden && au && au.canClose) closeAuth(); else if (!$("#prof").hidden) closeProf();
  });
  function swRow(label, sub, on, fn) {
    var r = h("button", { "class": "swrow", type: "button", role: "switch", "aria-checked": on ? "true" : "false" });
    var t = h("span", { "class": "what" }); t.appendChild(h("b", null, label)); if (sub) t.appendChild(h("span", { "class": "small muted" }, sub));
    r.appendChild(t); r.appendChild(h("span", { "class": "swt" }));
    r.addEventListener("click", function () { var v = r.getAttribute("aria-checked") !== "true"; r.setAttribute("aria-checked", v ? "true" : "false"); fn(v); });
    return r;
  }
  function card(title) { var c = h("div", { "class": "card", style: "gap:8px" }); if (title) c.appendChild(h("h3", null, title)); return c; }
  function kv(c, a, b) { var r = h("div", { "class": "kvr" }); r.appendChild(h("span", null, a)); r.appendChild(h("b", null, b)); c.appendChild(r); }
  function drawProf() {
    var box = $("#prof-body"), i; box.textContent = "";
    if (logged()) {
      var top = h("div", { "class": "pf" });
      var av = h("div", { "class": "avbig", style: "background:" + AV[conta.av || 0] }, conta.nome.trim().charAt(0).toUpperCase());
      var tx = h("div", { style: "min-width:0" }); tx.appendChild(h("h2", { style: "overflow-wrap:anywhere" }, conta.nome));
      tx.appendChild(h("p", { "class": "small muted" }, "Conta criada em " + new Date(conta.desde).toLocaleDateString("pt-BR") + " · entrou com " + conta.via));
      top.appendChild(av); top.appendChild(tx); box.appendChild(top);
      var sw = h("div", { "class": "sws", role: "radiogroup", "aria-label": "Cor do avatar" });
      AV.forEach(function (col, idx) {
        var b = h("button", { "class": "swc", type: "button", role: "radio", "aria-checked": (conta.av || 0) === idx ? "true" : "false", "aria-label": "Cor " + (idx + 1), style: "background:" + col });
        b.addEventListener("click", function () { conta.av = idx; store("mre-conta", conta); updateAvatar(); drawProf(); }); sw.appendChild(b);
      });
      box.appendChild(sw);

      var cd = card("Meus dados");
      kv(cd, "Celular", conta.cel);
      if (profEdit) {
        var f = h("div", { "class": "field" }); f.appendChild(h("label", { "for": "pf-nome" }, "Nome")); var ni = h("input", { "class": "input", id: "pf-nome", type: "text", maxlength: "60" }); ni.value = conta.nome; f.appendChild(ni); cd.appendChild(f);
        var sv = h("button", { "class": "btn primary", type: "button" }, "Salvar nome");
        sv.addEventListener("click", function () { var nm = ni.value.trim(); if (nm.length < 3) { SND.err(); ni.focus(); return; } conta.nome = nm; store("mre-conta", conta); if (perfil) { perfil.nome = nm; savePerfil(); } profEdit = false; refreshViews(); drawProf(); SND.ok(); });
        cd.appendChild(sv);
      } else {
        kv(cd, "Nome", conta.nome);
        var ed = h("button", { "class": "btn", type: "button" }, "Editar nome"); ed.addEventListener("click", function () { profEdit = true; drawProf(); }); cd.appendChild(ed);
      }
      box.appendChild(cd);

      if (perfil) {
        var cp = card("Meu passe"), t = tipoInfo(perfil.tipo);
        kv(cp, "Tipo", t[1] + " · " + t[2]);
        if (perfil.inst) kv(cp, "Instituição", perfil.inst);
        if (perfil.last4) kv(cp, "Carteirinha", "final " + perfil.last4);
        kv(cp, "Situação", perfil.verified ? "✓ Verificada (exemplo)" : "Verificando…");
        kv(cp, "Saldo", brl(perfil.saldo));
        var ow = h("button", { "class": "btn primary", type: "button" }, "Abrir minha carteira"); ow.addEventListener("click", function () { closeProf(); openTab("tab-carteira"); }); cp.appendChild(ow);
        box.appendChild(cp);
        var viag = perfil.hist.filter(function (x) { return x.k === "viagem"; }).length, eco = viag * (TARIFA - fare());
        var cs = card("Meu uso"), st = h("div", { "class": "stat" });
        [[String(viag), "viagens"], [String(reservas.length), "reservas"], [brl(eco), "economizados"]].forEach(function (p) { var d = h("div"); d.appendChild(h("b", null, p[0])); d.appendChild(h("span", null, p[1])); st.appendChild(d); });
        cs.appendChild(st); cs.appendChild(h("p", { "class": "small muted" }, "Economia estimada com o desconto do seu tipo de passe (exemplo).")); box.appendChild(cs);
      }

      var cf = card("Linhas favoritas"); cf.appendChild(h("p", { "class": "small muted" }, "A primeira favorita abre já escolhida no mapa."));
      var ch = h("div", { "class": "chips", role: "group", "aria-label": "Linhas favoritas" });
      LINES.forEach(function (l) {
        var on = (conta.fav || []).indexOf(l.id) >= 0;
        ch.appendChild(chip("Linha " + l.id, l.color, on, function () { conta.fav = conta.fav || []; var ix = conta.fav.indexOf(l.id); if (ix >= 0) conta.fav.splice(ix, 1); else conta.fav.push(l.id); store("mre-conta", conta); drawProf(); }));
      });
      cf.appendChild(ch); box.appendChild(cf);
    } else {
      var tp = h("div", { "class": "pf" }); var a2 = h("div", { "class": "avbig", style: "background:var(--sheet);color:var(--muted)" }); a2.innerHTML = ICON_USER.replace("<svg", '<svg width="34" height="34" style="fill:none;stroke:currentColor;stroke-width:2"'); tp.appendChild(a2);
      var t2 = h("div"); t2.appendChild(h("h2", null, "Visitante")); t2.appendChild(h("p", { "class": "small muted" }, "Você pode ver o mapa e os horários sem conta.")); tp.appendChild(t2); box.appendChild(tp);
      var cg = card("Crie sua conta"); cg.appendChild(h("p", { "class": "muted" }, "Com uma conta você usa o Passe no ônibus, reserva passagens e guarda suas linhas favoritas."));
      var b1 = h("button", { "class": "btn primary", type: "button" }, "Entrar"); b1.addEventListener("click", function () { closeProf(); openAuth({}); });
      var b2 = h("button", { "class": "btn", type: "button" }, "Criar conta"); b2.addEventListener("click", function () { closeProf(); openAuth({ step: "signup", mode: "signup" }); });
      cg.appendChild(b1); cg.appendChild(b2); box.appendChild(cg);
    }

    var cpf = card("Preferências");
    cpf.appendChild(swRow("Letras maiores", "Aumenta o texto do aplicativo", document.documentElement.classList.contains("big"), function (v) { setBig(v); }));
    cpf.appendChild(swRow("Sons", "Sons de toque, aviso e pagamento", soundOn, function (v) { setSnd(v); if (v) SND.pop(); }));
    var th = h("div", { "class": "chips", role: "radiogroup", "aria-label": "Tema", style: "margin-top:6px" }), cur = document.documentElement.getAttribute("data-theme") || "auto";
    [["auto", "Automático"], ["light", "Claro"], ["dark", "Escuro"]].forEach(function (p) {
      var c = h("button", { "class": "chip", type: "button", role: "radio", "aria-checked": cur === p[0] ? "true" : "false" }, p[1]);
      c.addEventListener("click", function () { setTema(p[0]); drawProf(); }); th.appendChild(c);
    });
    cpf.appendChild(h("span", { "class": "small muted", style: "font-weight:700;margin-top:6px" }, "Tema")); cpf.appendChild(th); box.appendChild(cpf);

    if (logged()) {
      var cv2 = card("Privacidade e dados");
      cv2.appendChild(h("p", { "class": "small muted" }, "Neste protótipo, nome, celular (parte escondida), tipo de passe, histórico e reservas ficam só neste aparelho. Em uma versão real, valem a LGPD e o consentimento da prefeitura."));
      var vd = h("button", { "class": "btn", type: "button" }, profDump ? "Esconder meus dados" : "Ver meus dados"); vd.addEventListener("click", function () { profDump = !profDump; drawProf(); }); cv2.appendChild(vd);
      if (profDump) {
        var json = JSON.stringify({ conta: conta, passe: perfil, reservas: reservas }, null, 2);
        cv2.appendChild(h("pre", { "class": "dump" }, json));
        var cc = h("button", { "class": "btn", type: "button" }, "Copiar meus dados"); cc.addEventListener("click", function () { try { navigator.clipboard.writeText(json); cc.textContent = "Copiado"; } catch (e) { cc.textContent = "Selecione e copie o texto acima"; } }); cv2.appendChild(cc);
      }
      var ap = h("button", { "class": "btn danger", type: "button" }, apagarArm ? "Toque de novo para apagar tudo" : "Apagar minha conta e dados");
      ap.addEventListener("click", function () {
        if (!apagarArm) { apagarArm = true; drawProf(); setTimeout(function () { apagarArm = false; if (!$("#prof").hidden) drawProf(); }, 4000); return; }
        apagarArm = false; ["mre-conta", "mre-perfil", "mre-sessao", "mre-reservas"].forEach(function (k2) { store(k2, null); });
        conta = null; perfil = null; sessao = false; reservas.length = 0; drawMine(); lastBal = null; closeProf(); refreshViews(); toast("Conta e dados apagados deste aparelho."); SND.pop();
      });
      cv2.appendChild(ap); box.appendChild(cv2);
      var out = h("button", { "class": "btn", type: "button" }, "Sair da conta");
      out.addEventListener("click", function () { sessao = false; store("mre-sessao", false); perfil = null; lastBal = null; closeProf(); refreshViews(); toast("Você saiu da conta."); openAuth({}); });
      box.appendChild(out);
    }
    for (i = 0; i < box.children.length; i++) box.children[i].style.setProperty("--i", Math.min(i, 9));
  }
  function setTema(v) { if (v === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", v); store("mre-tema", v); }
  var temaSalvo = store("mre-tema"); if (temaSalvo && temaSalvo !== "auto") document.documentElement.setAttribute("data-theme", temaSalvo);
  $("#w-gate-in").addEventListener("click", function () { openAuth({ reason: "Entre ou crie sua conta para usar o Passe." }); });
  updateAvatar();
  if (logged() && conta.fav && conta.fav[0]) setFilter(conta.fav[0]);

  /* ---------- Abas ---------- */
  var tabs = [["tab-mapa", "p-mapa"], ["tab-horarios", "p-horarios"], ["tab-rodo", "p-rodo"], ["tab-carteira", "p-carteira"]];
  function openTab(id) {
    SND.tab();
    tabs.forEach(function (t) {
      var on = t[0] === id; $("#" + t[0]).setAttribute("aria-selected", on ? "true" : "false"); $("#" + t[0]).tabIndex = on ? 0 : -1; $("#" + t[1]).hidden = !on;
    });
    if (id === "tab-mapa") applyCam();
    if (id === "tab-horarios") drawHorarios();
    if (id === "tab-rodo") { drawMine(); }
    if (id === "tab-carteira") drawWallet();
    window.scrollTo(0, 0);
  }
  tabs.forEach(function (t, i) {
    var b = $("#" + t[0]);
    b.addEventListener("click", function () { openTab(t[0]); });
    b.addEventListener("keydown", function (e) {
      var j = e.key === "ArrowRight" ? (i + 1) % tabs.length : e.key === "ArrowLeft" ? (i + tabs.length - 1) % tabs.length : -1;
      if (j >= 0) { e.preventDefault(); openTab(tabs[j][0]); $("#" + tabs[j][0]).focus(); }
    });
  });
  show("r-dest"); drawDest(); drawMine();
})();
