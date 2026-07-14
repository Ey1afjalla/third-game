# ⚔️ 迷你地下城指挥官

**Mini Dungeon Commander** - 战术自动战斗 Roguelike 游戏

## 📖 项目简介

玩家指挥一支三人冒险小队，在不断变化的地下城路线中自动战斗、收集遗物、强化技能，并通过战斗复盘理解每一场胜负背后的系统逻辑。

## 🎮 核心特色

- ⚔️ **完整的自动战斗循环**：从小队配置到战斗执行，形成完整单局体验
- 🧠 **可解释的战斗系统**：状态机、行为树、技能冷却，所有逻辑可追踪
- 🎲 **Roguelike 构筑深度**：装备、遗物、技能强化影响每一局策略
- 🏰 **统一的地下城主题**：UI 和视觉围绕"地下城战术指挥"主题设计
- 💾 **本地单机游戏**：无需联网，完全本地运行

## 🚀 快速开始

### 开发环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 运行开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000` 查看游戏。

### 构建生产版本

```bash
npm run build
```

## 📚 文档

- [需求文档](./RequirementsDoc.md)
- [开发规范](./CLAUDE.md)
- [架构设计](./docs/Architecture.md)
- [开发日志](./docs/DevelopmentLog.md)
- [版本记录](./docs/ChangeLog.md)
- [任务看板](./docs/TaskBoard.md)

更多文档正在完善中...

## 🛠️ 技术栈

- **前端框架**：React 18
- **开发语言**：TypeScript
- **构建工具**：Vite
- **桌面封装**：Tauri（计划中）

## 📋 开发阶段

- [x] 阶段 0：项目初始化
- [ ] 阶段 1：可玩 MVP（单场战斗）
- [ ] 阶段 2：战斗系统完整化
- [ ] 阶段 3：Roguelike 构筑
- [ ] 阶段 4：展示模式和调参面板
- [ ] 阶段 5：美术、文档和最终交付

## 🎯 当前状态

**版本**：v0.2.0  
**状态**：阶段2完成 - 战斗系统完整化  
**最后更新**：2026-07-15

## 📋 版本历史

- **v0.2.0** (2026-07-15) - 战斗系统完整化
  - 状态机系统
  - 行为树AI
  - Buff/Debuff框架
  - 数值平衡优化
  - UI布局优化
- **v0.1.0** (2026-07-15) - 可玩MVP
  - 基础战斗系统
  - 3个玩家角色
  - 3种敌人
  - 自动战斗功能

## 📝 版本记录

详见 [ChangeLog.md](./docs/ChangeLog.md)

## 📄 许可

本项目为个人学习作品。

## 🔗 仓库

[https://github.com/Ey1afjalla/third-game.git](https://github.com/Ey1afjalla/third-game.git)
