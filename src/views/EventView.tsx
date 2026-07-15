import React, { useState } from 'react'
import type { RandomEvent, EventChoice } from '../types/dungeon'
import './EventView.css'

interface EventViewProps {
  event: RandomEvent
  currentGold?: number
  onChoice: (choice: EventChoice) => void
}

interface FeedbackItem {
  type: 'gain' | 'loss' | 'neutral'
  text: string
}

const getRewardText = (choice: EventChoice): string => {
  const reward = choice.outcome.reward

  if (!reward) return ''
  if (reward.type === 'gold') return `金币 +${reward.amount ?? 0}`
  if (reward.type === 'equipment') return '获得装备'
  if (reward.type === 'relic') return '获得遗物'
  if (reward.type === 'upgrade') return '获得强化'
  if (reward.type === 'heal') return `全队生命上限 +${reward.amount ?? 0}`

  return '获得奖励'
}

const buildFeedback = (choice: EventChoice): FeedbackItem[] => {
  const outcome = choice.outcome
  const items: FeedbackItem[] = []

  if (outcome.goldCost) items.push({ type: 'loss', text: `金币 -${outcome.goldCost}` })
  if (outcome.damage) items.push({ type: 'loss', text: `全队生命 -${outcome.damage}` })
  if (outcome.heal) items.push({ type: 'gain', text: `全队生命上限 +${outcome.heal}` })

  const rewardText = getRewardText(choice)
  if (rewardText) items.push({ type: 'gain', text: rewardText })
  if (outcome.buff) items.push({ type: 'gain', text: outcome.buff })

  return items.length > 0 ? items : [{ type: 'neutral', text: '没有状态变化' }]
}

const canAffordChoice = (choice: EventChoice, currentGold?: number): boolean => {
  const cost = choice.outcome.goldCost
  return !cost || currentGold === undefined || currentGold >= cost
}

export const EventView: React.FC<EventViewProps> = ({ event, currentGold, onChoice }) => {
  const [selectedChoice, setSelectedChoice] = useState<EventChoice | null>(null)

  const handleChoice = (choice: EventChoice) => {
    if (selectedChoice || !canAffordChoice(choice, currentGold)) return
    setSelectedChoice(choice)
  }

  const handleContinue = () => {
    if (selectedChoice) onChoice(selectedChoice)
  }

  const feedbackItems = selectedChoice ? buildFeedback(selectedChoice) : []

  return (
    <div className="event-overlay">
      <div className="event-panel panel">
        <h2 className="event-title">❓ {event.title}</h2>
        <div className="event-description">{event.description}</div>

        <div className="event-choices">
          {event.choices.map((choice) => {
            const isSelected = selectedChoice === choice
            const isLocked = Boolean(selectedChoice && !isSelected)
            const isAffordable = canAffordChoice(choice, currentGold)

            return (
              <button
                key={choice.id}
                type="button"
                className={`event-choice ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''}`}
                onClick={() => handleChoice(choice)}
                disabled={Boolean(selectedChoice) || !isAffordable}
              >
                <div className="choice-text">{choice.text}</div>
                {!isAffordable && <div className="choice-preview">金币不足</div>}
              </button>
            )
          })}
        </div>

        {selectedChoice && (
          <div className="event-result">
            <div className="event-result-title">选择结果</div>
            <div className="event-result-description">{selectedChoice.outcome.description}</div>
            <div className="event-feedback-list">
              {feedbackItems.map((item, index) => (
                <div key={`${item.type}-${index}`} className={`feedback-item ${item.type}`}>
                  {item.text}
                </div>
              ))}
            </div>
            <div className="event-actions">
              <button type="button" className="btn btn-primary" onClick={handleContinue}>
                继续
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
