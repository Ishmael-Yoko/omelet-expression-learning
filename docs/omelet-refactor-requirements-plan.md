# omelet-表达训练系统重构需求与开发计划

## 1. 文档目的

本文档用于规划当前 `expression-trainer` 项目的系统性重构。重构目标包括项目更名、代码架构规范化、页面布局与视觉体系重设、Markdown 报告渲染、工程化治理、测试补强与后续功能演进。

目标项目名称：**omelet-表达训练系统**。

## 2. 背景与现状

当前项目是一个 Electron 桌面应用，核心链路为：

```text
麦克风录音 / 粘贴逐字稿
-> 本地 Sherpa-ONNX ASR 识别
-> 词库规则分析
-> 实时字幕与统计
-> LLM 实时反馈
-> 最终 Markdown 报告
```

现有功能已经可用，但存在以下问题：

- `main.js` 同时负责窗口、IPC、设置、ASR、AI、文件保存，职责过重。
- `src/app.js` 同时处理录音、状态、DOM、统计、反馈、报告，维护成本高。
- 词库分析与前端高亮存在重复词表，容易不一致。
- 报告 Markdown 目前用正则手写渲染，能力弱且有安全风险。
- 页面视觉风格需要重新统一，当前布局更偏原型，缺少产品级信息层级。
- 没有自动化测试、Lint、格式化、构建打包流程。

## 3. 重构目标

### 3.1 产品目标

- 将产品统一更名为 **omelet-表达训练系统**。
- 保留现有核心能力：实时识别、词库分析、AI 反馈、报告生成、逐字稿分析。
- 重新设计主界面布局和颜色系统，使其更像高频使用的训练工具，而不是演示页面。
- 增加可靠的 Markdown 渲染能力，用于最终报告展示。
- 为后续训练记录、趋势分析、自定义词库、报告导出打基础。

### 3.2 技术目标

- 拆分主进程、服务层、渲染层职责。
- 统一 IPC API 定义，减少主进程入口文件复杂度。
- 统一词库分析结果，由分析层输出结构化命中信息，前端只负责渲染。
- 引入安全 Markdown 渲染链路：Markdown parser + HTML sanitizer。
- 增加基础测试，至少覆盖词库分析、Prompt 生成、AI provider 配置。
- 逐步补齐 ESLint、Prettier、打包与发布脚本。

## 4. 非目标

本轮重构不优先处理以下事项：

- 不更换 Electron 技术栈。
- 不替换 Sherpa-ONNX ASR 引擎。
- 不引入复杂前端框架，除非后续 UI 复杂度明显增长。
- 不重写全部页面，可按模块渐进重构。
- 不在首阶段实现完整账号系统、云同步或多人协作。

## 5. 命名变更需求

### 5.1 需要修改的位置

- `package.json`
  - `name`: 建议改为 `omelet-expression-trainer`
  - `description`: 改为中文可读描述，如 `omelet-表达训练系统 - 本地桌面表达训练工具`
- 页面标题
  - `src/index.html`
  - `src/settings.html`
  - `src/prompt-editor.html`
  - `src/lexicon-playground.html`
- 主窗口标题
  - `main.js` / 重构后的窗口模块
- README 与 AGENTS 文档
- 报告标题、保存文件名、界面品牌文案
- 默认配置或后续打包配置中的应用名

### 5.2 命名规范

- 产品展示名：`omelet-表达训练系统`
- 包名：`omelet-expression-trainer`
- 报告文件名前缀：`omelet-表达训练`
- 用户数据目录：默认继续使用 Electron 当前 app name；如要迁移旧配置，需提供兼容逻辑。

## 6. 目标目录结构

建议逐步演进为：

```text
omelet-expression-trainer/
├─ main/
│  ├─ index.js              # Electron app 启动入口
│  ├─ windows.js            # 窗口创建与管理
│  ├─ ipc.js                # IPC 注册入口
│  └─ ipc-handlers/
│     ├─ asr-handlers.js
│     ├─ settings-handlers.js
│     ├─ ai-handlers.js
│     ├─ prompt-handlers.js
│     └─ file-handlers.js
├─ services/
│  ├─ asr-service.js
│  ├─ settings-service.js
│  ├─ prompt-service.js
│  ├─ ai-service.js
│  └─ file-service.js
├─ lib/
│  ├─ lexicon.js
│  ├─ prompts.js
│  └─ markdown.js
├─ src/
│  ├─ app/
│  │  ├─ main.js
│  │  ├─ recorder.js
│  │  ├─ transcript.js
│  │  ├─ analysis-panel.js
│  │  ├─ feedback-panel.js
│  │  └─ report-viewer.js
│  ├─ pages/
│  ├─ styles/
│  └─ assets/
├─ data/
├─ models/
├─ tests/
└─ docs/
```

## 7. 技术架构设计

### 7.1 分层职责

```text
Renderer UI
-> preload window.api
-> IPC handlers
-> services
-> lib / external APIs / filesystem
```

各层职责：

- Renderer：只处理页面状态、DOM、用户交互和展示。
- Preload：只暴露白名单 API，不写业务逻辑。
- IPC handlers：只做参数接收、调用 service、返回结果。
- Services：承载业务编排，如设置读写、ASR 生命周期、AI 调用、文件保存。
- Lib：纯逻辑模块，如词库分析、Prompt 生成、Markdown 渲染。

### 7.2 IPC API 规范

建议统一 API 命名：

```js
window.api.asr.init();
window.api.asr.feed(samples);
window.api.asr.stop();
window.api.analysis.analyzeText(text);
window.api.ai.getRealtimeFeedback(text);
window.api.ai.getFinalReport(payload);
window.api.settings.get();
window.api.settings.save(settings);
window.api.files.saveMarkdown(content, filename);
```

所有 IPC 返回值统一格式：

```js
{ ok: true, data }
{ ok: false, error: { code, message, details } }
```

### 7.3 配置抽取、安全存储与模型部署

重构时需要将散落在代码中的运行参数抽取为集中配置，避免硬编码在 `main.js`、`lib/asr.js`、`lib/ai-feedback.js` 或前端页面中。

建议配置分层：

```text
config/
├─ app-config.js          # 应用名、窗口尺寸、默认路径、品牌名
├─ asr-config.js          # ASR 模型目录、采样率、线程数、endpoint 规则
├─ ai-providers.js        # provider endpoint、默认模型、是否需要 key
└─ ui-tokens.js           # 颜色、布局、语义类型，可按需拆到 CSS tokens
```

配置来源优先级：

```text
代码默认值
-> settings.example.json
-> 用户 settings
-> 环境变量 / 启动参数（仅开发和调试使用）
```

敏感信息要求：

- `apiKey` 不允许明文保存在普通 JSON 中。
- 主进程提供 `secure-settings-service`，负责 API Key 加密、解密、迁移和清除。
- 优先使用系统密钥链方案，例如 `keytar`；如无法使用系统密钥链，则使用 Electron `safeStorage` 加密后再写入用户数据目录。
- 渲染进程不直接读取明文 API Key；设置页只允许保存、清空和测试连接。
- 日志、错误信息、报告和调试输出中不得打印完整 API Key，只允许展示尾号，例如 `****abcd`。

模型部署要求：

- 打包产物不包含 `models/sherpa-onnx-*` 大模型目录。
- 安装后的模型放到软件指定目录，不放在应用安装包内部。
- 推荐默认模型目录：
  - Windows: `%LOCALAPPDATA%/omelet-expression-trainer/models/`
  - macOS: `~/Library/Application Support/omelet-expression-trainer/models/`
  - Linux: `~/.local/share/omelet-expression-trainer/models/`
- ASR 服务启动前必须检查模型完整性：`encoder.int8.onnx`、`decoder.int8.onnx`、`tokens.txt`。
- 模型缺失时，页面应显示明确状态、目标目录、下载链接和“重新检测”操作。
- 后续可增加模型管理页：选择模型目录、打开目录、检测完整性、下载指引。
- 打包配置需显式排除模型目录，例如 electron-builder 的 `files` / `extraResources` 规则中禁止包含大模型。

## 8. Markdown 渲染需求

### 8.1 目标

最终报告应支持标准 Markdown 展示，包括：

- 标题
- 段落
- 粗体
- 列表
- 引用
- 表格
- 行内代码与代码块
- 分割线

### 8.2 建议实现

安装依赖：

```bash
npm install markdown-it dompurify
```

推荐渲染流程：

```text
AI 返回 Markdown
-> markdown-it 转 HTML
-> DOMPurify 清洗 HTML
-> reportBody.innerHTML = safeHtml
```

安全要求：

- `markdown-it` 禁用原始 HTML：`html: false`
- 所有 AI 返回内容必须经过 sanitizer。
- 保存文件时保留原始 Markdown，不保存渲染后的 HTML。
- 不允许 Markdown 渲染结果执行脚本、事件属性或外部不可信资源。

## 9. 页面布局与视觉重设需求

本节参考两个本地设计 skill：

- `$design-taste-frontend`：用于判断设计方向、避免模板化和 AI 默认审美，重点是 brief 推断、设计系统选择、改版审计、可访问性、响应式和最终 pre-flight 检查。
- `$high-end-visual-design`：用于高级视觉执行，重点是字体、空间节奏、容器质感、微交互、动效曲线、GPU 性能和高端产品感。

两者的区别：前者是“设计判断和质量门禁”，后者是“高级视觉语言和动效执行”。本项目是 Electron 桌面训练工具，不是营销 landing page，因此采用 `$design-taste-frontend` 的判断框架和反模板规则，选择性吸收 `$high-end-visual-design` 的质感、动效和容器细节，避免照搬巨大 hero、过度留白、强装饰背景和滚动叙事。

### 9.1 Design Read 与设计参数

Design Read：

```text
Reading this as: 桌面表达训练工作台 for 高频中文口语训练用户，
with a calm premium productivity language，
leaning toward native CSS variables + restrained motion + structured workbench UI.
```

建议设计参数：

```text
DESIGN_VARIANCE: 5
MOTION_INTENSITY: 4
VISUAL_DENSITY: 7
```

解释：

- `DESIGN_VARIANCE 5`：允许非完全对称的工作台布局，但不做 Awwwards 式实验构图。
- `MOTION_INTENSITY 4`：保留高级微交互和状态过渡，不使用复杂滚动劫持。
- `VISUAL_DENSITY 7`：这是高频工具，不是展示页，需要信息密度和扫描效率。

### 9.2 设计定位

`omelet-表达训练系统` 应呈现为安静、高效、可长时间使用的训练工作台。首屏直接进入训练任务，不做营销式首页、巨大 hero、视觉噱头或装饰性卡片堆叠。

视觉关键词：

- 专业训练
- 实时反馈
- 冷静聚焦
- 高级但克制
- 低疲劳长时间使用

禁止默认倾向：

- AI 紫蓝渐变和霓虹光效。
- 大面积纯黑或纯白。
- 三个等宽功能卡片式布局。
- 过多 emoji 作为 UI 图标。
- 为“高级感”添加无意义玻璃拟态、光球、噪声和漂浮装饰。

### 9.3 信息架构

主界面采用三栏工作台，但避免机械等分：

```text
左侧 260-320px：训练指标、词库命中、模型/API 状态
中间 minmax(520px, 1fr)：实时字幕 / 逐字稿主工作区
右侧 320-380px：实时反馈、建议、报告入口
顶部 56-72px：品牌、计时、设置、Prompt、模型状态
底部固定操作区：开始、暂停、继续、结束、生成报告
```

布局要求：

- 中间字幕区为视觉中心，使用稳定滚动容器，不因识别文本变化导致布局跳动。
- 左侧指标可快速扫描，数字使用等宽字体，避免用大卡片堆砌。
- 右侧反馈按时间倒序排列，反馈类型通过左侧色条、图标或小标签区分。
- 录音控制区固定在稳定位置，状态切换只改变按钮可见性，不改变整体高度。
- 粘贴逐字稿、复制、保存、清空属于工具命令，放入清晰工具栏或更多菜单。
- 窄窗口下改为中间主区优先，两侧面板可折叠为 tabs 或 drawer。

### 9.4 颜色系统

采用“深色工作台 + 单品牌强调色 + 多语义状态色”。品牌强调色保持统一，不在不同区域随意切换。

```text
surface-base:        #101113
surface-panel:       #17191C
surface-raised:      #202329
text-primary:        #F2F3F5
text-secondary:      #A8ADB5
text-muted:          #6F7682
brand-accent:        #F06A3D
brand-accent-soft:   #FFB020
success:             #4FB477
filler-word:         #E67E22
hedge-word:          #D6A21E
vague-word:          #E25563
ai-feedback:         #5B8DEF
border-subtle:       #2A2D33
focus-ring:          #FFB020
```

颜色要求：

- 整体使用 off-black，不使用纯 `#000000`。
- 品牌强调色全局锁定，不出现多个主 CTA 色。
- 语义色只用于真实含义：填充词、犹豫词、笼统词、亮点、AI 建议、错误。
- 所有文本和按钮达到 WCAG AA 对比度。
- 深浅模式可后续支持，但首版必须先把深色模式的层级、对比和疲劳度做好。

### 9.5 字体与排版

建议使用自托管字体，避免生产环境外链字体。

字体方向：

- 中文 UI：优先系统中文字体栈，例如 `Microsoft YaHei UI`、`PingFang SC`、`Noto Sans CJK SC`。
- 英文和数字：可引入 `Geist` / `Plus Jakarta Sans` / `Satoshi`。
- 数字和计时器：使用等宽字体，例如 `Geist Mono`、`JetBrains Mono` 或系统 mono。

排版要求：

- 工作台内不使用营销页式巨大标题。
- 字幕文本可以大字号，但必须限制行宽和滚动节奏。
- 指标数字使用 tabular nums 或 mono，避免数字变化导致抖动。
- 按钮文案不换行，必要时缩短文案。
- 不用 serif 作为默认字体，除非后续品牌明确需要。

### 9.6 组件与容器质感

吸收 `$high-end-visual-design` 的“高级质感”，但降低装饰强度：

- 主要面板可使用轻量 nested container：外层 1px subtle border，内层实际内容区，形成细腻层级。
- 圆角体系统一：面板 10-12px，输入框 8px，主要按钮 pill，工具按钮 8px。
- 阴影使用极轻的背景同色阴影或内阴影，不使用黑色粗重 drop shadow。
- 卡片只用于独立反馈项、报告块、设置分组，不把整个页面拆成卡片集合。
- 设置页、Prompt 编辑器、报告弹窗共享同一组件语言。

### 9.7 交互与动效

动效目标是反馈状态，不是展示技巧。

允许：

- 按钮 hover / active 使用 `transform` 和 `opacity`。
- 面板切换、弹窗打开、反馈项进入使用 180-320ms 的缓动。
- 录音状态使用克制的呼吸式状态指示，但必须可关闭或遵守 reduced motion。
- 反馈新增时可轻微 fade-up，不做大位移动画。
- 语音输入的时候，增加语音转成波形

禁止：

- `linear` 或默认 `ease-in-out` 作为主要动效。
- 滚动劫持、视差、复杂 sticky-stack。
- 动画 `top`、`left`、`width`、`height`。
- 在滚动内容区域使用大面积 `backdrop-filter`。
- 使用 `window.addEventListener('scroll')` 做连续动画。

所有动效必须支持 `prefers-reduced-motion`。

### 9.8 图标与可访问性

- 优先使用统一图标库，推荐 Phosphor / Tabler / Radix Icons，避免手写 SVG。
- 同一项目只使用一个图标家族。
- 图标按钮必须有 `title` 或 `aria-label`。
- 所有焦点态清晰可见，键盘可操作。
- 错误、加载、空状态必须有明确文案和下一步操作。
- 设置页 API Key 输入支持显示/隐藏、清空、测试连接。

### 9.9 页面级设计清单

实施 UI 重构前必须先做一次改版审计：

- 当前主界面信息层级。
- 当前颜色、字号、间距、圆角和按钮样式。
- 当前可保留的交互模式。
- 当前要移除的装饰元素、乱码文案、过度 emoji、重复卡片。
- 当前响应式和窄窗口问题。

交付前必须检查：

- 首屏就是训练工作台。
- 字幕、统计、反馈三者主次清晰。
- 无文本溢出、重叠、按钮跳动。
- 主 CTA 色全局一致。
- 面板和按钮圆角规则一致。
- 所有按钮文本对比度合格。
- 所有动效有实际反馈意义。
- reduced motion 下界面仍完整可用。
- 1200x800、1440x900、窄窗口均可用。

## 10. 功能增强需求

### 10.1 P0：重构必须完成

- 项目更名为 `omelet-表达训练系统`。
- 主进程职责拆分。
- Renderer 主页面职责拆分。
- Markdown 安全渲染。
- 修复 `stopASR()` 最后一段识别文本未追加的问题。
- 清理重复 provider case。
- 统一词库分析与高亮数据源。
- 抽取集中配置，移除关键路径、provider、模型参数硬编码。
- API Key 加密存储，禁止明文落盘和日志输出。
- 打包配置排除 ASR 大模型，并改为安装后指定目录检测。

### 10.2 P1：强建议完成

- 设置页增加 AI 连接测试。
- 模型文件完整性检测与友好提示。
- 原文和报告导出为 Markdown。
- 训练记录本地历史。
- 自定义词库：填充词、犹豫词、替换词。
- 基础测试与 lint。
- 模型管理入口：打开模型目录、重新检测、查看下载说明。

### 10.3 P2：后续增强

- 报告导出 PDF / HTML。
- 趋势分析：最近 N 次表达密度、填充词频率、犹豫词占比。
- 训练模式：即兴表达、面试回答、汇报、销售、复盘。
- 快捷键控制录音。
- AudioWorklet 替代 ScriptProcessor。
- 打包安装器与自动更新。

## 11. 开发阶段计划

### Phase 0：准备与基线确认

目标：确保当前功能可运行，并建立重构基线。

产出：

- 当前功能流程清单。
- 手动回归用例。
- 重构分支。

验收：

- `npm start` 可启动。
- 录音、停止、报告、设置保存可手动验证。

### Phase 1：项目更名与文档更新

任务：

- 修改 `package.json` 名称与描述。
- 修改所有页面 title 和品牌文案。
- 修改报告标题与文件名前缀。
- 更新 README、AGENTS、需求文档。

验收：

- 应用内不再出现旧产品名。
- 包名、展示名、文档名保持一致。

### Phase 2：主进程与服务层拆分

任务：

- 新建 `main/` 与 `services/`。
- 拆分窗口创建、IPC 注册、设置服务、Prompt 服务、文件服务。
- 新增集中配置模块，统一应用名、路径、provider、ASR 参数。
- 新增安全设置服务，处理 API Key 加密存储和旧明文配置迁移。
- 新增模型路径服务，统一模型目录解析与完整性检测。
- 保持原 IPC 行为兼容，必要时做适配层。

验收：

- `main.js` 或新入口只负责启动与注册。
- 各服务模块可单独阅读和测试。
- API Key 不再以明文形式写入普通 settings JSON。
- 模型目录不依赖仓库内 `models/`，可从指定安装后目录读取。

### Phase 3：渲染端模块化

任务：

- 将 `src/app.js` 拆为 recorder、transcript、analysis-panel、feedback-panel、report-viewer。
- 保留现有 UI 行为。
- 统一页面状态对象，减少散落 DOM 操作。

验收：

- 录音和粘贴两条流程行为不回退。
- 主入口文件不再超过合理复杂度。

### Phase 4：Markdown 渲染与报告阅读器

任务：

- 引入 `markdown-it` 和 `dompurify`。
- 新增 Markdown 渲染模块。
- 改造报告弹窗为安全 Markdown 阅读器。
- 保存时保留原始 Markdown。

验收：

- 标题、列表、引用、表格正常渲染。
- AI 输出中的 HTML 不会执行。

### Phase 5：页面重设

任务：

- 重建颜色 token、布局 token、组件样式。
- 改造三栏工作台。
- 统一按钮、面板、反馈、报告弹窗样式。
- 检查窄窗口和常见桌面尺寸。

验收：

- 页面首屏直接进入训练工具。
- 无文本重叠、按钮跳动、色彩过载。
- 反馈、统计、字幕层级清晰。

### Phase 6：测试与工程化

任务：

- 引入 Vitest。
- 测试 `lexicon.js`、`prompts.js`、provider 配置。
- 加 ESLint / Prettier。
- 增加 `npm test`、`npm run lint`、`npm run format`。
- 增加打包配置，明确排除模型目录。
- 增加模型缺失、API Key 缺失、加密存储迁移的测试或手动用例。

验收：

- 核心纯逻辑有自动化测试。
- CI 或本地命令可一键验证。
- 打包产物不包含大模型文件。

## 12. Todo List

### 项目更名

- [ ] 修改 `package.json` 的 `name`、`description`。
- [ ] 修改 Electron 窗口标题。
- [ ] 修改所有 HTML `<title>`。
- [ ] 修改主界面品牌文案。
- [ ] 修改报告标题和导出文件名前缀。
- [ ] 更新 README。
- [ ] 更新 AGENTS。

### 架构重构

- [ ] 新建 `main/` 目录。
- [ ] 新建 `services/` 目录。
- [ ] 拆分窗口管理模块。
- [ ] 拆分 IPC 注册模块。
- [ ] 拆分 settings service。
- [ ] 拆分 prompt service。
- [ ] 拆分 ASR service。
- [ ] 拆分 AI service。
- [ ] 拆分 file service。
- [ ] 统一 IPC 返回格式。
- [ ] 新建集中配置目录或模块。
- [ ] 抽取应用名、窗口尺寸、默认路径配置。
- [ ] 抽取 ASR 采样率、线程数、模型目录配置。
- [ ] 抽取 AI provider endpoint、默认模型、是否需要 key 配置。
- [ ] 梳理配置优先级：默认值、示例配置、用户配置、开发环境变量。

### 安全配置与密钥

- [ ] 设计安全 settings 存储结构。
- [ ] 选型 `keytar` 或 Electron `safeStorage`。
- [ ] 实现 API Key 加密保存。
- [ ] 实现 API Key 解密读取，仅主进程可用。
- [ ] 实现旧明文 `settings.json` 迁移。
- [ ] 设置页支持清空 API Key。
- [ ] 日志和错误信息隐藏 API Key 明文。
- [ ] 编写 API Key 缺失、错误、迁移失败提示文案。

### 模型部署与打包

- [ ] 定义安装后模型目录。
- [ ] ASR 启动前检查模型完整性。
- [ ] 模型缺失时显示目标目录和下载指引。
- [ ] 增加“重新检测模型”入口。
- [ ] 增加“打开模型目录”入口。
- [ ] 打包配置排除 `models/sherpa-onnx-*`。
- [ ] `.gitignore` 保持排除下载模型。
- [ ] README 补充模型安装目录说明。
- [ ] 手动验证安装包不包含 ONNX 模型文件。

### 渲染端重构

- [ ] 拆分录音模块。
- [ ] 拆分字幕模块。
- [ ] 拆分统计面板模块。
- [ ] 拆分反馈面板模块。
- [ ] 拆分报告阅读器模块。
- [ ] 梳理粘贴逐字稿流程。
- [ ] 移除前端重复词表。

### Markdown

- [ ] 安装 `markdown-it`。
- [ ] 安装 `dompurify`。
- [ ] 新建 Markdown 渲染模块。
- [ ] 改造报告弹窗。
- [ ] 保留 Markdown 原文保存。
- [ ] 增加安全测试用例。

### UI 设计

- [ ] 定义颜色 tokens。
- [ ] 定义间距、字号、边框、圆角 tokens。
- [ ] 重构三栏布局。
- [ ] 重构录音控制区。
- [ ] 重构反馈列表。
- [ ] 重构报告弹窗。
- [ ] 重构设置页。
- [ ] 检查 1200x800、1440x900、窄窗口显示。

### Bug 修复

- [ ] `stopASR()` 返回的 `finalText` 追加到 `fullText`。
- [ ] 清理重复 `deepseek` provider case。
- [ ] API Key 缺失时给出清晰错误。
- [ ] 模型缺失时给出下载路径提示。
- [ ] 麦克风权限失败时给出可操作提示。

### 测试与工程化

- [ ] 添加 `vitest`。
- [ ] 添加 `npm test`。
- [ ] 添加 ESLint。
- [ ] 添加 Prettier。
- [ ] 编写词库分析测试。
- [ ] 编写 Prompt 生成测试。
- [ ] 编写 AI provider 配置测试。
- [ ] 增加手动回归清单。

## 13. 验收标准

### 功能验收

- 实时录音可以启动、暂停、继续、结束。
- 结束时最后一段识别结果不丢失。
- 粘贴逐字稿可以完成分析并生成报告。
- 词库统计数量合理，字幕高亮与统计来源一致。
- 实时反馈和最终报告可以基于当前设置调用 AI 后端。
- 报告 Markdown 渲染正确，复制和保存正常。

### UI 验收

- 首屏为训练工作台，不出现营销页。
- 三栏信息层级清晰，字幕为视觉中心。
- 颜色系统不单调、不刺眼、不依赖单一霓虹色。
- 窄窗口下文本不溢出、不重叠。
- 状态切换时按钮区域不明显跳动。

### 技术验收

- 主进程入口职责清晰。
- IPC API 有统一返回结构。
- 核心纯逻辑有测试。
- Markdown 渲染经过安全清洗。
- 配置从集中模块读取，关键参数不散落硬编码。
- API Key 加密存储，普通 settings 文件不含明文密钥。
- 打包产物不包含 ASR 大模型，模型从安装后指定目录加载。
- 模型缺失时有明确检测结果和操作指引。
- `npm start`、`npm test`、`npm run lint` 可作为标准开发入口。

## 14. 风险与应对

- ASR 音频链路对性能敏感：先保持现有 ScriptProcessor 行为，再单独评估 AudioWorklet。
- Electron 安全风险：继续禁用 `nodeIntegration`，所有能力通过 preload 白名单暴露。
- Markdown XSS 风险：禁用原始 HTML，并使用 sanitizer。
- 用户配置迁移风险：更名后如果影响 userData 路径，需要做旧配置迁移或兼容读取。
- API Key 加密兼容风险：系统密钥链在部分 Linux 环境可能不可用，需要提供 `safeStorage` 降级方案和清晰错误提示。
- 模型外置风险：用户首次安装后可能缺模型，需要在启动页或主界面显式显示模型状态与下载步骤。
- 打包误包含模型风险：在打包验收中检查产物体积和文件列表，明确排除 `models/sherpa-onnx-*`。
- 重构范围过大：按阶段提交，每阶段保持应用可运行。

## 15. 建议提交顺序

1. 新增文档与重构计划。
2. 项目更名与文案替换。
3. 修复已知小 bug。
4. 拆分主进程服务层。
5. 拆分渲染端模块。
6. 接入 Markdown 渲染。
7. UI 视觉重设。
8. 测试和工程化。
9. P1/P2 功能增强。
