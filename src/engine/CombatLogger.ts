import type { CombatLogEntry } from '../types'

export class CombatLogger {
  private logs: CombatLogEntry[] = []
  private currentTurn = 0

  setTurn(turn: number): void {
    this.currentTurn = turn
  }

  log(entry: Omit<CombatLogEntry, 'turn' | 'timestamp'>): void {
    this.logs.push({
      ...entry,
      turn: this.currentTurn,
      timestamp: Date.now(),
    })
  }

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

  logDamage(actor: string, target: string, damage: number, isCrit = false, shieldDamage = 0): void {
    let details = `${target} 受到 ${damage} 点伤害`
    if (isCrit) details += '（暴击）'
    if (shieldDamage > 0) details += `，护盾吸收 ${shieldDamage} 点`

    this.log({
      type: 'damage',
      actor,
      target,
      value: damage,
      details,
    })
  }

  logHealing(healer: string, target: string, healing: number): void {
    this.log({
      type: 'heal',
      actor: healer,
      target,
      value: healing,
      details: `${target} 恢复 ${healing} 点生命`,
    })
  }

  logBuff(target: string, buffName: string, isDebuff = false): void {
    const type = isDebuff ? 'Debuff' : 'Buff'
    this.log({
      type: 'buff',
      target,
      details: `${target} 获得 ${type}: ${buffName}`,
    })
  }

  logDeath(unitName: string): void {
    this.log({
      type: 'death',
      target: unitName,
      details: `${unitName} 已阵亡`,
    })
  }

  logStateChange(unitName: string, oldState: string, newState: string): void {
    this.log({
      type: 'stateChange',
      actor: unitName,
      details: `${unitName} 状态: ${oldState} -> ${newState}`,
    })
  }

  logPhase(phaseName: string, details: string): void {
    this.log({
      type: 'phase',
      details: `[${phaseName}] ${details}`,
    })
  }

  getLogs(): CombatLogEntry[] {
    return [...this.logs]
  }

  getRecentLogs(count = 10): CombatLogEntry[] {
    return this.logs.slice(-count)
  }

  clear(): void {
    this.logs = []
    this.currentTurn = 0
  }

  exportText(): string {
    return this.logs
      .map(entry => {
        const reason = entry.reason ? ` (${entry.reason})` : ''
        return `[回合 ${entry.turn}] ${entry.details}${reason}`
      })
      .join('\n')
  }
}
