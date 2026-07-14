import type { Unit, Skill, TargetRule } from '../types'

export class TargetSelector {
  /**
   * 根据规则选择目标
   */
  static selectTarget(
    caster: Unit,
    allies: Unit[],
    enemies: Unit[],
    rule: TargetRule
  ): Unit | Unit[] | null {
    switch (rule) {
      case 'self':
        return caster

      case 'random':
        return this.selectRandom(enemies)

      case 'lowest_hp':
        return this.selectLowestHp(enemies)

      case 'lowest_hp_percent':
        return this.selectLowestHpPercent(enemies)

      case 'highest_hp':
        return this.selectHighestHp(enemies)

      case 'highest_threat':
        return this.selectHighestThreat(enemies)

      case 'back_row':
        return this.selectBackRow(enemies)

      case 'front_row':
        return this.selectFrontRow(enemies)

      case 'all_enemies':
        return this.getAllAlive(enemies)

      case 'all_allies':
        return this.getAllAlive(allies)

      default:
        return this.selectRandom(enemies)
    }
  }

  private static getAllAlive(units: Unit[]): Unit[] {
    return units.filter(u => u.hp > 0)
  }

  private static selectRandom(units: Unit[]): Unit | null {
    const alive = this.getAllAlive(units)
    if (alive.length === 0) return null
    return alive[Math.floor(Math.random() * alive.length)]
  }

  private static selectLowestHp(units: Unit[]): Unit | null {
    const alive = this.getAllAlive(units)
    if (alive.length === 0) return null
    return alive.reduce((a, b) => a.hp < b.hp ? a : b)
  }

  private static selectLowestHpPercent(units: Unit[]): Unit | null {
    const alive = this.getAllAlive(units)
    if (alive.length === 0) return null
    return alive.reduce((a, b) => {
      const aPercent = a.hp / a.stats.maxHp
      const bPercent = b.hp / b.stats.maxHp
      return aPercent < bPercent ? a : b
    })
  }

  private static selectHighestHp(units: Unit[]): Unit | null {
    const alive = this.getAllAlive(units)
    if (alive.length === 0) return null
    return alive.reduce((a, b) => a.hp > b.hp ? a : b)
  }

  private static selectHighestThreat(units: Unit[]): Unit | null {
    const alive = this.getAllAlive(units)
    if (alive.length === 0) return null
    return alive.reduce((a, b) => a.threat > b.threat ? a : b)
  }

  private static selectBackRow(units: Unit[]): Unit | null {
    const alive = this.getAllAlive(units)
    const backRow = alive.filter(u => u.position === 'back')
    if (backRow.length > 0) {
      return backRow[Math.floor(Math.random() * backRow.length)]
    }
    // 如果没有后排，随机选择
    return this.selectRandom(alive)
  }

  private static selectFrontRow(units: Unit[]): Unit | null {
    const alive = this.getAllAlive(units)
    const frontRow = alive.filter(u => u.position === 'front')
    if (frontRow.length > 0) {
      return frontRow[Math.floor(Math.random() * frontRow.length)]
    }
    // 如果没有前排，随机选择
    return this.selectRandom(alive)
  }
}
