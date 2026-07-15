import React, { useState } from 'react'
import type { Equipment, Relic } from '../types/dungeon'
import { RewardGenerator } from '../systems/RewardGenerator'
import './ShopView.css'

export interface ShopItem {
  id: string
  type: 'equipment' | 'relic' | 'heal'
  item?: Equipment | Relic
  healAmount?: number
  price: number
  soldOut: boolean
}

interface ShopViewProps {
  currentGold: number
  onPurchase: (item: ShopItem) => boolean
  onClose: () => void
}

export const ShopView: React.FC<ShopViewProps> = ({ currentGold, onPurchase, onClose }) => {
  const [items, setItems] = useState<ShopItem[]>(() => createShopItems())

  const handlePurchase = (item: ShopItem) => {
    if (item.soldOut || currentGold < item.price) return

    const purchased = onPurchase(item)
    if (!purchased) return

    setItems(prev => prev.map(candidate =>
      candidate.id === item.id ? { ...candidate, soldOut: true } : candidate
    ))
  }

  return (
    <div className="shop-overlay">
      <div className="shop-panel panel">
        <div className="shop-header">
          <h2 className="panel-header">神秘商店</h2>
          <div className="shop-gold">{currentGold} 金币</div>
        </div>

        <div className="shop-items">
          {items.map(item => (
            <ShopItemCard
              key={item.id}
              item={item}
              canAfford={currentGold >= item.price}
              onPurchase={handlePurchase}
            />
          ))}
        </div>

        <div className="shop-actions">
          <button onClick={onClose}>离开商店</button>
        </div>
      </div>
    </div>
  )
}

const createShopItems = (): ShopItem[] => {
  const rewardGen = new RewardGenerator()
  const shopItems: ShopItem[] = []

  for (let index = 0; index < 2; index += 1) {
    const reward = rewardGen.generateBattleRewards(false)[0]
    if (reward.type === 'equipment' && reward.item) {
      shopItems.push({
        id: `equip_${index}`,
        type: 'equipment',
        item: reward.item as Equipment,
        price: 50,
        soldOut: false,
      })
    }
  }

  for (let index = 0; index < 2; index += 1) {
    const reward = rewardGen.generateBattleRewards(true)[1]
    if (reward.type === 'relic' && reward.item) {
      shopItems.push({
        id: `relic_${index}`,
        type: 'relic',
        item: reward.item as Relic,
        price: 75,
        soldOut: false,
      })
    }
  }

  shopItems.push({
    id: 'heal_0',
    type: 'heal',
    healAmount: 50,
    price: 30,
    soldOut: false,
  })

  return shopItems
}

interface ShopItemCardProps {
  item: ShopItem
  canAfford: boolean
  onPurchase: (item: ShopItem) => void
}

const ShopItemCard: React.FC<ShopItemCardProps> = ({ item, canAfford, onPurchase }) => {
  const itemClasses = ['shop-item']
  if (item.soldOut) itemClasses.push('sold-out')
  if (!canAfford) itemClasses.push('cannot-afford')

  const { name, description } = getItemText(item)

  return (
    <button
      type="button"
      className={itemClasses.join(' ')}
      onClick={() => onPurchase(item)}
      disabled={item.soldOut || !canAfford}
    >
      {item.soldOut && <div className="sold-out-badge">已售出</div>}

      <div className="item-header">
        <div className="item-name">{name}</div>
        <div className="item-price">{item.price} 金币</div>
      </div>

      <div className="item-description">{description}</div>

      {!canAfford && !item.soldOut && (
        <div className="item-stats cannot-afford-text">金币不足</div>
      )}
    </button>
  )
}

const getItemText = (item: ShopItem): { name: string; description: string } => {
  if (item.type === 'equipment' && item.item) {
    const equipment = item.item as Equipment
    return { name: equipment.name, description: equipment.description }
  }

  if (item.type === 'relic' && item.item) {
    const relic = item.item as Relic
    return { name: relic.name, description: relic.description }
  }

  return {
    name: '生命药剂',
    description: `全队生命上限 +${item.healAmount ?? 0}`,
  }
}
