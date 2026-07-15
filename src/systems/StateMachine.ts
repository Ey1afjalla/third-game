import type { Unit, UnitState } from '../types'

export class UnitStateMachine {
  private unit: Unit

  constructor(unit: Unit) {
    this.unit = unit
  }

  /**
   * 转换状态
   */
  transition(newState: UnitState): boolean {
    if (!this.canTransition(this.unit.state, newState)) {
      return false
    }

    this.unit.state = newState

    return true
  }

  /**
   * 检查是否可以转换状态
   */
  private canTransition(from: UnitState, to: UnitState): boolean {
    // 死亡状态无法转换
    if (from === 'dead') return false

    // 任何状态都可以转换为死亡或眩晕
    if (to === 'dead' || to === 'stunned') return true

    // 眩晕状态只能转到 idle
    if (from === 'stunned') {
      return to === 'idle'
    }

    // 其他转换规则
    const validTransitions: Record<UnitState, UnitState[]> = {
      idle: ['choosing_target'],
      choosing_target: ['casting', 'idle'],
      casting: ['recovering'],
      recovering: ['idle'],
      stunned: ['idle'],
      dead: [],
    }

    return validTransitions[from]?.includes(to) ?? false
  }

  /**
   * 获取当前状态
   */
  getCurrentState(): UnitState {
    return this.unit.state
  }

  /**
   * 检查是否可以行动
   */
  canAct(): boolean {
    return this.unit.hp > 0 &&
           this.unit.state !== 'dead' &&
           this.unit.state !== 'stunned'
  }
}
