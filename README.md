# 无言 · 个人博客

一个手写的中文博客：两套完全独立的视觉风格，一键切换。

- **深空（默认）**：星云循环影像、无衬线字、玻璃卡片、青紫辉光
- **山水**：樱与楼台的壁纸、宋体、暖纸色、飘落的樱瓣
- 切换按钮在左上角，选择记在 `localStorage`
- 分区：主页 / 笔记 / 专栏 / 归档 / 标签 / 搜索
- 没有框架、没有打包器、没有构建步骤

## 目录

```
myblog/
├── index.html          主页
├── notes.html          笔记
├── columns.html        专栏
├── archives.html       归档
├── tags.html           标签
├── search.html         搜索
├── post.html           正文（?id=文章id）
├── 404.html
├── assets/
│   ├── css/
│   │   ├── base.css              结构：布局与组件骨架
│   │   ├── theme-cosmos.css      深空主题
│   │   └── theme-guofeng.css     山水主题
│   ├── js/
│   │   ├── theme.js       两套背景切换 + 视频调度
│   │   ├── stars.js       深空：星子与流星
│   │   ├── petals.js      山水：落樱
│   │   ├── markdown.js    手写 Markdown 渲染器
│   │   └── app.js         列表、归档、标签、搜索、正文
│   └── media/
│       ├── galaxy.mp4         1600×900 星云背景（约 1.5 MB / 20 秒）
│       ├── galaxy-960.mp4     960×540 轻量版（约 350 KB）
│       ├── shan-shui.jpg      山水壁纸 1920×1090（约 360 KB）
│       ├── shan-shui-1280.jpg 轻量版（约 175 KB）
│       ├── poster.jpg         视频海报
│       └── favicon.svg
└── content/
    ├── posts.json      全部文章与专栏的元信息
    └── posts/*.md      正文
```

## 写一篇新文章

1. 在 `content/posts/` 新建 Markdown：

```md
---
title: 标题
date: 2026-11-10
tags: [设计, CSS]
---

正文。支持标题、列表、引用、表格、代码块与 `:::note` 注解。
```

2. 在 `content/posts.json` 的 `posts` 里加一条：

```json
{
  "id": "my-post",
  "type": "note",
  "title": "标题",
  "date": "2026-11-10",
  "tags": ["设计"],
  "excerpt": "一两句摘要，会出现在列表与搜索结果里。",
  "file": "content/posts/my-post.md"
}
```

- `type` 取 `note`（笔记）或 `column`（专栏）
- 专栏要加 `"column": "专栏id"` 和 `"index": 序号`
- `id` 就是链接里的 `?id=`，也是文件名，建议用英文

3. 推送：

```bash
git add .
git commit -m "post: 标题"
git push
```

## 本地预览

文章是运行时用 `fetch` 读取的，直接双击 HTML 会被同源策略拦住。起一个本地服务器：

```bash
python -m http.server 8080
```

Windows 也可以双击 `serve.cmd`，然后打开 http://localhost:8080

## 部署到 GitHub Pages

仓库已带 `.github/workflows/pages.yml`，推送到 `main` 即发布。

首次需要在仓库里打开一次开关：**Settings → Pages → Source 选 “GitHub Actions”**。
若想改用分支部署，把 Source 改成 `Deploy from a branch`，选 `main` / `(root)` 也可以——本站没有构建步骤，`.nojekyll` 已就位。

站点地址：`https://wuyan2233.github.io`

## 两套风格是怎么分开的

- 颜色、字体、圆角、阴影全部是 CSS 变量，挂在 `html[data-theme="cosmos"]` 和 `html[data-theme="guofeng"]` 下；
- 组件（卡片、按钮、导航、正文）各写一份主题样式，互不干扰；
- 背景是两层共用一个容器：深空用视频 + 星子画布，山水用壁纸 + 樱瓣画布。

切换时视频、画布会自动启停，切到后台标签页也会暂停，不白耗电。

## 素材

- 山水壁纸来自 Wallpaper Engine 创意工坊场景「大明风华卷·其三 春时雨」，已转成网页用 JPEG。
- 星云影像来自创意工坊素材，截取 20 秒、压缩后使用。

两者仅供个人非商业使用。

## 许可

文字与代码可自由取用，署名与否皆可。
