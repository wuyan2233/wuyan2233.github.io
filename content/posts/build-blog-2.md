---
title: 手写一个 Markdown 渲染器
date: 2026-10-15
tags: [JavaScript, 实现]
---

## 为什么不用现成的

`marked` 二十来 KB，功能齐全。但这个站的目标之一是「不假外物」——少一个依赖，就少一次失效的可能。

博客用到的 Markdown 其实很小：标题、段落、列表、引用、代码、表格。

## 主循环

整个渲染器是一个 `while` 循环，每次吃掉一种块：

```js
while (i < lines.length) {
  const line = lines[i];

  if (isFence(line))   { html.push(renderCode()); continue; }
  if (isHeading(line)) { html.push(renderHeading()); continue; }
  if (isList(line))    { html.push(renderList()); continue; }
  if (isQuote(line))   { html.push(renderQuote()); continue; }
  if (isTable(line))   { html.push(renderTable()); continue; }

  html.push(renderParagraph());
}
```

顺序很重要：围栏代码必须先判断，否则代码里的 `#` 会被当成标题。

## 行内的麻烦

行内语法真正麻烦的是转义与嵌套。先转义再匹配，链接里的 `&` 会变成 `&amp;`；先匹配再转义，刚插进去的标签又会被转义掉。

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

占位符用 `\u0000`，一个正文里永远不会出现的字符。

## 顺手着色

代码块的颜色不必用完整的词法器。每种语言写四五条正则——注释、字符串、关键字、数字、函数名——拼成一个大正则，命中就套一层 `span`。

它不是完美的，正则高亮总有翻车的时候。但对一篇博客而言，够用且不慢，就够了。

> 写小工具最大的乐趣是：你清楚地知道每个字符是怎么变成眼前这个样子的。
