/* petals.js —— 古风主题的落樱 */
(function () {
  'use strict';

  var canvas, ctx;
  var w = 0, h = 0, dpr = 1, raf = 0, running = false, last = 0;
  var petals = [];
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var wind = 0;

  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function makePetal(initial) {
    var depth = Math.random();
    return {
      x: Math.random() * (w + 200) - 100,
      y: initial ? Math.random() * h : -30 - Math.random() * 120,
      r: 2.4 + depth * 4.2,
      vy: 12 + depth * 26,
      vx: (Math.random() - 0.5) * 10,
      sway: 10 + Math.random() * 26,
      swaySpeed: 0.4 + Math.random() * 0.9,
      phase: Math.random() * Math.PI * 2,
      rot: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 1.6,
      alpha: 0.35 + depth * 0.45,
      depth: depth,
      shape: Math.random() < 0.25 ? 1 : 0
    };
  }

  function seed() {
    var count = Math.round(Math.min(46, Math.max(18, w / 34)));
    petals = [];
    for (var i = 0; i < count; i++) petals.push(makePetal(true));
  }

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = p.alpha;
    var grd = ctx.createLinearGradient(-p.r, -p.r, p.r, p.r);
    grd.addColorStop(0, '#FBD9DD');
    grd.addColorStop(0.55, '#F2B7C0');
    grd.addColorStop(1, '#E39AA8');
    ctx.fillStyle = grd;
    ctx.beginPath();
    if (p.shape) {
      ctx.ellipse(0, 0, p.r * 0.75, p.r * 1.15, 0, 0, Math.PI * 2);
    } else {
      ctx.ellipse(0, 0, p.r, p.r * 0.62, 0.5, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  }

  function step(t) {
    if (!running) return;
    var dt = Math.min((t - last) / 1000, 0.05);
    last = t;
    ctx.clearRect(0, 0, w, h);
    wind = Math.sin(t / 5200) * 14;

    for (var i = 0; i < petals.length; i++) {
      var p = petals[i];
      p.phase += dt * p.swaySpeed;
      p.y += p.vy * dt;
      p.x += (p.vx + wind * p.depth + Math.sin(p.phase) * p.sway * 0.5) * dt;
      p.rot += p.spin * dt;
      if (p.y > h + 40 || p.x < -160 || p.x > w + 160) {
        petals[i] = makePetal(false);
        petals[i].x = Math.random() * (w + 160) - 80;
      }
      drawPetal(p);
    }
    raf = requestAnimationFrame(step);
  }

  function start() {
    if (!canvas) {
      canvas = document.getElementById('petals');
      if (!canvas) return;
      ctx = canvas.getContext('2d');
      resize();
      window.addEventListener('resize', resize);
    }
    if (running) return;
    if (reduced.matches) {
      ctx.clearRect(0, 0, w, h);
      petals.slice(0, 14).forEach(drawPetal);
      return;
    }
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(step);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (ctx) ctx.clearRect(0, 0, w, h);
  }

  window.QM = window.QM || {};
  window.QM.petals = { start: start, stop: stop };

  document.addEventListener('themechange', function (e) {
    if (e.detail.theme === 'guofeng') start(); else stop();
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else if (document.documentElement.getAttribute('data-theme') === 'guofeng') start();
  });
  if (document.documentElement.getAttribute('data-theme') === 'guofeng') start();
})();
