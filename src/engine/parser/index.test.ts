import { describe, it, expect } from 'vitest'
import { parseKey } from './index'
import { IDLE } from '../types'
import type { ParseState } from '../types'

// Helper: chain multiple keys through the parser
function parseKeys(keys: string[]): ParseState {
  return keys.reduce<ParseState>((state, key) => parseKey(state, key), IDLE)
}

describe('parseKey — idle phase', () => {
  it('digit 1-9 transitions to count phase', () => {
    expect(parseKey(IDLE, '3')).toEqual({ phase: 'count', digits: '3' })
  })

  it('0 from idle is a motion (line start), not a count digit', () => {
    expect(parseKey(IDLE, '0')).toEqual({
      phase: 'complete',
      cmd: { kind: 'motion', motion: '0' },
    })
  })

  it('h/l/j/k produce motion commands', () => {
    for (const key of ['h', 'l', 'j', 'k'] as const) {
      expect(parseKey(IDLE, key)).toEqual({
        phase: 'complete',
        cmd: { kind: 'motion', motion: key },
      })
    }
  })

  it('w/b/e produce motion commands', () => {
    for (const key of ['w', 'b', 'e'] as const) {
      expect(parseKey(IDLE, key)).toEqual({
        phase: 'complete',
        cmd: { kind: 'motion', motion: key },
      })
    }
  })

  it('$ produces line-end motion', () => {
    expect(parseKey(IDLE, '$')).toEqual({
      phase: 'complete',
      cmd: { kind: 'motion', motion: '$' },
    })
  })

  it('G produces file-end motion', () => {
    expect(parseKey(IDLE, 'G')).toEqual({
      phase: 'complete',
      cmd: { kind: 'motion', motion: 'G' },
    })
  })

  it('d/c/y transition to operator phase', () => {
    for (const key of ['d', 'c', 'y'] as const) {
      expect(parseKey(IDLE, key)).toEqual({ phase: 'operator', op: key })
    }
  })

  it('g transitions to g-prefix phase', () => {
    expect(parseKey(IDLE, 'g')).toEqual({ phase: 'g-prefix' })
  })

  it('f transitions to await-char phase', () => {
    expect(parseKey(IDLE, 'f')).toEqual({ phase: 'await-char' })
  })

  it('p produces paste-after command', () => {
    expect(parseKey(IDLE, 'p')).toEqual({
      phase: 'complete',
      cmd: { kind: 'paste', where: 'after' },
    })
  })

  it('P produces paste-before command', () => {
    expect(parseKey(IDLE, 'P')).toEqual({
      phase: 'complete',
      cmd: { kind: 'paste', where: 'before' },
    })
  })

  it('unknown key produces invalid state', () => {
    expect(parseKey(IDLE, 'q')).toEqual({ phase: 'invalid' })
  })
})

describe('parseKey — count phase', () => {
  it('subsequent digits append to count', () => {
    expect(parseKeys(['1', '2'])).toEqual({ phase: 'count', digits: '12' })
    expect(parseKeys(['1', '0'])).toEqual({ phase: 'count', digits: '10' })
  })

  it('0 in count phase appends (it is a digit here, not a motion)', () => {
    expect(parseKeys(['2', '0'])).toEqual({ phase: 'count', digits: '20' })
  })

  it('motion after count produces motion command with count', () => {
    expect(parseKeys(['3', 'w'])).toEqual({
      phase: 'complete',
      cmd: { kind: 'motion', motion: 'w', count: 3 },
    })
  })

  it('operator after count transitions to operator phase with count', () => {
    expect(parseKeys(['2', 'd'])).toEqual({ phase: 'operator', op: 'd', count: 2 })
  })
})

describe('parseKey — operator phase', () => {
  it('same operator twice produces line-wise command', () => {
    expect(parseKeys(['d', 'd'])).toEqual({
      phase: 'complete',
      cmd: { kind: 'line-wise', operator: 'd' },
    })
    expect(parseKeys(['y', 'y'])).toEqual({
      phase: 'complete',
      cmd: { kind: 'line-wise', operator: 'y' },
    })
  })

  it('motion after operator produces operator+motion command', () => {
    expect(parseKeys(['d', 'w'])).toEqual({
      phase: 'complete',
      cmd: { kind: 'operator+motion', operator: 'd', motion: 'w' },
    })
    expect(parseKeys(['d', '$'])).toEqual({
      phase: 'complete',
      cmd: { kind: 'operator+motion', operator: 'd', motion: '$' },
    })
  })

  it('count before operator propagates into completed command', () => {
    expect(parseKeys(['2', 'd', 'd'])).toEqual({
      phase: 'complete',
      cmd: { kind: 'line-wise', operator: 'd', count: 2 },
    })
    expect(parseKeys(['2', 'd', 'w'])).toEqual({
      phase: 'complete',
      cmd: { kind: 'operator+motion', operator: 'd', motion: 'w', count: 2 },
    })
  })

  it('i transitions to text-object phase (inner)', () => {
    expect(parseKeys(['d', 'i'])).toEqual({
      phase: 'text-object',
      op: 'd',
      scope: 'inner',
    })
  })

  it('a transitions to text-object phase (around)', () => {
    expect(parseKeys(['d', 'a'])).toEqual({
      phase: 'text-object',
      op: 'd',
      scope: 'around',
    })
  })

  it('unknown key after operator produces invalid state', () => {
    expect(parseKeys(['d', 'q'])).toEqual({ phase: 'invalid' })
  })
})

describe('parseKey — text-object phase', () => {
  it('diw produces operator+text-object (inner word)', () => {
    expect(parseKeys(['d', 'i', 'w'])).toEqual({
      phase: 'complete',
      cmd: { kind: 'operator+text-object', operator: 'd', textObject: { scope: 'inner', target: 'w' } },
    })
  })

  it('ci" produces operator+text-object (inner double quotes)', () => {
    expect(parseKeys(['c', 'i', '"'])).toEqual({
      phase: 'complete',
      cmd: { kind: 'operator+text-object', operator: 'c', textObject: { scope: 'inner', target: '"' } },
    })
  })

  it("yap produces operator+text-object (around paragraph)", () => {
    expect(parseKeys(['y', 'a', 'p'])).toEqual({
      phase: 'complete',
      cmd: { kind: 'operator+text-object', operator: 'y', textObject: { scope: 'around', target: 'p' } },
    })
  })

  it('unknown text-object target produces invalid', () => {
    expect(parseKeys(['d', 'i', 'z'])).toEqual({ phase: 'invalid' })
  })
})

describe('parseKey — g-prefix phase', () => {
  it('gg produces file-start motion', () => {
    expect(parseKeys(['g', 'g'])).toEqual({
      phase: 'complete',
      cmd: { kind: 'motion', motion: 'gg' },
    })
  })

  it('unknown key after g produces invalid', () => {
    expect(parseKeys(['g', 'x'])).toEqual({ phase: 'invalid' })
  })
})

describe('parseKey — await-char phase (f motion)', () => {
  it('fa produces f{a} motion', () => {
    expect(parseKeys(['f', 'a'])).toEqual({
      phase: 'complete',
      cmd: { kind: 'motion', motion: { kind: 'f', char: 'a' } },
    })
  })

  it('f followed by any printable char completes the motion', () => {
    expect(parseKeys(['f', 'x'])).toEqual({
      phase: 'complete',
      cmd: { kind: 'motion', motion: { kind: 'f', char: 'x' } },
    })
    expect(parseKeys(['f', '('])).toEqual({
      phase: 'complete',
      cmd: { kind: 'motion', motion: { kind: 'f', char: '(' } },
    })
  })

  it('dfx produces operator+motion with f{x}', () => {
    expect(parseKeys(['d', 'f', 'x'])).toEqual({
      phase: 'complete',
      cmd: { kind: 'operator+motion', operator: 'd', motion: { kind: 'f', char: 'x' } },
    })
  })
})

describe('parseKey — Escape cancels from any state', () => {
  it('Escape from idle stays idle', () => {
    expect(parseKey(IDLE, 'Escape')).toEqual({ phase: 'idle' })
  })

  it('Escape from count returns idle', () => {
    expect(parseKeys(['3', 'Escape'])).toEqual({ phase: 'idle' })
  })

  it('Escape from operator returns idle', () => {
    expect(parseKeys(['d', 'Escape'])).toEqual({ phase: 'idle' })
  })

  it('Escape from await-char returns idle', () => {
    expect(parseKeys(['f', 'Escape'])).toEqual({ phase: 'idle' })
  })

  it('Escape from g-prefix returns idle', () => {
    expect(parseKeys(['g', 'Escape'])).toEqual({ phase: 'idle' })
  })
})

describe('parseKey — complete and invalid states reset on next key', () => {
  it('calling parseKey on complete state treats it as idle', () => {
    const complete = parseKeys(['d', 'w'])
    expect(complete.phase).toBe('complete')
    expect(parseKey(complete, 'w')).toEqual({
      phase: 'complete',
      cmd: { kind: 'motion', motion: 'w' },
    })
  })

  it('calling parseKey on invalid state treats it as idle', () => {
    const invalid = parseKey(IDLE, 'q')
    expect(invalid.phase).toBe('invalid')
    expect(parseKey(invalid, 'w')).toEqual({
      phase: 'complete',
      cmd: { kind: 'motion', motion: 'w' },
    })
  })
})
