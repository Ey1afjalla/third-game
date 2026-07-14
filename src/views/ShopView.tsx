import React, { useState } from 'react'
import type { Equipment, Relic } from '../types/dungeon'
import { RewardGenerator } from '../systems/RewardGenerator'
import './ShopView.css'

interface ShopItem {
  id: string
  type: 'equipment' | 'relic' | 'heal'
  item?: Equipment | Relic
  healAmount?: number
  price: number
  soldOut: boolean
}

interface ShopViewProps {
  currentGold: number
  onPurchase: (item: ShopItem) => void
  onClose: () => void
}

export const ShopView: React.FC<ShopViewProps> = ({ currentGold, onPurchase, onClose }) => {
  const [items, setItems] = useState<ShopItem[]>(() => {
    // 生成商店物品
    const rewardGen = new RewardGenerator()
    const shopItems: ShopItem[] = []

    // 2个装备
    for (let i = 0; i < 2; i++) {
      const reward = rewardGen.generateBattleRewards(false)[0]
      if (reward.type === 'equipment' && reward.item) {
        shopItems.push({
          id: `equip_${i}`,
          type: 'equipment',
          item: reward.item as Equipment,
          price: 50,
          soldOut: false,
        })
      }
    }

    // 2个遗物
    for (let i = 0; i < 2; i++) {
      const reward = rewardGen.generateBattleRewards(true)[1]
      if (reward.type === 'relic' && reward.item) {
        shopItems.push({
          id: `relic_${i}`,
          type: 'relic',
          item: reward.item as Relic,
          price: 75,
          soldOut: false,
        })
      }
    }

    // 1个治疗
    shopItems.push({
      id: 'heal_0',
      type: 'heal',
      healAmount: 50,
      price: 30,
      soldOut: false,
    })

    return shopItems
  })

  const handlePurchase = (item: ShopItem) => {
    if (item.soldOut || currentGold < item.price) {
      return
    }

    // 标记为已售出
    setItems(prev => prev.map(i =>
      i.id === item.id ? { ...i, soldOut: true } : i
    ))

    // 通知父组件
    onPurchase(item)
  }

  const renderItem = (item: ShopItem) => {
    const canAfford = currentGold >= item.price
    const itemClasses = ['shop-item']
    if (item.soldOut) itemClasses.push('sold-out')
    if (!canAfford) itemClasses.push('cannot-afford')

    let name = ''
    let description = ''

    if (item.type === 'equipment' && item.item) {
      const equip = item.item as Equipment
      name = equip.name
      description = equip.description
    } else if (item.type === 'relic' && item.item) {
      const relic = item.item as Relic
      name = relic.name
      description = relic.description
    } else if (item.type === 'heal') {
      name = '治疗药水'
      description = `恢复全队${item.healAmount}点生命`
    }

    return (
      <div
        key={item.id}
        className={itemClasses.join(' ')}
        onClick={() => handlePurchase(item)}
      >
        {item.soldOut && <div className="sold-out-badge">已售出</div>}

        <div className="item-header">
          <div className="item-name">{name}</div>
          <div className="item-price">💰 {item.price}</div>
        </div>

        <div className="item-description">{description}</div>

        {!canAfford && !item.soldOut && (
          <div className="item-stats" style={{ color: 'var(--color-accent-red)' }}>
            金币不足
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="shop-overlay">
      <div className="shop-panel panel">
        <div className="shop-header">
          <h2 className="panel-header">🏪 神秘商店</h2>
          <div className="shop-gold">💰 {currentGold} 金币</div>
        </div>

        <div className="shop-items">
          {items.map(item => renderItem(item))}
        </div>

        <div className="shop-actions">
          <button onClick={onClose}>
            离开商店
          </button>
        </div>
      </div>
    </div>
  )
}
