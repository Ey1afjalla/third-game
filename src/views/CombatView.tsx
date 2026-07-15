import React, { useEffect, useState } from 'react'
import { CombatEngine } from '../engine/CombatEngine'
import { createDefaultTeam } from '../data/characters'
import { createEnemies } from '../data/enemies'
import { applyTuningToUnits, loadTuningConfig } from '../systems/TuningConfig'
import type { CombatLogEntry, CombatResult, Unit } from '../types'
import './CombatView.css'

interface CombatViewProps {
  onCombatComplete?: (result: CombatResult) => void
}

interface CombatState {
  turnCount: number
  players: Unit[]
  enemies: Unit[]
  logs: CombatLogEntry[]
}

export const CombatView: React.FC<CombatViewProps> = ({ onCombatComplete }) => {
  const [engine, setEngine] = useState<CombatEngine | null>(null)
  const [combatState, setCombatState] = useState<CombatState | null>(null)
  const [result, setResult] = useState<CombatResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [autoPlay, setAutoPlay] = useState(false)

  const initCombat = () => {
    const tuningConfig = loadTuningConfig()
    const players = applyTuningToUnits(createDefaultTeam(), tuningConfig)
    const enemies = applyTuningToUnits(createEnemies(tuningConfig.enemyStats.enemyCount), tuningConfig)
    const newEngine = new CombatEngine(players, enemies, { combatTuning: tuningConfig.combat })

    newEngine.startCombat()
    setEngine(newEngine)
    setCombatState(newEngine.getCurrentState())
    setResult(null)
    setIsRunning(true)
    setAutoPlay(false)
  }

  const executeTurn = () => {
    if (!engine || !isRunning) return

    const ended = engine.executeTurn()
    setCombatState(engine.getCurrentState())

    if (ended) {
      const combatResult = engine.getCombatResult()
      setResult(combatResult)
      setIsRunning(false)
      setAutoPlay(false)
      onCombatComplete?.(combatResult)
    }
  }

  useEffect(() => {
    initCombat()
  }, [])

  useEffect(() => {
    if (!autoPlay || !isRunning || result || !engine) return

    const timer = setTimeout(() => {
      executeTurn()
    }, 1000)

    return () => clearTimeout(timer)
  }, [autoPlay, isRunning, result, engine, combatState])

  if (!combatState) {
    return <div className="combat-view">加载中...</div>
  }

  return (
    <div className="combat-view">
      <div className="combat-main">
        <div className="battlefield">
          <div className="team-section">
            <h3 className="section-title">玩家小队</h3>
            <div className="units-grid">
              {combatState.players.map(unit => (
                <UnitCard key={unit.id} unit={unit} isPlayer={true} />
              ))}
            </div>
          </div>

          <div className="vs-divider">
            <span>VS</span>
          </div>

          <div className="team-section">
            <h3 className="section-title">敌方单位</h3>
            <div className="units-grid">
              {combatState.enemies.map(unit => (
                <UnitCard key={unit.id} unit={unit} isPlayer={false} />
              ))}
            </div>
          </div>
        </div>

        <div className="combat-log panel">
          <h3 className="panel-header">战斗日志</h3>
          <div className="log-content">
            {combatState.logs.map((log, index) => (
              <div key={`${log.timestamp}-${index}`} className="log-entry">
                <span className="log-turn">[回合 {log.turn}]</span>
                <span className="log-details">{log.details}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="combat-sidebar">
        <div className="combat-controls panel">
          <h3 className="panel-header">战斗控制</h3>
          <div className="controls-buttons flex-column gap-sm">
            <button onClick={initCombat} disabled={isRunning}>
              重新开始
            </button>
            <button onClick={executeTurn} disabled={!isRunning || autoPlay}>
              下一回合
            </button>
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              disabled={!isRunning}
              className={autoPlay ? 'primary' : ''}
            >
              {autoPlay ? '暂停自动' : '自动战斗'}
            </button>
          </div>
          <div className="turn-info">
            <p>当前回合: {combatState.turnCount}</p>
            <p>状态: {isRunning ? '战斗中' : '已结束'}</p>
          </div>
        </div>

        {result && (
          <div className="combat-result panel">
            <h3 className="panel-header">{result.victory ? '胜利' : '失败'}</h3>
            <div className="result-content">
              <p>总回合数: {result.stats.turnCount}</p>
              <p>战斗时长: {(result.stats.duration / 1000).toFixed(1)} 秒</p>
              <p>存活角色: {result.survivors.map(u => u.name).join(', ') || '无'}</p>
              <div className="mt-md">
                <h4>伤害统计:</h4>
                {Object.entries(result.stats.totalDamageDealt)
                  .filter(([, damage]) => damage > 0)
                  .map(([id, damage]) => (
                    <p key={id}>{id}: {damage} 点</p>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const UnitCard: React.FC<{ unit: Unit; isPlayer: boolean }> = ({ unit, isPlayer }) => {
  const hpPercent = unit.stats.maxHp > 0 ? (unit.hp / unit.stats.maxHp) * 100 : 0
  const isDead = unit.hp <= 0

  return (
    <div className={`unit-card ${isDead ? 'dead' : ''} ${isPlayer ? 'player' : 'enemy'}`}>
      <div className="unit-header">
        <h4 className="unit-name">{unit.name}</h4>
        <span className="unit-role">{unit.role}</span>
      </div>

      <div className="unit-stats">
        <div className="stat-row">
          <span className="stat-label">生命</span>
          <div className="hp-bar">
            <div className="hp-fill" style={{ width: `${hpPercent}%` }} />
            <span className="hp-text">{unit.hp}/{unit.stats.maxHp}</span>
          </div>
        </div>

        {unit.shield > 0 && (
          <div className="stat-row">
            <span className="stat-label">护盾</span>
            <span className="stat-value">{unit.shield}</span>
          </div>
        )}

        <StatRow label="攻击" value={unit.stats.attack} />
        <StatRow label="防御" value={unit.stats.defense} />
        <StatRow label="速度" value={unit.stats.speed} />
      </div>

      <div className="unit-skills">
        {unit.skills.map(skill => (
          <div key={skill.id} className="skill-item" title={skill.description}>
            <span className="skill-name">{skill.name}</span>
            {skill.currentCooldown > 0 && <span className="skill-cooldown">CD: {skill.currentCooldown}</span>}
          </div>
        ))}
      </div>

      {unit.buffs.length > 0 && (
        <div className="unit-buffs">
          {unit.buffs.map((buff, index) => (
            <div key={`${buff.id}-${index}`} className={`buff-item ${buff.type}`} title={buff.name}>
              {buff.name}
              {buff.duration > 0 && ` (${buff.duration})`}
            </div>
          ))}
        </div>
      )}

      <div className="unit-state">状态: {unit.state}</div>
    </div>
  )
}

const StatRow: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="stat-row">
    <span className="stat-label">{label}</span>
    <span className="stat-value">{value}</span>
  </div>
)
