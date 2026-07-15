import React, { useState } from 'react'
import { DungeonGenerator } from '../systems/DungeonGenerator'
import { GameState } from '../systems/GameState'
import { RewardGenerator } from '../systems/RewardGenerator'
import { EventGenerator } from '../systems/EventGenerator'
import { createDefaultTeam } from '../data/characters'
import { RewardSelectView } from './RewardSelectView'
import { EventView } from './EventView'
import { ShopView } from './ShopView'
import type { DungeonPath, DungeonNode, NodeType, Reward, RandomEvent, EventChoice } from '../types/dungeon'
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

interface DungeonViewProps {
  showRewardAfterCombat?: boolean
  onRewardHandled?: () => void
  onStartCombat?: () => void
}

export const DungeonView: React.FC<DungeonViewProps> = ({
  showRewardAfterCombat = false,
  onRewardHandled,
  onStartCombat
}) => {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [path, setPath] = useState<DungeonPath | null>(null)
  const [overlayType, setOverlayType] = useState<OverlayType>('none')
  const [currentRewards, setCurrentRewards] = useState<Reward[]>([])
  const [currentEvent, setCurrentEvent] = useState<RandomEvent | null>(null)

  // 如果战斗结束后需要显示奖励
  React.useEffect(() => {
    if (showRewardAfterCombat && onRewardHandled) {
      // 自动触发奖励选择
      handleBattleReward(false)
      onRewardHandled()
    }
  }, [showRewardAfterCombat])

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
        // 触发战斗回调
        if (onStartCombat) {
          onStartCombat()
        } else {
          // 如果没有回调，直接显示奖励（测试用）
          handleBattleReward(node.type === 'elite')
        }
        break
      case 'event':
        console.log('[DungeonView] 触发事件')
        handleEvent()
        break
      case 'shop':
        console.log('[DungeonView] 打开商店')
        setOverlayType('shop')
        break
      case 'rest':
        console.log('[DungeonView] 休息恢复')
        gameState.healTeam(50)
        gameState.completeCurrentNode()
        gameState.saveToLocalStorage()
        setPath(gameState.getSave().dungeonPath)
        alert('在营地休息，全队恢复50点生命！')
        break
      case 'boss':
        console.log('[DungeonView] Boss战')
        alert('Boss战即将开始！\n\n（Boss战开发中）')
        break
    }
  }

  const handleBattleReward = (isElite: boolean) => {
    const rewardGen = new RewardGenerator()
    const rewards = rewardGen.generateBattleRewards(isElite)
    setCurrentRewards(rewards)
    setOverlayType('reward')
  }

  const handleEvent = () => {
    const eventGen = new EventGenerator()
    const event = eventGen.generateEvent()
    setCurrentEvent(event)
    setOverlayType('event')
  }

  const handleRewardSelect = (reward: Reward) => {
    if (!gameState) return

    // 应用奖励
    if (reward.type === 'equipment' && reward.item) {
      const equipment = reward.item as any
      gameState.addEquipment(gameState.getSave().team[0].id, equipment)
    } else if (reward.type === 'relic' && reward.item) {
      const relic = reward.item as any
      gameState.addRelic(relic)
    } else if (reward.type === 'gold' && reward.amount) {
      gameState.addGold(reward.amount)
    } else if (reward.type === 'heal' && reward.amount) {
      gameState.healTeam(reward.amount)
    }

    // 完成当前节点
    gameState.completeCurrentNode()
    gameState.saveToLocalStorage()
    setPath(gameState.getSave().dungeonPath)
    setOverlayType('none')
  }

  const handleShopPurchase = (item: any) => {
    if (!gameState) return

    // 扣除金币
    if (!gameState.spendGold(item.price)) {
      alert('金币不足！')
      return
    }

    // 应用物品
    if (item.type === 'equipment' && item.item) {
      gameState.addEquipment(gameState.getSave().team[0].id, item.item)
    } else if (item.type === 'relic' && item.item) {
      gameState.addRelic(item.item)
    } else if (item.type === 'heal' && item.healAmount) {
      gameState.healTeam(item.healAmount)
    }

    gameState.saveToLocalStorage()
    setPath(gameState.getSave().dungeonPath)
  }

  const handleShopClose = () => {
    if (!gameState) return

    // 完成当前节点
    gameState.completeCurrentNode()
    gameState.saveToLocalStorage()
    setPath(gameState.getSave().dungeonPath)
    setOverlayType('none')
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

      {/* 奖励选择界面 */}
      {overlayType === 'reward' && (
        <RewardSelectView
          rewards={currentRewards}
          onSelect={handleRewardSelect}
          onClose={() => setOverlayType('none')}
        />
      )}

      {/* 商店界面 */}
      {overlayType === 'shop' && gameState && (
        <ShopView
          currentGold={gameState.getSave().gold}
          onPurchase={handleShopPurchase}
          onClose={handleShopClose}
        />
      )}
    </div>
  )
}
