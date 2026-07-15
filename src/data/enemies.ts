import type { Unit, UnitRole, UnitPosition, UnitState } from '../types'

/**
 * 创建敌人：骸骨士兵
 */
export function createSkeletonSoldier(id: string = 'skeleton_soldier_1'): Unit {
  return {
    id,
    name: '骸骨士兵',
    type: 'enemy',
    role: 'tank' as UnitRole,
    position: 'front' as UnitPosition,
    stats: {
      maxHp: 120,
      attack: 15,
      defense: 10,
      speed: 10,
      critRate: 0.1,
      critDamage: 1.5,
    },
    hp: 120,
    shield: 0,
    threat: 0,
    skills: [
      {
        id: 'slash',
        name: '斩击',
        description: '普通斩击',
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
        id: 'heavy_strike',
        name: '重击',
        description: '蓄力重击',
        cooldown: 2,
        currentCooldown: 0,
        power: 2.0,
        damageType: 'physical',
        targetRule: 'lowest_hp_percent',
        effects: [
          { type: 'damage', value: 2.0 },
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
 * 创建敌人：骸骨弓手
 */
export function createSkeletonArcher(id: string = 'skeleton_archer_1'): Unit {
  return {
    id,
    name: '骸骨弓手',
    type: 'enemy',
    role: 'dps' as UnitRole,
    position: 'back' as UnitPosition,
    stats: {
      maxHp: 90,
      attack: 20,
      defense: 5,
      speed: 13,
      critRate: 0.2,
      critDamage: 1.8,
    },
    hp: 90,
    shield: 0,
    threat: 0,
    skills: [
      {
        id: 'shoot',
        name: '射击',
        description: '普通射击',
        cooldown: 0,
        currentCooldown: 0,
        power: 1.5,
        damageType: 'physical',
        targetRule: 'back_row',
        effects: [
          { type: 'damage', value: 1.5 },
        ],
      },
      {
        id: 'pierce_shot',
        name: '穿刺箭',
        description: '穿刺攻击',
        cooldown: 3,
        currentCooldown: 0,
        power: 2.5,
        damageType: 'physical',
        targetRule: 'back_row',
        effects: [
          { type: 'damage', value: 2.5 },
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
 * 创建敌人：骸骨法师
 */
export function createSkeletonMage(id: string = 'skeleton_mage_1'): Unit {
  return {
    id,
    name: '骸骨法师',
    type: 'enemy',
    role: 'mage' as UnitRole,
    position: 'back' as UnitPosition,
    stats: {
      maxHp: 100,
      attack: 22,
      defense: 8,
      speed: 11,
      critRate: 0.15,
      critDamage: 1.6,
    },
    hp: 100,
    shield: 0,
    threat: 0,
    skills: [
      {
        id: 'dark_bolt',
        name: '暗影箭',
        description: '发射暗影魔法',
        cooldown: 0,
        currentCooldown: 0,
        power: 1.6,
        damageType: 'magic',
        targetRule: 'random',
        effects: [
          { type: 'damage', value: 1.6 },
        ],
      },
      {
        id: 'ice_shard',
        name: '冰霜碎片',
        description: '冰霜魔法攻击',
        cooldown: 2,
        currentCooldown: 0,
        power: 2.3,
        damageType: 'magic',
        targetRule: 'lowest_hp',
        effects: [
          { type: 'damage', value: 2.3 },
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
 * 创建默认敌人组：3 个普通敌人
 */
export function createBasicEnemyGroup(): Unit[] {
  return [
    createSkeletonSoldier('skeleton_soldier_1'),
    createSkeletonSoldier('skeleton_soldier_2'),
    createSkeletonArcher('skeleton_archer_1'),
  ]
}

/**
 * 创建混合敌人组
 */
export function createMixedEnemyGroup(): Unit[] {
  return [
    createSkeletonSoldier('skeleton_soldier_1'),
    createSkeletonArcher('skeleton_archer_1'),
    createSkeletonMage('skeleton_mage_1'),
  ]
}

/**
 * 创建指定数量的敌人
 */
export function createEnemies(count: number = 3): Unit[] {
  const enemies: Unit[] = []

  for (let i = 0; i < count; i++) {
    if (i === 0) {
      enemies.push(createSkeletonSoldier(`skeleton_soldier_${i + 1}`))
    } else if (i === 1) {
      enemies.push(createSkeletonArcher(`skeleton_archer_${i + 1}`))
    } else {
      enemies.push(createSkeletonMage(`skeleton_mage_${i + 1}`))
    }
  }

  return enemies
}
