# 战斗系统设计文档

## 1. 战斗系统概述

战斗系统是游戏的核心，采用回合制自动战斗模式。玩家在战前进行配置，战斗过程自动执行，战后可查看详细日志和复盘数据。

## 2. 战斗流程

### 2.1 战斗初始化

```text
1. 加载玩家小队（3 名角色）
2. 加载敌方单位（1-5 个敌人）
3. 计算初始行动顺序（基于速度值）
4. 初始化战斗日志
5. 应用战前 Buff（如果有）
```

### 2.2 回合循环

```text
while (双方都有存活单位) {
  1. 回合开始触发
  2. 更新 Buff/Debuff 持续时间
  3. 触发"回合开始"效果
  4. 按速度顺序执行行动
  5. 触发"回合结束"效果
  6. 检查胜负条件
}
```

### 2.3 单位行动流程

```text
1. 检查状态（眩晕则跳过）
2. 状态机：Idle -> ChoosingTarget
3. 选择技能（根据冷却和策略）
4. 选择目标（根据目标选择规则）
5. 状态机：ChoosingTarget -> Casting
6. 触发"行动前"效果
7. 执行技能
8. 计算伤害/治疗
9. 应用 Buff/Debuff
10. 触发"造成伤害时"/"受到伤害时"效果
11. 状态机：Casting -> Recovering
12. 更新技能冷却
13. 记录日志
14. 状态机：Recovering -> Idle
```

## 3. 核心子系统

### 3.1 伤害计算公式

#### 基础伤害

```typescript
基础伤害 = 技能基础威力 × 攻击力倍率
```

#### 最终伤害

```typescript
最终伤害 = (基础伤害 - 目标防御力) × (1 + 伤害加成) × (1 - 伤害减免) × 暴击倍率
最终伤害 = max(最终伤害, 1) // 保证至少造成 1 点伤害
```

#### 暴击判定

```typescript
if (random() < 暴击率) {
  暴击倍率 = 1.5 + 额外暴击伤害
} else {
  暴击倍率 = 1.0
}
```

#### 护盾计算

```typescript
if (目标有护盾) {
  护盾吸收 = min(伤害, 护盾值)
  实际生命伤害 = 伤害 - 护盾吸收
  护盾值 -= 护盾吸收
}
```

### 3.2 治疗计算公式

```typescript
治疗量 = 技能基础治疗 × (1 + 治疗加成)
实际治疗 = min(治疗量, 最大生命值 - 当前生命值)
```

### 3.3 技能冷却系统

```typescript
interface Skill {
  id: string
  cooldown: number      // 最大冷却回合数
  currentCooldown: number // 当前剩余冷却
}

// 每回合结束时
for (skill of allSkills) {
  if (skill.currentCooldown > 0) {
    skill.currentCooldown--
  }
}

// 使用技能后
skill.currentCooldown = skill.cooldown
```

### 3.4 Buff/Debuff 系统

#### Buff 数据结构

```typescript
interface Buff {
  id: string
  name: string
  type: 'buff' | 'debuff'
  duration: number        // 剩余回合数，-1 表示永久
  stackCount: number      // 层数
  maxStack: number        // 最大层数
  effects: BuffEffect[]   // 效果列表
}

interface BuffEffect {
  type: 'stat' | 'damage' | 'heal' | 'control'
  trigger: 'onTurnStart' | 'onAction' | 'onHit' | 'onDamaged' | 'onTurnEnd'
  value: number
  stat?: 'attack' | 'defense' | 'speed' | 'critRate'
}
```

#### 触发时机

1. **回合开始** (onTurnStart)：中毒、燃烧伤害
2. **行动前** (onAction)：攻击力提升、速度提升
3. **造成伤害时** (onHit)：额外伤害、吸血
4. **受到伤害时** (onDamaged)：反伤、护盾
5. **回合结束** (onTurnEnd)：持续治疗、持续时间递减

### 3.5 目标选择系统

```typescript
enum TargetRule {
  RANDOM = 'random',              // 随机
  LOWEST_HP = 'lowest_hp',        // 最低生命值
  LOWEST_HP_PERCENT = 'lowest_hp_percent', // 最低生命百分比
  HIGHEST_HP = 'highest_hp',      // 最高生命值
  HIGHEST_THREAT = 'highest_threat', // 最高仇恨值
  BACK_ROW = 'back_row',          // 后排优先
  FRONT_ROW = 'front_row',        // 前排优先
  WITH_SHIELD = 'with_shield',    // 有护盾者
  WITH_BUFF = 'with_buff',        // 有增益者
}

// 目标选择器示例
function selectTarget(
  caster: Unit,
  enemies: Unit[],
  rule: TargetRule
): Unit | null {
  const aliveEnemies = enemies.filter(e => e.hp > 0)
  if (aliveEnemies.length === 0) return null

  switch (rule) {
    case TargetRule.LOWEST_HP:
      return aliveEnemies.reduce((a, b) => a.hp < b.hp ? a : b)
    case TargetRule.BACK_ROW:
      const backRow = aliveEnemies.filter(e => e.position === 'back')
      return backRow.length > 0 ? randomChoice(backRow) : randomChoice(aliveEnemies)
    // ... 其他规则
  }
}
```

## 4. 角色状态机

### 4.1 状态定义

```typescript
enum UnitState {
  IDLE = 'idle',              // 待机
  CHOOSING_TARGET = 'choosing_target', // 选择目标中
  CASTING = 'casting',        // 施法中
  RECOVERING = 'recovering',  // 恢复中
  STUNNED = 'stunned',        // 眩晕
  DEAD = 'dead',              // 死亡
}
```

### 4.2 状态转换规则

```text
IDLE -> CHOOSING_TARGET: 轮到行动
CHOOSING_TARGET -> CASTING: 选定目标和技能
CASTING -> RECOVERING: 技能释放完成
RECOVERING -> IDLE: 恢复完成
任何状态 -> STUNNED: 受到眩晕效果
STUNNED -> IDLE: 眩晕结束
任何状态 -> DEAD: 生命值归零
```

### 4.3 状态效果

- **IDLE**：可以被选为行动者
- **CHOOSING_TARGET**：显示目标选择逻辑
- **CASTING**：播放技能动画（如果有）
- **RECOVERING**：短暂延迟，模拟行动后恢复
- **STUNNED**：跳过行动回合
- **DEAD**：不参与战斗，不能被选为目标

## 5. 敌人 AI 系统

### 5.1 行为树结构

```text
Root (Selector)
├── 序列：自保行为
│   ├── 条件：生命值 < 30%
│   └── 行动：使用治疗/防御技能
├── 序列：破盾行为
│   ├── 条件：目标有护盾
│   └── 行动：使用破盾技能
├── 序列：优先击杀
│   ├── 条件：存在低血量敌人（< 20%）
│   └── 行动：攻击最低血量目标
├── 序列：后排优先
│   ├── 条件：有后排输出存活
│   └── 行动：攻击后排目标
└── 行动：默认攻击（攻击最高仇恨值目标）
```

### 5.2 AI 决策示例

```typescript
function makeEnemyDecision(enemy: Unit, allies: Unit[], players: Unit[]): Action {
  // 1. 自保行为
  if (enemy.hp / enemy.maxHp < 0.3) {
    const healSkill = enemy.skills.find(s => s.type === 'heal' && s.currentCooldown === 0)
    if (healSkill) {
      return { skill: healSkill, target: enemy }
    }
  }

  // 2. 破盾行为
  const shieldedEnemies = players.filter(p => p.shield > 20)
  if (shieldedEnemies.length > 0) {
    const shieldBreakSkill = enemy.skills.find(s => s.effects.includes('pierce_shield'))
    if (shieldBreakSkill && shieldBreakSkill.currentCooldown === 0) {
      return { skill: shieldBreakSkill, target: shieldedEnemies[0] }
    }
  }

  // 3. 优先击杀
  const lowHpTargets = players.filter(p => p.hp / p.maxHp < 0.2)
  if (lowHpTargets.length > 0) {
    const skill = selectBestDamageSkill(enemy)
    return { skill, target: lowHpTargets[0] }
  }

  // 4. 后排优先
  const backRowTargets = players.filter(p => p.position === 'back' && p.hp > 0)
  if (backRowTargets.length > 0) {
    const skill = selectBestDamageSkill(enemy)
    return { skill, target: backRowTargets[0] }
  }

  // 5. 默认攻击最高仇恨
  const highestThreat = players.reduce((a, b) => a.threat > b.threat ? a : b)
  const skill = selectBestDamageSkill(enemy)
  return { skill, target: highestThreat }
}
```

## 6. 战斗数据统计

### 6.1 统计项

```typescript
interface CombatStats {
  totalDamageDealt: { [unitId: string]: number }
  totalDamageTaken: { [unitId: string]: number }
  totalHealing: { [unitId: string]: number }
  skillUsageCount: { [skillId: string]: number }
  killCount: { [unitId: string]: number }
  deathCount: { [unitId: string]: number }
  criticalHits: { [unitId: string]: number }
  turnCount: number
  duration: number // 秒
}
```

### 6.2 关键转折点

战斗复盘需要记录关键转折点：

1. 首次击杀
2. 关键角色死亡（如治疗者）
3. Boss 进入新阶段
4. 团队濒危（全员生命 < 30%）
5. 团队翻盘（从濒危恢复）

## 7. 战斗日志格式

### 7.1 日志结构

```typescript
interface CombatLogEntry {
  turn: number
  timestamp: number
  type: 'action' | 'damage' | 'heal' | 'buff' | 'death' | 'phase'
  actor?: string
  target?: string
  skill?: string
  value?: number
  details?: string
  reason?: string // AI 决策原因
}
```

### 7.2 日志示例

```text
[回合 1] 守卫进入战斗状态
[回合 1] 守卫选择目标：骸骨士兵（前排最高威胁）
[回合 1] 守卫释放"盾击"，对骸骨士兵造成 45 点伤害
[回合 1] 骸骨士兵受到 45 点伤害，剩余生命 55/100
[回合 1] 守卫获得 Buff：嘲讽（2 回合）
[回合 2] 术士选择目标：全体敌人（AOE 技能）
[回合 2] 术士释放"火焰风暴"
[回合 2] 骸骨士兵受到 38 点火焰伤害，剩余生命 17/100
[回合 2] 骸骨弓手受到 41 点火焰伤害（暴击！），剩余生命 29/70
[回合 2] 骸骨法师受到 35 点火焰伤害，剩余生命 25/60
[回合 2] 全体敌人获得 Debuff：燃烧（持续 3 回合，每回合 10 点伤害）
```

## 8. 平衡设计考虑

### 8.1 数值基线

- 角色基础生命值：100-150
- 角色基础攻击力：15-25
- 角色基础防御力：5-15
- 敌人生命值倍率：0.8-1.2
- Boss 生命值倍率：3.0-5.0

### 8.2 战斗节奏

- 单场战斗目标回合数：5-15 回合
- 普通战斗：3-5 个敌人，8-12 回合
- 精英战斗：1-3 个强力敌人，10-15 回合
- Boss 战：1 个 Boss，15-25 回合

### 8.3 技能平衡

- 单体技能伤害倍率：1.5-2.5
- AOE 技能伤害倍率：0.8-1.2（总伤害更高但单体较低）
- 治疗技能倍率：1.0-1.5
- 护盾技能倍率：1.2-2.0
- 控制技能持续：1-3 回合

## 9. 扩展预留

### 9.1 预留机制

- 连携技能（多角色组合技）
- 武器切换（角色可装备多套武器）
- 地形效果（不同地形影响战斗）
- 天气系统（影响技能效果）

### 9.2 未来优化

- 技能动画系统
- 更复杂的行为树编辑器
- 战斗回放系统
- 自定义角色构筑

## 10. 技术实现注意事项

### 10.1 性能优化

- 避免深度对象拷贝，使用浅拷贝 + 不可变更新
- Buff 系统使用池化，避免频繁创建销毁
- 日志使用流式写入，避免内存占用过大

### 10.2 可测试性

- 战斗引擎支持确定性随机（通过种子）
- 每个子系统可独立测试
- 提供战斗快照和回溯功能

### 10.3 可调试性

- 完整的战斗日志
- 展示模式显示内部状态
- 支持单步执行战斗回合
- 支持修改战斗状态进行测试
