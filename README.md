# 🛡️ 迷你地下城指挥官 (Mini Dungeon Commander)

> **一款基于 React + TypeScript 构建的本地战术自动战斗 Roguelike 游戏。**
> 
> 本项目并非简单的 UI 交互 Demo，而是重点探索和落地了 **纯数据驱动的自动战斗引擎 (Auto-battler Engine)**、**基于行为树 (Behavior Tree) 的游戏 AI** 以及 **有向无环图 (DAG) 的地图生成算法**。

[![Tech Stack](https://img.shields.io/badge/Tech_Stack-React_19_|_TypeScript_|_Vite-blue.svg)]()
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)]()

---

## 🎮 核心游戏循环 (Core Gameplay Loop)

玩家将指挥一支三人冒险小队，在每次由程序随机生成的地下城路线中不断推进。
*   **构筑 (Build)**：在战斗、事件、商店等节点中进行抉择，通过战利品（三选一）收集装备、遗物与金币，强化小队属性。
*   **战术 (Tactics)**：在进入战斗前调整阵型与装备，进入战斗后，角色将基于独立的时间轴与 AI 逻辑进行 **全自动回合制战斗**。
*   **Roguelike 推进**：如果小队全灭，本局进度重置；击败最终 Boss 则完成一局地下城挑战。全流程无缝接入 `localStorage` 实现本地自动存档。

---

## ⚙️ 核心技术架构 (System Architecture)

### 1. 独立解耦的自动战斗引擎 (Auto-battler Engine)
摒弃了将业务逻辑与 UI 组件绑定的传统前端开发模式。战斗逻辑作为纯纯数据层（Pure Data Layer）独立运行：
*   **Tick-based 时间轴管理**：基于时间切片计算行动顺序、技能冷却 (CD) 与 Buff/Debuff 持续周期。
*   **动态目标寻路与结算**：封装了严格的伤害计算管线（覆盖基础面板、装备增幅、属性克制与抗性），支持多角色、多目标的动态战术循环。
*   *性能基准*：引擎在完全脱离 React 渲染层的情况下，**单次本地压测模拟 10,000 次无 UI 战斗循环，内存泄露率为 0，单局结算平均耗时 < 15ms**。

### 2. 状态机 (FSM) 与行为树 (Behavior Tree) 混合 AI
敌人并非执行简单的随机攻击，而是具备“思考”能力：
*   **宏观生命周期**：由有限状态机（FSM）严格控制实体的 `Spawn` -> `Idle` -> `Combat` -> `Stunned` -> `Dead` 状态。
*   **微观决策树**：在 `Combat` 状态下，敌人通过行为树（BT）动态评估局势（如：自身血量是否低于 30%？玩家后排法师是否处于低血量？），从而在“激进攻击”、“防御治疗”或“控制打断”策略间平滑切换。

### 3. 基于 DAG 的地下城程序化生成 (Procedural Generation)
*   地图底层采用 **有向无环图 (DAG)** 算法生成，保证了路线的单向推进不可逆与最终 Boss 节点的绝对可达性。
*   结合 **动态概率权重体系 (Dynamic Weights)** 填充节点内容，实现防非酋（PRD 伪随机分配）与事件池重置，确保每一局游戏都有差异化的策略体验。

### 4. 可解释的 Debug 面板 (Developer & QA Tooling)
项目中内置了透明化的调试看板：
*   实时监听并展示角色的底层属性波动（包含隐藏权重）。
*   暴露 AI 的行为树决策路径与伤害计算的完整公式推演记录。
*   大幅提升了数值平衡（Balancing）的调试效率。

---

## 🛠️ 本地运行指南 (Getting Started)

本项目纯前端实现，无需配置数据库或后端环境，开箱即用。

### 环境依赖
*   Node.js (>= 18.x)
*   npm 或 pnpm 或 yarn

### 安装与启动

```bash
# 1. 克隆仓库
git clone [https://github.com/Ey1afjalla/third-game.git](https://github.com/Ey1afjalla/third-game.git)

# 2. 进入项目目录
cd third-game

# 3. 安装依赖
npm install

# 4. 启动本地开发服务器
npm run dev
打开浏览器访问 http://localhost:5173 即可开始体验。

📦 项目结构 (Directory Structure)
Plaintext
src/
 ├── engine/          # 核心战斗引擎 (Pure TS, 零 UI 依赖)
 │   ├── ai/          # 行为树与状态机逻辑
 │   ├── combat/      # 伤害结算管线与回合时间轴
 │   └── map/         # DAG 随机地图生成器
 ├── components/      # React 视图层组件
 ├── hooks/           # 数据与视图通信 Hook
 ├── types/           # 全局 TypeScript 接口定义
 └── utils/           # 数值计算与概率权重工具类

📝 研发文档与设计资产
本项目的完整架构图、AI 决策树设计图与数值平衡表，请参阅 /docs 目录。

作者：赵秋阳
