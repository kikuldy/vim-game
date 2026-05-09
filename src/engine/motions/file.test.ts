import { describe, it, expect } from 'vitest'
import { gg, G } from './file'
import { buf, bufStr } from '../test-utils'

function run(motion: typeof gg, input: string, count = 1): string {
  return bufStr(motion.execute(buf(input), count))
}

describe('gg — file start', () => {
  it('moves cursor to line 0 col 0', () => {
    // before: foo
    //         ba|r
    // after:  |foo
    //         bar
    expect(run(gg, 'foo\nba|r')).toBe('|foo\nbar')
  })

  it('stays at top when already there', () => {
    expect(run(gg, '|foo\nbar')).toBe('|foo\nbar')
  })

  it('works on three-line buffer', () => {
    expect(run(gg, 'a\nb\n|c')).toBe('|a\nb\nc')
  })
})

describe('G — file end', () => {
  it('moves cursor to first col of last line', () => {
    // before: |foo
    //         bar
    // after:  foo
    //         |bar
    expect(run(G, '|foo\nbar')).toBe('foo\n|bar')
  })

  it('stays at last line when already there', () => {
    expect(run(G, 'foo\n|bar')).toBe('foo\n|bar')
  })

  it('works on three-line buffer', () => {
    expect(run(G, '|a\nb\nc')).toBe('a\nb\n|c')
  })
})
