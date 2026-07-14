import { useState } from 'react'
import './App.css'
import { CombatView } from './views/CombatView'

function App() {
  const [gameState, setGameState] = useState<'menu' | 'combat' | 'dungeon'>('menu')

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
                onClick={() => setGameState('combat')}
              >
                开始战斗
              </button>
              <button disabled>
                进入地下城（开发中）
              </button>
              <button disabled>
                小队配置（开发中）
              </button>
              <button disabled>
                战斗复盘（开发中）
              </button>
              <button disabled>
                调参面板（开发中）
              </button>
            </div>

            <div className="version-info">
              <p>版本：v0.1.0-dev</p>
              <p>状态：基础战斗系统已完成</p>
              <p>最后更新：2026-07-15</p>
            </div>
          </div>
        )}

        {gameState === 'combat' && (
          <div className="combat-container">
            <div className="combat-header">
              <button onClick={() => setGameState('menu')}>
                ← 返回主菜单
              </button>
            </div>
            <CombatView />
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
