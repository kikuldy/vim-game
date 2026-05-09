import { describe, it, expect } from 'vitest'
import { explain, serializeCommand } from './index'

// ─── serializeCommand ────────────────────────────────────────────────────────

describe('serializeCommand', () => {
  it('simple motion', () => {
    expect(serializeCommand({ kind: 'motion', motion: 'w' })).toBe('w')
  })

  it('motion with count', () => {
    expect(serializeCommand({ kind: 'motion', motion: 'w', count: 3 })).toBe('3w')
  })

  it('operator + motion', () => {
    expect(serializeCommand({ kind: 'operator+motion', operator: 'd', motion: 'w' })).toBe('dw')
  })

  it('count + operator + motion', () => {
    expect(serializeCommand({ kind: 'operator+motion', operator: 'd', motion: 'w', count: 2 })).toBe('2dw')
  })

  it('line-wise (dd)', () => {
    expect(serializeCommand({ kind: 'line-wise', operator: 'd' })).toBe('dd')
  })

  it('line-wise with count (3dd)', () => {
    expect(serializeCommand({ kind: 'line-wise', operator: 'd', count: 3 })).toBe('3dd')
  })

  it('paste after (p)', () => {
    expect(serializeCommand({ kind: 'paste', where: 'after' })).toBe('p')
  })

  it('paste before (P)', () => {
    expect(serializeCommand({ kind: 'paste', where: 'before' })).toBe('P')
  })

  it('operator + text-object (diw)', () => {
    expect(serializeCommand({
      kind: 'operator+text-object',
      operator: 'd',
      textObject: { scope: 'inner', target: 'w' },
    })).toBe('diw')
  })

  it('f{char} motion', () => {
    expect(serializeCommand({ kind: 'motion', motion: { kind: 'f', char: 'x' } })).toBe('fx')
  })

  it('operator + f{char}', () => {
    expect(serializeCommand({
      kind: 'operator+motion',
      operator: 'd',
      motion: { kind: 'f', char: 'x' },
    })).toBe('dfx')
  })
})

// ─── explain ────────────────────────────────────────────────────────────────

const noLevel = { rationale: '', variations: [] as string[] }

describe('explain — motion only', () => {
  it('pure motion: syntaxLabel = "motion"', () => {
    const e = explain({ kind: 'motion', motion: 'w' }, noLevel)
    expect(e.commandStr).toBe('w')
    expect(e.syntaxLabel).toBe('motion')
    expect(e.parts).toHaveLength(1)
    expect(e.parts[0]?.keys).toBe('w')
    expect(e.parts[0]?.meaning).toContain('word')
  })

  it('motion with count: syntaxLabel = "count + motion"', () => {
    const e = explain({ kind: 'motion', motion: 'w', count: 3 }, noLevel)
    expect(e.commandStr).toBe('3w')
    expect(e.syntaxLabel).toBe('count + motion')
    expect(e.parts).toHaveLength(2)
    expect(e.parts[0]).toEqual({ keys: '3', meaning: '3 times' })
    expect(e.parts[1]?.keys).toBe('w')
  })

  it('f{char} motion identifies the char', () => {
    const e = explain({ kind: 'motion', motion: { kind: 'f', char: 'x' } }, noLevel)
    expect(e.commandStr).toBe('fx')
    expect(e.parts[0]?.keys).toBe('f')
    expect(e.parts[1]).toEqual({ keys: 'x', meaning: 'target character' })
  })
})

describe('explain — operator + motion', () => {
  it('dw: syntaxLabel = "operator + motion"', () => {
    const e = explain({ kind: 'operator+motion', operator: 'd', motion: 'w' }, noLevel)
    expect(e.commandStr).toBe('dw')
    expect(e.syntaxLabel).toBe('operator + motion')
    expect(e.parts).toHaveLength(2)
    expect(e.parts[0]?.keys).toBe('d')
    expect(e.parts[1]?.keys).toBe('w')
  })

  it('2dw: syntaxLabel = "count + operator + motion", 3 parts', () => {
    const e = explain({ kind: 'operator+motion', operator: 'd', motion: 'w', count: 2 }, noLevel)
    expect(e.commandStr).toBe('2dw')
    expect(e.syntaxLabel).toBe('count + operator + motion')
    expect(e.parts).toHaveLength(3)
    expect(e.parts[0]).toEqual({ keys: '2', meaning: '2 times' })
    expect(e.parts[1]?.keys).toBe('d')
    expect(e.parts[2]?.keys).toBe('w')
  })

  it('d$: $ part has correct meaning', () => {
    const e = explain({ kind: 'operator+motion', operator: 'd', motion: '$' }, noLevel)
    expect(e.parts[1]?.keys).toBe('$')
    expect(e.parts[1]?.meaning).toContain('end')
  })
})

describe('explain — line-wise', () => {
  it('dd: syntaxLabel = "line-wise operator"', () => {
    const e = explain({ kind: 'line-wise', operator: 'd' }, noLevel)
    expect(e.commandStr).toBe('dd')
    expect(e.syntaxLabel).toBe('line-wise operator')
    expect(e.parts).toHaveLength(1)
    expect(e.parts[0]?.keys).toBe('dd')
  })

  it('2dd: syntaxLabel = "count + line-wise operator"', () => {
    const e = explain({ kind: 'line-wise', operator: 'd', count: 2 }, noLevel)
    expect(e.commandStr).toBe('2dd')
    expect(e.syntaxLabel).toBe('count + line-wise operator')
    expect(e.parts).toHaveLength(2)
    expect(e.parts[0]).toEqual({ keys: '2', meaning: '2 times' })
  })
})

describe('explain — operator + text-object', () => {
  it('diw: syntaxLabel = "operator + text-object"', () => {
    const e = explain({
      kind: 'operator+text-object',
      operator: 'd',
      textObject: { scope: 'inner', target: 'w' },
    }, noLevel)
    expect(e.commandStr).toBe('diw')
    expect(e.syntaxLabel).toBe('operator + text-object')
    expect(e.parts).toHaveLength(3)
    expect(e.parts[1]?.keys).toBe('i')
    expect(e.parts[1]?.meaning).toContain('inner')
    expect(e.parts[2]?.keys).toBe('w')
  })

  it('ci": scope = inner, target = double-quote', () => {
    const e = explain({
      kind: 'operator+text-object',
      operator: 'c',
      textObject: { scope: 'inner', target: '"' },
    }, noLevel)
    expect(e.commandStr).toBe('ci"')
    expect(e.parts[2]?.keys).toBe('"')
  })
})

describe('explain — level rationale and variations merged', () => {
  it('level rationale appears in explanation', () => {
    const e = explain(
      { kind: 'operator+motion', operator: 'd', motion: 'w' },
      { rationale: '组合语法：operator 告诉 vim 做什么，motion 告诉 vim 作用范围', variations: ['d$ 删到行末'] },
    )
    expect(e.rationale).toBe('组合语法：operator 告诉 vim 做什么，motion 告诉 vim 作用范围')
    expect(e.variations).toEqual(['d$ 删到行末'])
  })
})

describe('explain — paste', () => {
  it('p: syntaxLabel = "standalone"', () => {
    const e = explain({ kind: 'paste', where: 'after' }, noLevel)
    expect(e.commandStr).toBe('p')
    expect(e.syntaxLabel).toBe('standalone')
    expect(e.parts[0]?.keys).toBe('p')
  })
})
