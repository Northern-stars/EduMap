# SlideMind — 概念关联思维导图

一款基于 AI 的概念关联思维导图工具，让用户通过上传资料、选择概念、拖拽关联来**主动构建自己的知识网络**。

> 设计理念：改变单一向大语言模型问问题的模式，转变为自己组织笔记格式、自己寻找关联的框架。

---

## ✨ 核心功能

- 📤 **智能上传** — 支持 PPTX、PDF、图片格式
- 🤖 **AI 摘要** — 自动提取关键概念
- 🧠 **概念卡片** — 可视化管理知识节点
- 🔗 **概念连线** — 按住 Shift 连接相关概念
- 💬 **AI 对话** — 感知选中概念，智能辅助

---

## 🎯 使用流程

```
Step 1: 上传 Slide（PPTX/PDF/图片）
   ↓
Step 2: 阅读 AI 生成的摘要
   ↓
Step 3: 手动点击概念添加（或一键添加全部）
   ↓
Step 4: 画布上拖拽连接，构建思维导图
```

---

## 🚀 快速开始

### 1. 安装依赖

```bash
# 前端
cd client
npm install

# 后端
cd ../server
npm install
```

### 2. 配置 API Key

```bash
# 编辑 server/.env
MINIMAX_API_KEY=你的MiniMax_API_Key
```

获取 API Key：https://www.minimax.chat/

### 3. 启动服务

```bash
# 终端 1: 后端
cd server && npm run dev

# 终端 2: 前端
cd client && npm run dev
```

### 4. 访问

打开浏览器：**http://localhost:3000**

---

## ⌨️ 快捷操作

| 操作 | 快捷键 |
|------|--------|
| 连接概念 | Shift + 点击两个卡片 |
| 平移画布 | Space + 鼠标拖动 |
| 多选卡片 | Cmd/Ctrl + 点击 |
| 删除选中 | Delete |

---

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 14 + React 18 + TypeScript |
| 样式 | Tailwind CSS（Lovart AI 风格） |
| 状态管理 | Zustand |
| 后端 | Express.js |
| AI | MiniMax API (MiniMax-M2) |
| 文件解析 | JSZip (PPTX), pdf-parse (PDF) |

---

## 📁 项目结构

```
slideMind/
├── client/                    # Next.js 前端
│   ├── app/                  # 页面组件
│   ├── components/          # UI 组件
│   │   ├── Canvas/          # 画布相关
│   │   ├── Chat/            # 对话面板
│   │   └── Slides/           # 上传相关
│   └── lib/                 # 状态管理
│
├── server/                    # Express 后端
│   ├── routes/               # API 路由
│   │   ├── slides.js        # 文件上传解析
│   │   ├── concepts.js      # 概念卡片 CRUD
│   │   └── chat.js          # AI 对话
│   └── services/
│       ├── minimax.js        # MiniMax API
│       └── slide-parser.js   # PPTX/PDF 解析
│
├── SPEC.md                    # 详细设计规范
└── README.md                  # 本文档
```

---

## 🔧 常见问题

### Q: 上传后没有生成摘要？

1. 检查服务器是否运行：
   ```bash
   curl http://localhost:3001/api/health
   ```
2. 检查 `.env` 中 API Key 是否配置
3. 查看服务器日志

### Q: AI 返回 demo 内容？

确保 `.env` 中 API Key 正确且服务器已重启

### Q: 画布无法拖动？

尝试刷新页面，或检查是否按住了 Space 键

---

## 📦 部署说明

### 前端构建
```bash
cd client
npm run build  # 输出在 .next/
```

### 后端部署
- 需要 Node.js 18+
- 使用 PM2 管理进程
- 生产环境建议配置 HTTPS

### 生产环境建议
- 使用 PostgreSQL/MySQL 替代内存存储
- 考虑添加用户认证
- 考虑引入向量数据库实现 RAG

---

## 🔐 安全注意

- `.env` 文件不要提交到 Git
- API Key 只在服务器端使用
- 考虑添加文件上传大小限制

---

## 📄 许可证

MIT License

---

*最后更新：2026-03-28*
