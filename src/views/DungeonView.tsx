import React, { useState, useEffect } from 'react'
import { DungeonGenerator } from '../systems/DungeonGenerator'
import { GameState } from '../systems/GameState'
import { createDefaultTeam } from '../data/characters'
import type { DungeonPath, DungeonNode, NodeType } from '../types/dungeon'
import './DungeonView.css'

const NODE_ICONS: Record<NodeType, string> = {
  battle: '⚔️',
  elite: '👑',
  boss: '💀',
  event: '❓',
  shop: '🏪',
  rest: '🔥',
}

const NODE_NAMES: Record<NodeType, string> = {
  battle: '战斗',
  elite: '精英',
  boss: 'Boss',
  event: '事件',
  shop: '商店',
  rest: '休息',
}

export const DungeonView: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [path, setPath] = useState<DungeonPath | null>(null)

  useEffect(() => {
    // 尝试加载存档
    let state = GameState.loadFromLocalStorage()

    // 如果没有存档，创建新游戏
    if (!state) {
      const team = createDefaultTeam()
      state = new GameState(team)
      state.saveToLocalStorage()
    }

    setGameState(state)
    setPath(state.getSave().dungeonPath)
  }, [])

  const handleNodeClick = (node: DungeonNode) => {
    // 允许点击current和available状态的节点
    if (!gameState || (node.state !== 'available' && node.state !== 'current')) {
      console.log('[DungeonView] Node not clickable:', node.state)
      return
    }

    console.log('[DungeonView] Clicked node:', node.type, node.id, node.state)

    // 选择节点（如果是available状态，移动到该节点）
    if (node.state === 'available') {
      gameState.moveToNode(node.id)
      gameState.saveToLocalStorage()
      setPath(gameState.getSave().dungeonPath)
    }

    // 根据节点类型执行对应操作
    switch (node.type) {
      case 'battle':
      case 'elite':
        console.log('[DungeonView] 触发战斗:', node.type)
        alert(`即将开始${node.type === 'elite' ? '精英' : '普通'}战斗！\n\n（战斗系统集成开发中）`)
        // TODO: 跳转到战斗
        break
      case 'event':
        console.log('[DungeonView] 触发事件')
        alert('触发随机事件！\n\n（事件系统开发中）')
        // TODO: 触发事件
        break
      case 'shop':
        console.log('[DungeonView] 打开商店')
        alert('欢迎来到商店！\n\n（商店系统开发中）')
        // TODO: 打开商店
        break
      case 'rest':
        console.log('[DungeonView] 休息恢复')
        // 直接治疗
        gameState.healTeam(50)
        gameState.completeCurrentNode()
        gameState.saveToLocalStorage()
        setPath(gameState.getSave().dungeonPath)
        alert('在营地休息，全队恢复50点生命！')
        break
      case 'boss':
        console.log('[DungeonView] Boss战')
        alert('Boss战即将开始！\n\n（Boss战开发中）')
        // TODO: Boss战
        break
    }
  }

  const renderNode = (node: DungeonNode) => {
    const classNames = [
      'dungeon-node',
      node.type,
      node.state,
    ].join(' ')

    return (
      <div
        key={node.id}
        className={classNames}
        onClick={() => handleNodeClick(node)}
        title={`${NODE_NAMES[node.type]} - ${node.state}`}
      >
        <div className="node-icon">{NODE_ICONS[node.type]}</div>
        <div className="node-type">{NODE_NAMES[node.type]}</div>
      </div>
    )
  }

  if (!path || !gameState) {
    return <div className="dungeon-view">加载中...</div>
  }

  // 按层组织节点
  const floors: DungeonNode[][] = []
  for (let y = 0; y < path.maxDepth; y++) {
    const floorNodes = path.nodes.filter(n => n.y === y)
    floors.push(floorNodes)
  }

  const save = gameState.getSave()

  return (
    <div className="dungeon-view">
      {/* 游戏信息 */}
      <div className="game-info">
        <div className="info-item">
          <span className="info-label">当前层数:</span>
          <span className="info-value">{save.currentFloor + 1} / {path.maxDepth}</span>
        </div>
        <div className="info-item">
          <span className="info-label">金币:</span>
          <span className="info-value">{save.gold}</span>
        </div>
        <div className="info-item">
          <span className="info-label">遗物:</span>
          <span className="info-value">{save.relics.length}</span>
        </div>
      </div>

      {/* 地下城地图 */}
      <div className="dungeon-map panel">
        <h3 className="panel-header">地下城路线</h3>
        <div className="dungeon-grid">
          {floors.map((floorNodes, floorIndex) => (
            <div key={floorIndex} className="dungeon-floor">
              <div className="floor-label">第 {floorIndex + 1} 层</div>
              {floorNodes.map(node => renderNode(node))}
            </div>
          ))}
        </div>
      </div>

      {/* 队伍状态 */}
      <div className="team-status panel mt-md">
        <h3 className="panel-header">队伍状态</h3>
        <div className="team-grid">
          {save.team.map(unit => (
            <div key={unit.id} className="team-member">
              <div className="member-name">{unit.name}</div>
              <div className="member-hp">
                HP: {unit.hp} / {unit.stats.maxHp}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
