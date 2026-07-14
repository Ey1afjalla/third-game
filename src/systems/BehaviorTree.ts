import { BehaviorNode, NodeResult, AIContext } from '../types'
import type { Unit, Skill } from '../types'

/**
 * 条件节点
 */
export class Condition extends BehaviorNode {
  private predicate: (context: AIContext) => boolean

  constructor(predicate: (context: AIContext) => boolean) {
    super()
    this.predicate = predicate
  }

  execute(context: AIContext): NodeResult {
    return this.predicate(context) ? NodeResult.SUCCESS : NodeResult.FAILURE
  }
}

/**
 * 行动节点
 */
export class Action extends BehaviorNode {
  private action: (context: AIContext) => { skill: Skill; target: Unit | Unit[] } | null

  constructor(action: (context: AIContext) => { skill: Skill; target: Unit | Unit[] } | null) {
    super()
    this.action = action
  }

  execute(context: AIContext): NodeResult {
    const result = this.action(context)
    return result ? NodeResult.SUCCESS : NodeResult.FAILURE
  }

  getAction(context: AIContext) {
    return this.action(context)
  }
}

/**
 * 序列节点 - 所有子节点都成功才成功
 */
export class Sequence extends BehaviorNode {
  private children: BehaviorNode[]

  constructor(children: BehaviorNode[]) {
    super()
    this.children = children
  }

  execute(context: AIContext): NodeResult {
    for (const child of this.children) {
      const result = child.execute(context)
      if (result !== NodeResult.SUCCESS) {
        return result
      }
    }
    return NodeResult.SUCCESS
  }

  getChildren() {
    return this.children
  }
}

/**
 * 选择节点 - 任一子节点成功即成功
 */
export class Selector extends BehaviorNode {
  private children: BehaviorNode[]

  constructor(children: BehaviorNode[]) {
    super()
    this.children = children
  }

  execute(context: AIContext): NodeResult {
    for (const child of this.children) {
      const result = child.execute(context)
      if (result === NodeResult.SUCCESS) {
        return NodeResult.SUCCESS
      }
    }
    return NodeResult.FAILURE
  }

  getChildren() {
    return this.children
  }
}

/**
 * 骸骨士兵行为树
 */
export function createSkeletonSoldierBehavior(): BehaviorNode {
  return new Selector([
    // 自保：生命值 < 30% 时防御
    new Sequence([
      new Condition((ctx) => ctx.self.hp / ctx.self.stats.maxHp < 0.3),
      new Action((ctx) => {
        const skill = ctx.self.skills.find(s => s.id === 'heavy_strike' && s.currentCooldown === 0)
        if (!skill) return null

        const lowestHpEnemy = ctx.enemies
          .filter(e => e.hp > 0)
          .reduce((a, b) => (a.hp / a.stats.maxHp < b.hp / b.stats.maxHp) ? a : b, ctx.enemies[0])

        return { skill, target: lowestHpEnemy }
      })
    ]),

    // 优先击杀低血量目标
    new Sequence([
      new Condition((ctx) => ctx.enemies.some(e => e.hp > 0 && e.hp / e.stats.maxHp < 0.25)),
      new Action((ctx) => {
        const skill = ctx.self.skills.find(s => s.id === 'heavy_strike' && s.currentCooldown === 0)
        if (!skill) return null

        const lowHpTarget = ctx.enemies
          .filter(e => e.hp > 0 && e.hp / e.stats.maxHp < 0.25)
          .reduce((a, b) => a.hp < b.hp ? a : b)

        return { skill, target: lowHpTarget }
      })
    ]),

    // 默认攻击最高威胁
    new Action((ctx) => {
      const skill = ctx.self.skills[0] // 基础攻击
      const target = ctx.enemies
        .filter(e => e.hp > 0)
        .reduce((a, b) => a.threat > b.threat ? a : b, ctx.enemies[0])

      return skill ? { skill, target } : null
    })
  ])
}

/**
 * 骸骨弓手行为树
 */
export function createSkeletonArcherBehavior(): BehaviorNode {
  return new Selector([
    // 后排优先
    new Sequence([
      new Condition((ctx) => ctx.enemies.some(e => e.hp > 0 && e.position === 'back')),
      new Action((ctx) => {
        const skill = ctx.self.skills.find(s => s.currentCooldown === 0 && s.power >= 2.0) || ctx.self.skills[0]
        const backRowTargets = ctx.enemies.filter(e => e.hp > 0 && e.position === 'back')
        const target = backRowTargets[Math.floor(Math.random() * backRowTargets.length)]

        return skill ? { skill, target } : null
      })
    ]),

    // 默认攻击随机目标
    new Action((ctx) => {
      const skill = ctx.self.skills[0]
      const aliveEnemies = ctx.enemies.filter(e => e.hp > 0)
      const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)]

      return skill ? { skill, target } : null
    })
  ])
}

/**
 * 骸骨法师行为树
 */
export function createSkeletonMageBehavior(): BehaviorNode {
  return new Selector([
    // 群体攻击（如果有 AOE 技能且敌人 >= 2）
    new Sequence([
      new Condition((ctx) => ctx.enemies.filter(e => e.hp > 0).length >= 2),
      new Condition((ctx) => ctx.self.skills.some(s => s.targetRule === 'all_enemies' && s.currentCooldown === 0)),
      new Action((ctx) => {
        const skill = ctx.self.skills.find(s => s.targetRule === 'all_enemies' && s.currentCooldown === 0)
        if (!skill) return null

        const targets = ctx.enemies.filter(e => e.hp > 0)
        return { skill, target: targets }
      })
    ]),

    // 集火低血量
    new Sequence([
      new Condition((ctx) => ctx.enemies.some(e => e.hp > 0 && e.hp / e.stats.maxHp < 0.4)),
      new Action((ctx) => {
        const skill = ctx.self.skills.find(s => s.currentCooldown === 0 && s.power >= 2.0) || ctx.self.skills[0]
        const lowHpTarget = ctx.enemies
          .filter(e => e.hp > 0 && e.hp / e.stats.maxHp < 0.4)
          .reduce((a, b) => a.hp < b.hp ? a : b)

        return skill ? { skill, target: lowHpTarget } : null
      })
    ]),

    // 默认魔法攻击
    new Action((ctx) => {
      const skill = ctx.self.skills[0]
      const aliveEnemies = ctx.enemies.filter(e => e.hp > 0)
      const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)]

      return skill ? { skill, target } : null
    })
  ])
}

/**
 * 根据敌人类型获取行为树
 */
export function getEnemyBehaviorTree(enemyName: string): BehaviorNode {
  switch (enemyName) {
    case '骸骨士兵':
      return createSkeletonSoldierBehavior()
    case '骸骨弓手':
      return createSkeletonArcherBehavior()
    case '骸骨法师':
      return createSkeletonMageBehavior()
    default:
      // 默认简单行为
      return new Action((ctx) => {
        const skill = ctx.self.skills[0]
        const target = ctx.enemies.filter(e => e.hp > 0)[0]
        return skill ? { skill, target } : null
      })
  }
}
