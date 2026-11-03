---
title: 百二十行的墨戏：手写一个 Markdown 渲染器
date: 2026-10-28
tags: [JavaScript, 实现]
excerpt: 不引 marked，也不打包。用一百多行正则与一个循环，把 Markdown 变成可读的篇章——顺便把代码块染上颜色。
---

## 为什么不用现成的

现成的解析器当然好：`marked` 二十来 KB，功能齐全。但这个站的目标之一是「不假外物」——少一个依赖，就少一次失效的可能。

而且博客用的 Markdown 其实很小：标题、段落、列表、引用、代码、表格，足够了。

## 主循环

整个渲染器是一个 `while` 循环，每次吃掉一种块：

```js
while (i < lines.length) {
  const line = lines[i];

  if (isFence(line))      { html.push(renderCode()); continue; }
  if (isHeading(line))    { html.push(renderHeading()); continue; }
  if (isList(line))       { html.push(renderList()); continue; }
  if (isQuote(line))      { html.push(renderQuote()); continue; }
  if (isTable(line))      { html.push(renderTable()); continue; }

  html.push(renderParagraph());
}
```

顺序很重要：围栏代码必须先判断，否则代码里的 `#` 会被当成标题。

## 行内的麻烦

行内语法真正麻烦的是**转义与嵌套**。先转义再匹配，链接里的 `&` 会被写成 `&amp;`；先匹配再转义，插入的标签又会被转义掉。

这里的做法是「占位」：先把行内代码、链接、图片替换成占位符，转义剩下的文字，再把占位符换回来。

```js
function inline(text) {
  const store = [];
  const stash = (html) => `\u0000${store.push(html) - 1}\u0000`;

  text = text.replace(/`([^`]+)`/g, (_, code) => stash(`<code>${esc(code)}</code>`));
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) =>
    stash(`<a href="${esc(href)}">${esc(label)}</a>`));

  text = esc(text);
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  return text.replace(/\u0000(\d+)\u0000/g, (_, i) => store[Number(i)]);
}
```

占位符用的是 `\u0000`，一个正文里永远不会出现的字符。

## 顺手着色

代码块里的颜色不必用完整的词法器。给每种语言写四五条正则——注释、字符串、关键字、数字、函数名——按顺序拼成一个大正则，命中就套一层 `<span>`：

```js
const GRAMMARS = {
  js: [
    ['com', /\/\/[^\n]*|\/\*[\s\S]*?\*\//],
    ['str', /`(?:\\.|[^`\\])*`|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/],
    ['key', /\b(?:const|let|function|return|if|else)\b/],
  ],
};
```

它不是完美的——正则高亮总有翻车的时候。但对一篇博客而言，够用且不慢，就够了。

## 结果

渲染器本身一百二十行，配套的样式五十行。它渲染了你在读的这一页，也渲染了你刚才看到的每一段代码。

写小工具最大的乐趣就在这儿：**你清楚地知道每一个字符是怎么变成你眼前的样子的。**
