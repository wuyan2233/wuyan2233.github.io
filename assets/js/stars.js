/* 青冥集 · stars.js — 星子、流星 */
(function () {
  'use strict';

  var canvas = null;
  var ctx = null;
  var stars = [];
  var meteors = [];
  var raf = 0;
  var w = 0, h = 0, dpr = 1;
  var last = 0;
  var nextMeteor = 0;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var running = false;
  var pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    var count = Math.round(Math.min(220, Math.max(70, (w * h) / 9000)));
    stars = [];
    for (var i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.25 + 0.28,
        base: Math.random() * 0.5 + 0.25,
        amp: Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.0014 + 0.0004,
        depth: Math.random() * 0.7 + 0.3,
        hue: Math.random() < 0.22 ? '190, 240, 255' : (Math.random() < 0.5 ? '255, 255, 255' : '196, 210, 255')
      });
    }
    nextMeteor = performance.now() + 4200;
  }

  function drawStars(t) {
    ctx.clearRect(0, 0, w, h);
    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var twinkle = s.base + Math.sin(t * s.speed * 6 + s.phase) * s.amp;
      var px = s.x + pointer.x * s.depth * 12;
      var py = s.y + pointer.y * s.depth * 8;
      ctx.beginPath();
      ctx.arc(px, py, s.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + s.hue + ',' + Math.max(0.06, twinkle).toFixed(3) + ')';
      ctx.fill();

      if (s.r > 1.15) {
        ctx.beginPath();
        ctx.arc(px, py, s.r * 3.4, 0, Math.PI * 2);
        var g = ctx.createRadialGradient(px, py, 0, px, py, s.r * 3.4);
        g.addColorStop(0, 'rgba(' + s.hue + ',0.16)');
        g.addColorStop(1, 'rgba(' + s.hue + ',0)');
        ctx.fillStyle = g;
        ctx.fill();
      }
    }
  }

  function spawnMeteor() {
    var fromLeft = Math.random() < 0.5;
    meteors.push({
      x: fromLeft ? Math.random() * w * 0.4 : w * (0.6 + Math.random() * 0.4),
      y: -40 - Math.random() * 80,
      vx: (fromLeft ? 1 : -1) * (3.4 + Math.random() * 2.6),
      vy: 2.4 + Math.random() * 1.6,
      life: 0,
      max: 150 + Math.random() * 70,
      len: 110 + Math.random() * 130
    });
  }

  function drawMeteors(t) {
    for (var i = meteors.length - 1; i >= 0; i--) {
      var m = meteors[i];
      m.x += m.vx;
      m.y += m.vy;
      m.life += 1;
      var alpha = Math.sin(Math.min(m.life / m.max, 1) * Math.PI) * 0.75;
      var nx = m.x - m.vx * (m.len / 4);
      var ny = m.y - m.vy * (m.len / 4);
      var grad = ctx.createLinearGradient(m.x, m.y, nx, ny);
      grad.addColorStop(0, 'rgba(255,255,255,' + alpha.toFixed(3) + ')');
      grad.addColorStop(0.35, 'rgba(124,243,255,' + (alpha * 0.55).toFixed(3) + ')');
      grad.addColorStop(1, 'rgba(124,243,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      if (m.life > m.max || m.y > h + 100) meteors.splice(i, 1);
    }
  }

  function frame(t) {
    if (!running) return;
    var dt = t - last;
    last = t;
    drawStars(t);
    if (t > nextMeteor) {
      spawnMeteor();
      nextMeteor = t + 5200 + Math.random() * 6800;
    }
    drawMeteors(t);
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

    if (reduced.matches) {
      drawStars(1200);
      return;
    }
    running = true;
    last = performance.now();
    drawStars(last);
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

  document.addEventListener('qm:theme', function (e) {
    if (e.detail.theme === 'cosmos') start(); else stop();
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else if ((document.documentElement.getAttribute('data-theme') === 'cosmos')) start();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (document.documentElement.getAttribute('data-theme') === 'cosmos') start();
    });
  } else if (document.documentElement.getAttribute('data-theme') === 'cosmos') {
    start();
  }
})();
