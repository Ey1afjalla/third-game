import type { GameSave, DungeonPath, Reward, Equipment, Relic } from '../types/dungeon'
import type { Unit, CombatResult } from '../types'
import { DungeonGenerator } from './DungeonGenerator'

export class GameState {
  private save: GameSave

  constructor(team: Unit[]) {
    const dungeonGen = new DungeonGenerator()

    this.save = {
      currentFloor: 0,
      team: team.map(u => ({ ...u })), // 深拷贝
      equipments: {},
      relics: [],
      gold: 0,
      dungeonPath: dungeonGen.generateDungeon(),
      combatHistory: [],
    }

    // 初始化装备槽
    team.forEach(unit => {
      this.save.equipments[unit.id] = []
    })
  }

  /**
   * 获取当前存档
   */
  getSave(): GameSave {
    return this.save
  }

  /**
   * 前进到下一个节点
   */
  moveToNode(nodeId: string): void {
    const dungeonGen = new DungeonGenerator()
    this.save.dungeonPath = dungeonGen.selectNode(this.save.dungeonPath, nodeId)
  }

  /**
   * 完成当前节点
   */
  completeCurrentNode(combatResult?: CombatResult): void {
    const currentNodeId = this.save.dungeonPath.currentNodeId
    if (!currentNodeId) return

    const dungeonGen = new DungeonGenerator()
    this.save.dungeonPath = dungeonGen.completeNode(this.save.dungeonPath, currentNodeId)

    // 记录战斗结果
    if (combatResult) {
      this.save.combatHistory.push(combatResult)
    }

    // 增加楼层
    const currentNode = this.save.dungeonPath.nodes.find(n => n.id === currentNodeId)
    if (currentNode) {
      this.save.currentFloor = currentNode.y
    }
  }

  /**
   * 添加金币
   */
  addGold(amount: number): void {
    this.save.gold += amount
  }

  /**
   * 消耗金币
   */
  spendGold(amount: number): boolean {
    if (this.save.gold >= amount) {
      this.save.gold -= amount
      return true
    }
    return false
  }

  /**
   * 添加装备
   */
  addEquipment(unitId: string, equipment: Equipment): void {
    if (!this.save.equipments[unitId]) {
      this.save.equipments[unitId] = []
    }
    this.save.equipments[unitId].push(equipment)

    // 应用装备属性
    this.applyEquipmentStats()
  }

  /**
   * 移除装备
   */
  removeEquipment(unitId: string, equipmentId: string): void {
    if (!this.save.equipments[unitId]) return

    this.save.equipments[unitId] = this.save.equipments[unitId].filter(
      e => e.id !== equipmentId
    )

    // 重新计算属性
    this.applyEquipmentStats()
  }

  /**
   * 添加遗物
   */
  addRelic(relic: Relic): void {
    // 检查是否已有相同遗物
    const existing = this.save.relics.find(r => r.id === relic.id)
    if (existing && existing.stackCount) {
      existing.stackCount++
    } else {
      this.save.relics.push({ ...relic, stackCount: 1 })
    }
  }

  /**
   * 治疗队伍
   */
  healTeam(amount: number): void {
    this.save.team.forEach(unit => {
      unit.hp = Math.min(unit.hp + amount, unit.stats.maxHp)
    })
  }

  /**
   * 伤害队伍
   */
  damageTeam(amount: number): void {
    this.save.team.forEach(unit => {
      unit.hp = Math.max(unit.hp - amount, 0)
    })
  }

  /**
   * 应用装备属性
   */
  private applyEquipmentStats(): void {
    this.save.team.forEach(unit => {
      const equipments = this.save.equipments[unit.id] || []

      // 重置属性（这里简化处理，实际应该保存基础属性）
      // TODO: 保存基础属性，每次重新计算

      equipments.forEach(equip => {
        if (equip.stats.attack) unit.stats.attack += equip.stats.attack
        if (equip.stats.defense) unit.stats.defense += equip.stats.defense
        if (equip.stats.maxHp) unit.stats.maxHp += equip.stats.maxHp
        if (equip.stats.speed) unit.stats.speed += equip.stats.speed
        if (equip.stats.critRate) unit.stats.critRate += equip.stats.critRate
        if (equip.stats.critDamage) unit.stats.critDamage += equip.stats.critDamage
      })
    })
  }

  /**
   * 保存到本地存储
   */
  saveToLocalStorage(): void {
    localStorage.setItem('game_save', JSON.stringify(this.save))
  }

  /**
   * 从本地存储加载
   */
  static loadFromLocalStorage(): GameState | null {
    const data = localStorage.getItem('game_save')
    if (!data) return null

    try {
      const save: GameSave = JSON.parse(data)
      const gameState = new GameState(save.team)
      gameState.save = save
      return gameState
    } catch (e) {
      console.error('Failed to load save:', e)
      return null
    }
  }

  /**
   * 清除存档
   */
  static clearSave(): void {
    localStorage.removeItem('game_save')
  }
}
