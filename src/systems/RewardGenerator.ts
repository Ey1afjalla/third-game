import type { Reward, Equipment, Relic, RewardType, EquipmentSlot, Rarity } from '../types/dungeon'
import type { UnitStats } from '../types'

export class RewardGenerator {
  /**
   * 生成战斗后的三选一奖励
   */
  generateBattleRewards(isElite: boolean = false): Reward[] {
    const rewards: Reward[] = []

    // 奖励1：装备
    rewards.push({
      type: 'equipment',
      item: this.generateEquipment(isElite ? 'rare' : 'common'),
    })

    // 奖励2：遗物或金币
    if (Math.random() < 0.6) {
      rewards.push({
        type: 'relic',
        item: this.generateRelic(isElite ? 'rare' : 'common'),
      })
    } else {
      rewards.push({
        type: 'gold',
        amount: isElite ? 100 : 50,
      })
    }

    // 奖励3：治疗或装备
    if (Math.random() < 0.5) {
      rewards.push({
        type: 'heal',
        amount: isElite ? 50 : 30,
      })
    } else {
      rewards.push({
        type: 'equipment',
        item: this.generateEquipment('common'),
      })
    }

    return rewards
  }

  /**
   * 生成装备
   */
  private generateEquipment(minRarity: Rarity = 'common'): Equipment {
    const rarity = this.rollRarity(minRarity)
    const slot = this.randomSlot()

    const equipmentPool = this.getEquipmentPool(slot, rarity)
    return equipmentPool[Math.floor(Math.random() * equipmentPool.length)]
  }

  /**
   * 生成遗物
   */
  private generateRelic(minRarity: Rarity = 'common'): Relic {
    const rarity = this.rollRarity(minRarity)
    const relicPool = this.getRelicPool(rarity)
    return relicPool[Math.floor(Math.random() * relicPool.length)]
  }

  /**
   * 随机稀有度
   */
  private rollRarity(minRarity: Rarity): Rarity {
    const rarities: Rarity[] = ['common', 'rare', 'epic', 'legendary']
    const minIndex = rarities.indexOf(minRarity)

    const roll = Math.random()
    if (roll < 0.6) return rarities[minIndex] // 60% 最低稀有度
    if (roll < 0.85 && minIndex + 1 < rarities.length) return rarities[minIndex + 1] // 25% 更高一级
    if (roll < 0.95 && minIndex + 2 < rarities.length) return rarities[minIndex + 2] // 10% 更高两级
    return rarities[Math.min(minIndex + 3, rarities.length - 1)] // 5% 最高
  }

  /**
   * 随机装备槽位
   */
  private randomSlot(): EquipmentSlot {
    const slots: EquipmentSlot[] = ['weapon', 'armor', 'accessory']
    return slots[Math.floor(Math.random() * slots.length)]
  }

  /**
   * 获取装备池
   */
  private getEquipmentPool(slot: EquipmentSlot, rarity: Rarity): Equipment[] {
    // 这里返回预定义的装备
    // 实际应该从配置文件读取
    if (slot === 'weapon') {
      return [
        {
          id: 'iron_sword',
          name: '铁剑',
          slot: 'weapon',
          rarity: 'common',
          stats: { attack: 5 },
          description: '普通的铁剑',
        },
        {
          id: 'steel_sword',
          name: '钢剑',
          slot: 'weapon',
          rarity: 'rare',
          stats: { attack: 10 },
          description: '锋利的钢剑',
        },
      ]
    } else if (slot === 'armor') {
      return [
        {
          id: 'leather_armor',
          name: '皮甲',
          slot: 'armor',
          rarity: 'common',
          stats: { defense: 5 },
          description: '基础的皮甲',
        },
        {
          id: 'chain_mail',
          name: '锁子甲',
          slot: 'armor',
          rarity: 'rare',
          stats: { defense: 10, maxHp: 20 },
          description: '坚固的锁子甲',
        },
      ]
    } else {
      return [
        {
          id: 'ring_of_speed',
          name: '速度之戒',
          slot: 'accessory',
          rarity: 'rare',
          stats: { speed: 3 },
          description: '提升行动速度',
        },
      ]
    }
  }

  /**
   * 获取遗物池
   */
  private getRelicPool(rarity: Rarity): Relic[] {
    return [
      {
        id: 'blood_ruby',
        name: '血红宝石',
        rarity: 'rare',
        effect: 'lifesteal',
        description: '每次攻击回复5%造成的伤害',
      },
      {
        id: 'stone_heart',
        name: '石心',
        rarity: 'common',
        effect: 'hp_boost',
        description: '最大生命+50，防御+10',
      },
      {
        id: 'phoenix_feather',
        name: '凤凰羽毛',
        rarity: 'legendary',
        effect: 'revive',
        description: '首次死亡时复活，回复50%生命（每局限一次）',
      },
    ]
  }

  /**
   * 应用装备到角色
   */
  applyEquipment(unitStats: UnitStats, equipment: Equipment): UnitStats {
    const newStats = { ...unitStats }

    Object.keys(equipment.stats).forEach(key => {
      const statKey = key as keyof UnitStats
      const value = equipment.stats[statKey]
      if (value !== undefined) {
        newStats[statKey] = (newStats[statKey] as number) + (value as number)
      }
    })

    return newStats
  }
}
