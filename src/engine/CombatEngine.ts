import type { Unit, Skill, CombatResult, CombatStats, CombatLogEntry, UnitState, AIContext } from '../types'
import { DamageCalculator } from './DamageCalculator'
import { TargetSelector } from './TargetSelector'
import { CombatLogger } from './CombatLogger'
import { UnitStateMachine } from '../systems/StateMachine'
import { BuffSystem } from '../systems/BuffSystem'
import { getEnemyBehaviorTree } from '../systems/BehaviorTree'

export class CombatEngine {
  private players: Unit[]
  private enemies: Unit[]
  private logger: CombatLogger
  private turnCount: number = 0
  private combatStartTime: number = 0
  private stats: CombatStats
  private stateMachines: Map<string, UnitStateMachine> = new Map()

  constructor(players: Unit[], enemies: Unit[]) {
    this.players = players
    this.enemies = enemies
    this.logger = new CombatLogger()
    this.turnCount = 0
    this.stats = this.initializeStats()

    // 初始化状态机
    const allUnits = [...players, ...enemies]
    allUnits.forEach(unit => {
      this.stateMachines.set(unit.id, new UnitStateMachine(unit))
    })
  }

  /**
   * 初始化统计数据
   */
  private initializeStats(): CombatStats {
    const allUnits = [...this.players, ...this.enemies]
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

    allUnits.forEach(unit => {
      stats.totalDamageDealt[unit.id] = 0
      stats.totalDamageTaken[unit.id] = 0
      stats.totalHealing[unit.id] = 0
      stats.killCount[unit.id] = 0
      stats.criticalHits[unit.id] = 0
    })

    return stats
  }

  /**
   * 开始战斗
   */
  startCombat(): void {
    this.combatStartTime = Date.now()
    this.logger.logPhase('战斗开始', '双方进入战场')

    // 记录初始状态
    this.players.forEach(unit => {
      this.logger.log({
        type: 'phase',
        details: `${unit.name} 加入战斗 (HP: ${unit.hp}/${unit.stats.maxHp})`,
      })
    })

    this.enemies.forEach(unit => {
      this.logger.log({
        type: 'phase',
        details: `${unit.name} 加入战斗 (HP: ${unit.hp}/${unit.stats.maxHp})`,
      })
    })
  }

  /**
   * 执行一个回合
   */
  executeTurn(): boolean {
    this.turnCount++
    this.logger.setTurn(this.turnCount)
    this.logger.logPhase(`回合 ${this.turnCount}`, '回合开始')

    // 1. 回合开始处理
    this.handleTurnStart()

    // 2. 按速度排序，决定行动顺序
    const actionOrder = this.calculateActionOrder()

    // 3. 执行每个单位的行动
    for (const unit of actionOrder) {
      if (unit.hp <= 0) continue // 死亡单位跳过
      if (unit.state === 'stunned') {
        this.logger.log({
          type: 'stateChange',
          actor: unit.name,
          details: `${unit.name} 处于眩晕状态，无法行动`,
        })
        continue
      }

      this.executeUnitAction(unit)

      // 检查战斗是否结束
      if (this.checkCombatEnd()) {
        return true
      }
    }

    // 4. 回合结束处理
    this.handleTurnEnd()

    // 5. 检查战斗是否结束
    return this.checkCombatEnd()
  }

  /**
   * 回合开始处理
   */
  private handleTurnStart(): void {
    const allUnits = [...this.players, ...this.enemies]

    allUnits.forEach(unit => {
      if (unit.hp <= 0) return

      // 更新 Buff 持续时间
      const { expired } = BuffSystem.updateBuffDurations(unit)
      expired.forEach(buff => {
        this.logger.log({
          type: 'buff',
          target: unit.name,
          details: `${unit.name} 的 ${buff.name} 效果消失`,
        })
      })

      // 触发回合开始效果（中毒、燃烧等）
      const effects = BuffSystem.triggerBuffEffects(unit, 'onTurnStart')

      if (effects.damage > 0) {
        const result = DamageCalculator.applyDamage(unit, effects.damage)
        this.logger.log({
          type: 'damage',
          target: unit.name,
          value: result.actualDamage,
          details: `${unit.name} 受到持续伤害 ${result.actualDamage} 点`,
        })

        if (unit.hp <= 0) {
          this.handleUnitDeath(unit, unit) // 自身造成的死亡
        }
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

  /**
   * 计算行动顺序
   */
  private calculateActionOrder(): Unit[] {
    const allUnits = [...this.players, ...this.enemies].filter(u => u.hp > 0)
    return allUnits.sort((a, b) => b.stats.speed - a.stats.speed)
  }

  /**
   * 执行单位行动
   */
  private executeUnitAction(unit: Unit): void {
    const stateMachine = this.stateMachines.get(unit.id)
    if (!stateMachine || !stateMachine.canAct()) return

    // 状态转换：idle -> choosing_target
    stateMachine.transition('choosing_target')

    // 1. 选择技能和目标
    const allies = unit.type === 'player' ? this.players : this.enemies
    const enemies = unit.type === 'player' ? this.enemies : this.players

    let skill: Skill | null = null
    let targets: Unit[] = []

    if (unit.type === 'enemy') {
      // 使用行为树决策
      const result = this.executeEnemyAI(unit, allies, enemies)
      if (result) {
        skill = result.skill
        targets = Array.isArray(result.target) ? result.target : [result.target]
      }
    } else {
      // 玩家简单 AI
      skill = this.selectSkill(unit)
      if (skill) {
        const selectedTargets = TargetSelector.selectTarget(unit, allies, enemies, skill.targetRule)
        targets = selectedTargets ? (Array.isArray(selectedTargets) ? selectedTargets : [selectedTargets]) : []
      }
    }

    if (!skill || targets.length === 0) {
      stateMachine.transition('idle')
      return
    }

    // 状态转换：choosing_target -> casting
    stateMachine.transition('casting')

    // 2. 执行技能
    this.executeSkill(unit, skill, targets)

    // 3. 更新技能冷却
    skill.currentCooldown = skill.cooldown

    // 状态转换：casting -> recovering -> idle
    stateMachine.transition('recovering')
    stateMachine.transition('idle')
  }

  /**
   * 选择技能
   */
  private selectSkill(unit: Unit): Skill | null {
    // 简单 AI：优先使用冷却完成的技能
    const availableSkills = unit.skills.filter(s => s.currentCooldown === 0)

    if (availableSkills.length === 0) return null

    // 优先使用威力最高的技能
    return availableSkills.reduce((a, b) => a.power > b.power ? a : b)
  }

  /**
   * 执行技能
   */
  private executeSkill(caster: Unit, skill: Skill, targets: Unit[]): void {
    this.logger.logAction(
      caster.name,
      skill.name,
      targets.map(t => t.name).join(', ')
    )

    // 记录技能使用次数
    this.stats.skillUsageCount[skill.id] = (this.stats.skillUsageCount[skill.id] || 0) + 1

    // 对每个目标执行效果
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
          // TODO: 实现其他效果类型
        }
      })
    })
  }

  /**
   * 造成伤害
   */
  private dealDamage(attacker: Unit, target: Unit, power: number): void {
    // 判断暴击
    const isCrit = DamageCalculator.rollCritical(attacker.stats.critRate)

    // 计算伤害
    const damage = DamageCalculator.calculateDamage(attacker, target, power, isCrit)

    // 应用伤害
    const result = DamageCalculator.applyDamage(target, damage)

    // 记录日志
    this.logger.logDamage(
      attacker.name,
      target.name,
      result.actualDamage,
      isCrit,
      result.shieldDamage
    )

    // 更新统计
    this.stats.totalDamageDealt[attacker.id] += result.actualDamage
    this.stats.totalDamageTaken[target.id] += result.actualDamage
    if (isCrit) {
      this.stats.criticalHits[attacker.id] = (this.stats.criticalHits[attacker.id] || 0) + 1
    }

    attacker.damageDealt += result.actualDamage

    // 检查死亡
    if (target.hp <= 0) {
      this.handleUnitDeath(target, attacker)
    }
  }

  /**
   * 治疗
   */
  private dealHealing(healer: Unit, target: Unit, power: number): void {
    const healing = DamageCalculator.calculateHealing(healer, power)
    const actualHealing = DamageCalculator.applyHealing(target, healing)

    this.logger.logHealing(healer.name, target.name, actualHealing)

    this.stats.totalHealing[healer.id] += actualHealing
    healer.healingDone += actualHealing
  }

  /**
   * 应用护盾
   */
  private applyShield(target: Unit, amount: number): void {
    DamageCalculator.applyShield(target, amount)
    this.logger.log({
      type: 'buff',
      target: target.name,
      details: `${target.name} 获得 ${amount} 点护盾`,
    })
  }

  /**
   * 处理单位死亡
   */
  private handleUnitDeath(unit: Unit, killer: Unit): void {
    unit.state = 'dead' as UnitState
    this.logger.logDeath(unit.name)
    this.stats.killCount[killer.id] = (this.stats.killCount[killer.id] || 0) + 1
  }

  /**
   * 回合结束处理
   */
  private handleTurnEnd(): void {
    const allUnits = [...this.players, ...this.enemies]

    allUnits.forEach(unit => {
      if (unit.hp <= 0) return

      // 减少技能冷却
      unit.skills.forEach(skill => {
        if (skill.currentCooldown > 0) {
          skill.currentCooldown--
        }
      })
    })
  }

  /**
   * 检查战斗是否结束
   */
  private checkCombatEnd(): boolean {
    const playersAlive = this.players.some(p => p.hp > 0)
    const enemiesAlive = this.enemies.some(e => e.hp > 0)

    return !playersAlive || !enemiesAlive
  }

  /**
   * 获取战斗结果
   */
  getCombatResult(): CombatResult {
    const playersAlive = this.players.filter(p => p.hp > 0)
    const victory = playersAlive.length > 0

    this.stats.turnCount = this.turnCount
    this.stats.duration = Date.now() - this.combatStartTime

    this.logger.logPhase(
      '战斗结束',
      victory ? '玩家胜利！' : '玩家失败...'
    )

    return {
      victory,
      survivors: playersAlive,
      stats: this.stats,
      log: this.logger.getLogs(),
      keyMoments: this.findKeyMoments(),
    }
  }

  /**
   * 查找关键时刻
   */
  private findKeyMoments(): CombatLogEntry[] {
    const logs = this.logger.getLogs()
    return logs.filter(log => log.type === 'death' || log.type === 'phase')
  }

  /**
   * 执行敌人 AI 决策
   */
  private executeEnemyAI(unit: Unit, allies: Unit[], enemies: Unit[]): { skill: Skill; target: Unit | Unit[] } | null {
    const behaviorTree = getEnemyBehaviorTree(unit.name)
    const context: AIContext = {
      self: unit,
      allies,
      enemies,
      turnNumber: this.turnCount,
    }

    // 执行行为树获取行动
    return this.extractActionFromTree(behaviorTree, context)
  }

  /**
   * 从行为树中提取行动
   */
  private extractActionFromTree(node: any, context: AIContext): { skill: Skill; target: Unit | Unit[] } | null {
    // 如果是 Action 节点（检查 getAction 方法而不是 instanceof）
    if (node && typeof node.getAction === 'function') {
      return node.getAction(context)
    }

    // 如果是组合节点，执行并查找成功的 Action
    const result = node.execute(context)

    if (result === 'success' && node && typeof node.getChildren === 'function') {
      for (const child of node.getChildren()) {
        const action = this.extractActionFromTree(child, context)
        if (action) return action
      }
    }

    return null
  }

  /**
   * 获取当前战斗状态
   */
  getCurrentState() {
    return {
      turnCount: this.turnCount,
      players: this.players,
      enemies: this.enemies,
      logs: this.logger.getRecentLogs(10),
    }
  }
}
