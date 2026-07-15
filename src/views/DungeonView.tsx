import React, { useEffect, useMemo, useState } from 'react'
import { createDefaultTeam } from '../data/characters'
import { EventGenerator } from '../systems/EventGenerator'
import { GameState } from '../systems/GameState'
import { RewardGenerator } from '../systems/RewardGenerator'
import { EventView } from './EventView'
import { RewardSelectView } from './RewardSelectView'
import { ShopView } from './ShopView'
import type { CombatResult } from '../types'
import type {
  DungeonNode,
  DungeonPath,
  Equipment,
  EventChoice,
  NodeType,
  RandomEvent,
  Relic,
  Reward,
} from '../types/dungeon'
import './DungeonView.css'

type OverlayType = 'none' | 'reward' | 'event' | 'shop'

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
  combatResult?: CombatResult | null
  showRewardAfterCombat?: boolean
  onRewardHandled?: () => void
  onStartCombat?: () => void
}

export const DungeonView: React.FC<DungeonViewProps> = ({
  combatResult = null,
  showRewardAfterCombat = false,
  onRewardHandled,
  onStartCombat,
}) => {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [path, setPath] = useState<DungeonPath | null>(null)
  const [overlayType, setOverlayType] = useState<OverlayType>('none')
  const [currentRewards, setCurrentRewards] = useState<Reward[]>([])
  const [currentEvent, setCurrentEvent] = useState<RandomEvent | null>(null)
  const [guideNodeId, setGuideNodeId] = useState<string | null>(null)

  useEffect(() => {
    let state = GameState.loadFromLocalStorage()

    if (!state) {
      state = new GameState(createDefaultTeam())
      state.saveToLocalStorage()
    }

    setGameState(state)
    setPath(state.getSave().dungeonPath)
    setGuideNodeId(state.getSave().dungeonPath.currentNodeId)
  }, [])

  useEffect(() => {
    if (!showRewardAfterCombat || !gameState) return

    const currentNode = gameState.getSave().dungeonPath.nodes.find(
      node => node.id === gameState.getSave().dungeonPath.currentNodeId
    )

    handleBattleReward(currentNode?.type === 'elite')
    onRewardHandled?.()
  }, [showRewardAfterCombat, gameState, onRewardHandled])

  const floors = useMemo(() => {
    if (!path) return []

    const grouped: DungeonNode[][] = []
    for (let y = 0; y < path.maxDepth; y += 1) {
      grouped.push(path.nodes.filter(node => node.y === y))
    }
    return grouped
  }, [path])

  const guideNode = useMemo(() => {
    if (!path) return null

    return path.nodes.find(node => node.id === guideNodeId)
      ?? path.nodes.find(node => node.id === path.currentNodeId)
      ?? path.nodes.find(node => node.state === 'completed')
      ?? path.nodes.find(node => node.state === 'available')
      ?? null
  }, [guideNodeId, path])

  const guideTargets = useMemo(() => {
    if (!path || !guideNode) return []

    return guideNode.connections
      .map(nodeId => path.nodes.find(node => node.id === nodeId))
      .filter((node): node is DungeonNode => Boolean(node))
  }, [guideNode, path])

  const highlightedTargetIds = useMemo(
    () => new Set(guideTargets.map(node => node.id)),
    [guideTargets]
  )

  const refreshPath = () => {
    if (!gameState) return

    const nextPath = gameState.getSave().dungeonPath
    setPath(nextPath)
    setGuideNodeId(nextPath.currentNodeId)
  }

  const handleNodeClick = (node: DungeonNode) => {
    setGuideNodeId(node.id)

    if (!gameState || (node.state !== 'available' && node.state !== 'current')) {
      return
    }

    if (node.state === 'available') {
      gameState.moveToNode(node.id)
      gameState.saveToLocalStorage()
      refreshPath()
    }

    switch (node.type) {
      case 'battle':
      case 'elite':
        onStartCombat?.()
        break
      case 'event':
        handleEvent()
        break
      case 'shop':
        setOverlayType('shop')
        break
      case 'rest':
        gameState.healTeam(50)
        gameState.completeCurrentNode()
        gameState.saveToLocalStorage()
        refreshPath()
        alert('在营地休息，全队恢复 50 点生命。')
        break
      case 'boss':
        alert('Boss 战即将开始。')
        break
    }
  }

  const handleBattleReward = (isElite: boolean) => {
    const rewards = new RewardGenerator().generateBattleRewards(isElite)
    setCurrentRewards(rewards)
    setOverlayType('reward')
  }

  const handleEvent = () => {
    const event = new EventGenerator().generateEvent()
    setCurrentEvent(event)
    setOverlayType('event')
  }

  const handleEventChoice = (choice: EventChoice) => {
    if (!gameState) return

    const outcome = choice.outcome

    if (outcome.damage) gameState.damageTeam(outcome.damage)
    if (outcome.heal) gameState.healTeam(outcome.heal)
    if (outcome.reward?.type === 'gold' && outcome.reward.amount) {
      gameState.addGold(outcome.reward.amount)
    } else if (outcome.reward?.type === 'equipment' || outcome.reward?.type === 'relic') {
      const reward = new RewardGenerator()
        .generateBattleRewards(false)
        .find(item => item.type === outcome.reward?.type && item.item)

      if (reward?.type === 'equipment' && reward.item) {
        gameState.addEquipment(gameState.getSave().team[0].id, reward.item as Equipment)
      } else if (reward?.type === 'relic' && reward.item) {
        gameState.addRelic(reward.item as Relic)
      }
    }

    gameState.completeCurrentNode(combatResult ?? undefined)
    gameState.saveToLocalStorage()
    refreshPath()
    setCurrentEvent(null)
    setOverlayType('none')
  }

  const handleRewardSelect = (reward: Reward) => {
    if (!gameState) return

    if (reward.type === 'equipment' && reward.item) {
      gameState.addEquipment(gameState.getSave().team[0].id, reward.item as Equipment)
    } else if (reward.type === 'relic' && reward.item) {
      gameState.addRelic(reward.item as Relic)
    } else if (reward.type === 'gold' && reward.amount) {
      gameState.addGold(reward.amount)
    } else if (reward.type === 'heal' && reward.amount) {
      gameState.healTeam(reward.amount)
    }

    gameState.completeCurrentNode()
    gameState.saveToLocalStorage()
    refreshPath()
    setOverlayType('none')
  }

  const handleShopPurchase = (item: any) => {
    if (!gameState) return

    if (!gameState.spendGold(item.price)) {
      alert('金币不足。')
      return
    }

    if (item.type === 'equipment' && item.item) {
      gameState.addEquipment(gameState.getSave().team[0].id, item.item)
    } else if (item.type === 'relic' && item.item) {
      gameState.addRelic(item.item)
    } else if (item.type === 'heal' && item.healAmount) {
      gameState.healTeam(item.healAmount)
    }

    gameState.saveToLocalStorage()
    refreshPath()
  }

  const handleShopClose = () => {
    if (!gameState) return

    gameState.completeCurrentNode()
    gameState.saveToLocalStorage()
    refreshPath()
    setOverlayType('none')
  }

  const renderNode = (node: DungeonNode) => {
    const isGuideSource = guideNode?.id === node.id
    const isGuideTarget = highlightedTargetIds.has(node.id)
    const destinationText = getDestinationText(node, path)
    const classNames = [
      'dungeon-node',
      node.type,
      node.state,
      isGuideSource ? 'route-source' : '',
      isGuideTarget ? 'route-target' : '',
    ].filter(Boolean).join(' ')

    return (
      <button
        key={node.id}
        type="button"
        className={classNames}
        onClick={() => handleNodeClick(node)}
        onMouseEnter={() => setGuideNodeId(node.id)}
        onFocus={() => setGuideNodeId(node.id)}
        disabled={node.state === 'locked'}
        title={destinationText}
      >
        <span className="node-icon">{NODE_ICONS[node.type]}</span>
        <span className="node-type">{NODE_NAMES[node.type]}</span>
        {node.connections.length > 0 && <span className="route-count">{node.connections.length}</span>}
      </button>
    )
  }

  if (!path || !gameState) {
    return <div className="dungeon-view">加载中...</div>
  }

  const save = gameState.getSave()

  return (
    <div className="dungeon-view">
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

      <div className="dungeon-map panel">
        <h3 className="panel-header">地下城路线</h3>
        <RouteGuide source={guideNode} targets={guideTargets} />
        <div className="dungeon-grid">
          {floors.map((floorNodes, floorIndex) => (
            <div key={floorIndex} className="dungeon-floor">
              <div className="floor-label">第 {floorIndex + 1} 层</div>
              <div className="floor-nodes">
                {floorNodes.map(node => renderNode(node))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="team-status panel mt-md">
        <h3 className="panel-header">队伍状态</h3>
        <div className="team-grid">
          {save.team.map(unit => (
            <div key={unit.id} className="team-member">
              <div className="member-name">{unit.name}</div>
              <div className="member-hp">HP: {unit.hp} / {unit.stats.maxHp}</div>
            </div>
          ))}
        </div>
      </div>

      {overlayType === 'reward' && (
        <RewardSelectView
          rewards={currentRewards}
          onSelect={handleRewardSelect}
          onClose={() => setOverlayType('none')}
        />
      )}

      {overlayType === 'shop' && (
        <ShopView
          currentGold={gameState.getSave().gold}
          onPurchase={handleShopPurchase}
          onClose={handleShopClose}
        />
      )}

      {overlayType === 'event' && currentEvent && (
        <EventView event={currentEvent} onChoice={handleEventChoice} />
      )}
    </div>
  )
}

const RouteGuide: React.FC<{ source: DungeonNode | null; targets: DungeonNode[] }> = ({ source, targets }) => {
  if (!source) {
    return <div className="route-guide">选择或悬停一个节点查看路线。</div>
  }

  return (
    <div className="route-guide">
      <div className="route-summary">
        <strong>路线指引:</strong>
        <span>第 {source.y + 1} 层 {NODE_NAMES[source.type]}</span>
        {targets.length > 0 ? <span>可通往</span> : <span>没有后续节点</span>}
      </div>
      {targets.length > 0 && (
        <div className="route-target-list">
          {targets.map(target => (
            <span key={target.id} className={`route-link ${target.state}`}>
              第 {target.y + 1} 层 {NODE_NAMES[target.type]}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

const getDestinationText = (node: DungeonNode, path: DungeonPath | null): string => {
  if (!path || node.connections.length === 0) {
    return `${NODE_NAMES[node.type]} - 没有后续节点`
  }

  const destinations = node.connections
    .map(nodeId => path.nodes.find(target => target.id === nodeId))
    .filter((target): target is DungeonNode => Boolean(target))
    .map(target => `第 ${target.y + 1} 层 ${NODE_NAMES[target.type]}`)
    .join('、')

  return `${NODE_NAMES[node.type]} 可通往：${destinations}`
}
