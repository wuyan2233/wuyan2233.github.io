/* 青冥集 · site.js — 公共行为 */
(function () {
  'use strict';

  var MANIFEST_URL = 'content/posts.json';
  var cache = null;

  /* 数字 → 汉字 */
  var DIGITS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

  function cnNumber(n) {
    n = Number(n);
    if (n <= 10) return n === 10 ? '十' : DIGITS[n];
    if (n < 20) return '十' + DIGITS[n - 10];
    if (n < 100) {
      var tens = Math.floor(n / 10);
      var ones = n % 10;
      return DIGITS[tens] + '十' + (ones ? DIGITS[ones] : '');
    }
    return String(n);
  }

  function formatDate(iso) {
    if (!iso) return '';
    var parts = String(iso).split('-');
    if (parts.length !== 3) return iso;
    var year = parts[0].split('').map(function (d) { return DIGITS[Number(d)]; }).join('');
    return year + '年' + cnNumber(parts[1]) + '月' + cnNumber(parts[2]) + '日';
  }

  function formatDateShort(iso) {
    if (!iso) return '';
    var parts = String(iso).split('-');
    return parts[0] + '.' + parts[1] + '.' + parts[2];
  }

  function loadManifest() {
    if (cache) return Promise.resolve(cache);
    return fetch(MANIFEST_URL, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('manifest ' + r.status);
        return r.json();
      })
      .then(function (data) {
        data.posts = (data.posts || []).slice().sort(function (a, b) {
          return String(b.date).localeCompare(String(a.date));
        });
        cache = data;
        return data;
      });
  }

  function readingTime(chars) {
    var minutes = Math.max(1, Math.round(chars / 380));
    return minutes + ' 分钟';
  }

  function countOf(posts, section) {
    return posts.filter(function (p) { return p.section === section; }).length;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        resolve();
      } catch (e) {
        reject(e);
      } finally {
        ta.remove();
      }
    });
  }

  /* 复制：代码块与色卡 */
  function bindCopy() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-copy]');
      if (btn) {
        var block = btn.closest('.code-block');
        var code = block ? block.querySelector('code') : null;
        if (!code) return;
        copyText(code.textContent).then(function () {
          var old = btn.textContent;
          btn.textContent = '已复制';
          setTimeout(function () { btn.textContent = old; }, 1600);
        }).catch(function () {
          btn.textContent = '复制失败';
          setTimeout(function () { btn.textContent = '复制'; }, 1600);
        });
        return;
      }

      var swatch = e.target.closest('.swatch');
      if (swatch) {
        var hex = swatch.getAttribute('data-hex');
        copyText(hex).then(function () {
          swatch.setAttribute('data-copied', '1');
          var meta = swatch.querySelector('.swatch__meta');
          if (meta) {
            var old = meta.textContent;
            meta.textContent = '已复制 ' + hex.toUpperCase();
            setTimeout(function () { meta.textContent = old; }, 1500);
          }
        });
      }
    });
  }

  /* 入场动画 */
  function bindReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    items.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i * 60, 320) + 'ms';
      io.observe(el);
    });
  }

  /* 回到卷首 */
  function bindToTop() {
    var btn = document.querySelector('.to-top');
    if (!btn) {
      btn = document.createElement('button');
      btn.className = 'to-top';
      btn.type = 'button';
      btn.setAttribute('aria-label', '回到卷首');
      btn.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 19V6M6 12l6-6 6 6"/></svg>';
      document.body.appendChild(btn);
    }
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    var onScroll = function () {
      btn.classList.toggle('is-on', window.scrollY > 520);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* 阅读进度 */
  function bindProgress() {
    var bar = document.querySelector('.progress');
    if (!bar) return;
    var update = function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* 当前页高亮 */
  function markCurrent() {
    var here = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav a').forEach(function (a) {
      var target = a.getAttribute('href');
      if (!target) return;
      var file = target.split('?')[0].split('/').pop();
      if (file === here) a.setAttribute('aria-current', 'page');
    });
  }

  /* 数字填充 */
  function fillCounts() {
    var nodes = document.querySelectorAll('[data-count]');
    if (!nodes.length) return;
    loadManifest().then(function (data) {
      nodes.forEach(function (el) {
        var key = el.getAttribute('data-count');
        el.textContent = key === 'all' ? data.posts.length : countOf(data.posts, key);
      });
    }).catch(function () {});
  }

  function init() {
    markCurrent();
    bindCopy();
    bindReveal();
    bindToTop();
    bindProgress();
    fillCounts();
  }

  window.QM = window.QM || {};
  window.QM.manifest = loadManifest;
  window.QM.formatDate = formatDate;
  window.QM.formatDateShort = formatDateShort;
  window.QM.readingTime = readingTime;
  window.QM.copy = copyText;
  window.QM.countOf = countOf;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
