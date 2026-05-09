import type { MotionEntry } from './hjkl'
import { h, l, j, k } from './hjkl'
import { w, b, e } from './word'
import { zero, dollar } from './line'
import { gg, G } from './file'
import { f } from './find'
import type { FindMotionEntry } from './find'

/** Simple motions looked up by their key string. */
export const SIMPLE_MOTIONS: ReadonlyMap<string, MotionEntry> = new Map([
  ['h', h],
  ['l', l],
  ['j', j],
  ['k', k],
  ['w', w],
  ['b', b],
  ['e', e],
  ['0', zero],
  ['$', dollar],
  ['gg', gg],
  ['G', G],
])

/** The find-char motion, separate because it needs a char argument. */
export const FIND_MOTION: FindMotionEntry = f
