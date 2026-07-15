import type { RandomEvent } from '../types/dungeon'

export class EventGenerator {
  /**
   * 生成随机事件
   */
  generateEvent(): RandomEvent {
    const events = this.getEventPool()
    return events[Math.floor(Math.random() * events.length)]
  }

  /**
   * 获取事件池
   */
  private getEventPool(): RandomEvent[] {
    return [
      {
        id: 'old_altar',
        title: '古老的祭坛',
        description: '你发现了一座布满灰尘的祭坛，上面刻着神秘的符文。',
        choices: [
          {
            id: 'sacrifice',
            text: '献祭20点生命',
            outcome: {
              type: 'reward',
              damage: 20,
              reward: {
                type: 'equipment',
              },
              description: '祭坛接受了你的献祭，赐予你一件装备',
            },
          },
          {
            id: 'pray',
            text: '虔诚祈祷',
            outcome: {
              type: 'buff',
              buff: 'blessing',
              description: '你感到一股神圣的力量加持在身上（攻击+5，持续3场战斗）',
            },
          },
          {
            id: 'leave',
            text: '离开',
            outcome: {
              type: 'nothing',
              description: '你选择不触碰祭坛，安全地离开了',
            },
          },
        ],
      },
      {
        id: 'lost_merchant',
        title: '迷路的商人',
        description: '一个背着大包的商人在地下城中迷了路，他愿意低价出售一些货物。',
        choices: [
          {
            id: 'buy_relic',
            text: '花费50金币购买遗物',
            outcome: {
              type: 'reward',
              goldCost: 50,
              reward: {
                type: 'relic',
              },
              description: '你获得了一件神秘的遗物',
            },
          },
          {
            id: 'buy_heal',
            text: '花费30金币购买生命药剂',
            outcome: {
              type: 'heal',
              goldCost: 30,
              heal: 50,
              description: '全队生命上限提升50点',
            },
          },
          {
            id: 'rob',
            text: '抢劫商人',
            outcome: {
              type: 'reward',
              reward: {
                type: 'gold',
                amount: 80,
              },
              damage: 15,
              description: '你成功抢劫了商人，但在逃跑中受了伤（全队-15生命，+80金币）',
            },
          },
        ],
      },
      {
        id: 'underground_spring',
        title: '地下泉水',
        description: '你发现了一处清澈的泉水，散发着淡淡的光芒。',
        choices: [
          {
            id: 'drink',
            text: '饮用泉水',
            outcome: {
              type: 'heal',
              heal: 40,
              description: '泉水强化了你的体魄（全队生命上限+40）',
            },
          },
          {
            id: 'bottle',
            text: '装瓶带走',
            outcome: {
              type: 'reward',
              reward: {
                type: 'relic',
              },
              description: '你获得了"圣水瓶"遗物',
            },
          },
          {
            id: 'ignore',
            text: '不要触碰',
            outcome: {
              type: 'nothing',
              description: '你谨慎地避开了泉水',
            },
          },
        ],
      },
      {
        id: 'mysterious_chest',
        title: '神秘的宝箱',
        description: '一个精致的宝箱静静地放在房间中央，没有任何守卫。',
        choices: [
          {
            id: 'open',
            text: '打开宝箱',
            outcome: {
              type: 'reward',
              reward: {
                type: 'gold',
                amount: 60,
              },
              description: '宝箱中装满了金币（+60金币）',
            },
          },
          {
            id: 'inspect',
            text: '仔细检查',
            outcome: {
              type: 'reward',
              reward: {
                type: 'equipment',
              },
              description: '你发现了隐藏的机关，安全地获得了宝箱中的装备',
            },
          },
          {
            id: 'smash',
            text: '暴力破坏',
            outcome: {
              type: 'damage',
              damage: 25,
              reward: {
                type: 'gold',
                amount: 40,
              },
              description: '宝箱中的陷阱爆炸了！（全队-25生命，+40金币）',
            },
          },
        ],
      },
      {
        id: 'campfire',
        title: '废弃的营地',
        description: '你发现了一处废弃的营地，还有余温的篝火。',
        choices: [
          {
            id: 'rest',
            text: '休息锻炼',
            outcome: {
              type: 'heal',
              heal: 30,
              description: '短暂的休整让你们状态更稳（全队生命上限+30）',
            },
          },
          {
            id: 'search',
            text: '搜索物资',
            outcome: {
              type: 'reward',
              reward: {
                type: 'gold',
                amount: 30,
              },
              description: '你在营地中找到了一些金币（+30金币）',
            },
          },
          {
            id: 'train',
            text: '训练技能',
            outcome: {
              type: 'reward',
              reward: {
                type: 'upgrade',
              },
              description: '你强化了一个技能',
            },
          },
        ],
      },
    ]
  }
}
