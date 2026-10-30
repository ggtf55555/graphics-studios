/* Interactive dot-grid background shared by every page.
   - Faint navy dots fill the screen; a few soft glow zones drift around, and
     inside them dots grow, brighten, appear and disappear.
   - The pointer carries its own glow and gently pulls nearby dots toward it.
   - Honors prefers-reduced-motion (static grid) and pauses when the tab is hidden. */
(function () {
  if (window.__dotsBg) return;
  window.__dotsBg = true;

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var canvas = document.createElement("canvas");
  canvas.id = "bg-dots";
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;";
  document.body.insertBefore(canvas, document.body.firstChild);
  var ctx = canvas.getContext("2d");

  var GAP = 38;              // distance between dots
  var BASE = [30, 48, 80];   // dim navy
  var GLOW = [96, 165, 255]; // bright blue
  var W = 0, H = 0, DPR = 1, cols = 0, rows = 0, dots = [];

  var mouse = { x: -9999, y: -9999, sx: -9999, sy: -9999, on: false, power: 0 };
  var blobs = [
    { fx: 0.00011, fy: 0.00017, px: 0.0, py: 1.3, r: 290 },
    { fx: 0.00016, fy: 0.00009, px: 2.1, py: 0.4, r: 240 },
    { fx: 0.00008, fy: 0.00013, px: 4.2, py: 2.8, r: 330 }
  ];

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cols = Math.ceil(W / GAP) + 1;
    rows = Math.ceil(H / GAP) + 1;
    var offX = (W - (cols - 1) * GAP) / 2;
    var offY = (H - (rows - 1) * GAP) / 2;
    dots = [];
    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < cols; i++) {
        dots.push({
          x: offX + i * GAP,
          y: offY + j * GAP,
          ph: Math.random() * Math.PI * 2,
          sp: 0.0006 + Math.random() * 0.0016
        });
      }
    }
  }

  function mix(a, b, t) {
    return Math.round(a + (b - a) * t);
  }

  function frame(now) {
    ctx.clearRect(0, 0, W, H);

    // blob centres wander along slow lissajous paths
    var bx = [], by = [];
    for (var b = 0; b < blobs.length; b++) {
      var bl = blobs[b];
      bx.push(W * (0.5 + 0.42 * Math.sin(now * bl.fx + bl.px)));
      by.push(H * (0.5 + 0.40 * Math.sin(now * bl.fy + bl.py)));
    }

    // pointer glow eases toward the cursor and fades in/out
    if (mouse.on) {
      mouse.sx += (mouse.x - mouse.sx) * 0.12;
      mouse.sy += (mouse.y - mouse.sy) * 0.12;
      mouse.power += (1 - mouse.power) * 0.08;
    } else {
      mouse.power *= 0.94;
    }
    var MR = 190;

    for (var k = 0; k < dots.length; k++) {
      var d = dots[k];

      var glow = 0;
      for (var q = 0; q < blobs.length; q++) {
        var dx = d.x - bx[q], dy = d.y - by[q];
        var rr = blobs[q].r;
        glow += Math.exp(-(dx * dx + dy * dy) / (rr * rr));
      }
      if (glow > 1) glow = 1;

      // each dot slowly fades in and out on its own clock
      var tw = reduce ? 0.6 : 0.5 + 0.5 * Math.sin(now * d.sp + d.ph);
      var life = tw;

      var px = d.x, py = d.y, m = 0;
      if (mouse.power > 0.01) {
        var mdx = mouse.sx - d.x, mdy = mouse.sy - d.y;
        var md2 = mdx * mdx + mdy * mdy;
        m = Math.exp(-md2 / (MR * MR)) * mouse.power;
        var pull = m * 0.16;           // dots lean toward the pointer
        px += mdx * pull;
        py += mdy * pull;
      }

      var heat = Math.min(1, glow * (0.4 + 0.6 * life) * 1.25 + m * 1.8);
      var alpha = 0.3 + 0.7 * heat;
      if (glow < 0.05 && m < 0.05) alpha *= 0.55 + 0.45 * life;  // ambient flicker
      var size = 1.3 + heat * 2.7;

      ctx.fillStyle = "rgba(" + mix(BASE[0], GLOW[0], heat) + "," + mix(BASE[1], GLOW[1], heat) + "," + mix(BASE[2], GLOW[2], heat) + "," + alpha.toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(px, py, size, 0, 6.2832);
      ctx.fill();
    }
  }

  var raf = 0;
  function loop(now) {
    frame(now);
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (reduce) { frame(1500); return; }
    if (!raf) raf = requestAnimationFrame(loop);
  }
  function stop() {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  window.addEventListener("resize", function () { resize(); if (reduce) frame(1500); });
  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });

  if (!reduce) {
    window.addEventListener("pointermove", function (e) {
      if (mouse.sx < -9000) { mouse.sx = e.clientX; mouse.sy = e.clientY; }
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true;
    }, { passive: true });
    document.addEventListener("pointerleave", function () { mouse.on = false; });
    window.addEventListener("pointerup", function (e) { if (e.pointerType === "touch") mouse.on = false; });
    window.addEventListener("blur", function () { mouse.on = false; });
  }

  resize();
  start();
})();
