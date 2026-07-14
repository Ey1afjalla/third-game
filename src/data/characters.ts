import type { Unit, UnitRole, UnitPosition, UnitState } from '../types'

/**
 * 创建玩家角色：守卫（Tank）
 */
export function createGuard(): Unit {
  return {
    id: 'guard',
    name: '守卫',
    type: 'player',
    role: 'tank' as UnitRole,
    position: 'front' as UnitPosition,
    stats: {
      maxHp: 150,
      attack: 18,
      defense: 15,
      speed: 8,
      critRate: 0.05,
      critDamage: 1.5,
    },
    hp: 150,
    shield: 0,
    threat: 0,
    skills: [
      {
        id: 'shield_bash',
        name: '盾击',
        description: '用盾牌猛击敌人，造成伤害并提升自身仇恨',
        cooldown: 0,
        currentCooldown: 0,
        power: 1.2,
        damageType: 'physical',
        targetRule: 'highest_threat',
        effects: [
          { type: 'damage', value: 1.2 },
        ],
      },
      {
        id: 'defensive_stance',
        name: '防御姿态',
        description: '进入防御姿态，获得护盾',
        cooldown: 3,
        currentCooldown: 0,
        power: 0,
        targetRule: 'self',
        effects: [
          { type: 'shield', value: 40 },
        ],
      },
      {
        id: 'provoke',
        name: '嘲讽',
        description: '嘲讽所有敌人，强制他们攻击自己',
        cooldown: 2,
        currentCooldown: 0,
        power: 0.8,
        targetRule: 'all_enemies',
        effects: [
          { type: 'damage', value: 0.8 },
        ],
      },
    ],
    buffs: [],
    state: 'idle' as UnitState,
    damageDealt: 0,
    damageTaken: 0,
    healingDone: 0,
  }
}

/**
 * 创建玩家角色：游侠（DPS）
 */
export function createRanger(): Unit {
  return {
    id: 'ranger',
    name: '游侠',
    type: 'player',
    role: 'dps' as UnitRole,
    position: 'back' as UnitPosition,
    stats: {
      maxHp: 100,
      attack: 28,
      defense: 8,
      speed: 15,
      critRate: 0.25,
      critDamage: 2.0,
    },
    hp: 100,
    shield: 0,
    threat: 0,
    skills: [
      {
        id: 'precise_shot',
        name: '精准射击',
        description: '精准射击敌人弱点，优先攻击低血量目标',
        cooldown: 0,
        currentCooldown: 0,
        power: 1.8,
        damageType: 'physical',
        targetRule: 'lowest_hp',
        effects: [
          { type: 'damage', value: 1.8 },
        ],
      },
      {
        id: 'rapid_fire',
        name: '连射',
        description: '快速连射三箭',
        cooldown: 2,
        currentCooldown: 0,
        power: 0.8,
        damageType: 'physical',
        targetRule: 'random',
        effects: [
          { type: 'damage', value: 0.8 },
        ],
        hitCount: 3,
      },
      {
        id: 'assassinate',
        name: '致命一击',
        description: '对低血量目标造成巨额伤害',
        cooldown: 4,
        currentCooldown: 0,
        power: 3.0,
        damageType: 'physical',
        targetRule: 'lowest_hp_percent',
        effects: [
          { type: 'damage', value: 3.0 },
        ],
      },
    ],
    buffs: [],
    state: 'idle' as UnitState,
    damageDealt: 0,
    damageTaken: 0,
    healingDone: 0,
  }
}

/**
 * 创建玩家角色：术士（Mage）
 */
export function createMage(): Unit {
  return {
    id: 'mage',
    name: '术士',
    type: 'player',
    role: 'mage' as UnitRole,
    position: 'back' as UnitPosition,
    stats: {
      maxHp: 90,
      attack: 25,
      defense: 5,
      speed: 12,
      critRate: 0.15,
      critDamage: 1.8,
    },
    hp: 90,
    shield: 0,
    threat: 0,
    skills: [
      {
        id: 'magic_missile',
        name: '魔法飞弹',
        description: '发射魔法飞弹攻击敌人',
        cooldown: 0,
        currentCooldown: 0,
        power: 1.5,
        damageType: 'magic',
        targetRule: 'random',
        effects: [
          { type: 'damage', value: 1.5 },
        ],
      },
      {
        id: 'fireball',
        name: '火球术',
        description: '投掷火球，造成伤害并燃烧目标',
        cooldown: 2,
        currentCooldown: 0,
        power: 2.2,
        damageType: 'magic',
        targetRule: 'random',
        effects: [
          { type: 'damage', value: 2.2 },
        ],
      },
      {
        id: 'flame_storm',
        name: '火焰风暴',
        description: '召唤火焰风暴攻击所有敌人',
        cooldown: 4,
        currentCooldown: 0,
        power: 1.2,
        damageType: 'magic',
        targetRule: 'all_enemies',
        effects: [
          { type: 'damage', value: 1.2 },
        ],
      },
    ],
    buffs: [],
    state: 'idle' as UnitState,
    damageDealt: 0,
    damageTaken: 0,
    healingDone: 0,
  }
}

/**
 * 创建默认玩家小队
 */
export function createDefaultTeam(): Unit[] {
  return [createGuard(), createRanger(), createMage()]
}
