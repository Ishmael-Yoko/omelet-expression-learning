# omelet-表达训练系统

本地桌面表达训练工具。应用通过麦克风录音或粘贴逐字稿获取口语内容，结合本地 Sherpa-ONNX 语音识别、词库规则分析和可配置 AI 后端，提供实时字幕、表达统计、即时反馈和 Markdown 报告。

## 功能

- 实时语音识别：基于 `sherpa-onnx-node` 和本地 Paraformer 模型。
- 表达分析：识别填充词、犹豫词、笼统词和情绪词。
- 实时反馈：支持 DeepSeek、OpenAI、Ollama 和自定义 OpenAI 兼容接口。
- 逐字稿分析：可直接粘贴文本并生成反馈。
- 报告导出：生成 Markdown 报告并保存到本地。

## 安装

```bash
npm install
```

## 模型文件

开发环境当前仍支持从仓库内 `models/` 读取模型。后续打包版本会把模型目录外置到用户数据目录，避免把大模型打入安装包。

当前需要的模型目录结构：

```text
models/
└─ sherpa-onnx-streaming-paraformer-bilingual-zh-en/
   ├─ encoder.int8.onnx
   ├─ decoder.int8.onnx
   └─ tokens.txt
```

模型可从 Sherpa-ONNX 官方发布页或 Hugging Face 下载：

```bash
cd models
wget https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-streaming-paraformer-bilingual-zh-en.tar.bz2
tar xvf sherpa-onnx-streaming-paraformer-bilingual-zh-en.tar.bz2
```

## 运行

```bash
npm start
```

开发模式：

```bash
npm run dev
```

## 配置

启动后打开设置页配置 AI 后端。示例配置见 `settings.example.json`。

注意：重构分支已开始引入 API Key 加密存储，后续会继续完善设置页的清空、连接测试和迁移提示。

## 项目结构

```text
main/       Electron 主进程入口、窗口管理、IPC 注册
services/   设置、Prompt、本地文件等服务
config/     应用、ASR、AI provider、默认设置配置
lib/        ASR、词库分析、AI 反馈、Prompt 模板
src/        渲染进程页面、脚本和样式
data/       词库数据
docs/       重构需求与开发计划
models/     开发环境模型占位目录
```

## 重构计划

完整计划见 `docs/omelet-refactor-requirements-plan.md`。
