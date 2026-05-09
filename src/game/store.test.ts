import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './store'
import { bufferToString } from '../engine/buffer-utils'

// Reset store to initial state before each test
beforeEach(() => {
  useGameStore.setState(useGameStore.getInitialState())
  localStorage.clear()
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function press(...keys: string[]) {
  for (const k of keys) useGameStore.getState().pressKey(k)
}

function state() {
  return useGameStore.getState()
}

// ─── Level 1-1: l ────────────────────────────────────────────────────────────

describe('level 1-1 (l)', () => {
  it('starts at level 0, status playing', () => {
    expect(state().currentLevelIndex).toBe(0)
    expect(state().status).toBe('playing')
  })

  it('pressing l moves cursor right', () => {
    press('l')
    const buf = state().engineState.buffer
    expect(buf.cursor.col).toBe(1)
  })

  it('pressing l twice completes the level', () => {
    press('l', 'l')
    expect(state().status).toBe('complete')
  })

  it('pressing l once does not complete the level', () => {
    press('l')
    expect(state().status).toBe('playing')
  })

  it('disallowed command (w) is blocked and hint is shown', () => {
    press('w')
    expect(state().hint).toMatch(/w/)
    // buffer should not change
    expect(state().engineState.buffer.cursor.col).toBe(0)
  })

  it('after completing, further key presses are ignored', () => {
    press('l', 'l')
    const bufBefore = state().engineState.buffer
    press('l')
    expect(state().engineState.buffer).toBe(bufBefore)
  })

  it('retry resets buffer and key history', () => {
    press('l')
    state().retry()
    expect(state().engineState.buffer.cursor.col).toBe(0)
    expect(state().keyHistory).toHaveLength(0)
    expect(state().status).toBe('playing')
  })
})

// ─── Level navigation ─────────────────────────────────────────────────────────

describe('nextLevel', () => {
  it('nextLevel advances to level 2', () => {
    // Complete level 1-1 first
    press('l', 'l')
    state().nextLevel()
    expect(state().currentLevelIndex).toBe(1)
    expect(state().status).toBe('playing')
  })

  it('nextLevel resets buffer to new level initial state', () => {
    press('l', 'l')
    state().nextLevel()
    // Level 1-2: "cat" cursor at col 2
    const buf = state().engineState.buffer
    expect(bufferToString(buf)).toBe('cat')
    expect(buf.cursor.col).toBe(2)
  })

  it('nextLevel clears key history', () => {
    press('l', 'l')
    state().nextLevel()
    expect(state().keyHistory).toHaveLength(0)
  })
})

// ─── previousLevel ───────────────────────────────────────────────────────────

describe('previousLevel', () => {
  it('does nothing when already at level 0', () => {
    state().previousLevel()
    expect(state().currentLevelIndex).toBe(0)
  })

  it('goes back to level 0 from level 1', () => {
    press('l', 'l')
    state().nextLevel()
    expect(state().currentLevelIndex).toBe(1)

    state().previousLevel()
    expect(state().currentLevelIndex).toBe(0)
    expect(state().status).toBe('playing')
  })

  it('previousLevel resets buffer to that level initial state', () => {
    press('l', 'l')
    state().nextLevel()
    state().previousLevel()
    // Level 1-1: "cat" cursor at col 0
    const buf = state().engineState.buffer
    expect(bufferToString(buf)).toBe('cat')
    expect(buf.cursor.col).toBe(0)
  })

  it('previousLevel clears key history and hint', () => {
    press('l', 'l')
    state().nextLevel()
    state().previousLevel()
    expect(state().keyHistory).toHaveLength(0)
    expect(state().hint).toBeNull()
  })
})

// ─── Parse state (pending) ───────────────────────────────────────────────────

describe('pending parse state', () => {
  it('pressing an operator key enters pending state', () => {
    // Navigate to a level that allows d (phase 3). For now just verify
    // that 'd' alone (pending) doesn't execute anything in level 1-1
    // (it will be blocked when motion comes, since d+anything isn't in allowedCommands)
    press('d')
    // 'd' alone keeps parser in operator phase, no command executed yet
    expect(state().parseState.phase).toBe('operator')
    expect(state().hint).toBeNull()
  })

  it('pressing Escape cancels pending state', () => {
    press('d')
    press('Escape')
    expect(state().parseState.phase).toBe('idle')
  })
})

// ─── Hint auto-clears on next valid action ───────────────────────────────────

describe('hint', () => {
  it('hint is cleared when a valid command is pressed after an invalid one', () => {
    press('w')          // blocked, sets hint
    expect(state().hint).not.toBeNull()
    press('l')          // valid, clears hint (also moves cursor)
    expect(state().hint).toBeNull()
  })
})

// ─── localStorage ─────────────────────────────────────────────────────────────

describe('localStorage progress', () => {
  it('completing a level writes to localStorage', () => {
    press('l', 'l')
    const raw = localStorage.getItem('vim-game-progress')
    expect(raw).not.toBeNull()
    const data = JSON.parse(raw!)
    expect(data.completedLevels).toContain('1-1')
  })

  it('bestKeys records the keys used', () => {
    press('l', 'l')
    const data = JSON.parse(localStorage.getItem('vim-game-progress')!)
    expect(data.bestKeys['1-1']).toBe('ll')
  })
})
