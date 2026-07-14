import type { Unit } from '../types'

export class DamageCalculator {
  // 防御公式常量
  private static readonly DEFENSE_CONSTANT = 100
  private static readonly MAX_DEFENSE_REDUCTION = 0.75
  private static readonly MIN_DAMAGE = 1

  /**
   * 计算最终伤害
   */
  static calculateDamage(
    attacker: Unit,
    target: Unit,
    basePower: number,
    isCrit: boolean = false
  ): number {
    // 1. 基础伤害
    const baseDamage = basePower * attacker.stats.attack

    // 2. 防御减免
    const defenseReduction = this.calculateDefenseReduction(target.stats.defense)

    // 3. 暴击倍率
    const critMultiplier = isCrit ? attacker.stats.critDamage : 1.0

    // 4. 计算最终伤害
    let finalDamage = baseDamage * (1 - defenseReduction) * critMultiplier

    // 5. 应用 Buff 修正（攻击提升、易伤等）
    finalDamage *= this.getDamageModifier(attacker, target)

    // 6. 确保最低伤害
    return Math.max(Math.floor(finalDamage), this.MIN_DAMAGE)
  }

  /**
   * 计算防御减免率
   */
  private static calculateDefenseReduction(defense: number): number {
    const reduction = defense / (defense + this.DEFENSE_CONSTANT)
    return Math.min(reduction, this.MAX_DEFENSE_REDUCTION)
  }

  /**
   * 获取伤害修正倍率（来自 Buff）
   */
  private static getDamageModifier(attacker: Unit, target: Unit): number {
    let modifier = 1.0

    // 攻击者的增伤 Buff
    attacker.buffs.forEach(buff => {
      if (buff.type === 'buff') {
        buff.effects.forEach(effect => {
          if (effect.type === 'damage' && effect.trigger === 'onHit') {
            modifier += effect.value / 100
          }
        })
      }
    })

    // 目标的易伤 Debuff
    target.buffs.forEach(buff => {
      if (buff.type === 'debuff') {
        buff.effects.forEach(effect => {
          if (effect.type === 'damage' && effect.trigger === 'onDamaged') {
            modifier += effect.value / 100
          }
        })
      }
    })

    return modifier
  }

  /**
   * 判断是否暴击
   */
  static rollCritical(critRate: number): boolean {
    return Math.random() < critRate
  }

  /**
   * 应用伤害到目标（考虑护盾）
   */
  static applyDamage(target: Unit, damage: number): {
    hpDamage: number
    shieldDamage: number
    actualDamage: number
  } {
    let remainingDamage = damage
    let shieldDamage = 0
    let hpDamage = 0

    // 先扣护盾
    if (target.shield > 0) {
      shieldDamage = Math.min(target.shield, remainingDamage)
      target.shield -= shieldDamage
      remainingDamage -= shieldDamage
    }

    // 再扣生命
    if (remainingDamage > 0) {
      hpDamage = Math.min(target.hp, remainingDamage)
      target.hp -= hpDamage
    }

    const actualDamage = shieldDamage + hpDamage

    // 更新统计
    target.damageTaken += actualDamage

    return { hpDamage, shieldDamage, actualDamage }
  }

  /**
   * 计算治疗量
   */
  static calculateHealing(healer: Unit, basePower: number): number {
    const baseHealing = basePower * healer.stats.attack * 0.5 // 治疗倍率

    // 应用治疗增强 Buff
    let modifier = 1.0
    healer.buffs.forEach(buff => {
      if (buff.type === 'buff') {
        buff.effects.forEach(effect => {
          if (effect.type === 'heal') {
            modifier += effect.value / 100
          }
        })
      }
    })

    return Math.floor(baseHealing * modifier)
  }

  /**
   * 应用治疗
   */
  static applyHealing(target: Unit, healing: number): number {
    const actualHealing = Math.min(healing, target.stats.maxHp - target.hp)
    target.hp += actualHealing
    return actualHealing
  }

  /**
   * 应用护盾
   */
  static applyShield(target: Unit, shieldAmount: number): void {
    target.shield += shieldAmount
  }
}
