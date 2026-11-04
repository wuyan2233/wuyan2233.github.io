/* app.js —— 数据、列表、归档、标签、搜索、正文 */
(function () {
  'use strict';

  var MANIFEST = 'content/posts.json';
  var manifestCache = null;
  var page = document.body.getAttribute('data-page') || 'home';

  /* ---------------- 基础工具 ---------------- */
  function esc(s) { return window.MD ? window.MD.esc(s) : String(s); }

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function fmt(iso) {
    if (!iso) return '';
    return String(iso).replace(/-/g, '.');
  }

  function fmtCN(iso) {
    if (!iso) return '';
    var p = String(iso).split('-');
    return p[0] + ' 年 ' + Number(p[1]) + ' 月 ' + Number(p[2]) + ' 日';
  }

  function readingTime(text) {
    return Math.max(1, Math.round(String(text).replace(/\s/g, '').length / 380)) + ' 分钟';
  }

  function loadManifest() {
    if (manifestCache) return Promise.resolve(manifestCache);
    return fetch(MANIFEST, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('manifest ' + r.status);
        return r.json();
      })
      .then(function (data) {
        data.posts = (data.posts || []).slice().sort(function (a, b) {
          return String(b.date).localeCompare(String(a.date));
        });
        data.byId = {};
        data.posts.forEach(function (p) { data.byId[p.id] = p; });
        manifestCache = data;
        return data;
      });
  }

  function columnName(data, id) {
    var c = (data.columns || []).filter(function (x) { return x.id === id; })[0];
    return c ? c.name : '';
  }

  function postUrl(p) { return 'post.html?id=' + encodeURIComponent(p.id); }

  function postRow(p, opts) {
    opts = opts || {};
    var tags = (p.tags || []).map(function (t) {
      return '<span class="tag">' + esc(t) + '</span>';
    }).join('');
    return '<article class="post-row">' +
      '<div class="post-row__date">' + fmt(p.date) + '</div>' +
      '<div class="post-row__body">' +
        '<h3><a href="' + postUrl(p) + '">' + esc(p.title) + '</a></h3>' +
        '<p>' + esc(p.excerpt || '') + '</p>' +
        (tags ? '<div class="tags">' + tags + '</div>' : '') +
      '</div>' +
      '<span class="post-row__arrow" aria-hidden="true">→</span>' +
      '</article>';
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); resolve(); } catch (e) { reject(e); } finally { ta.remove(); }
    });
  }

  /* ---------------- 公共行为 ---------------- */
  function bindCopy() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-copy]');
      if (!btn) return;
      var block = btn.closest('.code-block');
      var code = block && block.querySelector('code');
      if (!code) return;
      copyText(code.textContent).then(function () {
        var old = btn.textContent;
        btn.textContent = '已复制';
        setTimeout(function () { btn.textContent = old; }, 1500);
      }).catch(function () {
        btn.textContent = '复制失败';
        setTimeout(function () { btn.textContent = '复制'; }, 1500);
      });
    });
  }

  function revealAll(nodes) {
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nodes.forEach(function (n) { n.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    nodes.forEach(function (n, i) {
      n.style.transitionDelay = Math.min(i * 45, 240) + 'ms';
      io.observe(n);
    });
  }

  function bindChrome() {
    var btn = document.querySelector('.to-top');
    if (!btn) {
      btn = document.createElement('button');
      btn.className = 'to-top';
      btn.type = 'button';
      btn.setAttribute('aria-label', '回到顶部');
      btn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 19V6M6 12l6-6 6 6"/></svg>';
      document.body.appendChild(btn);
    }
    btn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

    var bar = document.querySelector('.progress');
    var onScroll = function () {
      btn.classList.toggle('is-on', window.scrollY > 480);
      if (bar) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0) + '%';
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    var here = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav a').forEach(function (a) {
      var file = (a.getAttribute('href') || '').split('?')[0].split('/').pop();
      if (file === here) a.setAttribute('aria-current', 'page');
    });
  }

  /* ---------------- 首页 ---------------- */
  function initHome() {
    loadManifest().then(function (data) {
      var list = document.getElementById('latest');
      if (list) {
        list.innerHTML = data.posts.slice(0, 4).map(function (p) { return postRow(p); }).join('');
      }
      document.querySelectorAll('[data-count]').forEach(function (el) {
        var key = el.getAttribute('data-count');
        if (key === 'notes') el.textContent = data.posts.filter(function (p) { return p.type === 'note'; }).length;
        else if (key === 'columns') el.textContent = (data.columns || []).length;
        else if (key === 'posts') el.textContent = data.posts.length;
        else if (key === 'tags') {
          var tags = {};
          data.posts.forEach(function (p) { (p.tags || []).forEach(function (t) { tags[t] = 1; }); });
          el.textContent = Object.keys(tags).length;
        }
      });
      revealAll(Array.prototype.slice.call(document.querySelectorAll('#latest .post-row')));
    }).catch(function () {});
  }

  /* ---------------- 笔记 ---------------- */
  function initNotes() {
    var list = document.getElementById('notes-list');
    var q = document.getElementById('notes-search');
    var hint = document.querySelector('[data-notes-hint]');
    var all = [];

    function render(rows) {
      list.innerHTML = rows.length ? rows.map(function (p) { return postRow(p); }).join('')
        : '<div class="empty">没有匹配的笔记</div>';
      if (hint) hint.textContent = rows.length + ' 篇';
      revealAll(Array.prototype.slice.call(list.querySelectorAll('.post-row')));
    }

    loadManifest().then(function (data) {
      all = data.posts.filter(function (p) { return p.type === 'note'; });
      var count = document.querySelector('[data-note-count]');
      if (count) count.textContent = all.length;
      render(all);
      if (q) {
        q.addEventListener('input', function () {
          var v = q.value.trim().toLowerCase();
          render(v ? all.filter(function (p) {
            return (p.title + ' ' + (p.excerpt || '') + ' ' + (p.tags || []).join(' ')).toLowerCase().indexOf(v) > -1;
          }) : all);
        });
      }
    }).catch(function () {
      if (list) list.innerHTML = '<div class="empty">读取失败，请通过本地服务器或线上地址访问</div>';
    });
  }

  /* ---------------- 专栏 ---------------- */
  function initColumns() {
    var host = document.getElementById('columns');
    loadManifest().then(function (data) {
      var cols = (data.columns || []);
      host.innerHTML = cols.map(function (c) {
        var parts = data.posts.filter(function (p) { return p.column === c.id; }).sort(function (a, b) {
          return (a.index || 0) - (b.index || 0);
        });
        return '<section class="column-card">' +
          '<div class="column-card__head"><h2>' + esc(c.name) + '</h2>' +
          '<span class="tag"><b>' + parts.length + '</b> 篇</span></div>' +
          (c.desc ? '<p class="column-card__desc">' + esc(c.desc) + '</p>' : '') +
          '<ol class="column-card__parts">' + parts.map(function (p) {
            return '<li><span class="part-no">' + pad(p.index || 0) + '</span>' +
              '<a href="' + postUrl(p) + '">' + esc(p.title) + '</a>' +
              '<time datetime="' + p.date + '">' + fmt(p.date) + '</time></li>';
          }).join('') + '</ol></section>';
      }).join('');
      var count = document.querySelector('[data-column-count]');
      if (count) count.textContent = cols.length;
      revealAll(Array.prototype.slice.call(host.querySelectorAll('.column-card')));
    }).catch(function () {
      host.innerHTML = '<div class="empty">读取失败</div>';
    });
  }

  /* ---------------- 归档 ---------------- */
  function initArchives() {
    var host = document.getElementById('archives');
    loadManifest().then(function (data) {
      var years = {};
      data.posts.forEach(function (p) {
        var y = String(p.date).slice(0, 4);
        var m = String(p.date).slice(5, 7);
        years[y] = years[y] || {};
        years[y][m] = years[y][m] || [];
        years[y][m].push(p);
      });
      var total = data.posts.length;
      var yearsCount = Object.keys(years).length;
      var stat = document.querySelector('[data-archive-stat]');
      if (stat) stat.textContent = total + ' 篇 · ' + yearsCount + ' 年';

      host.innerHTML = Object.keys(years).sort().reverse().map(function (y) {
        var months = years[y];
        var yCount = Object.keys(months).reduce(function (n, m) { return n + months[m].length; }, 0);
        var monthKeys = Object.keys(months).sort().reverse();
        return '<section class="archive-year"><h2>' + y + ' 年<span>' + yCount + ' 篇</span></h2>' +
          monthKeys.map(function (m) {
            return '<div class="archive-month">' + y + '.' + m + ' · ' + months[m].length + ' 篇</div>' +
              '<div class="post-list">' + months[m].map(function (p) { return postRow(p); }).join('') + '</div>';
          }).join('') + '</section>';
      }).join('');
      revealAll(Array.prototype.slice.call(host.querySelectorAll('.post-row')));
    }).catch(function () {
      host.innerHTML = '<div class="empty">读取失败</div>';
    });
  }

  /* ---------------- 标签 ---------------- */
  function initTags() {
    var cloud = document.getElementById('tag-cloud');
    var list = document.getElementById('tag-posts');
    var head = document.getElementById('tag-head');
    var all = [];

    function renderChips(active) {
      var map = {};
      all.forEach(function (p) { (p.tags || []).forEach(function (t) { (map[t] = map[t] || []).push(p); }); });
      var keys = Object.keys(map).sort(function (a, b) { return map[b].length - map[a].length; });
      cloud.innerHTML = keys.map(function (t) {
        return '<a class="tag-chip' + (t === active ? ' is-active' : '') + '" href="#' + encodeURIComponent(t) + '" data-tag="' + esc(t) + '">' +
          esc(t) + '<b>' + map[t].length + '</b></a>';
      }).join('');
    }

    function show(tag) {
      var rows = tag ? all.filter(function (p) { return (p.tags || []).indexOf(tag) > -1; }) : all;
      head.textContent = tag ? '「' + tag + '」· ' + rows.length + ' 篇' : '全部 · ' + rows.length + ' 篇';
      list.innerHTML = rows.map(function (p) { return postRow(p); }).join('');
      revealAll(Array.prototype.slice.call(list.querySelectorAll('.post-row')));
      renderChips(tag);
    }

    loadManifest().then(function (data) {
      all = data.posts;
      var initial = decodeURIComponent(location.hash.slice(1) || '');
      show(initial);
      cloud.addEventListener('click', function (e) {
        var a = e.target.closest('[data-tag]');
        if (!a) return;
        e.preventDefault();
        var t = a.getAttribute('data-tag');
        history.replaceState(null, '', '#' + encodeURIComponent(t));
        show(t);
      });
      window.addEventListener('hashchange', function () {
        show(decodeURIComponent(location.hash.slice(1) || ''));
      });
      var count = document.querySelector('[data-tag-count]');
      if (count) {
        var s = {};
        all.forEach(function (p) { (p.tags || []).forEach(function (t) { s[t] = 1; }); });
        count.textContent = Object.keys(s).length;
      }
    }).catch(function () {
      if (list) list.innerHTML = '<div class="empty">读取失败</div>';
    });
  }

  /* ---------------- 搜索 ---------------- */
  function initSearch() {
    var input = document.getElementById('search-input');
    var out = document.getElementById('search-results');
    var meta = document.getElementById('search-meta');
    var data = null;

    function mark(text, q) {
      var safe = esc(text);
      if (!q) return safe;
      var re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      return safe.replace(re, '<mark>$1</mark>');
    }

    function buildIndex(d) {
      var posts = d.posts.map(function (p) {
        return { kind: 'post', title: p.title, text: p.excerpt || '', url: postUrl(p), date: p.date, p: p };
      });
      var cols = (d.columns || []).map(function (c) {
        return { kind: 'column', title: c.name, text: c.desc || '', url: 'columns.html#' + encodeURIComponent(c.id), date: '', c: c };
      });
      var tagsMap = {};
      d.posts.forEach(function (p) { (p.tags || []).forEach(function (t) { (tagsMap[t] = tagsMap[t] || []).push(p); }); });
      var tags = Object.keys(tagsMap).map(function (t) {
        return {
          kind: 'tag', title: t, text: tagsMap[t].map(function (p) { return p.title; }).join('、'),
          url: 'tags.html#' + encodeURIComponent(t), date: '', count: tagsMap[t].length
        };
      });
      var monthsMap = {};
      d.posts.forEach(function (p) {
        var key = String(p.date).slice(0, 7);
        (monthsMap[key] = monthsMap[key] || []).push(p);
      });
      var months = Object.keys(monthsMap).sort().reverse().map(function (key) {
        var y = key.slice(0, 4), m = key.slice(5, 7);
        return {
          kind: 'archive', title: y + ' 年 ' + Number(m) + ' 月',
          text: monthsMap[key].slice(0, 3).map(function (p) { return p.title; }).join('、'),
          url: 'archives.html#' + key, date: key + '-01', count: monthsMap[key].length, key: key
        };
      });
      return { post: posts, column: cols, tag: tags, archive: months };
    }

    function run(q) {
      q = q.trim();
      if (!q) {
        out.innerHTML = '<div class="empty">输入关键词，检索笔记、专栏、归档与标签</div>';
        if (meta) meta.textContent = data.posts.length + ' 篇内容已建立索引';
        return;
      }
      var low = q.toLowerCase();
      var idx = buildIndex(data);
      var hit = function (item) {
        return (item.title + ' ' + item.text + ' ' + (item.date || '')).toLowerCase().indexOf(low) > -1;
      };
      var groups = [
        { key: 'post', label: '笔记', items: idx.post.filter(hit) },
        { key: 'column', label: '专栏', items: idx.column.filter(hit) },
        { key: 'archive', label: '归档', items: idx.archive.filter(hit) },
        { key: 'tag', label: '标签', items: idx.tag.filter(hit) }
      ];
      var total = groups.reduce(function (n, g) { return n + g.items.length; }, 0);
      if (meta) meta.textContent = total ? '找到 ' + total + ' 条结果' : '没有找到结果';

      if (!total) {
        out.innerHTML = '<div class="empty">没有找到「' + esc(q) + '」，试试更短的关键词</div>';
        return;
      }

      out.innerHTML = groups.filter(function (g) { return g.items.length; }).map(function (g) {
        return '<section class="result-group"><h2 class="result-group__title">' + g.label +
          ' <span>' + g.items.length + '</span></h2>' +
          g.items.map(function (it) {
            var sub = it.kind === 'post' ? fmt(it.date) : (it.kind === 'tag' || it.kind === 'archive' ? it.count + ' 篇' : '专栏');
            return '<a class="post-row" href="' + it.url + '">' +
              '<div class="post-row__date">' + sub + '</div>' +
              '<div class="post-row__body"><h3>' + mark(it.title, q) + '</h3>' +
              '<p>' + mark(it.text, q) + '</p></div>' +
              '<span class="post-row__arrow" aria-hidden="true">→</span></a>';
          }).join('') + '</section>';
      }).join('');
    }

    loadManifest().then(function (d) {
      data = d;
      var initial = new URLSearchParams(location.search).get('q') || '';
      if (input) {
        input.value = initial;
        var timer;
        input.addEventListener('input', function () {
          clearTimeout(timer);
          timer = setTimeout(function () { run(input.value); }, 80);
        });
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') run(input.value);
        });
      }
      document.addEventListener('keydown', function (e) {
        if (e.key === '/' && document.activeElement !== input) {
          e.preventDefault();
          input.focus();
        }
      });
      run(initial);
    }).catch(function () {
      out.innerHTML = '<div class="empty">读取失败，请通过本地服务器或线上地址访问</div>';
    });
  }

  /* ---------------- 正文 ---------------- */
  function initPost() {
    var id = new URLSearchParams(location.search).get('id') || '';
    var body = document.querySelector('[data-article-body]');
    var data = null;
    var post = null;

    loadManifest().then(function (d) {
      data = d;
      post = d.byId[id];
      if (!post) throw new Error('未找到这篇文章');
      document.title = post.title + ' · ' + (d.site.name || '博客');

      var el;
      if ((el = document.querySelector('[data-post-title]'))) el.textContent = post.title;
      if ((el = document.querySelector('[data-post-dek]'))) el.textContent = post.excerpt || '';
      if ((el = document.querySelector('[data-post-date]'))) {
        el.textContent = fmtCN(post.date);
        el.setAttribute('datetime', post.date);
      }
      if ((el = document.querySelector('[data-post-kind]'))) {
        el.textContent = post.type === 'column' ? '专栏 · ' + columnName(d, post.column) : '笔记';
      }
      if ((el = document.querySelector('[data-post-tags]'))) {
        el.innerHTML = (post.tags || []).map(function (t) {
          return '<a class="tag" href="tags.html#' + encodeURIComponent(t) + '">' + esc(t) + '</a>';
        }).join('');
      }

      return fetch(post.file, { cache: 'no-cache' }).then(function (r) {
        if (!r.ok) throw new Error('文件读取失败');
        return r.text();
      }).then(function (text) {
        var parsed = window.MD.stripFrontMatter(text);
        body.innerHTML = window.MD.render(parsed.body);
        var readEl = document.querySelector('[data-post-read]');
        if (readEl) readEl.textContent = readingTime(parsed.body);
        buildToc(window.MD.outline(parsed.body));
        buildPager(d, post);
      });
    }).catch(function (e) {
      document.title = '未找到文章';
      if (body) {
        body.innerHTML = '<div class="note"><span class="note__title">没有找到</span><p>' + esc(e.message || '文章不存在') +
          '</p></div><p><a href="notes.html">← 返回笔记列表</a></p>';
      }
      var t = document.querySelector('[data-post-title]');
      if (t) t.textContent = '没有找到这篇文章';
    });
  }

  function buildToc(outline) {
    var list = document.getElementById('toc-list');
    if (!list) return;
    if (!outline.length) {
      var toc = document.querySelector('.toc');
      if (toc) toc.style.display = 'none';
      return;
    }
    list.innerHTML = outline.map(function (h) {
      return '<li><a href="#' + h.id + '" data-depth="' + h.depth + '">' + esc(h.text) + '</a></li>';
    }).join('');
    var links = Array.prototype.slice.call(list.querySelectorAll('a'));
    var targets = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
    if (!targets.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-active'); });
        var active = links[targets.indexOf(en.target)];
        if (active) active.classList.add('is-active');
      });
    }, { rootMargin: '-10% 0px -72% 0px', threshold: 0 });
    targets.forEach(function (t) { io.observe(t); });
  }

  function buildPager(data, post) {
    var pager = document.querySelector('[data-pager]');
    if (!pager) return;
    var i = data.posts.indexOf(post);
    var prev = data.posts[i + 1];
    var next = data.posts[i - 1];
    function item(p, label, empty) {
      if (!p) return '<a href="notes.html"><small>' + label + '</small><span>' + empty + '</span></a>';
      return '<a href="' + postUrl(p) + '"><small>' + label + '</small><span>' + esc(p.title) + '</span></a>';
    }
    pager.innerHTML = item(prev, '上一篇', '回到笔记') + item(next, '下一篇', '回到笔记');
  }

  /* ---------------- 启动 ---------------- */
  function init() {
    bindChrome();
    bindCopy();
    if (page === 'home') initHome();
    else if (page === 'notes') initNotes();
    else if (page === 'columns') initColumns();
    else if (page === 'archives') initArchives();
    else if (page === 'tags') initTags();
    else if (page === 'search') initSearch();
    else if (page === 'post') initPost();

    document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
    var reveal = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    if (reveal.length) revealAll(reveal);
  }

  window.QM = window.QM || {};
  window.QM.manifest = loadManifest;
  window.QM.fmt = fmt;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
