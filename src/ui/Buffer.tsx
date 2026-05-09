import { useGameStore } from '../game/store'
import { bufferToString } from '../engine/buffer-utils'

export function Buffer() {
  const engineState = useGameStore((s) => s.engineState)
  const levels = useGameStore((s) => s.levels)
  const currentLevelIndex = useGameStore((s) => s.currentLevelIndex)
  const level = levels[currentLevelIndex]!
  const buf = engineState.buffer
  const { line: cursorLine, col: cursorCol } = buf.cursor

  return (
    <div className="space-y-4">
      {/* Current buffer */}
      <div>
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">现在</div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-sm">
          {buf.lines.map((lineText, li) => (
            <div key={li} className="relative leading-6 whitespace-pre">
              {li === cursorLine ? (
                <>
                  {lineText.slice(0, cursorCol)}
                  <span className="relative inline-block">
                    <span className="absolute inset-0 bg-blue-600 rounded-sm" />
                    <span className="relative text-white">
                      {lineText[cursorCol] ?? ' '}
                    </span>
                  </span>
                  {lineText.slice(cursorCol + 1)}
                </>
              ) : (
                lineText || ' '
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Goal buffer */}
      <div>
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">目标</div>
        <div className="bg-gray-100 border border-dashed border-gray-300 rounded-lg p-4 font-mono text-sm text-gray-500">
          {bufferToString(buf) === level.goalBuffer && !level.goalCursor ? (
            <span className="text-green-600 font-medium">✓ 完成</span>
          ) : (
            level.goalBuffer.split('\n').map((lineText, li) => (
              <div key={li} className="leading-6 whitespace-pre">
                {lineText || ' '}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
