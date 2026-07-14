import React, { useState, useEffect } from 'react'
import { CombatEngine } from '../engine/CombatEngine'
import { createDefaultTeam } from '../data/characters'
import { createBasicEnemyGroup } from '../data/enemies'
import type { Unit, CombatResult } from '../types'
import './CombatView.css'

export const CombatView: React.FC = () => {
  const [engine, setEngine] = useState<CombatEngine | null>(null)
  const [combatState, setCombatState] = useState<{
    turnCount: number
    players: Unit[]
    enemies: Unit[]
    logs: any[]
  } | null>(null)
  const [result, setResult] = useState<CombatResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [autoPlay, setAutoPlay] = useState(false)

  // 初始化战斗
  const initCombat = () => {
    console.log('[CombatView] initCombat: 初始化战斗')
    const players = createDefaultTeam()
    const enemies = createBasicEnemyGroup()
    const newEngine = new CombatEngine(players, enemies)
    newEngine.startCombat()
    setEngine(newEngine)
    const initialState = newEngine.getCurrentState()
    console.log('[CombatView] initCombat: 战斗初始化完成', initialState)
    setCombatState(initialState)
    setResult(null)
    setIsRunning(true)
    setAutoPlay(false)
  }

  // 执行一个回合
  const executeTurn = () => {
    if (!engine || !isRunning) {
      console.log('[CombatView] executeTurn: engine or isRunning is false', { engine: !!engine, isRunning })
      return
    }

    console.log('[CombatView] executeTurn: 开始执行回合')
    const ended = engine.executeTurn()
    const newState = engine.getCurrentState()
    console.log('[CombatView] executeTurn: 回合执行完成', {
      ended,
      turnCount: newState.turnCount,
      playersAlive: newState.players.filter((p: any) => p.hp > 0).length,
      enemiesAlive: newState.enemies.filter((e: any) => e.hp > 0).length
    })

    setCombatState(newState)

    if (ended) {
      const combatResult = engine.getCombatResult()
      console.log('[CombatView] executeTurn: 战斗结束', combatResult)
      setResult(combatResult)
      setIsRunning(false)
      setAutoPlay(false)
    }
  }

  // 自动战斗
  useEffect(() => {
    if (autoPlay && isRunning && !result && engine) {
      const timer = setTimeout(() => {
        executeTurn()
      }, 1000) // 每秒执行一个回合

      return () => clearTimeout(timer)
    }
  }, [autoPlay, isRunning, result, engine, combatState])

  // 组件挂载时初始化
  useEffect(() => {
    initCombat()
  }, [])

  if (!combatState) {
    return <div className="combat-view">加载中...</div>
  }

  return (
    <div className="combat-view">
      {/* 主战斗区域 */}
      <div className="combat-main">
        {/* 战场 */}
        <div className="battlefield">
          {/* 玩家小队 */}
          <div className="team-section">
            <h3 className="section-title">玩家小队</h3>
            <div className="units-grid">
              {combatState.players.map(unit => (
                <UnitCard key={unit.id} unit={unit} isPlayer={true} />
              ))}
            </div>
          </div>

          {/* VS 分隔符 */}
          <div className="vs-divider">
            <span>VS</span>
          </div>

          {/* 敌人 */}
          <div className="team-section">
            <h3 className="section-title">敌方单位</h3>
            <div className="units-grid">
              {combatState.enemies.map(unit => (
                <UnitCard key={unit.id} unit={unit} isPlayer={false} />
              ))}
            </div>
          </div>
        </div>

        {/* 战斗日志 */}
        <div className="combat-log panel">
          <h3 className="panel-header">战斗日志</h3>
          <div className="log-content">
            {combatState.logs.map((log, index) => (
              <div key={index} className="log-entry">
                <span className="log-turn">[回合 {log.turn}]</span>
                <span className="log-details">{log.details}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 右侧边栏 */}
      <div className="combat-sidebar">
        {/* 战斗控制 */}
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
            <p>当前回合：{combatState.turnCount}</p>
            <p>状态：{isRunning ? '战斗中' : '已结束'}</p>
          </div>
        </div>

        {/* 战斗结果 */}
        {result && (
          <div className="combat-result panel">
            <h3 className="panel-header">
              {result.victory ? '🎉 胜利！' : '💀 失败...'}
            </h3>
            <div className="result-content">
              <p>总回合数：{result.stats.turnCount}</p>
              <p>战斗时长：{(result.stats.duration / 1000).toFixed(1)} 秒</p>
              <p>存活角色：{result.survivors.map(u => u.name).join(', ') || '无'}</p>
              <div className="mt-md">
                <h4>伤害统计：</h4>
                {Object.entries(result.stats.totalDamageDealt)
                  .filter(([_, damage]) => damage > 0)
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

// 单位卡片组件
const UnitCard: React.FC<{ unit: Unit; isPlayer: boolean }> = ({ unit, isPlayer }) => {
  const hpPercent = (unit.hp / unit.stats.maxHp) * 100
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
            <div
              className="hp-fill"
              style={{ width: `${hpPercent}%` }}
            />
            <span className="hp-text">
              {unit.hp}/{unit.stats.maxHp}
            </span>
          </div>
        </div>

        {unit.shield > 0 && (
          <div className="stat-row">
            <span className="stat-label">护盾</span>
            <span className="stat-value">{unit.shield}</span>
          </div>
        )}

        <div className="stat-row">
          <span className="stat-label">攻击</span>
          <span className="stat-value">{unit.stats.attack}</span>
        </div>

        <div className="stat-row">
          <span className="stat-label">防御</span>
          <span className="stat-value">{unit.stats.defense}</span>
        </div>

        <div className="stat-row">
          <span className="stat-label">速度</span>
          <span className="stat-value">{unit.stats.speed}</span>
        </div>
      </div>

      {/* 技能冷却 */}
      <div className="unit-skills">
        {unit.skills.map(skill => (
          <div key={skill.id} className="skill-item" title={skill.description}>
            <span className="skill-name">{skill.name}</span>
            {skill.currentCooldown > 0 && (
              <span className="skill-cooldown">CD: {skill.currentCooldown}</span>
            )}
          </div>
        ))}
      </div>

      {/* Buff 列表 */}
      {unit.buffs.length > 0 && (
        <div className="unit-buffs">
          {unit.buffs.map((buff, index) => (
            <div key={index} className={`buff-item ${buff.type}`} title={buff.name}>
              {buff.name}
              {buff.duration > 0 && ` (${buff.duration})`}
            </div>
          ))}
        </div>
      )}

      {/* 状态 */}
      <div className="unit-state">
        状态: {unit.state}
      </div>
    </div>
  )
}
