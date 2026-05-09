import { useEffect, useRef } from 'react'
import { useGameStore } from '../game/store'
import { Buffer } from './Buffer'
import { KeyDisplay } from './KeyDisplay'
import { Explainer } from './Explainer'
import { HintBanner } from './HintBanner'
import { LevelNav } from './LevelNav'

export function GameBoard() {
  const pressKey = useGameStore((s) => s.pressKey)
  const retry = useGameStore((s) => s.retry)
  const nextLevel = useGameStore((s) => s.nextLevel)
  const previousLevel = useGameStore((s) => s.previousLevel)
  const status = useGameStore((s) => s.status)
  const levels = useGameStore((s) => s.levels)
  const currentLevelIndex = useGameStore((s) => s.currentLevelIndex)
  const keyHistory = useGameStore((s) => s.keyHistory)
  const isLastLevel = currentLevelIndex === levels.length - 1
  const containerRef = useRef<HTMLDivElement>(null)

  // Keep a ref to avoid stale closures in the keydown listener
  const navRef = useRef({ status, nextLevel, previousLevel, currentLevelIndex, levels })
  navRef.current = { status, nextLevel, previousLevel, currentLevelIndex, levels }

  // Focus the game container on mount so keyboard input works immediately
  useEffect(() => {
    containerRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const { status: s, nextLevel: nl, previousLevel: pl, currentLevelIndex: idx, levels: lvls } = navRef.current

      // Navigation shortcuts (available outside of vim key processing)
      if (e.key === 'Enter' && s === 'complete' && idx < lvls.length - 1) {
        e.preventDefault()
        nl()
        containerRef.current?.focus()
        return
      }
      if (e.key === '[' && idx > 0) {
        e.preventDefault()
        pl()
        containerRef.current?.focus()
        return
      }

      let key = e.key
      if (key === 'Escape') key = 'Escape'
      else if (key.length > 1) return

      e.preventDefault()
      pressKey(key)
    }

    const el = containerRef.current
    el?.addEventListener('keydown', onKeyDown)
    return () => el?.removeEventListener('keydown', onKeyDown)
  }, [pressKey])

  const handleRetry = () => {
    retry()
    containerRef.current?.focus()
  }

  const canRetry = keyHistory.length > 0 || status === 'complete'

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="flex flex-col h-full outline-none"
    >
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <span className="font-mono font-semibold text-gray-800 text-sm">Vim Practice</span>
          <div className="flex-1">
            <LevelNav />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-6 h-full">
          <div className="grid grid-cols-2 gap-8 h-full">
            {/* Left: buffer + controls */}
            <div className="flex flex-col gap-4">
              <Buffer />
              <HintBanner />
              <KeyDisplay />
            </div>

            {/* Right: explainer */}
            <div className="border-l border-gray-200 pl-8">
              <Explainer />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRetry}
              disabled={!canRetry}
              className="px-4 py-1.5 text-sm border rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 border-gray-300 hover:bg-gray-50 active:bg-gray-100"
            >
              重试
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-400 font-mono">
            {currentLevelIndex > 0 && (
              <span><kbd className="font-mono">[</kbd> 上一关</span>
            )}
            {status === 'complete' && !isLastLevel && (
              <span><kbd className="font-mono">Enter</kbd> 下一关</span>
            )}
            {status === 'complete' && isLastLevel && (
              <span className="text-green-600 font-sans font-medium">全部关卡完成！</span>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
