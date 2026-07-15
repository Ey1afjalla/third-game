import type { UnitStats } from '../types'
import type { Equipment, EquipmentSlot, Rarity, Relic, Reward } from '../types/dungeon'
import { loadTuningConfig, type TuningConfig } from './TuningConfig'

export class RewardGenerator {
  private tuningConfig: TuningConfig

  constructor(tuningConfig: TuningConfig = loadTuningConfig()) {
    this.tuningConfig = tuningConfig
  }

  generateBattleRewards(isElite: boolean = false): Reward[] {
    const rewards: Reward[] = []
    const minRarity = isElite ? 'rare' : 'common'

    rewards.push({
      type: 'equipment',
      item: this.generateEquipment(minRarity),
    })

    if (Math.random() < this.tuningConfig.rewards.relicDropRate) {
      rewards.push({
        type: 'relic',
        item: this.generateRelic(minRarity),
      })
    } else {
      rewards.push({
        type: 'gold',
        amount: this.scaleGold(isElite ? 100 : 50),
      })
    }

    if (Math.random() < this.tuningConfig.rewards.equipmentDropRate) {
      rewards.push({
        type: 'equipment',
        item: this.generateEquipment('common'),
      })
    } else {
      rewards.push({
        type: 'heal',
        amount: isElite ? 50 : 30,
      })
    }

    return rewards
  }

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

  private scaleGold(amount: number): number {
    return Math.max(1, Math.round(amount * this.tuningConfig.rewards.goldMultiplier))
  }

  private generateEquipment(minRarity: Rarity = 'common'): Equipment {
    const rarity = this.rollRarity(minRarity)
    const slot = this.randomSlot()
    const equipmentPool = this.getEquipmentPool(slot)
    const rarityPool = equipmentPool.filter(item => item.rarity === rarity)
    const pool = rarityPool.length > 0 ? rarityPool : equipmentPool

    return pool[Math.floor(Math.random() * pool.length)]
  }

  private generateRelic(minRarity: Rarity = 'common'): Relic {
    const rarity = this.rollRarity(minRarity)
    const relicPool = this.getRelicPool()
    const rarityPool = relicPool.filter(item => item.rarity === rarity)
    const pool = rarityPool.length > 0 ? rarityPool : relicPool

    return pool[Math.floor(Math.random() * pool.length)]
  }

  private rollRarity(minRarity: Rarity): Rarity {
    const rarities: Rarity[] = ['common', 'rare', 'epic', 'legendary']
    const minIndex = rarities.indexOf(minRarity)
    const roll = Math.random()

    if (roll < 0.6) return rarities[minIndex]
    if (roll < 0.85 && minIndex + 1 < rarities.length) return rarities[minIndex + 1]
    if (roll < 0.95 && minIndex + 2 < rarities.length) return rarities[minIndex + 2]
    return rarities[Math.min(minIndex + 3, rarities.length - 1)]
  }

  private randomSlot(): EquipmentSlot {
    const slots: EquipmentSlot[] = ['weapon', 'armor', 'accessory']
    return slots[Math.floor(Math.random() * slots.length)]
  }

  private getEquipmentPool(slot: EquipmentSlot): Equipment[] {
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
    }

    if (slot === 'armor') {
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
    }

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

  private getRelicPool(): Relic[] {
    return [
      {
        id: 'blood_ruby',
        name: '血红宝石',
        rarity: 'rare',
        effect: 'lifesteal',
        description: '每次攻击回复 5% 造成的伤害',
      },
      {
        id: 'stone_heart',
        name: '石心',
        rarity: 'common',
        effect: 'hp_boost',
        description: '最大生命 +50，防御 +10',
      },
      {
        id: 'phoenix_feather',
        name: '凤凰羽毛',
        rarity: 'legendary',
        effect: 'revive',
        description: '首次死亡时复活，回复 50% 生命',
      },
    ]
  }
}
