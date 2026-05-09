import { describe, it, expect } from 'vitest'
import { f } from './find'
import { buf, bufStr } from '../test-utils'

function run(input: string, char: string, count = 1): string {
  return bufStr(f.execute(buf(input), count, char))
}

describe('f{char} — find character on current line', () => {
  it('moves cursor to the next occurrence of the character', () => {
    // before: |hello world
    // f + 'w'
    // after:  hello |world
    expect(run('|hello world', 'w')).toBe('hello |world')
  })

  it('does not cross line boundaries', () => {
    // before: |hello
    //         world
    // f + 'w' — 'w' is on next line, cursor stays
    // after:  |hello
    //         world
    expect(run('|hello\nworld', 'w')).toBe('|hello\nworld')
  })

  it('stays put when character is not found on the line', () => {
    // before: |hello
    // f + 'z' — not present
    expect(run('|hello', 'z')).toBe('|hello')
  })

  it('finds the character to the right of current position only', () => {
    // before: hell|o world
    // f + 'o' — only looks forward from col 4
    // 'o' appears at col 4 (current) and col 7 ('world'), so next is col 7
    expect(run('hell|o world', 'o')).toBe('hello w|orld')
  })

  it('with count = 2 finds the second occurrence', () => {
    // "hello world hooray": 'o' is at col 4 ('hello'), 7 ('world'), 13,14 ('hooray')
    // before: |hello world hooray
    // f + 'o' count=2 → second 'o' at col 7
    expect(run('|hello world hooray', 'o', 2)).toBe('hello w|orld hooray')
  })

  it('stays put when there are fewer occurrences than count', () => {
    // before: |hello world
    // f + 'o' count=3 → only 2 'o's ahead, cursor stays
    expect(run('|hello world', 'o', 3)).toBe('|hello world')
  })
})
