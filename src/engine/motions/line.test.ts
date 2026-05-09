import { describe, it, expect } from 'vitest'
import { zero, dollar } from './line'
import { buf, bufStr } from '../test-utils'

function run(motion: typeof zero, input: string, count = 1): string {
  return bufStr(motion.execute(buf(input), count))
}

describe('0 — line start', () => {
  it('moves cursor to column 0', () => {
    // before: hell|o world
    // after:  |hello world
    expect(run(zero, 'hell|o world')).toBe('|hello world')
  })

  it('stays at col 0 when already at line start', () => {
    expect(run(zero, '|hello world')).toBe('|hello world')
  })

  it('works on multi-line buffer (moves to start of current line)', () => {
    // before: foo
    //         ba|r
    // after:  foo
    //         |bar
    expect(run(zero, 'foo\nba|r')).toBe('foo\n|bar')
  })
})

describe('$ — line end', () => {
  it('moves cursor to last character of current line', () => {
    // before: |hello world
    // after:  hello worl|d
    expect(run(dollar, '|hello world')).toBe('hello worl|d')
  })

  it('stays at last char when already at end', () => {
    expect(run(dollar, 'hello worl|d')).toBe('hello worl|d')
  })

  it('works on multi-line buffer (stays on current line)', () => {
    // before: |foo
    //         bar
    // after:  fo|o
    //         bar
    expect(run(dollar, '|foo\nbar')).toBe('fo|o\nbar')
  })

  it('cursor on col 0 of a single-char line stays at col 0', () => {
    expect(run(dollar, '|x')).toBe('|x')
  })
})
