import type { CombatLogEntry } from '../types'

export class CombatLogger {
  private logs: CombatLogEntry[] = []
  private currentTurn: number = 0

  constructor() {
    this.logs = []
    this.currentTurn = 0
  }

  /**
   * 设置当前回合
   */
  setTurn(turn: number): void {
    this.currentTurn = turn
  }

  /**
   * 添加日志
   */
  log(entry: Omit<CombatLogEntry, 'turn' | 'timestamp'>): void {
    this.logs.push({
      ...entry,
      turn: this.currentTurn,
      timestamp: Date.now(),
    })
  }

  /**
   * 记录行动
   */
  logAction(actor: string, skill: string, target: string, reason?: string): void {
    this.log({
      type: 'action',
      actor,
      skill,
      target,
      details: `${actor} 对 ${target} 使用 ${skill}`,
      reason,
    })
  }

  /**
   * 记录伤害
   */
  logDamage(
    actor: string,
    target: string,
    damage: number,
    isCrit: boolean = false,
    shieldDamage: number = 0
  ): void {
    let details = `${target} 受到 ${damage} 点伤害`
    if (isCrit) {
      details += '（暴击！）'
    }
    if (shieldDamage > 0) {
      details += `，护盾吸收 ${shieldDamage} 点`
    }

    this.log({
      type: 'damage',
      actor,
      target,
      value: damage,
      details,
    })
  }

  /**
   * 记录治疗
   */
  logHealing(healer: string, target: string, healing: number): void {
    this.log({
      type: 'heal',
      actor: healer,
      target,
      value: healing,
      details: `${target} 恢复 ${healing} 点生命`,
    })
  }

  /**
   * 记录 Buff
   */
  logBuff(target: string, buffName: string, isDebuff: boolean = false): void {
    const type = isDebuff ? 'Debuff' : 'Buff'
    this.log({
      type: 'buff',
      target,
      details: `${target} 获得 ${type}：${buffName}`,
    })
  }

  /**
   * 记录死亡
   */
  logDeath(unitName: string): void {
    this.log({
      type: 'death',
      target: unitName,
      details: `${unitName} 已阵亡`,
    })
  }

  /**
   * 记录状态变化
   */
  logStateChange(unitName: string, oldState: string, newState: string): void {
    this.log({
      type: 'stateChange',
      actor: unitName,
      details: `${unitName} 状态：${oldState} → ${newState}`,
    })
  }

  /**
   * 记录阶段变化
   */
  logPhase(phaseName: string, details: string): void {
    this.log({
      type: 'phase',
      details: `【${phaseName}】${details}`,
    })
  }

  /**
   * 获取所有日志
   */
  getLogs(): CombatLogEntry[] {
    return [...this.logs]
  }

  /**
   * 获取最近的日志
   */
  getRecentLogs(count: number = 10): CombatLogEntry[] {
    return this.logs.slice(-count)
  }

  /**
   * 清空日志
   */
  clear(): void {
    this.logs = []
    this.currentTurn = 0
  }

  /**
   * 导出日志为文本
   */
  exportText(): string {
    return this.logs
      .map(entry => {
        const prefix = `[回合 ${entry.turn}]`
        let text = `${prefix} ${entry.details}`
        if (entry.reason) {
          text += ` (${entry.reason})`
        }
        return text
      })
      .join('\n')
  }
}
