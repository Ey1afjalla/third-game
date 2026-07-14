# 架构设计文档

## 1. 技术栈

- **前端框架**：React 18
- **开发语言**：TypeScript
- **构建工具**：Vite
- **状态管理**：React Hooks + Context API
- **存档方式**：localStorage
- **桌面封装**：Tauri（最终阶段）

## 2. 项目结构

```text
mini-dungeon-commander/
  docs/                    # 文档目录
    ui/                   # UI 原型
    *.md                  # 各类设计文档
  src/
    assets/               # 图片、图标等静态资源
    components/           # React 组件
      common/            # 通用组件（按钮、面板等）
      combat/            # 战斗相关组件
      dungeon/           # 地下城路线组件
    data/                 # 数据配置
      characters.ts      # 角色配置
      enemies.ts         # 敌人配置
      skills.ts          # 技能配置
      items.ts           # 装备和遗物配置
      events.ts          # 随机事件配置
    engine/               # 核心战斗引擎
      CombatEngine.ts    # 战斗主引擎
      DamageCalculator.ts # 伤害计算
      TargetSelector.ts  # 目标选择
      CombatLogger.ts    # 战斗日志
    systems/              # 游戏系统
      StateMachine.ts    # 状态机系统
      BehaviorTree.ts    # 行为树系统
      BuffSystem.ts      # Buff/Debuff 系统
      SkillSystem.ts     # 技能系统
      RewardSystem.ts    # 奖励系统
    views/                # 页面视图
      MainMenu.tsx       # 主菜单
      TeamSetup.tsx      # 小队配置
      DungeonMap.tsx     # 地下城路线
      CombatView.tsx     # 战斗界面
      ReplayView.tsx     # 战斗复盘
      DevPanel.tsx       # 调参面板
    App.tsx               # 应用主组件
    main.tsx              # 应用入口
  package.json
  tsconfig.json
  vite.config.ts
  README.md
```

## 3. 核心模块说明

### 3.1 战斗引擎 (CombatEngine)

负责战斗流程的核心控制：
- 初始化战斗
- 回合推进
- 行动顺序管理
- 胜负判定
- 战斗结果统计

### 3.2 状态机 (StateMachine)

管理角色和敌人的状态：
- Idle：等待行动
- ChoosingTarget：选择目标
- Casting：释放技能
- Recovering：行动恢复
- Stunned：眩晕
- Dead：死亡

### 3.3 行为树 (BehaviorTree)

控制敌人的 AI 决策：
- 条件节点：生命值、Buff 状态、目标状态
- 行为节点：选择技能、选择目标
- 决策逻辑：优先级判断

### 3.4 技能系统 (SkillSystem)

管理技能的释放和效果：
- 技能冷却管理
- 目标选择规则
- 伤害计算
- Buff/Debuff 应用

### 3.5 Buff 系统 (BuffSystem)

管理角色身上的增益和减益效果：
- Buff/Debuff 添加
- 持续时间管理
- 触发时机处理
- 效果叠加规则

### 3.6 伤害计算 (DamageCalculator)

计算实际伤害值：
- 基础伤害
- 攻击力加成
- 防御力减免
- 暴击计算
- Buff/Debuff 修正

### 3.7 目标选择 (TargetSelector)

根据规则选择行动目标：
- 最低生命值
- 最高仇恨值
- 随机目标
- 后排优先
- 前排优先

### 3.8 战斗日志 (CombatLogger)

记录战斗过程：
- 行动记录
- 伤害记录
- Buff 变化
- 关键事件
- 决策原因

## 4. 数据流

```text
用户操作 -> 视图组件 -> 游戏系统 -> 战斗引擎 -> 数据更新 -> 视图刷新
```

### 4.1 战斗流程数据流

```text
1. 初始化战斗 -> 加载角色/敌人配置
2. 计算行动顺序 -> 基于速度属性
3. 执行行动 -> 状态机控制
4. 目标选择 -> 行为树决策
5. 技能释放 -> 技能系统处理
6. 伤害计算 -> 伤害计算器
7. Buff 更新 -> Buff 系统
8. 状态更新 -> 组件重渲染
9. 日志记录 -> 战斗日志
10. 胜负判定 -> 战斗结束
```

## 5. 关键设计原则

### 5.1 配置与逻辑分离

所有数值配置集中在 `src/data/` 目录，便于调整和平衡。

### 5.2 系统模块化

每个系统独立封装，通过明确的接口交互。

### 5.3 可调试性

- 完整的战斗日志
- 展示模式显示内部状态
- 调参面板实时修改配置

### 5.4 可扩展性

- 技能和 Buff 使用配置化设计
- 行为树使用节点组合
- 装备效果使用效果描述符

## 6. 性能考虑

### 6.1 本地存储

使用 localStorage 存储：
- 游戏进度
- 角色装备
- 解锁内容
- 设置选项

### 6.2 渲染优化

- 使用 React.memo 避免不必要的重渲染
- 战斗动画使用 CSS transitions
- 日志使用虚拟滚动（如果日志过长）

### 6.3 战斗计算

- 回合制战斗，计算量可控
- 关键计算结果缓存
- 避免深层对象拷贝

## 7. 后续扩展预留

### 7.1 多语言支持

文本内容使用配置化，预留国际化接口。

### 7.2 更多角色和敌人

数据结构支持任意数量的角色和敌人。

### 7.3 成就系统

预留事件监听接口，可追踪游戏行为。

### 7.4 自定义构筑

预留角色编辑器入口。

## 8. 开发阶段架构演进

### 阶段 1：MVP

- 简化版战斗引擎
- 固定 3 角色 vs 3 敌人
- 基础 UI
- 简单日志

### 阶段 2：系统完善

- 完整状态机
- 完整行为树
- Buff 系统
- 技能冷却

### 阶段 3：Roguelike

- 地下城路线
- 奖励系统
- 装备系统
- 事件系统

### 阶段 4：展示与调试

- 展示模式
- 调参面板
- 完整复盘

### 阶段 5：最终交付

- Tauri 封装
- 资源优化
- 打包分发

## 9. 技术约束

- 不依赖后端服务
- 不依赖联网
- 纯本地运行
- 支持常见桌面分辨率（1280x800 及以上）
- 浏览器兼容：Chrome、Firefox、Edge 最新版
