// 基础类型定义

export type UnitPosition = 'front' | 'back'
export type UnitRole = 'tank' | 'dps' | 'mage' | 'healer'
export type DamageType = 'physical' | 'magic'
export type TargetRule =
  | 'random'
  | 'lowest_hp'
  | 'lowest_hp_percent'
  | 'highest_hp'
  | 'highest_threat'
  | 'back_row'
  | 'front_row'
  | 'self'
  | 'all_enemies'
  | 'all_allies'

export type BuffType = 'buff' | 'debuff'
export type BuffTrigger =
  | 'onTurnStart'
  | 'onAction'
  | 'onHit'
  | 'onDamaged'
  | 'onTurnEnd'

export type UnitState =
  | 'idle'
  | 'choosing_target'
  | 'casting'
  | 'recovering'
  | 'stunned'
  | 'dead'

// 单位基础属性
export interface UnitStats {
  maxHp: number
  attack: number
  defense: number
  speed: number
  critRate: number
  critDamage: number
}

// Buff/Debuff 效果
export interface BuffEffect {
  type: 'stat' | 'damage' | 'heal' | 'control' | 'shield'
  trigger: BuffTrigger
  value: number
  stat?: keyof UnitStats
  damageType?: DamageType
}

// Buff/Debuff
export interface Buff {
  id: string
  name: string
  type: BuffType
  duration: number // -1 表示永久
  stackCount: number
  maxStack: number
  effects: BuffEffect[]
  source?: string // 来源单位 ID
}

// 技能效果
export interface SkillEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'shield'
  value: number
  buffId?: string
  duration?: number
}

// 技能
export interface Skill {
  id: string
  name: string
  description: string
  cooldown: number
  currentCooldown: number
  power: number
  damageType?: DamageType
  targetRule: TargetRule
  effects: SkillEffect[]
  hitCount?: number // 多段攻击
}

// 单位（角色或敌人）
export interface Unit {
  id: string
  name: string
  type: 'player' | 'enemy'
  role: UnitRole
  position: UnitPosition

  // 属性
  stats: UnitStats
  baseStats?: UnitStats // 基础属性（未装备前）

  // 当前状态
  hp: number
  shield: number
  threat: number

  // 技能
  skills: Skill[]

  // Buff/Debuff
  buffs: Buff[]

  // 状态机
  state: UnitState

  // 战斗统计
  damageDealt: number
  damageTaken: number
  healingDone: number
}

// 战斗日志条目
export interface CombatLogEntry {
  turn: number
  timestamp: number
  type: 'action' | 'damage' | 'heal' | 'buff' | 'death' | 'phase' | 'stateChange'
  actor?: string
  target?: string
  skill?: string
  value?: number
  details: string
  reason?: string // AI 决策原因
}

// 战斗统计
export interface CombatStats {
  totalDamageDealt: Record<string, number>
  totalDamageTaken: Record<string, number>
  totalHealing: Record<string, number>
  skillUsageCount: Record<string, number>
  killCount: Record<string, number>
  criticalHits: Record<string, number>
  turnCount: number
  duration: number
}

// 战斗结果
export interface CombatResult {
  victory: boolean
  survivors: Unit[]
  stats: CombatStats
  log: CombatLogEntry[]
  keyMoments: CombatLogEntry[]
}

// 行为树节点结果
export enum NodeResult {
  SUCCESS = 'success',
  FAILURE = 'failure',
  RUNNING = 'running',
}

// AI 决策上下文
export interface AIContext {
  self: Unit
  allies: Unit[]
  enemies: Unit[]
  turnNumber: number
}

// 行为树节点
export abstract class BehaviorNode {
  abstract execute(context: AIContext): NodeResult
}
