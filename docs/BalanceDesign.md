# 数值与平衡设计文档

## 1. 设计目标

- 单场战斗时长控制在 8-15 回合
- 玩家有明确的策略选择空间
- 不同角色定位清晰
- Roguelike 构筑有深度
- 数值易于调整和平衡

## 2. 角色基础数值

### 2.1 玩家角色

#### 守卫（Tank / 前排）

```typescript
{
  name: '守卫',
  role: 'tank',
  position: 'front',
  baseStats: {
    maxHp: 150,
    attack: 18,
    defense: 15,
    speed: 8,
    critRate: 0.05,
    critDamage: 1.5
  },
  skills: [
    {
      id: 'shield_bash',
      name: '盾击',
      cooldown: 0,
      power: 1.2,
      effects: ['taunt']
    },
    {
      id: 'defensive_stance',
      name: '防御姿态',
      cooldown: 3,
      effects: ['self_shield', 'defense_up']
    },
    {
      id: 'provoke',
      name: '嘲讽',
      cooldown: 2,
      effects: ['taunt_all']
    }
  ]
}
```

**定位**：
- 承受伤害，保护队友
- 通过嘲讽控制敌人目标
- 提供护盾和防御增益

#### 游侠（DPS / 后排）

```typescript
{
  name: '游侠',
  role: 'dps',
  position: 'back',
  baseStats: {
    maxHp: 100,
    attack: 28,
    defense: 8,
    speed: 15,
    critRate: 0.25,
    critDamage: 2.0
  },
  skills: [
    {
      id: 'precise_shot',
      name: '精准射击',
      cooldown: 0,
      power: 1.8,
      targetRule: 'lowest_hp'
    },
    {
      id: 'rapid_fire',
      name: '连射',
      cooldown: 2,
      power: 0.8,
      hitCount: 3
    },
    {
      id: 'assassinate',
      name: '致命一击',
      cooldown: 4,
      power: 3.0,
      effects: ['execute']  // 对低血量额外伤害
    }
  ]
}
```

**定位**：
- 高单体输出
- 擅长收割残血
- 高暴击率和暴击伤害

#### 术士（Mage / 后排）

```typescript
{
  name: '术士',
  role: 'mage',
  position: 'back',
  baseStats: {
    maxHp: 90,
    attack: 25,
    defense: 5,
    speed: 12,
    critRate: 0.15,
    critDamage: 1.8
  },
  skills: [
    {
      id: 'magic_missile',
      name: '魔法飞弹',
      cooldown: 0,
      power: 1.5,
      damageType: 'magic'
    },
    {
      id: 'fireball',
      name: '火球术',
      cooldown: 2,
      power: 2.2,
      effects: ['burn']
    },
    {
      id: 'flame_storm',
      name: '火焰风暴',
      cooldown: 4,
      power: 1.2,
      targetRule: 'all_enemies',
      effects: ['burn']
    }
  ]
}
```

**定位**：
- AOE 群体伤害
- 持续伤害（燃烧）
- 控制和 Debuff

### 2.2 敌人数值

#### 骸骨士兵（普通敌人 / 前排）

```typescript
{
  name: '骸骨士兵',
  type: 'normal',
  position: 'front',
  baseStats: {
    maxHp: 80,
    attack: 15,
    defense: 10,
    speed: 10,
    critRate: 0.1,
    critDamage: 1.5
  }
}
```

#### 骸骨弓手（普通敌人 / 后排）

```typescript
{
  name: '骸骨弓手',
  type: 'normal',
  position: 'back',
  baseStats: {
    maxHp: 60,
    attack: 20,
    defense: 5,
    speed: 13,
    critRate: 0.2,
    critDamage: 1.8
  }
}
```

#### 骸骨法师（精英敌人 / 后排）

```typescript
{
  name: '骸骨法师',
  type: 'elite',
  position: 'back',
  baseStats: {
    maxHp: 70,
    attack: 22,
    defense: 8,
    speed: 11,
    critRate: 0.15,
    critDamage: 1.6
  }
}
```

#### 骸骨队长（Boss）

```typescript
{
  name: '骸骨队长',
  type: 'boss',
  position: 'front',
  baseStats: {
    maxHp: 400,
    attack: 30,
    defense: 20,
    speed: 12,
    critRate: 0.2,
    critDamage: 2.0
  },
  phases: [
    { threshold: 1.0, behavior: 'aggressive' },
    { threshold: 0.6, behavior: 'summon' },
    { threshold: 0.3, behavior: 'berserk' }
  ]
}
```

## 3. 伤害计算公式

### 3.1 基础伤害

```
基础伤害 = 技能威力 × 攻击力
```

### 3.2 防御减免

```
防御减免率 = 目标防御 / (目标防御 + 100)
最大减免率 = 75%

例如：
- 防御 10 → 减免 9%
- 防御 20 → 减免 17%
- 防御 50 → 减免 33%
- 防御 100 → 减免 50%
- 防御 300 → 减免 75%（封顶）
```

### 3.3 最终伤害

```
实际伤害 = 基础伤害 × (1 - 防御减免率) × 暴击倍率 × 增伤倍率 × 易伤倍率
最低伤害 = max(实际伤害, 1)
```

### 3.4 伤害示例

**守卫盾击 vs 骸骨士兵**

```
基础伤害 = 1.2 × 18 = 21.6
防御减免 = 10 / (10 + 100) = 9%
实际伤害 = 21.6 × (1 - 0.09) = 19.7 ≈ 20
```

**游侠精准射击（暴击）vs 骸骨法师**

```
基础伤害 = 1.8 × 28 = 50.4
防御减免 = 8 / (8 + 100) = 7.4%
暴击伤害 = 50.4 × (1 - 0.074) × 2.0 = 93.3 ≈ 93
```

**术士火焰风暴 vs 3 个敌人**

```
基础伤害 = 1.2 × 25 = 30
对骸骨士兵：30 × (1 - 0.09) = 27
对骸骨弓手：30 × (1 - 0.05) = 28
对骸骨法师：30 × (1 - 0.07) = 28
总伤害 = 83
```

## 4. Buff/Debuff 数值

### 4.1 增益效果

| Buff | 效果 | 持续回合 | 数值 |
|------|------|----------|------|
| 攻击提升 | 攻击力 +30% | 3 | +30% |
| 防御提升 | 防御力 +50% | 3 | +50% |
| 速度提升 | 速度 +20% | 2 | +20% |
| 暴击提升 | 暴击率 +15% | 3 | +15% |
| 护盾 | 吸收伤害 | 2 | 30-60 点 |
| 回春 | 每回合恢复 | 3 | 10 HP/回合 |

### 4.2 减益效果

| Debuff | 效果 | 持续回合 | 数值 |
|--------|------|----------|------|
| 中毒 | 每回合伤害 | 3 | 8 HP/回合 |
| 燃烧 | 每回合伤害 | 3 | 12 HP/回合 |
| 易伤 | 受到伤害 +30% | 2 | +30% |
| 虚弱 | 攻击力 -30% | 2 | -30% |
| 破甲 | 防御力 -50% | 2 | -50% |
| 减速 | 速度 -30% | 2 | -30% |
| 眩晕 | 无法行动 | 1 | N/A |

## 5. 技能平衡

### 5.1 技能伤害倍率设计原则

- **无冷却技能**：1.2-1.8 倍
- **2 回合冷却**：1.8-2.5 倍
- **4 回合冷却**：2.5-3.5 倍
- **AOE 技能**：单体倍率 × 0.6-0.8

### 5.2 技能价值评估

技能价值 = 伤害价值 + 效果价值 + 灵活性价值

**伤害价值计算**：
```
伤害价值 = 威力倍率 × 目标数量 / (冷却时间 + 1)

例如：
- 盾击：1.2 × 1 / 1 = 1.2
- 火球术：2.2 × 1 / 3 = 0.73
- 火焰风暴：1.2 × 3 / 5 = 0.72
```

**效果价值**：
- 护盾：+0.5
- 治疗：+0.8
- 控制（眩晕）：+1.0
- Buff/Debuff：+0.3-0.5

### 5.3 技能冷却设计

- 核心技能：0 回合（可随时使用）
- 常用技能：2-3 回合
- 大招技能：4-5 回合
- Boss 技能：3-6 回合

## 6. 装备和遗物数值

### 6.1 装备词条

#### 武器

```typescript
// T1 词条（基础）
{ stat: 'attack', value: '+5 攻击力' }
{ stat: 'critRate', value: '+5% 暴击率' }

// T2 词条（稀有）
{ stat: 'attack', value: '+10 攻击力' }
{ stat: 'critRate', value: '+10% 暴击率' }
{ stat: 'critDamage', value: '+20% 暴击伤害' }

// T3 词条（史诗）
{ stat: 'attack', value: '+15 攻击力' }
{ effect: 'onKill', value: '击杀后回复 15% 生命' }
{ effect: 'burn', value: '攻击造成燃烧（10 伤害/回合）' }
```

#### 护甲

```typescript
// T1 词条
{ stat: 'defense', value: '+5 防御力' }
{ stat: 'maxHp', value: '+20 最大生命' }

// T2 词条
{ stat: 'defense', value: '+10 防御力' }
{ stat: 'maxHp', value: '+40 最大生命' }

// T3 词条
{ stat: 'defense', value: '+15 防御力' }
{ effect: 'startBattle', value: '战斗开始获得 30 点护盾' }
{ effect: 'onDamaged', value: '受到伤害时 20% 概率反弹 50% 伤害' }
```

#### 饰品

```typescript
// T2 词条
{ stat: 'speed', value: '+3 速度' }
{ effect: 'turnStart', value: '回合开始回复 5 HP' }

// T3 词条
{ stat: 'speed', value: '+5 速度' }
{ effect: 'lowHp', value: '生命 < 30% 时免疫控制' }
{ effect: 'buff', value: '所有 Buff 持续时间 +1 回合' }
```

### 6.2 遗物（Roguelike 专属）

```typescript
const relics = [
  {
    id: 'blood_ruby',
    name: '血红宝石',
    effect: '每次攻击回复 5% 造成的伤害',
    rarity: 'rare'
  },
  {
    id: 'stone_heart',
    name: '石心',
    effect: '最大生命 +50，防御 +10',
    rarity: 'common'
  },
  {
    id: 'phoenix_feather',
    name: '凤凰羽毛',
    effect: '首次死亡时复活，回复 50% 生命（每局限一次）',
    rarity: 'legendary'
  },
  {
    id: 'time_hourglass',
    name: '时光沙漏',
    effect: '所有技能冷却 -1 回合',
    rarity: 'epic'
  },
  {
    id: 'cursed_blade',
    name: '诅咒之刃',
    effect: '攻击力 +50%，最大生命 -30%',
    rarity: 'epic'
  }
]
```

## 7. 战斗节奏设计

### 7.1 普通战斗（3 个普通敌人）

```
回合 1-3：双方正常输出
回合 4-6：开始使用技能和 Buff
回合 7-9：敌人陆续倒下
回合 10：战斗结束

期望胜利条件：
- 玩家剩余生命 > 60%
- 至少 2 名角色存活
```

### 7.2 精英战斗（1-2 个精英敌人）

```
回合 1-5：试探和 Buff 阶段
回合 6-10：激烈交火
回合 11-15：决胜阶段

期望胜利条件：
- 玩家剩余生命 40-70%
- 可能有 1 名角色阵亡
```

### 7.3 Boss 战

```
阶段 1（100%-60%）：
- Boss 使用基础技能
- 玩家建立优势

阶段 2（60%-30%）：
- Boss 召唤小怪或使用特殊技能
- 战况变得复杂

阶段 3（30%-0%）：
- Boss 进入狂暴
- 决胜时刻

总回合数：15-25 回合

期望胜利条件：
- 玩家剩余生命 20-50%
- 可能有 1-2 名角色阵亡
- 需要使用战术和构筑优势
```

## 8. 数值成长曲线

### 8.1 地下城层数对应强度

| 层数 | 敌人生命倍率 | 敌人攻击倍率 | 奖励品质 |
|------|--------------|--------------|----------|
| 1-2 | 1.0x | 1.0x | 普通 |
| 3-4 | 1.2x | 1.1x | 普通+稀有 |
| 5-6 | 1.5x | 1.3x | 稀有 |
| 7-8 | 1.8x | 1.5x | 稀有+史诗 |
| Boss | 2.5x | 1.8x | 史诗+传说 |

### 8.2 角色成长路径

```
初始状态 -> 
+装备（+20% 属性）-> 
+遗物（+30% 属性 + 特殊效果）-> 
+技能强化（+40% 效果）-> 
最终状态（约 2-3 倍初始强度）
```

## 9. 平衡测试场景

### 9.1 基准测试

**场景 1：3v3 基础战斗**
- 玩家：守卫、游侠、术士（无装备）
- 敌人：2 骸骨士兵 + 1 骸骨弓手
- 期望结果：8-12 回合获胜，玩家剩余 60-80% 生命

**场景 2：精英战斗**
- 玩家：守卫、游侠、术士（基础装备）
- 敌人：1 骸骨队长（非 Boss 版）
- 期望结果：12-18 回合获胜，玩家剩余 40-60% 生命

**场景 3：Boss 战**
- 玩家：守卫、游侠、术士（中等装备 + 2 个遗物）
- 敌人：骸骨队长（完整 Boss）
- 期望结果：20-30 回合获胜，玩家剩余 20-40% 生命

### 9.2 极限测试

- 仅守卫能否单挑普通战斗？（不应该）
- 3 个满装备角色能否秒杀 Boss？（不应该）
- 无装备能否通关？（应该非常困难但可能）

## 10. 调参建议

### 10.1 调参优先级

1. **战斗回合数**：最重要，影响节奏
2. **角色生存率**：确保不会轻易团灭
3. **技能价值**：保证技能有意义
4. **装备效果**：构筑要有明显提升

### 10.2 常见问题和调整

| 问题 | 可能原因 | 调整方向 |
|------|----------|----------|
| 战斗太快（< 5 回合） | 伤害过高 | 降低攻击倍率或提升生命值 |
| 战斗太慢（> 20 回合） | 伤害过低 | 提升攻击倍率或降低防御 |
| 玩家太脆弱 | 敌人伤害过高 | 降低敌人攻击或提升玩家生命 |
| 玩家太强 | 玩家伤害过高 | 提升敌人生命或降低玩家攻击 |
| 技能没用 | 冷却太长或效果太弱 | 降低冷却或提升效果 |
| 某个角色无用 | 定位不清晰 | 重新设计技能组 |

### 10.3 调参工具数据

在调参面板中提供：
```typescript
interface BalanceData {
  averageTurnCount: number
  playerSurvivalRate: number
  averageWinMargin: number  // 胜利时剩余生命百分比
  skillUsageRate: { [skillId: string]: number }
  mostDeadlyEnemy: string
  mostUsefulBuff: string
}
```

## 11. 首版数值配置文件

```typescript
// src/data/config/balance.ts
export const BALANCE_CONFIG = {
  // 基础倍率
  BASE_ATTACK_MULTIPLIER: 1.0,
  BASE_HP_MULTIPLIER: 1.0,
  BASE_DEFENSE_MULTIPLIER: 1.0,
  
  // 伤害计算
  DEFENSE_FORMULA_CONSTANT: 100,
  MAX_DEFENSE_REDUCTION: 0.75,
  MIN_DAMAGE: 1,
  
  // 暴击
  BASE_CRIT_DAMAGE: 1.5,
  
  // 战斗节奏
  TARGET_TURNS_NORMAL: { min: 8, max: 15 },
  TARGET_TURNS_ELITE: { min: 12, max: 20 },
  TARGET_TURNS_BOSS: { min: 20, max: 30 },
  
  // 敌人强度曲线
  ENEMY_SCALING: [
    { floor: 1, hpMult: 1.0, atkMult: 1.0 },
    { floor: 3, hpMult: 1.2, atkMult: 1.1 },
    { floor: 5, hpMult: 1.5, atkMult: 1.3 },
    { floor: 7, hpMult: 1.8, atkMult: 1.5 },
  ],
}
```

这个配置文件可以在调参面板中实时修改并保存到 localStorage。
