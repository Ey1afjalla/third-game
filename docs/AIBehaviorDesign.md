# AI 行为设计文档

## 1. 系统概述

本文档描述游戏中角色状态机和敌人行为树的设计。

### 1.1 两套系统的职责

- **角色状态机**：控制角色的行动状态和状态转换
- **敌人行为树**：控制敌人的决策逻辑和技能选择

## 2. 角色状态机

### 2.1 状态定义

```typescript
enum UnitState {
  IDLE = 'idle',                    // 待机：等待轮到自己行动
  CHOOSING_TARGET = 'choosing_target', // 选择目标中：正在选择攻击目标
  CASTING = 'casting',              // 施法中：正在释放技能
  RECOVERING = 'recovering',        // 恢复中：行动后的短暂恢复
  STUNNED = 'stunned',             // 眩晕：无法行动
  DEAD = 'dead',                   // 死亡：退出战斗
}
```

### 2.2 状态转换图

```text
          轮到行动
IDLE ----------------> CHOOSING_TARGET
 ↑                            |
 |                    选定目标和技能
 |                            ↓
 |                        CASTING
 |                            |
 |                      技能释放完成
 |                            ↓
 └------------ RECOVERING <----
        恢复完成

           眩晕效果
任何状态 -----------> STUNNED
           ↓
        眩晕结束
           ↓
         IDLE

         生命归零
任何状态 -----------> DEAD
```

### 2.3 状态机实现

```typescript
class UnitStateMachine {
  private currentState: UnitState = UnitState.IDLE
  private unit: Unit
  
  constructor(unit: Unit) {
    this.unit = unit
  }
  
  // 状态转换
  transition(newState: UnitState): void {
    const isValid = this.canTransition(this.currentState, newState)
    
    if (!isValid) {
      console.warn(`Invalid transition: ${this.currentState} -> ${newState}`)
      return
    }
    
    this.onStateExit(this.currentState)
    this.currentState = newState
    this.onStateEnter(newState)
  }
  
  // 检查转换是否合法
  private canTransition(from: UnitState, to: UnitState): boolean {
    // 死亡状态无法转换
    if (from === UnitState.DEAD) return false
    
    // 任何状态都可以转换为死亡或眩晕
    if (to === UnitState.DEAD || to === UnitState.STUNNED) return true
    
    // 其他转换规则
    const validTransitions: Record<UnitState, UnitState[]> = {
      [UnitState.IDLE]: [UnitState.CHOOSING_TARGET],
      [UnitState.CHOOSING_TARGET]: [UnitState.CASTING, UnitState.IDLE],
      [UnitState.CASTING]: [UnitState.RECOVERING],
      [UnitState.RECOVERING]: [UnitState.IDLE],
      [UnitState.STUNNED]: [UnitState.IDLE],
      [UnitState.DEAD]: [],
    }
    
    return validTransitions[from]?.includes(to) ?? false
  }
  
  // 进入状态时的处理
  private onStateEnter(state: UnitState): void {
    switch (state) {
      case UnitState.CHOOSING_TARGET:
        // 开始选择目标的逻辑
        break
      case UnitState.CASTING:
        // 播放施法动画
        break
      case UnitState.STUNNED:
        // 显示眩晕特效
        break
      case UnitState.DEAD:
        // 播放死亡动画，从战场移除
        break
    }
  }
  
  // 退出状态时的处理
  private onStateExit(state: UnitState): void {
    // 清理该状态的资源
  }
  
  getCurrentState(): UnitState {
    return this.currentState
  }
}
```

## 3. 敌人行为树

### 3.1 行为树节点类型

```typescript
// 节点基类
abstract class BehaviorNode {
  abstract execute(context: AIContext): NodeResult
}

enum NodeResult {
  SUCCESS = 'success',   // 成功
  FAILURE = 'failure',   // 失败
  RUNNING = 'running',   // 运行中
}

// 组合节点
class Sequence extends BehaviorNode {
  // 顺序执行子节点，全部成功才成功
}

class Selector extends BehaviorNode {
  // 顺序执行子节点，任一成功即成功
}

// 条件节点
class Condition extends BehaviorNode {
  // 检查条件是否满足
}

// 行动节点
class Action extends BehaviorNode {
  // 执行具体行动
}
```

### 3.2 敌人 AI 上下文

```typescript
interface AIContext {
  self: Unit           // 当前敌人
  allies: Unit[]       // 友方单位
  enemies: Unit[]      // 敌方单位（玩家）
  turnNumber: number   // 当前回合数
  combatState: any     // 战斗状态
}
```

### 3.3 基础敌人行为树

#### 骸骨士兵（前排近战）

```text
Root (Selector)
├── 序列：自保行为
│   ├── 条件：生命值 < 30%
│   └── 行动：防御姿态（+50% 防御，1 回合）
├── 序列：优先击杀
│   ├── 条件：存在生命 < 25% 的敌人
│   └── 行动：重击低血量目标
└── 行动：普通攻击（攻击最高仇恨目标）
```

```typescript
const skeletonSoldierBehavior = new Selector([
  // 自保行为
  new Sequence([
    new Condition((ctx) => ctx.self.hp / ctx.self.maxHp < 0.3),
    new Action((ctx) => useDefensiveStance(ctx.self))
  ]),
  
  // 优先击杀
  new Sequence([
    new Condition((ctx) => ctx.enemies.some(e => e.hp / e.maxHp < 0.25)),
    new Action((ctx) => {
      const target = ctx.enemies
        .filter(e => e.hp / e.maxHp < 0.25)
        .reduce((a, b) => a.hp < b.hp ? a : b)
      return useSkill(ctx.self, 'heavy_strike', target)
    })
  ]),
  
  // 默认攻击
  new Action((ctx) => {
    const target = ctx.enemies.reduce((a, b) => a.threat > b.threat ? a : b)
    return useBasicAttack(ctx.self, target)
  })
])
```

#### 骸骨弓手（后排远程）

```text
Root (Selector)
├── 序列：后排优先
│   ├── 条件：敌方后排存活
│   └── 行动：狙击后排目标
├── 序列：穿刺攻击
│   ├── 条件：目标有护盾 > 30
│   └── 行动：使用穿刺箭
└── 行动：普通射击（攻击最低生命目标）
```

#### 骸骨法师（后排法术）

```text
Root (Selector)
├── 序列：群体攻击
│   ├── 条件：3 个及以上敌人存活
│   ├── 条件：冰霜风暴冷却完成
│   └── 行动：释放冰霜风暴（AOE）
├── 序列：火力集中
│   ├── 条件：某个敌人生命 < 40%
│   ├── 条件：火球术冷却完成
│   └── 行动：火球术击杀目标
└── 行动：魔法飞弹（无冷却）
```

### 3.4 Boss 行为树

#### 骸骨队长（Boss）

```text
Root (Selector)
├── 序列：阶段 3（生命 < 30%）
│   ├── 条件：生命 < 30%
│   ├── 条件：未使用过狂暴
│   └── 行动：进入狂暴状态（+100% 攻击，+50% 速度）
├── 序列：阶段 2（生命 < 60%）
│   ├── 条件：生命 < 60%
│   ├── 条件：召唤技能冷却完成
│   └── 行动：召唤 2 个骸骨士兵
├── 序列：清除增益
│   ├── 条件：敌方有护盾或重要 Buff
│   ├── 条件：驱散技能冷却完成
│   └── 行动：驱散术
├── 序列：破甲打击
│   ├── 条件：目标防御 > 15
│   ├── 条件：破甲斩冷却完成
│   └── 行动：破甲斩（降低防御 50%）
└── 行动：重击（攻击前排）
```

```typescript
const bossSkeletonCaptainBehavior = new Selector([
  // 阶段 3：狂暴
  new Sequence([
    new Condition((ctx) => ctx.self.hp / ctx.self.maxHp < 0.3),
    new Condition((ctx) => !ctx.self.hasUsedBerserk),
    new Action((ctx) => {
      ctx.self.hasUsedBerserk = true
      return useBerserk(ctx.self)
    })
  ]),
  
  // 阶段 2：召唤
  new Sequence([
    new Condition((ctx) => ctx.self.hp / ctx.self.maxHp < 0.6),
    new Condition((ctx) => isSkillReady(ctx.self, 'summon')),
    new Action((ctx) => summonMinions(ctx.self, 2))
  ]),
  
  // 清除增益
  new Sequence([
    new Condition((ctx) => ctx.enemies.some(e => e.shield > 30 || hasImportantBuff(e))),
    new Condition((ctx) => isSkillReady(ctx.self, 'dispel')),
    new Action((ctx) => {
      const target = ctx.enemies.find(e => e.shield > 30 || hasImportantBuff(e))
      return useSkill(ctx.self, 'dispel', target!)
    })
  ]),
  
  // 破甲打击
  new Sequence([
    new Condition((ctx) => ctx.enemies.some(e => e.defense > 15)),
    new Condition((ctx) => isSkillReady(ctx.self, 'armor_break')),
    new Action((ctx) => {
      const target = ctx.enemies
        .filter(e => e.defense > 15)
        .reduce((a, b) => a.defense > b.defense ? a : b)
      return useSkill(ctx.self, 'armor_break', target)
    })
  ]),
  
  // 默认重击
  new Action((ctx) => {
    const frontRow = ctx.enemies.filter(e => e.position === 'front')
    const target = frontRow.length > 0 ? frontRow[0] : ctx.enemies[0]
    return useSkill(ctx.self, 'heavy_strike', target)
  })
])
```

## 4. 决策日志记录

为了让玩家理解 AI 决策，每个行为节点的执行需要记录原因。

### 4.1 日志格式

```typescript
interface AIDecisionLog {
  turn: number
  unit: string
  decision: string
  reason: string
  target?: string
}

// 示例
{
  turn: 3,
  unit: '骸骨队长',
  decision: '破甲斩',
  reason: '目标守卫拥有高防御（20），且破甲斩冷却完成',
  target: '守卫'
}
```

### 4.2 决策展示

在展示模式中，需要显示：

```text
【骸骨队长的决策】
├─ ✓ 检查：生命值 85/200 (42%) - 未触发狂暴
├─ ✓ 检查：生命值 > 60% - 未触发召唤
├─ ✓ 检查：敌方有高防御目标
├─ ✓ 检查：破甲斩冷却完成
└─ → 决定：对守卫使用破甲斩
```

## 5. AI 难度调节

### 5.1 难度等级

```typescript
enum AIDifficulty {
  EASY = 'easy',      // 简单：随机决策，不使用复杂技能
  NORMAL = 'normal',  // 普通：基础行为树
  HARD = 'hard',      // 困难：完整行为树，更智能的目标选择
  EXPERT = 'expert',  // 专家：预判玩家行动，最优化决策
}
```

### 5.2 难度影响

- **简单**：
  - 50% 概率使用最优决策
  - 不会优先击杀低血量目标
  - 不会针对后排
  
- **普通**：
  - 80% 概率使用最优决策
  - 基础目标优先级
  
- **困难**：
  - 100% 使用最优决策
  - 完整目标优先级
  - 会利用技能组合
  
- **专家**：
  - 完美决策
  - 预判玩家治疗时机
  - 优先打断关键技能

## 6. 调试工具

### 6.1 行为树可视化

在调参面板中显示当前敌人的行为树执行路径：

```text
骸骨队长 - 行为树执行
└─ Selector (执行中)
   ├─ Sequence (失败) - 阶段 3
   │  └─ Condition (失败) - 生命值 85/200 > 30%
   ├─ Sequence (失败) - 阶段 2
   │  └─ Condition (失败) - 生命值 85/200 > 60%
   ├─ Sequence (成功) - 破甲打击
   │  ├─ Condition (成功) - 目标防御 > 15
   │  ├─ Condition (成功) - 破甲斩冷却完成
   │  └─ Action (成功) - 对守卫使用破甲斩
   └─ 未执行
```

### 6.2 状态机调试

显示当前所有单位的状态：

```text
【角色状态】
守卫: RECOVERING (0.5s 后转为 IDLE)
游侠: IDLE
术士: CASTING (火焰风暴)

【敌人状态】
骸骨队长: CHOOSING_TARGET
骸骨士兵 A: STUNNED (剩余 1 回合)
骸骨弓手: DEAD
```

## 7. 扩展设计

### 7.1 学习型 AI（未来）

记录玩家常用策略，动态调整行为树：

```typescript
interface PlayerPattern {
  healThreshold: number     // 玩家通常在多少血量治疗
  focusFirePattern: boolean // 是否集火单个目标
  buffTiming: string        // Buff 使用时机
}

// AI 根据记录的模式调整行为
function adaptBehavior(pattern: PlayerPattern): BehaviorTree {
  // 如果玩家习惯低血治疗，提前集火
  // 如果玩家习惯开局 Buff，优先驱散
}
```

### 7.2 合作 AI

多个敌人之间的配合：

- 法师给战士加攻击 Buff
- 治疗者优先救濒死单位
- 控制者优先控制玩家输出

### 7.3 动态难度调整

根据玩家表现自动调整 AI 难度：

```typescript
function adjustDifficulty(combatHistory: CombatResult[]) {
  const winRate = calculateWinRate(combatHistory, last10Games)
  
  if (winRate > 0.8) {
    // 玩家太强，提升 AI 难度
    return AIDifficulty.HARD
  } else if (winRate < 0.3) {
    // 玩家太弱，降低 AI 难度
    return AIDifficulty.EASY
  }
  
  return AIDifficulty.NORMAL
}
```

## 8. 实现优先级

### 阶段 1：基础状态机

- 实现基本状态和转换
- 简单的状态展示

### 阶段 2：简单行为树

- 条件节点和行动节点
- 基础的 Selector 和 Sequence
- 固定的决策逻辑

### 阶段 3：完整行为树

- 所有敌人类型的行为树
- Boss 多阶段行为
- 决策日志记录

### 阶段 4：调试和展示

- 行为树可视化
- 状态机实时展示
- 决策原因展示

### 阶段 5：优化和扩展

- AI 难度调节
- 更复杂的行为模式
- 合作 AI
