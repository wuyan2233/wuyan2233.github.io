/* 青冥集 · markdown.js
   一个够用的小型 Markdown 渲染器（无依赖）
   —— 支持标题、段落、粗斜体、行内码、链接、图片、列表、引用、表格、
      分隔线、围栏代码块（带语言与简易高亮）、::: 注解块
*/
(function (global) {
  'use strict';

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ---------------- 语法着色 ---------------- */
  var GRAMMARS = {
    js: [
      ['com', /\/\/[^\n]*|\/\*[\s\S]*?\*\//],
      ['str', /`(?:\\.|[^`\\])*`|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/],
      ['key', /\b(?:const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|super|import|export|from|default|try|catch|finally|throw|typeof|instanceof|await|async|of|in|delete|void|yield|this|null|undefined|true|false)\b/],
      ['num', /\b\d+(?:\.\d+)?\b/],
      ['fn', /\b[A-Za-z_$][\w$]*(?=\()/]
    ],
    json: [
      ['str', /"(?:\\.|[^"\\])*"(?=\s*:)/],
      ['str', /"(?:\\.|[^"\\])*"/],
      ['key', /\b(?:true|false|null)\b/],
      ['num', /-?\b\d+(?:\.\d+)?\b/]
    ],
    css: [
      ['com', /\/\*[\s\S]*?\*\//],
      ['str', /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/],
      ['key', /@[\w-]+|--[\w-]+/],
      ['num', /#[0-9a-fA-F]{3,8}\b|\b\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|s|ms|deg)?\b/]
    ],
    html: [
      ['com', /<!--[\s\S]*?-->/],
      ['str', /"[^"]*"|'[^']*'/],
      ['tag', /<\/?[a-zA-Z][\w-]*|\/?>/],
      ['att', /\b[a-zA-Z-]+(?==)/]
    ],
    bash: [
      ['com', /#[^\n]*/],
      ['str', /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/],
      ['key', /\b(?:npm|pnpm|node|git|cd|ls|ffmpeg|python|curl|mkdir|rm|cp|mv|echo|cat|sudo|yarn)\b/],
      ['num', /\s-{1,2}[\w-]+/]
    ],
    py: [
      ['com', /#[^\n]*/],
      ['str', /"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/],
      ['key', /\b(?:def|class|return|if|elif|else|for|while|import|from|as|with|try|except|finally|raise|lambda|None|True|False|and|or|not|in|is|pass|yield)\b/],
      ['num', /\b\d+(?:\.\d+)?\b/],
      ['fn', /\b[A-Za-z_][\w]*(?=\()/]
    ]
  };

  function highlight(code, lang) {
    var grammar = GRAMMARS[lang];
    if (!grammar) return esc(code);

    var parts = [];
    grammar.forEach(function (rule) {
      parts.push('(' + rule[1].source + ')');
    });
    var re = new RegExp(parts.join('|'), 'g');
    var out = '';
    var last = 0;
    var m;

    while ((m = re.exec(code)) !== null) {
      if (m.index > last) out += esc(code.slice(last, m.index));
      var idx = 1;
      while (idx < m.length && m[idx] === undefined) idx++;
      var kind = grammar[idx - 1] ? grammar[idx - 1][0] : null;
      out += kind
        ? '<span class="tok-' + kind + '">' + esc(m[0]) + '</span>'
        : esc(m[0]);
      last = m.index + m[0].length;
      if (m[0].length === 0) re.lastIndex++;
    }
    out += esc(code.slice(last));
    return out;
  }

  /* ---------------- 行内 ---------------- */
  function inline(text) {
    var store = [];
    function stash(html) {
      store.push(html);
      return '\u0000' + (store.length - 1) + '\u0000';
    }

    text = text.replace(/`([^`]+)`/g, function (_, code) {
      return stash('<code>' + esc(code) + '</code>');
    });
    text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, function (_, alt, src, title) {
      return stash('<img src="' + esc(src) + '" alt="' + esc(alt) + '"' + (title ? ' title="' + esc(title) + '"' : '') + ' loading="lazy">');
    });
    text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, function (_, label, href, title) {
      var external = /^https?:/i.test(href);
      return stash('<a href="' + esc(href) + '"' + (title ? ' title="' + esc(title) + '"' : '') +
        (external ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + esc(label) + '</a>');
    });

    text = esc(text);
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    text = text.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    return text.replace(/\u0000(\d+)\u0000/g, function (_, i) { return store[Number(i)]; });
  }

  function slugify(text, used) {
    var base = text
      .toLowerCase()
      .replace(/<[^>]+>/g, '')
      .replace(/[\s\u3000]+/g, '-')
      .replace(/[^\w\u4e00-\u9fa5-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (!base) base = 'sec';
    var id = base, n = 2;
    while (used[id]) id = base + '-' + n++;
    used[id] = true;
    return id;
  }

  /* ---------------- 块级 ---------------- */
  function render(md) {
    var lines = String(md).replace(/\r\n?/g, '\n').split('\n');
    var html = [];
    var i = 0;
    var used = {};

    function isTableSep(line) {
      return /^\s*\|?[\s:-]*\|[\s:|-]*$/.test(line) && line.indexOf('-') > -1;
    }

    while (i < lines.length) {
      var line = lines[i];

      /* 空行 */
      if (!line.trim()) { i++; continue; }

      /* 围栏代码 */
      var fence = line.match(/^```([\w+-]*)\s*$/);
      if (fence) {
        var lang = (fence[1] || '').toLowerCase();
        var buf = [];
        i++;
        while (i < lines.length && !/^```\s*$/.test(lines[i])) { buf.push(lines[i]); i++; }
        i++;
        var code = buf.join('\n');

        if (lang === 'palette') {
          html.push(renderPalette(code));
          continue;
        }
        if (lang === 'note' || lang === 'tip') {
          var noteLines = code.split('\n');
          var noteTitle = noteLines.shift() || '笺注';
          html.push('<div class="note"><span class="note__title">' + esc(noteTitle) + '</span>' +
            '<p>' + inline(noteLines.join('\n')).replace(/\n/g, '<br>') + '</p></div>');
          continue;
        }
        html.push(
          '<div class="code-block"><div class="code-block__bar"><span>' + esc(lang || 'text') +
          '</span><button class="code-block__copy" type="button" data-copy>复制</button></div>' +
          '<pre><code class="lang-' + esc(lang || 'text') + '">' + highlight(code, lang) + '</code></pre></div>'
        );
        continue;
      }

      /* 标题 */
      var h = line.match(/^(#{1,4})\s+(.*)$/);
      if (h) {
        var depth = h[1].length;
        if (depth === 1) { i++; continue; } /* 文章标题由页面渲染 */
        var id = slugify(h[2], used);
        html.push('<h' + depth + ' id="' + id + '">' + inline(h[2]) + '</h' + depth + '>');
        i++;
        continue;
      }

      /* 分隔线 */
      if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) { html.push('<hr>'); i++; continue; }

      /* 引用 */
      if (/^>\s?/.test(line)) {
        var quote = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          quote.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }
        html.push('<blockquote><p>' + inline(quote.join('\n')).replace(/\n/g, '<br>') + '</p></blockquote>');
        continue;
      }

      /* 表格 */
      if (line.indexOf('|') > -1 && i + 1 < lines.length && isTableSep(lines[i + 1])) {
        var headCells = splitRow(line);
        i += 2;
        var rows = [];
        while (i < lines.length && lines[i].indexOf('|') > -1 && lines[i].trim()) {
          rows.push(splitRow(lines[i]));
          i++;
        }
        var table = '<table><thead><tr>' +
          headCells.map(function (c) { return '<th>' + inline(c) + '</th>'; }).join('') +
          '</tr></thead><tbody>' +
          rows.map(function (r) {
            return '<tr>' + r.map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>';
          }).join('') +
          '</tbody></table>';
        html.push(table);
        continue;
      }

      /* 列表 */
      if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
        var ordered = /^\s*\d+\./.test(line);
        var items = [];
        while (i < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*([-*+]|\d+\.)\s+/, ''));
          i++;
        }
        var tag = ordered ? 'ol' : 'ul';
        html.push('<' + tag + '>' + items.map(function (t) {
          return '<li>' + inline(t) + '</li>';
        }).join('') + '</' + tag + '>');
        continue;
      }

      /* 段落 */
      var para = [];
      while (i < lines.length && lines[i].trim() &&
             !/^(#{1,4}\s|```|>|\s*([-*+]|\d+\.)\s)/.test(lines[i]) &&
             !/^\s*(---|\*\*\*|___)\s*$/.test(lines[i])) {
        para.push(lines[i]);
        i++;
      }
      html.push('<p>' + inline(para.join('\n')).replace(/\n/g, '<br>') + '</p>');
    }

    return html.join('\n');
  }

  function splitRow(line) {
    return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(function (c) {
      return c.trim();
    });
  }

  /* 色卡块：每行「名称 #HEX」
     palette
     月白 #D6ECF0
     ...
  */
  function renderPalette(code) {
    var rows = code.split('\n').filter(function (l) { return l.trim(); }).map(function (l) {
      var m = l.trim().match(/^(\S+)\s+(#[0-9a-fA-F]{3,8})/);
      return m ? { name: m[1], hex: m[2] } : null;
    }).filter(Boolean);

    return '<div class="palette">' + rows.map(function (r) {
      var rgb = hexToRgb(r.hex) || { r: 0, g: 0, b: 0 };
      var lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
      var fg = lum > 0.58 ? '#16323F' : '#F2FBFF';
      return '<button class="swatch" type="button" data-hex="' + r.hex + '" title="点击复制 ' + r.hex + '">' +
        '<span class="swatch__chip" style="background:' + r.hex + ';color:' + fg + '">' + esc(r.name) + '</span>' +
        '<span class="swatch__meta">' + r.hex.toUpperCase() + '</span></button>';
    }).join('') + '</div>';
  }

  function hexToRgb(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    if (h.length !== 6) return null;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16)
    };
  }

  /* 抽取目录 */
  function outline(md) {
    var heads = [];
    String(md).split('\n').forEach(function (line) {
      var m = line.match(/^(#{2,3})\s+(.*)$/);
      if (!m) return;
      heads.push({ depth: m[1].length, text: m[2].replace(/[*`_]/g, '') });
    });
    var used = {};
    return heads.map(function (h) {
      return { depth: h.depth, text: h.text, id: slugify(h.text, used) };
    });
  }

  function stripFrontMatter(md) {
    var m = String(md).match(/^---\n([\s\S]*?)\n---\n?/);
    if (!m) return { data: {}, body: String(md) };
    var data = {};
    m[1].split('\n').forEach(function (line) {
      var kv = line.match(/^([\w-]+):\s*(.*)$/);
      if (!kv) return;
      var value = kv[2].trim().replace(/^["']|["']$/g, '');
      if (/^\[.*\]$/.test(value)) {
        value = value.slice(1, -1).split(',').map(function (v) { return v.trim(); }).filter(Boolean);
      }
      data[kv[1]] = value;
    });
    return { data: data, body: String(md).slice(m[0].length) };
  }

  global.MD = {
    render: render,
    inline: inline,
    outline: outline,
    stripFrontMatter: stripFrontMatter,
    esc: esc
  };
})(window);
