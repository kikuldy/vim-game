import { describe, it, expect } from 'vitest'
import { execute } from './index'
import { buf, bufStr } from '../test-utils'
import type { EngineState, VimCommand } from '../types'

function state(text: string, register: string | null = null): EngineState {
  return { buffer: buf(text), register }
}

function run(cmd: VimCommand, input: string, register: string | null = null): {
  buf: string
  register: string | null
} {
  const result = execute(cmd, state(input, register))
  return { buf: bufStr(result.buffer), register: result.register }
}

// ─── Motion commands ──────────────────────────────────────────────────────────

describe('execute — motion', () => {
  it('w moves cursor forward', () => {
    const r = run({ kind: 'motion', motion: 'w' }, '|hello world')
    expect(r.buf).toBe('hello |world')
  })

  it('3w moves cursor forward 3 words', () => {
    const r = run({ kind: 'motion', motion: 'w', count: 3 }, '|one two three four')
    expect(r.buf).toBe('one two three |four')
  })

  it('f{char} motion moves to character', () => {
    const r = run({ kind: 'motion', motion: { kind: 'f', char: 'w' } }, '|hello world')
    expect(r.buf).toBe('hello |world')
  })
})

// ─── delete operator + motion ─────────────────────────────────────────────────

describe('execute — d + motion', () => {
  it('dw deletes from cursor to next word (exclusive)', () => {
    // before: |hello world
    // after:  |world
    const r = run({ kind: 'operator+motion', operator: 'd', motion: 'w' }, '|hello world')
    expect(r.buf).toBe('|world')
    expect(r.register).toBe('hello ')
  })

  it('dw from last word: w boundary makes range exclusive, last char survives', () => {
    // w on "hello" (no next word) stays at col 4 'o'; exclusive dw deletes [0,3]="hell"
    const r = run({ kind: 'operator+motion', operator: 'd', motion: 'w' }, '|hello')
    expect(r.buf).toBe('|o')
    expect(r.register).toBe('hell')
  })

  it('d$ deletes from cursor to end of line (inclusive)', () => {
    // before: hel|lo world  (cursor at col 3 = 'l')
    // d$ deletes [3,10] → "hel" remains; cursor clamps to last char col 2 = 'l'
    const r = run({ kind: 'operator+motion', operator: 'd', motion: '$' }, 'hel|lo world')
    expect(r.buf).toBe('he|l')
    expect(r.register).toBe('lo world')
  })

  it('d$ from col 0 deletes entire line content', () => {
    const r = run({ kind: 'operator+motion', operator: 'd', motion: '$' }, '|hello')
    expect(r.buf).toBe('|')
    expect(r.register).toBe('hello')
  })

  it('d0 deletes from cursor back to line start (exclusive)', () => {
    // before: hell|o world
    // after:  |o world
    const r = run({ kind: 'operator+motion', operator: 'd', motion: '0' }, 'hell|o world')
    expect(r.buf).toBe('|o world')
    expect(r.register).toBe('hell')
  })

  it('2dw deletes two words', () => {
    // before: |one two three
    // after:  |three
    const r = run({ kind: 'operator+motion', operator: 'd', motion: 'w', count: 2 }, '|one two three')
    expect(r.buf).toBe('|three')
    expect(r.register).toBe('one two ')
  })

  it('dfx deletes from cursor to x (inclusive)', () => {
    // before: |hello world
    // df + 'w' deletes "hello w" (inclusive)
    const r = run(
      { kind: 'operator+motion', operator: 'd', motion: { kind: 'f', char: 'w' } },
      '|hello world',
    )
    expect(r.buf).toBe('|orld')
    expect(r.register).toBe('hello w')
  })
})

// ─── delete line-wise (dd) ───────────────────────────────────────────────────

describe('execute — dd (line-wise delete)', () => {
  it('dd deletes the current line', () => {
    // before: |hello
    //         world
    // after:  |world
    const r = run({ kind: 'line-wise', operator: 'd' }, '|hello\nworld')
    expect(r.buf).toBe('|world')
    expect(r.register).toBe('hello\n')
  })

  it('dd on last line leaves an empty buffer', () => {
    const r = run({ kind: 'line-wise', operator: 'd' }, '|hello')
    expect(r.buf).toBe('|')
    expect(r.register).toBe('hello\n')
  })

  it('2dd deletes two lines', () => {
    // before: |line1
    //         line2
    //         line3
    // after:  |line3
    const r = run({ kind: 'line-wise', operator: 'd', count: 2 }, '|line1\nline2\nline3')
    expect(r.buf).toBe('|line3')
    expect(r.register).toBe('line1\nline2\n')
  })
})

// ─── yank operator + paste ───────────────────────────────────────────────────

describe('execute — y + motion + p', () => {
  it('yw yanks a word without modifying the buffer', () => {
    const r = run({ kind: 'operator+motion', operator: 'y', motion: 'w' }, '|hello world')
    expect(r.buf).toBe('|hello world')
    expect(r.register).toBe('hello ')
  })

  it('yy yanks the current line', () => {
    const r = run({ kind: 'line-wise', operator: 'y' }, '|hello\nworld')
    expect(r.buf).toBe('|hello\nworld')
    expect(r.register).toBe('hello\n')
  })

  it('p pastes charwise register after cursor', () => {
    // register = "hello ", paste after cursor at 'w'
    // result: "whello orld", cursor lands on last pasted char = ' ' (col 6)
    // bufStr shows '|' before col 6: "whello| orld"
    const r = run({ kind: 'paste', where: 'after' }, '|world', 'hello ')
    expect(r.buf).toBe('whello| orld')
  })

  it('p pastes linewise register as a new line below', () => {
    const r = run({ kind: 'paste', where: 'after' }, '|hello', 'world\n')
    expect(r.buf).toBe('hello\n|world')
  })

  it('P pastes linewise register as a new line above', () => {
    const r = run({ kind: 'paste', where: 'before' }, '|hello', 'world\n')
    expect(r.buf).toBe('|world\nhello')
  })

  it('yy then p duplicates a line', () => {
    const { register } = run({ kind: 'line-wise', operator: 'y' }, '|hello\nworld')
    const r = run({ kind: 'paste', where: 'after' }, '|hello\nworld', register)
    expect(r.buf).toBe('hello\n|hello\nworld')
  })
})
