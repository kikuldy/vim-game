import { useGameStore } from '../game/store'

export function LevelNav() {
  const levels = useGameStore((s) => s.levels)
  const currentLevelIndex = useGameStore((s) => s.currentLevelIndex)
  const level = levels[currentLevelIndex]!
  const total = levels.length
  const current = currentLevelIndex + 1
  const pct = Math.round((current / total) * 100)

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm font-medium text-gray-700">
        {level.id}：{level.title}
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-gray-400">
          {current}/{total}
        </span>
      </div>
    </div>
  )
}
