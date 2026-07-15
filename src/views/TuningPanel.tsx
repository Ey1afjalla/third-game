import React, { useState } from 'react'
import './TuningPanel.css'

interface TuningConfig {
  // 玩家角色属性
  playerStats: {
    hpMultiplier: number
    attackMultiplier: number
    defenseMultiplier: number
    speedMultiplier: number
  }
  // 敌人属性
  enemyStats: {
    hpMultiplier: number
    attackMultiplier: number
    defenseMultiplier: number
    enemyCount: number
  }
  // 战斗参数
  combat: {
    damageMultiplier: number
    critMultiplier: number
    skillCooldownMultiplier: number
  }
  // 奖励掉落
  rewards: {
    goldMultiplier: number
    equipmentDropRate: number
    relicDropRate: number
  }
}

const DEFAULT_CONFIG: TuningConfig = {
  playerStats: {
    hpMultiplier: 1.0,
    attackMultiplier: 1.0,
    defenseMultiplier: 1.0,
    speedMultiplier: 1.0,
  },
  enemyStats: {
    hpMultiplier: 1.0,
    attackMultiplier: 1.0,
    defenseMultiplier: 1.0,
    enemyCount: 3,
  },
  combat: {
    damageMultiplier: 1.0,
    critMultiplier: 1.5,
    skillCooldownMultiplier: 1.0,
  },
  rewards: {
    goldMultiplier: 1.0,
    equipmentDropRate: 0.3,
    relicDropRate: 0.2,
  },
}

type TabType = 'player' | 'enemy' | 'combat' | 'rewards'

export const TuningPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('player')
  const [config, setConfig] = useState<TuningConfig>(DEFAULT_CONFIG)
  const [presets] = useState<Record<string, TuningConfig>>({
    default: DEFAULT_CONFIG,
    easy: {
      ...DEFAULT_CONFIG,
      playerStats: { ...DEFAULT_CONFIG.playerStats, hpMultiplier: 1.5, attackMultiplier: 1.3 },
      enemyStats: { ...DEFAULT_CONFIG.enemyStats, hpMultiplier: 0.8, enemyCount: 2 },
    },
    hard: {
      ...DEFAULT_CONFIG,
      playerStats: { ...DEFAULT_CONFIG.playerStats, hpMultiplier: 0.8 },
      enemyStats: { ...DEFAULT_CONFIG.enemyStats, hpMultiplier: 1.5, attackMultiplier: 1.3, enemyCount: 4 },
    },
  })

  const handlePlayerStatChange = (stat: keyof TuningConfig['playerStats'], value: number) => {
    setConfig({
      ...config,
      playerStats: { ...config.playerStats, [stat]: value },
    })
  }

  const handleEnemyStatChange = (stat: keyof TuningConfig['enemyStats'], value: number) => {
    setConfig({
      ...config,
      enemyStats: { ...config.enemyStats, [stat]: value },
    })
  }

  const handleCombatChange = (param: keyof TuningConfig['combat'], value: number) => {
    setConfig({
      ...config,
      combat: { ...config.combat, [param]: value },
    })
  }

  const handleRewardChange = (param: keyof TuningConfig['rewards'], value: number) => {
    setConfig({
      ...config,
      rewards: { ...config.rewards, [param]: value },
    })
  }

  const handleLoadPreset = (presetName: string) => {
    if (presets[presetName]) {
      setConfig(presets[presetName])
    }
  }

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG)
  }

  const handleSave = () => {
    localStorage.setItem('tuningConfig', JSON.stringify(config))
    alert('配置已保存到浏览器')
  }

  const handleLoad = () => {
    const saved = localStorage.getItem('tuningConfig')
    if (saved) {
      setConfig(JSON.parse(saved))
      alert('配置已加载')
    } else {
      alert('没有找到保存的配置')
    }
  }

  return (
    <div className="tuning-panel">
      <h2 className="panel-header">⚙️ 调参面板</h2>

      {/* 标签栏 */}
      <div className="tab-bar">
        <button
          className={activeTab === 'player' ? 'active' : ''}
          onClick={() => setActiveTab('player')}
        >
          玩家角色
        </button>
        <button
          className={activeTab === 'enemy' ? 'active' : ''}
          onClick={() => setActiveTab('enemy')}
        >
          敌人
        </button>
        <button
          className={activeTab === 'combat' ? 'active' : ''}
          onClick={() => setActiveTab('combat')}
        >
          战斗参数
        </button>
        <button
          className={activeTab === 'rewards' ? 'active' : ''}
          onClick={() => setActiveTab('rewards')}
        >
          奖励掉落
        </button>
      </div>

      {/* 内容区 */}
      <div className="tuning-content">
        {activeTab === 'player' && (
          <div className="tuning-section">
            <h3>玩家角色属性倍率</h3>
            <div className="param-group">
              <div className="param-item">
                <label>生命值倍率：{config.playerStats.hpMultiplier.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={config.playerStats.hpMultiplier}
                  onChange={(e) => handlePlayerStatChange('hpMultiplier', parseFloat(e.target.value))}
                />
              </div>
              <div className="param-item">
                <label>攻击力倍率：{config.playerStats.attackMultiplier.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={config.playerStats.attackMultiplier}
                  onChange={(e) => handlePlayerStatChange('attackMultiplier', parseFloat(e.target.value))}
                />
              </div>
              <div className="param-item">
                <label>防御力倍率：{config.playerStats.defenseMultiplier.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={config.playerStats.defenseMultiplier}
                  onChange={(e) => handlePlayerStatChange('defenseMultiplier', parseFloat(e.target.value))}
                />
              </div>
              <div className="param-item">
                <label>速度倍率：{config.playerStats.speedMultiplier.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={config.playerStats.speedMultiplier}
                  onChange={(e) => handlePlayerStatChange('speedMultiplier', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'enemy' && (
          <div className="tuning-section">
            <h3>敌人属性</h3>
            <div className="param-group">
              <div className="param-item">
                <label>生命值倍率：{config.enemyStats.hpMultiplier.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={config.enemyStats.hpMultiplier}
                  onChange={(e) => handleEnemyStatChange('hpMultiplier', parseFloat(e.target.value))}
                />
              </div>
              <div className="param-item">
                <label>攻击力倍率：{config.enemyStats.attackMultiplier.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={config.enemyStats.attackMultiplier}
                  onChange={(e) => handleEnemyStatChange('attackMultiplier', parseFloat(e.target.value))}
                />
              </div>
              <div className="param-item">
                <label>防御力倍率：{config.enemyStats.defenseMultiplier.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={config.enemyStats.defenseMultiplier}
                  onChange={(e) => handleEnemyStatChange('defenseMultiplier', parseFloat(e.target.value))}
                />
              </div>
              <div className="param-item">
                <label>敌人数量：{config.enemyStats.enemyCount}</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={config.enemyStats.enemyCount}
                  onChange={(e) => handleEnemyStatChange('enemyCount', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'combat' && (
          <div className="tuning-section">
            <h3>战斗参数</h3>
            <div className="param-group">
              <div className="param-item">
                <label>伤害倍率：{config.combat.damageMultiplier.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={config.combat.damageMultiplier}
                  onChange={(e) => handleCombatChange('damageMultiplier', parseFloat(e.target.value))}
                />
              </div>
              <div className="param-item">
                <label>暴击倍率：{config.combat.critMultiplier.toFixed(1)}x</label>
                <input
                  type="range"
                  min="1.0"
                  max="3.0"
                  step="0.1"
                  value={config.combat.critMultiplier}
                  onChange={(e) => handleCombatChange('critMultiplier', parseFloat(e.target.value))}
                />
              </div>
              <div className="param-item">
                <label>技能冷却倍率：{config.combat.skillCooldownMultiplier.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={config.combat.skillCooldownMultiplier}
                  onChange={(e) => handleCombatChange('skillCooldownMultiplier', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rewards' && (
          <div className="tuning-section">
            <h3>奖励掉落</h3>
            <div className="param-group">
              <div className="param-item">
                <label>金币倍率：{config.rewards.goldMultiplier.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={config.rewards.goldMultiplier}
                  onChange={(e) => handleRewardChange('goldMultiplier', parseFloat(e.target.value))}
                />
              </div>
              <div className="param-item">
                <label>装备掉落率：{(config.rewards.equipmentDropRate * 100).toFixed(0)}%</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.rewards.equipmentDropRate}
                  onChange={(e) => handleRewardChange('equipmentDropRate', parseFloat(e.target.value))}
                />
              </div>
              <div className="param-item">
                <label>遗物掉落率：{(config.rewards.relicDropRate * 100).toFixed(0)}%</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.rewards.relicDropRate}
                  onChange={(e) => handleRewardChange('relicDropRate', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 预设和操作 */}
      <div className="tuning-actions">
        <div className="preset-section">
          <span>预设配置：</span>
          <button onClick={() => handleLoadPreset('default')}>默认</button>
          <button onClick={() => handleLoadPreset('easy')}>简单</button>
          <button onClick={() => handleLoadPreset('hard')}>困难</button>
        </div>

        <div className="action-buttons">
          <button onClick={handleReset}>重置</button>
          <button onClick={handleSave} className="primary">保存配置</button>
          <button onClick={handleLoad}>加载配置</button>
        </div>
      </div>
    </div>
  )
}
