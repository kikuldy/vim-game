import { describe, it, expect } from 'vitest'
import { h, l, j, k } from './hjkl'
import { buf, bufStr } from '../test-utils'

// Helper: execute a motion and return the result as an annotated string
function run(motion: typeof h, input: string, count = 1): string {
  return bufStr(motion.execute(buf(input), count))
}

describe('h — move left', () => {
  it('moves cursor left by one', () => {
    // before: hel|lo
    // after:  he|llo
    expect(run(h, 'hel|lo')).toBe('he|llo')
  })

  it('stops at column 0 (left boundary)', () => {
    // before: |hello
    // after:  |hello
    expect(run(h, '|hello')).toBe('|hello')
  })

  it('count > 1 moves left multiple times', () => {
    // before: hell|o
    // after:  he|llo  (count = 2)
    expect(run(h, 'hell|o', 2)).toBe('he|llo')
  })

  it('count larger than column clamps at 0', () => {
    // before: he|llo
    // after:  |hello  (count = 10)
    expect(run(h, 'he|llo', 10)).toBe('|hello')
  })
})

describe('l — move right', () => {
  it('moves cursor right by one', () => {
    // before: |hello
    // after:  h|ello
    expect(run(l, '|hello')).toBe('h|ello')
  })

  it('stops at last character (right boundary)', () => {
    // before: hell|o
    // after:  hell|o
    expect(run(l, 'hell|o')).toBe('hell|o')
  })

  it('count > 1 moves right multiple times', () => {
    // before: |hello
    // after:  he|llo  (count = 2)
    expect(run(l, '|hello', 2)).toBe('he|llo')
  })

  it('count larger than remaining chars clamps at last char', () => {
    // before: |hello
    // after:  hell|o  (count = 10)
    expect(run(l, '|hello', 10)).toBe('hell|o')
  })

  it('stays at col 0 on an empty line', () => {
    // before: |   (empty line)
    // after:  |
    expect(run(l, '|')).toBe('|')
  })
})

describe('j — move down', () => {
  it('moves cursor down one line', () => {
    // before: |foo
    //         bar
    // after:  foo
    //         |bar
    expect(run(j, '|foo\nbar')).toBe('foo\n|bar')
  })

  it('stops at last line (bottom boundary)', () => {
    // before: foo
    //         |bar
    // after:  foo
    //         |bar
    expect(run(j, 'foo\n|bar')).toBe('foo\n|bar')
  })

  it('preserves column when moving down', () => {
    // before: he|llo
    //         world
    // after:  hello
    //         wo|rld  (col 2 preserved)
    expect(run(j, 'he|llo\nworld')).toBe('hello\nwo|rld')
  })

  it('clamps column to new line length when shorter', () => {
    // before: hello|world
    //         ab
    // after:  helloworld
    //         a|b  (clamped to last char)
    expect(run(j, 'hello|world\nab')).toBe('helloworld\na|b')
  })

  it('count > 1 moves down multiple lines', () => {
    // before: |line1
    //         line2
    //         line3
    // after:  line1
    //         line2
    //         |line3  (count = 2)
    expect(run(j, '|line1\nline2\nline3', 2)).toBe('line1\nline2\n|line3')
  })
})

describe('k — move up', () => {
  it('moves cursor up one line', () => {
    // before: foo
    //         |bar
    // after:  |foo
    //         bar
    expect(run(k, 'foo\n|bar')).toBe('|foo\nbar')
  })

  it('stops at first line (top boundary)', () => {
    // before: |foo
    //         bar
    // after:  |foo
    //         bar
    expect(run(k, '|foo\nbar')).toBe('|foo\nbar')
  })

  it('preserves column when moving up', () => {
    // before: world
    //         he|llo
    // after:  wo|rld  (col 2 preserved)
    //         hello
    expect(run(k, 'world\nhe|llo')).toBe('wo|rld\nhello')
  })

  it('clamps column to new line length when shorter', () => {
    // before: ab
    //         hello|world
    // after:  a|b  (clamped to last char)
    //         helloworld
    expect(run(k, 'ab\nhello|world')).toBe('a|b\nhelloworld')
  })

  it('count > 1 moves up multiple lines', () => {
    // before: line1
    //         line2
    //         |line3
    // after:  |line1  (count = 2)
    //         line2
    //         line3
    expect(run(k, 'line1\nline2\n|line3', 2)).toBe('|line1\nline2\nline3')
  })
})
