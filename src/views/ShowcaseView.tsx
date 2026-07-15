import React, { useState, useEffect } from 'react'
import { CombatEngine } from '../engine/CombatEngine'
import { createDefaultTeam } from '../data/characters'
import { createEnemies } from '../data/enemies'
import type { Unit, CombatLogEntry } from '../types'
import './ShowcaseView.css'

export const ShowcaseView: React.FC = () => {
  const [engine, setEngine] = useState<CombatEngine | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1) // 1x, 2x, 0.5x
  const [currentTurn, setCurrentTurn] = useState(0)
  const [showInfo, setShowInfo] = useState(true)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)

  // 初始化战斗
  useEffect(() => {
    const team = createDefaultTeam()
    const enemies = createEnemies(3)
    const combatEngine = new CombatEngine(team, enemies)
    setEngine(combatEngine)
  }, [])

  // 自动播放
  useEffect(() => {
    if (!isPlaying || !engine) return

    const interval = setInterval(() => {
      if (!engine.isCompleted()) {
        engine.executeTurn()
        setCurrentTurn(engine.getCurrentTurn())
      } else {
        setIsPlaying(false)
      }
    }, 1000 / speed) // 速度控制

    return () => clearInterval(interval)
  }, [isPlaying, speed, engine])

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleStep = () => {
    if (engine && !engine.isCompleted()) {
      engine.executeTurn()
      setCurrentTurn(engine.getCurrentTurn())
    }
  }

  const handleReset = () => {
    const team = createDefaultTeam()
    const enemies = createEnemies(3)
    const combatEngine = new CombatEngine(team, enemies)
    setEngine(combatEngine)
    setIsPlaying(false)
    setCurrentTurn(0)
  }

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed)
  }

  if (!engine) {
    return <div>加载中...</div>
  }

  const players = engine.getPlayers()
  const enemies = engine.getEnemies()
  const logs = engine.getLog().slice(-10) // 最近10条日志

  return (
    <div className="showcase-view">
      {/* 控制栏 */}
      <div className="control-bar">
        <button onClick={handlePlayPause} className="primary">
          {isPlaying ? '⏸ 暂停' : '▶ 播放'}
        </button>
        <button onClick={handleStep} disabled={isPlaying}>
          ⏭ 单步
        </button>
        <button onClick={handleReset}>
          🔄 重置
        </button>

        <div className="speed-control">
          <span>速度：</span>
          <button
            onClick={() => handleSpeedChange(0.5)}
            className={speed === 0.5 ? 'active' : ''}
          >
            0.5x
          </button>
          <button
            onClick={() => handleSpeedChange(1)}
            className={speed === 1 ? 'active' : ''}
          >
            1x
          </button>
          <button
            onClick={() => handleSpeedChange(2)}
            className={speed === 2 ? 'active' : ''}
          >
            2x
          </button>
        </div>

        <button onClick={() => setShowInfo(!showInfo)}>
          {showInfo ? '隐藏' : '显示'}信息面板
        </button>

        <div className="turn-info">
          回合 {currentTurn}
        </div>
      </div>

      {/* 战斗显示区 */}
      <div className="showcase-content">
        <div className="combat-display">
          {/* 玩家队伍 */}
          <div className="team-section">
            <h3>玩家小队</h3>
            <div className="units-grid">
              {players.map(unit => (
                <div
                  key={unit.id}
                  className={`unit-card ${selectedUnit?.id === unit.id ? 'selected' : ''}`}
                  onClick={() => setSelectedUnit(unit)}
                >
                  <div className="unit-name">{unit.name}</div>
                  <div className="unit-state">{unit.state}</div>
                  <div className="hp-bar">
                    <div
                      className="hp-fill"
                      style={{ width: `${(unit.hp / unit.stats.maxHp) * 100}%` }}
                    />
                    <span>{unit.hp}/{unit.stats.maxHp}</span>
                  </div>
                  {unit.buffs.length > 0 && (
                    <div className="buffs">
                      {unit.buffs.map(buff => (
                        <span key={buff.id} className="buff-icon">
                          {buff.type === 'buff' ? '🔼' : '🔽'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 敌人队伍 */}
          <div className="team-section">
            <h3>敌人</h3>
            <div className="units-grid">
              {enemies.map(unit => (
                <div
                  key={unit.id}
                  className={`unit-card enemy ${selectedUnit?.id === unit.id ? 'selected' : ''}`}
                  onClick={() => setSelectedUnit(unit)}
                >
                  <div className="unit-name">{unit.name}</div>
                  <div className="unit-state">{unit.state}</div>
                  <div className="hp-bar">
                    <div
                      className="hp-fill"
                      style={{ width: `${(unit.hp / unit.stats.maxHp) * 100}%` }}
                    />
                    <span>{unit.hp}/{unit.stats.maxHp}</span>
                  </div>
                  {unit.buffs.length > 0 && (
                    <div className="buffs">
                      {unit.buffs.map(buff => (
                        <span key={buff.id} className="buff-icon">
                          {buff.type === 'buff' ? '🔼' : '🔽'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 信息面板 */}
        {showInfo && (
          <div className="info-panel">
            {/* 战斗日志 */}
            <div className="log-section">
              <h4>战斗日志</h4>
              <div className="log-list">
                {logs.map((log, index) => (
                  <div key={index} className="log-entry">
                    <span className="log-turn">[T{log.turn}]</span>
                    <span className="log-details">{log.details}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 单位详情 */}
            {selectedUnit && (
              <div className="unit-details">
                <h4>{selectedUnit.name} - 详细信息</h4>
                <div className="detail-row">
                  <span>状态：</span>
                  <span>{selectedUnit.state}</span>
                </div>
                <div className="detail-row">
                  <span>HP：</span>
                  <span>{selectedUnit.hp}/{selectedUnit.stats.maxHp}</span>
                </div>
                <div className="detail-row">
                  <span>攻击：</span>
                  <span>{selectedUnit.stats.attack}</span>
                </div>
                <div className="detail-row">
                  <span>防御：</span>
                  <span>{selectedUnit.stats.defense}</span>
                </div>
                <div className="detail-row">
                  <span>速度：</span>
                  <span>{selectedUnit.stats.speed}</span>
                </div>

                <h5>技能列表</h5>
                {selectedUnit.skills.map(skill => (
                  <div key={skill.id} className="skill-info">
                    <span>{skill.name}</span>
                    <span>CD: {skill.currentCooldown}/{skill.cooldown}</span>
                  </div>
                ))}

                {selectedUnit.buffs.length > 0 && (
                  <>
                    <h5>Buff/Debuff</h5>
                    {selectedUnit.buffs.map(buff => (
                      <div key={buff.id} className="buff-info">
                        <span>{buff.name}</span>
                        <span>持续: {buff.duration}回合</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
