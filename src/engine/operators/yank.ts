import type { CommandMeta } from '../types'

export const yMeta: CommandMeta = {
  key: 'y',
  name: 'yank',
  mnemonic: '"y" for yank (vim\'s word for copy)',
  category: 'operator',
  description: 'Copy text from cursor to where the motion takes you into the register',
  examples: [
    { before: '|hello world', after: '|hello world' },
    { before: '|hello world', after: '|hello world' },
  ],
  combinesWith: ['w', 'b', 'e', '$', '0', 'f', 'iw'],
}

export const yyMeta: CommandMeta = {
  key: 'yy',
  name: 'yank line',
  mnemonic: 'double "y" — yank the whole line',
  category: 'operator',
  description: 'Copy the entire current line into the register',
  examples: [
    { before: '|hello\nworld', after: '|hello\nworld' },
  ],
}
