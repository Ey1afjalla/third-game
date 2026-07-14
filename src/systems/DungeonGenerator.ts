import type { DungeonNode, DungeonPath, NodeType, NodeState } from '../types/dungeon'

export class DungeonGenerator {
  private readonly FLOORS = 8 // 地下城总层数
  private readonly NODES_PER_FLOOR = 4 // 每层节点数
  private readonly BOSS_FLOOR = 8 // Boss层

  /**
   * 生成完整的地下城路线
   */
  generateDungeon(): DungeonPath {
    const nodes: DungeonNode[] = []
    let nodeIdCounter = 0

    // 生成每一层
    for (let floor = 0; floor < this.FLOORS; floor++) {
      const nodeCount = floor === 0 ? 1 : this.NODES_PER_FLOOR
      const floorNodes: DungeonNode[] = []

      // 生成该层的节点
      for (let i = 0; i < nodeCount; i++) {
        const node: DungeonNode = {
          id: `node_${nodeIdCounter++}`,
          type: this.getNodeType(floor),
          state: floor === 0 ? 'available' : 'locked',
          x: i,
          y: floor,
          connections: [],
        }
        floorNodes.push(node)
        nodes.push(node)
      }

      // 连接到下一层
      if (floor < this.FLOORS - 1) {
        this.connectToNextFloor(floorNodes, nodes, floor)
      }
    }

    return {
      nodes,
      currentNodeId: nodes[0].id,
      completedNodes: [],
      maxDepth: this.FLOORS,
    }
  }

  /**
   * 根据层数决定节点类型
   */
  private getNodeType(floor: number): NodeType {
    if (floor === 0) return 'battle' // 第一层总是战斗
    if (floor === this.BOSS_FLOOR - 1) return 'boss' // 最后一层是Boss

    // 其他层随机决定
    const roll = Math.random()

    if (roll < 0.5) {
      return 'battle' // 50% 普通战斗
    } else if (roll < 0.65) {
      return 'elite' // 15% 精英战斗
    } else if (roll < 0.80) {
      return 'event' // 15% 随机事件
    } else if (roll < 0.90) {
      return 'rest' // 10% 休息点
    } else {
      return 'shop' // 10% 商店
    }
  }

  /**
   * 连接当前层到下一层
   */
  private connectToNextFloor(
    currentFloor: DungeonNode[],
    allNodes: DungeonNode[],
    floorIndex: number
  ): void {
    const nextFloorNodes = allNodes.filter(n => n.y === floorIndex + 1)

    currentFloor.forEach(node => {
      // 每个节点连接到下一层的 2-3 个节点
      const connectionCount = Math.random() < 0.5 ? 2 : 3
      const possibleConnections = [...nextFloorNodes]

      // 随机选择连接
      for (let i = 0; i < Math.min(connectionCount, possibleConnections.length); i++) {
        const randomIndex = Math.floor(Math.random() * possibleConnections.length)
        const targetNode = possibleConnections.splice(randomIndex, 1)[0]
        node.connections.push(targetNode.id)
      }
    })
  }

  /**
   * 完成一个节点
   */
  completeNode(path: DungeonPath, nodeId: string): DungeonPath {
    const node = path.nodes.find(n => n.id === nodeId)
    if (!node) return path

    // 标记为已完成
    node.state = 'completed'
    path.completedNodes.push(nodeId)

    // 解锁连接的节点
    node.connections.forEach(connId => {
      const connNode = path.nodes.find(n => n.id === connId)
      if (connNode && connNode.state === 'locked') {
        connNode.state = 'available'
      }
    })

    return path
  }

  /**
   * 选择下一个节点
   */
  selectNode(path: DungeonPath, nodeId: string): DungeonPath {
    const node = path.nodes.find(n => n.id === nodeId)
    if (!node || node.state !== 'available') return path

    // 更新当前节点
    if (path.currentNodeId) {
      const prevNode = path.nodes.find(n => n.id === path.currentNodeId)
      if (prevNode) prevNode.state = 'completed'
    }

    node.state = 'current'
    path.currentNodeId = nodeId

    return path
  }

  /**
   * 获取可选择的下一个节点
   */
  getAvailableNodes(path: DungeonPath): DungeonNode[] {
    const currentNode = path.nodes.find(n => n.id === path.currentNodeId)
    if (!currentNode) return []

    return currentNode.connections
      .map(id => path.nodes.find(n => n.id === id))
      .filter(n => n && n.state === 'available') as DungeonNode[]
  }
}
