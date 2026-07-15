import React, { useState } from 'react'
import {
  DEFAULT_TUNING_CONFIG,
  loadTuningConfig,
  resetTuningConfig,
  saveTuningConfig,
  type TuningConfig,
} from '../systems/TuningConfig'
import './TuningPanel.css'

type TabType = 'player' | 'enemy' | 'combat' | 'rewards'

const PRESETS: Record<string, TuningConfig> = {
  default: DEFAULT_TUNING_CONFIG,
  easy: {
      ...DEFAULT_TUNING_CONFIG,
      playerStats: { ...DEFAULT_TUNING_CONFIG.playerStats, hpMultiplier: 1.5, attackMultiplier: 1.3 },
      enemyStats: { ...DEFAULT_TUNING_CONFIG.enemyStats, hpMultiplier: 0.8, speedMultiplier: 0.9, enemyCount: 2 },
  },
  hard: {
      ...DEFAULT_TUNING_CONFIG,
      playerStats: { ...DEFAULT_TUNING_CONFIG.playerStats, hpMultiplier: 0.8 },
      enemyStats: { ...DEFAULT_TUNING_CONFIG.enemyStats, hpMultiplier: 1.5, attackMultiplier: 1.3, speedMultiplier: 1.2, enemyCount: 4 },
  },
}

const cloneConfig = (config: TuningConfig): TuningConfig => JSON.parse(JSON.stringify(config))

export const TuningPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('player')
  const [config, setConfig] = useState<TuningConfig>(() => loadTuningConfig())

  const updateConfig = (nextConfig: TuningConfig) => {
    setConfig(nextConfig)
    saveTuningConfig(nextConfig)
  }

  const handlePlayerStatChange = (stat: keyof TuningConfig['playerStats'], value: number) => {
    updateConfig({
      ...config,
      playerStats: { ...config.playerStats, [stat]: value },
    })
  }

  const handleEnemyStatChange = (stat: keyof TuningConfig['enemyStats'], value: number) => {
    updateConfig({
      ...config,
      enemyStats: { ...config.enemyStats, [stat]: value },
    })
  }

  const handleCombatChange = (param: keyof TuningConfig['combat'], value: number) => {
    updateConfig({
      ...config,
      combat: { ...config.combat, [param]: value },
    })
  }

  const handleRewardChange = (param: keyof TuningConfig['rewards'], value: number) => {
    updateConfig({
      ...config,
      rewards: { ...config.rewards, [param]: value },
    })
  }

  const handleLoadPreset = (presetName: string) => {
    const preset = PRESETS[presetName]
    if (preset) updateConfig(cloneConfig(preset))
  }

  const handleReset = () => {
    setConfig(resetTuningConfig())
  }

  const handleSave = () => {
    saveTuningConfig(config)
    alert('配置已保存')
  }

  const handleLoad = () => {
    setConfig(loadTuningConfig())
    alert('配置已加载')
  }

  return (
    <div className="tuning-panel">
      <h2 className="panel-header">调参面板</h2>

      <div className="tab-bar">
        <button className={activeTab === 'player' ? 'active' : ''} onClick={() => setActiveTab('player')}>
          玩家角色
        </button>
        <button className={activeTab === 'enemy' ? 'active' : ''} onClick={() => setActiveTab('enemy')}>
          敌人
        </button>
        <button className={activeTab === 'combat' ? 'active' : ''} onClick={() => setActiveTab('combat')}>
          战斗参数
        </button>
        <button className={activeTab === 'rewards' ? 'active' : ''} onClick={() => setActiveTab('rewards')}>
          奖励掉落
        </button>
      </div>

      <div className="tuning-content">
        {activeTab === 'player' && (
          <div className="tuning-section">
            <h3>玩家角色属性倍率</h3>
            <div className="param-group">
              <Slider label="生命值倍率" value={config.playerStats.hpMultiplier} min={0.5} max={2} step={0.1} suffix="x" onChange={value => handlePlayerStatChange('hpMultiplier', value)} />
              <Slider label="攻击力倍率" value={config.playerStats.attackMultiplier} min={0.5} max={2} step={0.1} suffix="x" onChange={value => handlePlayerStatChange('attackMultiplier', value)} />
              <Slider label="防御力倍率" value={config.playerStats.defenseMultiplier} min={0.5} max={2} step={0.1} suffix="x" onChange={value => handlePlayerStatChange('defenseMultiplier', value)} />
              <Slider label="速度倍率" value={config.playerStats.speedMultiplier} min={0.5} max={2} step={0.1} suffix="x" onChange={value => handlePlayerStatChange('speedMultiplier', value)} />
            </div>
          </div>
        )}

        {activeTab === 'enemy' && (
          <div className="tuning-section">
            <h3>敌人属性</h3>
            <div className="param-group">
              <Slider label="生命值倍率" value={config.enemyStats.hpMultiplier} min={0.5} max={2} step={0.1} suffix="x" onChange={value => handleEnemyStatChange('hpMultiplier', value)} />
              <Slider label="攻击力倍率" value={config.enemyStats.attackMultiplier} min={0.5} max={2} step={0.1} suffix="x" onChange={value => handleEnemyStatChange('attackMultiplier', value)} />
              <Slider label="防御力倍率" value={config.enemyStats.defenseMultiplier} min={0.5} max={2} step={0.1} suffix="x" onChange={value => handleEnemyStatChange('defenseMultiplier', value)} />
              <Slider label="速度倍率" value={config.enemyStats.speedMultiplier} min={0.5} max={2} step={0.1} suffix="x" onChange={value => handleEnemyStatChange('speedMultiplier', value)} />
              <Slider label="敌人数量" value={config.enemyStats.enemyCount} min={1} max={5} step={1} onChange={value => handleEnemyStatChange('enemyCount', value)} />
            </div>
          </div>
        )}

        {activeTab === 'combat' && (
          <div className="tuning-section">
            <h3>战斗参数</h3>
            <div className="param-group">
              <Slider label="伤害倍率" value={config.combat.damageMultiplier} min={0.5} max={2} step={0.1} suffix="x" onChange={value => handleCombatChange('damageMultiplier', value)} />
              <Slider label="暴击倍率" value={config.combat.critMultiplier} min={1} max={3} step={0.1} suffix="x" onChange={value => handleCombatChange('critMultiplier', value)} />
              <Slider label="技能威力倍率" value={config.combat.skillPowerMultiplier} min={0.5} max={2} step={0.1} suffix="x" onChange={value => handleCombatChange('skillPowerMultiplier', value)} />
              <Slider label="技能冷却倍率" value={config.combat.skillCooldownMultiplier} min={0.5} max={2} step={0.1} suffix="x" onChange={value => handleCombatChange('skillCooldownMultiplier', value)} />
            </div>
          </div>
        )}

        {activeTab === 'rewards' && (
          <div className="tuning-section">
            <h3>奖励掉落</h3>
            <div className="param-group">
              <Slider label="金币倍率" value={config.rewards.goldMultiplier} min={0.5} max={3} step={0.1} suffix="x" onChange={value => handleRewardChange('goldMultiplier', value)} />
              <Slider label="装备掉落率" value={config.rewards.equipmentDropRate} min={0} max={1} step={0.05} percent onChange={value => handleRewardChange('equipmentDropRate', value)} />
              <Slider label="遗物掉落率" value={config.rewards.relicDropRate} min={0} max={1} step={0.05} percent onChange={value => handleRewardChange('relicDropRate', value)} />
            </div>
          </div>
        )}
      </div>

      <div className="tuning-actions">
        <div className="preset-section">
          <span>预设配置:</span>
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

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  suffix?: string
  percent?: boolean
  onChange: (value: number) => void
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, step, suffix = '', percent = false, onChange }) => {
  const displayValue = percent ? `${(value * 100).toFixed(0)}%` : `${value.toFixed(step < 1 ? 1 : 0)}${suffix}`

  return (
    <div className="param-item">
      <label>{label}: {displayValue}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  )
}
