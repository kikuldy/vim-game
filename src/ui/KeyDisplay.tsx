import { useGameStore } from '../game/store'

export function KeyDisplay() {
  const keyHistory = useGameStore((s) => s.keyHistory)
  const parseState = useGameStore((s) => s.parseState)

  const pending = parseState.phase === 'operator' || parseState.phase === 'await-char'

  return (
    <div className="flex items-center gap-2 font-mono text-sm">
      <span className="text-xs text-gray-400 uppercase tracking-wider">按键</span>
      <span className="bg-gray-900 text-green-400 rounded px-3 py-1 min-w-16 min-h-7 flex items-center gap-0.5">
        {keyHistory.map((k, i) => (
          <span key={i}>{k}</span>
        ))}
        {pending && (
          <span className="opacity-50 animate-pulse">_</span>
        )}
        {keyHistory.length === 0 && !pending && (
          <span className="opacity-30">...</span>
        )}
      </span>
    </div>
  )
}
