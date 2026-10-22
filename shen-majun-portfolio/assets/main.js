(function () {
  "use strict";
  var root = document.documentElement;
  var reduceMotion = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var NS = "http://www.w3.org/2000/svg";
  function css(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }
  function fmt(n) { return n.toLocaleString("en"); }
  function svgEl(parent, tag, attrs, text) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    parent.appendChild(e);
    return e;
  }
  var MONO = "IBM Plex Mono, ui-monospace, monospace";
  function label(parent, attrs, text) {
    var a = { "font-size": 11, "font-family": MONO, style: "fill:var(--muted)" };
    for (var k in attrs) a[k] = attrs[k];
    return svgEl(parent, "text", a, text);
  }

  /* ---------- theme switch ---------- */
  var themeHooks = [];
  try {
    var saved = localStorage.getItem("sm-theme");
    if (saved === "dark" || saved === "light") root.setAttribute("data-theme", saved);
  } catch (e) {}
  var themeBtn = document.getElementById("theme");
  if (themeBtn) themeBtn.addEventListener("click", function () {
    var dark = root.getAttribute("data-theme")
      ? root.getAttribute("data-theme") === "dark"
      : !!(window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
    var next = dark ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("sm-theme", next); } catch (e) {}
  });
  function themeChanged() { themeHooks.forEach(function (f) { f(); }); }
  new MutationObserver(themeChanged).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  if (window.matchMedia) {
    var mq = matchMedia("(prefers-color-scheme: dark)");
    if (mq.addEventListener) mq.addEventListener("change", themeChanged);
  }

  /* ---------- nav highlight ---------- */
  var navLinks = [].slice.call(document.querySelectorAll(".nav-links a"));
  if ("IntersectionObserver" in window && navLinks.length) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var a = byId[en.target.id];
        if (!a) return;
        navLinks.forEach(function (l) { l.classList.toggle("active", l === a); });
        var bar = a.parentNode;
        if (a.offsetLeft < bar.scrollLeft || a.offsetLeft + a.offsetWidth > bar.scrollLeft + bar.clientWidth) {
          bar.scrollTo({ left: a.offsetLeft - 12, behavior: reduceMotion ? "auto" : "smooth" });
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* ---------- copy email ---------- */
  [].forEach.call(document.querySelectorAll("[data-copy-email]"), function (btn) {
    var original = btn.textContent;
    btn.addEventListener("click", function () {
      var node = document.getElementById("email");
      var text = node.textContent.trim();
      function done(msg) { btn.textContent = msg; setTimeout(function () { btn.textContent = original; }, 1800); }
      function selectIt() {
        var s = window.getSelection(), r = document.createRange();
        r.selectNodeContents(node); s.removeAllRanges(); s.addRange(r);
        done("Selected, press Ctrl+C");
      }
      try {
        navigator.clipboard.writeText(text).then(function () { done("Copied"); }, selectIt);
      } catch (e) { selectIt(); }
    });
  });

  /* ---------- hero: doorway counter simulation ---------- */
  (function () {
    var canvas = document.getElementById("door");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var elIn = document.getElementById("c-in"), elOut = document.getElementById("c-out"), elNow = document.getElementById("c-now");
    var count = { in: 1284, out: 1197 };
    var W = 0, H = 0, col = {}, people = [], rings = [], tags = [];
    var running = false, visible = true, last = 0, nextSpawn = 0, pairId = 0;

    function readColors() {
      col = { sunk: css("--sunk"), surface: css("--surface"), ink: css("--ink"), muted: css("--muted"),
        rule: css("--rule"), signal: css("--signal"), soft: css("--signal-soft"), flag: css("--flag") };
    }
    function geo() { return { line: H * 0.54, d0: W * 0.27, d1: W * 0.73 }; }

    function spawn(atY) {
      var g = geo(), goingIn = Math.random() < 0.56, pair = Math.random() < 0.2;
      var speed = 34 + Math.random() * 28;
      var span = g.d1 - g.d0 - 40 - (pair ? 18 : 0);
      var x0 = g.d0 + 20 + Math.random() * span;
      var start = x0 + (Math.random() - 0.5) * W * 0.55;
      var y = atY != null ? atY : (goingIn ? -10 : H + 10);
      var id = pair ? ++pairId : 0;
      var n = pair ? 2 : 1;
      for (var i = 0; i < n; i++) {
        people.push({ x0: x0 + i * 18, sx: start + i * 18, x: start, y: y, prev: y, v: goingIn ? speed : -speed,
          ph: Math.random() * 6.28, pair: id, lead: i === 0 });
      }
    }
    function xAt(p, t) {
      var g = geo(), far = Math.min(1, Math.abs(p.y - g.line) / (H * 0.5));
      return p.x0 + (p.sx - p.x0) * far * far + Math.sin(t * 2.2 + p.ph) * 2.2;
    }
    function bump(el, val) {
      el.textContent = fmt(val);
      el.classList.add("bump");
      clearTimeout(el._t);
      el._t = setTimeout(function () { el.classList.remove("bump"); }, 350);
    }
    function step(dt, t) {
      var g = geo();
      nextSpawn -= dt;
      if (nextSpawn <= 0) { spawn(); nextSpawn = 0.55 + Math.random() * 0.8; }
      for (var i = people.length - 1; i >= 0; i--) {
        var p = people[i];
        p.prev = p.y; p.y += p.v * dt; p.x = xAt(p, t);
        var crossedIn = p.prev < g.line && p.y >= g.line, crossedOut = p.prev > g.line && p.y <= g.line;
        if (crossedIn || crossedOut) {
          if (crossedIn) { count.in++; bump(elIn, count.in); } else { count.out++; bump(elOut, count.out); }
          bump(elNow, count.in - count.out);
          rings.push({ x: p.x, age: 0, pair: !!p.pair });
          if (p.pair && p.lead) tags.push({ x: p.x + 9, y: g.line, age: 0 });
        }
        if (p.y < -30 || p.y > H + 30) people.splice(i, 1);
      }
      rings = rings.filter(function (r) { r.age += dt; return r.age < 0.6; });
      tags = tags.filter(function (r) { r.age += dt; return r.age < 1.3; });
    }
    function draw() {
      var g = geo();
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = col.sunk; ctx.fillRect(0, 0, W, H);
      // floor grid
      ctx.strokeStyle = col.rule; ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
      for (var gx = 24; gx < W; gx += 24) { ctx.beginPath(); ctx.moveTo(gx + 0.5, 0); ctx.lineTo(gx + 0.5, H); ctx.stroke(); }
      for (var gy = 24; gy < H; gy += 24) { ctx.beginPath(); ctx.moveTo(0, gy + 0.5); ctx.lineTo(W, gy + 0.5); ctx.stroke(); }
      ctx.globalAlpha = 1;
      // sensor field of view
      ctx.fillStyle = col.soft; ctx.globalAlpha = 0.75;
      ctx.beginPath(); ctx.ellipse(W / 2, g.line, (g.d1 - g.d0) / 2 + 18, H * 0.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      // walls
      ctx.fillStyle = col.ink;
      ctx.fillRect(0, g.line - 5, g.d0, 10); ctx.fillRect(g.d1, g.line - 5, W - g.d1, 10);
      // counting line
      ctx.strokeStyle = col.signal; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(g.d0, g.line); ctx.lineTo(g.d1, g.line); ctx.stroke(); ctx.setLineDash([]);
      // sensor
      ctx.fillStyle = col.ink; ctx.beginPath(); ctx.arc(W / 2, g.line, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = col.signal; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(W / 2, g.line, 9, 0, Math.PI * 2); ctx.stroke();
      // zone labels
      ctx.font = "500 10px " + MONO; ctx.fillStyle = col.muted; ctx.textBaseline = "top";
      ctx.fillText("OUTSIDE", 12, 12); ctx.textBaseline = "bottom"; ctx.fillText("INSIDE", 12, H - 10);
      ctx.textBaseline = "bottom"; ctx.fillText("COUNT LINE", g.d1 + 8, g.line - 8);
      // pair links
      var leads = {};
      people.forEach(function (p) { if (p.pair) { if (leads[p.pair]) {
        var q = leads[p.pair]; ctx.strokeStyle = col.flag; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.globalAlpha = 1;
      } else leads[p.pair] = p; } });
      // people
      people.forEach(function (p) {
        var c = p.pair ? col.flag : (p.v > 0 ? col.signal : col.muted);
        ctx.fillStyle = c; ctx.strokeStyle = col.surface; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = c; ctx.lineWidth = 1.5; ctx.beginPath();
        ctx.moveTo(p.x, p.y + (p.v > 0 ? 9 : -9)); ctx.lineTo(p.x, p.y + (p.v > 0 ? 14 : -14)); ctx.stroke();
      });
      // crossing rings
      rings.forEach(function (r) {
        var k = r.age / 0.6; ctx.globalAlpha = 1 - k; ctx.strokeStyle = r.pair ? col.flag : col.signal; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(r.x, g.line, 6 + k * 18, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.globalAlpha = 1;
      tags.forEach(function (tg) {
        var k = tg.age / 1.3; ctx.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
        ctx.font = "600 11px " + MONO; ctx.fillStyle = col.flag; ctx.textBaseline = "bottom";
        ctx.fillText("+2 · pair", tg.x + 10, tg.y - 10 - k * 18);
      });
      ctx.globalAlpha = 1;
    }
    function frame(ts) {
      if (!running) return;
      var dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
      step(dt, ts / 1000); draw();
      requestAnimationFrame(frame);
    }
    function play() {
      if (running || reduceMotion || !visible || document.hidden) return;
      running = true; last = performance.now(); requestAnimationFrame(frame);
    }
    function pause() { running = false; }
    function resize() {
      var r = canvas.getBoundingClientRect();
      if (!r.width) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!people.length) {
        for (var i = 0; i < 7; i++) spawn(H * (0.05 + Math.random() * 0.9));
        people.forEach(function (p) { p.x = xAt(p, 0); p.prev = p.y; });
      }
      draw();
    }
    readColors();
    resize();
    themeHooks.push(function () { readColors(); draw(); });
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener("resize", resize);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; visible ? play() : pause(); }).observe(canvas);
    }
    document.addEventListener("visibilitychange", function () { document.hidden ? pause() : play(); });
    play();
  })();

  /* ---------- dengue weekly chart ---------- */
  (function () {
    var svg = document.getElementById("chart");
    if (!svg) return;
    var cases = [520,597,490,494,371,389,422,432,392,399,359,298,334,355,398,396,361,331,381,383,389,368,358,374,428,414,450,384,384,378,338,368,367,301,178,310,326,328,323,316,340,370,410,365,364,419,438,359,488,526,430,347,455,501,455,488,574,522,608,621,582,509,496,496,483,430,490,457,464,418,398,425,418,365,372,372,379,379,386,393,333,347,393,400,347,314,394,374,348,348,408,395,355,415,402,435,435,356,429,482,462,561,535,469,415,612,535,523,433,510,382,484,446,369,471,510,458,458,394,420,510,471,471,523,510,587,497,587,676,741,625,651,664,676,689,510,702,830,830,715,830,933,1176,1202,1253,1356,1664,1548,1394,1561,1600,1612,1689,1497,1971,2087,1019,1930,2142,2252,2074,2204,2266,2485,2061,1630,1904,1698,1473,1137,1316,1261,980,1152,1282,1282,1618,1762,1577,1803,2036,2310,2146,2153,3146,2989,1818,2975,3071,2811,2476,2209,2291,1730,2299,2148,1826,2176,1936,2087,2019,2231,2430,2293,2437,2519,2951,2691,null,2629,2922,2962,3524,3057,3335,2979,2670,2646,2290,2021,1657,1634,1571,1357,1468,1524,1476,1698,1959,2070,2229,2166,2364,2728,2839,3290,2760,2547,2768,2594,2547,2460,2429,2239,2627,2334,1938,2089,2271,2153,2319,2169,2153,2122,2201,2090,2122,2241,2392,2447,2542,3318,3492,3642,3326,3310,2567,2772,2906,2709,2550,2234,2131,2131,2013,1839,1594,1538,1317,1340,1222,1213,1253,1592,1821,1766,2026,1497,2239,2184,1868,1812,1946,2191,2246,2136,2088,1606,1811,1693,1550,1645,1439,1344,1234,1383,1178,1233,1312,1367,1406,1588,1303,1679,1853,2040,1887,1559,1660,1921,1947,1874,1934,1807,1761,1848,2022,1895,1822,1875,2036,2250,2317,2230,2123,2184,1635,1963,2057,2004,1890,1910,1683,1402,1182,1296,1055,1202,1189,1029,1116,1176,1036,983,849,963,1010,1070,1003,1536,1903,1935,1740,1910,1793,1037,1164,1071,1064,1211,1158,1225,1272,1092,1078,1146,1039,1253,1193,1066,872,1079,1314,1548,1354,1508,1662,1555,1689,1843,2050,1890,1876,2010,2138,2191,2118,1944,1590,1590,1643,1429,1256,1336,1457,1570,1504,1611,1731,1725,1892,2046,2073,2615,2341,2455,2548,2566,3195,3352,3125,3239,2480,3047,2873,2611,2777,2577,2332,2062,1809,1731,1609,1626,1687,1854,2177,2028,2168,1575,2308,2788,2789,3173,3348,3400,3584,3217,3392,2729,2956,2738,2389,2284,2546,2372,2171,2006,1927,1971,1805,1937,2399,2173,2583,2435,2793,2618,2680,2837,3238,3396,3117,2733,3126,2716,2611,2515,2533,2210,1878,1294,1163,1111,1190,1286,1399,1408,1496,1810,1601,1924,1950,1759,2143,2125,2152,2091,1908,1777,1812,1926,1716,1656,1472,1499,1359,1307,1220,1098,1194,1151,1072,1011,950,916,829,890,811,811,811,null,729,690,762,565,625,533,586,599,541,534,495,384,443,450,457,510,477,471,425,471,517,537,564,695,663,584,663,526,473,500,527,422,435,370,331,410,377,443,476,516,490,490,405,405,504,484,504,518,564,591,663,584,725,720,734,797,633,715,662,604,676,546,594,734,879,947,1005,966,1024,710,1005,1430,1348,1391,1304,1502,1502,1575,1681,1498,1705,1512,1396,1386,1435,1362,1246,1237,1367,1546,1469,1478,1478,1623,1459,1585,1700,1715,1599,1720,1937,1879,1957,2034];
    var start = Date.UTC(2011, 0, 2), WEEK = 7 * 864e5;
    function dateOf(i) { return new Date(start + i * WEEK).toISOString().slice(0, 10); }
    function idxOf(iso) { return Math.round((Date.parse(iso) - start) / WEEK); }
    var flagged = ["2011-09-04", "2013-12-29", "2014-01-05", "2014-08-03", "2017-11-19"].map(idxOf);
    var m0 = idxOf("2020-03-15"), m1 = idxOf("2021-12-26");
    var W = 900, H = 320, L = 52, R = 14, T = 14, B = 34, maxY = 4000, n = cases.length;
    function x(i) { return L + i * (W - L - R) / (n - 1); }
    function y(v) { return T + (1 - v / maxY) * (H - T - B); }

    var layers = {
      mco: svgEl(svg, "g", {}), grid: svgEl(svg, "g", {}), gaps: svgEl(svg, "g", {}),
      line: svgEl(svg, "g", {}), flags: svgEl(svg, "g", {}), hover: svgEl(svg, "g", {})
    };
    svgEl(layers.mco, "rect", { x: x(m0), y: T, width: x(m1) - x(m0), height: H - T - B, style: "fill:var(--band)" });
    label(layers.mco, { x: x(m0) + 6, y: T + 14 }, "MCO");
    [0, 1000, 2000, 3000, 4000].forEach(function (v) {
      svgEl(layers.grid, "line", { x1: L, x2: W - R, y1: y(v), y2: y(v), style: "stroke:var(--rule)", "stroke-width": 1 });
      label(layers.grid, { x: L - 8, y: y(v) + 4, "text-anchor": "end" }, fmt(v));
    });
    for (var yr = 2011; yr <= 2022; yr++) {
      var xi = x(idxOf(yr + "-01-01"));
      label(layers.grid, { x: Math.max(xi, L), y: H - 12, "text-anchor": yr === 2011 ? "start" : "middle" }, yr);
    }
    cases.forEach(function (v, i) {
      if (v === null) svgEl(layers.gaps, "line", { x1: x(i), x2: x(i), y1: T, y2: H - B, style: "stroke:var(--muted)", "stroke-dasharray": "3 3" });
    });
    var d = "", area = "", pen = false, seg = [];
    function closeArea() { if (seg.length) { area += "M" + seg[0][0] + " " + y(0) + "L" + seg.map(function (p) { return p.join(" "); }).join("L") + "L" + seg[seg.length - 1][0] + " " + y(0) + "Z"; seg = []; } }
    cases.forEach(function (v, i) {
      if (v === null) { pen = false; closeArea(); return; }
      var px = x(i).toFixed(1), py = y(v).toFixed(1);
      d += (pen ? "L" : "M") + px + " " + py; pen = true; seg.push([px, py]);
    });
    closeArea();
    svgEl(layers.line, "path", { d: area, style: "fill:var(--signal);opacity:.09" });
    var path = svgEl(layers.line, "path", { d: d, fill: "none", "stroke-width": 1.6, "stroke-linejoin": "round", style: "stroke:var(--signal)" });
    flagged.forEach(function (i) {
      svgEl(layers.flags, "circle", { cx: x(i), cy: y(cases[i]), r: 4.5, "stroke-width": 1.5, style: "fill:var(--flag);stroke:var(--surface)" });
    });
    var peak = cases.indexOf(3642);
    svgEl(layers.line, "circle", { cx: x(peak), cy: y(3642), r: 3.5, style: "fill:var(--signal)" });
    label(layers.line, { x: x(peak) + 8, y: y(3642) + 4, style: "fill:var(--ink)" }, "3,642 · peak, week of " + dateOf(peak));

    var guide = svgEl(layers.hover, "line", { y1: T, y2: H - B, "stroke-width": 1, style: "stroke:var(--ink);opacity:0" });
    var dot = svgEl(layers.hover, "circle", { r: 4.5, "stroke-width": 2, style: "fill:var(--signal);stroke:var(--surface);opacity:0" });
    var tip = document.getElementById("chart-tip"), wrap = svg.closest(".chart-wrap");
    function show(e) {
      var r = svg.getBoundingClientRect(), px = (e.clientX - r.left) * W / r.width;
      var i = Math.max(0, Math.min(n - 1, Math.round((px - L) * (n - 1) / (W - L - R))));
      var v = cases[i], gx = x(i);
      guide.setAttribute("x1", gx); guide.setAttribute("x2", gx); guide.style.opacity = 0.3;
      if (v !== null) { dot.setAttribute("cx", gx); dot.setAttribute("cy", y(v)); dot.style.opacity = 1; } else dot.style.opacity = 0;
      var notes = [];
      if (flagged.indexOf(i) >= 0) notes.push('<span class="t-flag">QC flag: &gt;50% change</span>');
      if (i >= m0 && i <= m1) notes.push("MCO period");
      tip.innerHTML = "Week of " + dateOf(i) + "<br><b>" + (v === null ? "Missing in source" : fmt(v) + " cases") + "</b>" + (notes.length ? "<br>" + notes.join(" · ") : "");
      tip.hidden = false;
      var wr = wrap.getBoundingClientRect(), sx = r.left - wr.left + gx * r.width / W;
      var sy = r.top - wr.top + (v === null ? y(2000) : y(v)) * r.height / H;
      var half = tip.offsetWidth / 2 + 4;
      tip.style.left = Math.max(half, Math.min(wr.width - half, sx)) + "px";
      tip.style.top = Math.max(tip.offsetHeight + 16, sy) + "px";
    }
    function hide() { guide.style.opacity = 0; dot.style.opacity = 0; tip.hidden = true; }
    svg.addEventListener("pointermove", show);
    svg.addEventListener("pointerdown", show);
    svg.addEventListener("pointerleave", hide);

    [].forEach.call(document.querySelectorAll("[data-layer]"), function (btn) {
      btn.addEventListener("click", function () {
        var on = btn.getAttribute("aria-pressed") !== "true";
        btn.setAttribute("aria-pressed", String(on));
        layers[btn.getAttribute("data-layer")].style.display = on ? "" : "none";
      });
    });

    if (!reduceMotion && "IntersectionObserver" in window) {
      var len = path.getTotalLength();
      var io = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        io.disconnect();
        path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
        path.getBoundingClientRect();
        path.style.transition = "stroke-dashoffset 1.6s cubic-bezier(.4,0,.2,1)";
        path.style.strokeDashoffset = 0;
      }, { threshold: 0.35 });
      io.observe(svg);
    }
  })();

  /* ---------- pipeline steps ---------- */
  (function () {
    var steps = [
      ["Fetch every source and log it", "Downloads 34 raw files from OpenDengue, NASA POWER, the Ministry of Health, OxCGRT and OpenDOSM. Each download is logged with its URL, UTC time, size and SHA-256, and raw files are never edited afterwards."],
      ["Build one weekly table", "Aggregates daily climate at 16 state capitals into population-weighted weekly values with 1–8 week lags, then joins cases, lockdown phases, stringency, mobility and population into analysis_weekly.csv: 626 weeks, one row each."],
      ["Check before anyone uses it", "Runs seven checks: file integrity, calendar, case counts, outliers, climate ranges, lag alignment through an independent code path, and a re-run hash. Any failure exits with code 1, so a broken table cannot pass quietly."],
      ["Prove it on another machine", "A hand-off kit ships reference outputs, their SHA-256 sums and a compare script. On a second computer the full rebuild took 38 seconds and all three outputs matched the reference exactly."]
    ];
    var tabs = [].slice.call(document.querySelectorAll(".step"));
    var title = document.getElementById("step-title"), text = document.getElementById("step-text");
    function select(i, focus) {
      tabs.forEach(function (t, k) { t.setAttribute("aria-selected", String(k === i)); t.tabIndex = k === i ? 0 : -1; });
      title.textContent = steps[i][0]; text.textContent = steps[i][1];
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(i); });
      t.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          select((i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length, true);
        }
      });
    });
    if (tabs.length) select(0);
  })();

  /* ---------- NHANES forest plot ---------- */
  (function () {
    var svg = document.getElementById("forest");
    if (!svg) return;
    // [cycle, comparison, validation [est, lo, hi], development [est, lo, hi]]
    var rows = [
      ["NHANES 2011–14", "+ body fat % and visceral fat", [0.0209, 0.0032, 0.0375], [0.0209, 0.0024, 0.0402]],
      ["NHANES 2011–14", "+ muscle mass", [-0.0008, -0.0036, 0.0020], [-0.0030, -0.0069, 0.0011]],
      ["NHANES 2011–14", "+ grip strength (primary)", [0.0045, -0.0009, 0.0098], [-0.0046, -0.0107, 0.0013]],
      ["NHANES 2015–18", "+ body fat % only", [0.0023, -0.0070, 0.0112], [-0.0013, -0.0095, 0.0067]],
      ["NHANES 2015–18", "+ visceral fat", [0.0425, 0.0185, 0.0667], [0.0296, 0.0088, 0.0502]],
      ["NHANES 2015–18", "+ visceral fat and body fat %", [0.0569, 0.0276, 0.0882], [0.0427, 0.0178, 0.0692]]
    ];
    var FL = 330, FR = 872, FT = 16, rowH = 40, lo = -0.02, hi = 0.10;
    function fx(v) { return FL + (v - lo) / (hi - lo) * (FR - FL); }
    var FB = FT + rows.length * rowH;
    [-0.02, 0, 0.02, 0.04, 0.06, 0.08, 0.10].forEach(function (v) {
      var a = { x1: fx(v), x2: fx(v), y1: FT, y2: FB, "stroke-width": 1, style: v === 0 ? "stroke:var(--ink)" : "stroke:var(--rule)" };
      if (v === 0) a["stroke-dasharray"] = "4 3";
      svgEl(svg, "line", a);
      label(svg, { x: fx(v), y: FB + 18, "text-anchor": "middle" }, (v > 0 ? "+" : "") + v.toFixed(2));
    });
    label(svg, { x: (FL + FR) / 2, y: FB + 38, "text-anchor": "middle" }, "Change in AUC");
    var cohort = "val", marks = [];
    rows.forEach(function (r, k) {
      var cy = FT + k * rowH + rowH / 2;
      var band = svgEl(svg, "rect", { x: 0, y: cy - rowH / 2, width: 900, height: rowH, rx: 6, style: "fill:var(--sunk);opacity:0" });
      label(svg, { x: 6, y: cy - 3 }, r[0]);
      svgEl(svg, "text", { x: 6, y: cy + 13, "font-size": 13, "font-family": "IBM Plex Sans, sans-serif", style: "fill:var(--ink)" }, r[1]);
      var ci = svgEl(svg, "line", { y1: cy, y2: cy, "stroke-width": 2.5, "stroke-linecap": "round" });
      var box = svgEl(svg, "rect", { y: cy - 5, width: 10, height: 10, rx: 2 });
      var val = label(svg, { y: cy + 4 });
      var hit = svgEl(svg, "rect", { x: 0, y: cy - rowH / 2, width: 900, height: rowH, style: "fill:transparent;cursor:default" });
      marks.push({ ci: ci, box: box, val: val, band: band, hit: hit, cur: r[2].slice(), cy: cy });
    });
    function paint(m, v) {
      var c = v[1] > 0 ? "var(--signal)" : "var(--muted)";
      m.ci.setAttribute("x1", fx(v[1])); m.ci.setAttribute("x2", fx(v[2])); m.ci.style.stroke = c;
      m.box.setAttribute("x", fx(v[0]) - 5); m.box.style.fill = c;
      m.val.setAttribute("x", fx(v[2]) + 8); m.val.style.fill = c;
      m.val.textContent = (v[0] > 0 ? "+" : "") + v[0].toFixed(3);
    }
    marks.forEach(function (m) { paint(m, m.cur); });

    var tip = document.getElementById("forest-tip"), wrap = svg.closest(".chart-wrap");
    marks.forEach(function (m, k) {
      m.hit.addEventListener("pointerenter", function () {
        m.band.style.opacity = 1;
        var v = rows[k][cohort === "val" ? 2 : 3];
        tip.innerHTML = rows[k][0] + " · " + (cohort === "val" ? "validation" : "development") +
          "<br><b>ΔAUC " + (v[0] > 0 ? "+" : "") + v[0].toFixed(4) + "</b><br>95% CI " + v[1].toFixed(4) + " to " + v[2].toFixed(4);
        tip.hidden = false;
        var r = svg.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
        var sx = r.left - wr.left + fx(v[0]) * r.width / 900, sy = r.top - wr.top + (m.cy - 8) * r.height / 300;
        var half = tip.offsetWidth / 2 + 4;
        tip.style.left = Math.max(half, Math.min(wr.width - half, sx)) + "px";
        tip.style.top = Math.max(tip.offsetHeight + 16, sy) + "px";
      });
      m.hit.addEventListener("pointerleave", function () { m.band.style.opacity = 0; tip.hidden = true; });
    });

    var note = document.getElementById("forest-note");
    var notes = {
      val: "Validation cohort: frozen models scored once on the later survey cycle.",
      dev: "Development cohort: out-of-fold predictions from nested cross-validation."
    };
    function setCohort(c) {
      cohort = c;
      note.textContent = notes[c];
      [].forEach.call(document.querySelectorAll("[data-cohort]"), function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-cohort") === c)); });
      var from = marks.map(function (m) { return m.cur.slice(); });
      var to = rows.map(function (r) { return r[c === "val" ? 2 : 3]; });
      if (reduceMotion) { marks.forEach(function (m, k) { m.cur = to[k].slice(); paint(m, m.cur); }); return; }
      var t0 = performance.now(), dur = 550;
      (function tick(now) {
        var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        marks.forEach(function (m, i) {
          m.cur = [0, 1, 2].map(function (j) { return from[i][j] + (to[i][j] - from[i][j]) * e; });
          paint(m, k < 1 ? m.cur : to[i]);
        });
        if (k < 1) requestAnimationFrame(tick);
      })(t0);
    }
    [].forEach.call(document.querySelectorAll("[data-cohort]"), function (b) {
      b.addEventListener("click", function () { setCohort(b.getAttribute("data-cohort")); });
    });
  })();
})();
