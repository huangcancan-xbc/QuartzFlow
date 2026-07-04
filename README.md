# QuartzFlow for Obsidian

QuartzFlow 是一款受 macOS 风格启发的 Obsidian 主题，基于开源的 Typora [Escook 主题](https://github.com/liulongbin1314/typora-theme) 移植并二次开发而来。它在保留原主题彩色标题下划线、金色链接、macOS 风格代码块等标志性设计的同时，针对 Obsidian 的完整界面进行了系统级美化，覆盖阅读视图、实时预览、源码模式、侧边栏、标签页、状态栏、设置面板、菜单、弹窗、命令面板等几乎所有可见区域。

本主题追求干净、通透、低干扰的写作体验：浅色模式柔和明亮，适合白天长时间编辑；深色模式采用纯黑背景与高对比文字，对 OLED 屏幕友好，也适合夜间使用。所有颜色、间距、圆角、阴影均通过 CSS 变量组织，便于通过 Style Settings 插件进行无代码自定义。

## 1. 目录结构

```text
QuartzFlow/
  theme.css       主题样式文件（Obsidian 必需）
  manifest.json   主题元数据文件（Obsidian 必需）
  fonts/          内嵌字体文件（推荐保留）
```

**文件说明：**

- **`theme.css`：主题的核心样式文件。** Obsidian 加载主题时只会读取这一个 CSS 文件，因此所有样式、字体引用、CSS 变量、Style Settings 配置块都集中于此。
- **`manifest.json`：主题的元数据文件。** Obsidian 通过它识别主题名称、版本、作者等信息。其中 `name` 字段必须与主题文件夹名称完全一致（包括大小写），否则主题不会出现在设置列表中。
- **`fonts/`：存放主题使用的字体文件。** `theme.css` 通过相对路径 `./fonts/` 引用这些资源，确保主题文件夹整体移动后仍能正常加载。

## 2. 功能特性

### 2.1 视觉风格

- **浅色模式**：以白色和浅灰为主背景，搭配金色链接与柔和的阴影，营造清爽的编辑环境。
- **深色模式**：纯黑背景配合高对比文字，降低 OLED 屏幕烧屏风险，同时保持舒适的夜间阅读体验。
- **macOS 灵感**：借鉴 macOS 的圆角、间距和层次处理，使 Obsidian 界面更接近原生桌面应用。

### 2.2 编辑器增强

- **彩色标题装饰**：H1-H4 分别带有不同颜色的下划线或装饰，快速区分文档层级。
- **金色链接**：内部链接、外部链接、标签统一使用醒目的金色，保持视觉一致性。
- **macOS 代码块**：渲染后的代码块顶部带有红、黄、绿三色圆点，模拟 macOS 窗口按钮。
- **引用块与表格**：针对引用块、表格、图片、分割线等元素进行了专门的间距和颜色优化。

### 2.3 界面组件

- 侧边栏、文件浏览器、搜索面板、标签页、ribbon 工具栏
- 状态栏、标题栏、面包屑、大纲面板
- 设置面板、命令面板、快速切换器、右键菜单
- 弹窗/模态框、通知提示、悬浮提示、Hover 预览
- 表单控件：按钮、输入框、下拉框、滑块、开关、复选框

### 2.4 插件兼容性

- 支持 **Style Settings** 插件，提供大量可视化开关和滑块。
- 对常见社区插件的视图表面做了通用兼容处理，减少插件界面出现透明背景、不可读文字或错位边框的情况。

## 3. 安装方法

1. 下载或克隆本仓库。
2. 将 `QuartzFlow` 文件夹复制到你的 Obsidian 仓库主题目录：

   ```text
   <你的仓库>/.obsidian/themes/QuartzFlow/
   ```

3. 打开 Obsidian。
4. 进入 **设置 → 外观 → 主题**。
5. 在主题下拉列表中选择 **QuartzFlow**。

## 4. 更新方法

1. 用新的 `QuartzFlow/` 文件夹覆盖旧文件夹：

   ```text
   <你的仓库>/.obsidian/themes/QuartzFlow/
   ```

2. 重启 Obsidian；或者先切换到其他主题，再切回 QuartzFlow，以强制重新加载样式。

## 5. Style Settings 支持

QuartzFlow 无需任何额外插件即可正常工作。如果你安装了社区插件 **Style Settings**，可以在 **设置 → Style Settings → QuartzFlow** 中找到以下自定义选项：

### 5.1 颜色

- 强调色
- 链接颜色
- 浅色模式背景色
- 深色模式背景色

### 5.2 字体

- 正文字体
- 界面字体
- 代码字体

### 5.3 排版

- 正文字号
- 正文行高
- 阅读视图最大宽度

### 5.4 标题

- H1-H4 下划线粗细
- 下划线偏移距离
- 标题阴影强度

### 5.5 代码块

- macOS 红绿灯圆点开关
- 代码块圆角
- 代码块背景强度
- 代码块阴影

### 5.6 布局与密度

- 侧边栏密度
- 文件列表项高度
- 标签页高度
- 面板间距
- 全局圆角
- 全局阴影强度

### 5.7 其他元素

- 表格样式
- 引用块样式
- 图片样式
- 弹窗/模态框样式
- 菜单样式

## 6. 兼容性

QuartzFlow 面向 Obsidian 1.12.x 及以上版本设计。更低版本的 Obsidian 可能无法正确解析部分 CSS 变量或选择器，不保证显示效果。

## 7. 常见问题

**Q：主题没有出现在设置列表中怎么办？**
A：请检查 `<仓库>/.obsidian/themes/` 下的文件夹名称是否为 `QuartzFlow`，且 `manifest.json` 中的 `name` 字段也是 `QuartzFlow`，包括大小写必须一致。

**Q：修改 Style Settings 后没有生效？**
A：Style Settings 的改动通常实时生效。如果未生效，尝试重新加载 Obsidian 或切换一次主题。

**Q：某些插件界面显示异常？**
A：请提交 issue 时附上插件名称、Obsidian 版本、截图以及你当前使用的模式（浅色/深色）。

## 8. 反馈问题

如果你在使用过程中发现显示异常、颜色不协调或与其他插件冲突，欢迎提交 issue。请尽量提供以下信息：

- Obsidian 版本号
- 操作系统及版本
- 当前使用的是浅色模式还是深色模式
- 受影响界面的截图
- 问题发生的步骤或简要说明

## 9. 开发与维护

### 9.1 本地调试

1. 将 `QuartzFlow` 文件夹放到测试仓库的 `.obsidian/themes/QuartzFlow/` 目录。
2. 在 Obsidian 中启用该主题。
3. 修改 `theme.css` 后，切换一次主题或按 `Ctrl/Cmd + P` 运行 **重新加载应用** 以查看效果。

### 9.2 发布前检查

在提交到社区主题市场或发布 GitHub Release 前，建议确认：

- `manifest.json` 中的 `name` 与主题文件夹名称一致。
- `version` 已正确递增。
- `theme.css` 中无本地绝对路径。
- 字体等静态资源使用相对路径 `./fonts/` 引用。
- 在浅色/深色模式下测试了阅读视图、实时预览、源码模式、设置面板、命令面板等关键界面。

## 10. manifest.json 字段说明

```json
{
  "name": "QuartzFlow",
  "version": "1.0.0",
  "minAppVersion": "1.12.0",
  "author": "MinBit",
  "authorUrl": "https://github.com/huangcancan-xbc/QuartzFlow",
  "description": "A macOS-inspired Obsidian theme with polished light and high-contrast dark modes."
}
```

| 字段 | 说明 |
|---|---|
| `name` | 主题名称。**必须与主题文件夹名称完全一致**（包括大小写），否则 Obsidian 无法识别并加载主题。 |
| `version` | 主题版本号，采用语义化版本格式（如 `1.0.0`）。每次发布更新时建议递增，方便用户识别是否有新版本。 |
| `minAppVersion` | 最低支持的 Obsidian 版本。低于此版本的 Obsidian 可能无法正确渲染主题或解析部分 CSS 特性。 |
| `author` | 作者或维护者名称，会显示在 Obsidian 主题详情页面。当前为 `MinBit`。 |
| `authorUrl` | 作者主页或项目仓库链接，用户点击后可在浏览器中打开。 |
| `description` | 主题简介，显示在 Obsidian 主题列表中，用于快速说明主题风格与特点。 |

## 11. 致谢

QuartzFlow 的设计灵感来源于 [liulongbin1314](https://github.com/liulongbin1314/typora-theme) 的 Typora Escook 主题。感谢原作者提供优秀的视觉基础。
