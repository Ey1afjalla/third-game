import type { AIContext, CombatLogEntry, CombatResult, CombatStats, Skill, Unit, UnitState } from '../types'
import type { TuningConfig } from '../systems/TuningConfig'
import { DEFAULT_TUNING_CONFIG } from '../systems/TuningConfig'
import { BuffSystem } from '../systems/BuffSystem'
import { UnitStateMachine } from '../systems/StateMachine'
import { getEnemyBehaviorTree } from '../systems/BehaviorTree'
import { CombatLogger } from './CombatLogger'
import { DamageCalculator } from './DamageCalculator'
import { TargetSelector } from './TargetSelector'

export interface CombatEngineOptions {
  combatTuning?: TuningConfig['combat']
}

export interface AIDecisionRecord {
  turn: number
  unit: string
  skill: string
  targets: string[]
  reason: string
  path: string[]
}

export interface StateTransitionRecord {
  turn: number
  unit: string
  from: UnitState
  to: UnitState
  reason: string
}

export interface CombatDebugSnapshot {
  aiDecisions: AIDecisionRecord[]
  stateTransitions: StateTransitionRecord[]
  damageFormula: string
  randomSource: string
  tuning: TuningConfig['combat']
}

interface ActionDecision {
  skill: Skill
  targets: Unit[]
  reason: string
  path: string[]
}

export class CombatEngine {
  private players: Unit[]
  private enemies: Unit[]
  private logger: CombatLogger
  private turnCount = 0
  private combatStartTime = 0
  private stats: CombatStats
  private stateMachines: Map<string, UnitStateMachine> = new Map()
  private combatTuning: TuningConfig['combat']
  private aiDecisions: AIDecisionRecord[] = []
  private stateTransitions: StateTransitionRecord[] = []

  constructor(players: Unit[], enemies: Unit[], options: CombatEngineOptions = {}) {
    this.players = players
    this.enemies = enemies
    this.logger = new CombatLogger()
    this.combatTuning = options.combatTuning ?? DEFAULT_TUNING_CONFIG.combat
    this.stats = this.initializeStats()

    ;[...players, ...enemies].forEach(unit => {
      this.stateMachines.set(unit.id, new UnitStateMachine(unit))
    })
  }

  startCombat(): void {
    this.combatStartTime = Date.now()
    this.logger.logPhase('战斗开始', '双方进入战场')

    ;[...this.players, ...this.enemies].forEach(unit => {
      this.logger.log({
        type: 'phase',
        details: `${unit.name} 加入战斗 (HP: ${unit.hp}/${unit.stats.maxHp})`,
      })
    })
  }

  executeTurn(): boolean {
    this.turnCount += 1
    this.logger.setTurn(this.turnCount)
    this.logger.logPhase(`回合 ${this.turnCount}`, '回合开始')

    this.handleTurnStart()

    for (const unit of this.calculateActionOrder()) {
      if (unit.hp <= 0) continue

      if (unit.state === 'stunned') {
        this.logger.log({
          type: 'stateChange',
          actor: unit.name,
          details: `${unit.name} 处于眩晕状态，无法行动`,
        })
        continue
      }

      this.executeUnitAction(unit)
      if (this.checkCombatEnd()) return true
    }

    this.handleTurnEnd()
    return this.checkCombatEnd()
  }

  getCombatResult(): CombatResult {
    const playersAlive = this.players.filter(player => player.hp > 0)
    const victory = playersAlive.length > 0

    this.stats.turnCount = this.turnCount
    this.stats.duration = Date.now() - this.combatStartTime
    this.logger.logPhase('战斗结束', victory ? '玩家胜利' : '玩家失败')

    return {
      victory,
      survivors: playersAlive,
      stats: this.stats,
      log: this.logger.getLogs(),
      keyMoments: this.findKeyMoments(),
    }
  }

  getCurrentState() {
    return {
      turnCount: this.turnCount,
      players: this.players,
      enemies: this.enemies,
      logs: this.logger.getRecentLogs(10),
    }
  }

  getCurrentTurn(): number {
    return this.turnCount
  }

  getPlayers(): Unit[] {
    return this.players
  }

  getEnemies(): Unit[] {
    return this.enemies
  }

  getLog(): CombatLogEntry[] {
    return this.logger.getLogs()
  }

  isCompleted(): boolean {
    return this.checkCombatEnd()
  }

  getDebugSnapshot(): CombatDebugSnapshot {
    return {
      aiDecisions: this.aiDecisions.slice(-10),
      stateTransitions: this.stateTransitions.slice(-10),
      damageFormula: this.getDamageFormula(),
      randomSource: 'Math.random()',
      tuning: this.combatTuning,
    }
  }

  private initializeStats(): CombatStats {
    const stats: CombatStats = {
      totalDamageDealt: {},
      totalDamageTaken: {},
      totalHealing: {},
      skillUsageCount: {},
      killCount: {},
      criticalHits: {},
      turnCount: 0,
      duration: 0,
    }

    ;[...this.players, ...this.enemies].forEach(unit => {
      stats.totalDamageDealt[unit.id] = 0
      stats.totalDamageTaken[unit.id] = 0
      stats.totalHealing[unit.id] = 0
      stats.killCount[unit.id] = 0
      stats.criticalHits[unit.id] = 0
    })

    return stats
  }

  private handleTurnStart(): void {
    ;[...this.players, ...this.enemies].forEach(unit => {
      if (unit.hp <= 0) return

      const { expired } = BuffSystem.updateBuffDurations(unit)
      expired.forEach(buff => {
        this.logger.log({
          type: 'buff',
          target: unit.name,
          details: `${unit.name} 的 ${buff.name} 效果消失`,
        })
      })

      const effects = BuffSystem.triggerBuffEffects(unit, 'onTurnStart')

      if (effects.damage > 0) {
        const result = DamageCalculator.applyDamage(unit, effects.damage)
        this.logger.log({
          type: 'damage',
          target: unit.name,
          value: result.actualDamage,
          details: `${unit.name} 受到持续伤害 ${result.actualDamage} 点`,
        })

        if (unit.hp <= 0) this.handleUnitDeath(unit, unit)
      }

      if (effects.healing > 0) {
        const actualHealing = DamageCalculator.applyHealing(unit, effects.healing)
        this.logger.log({
          type: 'heal',
          target: unit.name,
          value: actualHealing,
          details: `${unit.name} 持续恢复 ${actualHealing} 点生命`,
        })
      }
    })
  }

  private calculateActionOrder(): Unit[] {
    return [...this.players, ...this.enemies]
      .filter(unit => unit.hp > 0)
      .sort((a, b) => b.stats.speed - a.stats.speed)
  }

  private executeUnitAction(unit: Unit): void {
    const stateMachine = this.stateMachines.get(unit.id)
    if (!stateMachine || !stateMachine.canAct()) return

    this.transitionUnit(unit, stateMachine, 'choosing_target', '开始选择技能和目标')

    const decision = unit.type === 'enemy'
      ? this.executeEnemyAI(unit)
      : this.executePlayerAI(unit)

    if (!decision || decision.targets.length === 0) {
      this.transitionUnit(unit, stateMachine, 'idle', '没有可用技能或目标')
      return
    }

    if (unit.type === 'enemy') {
      this.aiDecisions.push({
        turn: this.turnCount,
        unit: unit.name,
        skill: decision.skill.name,
        targets: decision.targets.map(target => target.name),
        reason: decision.reason,
        path: decision.path,
      })
    }

    this.transitionUnit(unit, stateMachine, 'casting', `释放 ${decision.skill.name}`)
    this.executeSkill(unit, decision.skill, decision.targets, decision.reason)
    decision.skill.currentCooldown = decision.skill.cooldown
    this.transitionUnit(unit, stateMachine, 'recovering', '技能后摇')
    this.transitionUnit(unit, stateMachine, 'idle', '行动结束')
  }

  private executePlayerAI(unit: Unit): ActionDecision | null {
    const skill = this.selectSkill(unit)
    if (!skill) return null

    const allies = unit.type === 'player' ? this.players : this.enemies
    const enemies = unit.type === 'player' ? this.enemies : this.players
    const selectedTargets = TargetSelector.selectTarget(unit, allies, enemies, skill.targetRule)
    const targets = selectedTargets ? (Array.isArray(selectedTargets) ? selectedTargets : [selectedTargets]) : []

    return {
      skill,
      targets,
      reason: `选择当前可用技能中威力最高的 ${skill.name}`,
      path: ['Player auto', 'available skills', 'highest power'],
    }
  }

  private executeEnemyAI(unit: Unit): ActionDecision | null {
    const allies = this.enemies
    const enemies = this.players
    const context: AIContext = {
      self: unit,
      allies,
      enemies,
      turnNumber: this.turnCount,
    }
    const behaviorTree = getEnemyBehaviorTree(unit.name)
    const action = this.extractActionFromTree(behaviorTree, context)

    if (!action) return null

    const targets = Array.isArray(action.target) ? action.target : [action.target]
    const explanation = this.describeEnemyDecision(unit, action.skill, targets, enemies)

    return {
      skill: action.skill,
      targets,
      reason: explanation.reason,
      path: explanation.path,
    }
  }

  private extractActionFromTree(node: any, context: AIContext): { skill: Skill; target: Unit | Unit[] } | null {
    if (node && typeof node.getAction === 'function') {
      return node.getAction(context)
    }

    if (!node || typeof node.execute !== 'function') return null

    const result = node.execute(context)
    if (result === 'success' && typeof node.getChildren === 'function') {
      for (const child of node.getChildren()) {
        const action = this.extractActionFromTree(child, context)
        if (action) return action
      }
    }

    return null
  }

  private describeEnemyDecision(unit: Unit, skill: Skill, targets: Unit[], possibleTargets: Unit[]) {
    const aliveTargets = possibleTargets.filter(target => target.hp > 0)
    const hasLowHpTarget = aliveTargets.some(target => target.hp / target.stats.maxHp < 0.4)
    const hasBackRowTarget = aliveTargets.some(target => target.position === 'back')
    const targetNames = targets.map(target => target.name).join(', ')

    if (unit.role === 'tank' && hasLowHpTarget && skill.power >= 2) {
      return {
        reason: `检测到低血量目标，使用高威力技能集火 ${targetNames}`,
        path: ['Selector', 'low hp target condition', 'heavy strike action'],
      }
    }

    if (unit.role === 'dps' && hasBackRowTarget) {
      return {
        reason: `后排目标存在，优先压制 ${targetNames}`,
        path: ['Selector', 'back row condition', 'pierce or shoot action'],
      }
    }

    if (unit.role === 'mage' && hasLowHpTarget) {
      return {
        reason: `发现可收割目标，选择 ${skill.name} 攻击 ${targetNames}`,
        path: ['Selector', 'focus low hp condition', 'magic action'],
      }
    }

    return {
      reason: `没有触发特殊条件，按默认规则攻击 ${targetNames}`,
      path: ['Selector', 'default action'],
    }
  }

  private selectSkill(unit: Unit): Skill | null {
    const availableSkills = unit.skills.filter(skill => skill.currentCooldown === 0)
    if (availableSkills.length === 0) return null
    return availableSkills.reduce((best, skill) => best.power > skill.power ? best : skill)
  }

  private executeSkill(caster: Unit, skill: Skill, targets: Unit[], reason?: string): void {
    this.logger.logAction(caster.name, skill.name, targets.map(target => target.name).join(', '), reason)
    this.stats.skillUsageCount[skill.id] = (this.stats.skillUsageCount[skill.id] || 0) + 1

    targets.forEach(target => {
      if (target.hp <= 0) return

      skill.effects.forEach(effect => {
        switch (effect.type) {
          case 'damage':
            this.dealDamage(caster, target, skill.power)
            break
          case 'heal':
            this.dealHealing(caster, target, skill.power)
            break
          case 'shield':
            this.applyShield(target, effect.value)
            break
        }
      })
    })
  }

  private dealDamage(attacker: Unit, target: Unit, power: number): void {
    const isCrit = DamageCalculator.rollCritical(attacker.stats.critRate)
    const tunedPower = power * this.combatTuning.damageMultiplier
    const damage = DamageCalculator.calculateDamage(attacker, target, tunedPower, isCrit)
    const result = DamageCalculator.applyDamage(target, damage)

    this.logger.logDamage(attacker.name, target.name, result.actualDamage, isCrit, result.shieldDamage)
    this.stats.totalDamageDealt[attacker.id] += result.actualDamage
    this.stats.totalDamageTaken[target.id] += result.actualDamage
    attacker.damageDealt += result.actualDamage

    if (isCrit) {
      this.stats.criticalHits[attacker.id] = (this.stats.criticalHits[attacker.id] || 0) + 1
    }

    if (target.hp <= 0) this.handleUnitDeath(target, attacker)
  }

  private dealHealing(healer: Unit, target: Unit, power: number): void {
    const healing = DamageCalculator.calculateHealing(healer, power)
    const actualHealing = DamageCalculator.applyHealing(target, healing)

    this.logger.logHealing(healer.name, target.name, actualHealing)
    this.stats.totalHealing[healer.id] += actualHealing
    healer.healingDone += actualHealing
  }

  private applyShield(target: Unit, amount: number): void {
    DamageCalculator.applyShield(target, amount)
    this.logger.log({
      type: 'buff',
      target: target.name,
      details: `${target.name} 获得 ${amount} 点护盾`,
    })
  }

  private handleUnitDeath(unit: Unit, killer: Unit): void {
    unit.state = 'dead'
    this.logger.logDeath(unit.name)
    this.stats.killCount[killer.id] = (this.stats.killCount[killer.id] || 0) + 1
  }

  private handleTurnEnd(): void {
    ;[...this.players, ...this.enemies].forEach(unit => {
      if (unit.hp <= 0) return

      unit.skills.forEach(skill => {
        if (skill.currentCooldown > 0) skill.currentCooldown -= 1
      })
    })
  }

  private transitionUnit(unit: Unit, stateMachine: UnitStateMachine, to: UnitState, reason: string): void {
    const from = unit.state
    if (!stateMachine.transition(to)) return

    this.stateTransitions.push({
      turn: this.turnCount,
      unit: unit.name,
      from,
      to,
      reason,
    })
    this.logger.logStateChange(unit.name, from, to)
  }

  private checkCombatEnd(): boolean {
    const playersAlive = this.players.some(player => player.hp > 0)
    const enemiesAlive = this.enemies.some(enemy => enemy.hp > 0)
    return !playersAlive || !enemiesAlive
  }

  private findKeyMoments(): CombatLogEntry[] {
    return this.logger.getLogs().filter(log => log.type === 'death' || log.type === 'phase')
  }

  private getDamageFormula(): string {
    return `floor(skillPower × ${this.combatTuning.damageMultiplier.toFixed(1)} × attack × (1 - defense / (defense + 100)) × crit × buffModifier)`
  }
}
