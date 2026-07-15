import type { DungeonNode, DungeonPath, NodeType } from '../types/dungeon'

export class DungeonGenerator {
  private readonly FLOORS = 8
  private readonly NODES_PER_FLOOR = 4
  private readonly BOSS_FLOOR = 8

  generateDungeon(): DungeonPath {
    const nodes: DungeonNode[] = []
    let nodeIdCounter = 0

    for (let floor = 0; floor < this.FLOORS; floor++) {
      const nodeCount = floor === 0 ? 1 : this.NODES_PER_FLOOR

      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          id: `node_${nodeIdCounter++}`,
          type: this.getNodeType(floor),
          state: floor === 0 ? 'available' : 'locked',
          x: i,
          y: floor,
          connections: [],
        })
      }
    }

    for (let floor = 0; floor < this.FLOORS - 1; floor++) {
      this.connectFloor(nodes, floor)
    }

    return {
      nodes,
      currentNodeId: nodes[0].id,
      completedNodes: [],
      maxDepth: this.FLOORS,
    }
  }

  private getNodeType(floor: number): NodeType {
    if (floor === 0) return 'battle'
    if (floor === this.BOSS_FLOOR - 1) return 'boss'

    const roll = Math.random()

    if (roll < 0.5) return 'battle'
    if (roll < 0.65) return 'elite'
    if (roll < 0.80) return 'event'
    if (roll < 0.90) return 'rest'
    return 'shop'
  }

  private connectFloor(nodes: DungeonNode[], floorIndex: number): void {
    const currentFloorNodes = nodes.filter(n => n.y === floorIndex)
    const nextFloorNodes = nodes.filter(n => n.y === floorIndex + 1)

    if (currentFloorNodes.length === 0 || nextFloorNodes.length === 0) return

    currentFloorNodes.forEach(node => {
      const existingValidConnections = node.connections.filter(connId =>
        nextFloorNodes.some(nextNode => nextNode.id === connId)
      )

      if (existingValidConnections.length > 0) {
        node.connections = existingValidConnections
        return
      }

      const connectionCount = Math.random() < 0.5 ? 2 : 3
      const possibleConnections = [...nextFloorNodes]

      for (let i = 0; i < Math.min(connectionCount, possibleConnections.length); i++) {
        const randomIndex = Math.floor(Math.random() * possibleConnections.length)
        const targetNode = possibleConnections.splice(randomIndex, 1)[0]
        node.connections.push(targetNode.id)
      }
    })
  }

  repairDungeon(path: DungeonPath): DungeonPath {
    for (let floor = 0; floor < path.maxDepth - 1; floor++) {
      this.connectFloor(path.nodes, floor)
    }

    const completedNodeIds = new Set([
      ...path.completedNodes,
      ...path.nodes.filter(node => node.state === 'completed').map(node => node.id),
    ])

    path.completedNodes = Array.from(completedNodeIds)

    completedNodeIds.forEach(nodeId => {
      const node = path.nodes.find(n => n.id === nodeId)
      node?.connections.forEach(connId => {
        const connectedNode = path.nodes.find(n => n.id === connId)
        if (connectedNode && connectedNode.state === 'locked') {
          connectedNode.state = 'available'
        }
      })
    })

    return path
  }

  completeNode(path: DungeonPath, nodeId: string): DungeonPath {
    const node = path.nodes.find(n => n.id === nodeId)
    if (!node) return path

    node.state = 'completed'
    if (!path.completedNodes.includes(nodeId)) {
      path.completedNodes.push(nodeId)
    }

    node.connections.forEach(connId => {
      const connNode = path.nodes.find(n => n.id === connId)
      if (connNode && connNode.state === 'locked') {
        connNode.state = 'available'
      }
    })

    return path
  }

  selectNode(path: DungeonPath, nodeId: string): DungeonPath {
    const node = path.nodes.find(n => n.id === nodeId)
    if (!node || node.state !== 'available') return path

    if (path.currentNodeId && path.currentNodeId !== nodeId) {
      const prevNode = path.nodes.find(n => n.id === path.currentNodeId)
      if (prevNode && prevNode.state === 'current') {
        prevNode.state = 'completed'
      }
    }

    node.state = 'current'
    path.currentNodeId = nodeId

    return path
  }

  getAvailableNodes(path: DungeonPath): DungeonNode[] {
    const currentNode = path.nodes.find(n => n.id === path.currentNodeId)
    if (!currentNode) return []

    return currentNode.connections
      .map(id => path.nodes.find(n => n.id === id))
      .filter((node): node is DungeonNode => !!node && node.state === 'available')
  }
}
