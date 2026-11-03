# 青冥集 · Qingming Ji

一个手写的中文博客：宣纸与远山，一键换作深空与星云。
没有框架，没有打包器，没有构建步骤——只有 HTML、CSS 和一小段 JavaScript。

- 在线地址：https://wuyan2233.github.io/myblog/
- 仓库：https://github.com/wuyan2233/myblog
- 配色：中国传统色 · 蓝色系（月白作纸，靛蓝作墨，湖蓝点睛，朱砂落款）

## 目录

```
myblog/
├── index.html            卷首（首屏 + 四卷 + 近稿）
├── articles.html         文章
├── code.html             代码
├── questions.html        疑问
├── resources.html        资源
├── post.html             文章正文页（?s=分区&slug=文件名）
├── 404.html              自定义 404
├── assets/
│   ├── css/
│   │   ├── base.css            结构与排版
│   │   ├── theme-guofeng.css   古风皮肤
│   │   └── theme-cosmos.css    星穹皮肤
│   ├── js/
│   │   ├── theme.js      换境（主题切换 + 背景视频调度）
│   │   ├── stars.js      星子与流星
│   │   ├── markdown.js   手写 Markdown 渲染器
│   │   ├── site.js       公共行为（日期、复制、入场动画…）
│   │   ├── list.js       分区列表与检索
│   │   └── post.js       正文渲染、目次、前后篇
│   └── media/
│       ├── galaxy.mp4        1600×900 星云背景（约 1.5 MB，20 秒循环）
│       ├── galaxy-960.mp4    960×540 轻量版（约 350 KB）
│       ├── poster.jpg        视频海报（首帧）
│       └── favicon.svg
└── content/
    ├── posts.json        卷目：所有文章的元信息与顺序
    ├── articles/  code/  questions/  resources/
    └── …                每篇文章一个 .md
```

## 写一篇新文章

1. 在对应的分区目录里新建一个 Markdown 文件，例如 `content/articles/my-post.md`：

```md
---
title: 标题
date: 2026-11-10
tags: [随笔, 设计]
excerpt: 一两句摘要，会出现在列表页。
---

正文从这里开始。

## 一个二级标题

支持段落、**粗体**、*斜体*、`行内代码`、链接、列表、引用、表格与围栏代码块。
```

2. 在 `content/posts.json` 的 `posts` 数组里加一条：

```json
{
  "section": "articles",
  "slug": "my-post",
  "title": "标题",
  "date": "2026-11-10",
  "tags": ["随笔", "设计"],
  "excerpt": "一两句摘要，会出现在列表页。"
}
```

`slug` 必须和文件名一致；`section` 取 `articles` / `code` / `questions` / `resources`。

3. 提交并推送：

```bash
git add .
git commit -m "post: 标题"
git push
```

推上去一到两分钟，GitHub Pages 就会自动更新。

## 本地预览

文章是运行时用 `fetch` 读取 Markdown 的，直接用 `file://` 双击打开会被浏览器的同源策略拦住。起一个本地服务器即可：

```bash
# 任选其一
python -m http.server 8080
npx serve .
```

Windows 上也可以直接双击 `serve.cmd`。然后访问 http://localhost:8080

## 部署到 GitHub Pages

仓库已附带 `.github/workflows/pages.yml`：推送到 `main` 分支即构建发布。

首次部署需要在仓库里打开一次开关：
**Settings → Pages → Build and deployment → Source 选 “GitHub Actions”**。

若想改用「从分支部署」，把 Source 改成 `Deploy from a branch`，分支选 `main`、目录选 `/ (root)` 也可以——本站没有构建步骤，静态文件直接可用（`.nojekyll` 已就位）。

## 关于两套皮肤

| | 古风（默认） | 星穹 |
| --- | --- | --- |
| 底色 | 月白 `#EDF5F6` / 雪白 | 深空 `#04070F` |
| 主色 | 靛蓝 `#065279` | 湖蓝 `#30DFF3` |
| 材质 | 宣纸、远山、纸纹噪点 | 磨砂玻璃、星云影像、辉光 |
| 动效 | 雾线、缓动入场 | 视频循环、星子呼吸、流星 |

切换按钮在右上角（首屏也有一个「换境」）。选择记在 `localStorage` 的 `qm-theme` 里，刷新不丢。
星穹主题下，视频只在需要时加载与播放，切回古风、切走标签页都会暂停。

## 背景影像的来历

原素材是一段 4K、5 分钟的星云循环（约 390 MB）。这里只取其中 **20 秒**，缩至 1600×900、24 fps、去掉音轨，压到约 **1.5 MB**，作为星穹主题的背景。
画面用 `object-fit: cover` 铺满视口，随窗口比例自然裁切；移动端另取 960×540 的轻量版本。

若你要替换成自己的视频，把 `assets/media/galaxy.mp4`、`galaxy-960.mp4` 与 `poster.jpg` 换掉即可，文件名保持不变。

## 配色

| 名 | 色值 | 名 | 色值 |
| --- | --- | --- | --- |
| 雪白 | `#F0FCFC` | 群青 | `#4C8DAE` |
| 莹白 | `#E3F9FD` | 靛青 | `#177CB0` |
| 水蓝 | `#D2F0F4` | 靛蓝 | `#065279` |
| 月白 | `#D6ECF0` | 藏青 | `#2E4E7E` |
| 蔚蓝 | `#7CF3FF` | 绀青 | `#003371` |
| 湖蓝 | `#30DFF3` | 宝蓝 | `#4B5CC4` |
| 蓝 | `#44CFF6` | 藏蓝 | `#3B2E7E` |

## 许可

文字与代码可自由取用，署名与否皆可。背景影像来自 Wallpaper Engine 创意工坊素材，仅供个人非商业使用。
