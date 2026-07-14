import type { Unit, Buff } from '../types'

export class BuffSystem {
  /**
   * 添加 Buff/Debuff
   */
  static addBuff(target: Unit, buff: Buff): void {
    // 检查是否已存在相同 ID 的 Buff
    const existingIndex = target.buffs.findIndex(b => b.id === buff.id)

    if (existingIndex >= 0) {
      const existing = target.buffs[existingIndex]

      // 如果可以叠加
      if (existing.stackCount < existing.maxStack) {
        existing.stackCount++
        existing.duration = buff.duration // 刷新持续时间
      } else {
        // 已达最大层数，只刷新持续时间
        existing.duration = buff.duration
      }
    } else {
      // 添加新 Buff
      target.buffs.push({ ...buff })
    }
  }

  /**
   * 移除 Buff
   */
  static removeBuff(target: Unit, buffId: string): void {
    target.buffs = target.buffs.filter(b => b.id !== buffId)
  }

  /**
   * 更新所有 Buff 持续时间
   */
  static updateBuffDurations(unit: Unit): { expired: Buff[] } {
    const expired: Buff[] = []

    unit.buffs = unit.buffs.filter(buff => {
      if (buff.duration > 0) {
        buff.duration--
        if (buff.duration === 0) {
          expired.push(buff)
          return false
        }
      }
      return true
    })

    return { expired }
  }

  /**
   * 触发特定时机的 Buff 效果
   */
  static triggerBuffEffects(
    unit: Unit,
    trigger: 'onTurnStart' | 'onAction' | 'onHit' | 'onDamaged' | 'onTurnEnd',
    value?: number
  ): { damage: number; healing: number; statModifiers: Record<string, number> } {
    let totalDamage = 0
    let totalHealing = 0
    const statModifiers: Record<string, number> = {}

    unit.buffs.forEach(buff => {
      buff.effects.forEach(effect => {
        if (effect.trigger !== trigger) return

        switch (effect.type) {
          case 'damage':
            // 持续伤害（中毒、燃烧）
            if (trigger === 'onTurnStart') {
              totalDamage += effect.value
            }
            break

          case 'heal':
            // 持续治疗
            if (trigger === 'onTurnStart') {
              totalHealing += effect.value
            }
            break

          case 'stat':
            // 属性修正
            if (effect.stat) {
              statModifiers[effect.stat] = (statModifiers[effect.stat] || 0) + effect.value
            }
            break
        }
      })
    })

    return { damage: totalDamage, healing: totalHealing, statModifiers }
  }

  /**
   * 获取属性修正值
   */
  static getStatModifier(unit: Unit, stat: string): number {
    let modifier = 0

    unit.buffs.forEach(buff => {
      buff.effects.forEach(effect => {
        if (effect.type === 'stat' && effect.stat === stat) {
          modifier += effect.value
        }
      })
    })

    return modifier
  }

  /**
   * 检查是否有特定 Buff
   */
  static hasBuff(unit: Unit, buffId: string): boolean {
    return unit.buffs.some(b => b.id === buffId)
  }

  /**
   * 清除所有 Debuff
   */
  static clearDebuffs(unit: Unit): void {
    unit.buffs = unit.buffs.filter(b => b.type === 'buff')
  }

  /**
   * 清除所有 Buff
   */
  static clearBuffs(unit: Unit): void {
    unit.buffs = unit.buffs.filter(b => b.type === 'debuff')
  }
}
