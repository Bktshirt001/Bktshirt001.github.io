# bk_tshirt 的个人小站

一个暖色系、二次元风格的个人介绍网站。桌面端导航会在鼠标靠近左侧时自动侧滑出现，移动端使用抽屉菜单。站点是纯静态页面，由 GitHub Pages 托管，无需构建步骤。

> 在线地址：<https://bktshirt001.github.io/>

## 当前内容

- **首屏**：左侧是小介绍屏，右侧是 Rust 源码打印 DeepSeek 鲸鱼 ASCII 字符画；代码默认折叠只显示少量内容，点击「展开代码」后可在代码框内上下、左右滚动查看完整 43 行
- **关于我**：自我介绍与三个兴趣框合并为一个界面，分别介绍代码、音乐和现实爱好
- **滚动字条**：`anime`、`code`、`music`、`computer`、`love` 五个词来回滚动
- **GitHub 仓库**：通过 GitHub REST API 实时读取公开数据
- **在读大学**：邵阳学院介绍
- **页脚**：更新提示与「个人链接」栏（bilibili、GitHub）
- **随机 BGM**：进入页面时从本地歌单随机选择一首，并提供播放/暂停控制
- **互动细节**：逐字浮现标题、滚动入场、鼠标粒子与花瓣、鼠标移出页面时切换标题、回到顶部、滚动进度

## 左侧导航

- 桌面端默认隐藏，鼠标靠近屏幕左侧（或左侧小花把手）时滑出
- 鼠标移开后自动收起
- 可用左侧把手点击/键盘打开，`Esc` 关闭
- 移动端保留右上角菜单按钮与抽屉导航

## 首屏代码

首屏代码位于 `index.html` 的 `hero--code` 区块，保存的是可编译的 Rust：

```rust
const WHALE: &str = r#"
...
"#;

fn main() {
    for line in WHALE.lines() {
        println!("{line}");
    }
}
```

- 左侧有首屏小介绍屏，右侧是代码窗口
- 默认是预览态，只显示开头少量代码
- 点击代码预览、右上角「展开代码」或 `Esc` 可切换状态
- 展开后代码框支持内部滚动，不依赖外部库
- 行号与语法高亮由页面 CSS / HTML 呈现

## 关于我

首屏下方是合并后的「关于我」区块：

- 一段大一新生自我介绍
- 三个兴趣框：代码、音乐、现实爱好
- 导航从此只保留「关于我」「GitHub 仓库」「在读大学」三项

## 在读大学

邵阳学院介绍参考学校公开资料整理，控制在 2000 字以内；页面中已注明“具体以官方发布为准”。

## 随机 BGM

浏览器通常会阻止有声音的自动播放，因此站点会先尝试自动播放；若被浏览器拦截，会在播放器上显示提示，并在用户第一次点击/按键后开始播放。音乐开始后可通过播放器暂停或继续。

曲目从 `assets/audio/` 下的以下本地歌单中随机选择：

| 曲目 | 作者 | 文件 |
| --- | --- | --- |
| 光るなら | Goose house | `Goose house - 光るなら.mp3` |
| 裏切りアリス | M-ART、GUMI | `M-ART、GUMI - 里切りアリス.mp3` |
| 華色の青春 | うたたね歌菜 | `うたたね歌菜 - 华色の青春.mp3` |
| つよがるガール | ぼっちぼろまる、もっさ | `ぼっちぼろまる、もっさ - つよがるガール.mp3` |
| feel my soul | 寺澤百花 | `寺泽百花 - feel my soul.mp3` |
| 标题.爱丽丝 (DJ长音频) | 草莓酱紫 | `草莓酱紫 - 标题.爱丽丝 (DJ长音频).mp3` |
| 楽園の扉 | 青葉りんご | `青叶りんご - 楽园の扉.mp3` |

> 这些是站点所有者提供的本地音乐文件，版权归原权利人所有。若要公开部署到 GitHub Pages，请先确认拥有相应的公开展示/传播授权。

如果替换音乐，请同时更新 `assets/js/music.js` 中的曲目信息和本节列表。

## 技术说明

- 原生 HTML / CSS / JavaScript，无框架、无构建步骤
- 背景使用本地压缩后的 ATRI 壁纸，桌面端与移动端分别裁切
- 字体通过 Google Fonts 加载 `Zen Maru Gothic`、`Noto Sans SC` 与 `Caveat`，并带有系统字体回退
- 动画使用原生 `IntersectionObserver`、CSS Keyframes 与 Canvas；未引入额外运行时依赖
- 适配 `prefers-reduced-motion`，减少动效时自动关闭粒子与入场动画
- 音频为本地文件，只预加载 metadata，实际播放时再缓冲

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
