import type { Skill, Unit } from '../types'

export interface TuningConfig {
  playerStats: {
    hpMultiplier: number
    attackMultiplier: number
    defenseMultiplier: number
    speedMultiplier: number
  }
  enemyStats: {
    hpMultiplier: number
    attackMultiplier: number
    defenseMultiplier: number
    speedMultiplier: number
    enemyCount: number
  }
  combat: {
    damageMultiplier: number
    critMultiplier: number
    skillPowerMultiplier: number
    skillCooldownMultiplier: number
  }
  rewards: {
    goldMultiplier: number
    equipmentDropRate: number
    relicDropRate: number
  }
}

export const TUNING_STORAGE_KEY = 'tuningConfig'

export const DEFAULT_TUNING_CONFIG: TuningConfig = {
  playerStats: {
    hpMultiplier: 1.0,
    attackMultiplier: 1.0,
    defenseMultiplier: 1.0,
    speedMultiplier: 1.0,
  },
  enemyStats: {
    hpMultiplier: 1.0,
    attackMultiplier: 1.0,
    defenseMultiplier: 1.0,
    speedMultiplier: 1.0,
    enemyCount: 3,
  },
  combat: {
    damageMultiplier: 1.0,
    critMultiplier: 1.5,
    skillPowerMultiplier: 1.0,
    skillCooldownMultiplier: 1.0,
  },
  rewards: {
    goldMultiplier: 1.0,
    equipmentDropRate: 0.3,
    relicDropRate: 0.2,
  },
}

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max)

const roundStat = (value: number): number => Math.max(1, Math.round(value))

const mergeConfig = (partial: Partial<TuningConfig>): TuningConfig => ({
  playerStats: { ...DEFAULT_TUNING_CONFIG.playerStats, ...partial.playerStats },
  enemyStats: { ...DEFAULT_TUNING_CONFIG.enemyStats, ...partial.enemyStats },
  combat: { ...DEFAULT_TUNING_CONFIG.combat, ...partial.combat },
  rewards: { ...DEFAULT_TUNING_CONFIG.rewards, ...partial.rewards },
})

export const loadTuningConfig = (): TuningConfig => {
  if (typeof localStorage === 'undefined') return DEFAULT_TUNING_CONFIG

  try {
    const saved = localStorage.getItem(TUNING_STORAGE_KEY)
    if (!saved) return DEFAULT_TUNING_CONFIG
    return mergeConfig(JSON.parse(saved))
  } catch {
    return DEFAULT_TUNING_CONFIG
  }
}

export const saveTuningConfig = (config: TuningConfig): void => {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(TUNING_STORAGE_KEY, JSON.stringify(config))
}

export const resetTuningConfig = (): TuningConfig => {
  saveTuningConfig(DEFAULT_TUNING_CONFIG)
  return DEFAULT_TUNING_CONFIG
}

const cloneSkill = (skill: Skill, config: TuningConfig): Skill => {
  const cooldown = Math.max(0, Math.round(skill.cooldown * config.combat.skillCooldownMultiplier))

  return {
    ...skill,
    power: Number((skill.power * config.combat.skillPowerMultiplier).toFixed(2)),
    cooldown,
    currentCooldown: Math.min(skill.currentCooldown, cooldown),
    effects: skill.effects.map(effect => ({ ...effect })),
  }
}

const cloneUnit = (unit: Unit, config: TuningConfig): Unit => ({
  ...unit,
  stats: { ...unit.stats },
  baseStats: unit.baseStats ? { ...unit.baseStats } : undefined,
  skills: unit.skills.map(skill => cloneSkill(skill, config)),
  buffs: unit.buffs.map(buff => ({
    ...buff,
    effects: buff.effects.map(effect => ({ ...effect })),
  })),
})

export const applyTuningToUnit = (unit: Unit, config: TuningConfig): Unit => {
  const tuned = cloneUnit(unit, config)
  const statConfig = tuned.type === 'player' ? config.playerStats : config.enemyStats
  const hpRatio = tuned.stats.maxHp > 0 ? tuned.hp / tuned.stats.maxHp : 1

  tuned.stats.maxHp = roundStat(tuned.stats.maxHp * statConfig.hpMultiplier)
  tuned.stats.attack = roundStat(tuned.stats.attack * statConfig.attackMultiplier)
  tuned.stats.defense = roundStat(tuned.stats.defense * statConfig.defenseMultiplier)
  tuned.stats.speed = roundStat(tuned.stats.speed * statConfig.speedMultiplier)
  tuned.stats.critDamage = config.combat.critMultiplier
  tuned.hp = clamp(roundStat(tuned.stats.maxHp * hpRatio), 0, tuned.stats.maxHp)

  if (tuned.baseStats) {
    tuned.baseStats.maxHp = roundStat(tuned.baseStats.maxHp * statConfig.hpMultiplier)
    tuned.baseStats.attack = roundStat(tuned.baseStats.attack * statConfig.attackMultiplier)
    tuned.baseStats.defense = roundStat(tuned.baseStats.defense * statConfig.defenseMultiplier)
    tuned.baseStats.speed = roundStat(tuned.baseStats.speed * statConfig.speedMultiplier)
    tuned.baseStats.critDamage = config.combat.critMultiplier
  }

  return tuned
}

export const applyTuningToUnits = (units: Unit[], config: TuningConfig): Unit[] =>
  units.map(unit => applyTuningToUnit(unit, config))
