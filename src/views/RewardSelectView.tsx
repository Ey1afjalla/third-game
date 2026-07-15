import React, { useState } from 'react'
import type { Reward } from '../types/dungeon'
import './RewardSelectView.css'

interface RewardSelectViewProps {
  rewards: Reward[]
  onSelect: (reward: Reward) => void
  onClose: () => void
}

const REWARD_ICONS: Record<string, string> = {
  equipment: '⚔️',
  relic: '💎',
  gold: '💰',
  heal: '❤️',
  upgrade: '⬆️',
}

const REWARD_NAMES: Record<string, string> = {
  equipment: '装备',
  relic: '遗物',
  gold: '金币',
  heal: '治疗',
  upgrade: '升级',
}

export const RewardSelectView: React.FC<RewardSelectViewProps> = ({ rewards, onSelect, onClose }) => {
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)

  const handleSelect = (reward: Reward) => {
    setSelectedReward(reward)
  }

  const handleConfirm = () => {
    if (selectedReward) {
      onSelect(selectedReward)
    }
  }

  const renderRewardCard = (reward: Reward, index: number) => {
    const isSelected = selectedReward === reward
    const icon = REWARD_ICONS[reward.type] || '❓'
    const name = REWARD_NAMES[reward.type] || '未知奖励'

    let description = ''
    let rarityClass = ''

    if (reward.type === 'equipment' && reward.item) {
      const equip = reward.item as any
      description = equip.description || '装备'
      rarityClass = equip.rarity || 'common'
    } else if (reward.type === 'relic' && reward.item) {
      const relic = reward.item as any
      description = relic.description || '遗物'
      rarityClass = relic.rarity || 'common'
    } else if (reward.type === 'gold') {
      description = `获得${reward.amount}金币`
    } else if (reward.type === 'heal') {
      description = `全队恢复${reward.amount}点生命`
    }

    return (
      <div
        key={index}
        className={`reward-card ${rarityClass} ${isSelected ? 'selected' : ''}`}
        onClick={() => handleSelect(reward)}
      >
        <div className="reward-icon">{icon}</div>
        <div className="reward-name">{name}</div>
        <div className="reward-description">{description}</div>
        {reward.item && (
          <div className="reward-stats">
            {/* TODO: 显示装备/遗物属性 */}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="reward-select-overlay">
      <div className="reward-select-panel panel">
        <h2 className="panel-header">🎁 选择奖励</h2>
        <p className="reward-subtitle">从以下三个奖励中选择一个</p>

        <div className="rewards-grid">
          {rewards.map((reward, index) => renderRewardCard(reward, index))}
        </div>

        <div className="reward-actions">
          <button
            className="primary"
            onClick={handleConfirm}
            disabled={!selectedReward}
          >
            确认选择
          </button>
          <button onClick={onClose}>
            跳过
          </button>
        </div>
      </div>
    </div>
  )
}
