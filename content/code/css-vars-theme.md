---
title: 以尺规换天：CSS 变量与主题切换
date: 2026-10-30
tags: [CSS, 实现]
excerpt: 不用切换样式表，也不用复制整个 CSS 文件。一套变量、一个属性、一次落笔，就够换来另一种天色。
---

## 思路

换肤的常见做法是加载两份 CSS，或者给每个规则写两遍。前者要等样式表下载，后者维护到第三套就崩了。

这里用的是第三种：**所有会变的值都写成变量，主题只改变量的值。**

```css
html[data-theme="guofeng"] {
  --paper: #EDF5F6;
  --ink: #12313F;
  --accent: #065279;
}

html[data-theme="cosmos"] {
  --paper: #04070F;
  --ink: #E9F4FF;
  --accent: #30DFF3;
}

body {
  background: var(--paper);
  color: var(--ink);
}
```

改一个属性，整页就换了一个世界。

## 三个细节

### 一、把「颜色」和「用法」分开

变量名不该是 `--blue-600`，而该是 `--accent`、`--ink-faint`、`--card`。前者描述色值，后者描述职责。职责是稳定的，色值随时会变。

```css
.tag {
  color: var(--ink-faint);
  border: 1px solid var(--line);
}
```

同一个 `.tag` 在古风里是淡墨的边界，在星穹里是发青的细线，代码一行没动。

### 二、把颜色模式也告诉浏览器

设置 `color-scheme` 之后，浏览器的滚动条、输入框、默认焦点样式才会跟着变暗，不会在深色主题里露出一截白。

```css
html[data-theme="cosmos"] { color-scheme: dark; }
html[data-theme="guofeng"] { color-scheme: light; }
```

### 三、切换要快，也要记得住

主题存在 `localStorage`，刷新之后还是你上次看见的那一片天。切换本身只是改一个属性，没有任何网络请求，所以快得像眨眼。

```js
function apply(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('qm-theme', theme);
}
```

## 代价

变量不是免费的：它让每条规则多了一次查表，也让初次阅读 CSS 的人多跳几下。

但比起维护两份样式表，这点代价可以忽略。毕竟这个站一共只有两百来个变量引用，而换来的是——一套骨架，两副面孔。
