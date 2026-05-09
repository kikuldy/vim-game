import type { Level } from '../types'

// Helper: create a single-line buffer with cursor
function line(text: string, col: number) {
  return { lines: [text], cursor: { line: 0, col } }
}

// Helper: create a multi-line buffer with cursor
function lines(ls: string[], cursorLine: number, col: number) {
  return { lines: ls, cursor: { line: cursorLine, col } }
}

export const phase1Levels: ReadonlyArray<Level> = [
  // ── 1-1 : l ──────────────────────────────────────────────────────────────
  {
    id: '1-1',
    title: '向右移动',
    initialBuffer: line('cat', 0),
    goalBuffer: 'cat',
    goalCursor: { line: 0, col: 2 },
    optimalKeys: 'll',
    allowedCommands: ['l'],
    introducesCommands: ['l'],
    explanation: {
      breakdown: 'l × 2',
      rationale: 'l 让光标向右移动一格。在 HJKL 键盘行里，l 在最右边，对应「右」方向。',
      variations: ['h 向左一格', 'j 向下一行', 'k 向上一行'],
    },
  },

  // ── 1-2 : h ──────────────────────────────────────────────────────────────
  {
    id: '1-2',
    title: '向左移动',
    initialBuffer: line('cat', 2),
    goalBuffer: 'cat',
    goalCursor: { line: 0, col: 0 },
    optimalKeys: 'hh',
    allowedCommands: ['h'],
    introducesCommands: ['h'],
    explanation: {
      breakdown: 'h × 2',
      rationale: 'h 让光标向左移动一格。在 HJKL 键盘行里，h 在最左边，对应「左」方向。',
      variations: ['l 向右一格', '0 直接跳到行首'],
    },
  },

  // ── 1-3 : j / k ──────────────────────────────────────────────────────────
  {
    id: '1-3',
    title: '上下移动',
    initialBuffer: lines(['apple', 'banana', 'cherry'], 0, 0),
    goalBuffer: 'apple\nbanana\ncherry',
    goalCursor: { line: 2, col: 0 },
    optimalKeys: 'jj',
    allowedCommands: ['j', 'k'],
    introducesCommands: ['j', 'k'],
    explanation: {
      breakdown: 'j × 2',
      rationale: 'j 向下一行，k 向上一行。j 的形状像一个向下的钩，k 指向上方。',
      variations: ['gg 直接跳到第一行', 'G 直接跳到最后一行'],
    },
  },

  // ── 1-4 : w ──────────────────────────────────────────────────────────────
  {
    id: '1-4',
    title: '跳到下一个词',
    initialBuffer: line('hello world', 0),
    goalBuffer: 'hello world',
    goalCursor: { line: 0, col: 6 },
    optimalKeys: 'w',
    allowedCommands: ['w'],
    introducesCommands: ['w'],
    explanation: {
      breakdown: 'w',
      rationale:
        'w 跳到下一个 word 的起点。word 由字母/数字/下划线组成，标点符号单独算一个 word。这比 l 高效得多——无论词有多长，一个 w 就能跨过去。',
      variations: ['W 跳到下个 WORD（以空白分隔，忽略标点）', 'b 向后跳一词', '2w 跳两词'],
    },
  },

  // ── 1-5 : b ──────────────────────────────────────────────────────────────
  {
    id: '1-5',
    title: '向后跳一词',
    initialBuffer: line('hello world', 6),
    goalBuffer: 'hello world',
    goalCursor: { line: 0, col: 0 },
    optimalKeys: 'b',
    allowedCommands: ['b'],
    introducesCommands: ['b'],
    explanation: {
      breakdown: 'b',
      rationale:
        'b 是 w 的反向，跳到当前或上一个 word 的起点。"b" 代表 backward（向后）。',
      variations: ['w 向前跳一词', 'B 向后跳一个 WORD', '2b 向后跳两词'],
    },
  },

  // ── 1-6 : e ──────────────────────────────────────────────────────────────
  {
    id: '1-6',
    title: '跳到词尾',
    initialBuffer: line('hello world', 0),
    goalBuffer: 'hello world',
    goalCursor: { line: 0, col: 4 },
    optimalKeys: 'e',
    allowedCommands: ['e'],
    introducesCommands: ['e'],
    explanation: {
      breakdown: 'e',
      rationale:
        'e 跳到当前（或下一个）word 的末尾。"e" 代表 end。与 w 的区别：w 落在词的开头，e 落在词的结尾。',
      variations: ['w 落在词的开头', 'de 从光标删到词尾（inclusive）'],
    },
  },

  // ── 1-7 : 0 / $ ──────────────────────────────────────────────────────────
  {
    id: '1-7',
    title: '行首与行末',
    initialBuffer: line('the quick brown fox', 10),
    goalBuffer: 'the quick brown fox',
    goalCursor: { line: 0, col: 18 },
    optimalKeys: '$',
    allowedCommands: ['$', '0'],
    introducesCommands: ['$', '0'],
    explanation: {
      breakdown: '$',
      rationale:
        '$ 跳到行末最后一个字符，0 跳到行首第一列。这两个键比反复按 l/h 快得多。$ 在很多 Unix 工具里也表示「结尾」。',
      variations: ['d$ 删到行末', 'c$ 改到行末（等价于 C）', '0 跳到行首（第 0 列）'],
    },
  },

  // ── 1-8 : gg / G ─────────────────────────────────────────────────────────
  {
    id: '1-8',
    title: '文件首尾',
    initialBuffer: lines(['first line', 'second line', 'third line'], 1, 0),
    goalBuffer: 'first line\nsecond line\nthird line',
    goalCursor: { line: 2, col: 0 },
    optimalKeys: 'G',
    allowedCommands: ['G', 'gg'],
    introducesCommands: ['G', 'gg'],
    explanation: {
      breakdown: 'G',
      rationale:
        'G 跳到文件最后一行，gg 跳到第一行。这是最快的文件首尾导航方式。G 是大写，代表「大幅移动」。',
      variations: ['gg 跳到第一行', '5G 跳到第 5 行（行号前缀）'],
    },
  },

  // ── 1-9 : f{char} ────────────────────────────────────────────────────────
  {
    id: '1-9',
    title: '行内查找字符',
    initialBuffer: line('the quick brown fox', 0),
    goalBuffer: 'the quick brown fox',
    goalCursor: { line: 0, col: 4 },
    optimalKeys: 'fq',
    allowedCommands: ['fq', 'ft', 'fh', 'fe', 'f ', 'fb', 'fr', 'fo', 'fn', 'fw', 'fu', 'fi', 'fc', 'fk', 'fl', 'fQ', 'ff', 'fg'],
    introducesCommands: ['f'],
    explanation: {
      breakdown: 'f + q',
      rationale:
        'f{char} 在当前行向右查找字符 char，并把光标移过去。比一直按 l 快得多——直接「瞄准」目标字符。f 代表 find（查找）。',
      variations: ['F{char} 向左查找', 't{char} 跳到字符前一格（till）', 'df{char} 删到目标字符'],
    },
  },
]
