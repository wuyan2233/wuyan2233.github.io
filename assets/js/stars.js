/* stars.js —— 深空主题的星子与流星 */
(function () {
  'use strict';

  var canvas, ctx, stars = [], meteors = [];
  var w = 0, h = 0, dpr = 1, raf = 0, running = false;
  var nextMeteor = 0;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    var count = Math.round(Math.min(200, Math.max(60, (w * h) / 11000)));
    stars = [];
    for (var i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.1 + 0.25,
        base: Math.random() * 0.45 + 0.25,
        amp: Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.0012 + 0.0004,
        depth: Math.random() * 0.7 + 0.3,
        hue: Math.random() < 0.25 ? '150, 230, 255' : (Math.random() < 0.5 ? '255,255,255' : '190, 205, 255')
      });
    }
    nextMeteor = performance.now() + 5200;
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var a = s.base + Math.sin(t * s.speed * 6 + s.phase) * s.amp;
      var px = s.x + pointer.x * s.depth * 10;
      var py = s.y + pointer.y * s.depth * 7;
      ctx.beginPath();
      ctx.arc(px, py, s.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + s.hue + ',' + Math.max(0.05, a).toFixed(3) + ')';
      ctx.fill();
      if (s.r > 1) {
        var g = ctx.createRadialGradient(px, py, 0, px, py, s.r * 3.2);
        g.addColorStop(0, 'rgba(' + s.hue + ',0.14)');
        g.addColorStop(1, 'rgba(' + s.hue + ',0)');
        ctx.beginPath();
        ctx.arc(px, py, s.r * 3.2, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }
    }

    for (var j = meteors.length - 1; j >= 0; j--) {
      var m = meteors[j];
      m.x += m.vx; m.y += m.vy; m.life += 1;
      var alpha = Math.sin(Math.min(m.life / m.max, 1) * Math.PI) * 0.75;
      var nx = m.x - m.vx * (m.len / 4);
      var ny = m.y - m.vy * (m.len / 4);
      var grad = ctx.createLinearGradient(m.x, m.y, nx, ny);
      grad.addColorStop(0, 'rgba(255,255,255,' + alpha.toFixed(3) + ')');
      grad.addColorStop(0.4, 'rgba(90,215,255,' + (alpha * 0.5).toFixed(3) + ')');
      grad.addColorStop(1, 'rgba(90,215,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      if (m.life > m.max || m.y > h + 80) meteors.splice(j, 1);
    }
  }

  function frame(t) {
    if (!running) return;
    draw(t);
    if (t > nextMeteor) {
      var left = Math.random() < 0.5;
      meteors.push({
        x: left ? Math.random() * w * 0.45 : w * (0.55 + Math.random() * 0.45),
        y: -40 - Math.random() * 60,
        vx: (left ? 1 : -1) * (3.2 + Math.random() * 2.4),
        vy: 2.2 + Math.random() * 1.4,
        life: 0,
        max: 150 + Math.random() * 60,
        len: 110 + Math.random() * 120
      });
      nextMeteor = t + 6000 + Math.random() * 7000;
    }
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (!canvas) {
      canvas = document.getElementById('stars');
      if (!canvas) return;
      ctx = canvas.getContext('2d');
      resize();
      window.addEventListener('resize', resize);
      window.addEventListener('pointermove', function (e) {
        pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
        pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });
    }
    if (running) return;
    if (reduced.matches) { draw(800); return; }
    running = true;
    draw(performance.now());
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (ctx) ctx.clearRect(0, 0, w, h);
  }

  window.QM = window.QM || {};
  window.QM.stars = { start: start, stop: stop };

  document.addEventListener('themechange', function (e) {
    if (e.detail.theme === 'cosmos') start(); else stop();
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else if (document.documentElement.getAttribute('data-theme') === 'cosmos') start();
  });
  if (document.documentElement.getAttribute('data-theme') === 'cosmos') start();
})();
