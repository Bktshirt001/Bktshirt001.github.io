# bk_tshirt 的个人小站

一个暖色系、二次元风格的个人介绍网站，包含桌面端侧边导航与移动端抽屉导航。站点是纯静态页面，直接由 GitHub Pages 托管，无需构建步骤。

> 在线地址：<https://bktshirt001.github.io/>

## 页面内容

- **自我介绍**：首屏简介、关于我、三张状态小卡
- **GitHub 仓库**：通过 GitHub REST API 实时读取公开信息，展示仓库、Star、语言、更新时间与自动同步进度
- **在读大学**：内容待补充的校园生活页面
- **个人爱好**：代码、二次元、音乐、好奇心
- **互动细节**：逐字浮现标题、滚动入场动画、鼠标粒子与花瓣、鼠标移出页面时切换标题、回到顶部、滚动进度

## 技术说明

- 原生 HTML / CSS / JavaScript，无框架、无构建步骤
- 背景使用本地压缩后的 ATRI 壁纸，桌面端与移动端分别裁切
- 字体通过 Google Fonts 加载 `Zen Maru Gothic`、`Noto Sans SC` 与 `Caveat`，并带有系统字体回退
- 动画使用原生 `IntersectionObserver`、CSS Keyframes 与 Canvas；未引入额外运行时依赖
- 适配 `prefers-reduced-motion`，减少动效时自动关闭粒子与入场动画

## GitHub API

站点直接调用以下公开接口：

```text
GET https://api.github.com/users/Bktshirt001
GET https://api.github.com/users/Bktshirt001/repos?per_page=100&sort=updated
```

- 显示名：`bk_tshirt`
- GitHub 登录名：`Bktshirt001`
- 头像：`https://avatars.githubusercontent.com/u/300708560`
- 前端不保存任何 Token
- 数据会缓存到浏览器 `localStorage`，缓存有效期与自动刷新间隔均为 5 分钟
- 未认证的 GitHub API 限额为每小时 60 次（按访问者 IP 计算），页面每次同步消耗 2 次
- API 不可用时，页面会显示缓存或内置的离线示例数据，并自动重试，不会出现空白

如果以后访问量变大，建议通过自己的 Serverless Function 或 GitHub Action 代理 API，并把 Token 只放在服务端环境变量中，**不要把 Token 写进前端**。

## 需要补充的文字

以下位置目前使用了通用示例文案，可直接修改 `index.html`：

1. 首屏简介：搜索 `自我介绍 01`
2. 关于我正文三段：搜索 `自我介绍 02`、`自我介绍 03`、`自我介绍 04`
3. 在读大学：搜索 `学校介绍 01`、`学校介绍 02`，以及 `学校 / 专业 / 年级` 三个「待补充」
4. 个人爱好：如果与实际情况不符，可修改四张卡片里的描述与标签
5. GitHub 仓库简介：在对应仓库的 About 中修改，页面会自动读取

## 本地预览

在项目目录运行任意静态服务器即可：

```powershell
python -m http.server 4173
```

然后访问 <http://127.0.0.1:4173/>。

## 目录结构

```text
.
├── index.html
├── assets/
│   ├── css/style.css
│   ├── js/main.js          # 入场动画、导航、粒子、标题切换
│   ├── js/github.js        # GitHub API、缓存与自动刷新
│   └── images/             # 背景、头像回退、favicon
├── .nojekyll
└── readme.md
```

## 部署

仓库名为 `Bktshirt001.github.io`，推送到 `main` 分支后由 GitHub Pages 自动发布。
