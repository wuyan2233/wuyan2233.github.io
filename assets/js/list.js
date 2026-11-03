/* 青冥集 · list.js — 分区页的文章列表 */
(function () {
  'use strict';

  var section = document.body.getAttribute('data-section') || 'articles';
  var listEl = document.getElementById('post-list');
  var countEl = document.querySelector('[data-section-count]');
  var searchEl = document.getElementById('search');
  var hintEl = document.querySelector('[data-search-hint]');
  var all = [];

  function row(post) {
    var article = document.createElement('article');
    article.className = 'post-item reveal';
    article.setAttribute('data-search', (post.title + ' ' + (post.tags || []).join(' ') + ' ' + (post.excerpt || '')).toLowerCase());

    var tags = (post.tags || []).map(function (t) {
      return '<span class="tag">' + window.MD.esc(t) + '</span>';
    }).join('');

    article.innerHTML =
      '<div class="post-item__date">' + window.QM.formatDate(post.date) + '</div>' +
      '<div class="post-item__body">' +
        '<h3><a href="post.html?s=' + encodeURIComponent(post.section) + '&amp;slug=' + encodeURIComponent(post.slug) + '">' +
          window.MD.esc(post.title) + '</a></h3>' +
        '<p>' + window.MD.esc(post.excerpt || '') + '</p>' +
        (tags ? '<div class="tags">' + tags + '</div>' : '') +
      '</div>' +
      '<span class="post-item__arrow" aria-hidden="true">→</span>';
    return article;
  }

  function render(posts) {
    listEl.innerHTML = '';
    if (!posts.length) {
      listEl.innerHTML = '<div class="empty">此卷尚无条目</div>';
      return;
    }
    posts.forEach(function (p) { listEl.appendChild(row(p)); });

    /* 重新触发一次入场 */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
        });
      }, { rootMargin: '0px 0px -6% 0px' });
      listEl.querySelectorAll('.reveal').forEach(function (el, i) {
        el.style.transitionDelay = Math.min(i * 55, 260) + 'ms';
        io.observe(el);
      });
    } else {
      listEl.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
    }
  }

  function applyFilter(q) {
    q = (q || '').trim().toLowerCase();
    var filtered = q
      ? all.filter(function (p) {
          return (p.title + ' ' + (p.tags || []).join(' ') + ' ' + (p.excerpt || '')).toLowerCase().indexOf(q) > -1;
        })
      : all;
    render(filtered);
    if (hintEl) {
      hintEl.textContent = q
        ? '检得 ' + filtered.length + ' 条'
        : '共 ' + all.length + ' 条';
    }
  }

  function init() {
    if (!listEl) return;

    window.QM.manifest().then(function (data) {
      all = data.posts.filter(function (p) { return p.section === section; });
      if (countEl) countEl.textContent = all.length;
      applyFilter('');
    }).catch(function () {
      listEl.innerHTML = '<div class="empty">未能读到卷目（请通过本地服务器或线上站点访问）</div>';
    });

    if (searchEl) {
      searchEl.addEventListener('input', function () { applyFilter(searchEl.value); });
      document.addEventListener('keydown', function (e) {
        if (e.key === '/' && document.activeElement !== searchEl) {
          e.preventDefault();
          searchEl.focus();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
