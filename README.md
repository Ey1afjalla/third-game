# 迷你地下城指挥官

**Mini Dungeon Commander v1.0.0** 是一款本地单机战术自动战斗 Roguelike 游戏。

玩家指挥三人冒险小队，在随机地下城路线中选择战斗、事件、商店和休息节点，通过装备、遗物、金币和随机事件构筑队伍，最终挑战 Boss。

## 核心特色

- 完整单局流程：开始冒险、路线选择、自动战斗、奖励、事件、商店、Boss 节点。
- 可解释战斗：状态机、敌人行为树、技能冷却、伤害公式和战斗日志可在展示模式查看。
- Roguelike 构筑：装备、遗物、金币、生命上限和随机事件会影响每一局选择。
- 最终版美术：主菜单、地下城、战斗、奖励、事件、商店、展示模式和调参面板统一为地下城战术桌面风格。
- 本地运行：无需后端、无需联网，存档使用浏览器 localStorage。

## 快速开始

```bash
npm install
npm run dev
```

打开本地地址：

```text
http://localhost:3000
```

如果 Vite 自动换端口，请以终端显示的地址为准。

## 构建发布包

```bash
npm run build
```

构建产物位于 `dist/`。v1.0.0 的 GitHub Release 附件使用 Web 静态包：

```text
release/mini-dungeon-commander-v1.0.0-web.zip
```

解压后可用任意静态服务器打开，例如：

```bash
npx serve dist
```

## 开发阶段

- [x] 阶段 0：项目初始化
- [x] 阶段 1：可玩 MVP
- [x] 阶段 2：战斗系统完整化
- [x] 阶段 3：Roguelike 构筑
- [x] 阶段 4：展示模式和调参面板
- [x] 阶段 5：美术、文档和最终交付

## 文档

- [需求文档](./RequirementsDoc.md)
- [架构设计](./docs/Architecture.md)
- [战斗系统设计](./docs/CombatSystemDesign.md)
- [AI 行为设计](./docs/AIBehaviorDesign.md)
- [数值设计](./docs/BalanceDesign.md)
- [开发日志](./docs/DevelopmentLog.md)
- [版本记录](./docs/ChangeLog.md)
- [QA 报告](./docs/QAReport.md)
- [发布清单](./docs/ReleaseChecklist.md)

## 技术栈

- React 18
- TypeScript
- Vite
- localStorage 本地存档

## 当前发布说明

当前版本为 **v1.0.0 最终 Web 版**。项目尚未包含 `src-tauri` 桌面封装配置，因此本次 Release 提供静态网页包，而不是桌面安装包。

作者：赵秋阳
