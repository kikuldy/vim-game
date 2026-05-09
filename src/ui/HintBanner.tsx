import { useGameStore } from '../game/store'

export function HintBanner() {
  const hint = useGameStore((s) => s.hint)

  if (!hint) return null

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700 font-mono">
      {hint}
    </div>
  )
}
