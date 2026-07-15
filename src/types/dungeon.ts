// 地下城节点类型
export type NodeType = 'battle' | 'elite' | 'event' | 'shop' | 'rest' | 'boss'

// 节点状态
export type NodeState = 'locked' | 'available' | 'completed' | 'current'

// 地下城节点
export interface DungeonNode {
  id: string
  type: NodeType
  state: NodeState
  x: number // 网格X坐标
  y: number // 网格Y坐标（层数）
  connections: string[] // 连接的下一层节点ID
  reward?: Reward // 完成后的奖励
}

// 地下城路线
export interface DungeonPath {
  nodes: DungeonNode[]
  currentNodeId: string | null
  completedNodes: string[]
  maxDepth: number
}

// 奖励类型
export type RewardType = 'equipment' | 'relic' | 'gold' | 'heal' | 'upgrade'

// 奖励
export interface Reward {
  type: RewardType
  item?: Equipment | Relic
  amount?: number // 金币数量或治疗量
}

// 装备槽位
export type EquipmentSlot = 'weapon' | 'armor' | 'accessory'

// 装备稀有度
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

// 装备
export interface Equipment {
  id: string
  name: string
  slot: EquipmentSlot
  rarity: Rarity
  stats: Partial<UnitStats> // 属性加成
  effects?: EquipmentEffect[] // 特殊效果
  description: string
}

// 装备效果
export interface EquipmentEffect {
  type: string
  value: number
  description: string
}

// 遗物
export interface Relic {
  id: string
  name: string
  rarity: Rarity
  effect: string
  description: string
  stackCount?: number // 可叠加次数
}

// 游戏存档（单局状态）
export interface GameSave {
  currentFloor: number
  team: Unit[]
  equipments: Record<string, Equipment[]> // 角色ID -> 装备列表
  relics: Relic[]
  gold: number
  dungeonPath: DungeonPath
  combatHistory: CombatResult[]
}

// 随机事件
export interface RandomEvent {
  id: string
  title: string
  description: string
  choices: EventChoice[]
}

// 事件选项
export interface EventChoice {
  id: string
  text: string
  outcome: EventOutcome
}

// 事件结果
export interface EventOutcome {
  type: 'reward' | 'damage' | 'heal' | 'buff' | 'nothing'
  reward?: Reward
  damage?: number
  heal?: number
  buff?: string
  description: string
}
import type { CombatResult, Unit, UnitStats } from './index'
