import { useState } from 'react'
import './App.css'
import { CombatView } from './views/CombatView'
import { DungeonView } from './views/DungeonView'
import type { CombatResult } from './types'

function App() {
  const [gameState, setGameState] = useState<'menu' | 'combat' | 'dungeon'>('menu')
  const [showRewardAfterCombat, setShowRewardAfterCombat] = useState(false)
  const [combatResult, setCombatResult] = useState<CombatResult | null>(null)

  const handleCombatComplete = (result: CombatResult) => {
    console.log('[App] Combat completed:', result.victory ? 'Victory' : 'Defeat')
    setCombatResult(result)
    setShowRewardAfterCombat(true)
    // 如果胜利，显示奖励；如果失败，返回地下城
    if (result.victory) {
      setGameState('dungeon')
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>⚔️ 迷你地下城指挥官</h1>
        <p className="subtitle">Mini Dungeon Commander</p>
      </header>

      <main className="app-main">
        {gameState === 'menu' && (
          <div className="main-menu panel">
            <h2 className="panel-header">主菜单</h2>
            <div className="menu-buttons flex-column gap-md">
              <button
                className="primary"
                onClick={() => setGameState('dungeon')}
              >
                开始冒险
              </button>
              <button
                onClick={() => setGameState('combat')}
              >
                快速战斗（测试）
              </button>
              <button disabled>
                继续游戏（开发中）
              </button>
              <button disabled>
                设置（开发中）
              </button>
            </div>

            <div className="version-info">
              <p>版本：v0.3.0-dev</p>
              <p>状态：阶段3开发中 - Roguelike构筑</p>
              <p>最后更新：2026-07-15</p>
            </div>
          </div>
        )}

        {gameState === 'dungeon' && (
          <div className="dungeon-container">
            <button onClick={() => setGameState('menu')} className="back-button">
              ← 返回主菜单
            </button>
            <DungeonView
              showRewardAfterCombat={showRewardAfterCombat}
              onRewardHandled={() => setShowRewardAfterCombat(false)}
              onStartCombat={() => setGameState('combat')}
            />
          </div>
        )}

        {gameState === 'combat' && (
          <div className="combat-container">
            <button onClick={() => setGameState('menu')} className="back-button">
              ← 返回主菜单
            </button>
            <CombatView onCombatComplete={handleCombatComplete} />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>战术自动战斗 Roguelike 游戏 · 本地单机</p>
      </footer>
    </div>
  )
}

export default App
