/* 青冥集 · post.js — 文章页 */
(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  var section = params.get('s') || 'articles';
  var slug = params.get('slug') || '';
  var bodyEl = document.querySelector('[data-article-body]');
  var all = [];

  function fail(message) {
    if (bodyEl) {
      bodyEl.innerHTML = '<div class="note"><span class="note__title">未得此文</span><p>' +
        window.MD.esc(message) + '</p></div>' +
        '<p><a href="' + section + '.html">← 返回分区</a></p>';
    }
    var titleEl = document.querySelector('[data-post-title]');
    if (titleEl) titleEl.textContent = '未得此文';
  }

  function setMeta(manifest, post) {
    var sec = (manifest.sections || []).filter(function (s) { return s.id === post.section; })[0] || { name: '文章' };
    document.title = post.title + ' · 青冥集';

    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', post.excerpt || post.title);

    var titleEl = document.querySelector('[data-post-title]');
    if (titleEl) titleEl.textContent = post.title;

    var dekEl = document.querySelector('[data-post-dek]');
    if (dekEl) dekEl.textContent = post.excerpt || '';

    var dateEl = document.querySelector('[data-post-date]');
    if (dateEl) {
      dateEl.textContent = window.QM.formatDate(post.date);
      dateEl.setAttribute('datetime', post.date || '');
    }

    var secEl = document.querySelector('[data-post-section]');
    if (secEl) {
      secEl.textContent = sec.name;
      secEl.setAttribute('href', post.section + '.html');
    }

    var tagsEl = document.querySelector('[data-post-tags]');
    if (tagsEl) {
      tagsEl.innerHTML = (post.tags || []).map(function (t) {
        return '<span class="tag">' + window.MD.esc(t) + '</span>';
      }).join('');
    }

    var crumbEl = document.querySelector('[data-crumb]');
    if (crumbEl) crumbEl.textContent = sec.name;
  }

  function buildToc(outline) {
    var list = document.getElementById('toc-list');
    var toc = document.querySelector('.toc');
    if (!list) return;
    if (!outline.length) {
      if (toc) toc.style.display = 'none';
      return;
    }
    list.innerHTML = outline.map(function (h) {
      return '<li><a href="#' + h.id + '" data-depth="' + h.depth + '">' + window.MD.esc(h.text) + '</a></li>';
    }).join('');

    var links = Array.prototype.slice.call(list.querySelectorAll('a'));
    var targets = links.map(function (a) {
      return document.getElementById(a.getAttribute('href').slice(1));
    }).filter(Boolean);
    if (!targets.length || !('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-active'); });
        var active = links[targets.indexOf(entry.target)];
        if (active) active.classList.add('is-active');
      });
    }, { rootMargin: '-12% 0px -70% 0px', threshold: 0 });

    targets.forEach(function (t) { io.observe(t); });

    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var t = document.getElementById(a.getAttribute('href').slice(1));
        if (!t) return;
        var y = t.getBoundingClientRect().top + window.scrollY - 92;
        window.scrollTo({ top: y, behavior: 'smooth' });
        history.replaceState(null, '', '#' + a.getAttribute('href').slice(1));
      });
    });
  }

  function buildPager(post) {
    var pager = document.querySelector('[data-pager]');
    if (!pager) return;
    var index = all.indexOf(post);
    var prev = all[index + 1];
    var next = all[index - 1];

    function link(p, text) {
      if (!p) return '<a href="' + (post.section) + '.html" aria-disabled="true"><small>' + text + '</small><span>' +
        (text.indexOf('前') > -1 ? '回到卷首' : '回到卷首') + '</span></a>';
      return '<a href="post.html?s=' + encodeURIComponent(p.section) + '&amp;slug=' + encodeURIComponent(p.slug) + '">' +
        '<small>' + text + '</small><span>' + window.MD.esc(p.title) + '</span></a>';
    }

    pager.innerHTML = link(prev, '上一篇') + link(next, '下一篇');
  }

  function bindShare() {
    var btn = document.querySelector('[data-share]');
    if (!btn) return;
    btn.addEventListener('click', function () {
      window.QM.copy(location.href).then(function () {
        var old = btn.textContent;
        btn.textContent = '已抄录链接';
        setTimeout(function () { btn.textContent = old; }, 1800);
      });
    });
  }

  function init() {
    if (!bodyEl) return;

    window.QM.manifest().then(function (manifest) {
      all = manifest.posts;
      var post = all.filter(function (p) { return p.section === section && p.slug === slug; })[0];
      if (!post) { fail('卷目中查无此文，或许已被移出。'); return; }

      setMeta(manifest, post);
      var url = 'content/' + post.section + '/' + post.slug + '.md';

      return fetch(url, { cache: 'no-cache' })
        .then(function (r) {
          if (!r.ok) throw new Error('md ' + r.status);
          return r.text();
        })
        .then(function (text) {
          var parsed = window.MD.stripFrontMatter(text);
          bodyEl.innerHTML = window.MD.render(parsed.body);
          buildToc(window.MD.outline(parsed.body));
          buildPager(post);
          bindShare();

          var readEl = document.querySelector('[data-post-read]');
          if (readEl) readEl.textContent = window.QM.readingTime(parsed.body.replace(/\s/g, '').length);

          var hash = location.hash.slice(1);
          if (hash) {
            var target = document.getElementById(decodeURIComponent(hash));
            if (target) {
              setTimeout(function () {
                window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 92 });
              }, 80);
            }
          }
        });
    }).catch(function (e) {
      fail('读取失败：' + e.message + '。本地预览请通过 HTTP 服务打开（见 README）。');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
