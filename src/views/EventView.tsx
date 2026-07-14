import React, { useState } from 'react'
import type { RandomEvent, EventChoice } from '../types/dungeon'
import './EventView.css'

interface EventViewProps {
  event: RandomEvent
  onChoice: (choice: EventChoice) => void
}

export const EventView: React.FC<EventViewProps> = ({ event, onChoice }) => {
  const [selectedChoice, setSelectedChoice] = useState<EventChoice | null>(null)

  const handleChoice = (choice: EventChoice) => {
    setSelectedChoice(choice)
    // 延迟执行，让用户看到选择效果
    setTimeout(() => {
      onChoice(choice)
    }, 300)
  }

  return (
    <div className="event-overlay">
      <div className="event-panel panel">
        <h2 className="event-title">❓ {event.title}</h2>
        <div className="event-description">{event.description}</div>

        <div className="event-choices">
          {event.choices.map((choice) => (
            <div
              key={choice.id}
              className={`event-choice ${selectedChoice === choice ? 'selected' : ''}`}
              onClick={() => handleChoice(choice)}
            >
              <div className="choice-text">{choice.text}</div>
              {/* <div className="choice-preview">
                {choice.outcome.description}
              </div> */}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
