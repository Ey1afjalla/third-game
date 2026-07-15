import React, { useEffect, useState } from 'react'
import { CombatEngine } from '../engine/CombatEngine'
import { createDefaultTeam } from '../data/characters'
import { createEnemies } from '../data/enemies'
import { applyTuningToUnits, loadTuningConfig } from '../systems/TuningConfig'
import type { Unit } from '../types'
import './ShowcaseView.css'

type InfoTab = 'log' | 'ai' | 'state' | 'formula'

const createShowcaseEngine = (): CombatEngine => {
  const tuningConfig = loadTuningConfig()
  const team = applyTuningToUnits(createDefaultTeam(), tuningConfig)
  const enemies = applyTuningToUnits(createEnemies(tuningConfig.enemyStats.enemyCount), tuningConfig)
  const engine = new CombatEngine(team, enemies, { combatTuning: tuningConfig.combat })
  engine.startCombat()
  return engine
}

export const ShowcaseView: React.FC = () => {
  const [engine, setEngine] = useState<CombatEngine | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [currentTurn, setCurrentTurn] = useState(0)
  const [showInfo, setShowInfo] = useState(true)
  const [infoTab, setInfoTab] = useState<InfoTab>('log')
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)

  useEffect(() => {
    setEngine(createShowcaseEngine())
  }, [])

  useEffect(() => {
    if (!isPlaying || !engine) return

    const interval = setInterval(() => {
      if (!engine.isCompleted()) {
        engine.executeTurn()
        setCurrentTurn(engine.getCurrentTurn())
      } else {
        setIsPlaying(false)
      }
    }, 1000 / speed)

    return () => clearInterval(interval)
  }, [isPlaying, speed, engine])

  const handleStep = () => {
    if (!engine || engine.isCompleted()) return
    engine.executeTurn()
    setCurrentTurn(engine.getCurrentTurn())
  }

  const handleReset = () => {
    setEngine(createShowcaseEngine())
    setIsPlaying(false)
    setCurrentTurn(0)
    setSelectedUnit(null)
    setInfoTab('log')
  }

  if (!engine) {
    return <div>加载中...</div>
  }

  const players = engine.getPlayers()
  const enemies = engine.getEnemies()
  const logs = engine.getLog().slice(-10)
  const debug = engine.getDebugSnapshot()

  return (
    <div className="showcase-view">
      <div className="control-bar">
        <button onClick={() => setIsPlaying(!isPlaying)} className="primary">
          {isPlaying ? '暂停' : '播放'}
        </button>
        <button onClick={handleStep} disabled={isPlaying}>
          单步
        </button>
        <button onClick={handleReset}>
          重置
        </button>

        <div className="speed-control">
          <span>速度:</span>
          {[0.5, 1, 2].map(value => (
            <button key={value} onClick={() => setSpeed(value)} className={speed === value ? 'active' : ''}>
              {value}x
            </button>
          ))}
        </div>

        <button onClick={() => setShowInfo(!showInfo)}>
          {showInfo ? '隐藏' : '显示'}信息面板
        </button>

        <div className="turn-info">回合 {currentTurn}</div>
      </div>

      <div className="showcase-content">
        <div className="combat-display">
          <TeamSection title="玩家小队" units={players} selectedUnit={selectedUnit} onSelect={setSelectedUnit} />
          <TeamSection title="敌人" units={enemies} selectedUnit={selectedUnit} onSelect={setSelectedUnit} enemy />
        </div>

        {showInfo && (
          <div className="info-panel">
            <div className="info-tabs">
              <button className={infoTab === 'log' ? 'active' : ''} onClick={() => setInfoTab('log')}>日志</button>
              <button className={infoTab === 'ai' ? 'active' : ''} onClick={() => setInfoTab('ai')}>AI</button>
              <button className={infoTab === 'state' ? 'active' : ''} onClick={() => setInfoTab('state')}>状态</button>
              <button className={infoTab === 'formula' ? 'active' : ''} onClick={() => setInfoTab('formula')}>公式</button>
            </div>

            {infoTab === 'log' && (
              <div className="log-section">
                <h4>最近 10 条关键事件</h4>
                <div className="log-list">
                  {logs.map((log, index) => (
                    <div key={`${log.timestamp}-${index}`} className="log-entry">
                      <span className="log-turn">[T{log.turn}]</span>
                      <span className="log-details">{log.details}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {infoTab === 'ai' && (
              <div className="debug-section">
                <h4>敌人行为树决策</h4>
                {debug.aiDecisions.length === 0 ? (
                  <div className="empty-debug">等待敌人行动</div>
                ) : debug.aiDecisions.map((decision, index) => (
                  <div key={`${decision.unit}-${decision.turn}-${index}`} className="debug-card">
                    <strong>[T{decision.turn}] {decision.unit}</strong>
                    <span>{decision.skill} {'->'} {decision.targets.join(', ')}</span>
                    <small>{decision.reason}</small>
                    <code>{decision.path.join(' / ')}</code>
                  </div>
                ))}
              </div>
            )}

            {infoTab === 'state' && (
              <div className="debug-section">
                <h4>状态机迁移</h4>
                {debug.stateTransitions.length === 0 ? (
                  <div className="empty-debug">等待单位行动</div>
                ) : debug.stateTransitions.map((transition, index) => (
                  <div key={`${transition.unit}-${transition.turn}-${index}`} className="debug-card compact">
                    <strong>[T{transition.turn}] {transition.unit}</strong>
                    <span>{transition.from} {'->'} {transition.to}</span>
                    <small>{transition.reason}</small>
                  </div>
                ))}
              </div>
            )}

            {infoTab === 'formula' && (
              <div className="debug-section">
                <h4>伤害公式与参数</h4>
                <div className="formula-box">{debug.damageFormula}</div>
                <div className="detail-row"><span>随机源</span><span>{debug.randomSource}</span></div>
                <div className="detail-row"><span>伤害倍率</span><span>{debug.tuning.damageMultiplier.toFixed(1)}x</span></div>
                <div className="detail-row"><span>技能威力倍率</span><span>{debug.tuning.skillPowerMultiplier.toFixed(1)}x</span></div>
                <div className="detail-row"><span>技能冷却倍率</span><span>{debug.tuning.skillCooldownMultiplier.toFixed(1)}x</span></div>
                <div className="detail-row"><span>暴击倍率</span><span>{debug.tuning.critMultiplier.toFixed(1)}x</span></div>
              </div>
            )}

            {selectedUnit && <UnitDetails unit={selectedUnit} />}
          </div>
        )}
      </div>
    </div>
  )
}

interface TeamSectionProps {
  title: string
  units: Unit[]
  selectedUnit: Unit | null
  enemy?: boolean
  onSelect: (unit: Unit) => void
}

const TeamSection: React.FC<TeamSectionProps> = ({ title, units, selectedUnit, enemy = false, onSelect }) => (
  <div className="team-section">
    <h3>{title}</h3>
    <div className="units-grid">
      {units.map(unit => (
        <div
          key={unit.id}
          className={`unit-card ${enemy ? 'enemy' : ''} ${selectedUnit?.id === unit.id ? 'selected' : ''}`}
          onClick={() => onSelect(unit)}
        >
          <div className="unit-name">{unit.name}</div>
          <div className="unit-state">{unit.state}</div>
          <div className="hp-bar">
            <div className="hp-fill" style={{ width: `${unit.stats.maxHp > 0 ? (unit.hp / unit.stats.maxHp) * 100 : 0}%` }} />
            <span>{unit.hp}/{unit.stats.maxHp}</span>
          </div>
          <div className="cooldown-row">
            {unit.skills.map(skill => (
              <span key={skill.id}>{skill.name}: {skill.currentCooldown}/{skill.cooldown}</span>
            ))}
          </div>
          {unit.buffs.length > 0 && (
            <div className="buffs">
              {unit.buffs.map(buff => (
                <span key={buff.id} className="buff-icon" title={buff.name}>
                  {buff.type === 'buff' ? 'Buff' : 'Debuff'}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
)

const UnitDetails: React.FC<{ unit: Unit }> = ({ unit }) => (
  <div className="unit-details">
    <h4>{unit.name}</h4>
    <div className="detail-row"><span>状态</span><span>{unit.state}</span></div>
    <div className="detail-row"><span>HP</span><span>{unit.hp}/{unit.stats.maxHp}</span></div>
    <div className="detail-row"><span>攻击</span><span>{unit.stats.attack}</span></div>
    <div className="detail-row"><span>防御</span><span>{unit.stats.defense}</span></div>
    <div className="detail-row"><span>速度</span><span>{unit.stats.speed}</span></div>

    <h5>技能队列</h5>
    {unit.skills.map(skill => (
      <div key={skill.id} className="skill-info">
        <span>{skill.name}</span>
        <span>CD: {skill.currentCooldown}/{skill.cooldown}</span>
      </div>
    ))}

    {unit.buffs.length > 0 && (
      <>
        <h5>Buff / Debuff</h5>
        {unit.buffs.map(buff => (
          <div key={buff.id} className="buff-info">
            <span>{buff.name}</span>
            <span>{buff.duration} 回合</span>
          </div>
        ))}
      </>
    )}
  </div>
)
