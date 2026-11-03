/* 青冥集 · theme.js — 换境：古风 ⇄ 星穹 */
(function () {
  'use strict';

  var STORAGE_KEY = 'qm-theme';
  var root = document.documentElement;
  var video = null;
  var buttons = [];
  var labels = [];
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  function readStored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function store(theme) {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
  }

  function pickSource() {
    var small = window.matchMedia('(max-width: 760px)').matches;
    return small ? 'assets/media/galaxy-960.mp4' : 'assets/media/galaxy.mp4';
  }

  function ensureVideo() {
    if (!video) video = document.getElementById('galaxy');
    if (!video) return;
    if (!video.dataset.ready) {
      video.preload = 'auto';
      video.src = pickSource();
      video.dataset.ready = '1';
      video.load();
    }
  }

  function playVideo() {
    ensureVideo();
    if (!video || reduced.matches) return;
    video.muted = true;
    video.autoplay = true;
    video.setAttribute('playsinline', '');
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* 自动播放被拒时静默失败 */ });
  }

  function pauseVideo() {
    if (video && !video.paused) video.pause();
  }

  function apply(theme, opts) {
    opts = opts || {};
    var isCosmos = theme === 'cosmos';
    root.setAttribute('data-theme', isCosmos ? 'cosmos' : 'guofeng');
    root.style.colorScheme = isCosmos ? 'dark' : 'light';

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isCosmos ? '#04070F' : '#EDF5F6');

    buttons.forEach(function (btn) {
      btn.setAttribute('aria-pressed', isCosmos ? 'true' : 'false');
      btn.setAttribute('aria-label', isCosmos ? '当前为星穹风格，点击切换为古风' : '当前为古风风格，点击切换为星穹');
      btn.title = isCosmos ? '换作古风' : '换作星穹';
    });
    labels.forEach(function (el) { el.textContent = isCosmos ? '星穹' : '古风'; });

    if (isCosmos) { playVideo(); } else { pauseVideo(); }

    document.dispatchEvent(new CustomEvent('qm:theme', { detail: { theme: isCosmos ? 'cosmos' : 'guofeng' } }));
    if (!opts.silent) store(isCosmos ? 'cosmos' : 'guofeng');
  }

  function toggle() {
    var next = root.getAttribute('data-theme') === 'cosmos' ? 'guofeng' : 'cosmos';

    root.classList.add('is-switching');
    apply(next);

    var x = window.innerWidth - 60;
    var y = 46;
    var btn0 = buttons[0];
    if (btn0) {
      var r = btn0.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top + r.height / 2;
    }
    var veil = document.createElement('div');
    veil.className = 'theme-veil';
    veil.setAttribute('aria-hidden', 'true');
    veil.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:200', 'pointer-events:none',
      'background:radial-gradient(circle at ' + x + 'px ' + y + 'px, rgba(124,243,255,.55), rgba(6,10,26,.35) 45%, transparent 70%)',
      'opacity:0', 'transition:opacity .8s ease'
    ].join(';');
    document.body.appendChild(veil);
    requestAnimationFrame(function () {
      veil.style.opacity = '0.85';
      setTimeout(function () { veil.style.opacity = '0'; }, 220);
      setTimeout(function () { veil.remove(); }, 1100);
    });

    setTimeout(function () { root.classList.remove('is-switching'); }, 780);
  }

  function init() {
    buttons = Array.prototype.slice.call(document.querySelectorAll('[data-theme-toggle]'));
    labels = Array.prototype.slice.call(document.querySelectorAll('[data-theme-label]'));
    video = document.getElementById('galaxy');

    var stored = readStored();
    var forced = new URLSearchParams(location.search).get('theme');
    if (forced === 'cosmos' || forced === 'guofeng') {
      stored = forced;
      store(forced);
      if (history.replaceState) {
        var clean = location.pathname + location.hash;
        history.replaceState(null, '', clean);
      }
    }
    apply(stored === 'cosmos' ? 'cosmos' : 'guofeng', { silent: true });

    buttons.forEach(function (btn) { btn.addEventListener('click', toggle); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 't' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); toggle(); }
    });

    document.addEventListener('visibilitychange', function () {
      if (root.getAttribute('data-theme') !== 'cosmos') return;
      if (document.hidden) pauseVideo(); else playVideo();
    });

    if (reduced.addEventListener) {
      reduced.addEventListener('change', function () {
        if (root.getAttribute('data-theme') === 'cosmos') {
          if (reduced.matches) pauseVideo(); else playVideo();
        }
      });
    }

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (!video || !video.dataset.ready) return;
        var want = pickSource();
        if (video.currentSrc.indexOf(want.replace('assets/media/', '')) === -1) {
          var wasPlaying = !video.paused;
          video.src = want;
          video.dataset.ready = '1';
          if (wasPlaying) playVideo();
        }
      }, 400);
    });
  }

  window.QM = window.QM || {};
  window.QM.toggleTheme = toggle;
  window.QM.getTheme = function () { return root.getAttribute('data-theme') || 'guofeng'; };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
