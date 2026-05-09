import { describe, it, expect } from 'vitest'
import { w, b, e } from './word'
import { buf, bufStr } from '../test-utils'

function run(motion: typeof w, input: string, count = 1): string {
  return bufStr(motion.execute(buf(input), count))
}

describe('w — word forward', () => {
  it('jumps from start of word to start of next word', () => {
    // before: |hello world
    // after:  hello |world
    expect(run(w, '|hello world')).toBe('hello |world')
  })

  it('jumps across punctuation boundary into next word', () => {
    // before: |hello, world
    // after:  hello|, world  (lands on ',' — a distinct punctuation "word")
    expect(run(w, '|hello, world')).toBe('hello|, world')
  })

  it('jumps from punctuation to next word', () => {
    // before: hello|, world
    // after:  hello, |world
    expect(run(w, 'hello|, world')).toBe('hello, |world')
  })

  it('jumps from whitespace to next word', () => {
    // before: hello| world   (cursor on the space)
    // after:  hello |world
    expect(run(w, 'hello| world')).toBe('hello |world')
  })

  it('crosses line boundary', () => {
    // before: |hello
    //         world
    // after:  hello
    //         |world
    expect(run(w, '|hello\nworld')).toBe('hello\n|world')
  })

  it('stops at last character when at end of buffer', () => {
    // before: |hello
    // after:  hell|o  (stays on last char)
    expect(run(w, '|hello')).toBe('hell|o')
  })

  it('count > 1 applies the motion multiple times', () => {
    // before: |one two three
    // after:  one two |three  (count = 2)
    expect(run(w, '|one two three', 2)).toBe('one two |three')
  })
})

describe('b — word backward', () => {
  it('jumps from middle of word to start of that word', () => {
    // before: hello wo|rld
    // after:  hello |world
    expect(run(b, 'hello wo|rld')).toBe('hello |world')
  })

  it('jumps from start of word to start of previous word', () => {
    // before: hello |world
    // after:  |hello world
    expect(run(b, 'hello |world')).toBe('|hello world')
  })

  it('jumps across punctuation boundary', () => {
    // before: hello, |world
    // after:  hello|, world  (lands on punctuation "word")
    expect(run(b, 'hello, |world')).toBe('hello|, world')
  })

  it('stays at column 0 on first line (start of buffer)', () => {
    // before: |hello world
    // after:  |hello world
    expect(run(b, '|hello world')).toBe('|hello world')
  })

  it('crosses line boundary backward', () => {
    // before: hello
    //         |world
    // after:  |hello
    //         world
    expect(run(b, 'hello\n|world')).toBe('|hello\nworld')
  })

  it('count > 1 applies the motion multiple times', () => {
    // before: one two |three
    // after:  |one two three  (count = 2)
    expect(run(b, 'one two |three', 2)).toBe('|one two three')
  })
})

describe('e — word end', () => {
  it('jumps from start of word to end of that word', () => {
    // before: |hello world
    // after:  hell|o world
    expect(run(e, '|hello world')).toBe('hell|o world')
  })

  it('jumps from end of word to end of next word', () => {
    // before: hell|o world
    // after:  hello worl|d
    expect(run(e, 'hell|o world')).toBe('hello worl|d')
  })

  it('skips whitespace when finding next word end', () => {
    // before: hello| world
    // after:  hello worl|d
    expect(run(e, 'hello| world')).toBe('hello worl|d')
  })

  it('stops at end of punctuation sequence', () => {
    // before: |hello, world
    // after:  hell|o, world
    expect(run(e, '|hello, world')).toBe('hell|o, world')
  })

  it('stays at last character when at end of buffer', () => {
    // before: hello worl|d
    // after:  hello worl|d
    expect(run(e, 'hello worl|d')).toBe('hello worl|d')
  })

  it('crosses line boundary', () => {
    // before: hell|o
    //         world
    // after:  hello
    //         worl|d
    expect(run(e, 'hell|o\nworld')).toBe('hello\nworl|d')
  })

  it('count > 1 applies the motion multiple times', () => {
    // before: |one two three
    // after:  one tw|o three  (count = 2)
    expect(run(e, '|one two three', 2)).toBe('one tw|o three')
  })
})
