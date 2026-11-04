---
title: 换肤：一套结构，两套视觉
date: 2026-10-12
tags: [CSS, 实现]
---

## 三层分工

- **变量**：颜色、字体、圆角、阴影，全部交给 CSS 自定义属性；
- **结构**：HTML 只写一次，两套主题共用；
- **组件**：靠 `html[data-theme="…"]` 前缀覆写外观。

改一个属性，整站换一个样子。

```css
html[data-theme="cosmos"]  { --bg: #05070F; --text: #E9F0FA; --accent: #5AD7FF; }
html[data-theme="guofeng"] { --bg: #F4ECE6; --text: #2A2420; --accent: #B4462F; }

body { background: var(--bg); color: var(--text); }
```

## 变量名描述职责，不描述色值

`--accent` 比 `--blue-500` 好，因为前者说的是「用来强调」，后者说的是「它现在是蓝色」。职责稳定，颜色随时会变。

## 圆角和字体也变量化

两套皮肤的差异不止颜色。深空是 16px 圆角、无衬线、玻璃质感；山水是 5px 圆角、宋体、纸面。所以这些也写成变量：

```css
html[data-theme="cosmos"]  { --r-card: 16px; --font-display: "Inter", sans-serif; }
html[data-theme="guofeng"] { --r-card: 5px;  --font-display: "Songti SC", serif; }
```

## 切换的那一下

换肤如果「啪」地一下完成，会显得很廉价。这里加了两件事：

1. 给关键的几处加 0.6 秒的颜色过渡；
2. 从左上角按钮的位置扩散一圈光晕。

```js
veil.style.background = `radial-gradient(circle at ${x}px ${y}px, …)`;
```

不复杂，但它让「换」这个动作有了先后。

## 代价

组件样式要写两遍。不优雅，但很直白——而且两套规则永远互不干扰，改一套不会弄坏另一套。
