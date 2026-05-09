import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GameBoard } from './GameBoard'
import { useGameStore } from '../game/store'

beforeEach(() => {
  useGameStore.setState(useGameStore.getInitialState())
  localStorage.clear()
})

function press(...keys: string[]) {
  for (const k of keys) useGameStore.getState().pressKey(k)
}

function state() {
  return useGameStore.getState()
}

// ─── Enter key: advance to next level after completion ───────────────────────

describe('Enter key navigation', () => {
  it('Enter advances to next level when status is complete', async () => {
    render(<GameBoard />)
    // Complete level 1-1 via store
    press('l', 'l')
    expect(state().status).toBe('complete')
    expect(state().currentLevelIndex).toBe(0)

    // Focus the game container and press Enter
    const container = screen.getByRole('main').closest('div[tabindex="0"]') as HTMLElement
    container.focus()
    await userEvent.keyboard('{Enter}')

    expect(state().currentLevelIndex).toBe(1)
    expect(state().status).toBe('playing')
  })

  it('Enter does nothing when status is playing', async () => {
    render(<GameBoard />)
    const container = screen.getByRole('main').closest('div[tabindex="0"]') as HTMLElement
    container.focus()
    await userEvent.keyboard('{Enter}')

    expect(state().currentLevelIndex).toBe(0)
  })

  it('Enter does nothing on last level even if complete', async () => {
    // Navigate to last level
    const total = state().levels.length
    useGameStore.setState({ currentLevelIndex: total - 1, status: 'complete' })

    render(<GameBoard />)
    const container = screen.getByRole('main').closest('div[tabindex="0"]') as HTMLElement
    container.focus()
    await userEvent.keyboard('{Enter}')

    expect(state().currentLevelIndex).toBe(total - 1)
  })
})

// ─── [ key: go back to previous level ────────────────────────────────────────

function pressOpenBracket(container: HTMLElement) {
  fireEvent.keyDown(container, { key: '[', code: 'BracketLeft' })
}

describe('[ key navigation', () => {
  it('[ goes back to previous level from level 1', () => {
    // Start at level 1
    press('l', 'l')
    state().nextLevel()
    expect(state().currentLevelIndex).toBe(1)

    render(<GameBoard />)
    const container = screen.getByRole('main').closest('div[tabindex="0"]') as HTMLElement
    container.focus()
    pressOpenBracket(container)

    expect(state().currentLevelIndex).toBe(0)
    expect(state().status).toBe('playing')
  })

  it('[ does nothing when already at level 0', () => {
    render(<GameBoard />)
    const container = screen.getByRole('main').closest('div[tabindex="0"]') as HTMLElement
    container.focus()
    pressOpenBracket(container)

    expect(state().currentLevelIndex).toBe(0)
  })

  it('[ works even when status is playing (mid-game retreat)', () => {
    state().nextLevel()
    expect(state().currentLevelIndex).toBe(1)

    render(<GameBoard />)
    const container = screen.getByRole('main').closest('div[tabindex="0"]') as HTMLElement
    container.focus()
    pressOpenBracket(container)

    expect(state().currentLevelIndex).toBe(0)
  })
})
