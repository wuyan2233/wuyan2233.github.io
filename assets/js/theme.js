/* theme.js —— 两套背景风格的切换，默认深空 */
(function () {
  'use strict';

  var KEY = 'wuyan-theme';
  var root = document.documentElement;
  var video = null;
  var buttons = [];
  var labels = [];
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  function read() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function write(v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
  }

  function source() {
    return window.matchMedia('(max-width: 760px)').matches
      ? 'assets/media/galaxy-960.mp4'
      : 'assets/media/galaxy.mp4';
  }

  function prepare() {
    if (!video) video = document.getElementById('galaxy');
    if (!video || video.dataset.ready) return;
    video.preload = 'auto';
    video.src = source();
    video.dataset.ready = '1';
    video.load();
  }

  function play() {
    prepare();
    if (!video || reduced.matches) return;
    video.muted = true;
    video.autoplay = true;
    video.setAttribute('playsinline', '');
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }

  function pause() {
    if (video && !video.paused) video.pause();
  }

  function apply(theme, opts) {
    opts = opts || {};
    var space = theme === 'cosmos';
    root.setAttribute('data-theme', space ? 'cosmos' : 'guofeng');
    root.style.colorScheme = space ? 'dark' : 'light';

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', space ? '#05070F' : '#F4ECE6');

    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', space ? 'false' : 'true');
      b.setAttribute('aria-label', space ? '当前背景：深空。点击切换为山水' : '当前背景：山水。点击切换为深空');
      b.title = space ? '切换为山水背景' : '切换为深空背景';
    });
    labels.forEach(function (l) { l.textContent = space ? '深空' : '山水'; });

    if (space) play(); else pause();
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: space ? 'cosmos' : 'guofeng' } }));
    if (!opts.silent) write(space ? 'cosmos' : 'guofeng');
  }

  function toggle() {
    var next = root.getAttribute('data-theme') === 'cosmos' ? 'guofeng' : 'cosmos';
    apply(next);
    var veil = document.createElement('div');
    veil.setAttribute('aria-hidden', 'true');
    veil.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:300', 'pointer-events:none',
      'opacity:0', 'transition:opacity .55s ease',
      'background:' + (next === 'cosmos'
        ? 'radial-gradient(circle at 12% 6%, rgba(90,215,255,.55), rgba(5,7,15,.85) 62%)'
        : 'radial-gradient(circle at 12% 6%, rgba(255,246,238,.95), rgba(244,236,230,.92) 62%)')
    ].join(';');
    document.body.appendChild(veil);
    requestAnimationFrame(function () {
      veil.style.opacity = '.9';
      setTimeout(function () { veil.style.opacity = '0'; }, 180);
      setTimeout(function () { veil.remove(); }, 900);
    });
  }

  function init() {
    buttons = Array.prototype.slice.call(document.querySelectorAll('[data-style-toggle]'));
    labels = Array.prototype.slice.call(document.querySelectorAll('[data-style-label]'));
    video = document.getElementById('galaxy');

    var stored = read();
    var forced = new URLSearchParams(location.search).get('theme');
    if (forced === 'cosmos' || forced === 'guofeng') {
      stored = forced;
      write(forced);
      if (history.replaceState) {
        var clean = new URL(location.href);
        clean.searchParams.delete('theme');
        history.replaceState(null, '', clean.pathname + (clean.search || '') + clean.hash);
      }
    }
    apply(stored === 'guofeng' ? 'guofeng' : 'cosmos', { silent: true });

    buttons.forEach(function (b) { b.addEventListener('click', toggle); });

    document.addEventListener('visibilitychange', function () {
      if (root.getAttribute('data-theme') !== 'cosmos') return;
      if (document.hidden) pause(); else play();
    });

    if (reduced.addEventListener) {
      reduced.addEventListener('change', function () {
        if (root.getAttribute('data-theme') !== 'cosmos') return;
        if (reduced.matches) pause(); else play();
      });
    }

    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        if (!video || !video.dataset.ready) return;
        if (video.currentSrc.indexOf('galaxy-960') > -1 === window.matchMedia('(max-width: 760px)').matches) return;
        var was = !video.paused;
        video.src = source();
        video.dataset.ready = '1';
        if (was) play();
      }, 500);
    });
  }

  window.QM = window.QM || {};
  window.QM.toggleStyle = toggle;
  window.QM.theme = function () { return root.getAttribute('data-theme') || 'cosmos'; };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
