# bk_tshirt 的个人小站

一个暖色系、二次元风格的个人介绍网站。桌面端导航会在鼠标靠近左侧时自动侧滑出现，移动端使用抽屉菜单。站点是纯静态页面，由 GitHub Pages 托管，无需构建步骤。

> 在线地址：<https://bktshirt001.github.io/>

## 当前内容

- **首屏简介**：`喜欢动漫，音乐，计算机的普通大学生捏~目前正在学习rust，很高兴你能看到我的主页。`
- **自我介绍 / 在读大学 / 个人爱好**：按你的要求留白，只保留版式、图标和 `less is more`
- **GitHub 仓库**：通过 GitHub REST API 实时读取公开数据
- **随机 BGM**：进入页面时随机选择一首二次元风格纯音乐，并提供播放/暂停控制
- **互动细节**：逐字浮现标题、滚动入场、鼠标粒子与花瓣、鼠标移出页面时切换标题、回到顶部、滚动进度

## 左侧导航

- 桌面端默认隐藏，鼠标靠近屏幕左侧（或左侧小花把手）时滑出
- 鼠标移开后自动收起
- 可用左侧把手点击/键盘打开，`Esc` 关闭
- 移动端保留右上角菜单按钮与抽屉导航

## 随机 BGM

浏览器通常会阻止有声音的自动播放，因此站点会先尝试自动播放；若被浏览器拦截，会在右下角显示「点击开启」，并在用户第一次点击/按键后开始播放。音乐开始后可通过播放器暂停或继续。

曲目从以下三首中随机选择，均已下载到 `assets/audio/` 并随站点发布：

| 曲目 | 作者 | 许可 | 来源 |
| --- | --- | --- | --- |
| Anime-esque Intro-Outro Theme | Cleyton Kauffman | CC0 1.0 | <https://opengameart.org/content/anime-esque-intro-outro-theme> |
| Determination | HydroGene | CC0 1.0 | <https://opengameart.org/content/determination-anime-style-music> |
| Fantastic Japanese-Style Shoot 'em up Game Music (Mauve Rhopalocera) | ISAo | OGA-BY 3.0 | <https://opengameart.org/content/fantastic-japanese-style-shoot-em-up-game-music> |

OGA-BY 3.0 许可说明：<https://opengameart.org/content/oga-by-30-faq>

如果替换音乐，请同时更新 `assets/js/music.js` 中的曲目信息和本节署名。

## 技术说明

- 原生 HTML / CSS / JavaScript，无框架、无构建步骤
- 背景使用本地压缩后的 ATRI 壁纸，桌面端与移动端分别裁切
- 字体通过 Google Fonts 加载 `Zen Maru Gothic`、`Noto Sans SC` 与 `Caveat`，并带有系统字体回退
- 动画使用原生 `IntersectionObserver`、CSS Keyframes 与 Canvas；未引入额外运行时依赖
- 适配 `prefers-reduced-motion`，减少动效时自动关闭粒子与入场动画
- 音频为本地文件，选中曲目会预加载以缩短起播等待

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
- API 不可用时，页面会显示缓存或内置的离线示例数据，并自动重试

如果以后访问量变大，建议通过自己的 Serverless Function 或 GitHub Action 代理 API，并把 Token 只放在服务端环境变量中，**不要把 Token 写进前端**。

## 待补充区域

以下区域目前有意留白，后续可直接在 `index.html` 中填写：

- `关于我`：正文、签名以外的介绍文字
- `在读大学`：学校、专业、年级、校园经历
- `个人爱好`：四张卡片的标题、描述与标签
- 页脚：如需添加联系方式或社交链接

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
│   ├── audio/              # 随机播放的 BGM
│   ├── css/style.css
│   ├── js/music.js         # 随机选曲、自动播放降级、播放器
│   ├── js/main.js          # 入场动画、自动侧滑导航、粒子、标题切换
│   ├── js/github.js        # GitHub API、缓存与自动刷新
│   └── images/             # 背景、头像回退、favicon、OG 封面
├── .nojekyll
└── readme.md
```

## 部署

仓库名为 `Bktshirt001.github.io`，推送到 `main` 分支后由 GitHub Pages 自动发布。
