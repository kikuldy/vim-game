import type { CommandMeta } from '../types'

export const cMeta: CommandMeta = {
  key: 'c',
  name: 'change',
  mnemonic: '"c" for change',
  category: 'operator',
  description: 'Delete text from cursor to where the motion takes you, then enter insert mode',
  examples: [
    { before: '|hello world', after: '| world' },
    { before: '|hello world', after: '|' },
  ],
  combinesWith: ['w', 'b', 'e', '$', '0', 'f', 'iw'],
}

export const ccMeta: CommandMeta = {
  key: 'cc',
  name: 'change line',
  mnemonic: 'double "c" — change the whole line',
  category: 'operator',
  description: 'Delete the entire current line and enter insert mode',
  examples: [
    { before: '|hello\nworld', after: '|\nworld' },
  ],
}
