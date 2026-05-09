import { useGameStore } from '../game/store'

export function Explainer() {
  const levels = useGameStore((s) => s.levels)
  const currentLevelIndex = useGameStore((s) => s.currentLevelIndex)
  const status = useGameStore((s) => s.status)
  const keyHistory = useGameStore((s) => s.keyHistory)

  const level = levels[currentLevelIndex]!
  const { breakdown, rationale, variations } = level.explanation

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Introduces */}
      <div>
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">本关引入</div>
        <div className="flex gap-2 flex-wrap">
          {level.introducesCommands.map((cmd) => (
            <span
              key={cmd}
              className="bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-0.5 font-mono text-sm font-medium"
            >
              {cmd}
            </span>
          ))}
        </div>
      </div>

      {/* Breakdown */}
      <div>
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">拆解</div>
        <div className="font-mono text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800">
          {breakdown}
        </div>
      </div>

      {/* Rationale */}
      <div>
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">原理</div>
        <p className="text-sm text-gray-600 leading-relaxed">{rationale}</p>
      </div>

      {/* Variations */}
      <div>
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">可推广到</div>
        <ul className="space-y-1">
          {variations.map((v, i) => (
            <li key={i} className="text-sm text-gray-600 font-mono flex gap-2">
              <span className="text-gray-300">›</span>
              <span>{v}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Completion comparison */}
      {status === 'complete' && (
        <div className="mt-auto bg-green-50 border border-green-200 rounded-lg p-3 space-y-1">
          <div className="text-xs font-medium text-green-700 uppercase tracking-wider">通关</div>
          <div className="flex gap-4 font-mono text-sm">
            <div>
              <span className="text-gray-400">你用了：</span>
              <span className="text-gray-800 font-medium">{keyHistory.join('')}</span>
            </div>
            <div>
              <span className="text-gray-400">最优解：</span>
              <span className="text-green-700 font-medium">{level.optimalKeys}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
