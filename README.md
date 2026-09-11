<p align="center">
  <img src="./assets/quartzflow-banner.svg" alt="QuartzFlow — a colorful, content-first Obsidian theme" width="100%">
</p>

<p align="center">
  <strong>清晰写作，柔和流动。</strong><br>
  一款从 Typora Escook 设计语言延伸而来的 Obsidian 明暗双模式主题。
</p>

## 特性

- **内容优先**：优化阅读视图、Live Preview 与源码模式的排版节奏。
- **完整界面**：统一文件栏、标签页、菜单、弹窗、Hover Preview 和设置页。
- **彩虹导航**：文件夹分组、文件图标与拖放目标提供清晰的层级反馈。
- **精修正文**：彩色标题、macOS 风格代码块、表格、引用和紧凑列表。
- **本地且自包含**：字体构建后内嵌到 `theme.css`，无远程请求或安装路径依赖。
- **可配置**：支持 Style Settings 调整颜色、字体、字号、宽度、圆角和密度。
- **弹性分隔条（可选）**：配套插件让左右侧栏分隔线随拖动方向柔和弯曲、松手弹性回位，并缓和端点附近的弯折。

## 安装

### 手动安装

1. 下载仓库中的 [`QuartzFlow`](./QuartzFlow) 文件夹。
2. 将它复制到 `<你的仓库>/.obsidian/themes/QuartzFlow/`。
3. 在 Obsidian 的 **设置 → 外观 → 主题** 中选择 **QuartzFlow**。

更新时覆盖该文件夹，然后重新加载 Obsidian。主题最低支持版本为 **Obsidian 1.12.0**。

> QuartzFlow 尚未声明已上架 Obsidian 社区主题目录；在正式通过审核前，请使用手动安装。

## 自定义

主题无需插件即可使用。安装社区插件 **Style Settings** 后，可在 **设置 → Style Settings → QuartzFlow** 中调整主要视觉参数。若某项设置未即时刷新，切换一次主题或重新加载应用。

### 弹性分隔条（可选）

此效果需要启用 **QuartzFlow 主题**、**Style Settings** 和配套插件，仅用于桌面端：

1. 在 Obsidian 仓库中创建 `.obsidian/plugins/quartzflow-elastic-dividers/`。
2. 将 [`src/plugins/elastic-dividers`](./src/plugins/elastic-dividers) 中的 `main.js` 和 `manifest.json` 直接复制进去，使用该目录中的插件清单。
3. 重新加载 Obsidian，在 **设置 → 社区插件** 中启用 **QuartzFlow 弹性分隔条**。

插件只观察左右侧栏的原生拖动，保持分隔线原有粗细，提供平滑换向、惯性回弹和端点柔化；不读写笔记、不联网。

开关位于 **Style Settings → QuartzFlow → 界面与布局 → 弹性分隔条**，默认开启；系统开启“减少动态效果”时停用动画。未安装配套插件时使用原生分隔条。

主题和配套插件分别安装，源码统一放在本项目中：

| 内容 | 项目中的位置 | Obsidian 中的安装位置 |
| --- | --- | --- |
| 主题 | `QuartzFlow/` | `.obsidian/themes/QuartzFlow/` |
| 弹性分隔条插件 | `src/plugins/elastic-dividers/` | `.obsidian/plugins/quartzflow-elastic-dividers/` |
| 开发检查脚本 | `scripts/` | 无需安装 |

更新插件时，覆盖插件目录中的这两个文件，再停用并重新启用该插件。若开关已开启但没有效果，先确认社区插件已启用、文件没有多套一层目录，以及系统是否开启了“减少动态效果”。

## 开发

`src/` 统一存放主题与配套插件源码。主题 CSS 按数字前缀排序构建，插件 JavaScript 不会合并进 `theme.css`：

```text
src/
  00-settings.css     Style Settings 元数据
  01-fonts.css        本地字体声明
  02-tokens/          明暗模式与设计变量
  03-core/            Obsidian 官方变量映射
  04-editor/          正文、标题、代码、表格等
  05-app/             应用外壳与侧边栏
  06-components/      菜单、弹窗、表单和提示窗
  08-features/        彩虹文件夹、文件图标与特色交互
  99-safeguards.css   最后加载的兼容规则
  plugins/
    elastic-dividers/
      main.js        弹性分隔条逻辑
      manifest.json  配套插件元数据
QuartzFlow/
  manifest.json       主题元数据
  theme.css           生成的发布产物
  fonts/              构建时内嵌的字体源
scripts/
  audit.mjs           主题静态检查报告
  check-elastic-dividers.cjs  配套插件回归检查
build.mjs             主题构建、监听与部署
```

开发检查需要 Node.js，无需安装 npm 依赖。主题可独立使用；可选插件依赖 Obsidian 提供的插件 API。

```bash
npm run build         # 生成 QuartzFlow/theme.css
npm run dev           # 监听 src/ 并持续构建
npm run audit         # 检查路径、字体和 CSS 风险
npm run check         # 构建、主题静态审计和插件回归检查
node scripts/check-elastic-dividers.cjs # 验证可选分隔条插件的拖动与回弹
```

`audit.mjs` 扫描 CSS 结构、重复声明、字体与资源引用、Style Settings 元数据等，输出供人工检查的报告；`check-elastic-dividers.cjs` 在模拟环境中验证换向、回弹、端点曲率、开关和状态清理，失败时以非零状态退出。两者都应随源码提交，日常使用主题或插件时不会运行，也不能替代 Obsidian 中的实际外观检查。

本地部署主题可运行 `npm run deploy -- --vault="<vault-path>"`，或将测试仓库路径写入被忽略的 `.vault` 文件。此命令只复制 `theme.css`；配套插件按上面的步骤单独更新。`npm run dev` 监听 `src/` 并重建主题，不会热重载 Obsidian 中的插件。不要直接编辑生成的 `QuartzFlow/theme.css`。

## 发布

本次版本说明见 [1.2.0 更新说明](./docs/releases/1.2.0.md)。

创建 GitHub Release 前：

1. 更新 `QuartzFlow/manifest.json` 的语义化版本。
2. 运行 `npm run check` 并在明暗模式下手动验证主要界面。
3. 创建与 manifest 版本一致的标签，例如 `1.2.0`，不额外添加 `v` 前缀。
4. 将 `QuartzFlow/manifest.json` 和 `QuartzFlow/theme.css` 作为 Release 附件上传。

这是 [Obsidian 官方主题发布流程](https://docs.obsidian.md/themes/app-themes/submit-theme) 要求的核心发布资产。

GitHub 源码仓库保留 `src/`、`scripts/`、`build.mjs` 和同步生成的 `QuartzFlow/theme.css`。主题发布附件与开发工具分开；若同时分发可选插件，应将其 `main.js` 和插件 `manifest.json` 单独打包，勿与主题清单混用。主题和插件各自维护版本号。

## 贡献

提交问题时请附上 Obsidian/操作系统版本、明暗模式、复现步骤和截图。代码贡献请阅读 [`AGENTS.md`](./AGENTS.md)，并提交同步重建后的 `QuartzFlow/theme.css`。

## 致谢与许可

QuartzFlow 基于 [刘龙宾](https://github.com/liulongbin1314) 的 [Typora Escook Theme](https://github.com/liulongbin1314/typora-theme) 继续设计与移植，感谢原作者提供的视觉基础。
