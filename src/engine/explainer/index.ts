import type { VimCommand, CommandMeta, CommandPart, Explanation } from '../types'
import { serializeCommand } from '../command-utils'
import { SIMPLE_MOTIONS } from '../motions/registry'
import { FIND_MOTION } from '../motions/registry'
import { dMeta, ddMeta } from '../operators/delete'
import { yMeta, yyMeta } from '../operators/yank'
import { cMeta, ccMeta } from '../operators/change'
import { pMeta, PMeta } from '../operators/paste'

// Re-export so consumers only need one import point
export { serializeCommand }

// ─── Metadata lookup ────────────────────────────────────────────────────────

const TEXT_OBJECT_TARGET_NAMES: Record<string, string> = {
  w: 'word',
  '"': 'double-quoted string',
  "'": 'single-quoted string',
  p: 'paragraph',
}

const LINE_WISE_META: Record<string, CommandMeta> = {
  d: ddMeta,
  y: yyMeta,
  c: ccMeta,
}

const OPERATOR_META: Record<string, CommandMeta> = {
  d: dMeta,
  y: yMeta,
  c: cMeta,
}

// ─── Part builders ───────────────────────────────────────────────────────────

function countPart(count: number): CommandPart {
  return { keys: String(count), meaning: `${count} times` }
}

function metaToPart(meta: CommandMeta): CommandPart {
  return { keys: meta.key, meaning: meta.name }
}

// ─── Explain ─────────────────────────────────────────────────────────────────

type LevelContext = {
  readonly rationale: string
  readonly variations: ReadonlyArray<string>
}

export function explain(cmd: VimCommand, level: LevelContext): Explanation {
  const commandStr = serializeCommand(cmd)
  const { rationale, variations } = level

  switch (cmd.kind) {
    case 'motion': {
      const parts: CommandPart[] = []
      if (cmd.count !== undefined) parts.push(countPart(cmd.count))

      if (typeof cmd.motion === 'string') {
        const meta = SIMPLE_MOTIONS.get(cmd.motion)?.meta
        parts.push(meta ? metaToPart(meta) : { keys: cmd.motion, meaning: cmd.motion })
      } else {
        // f{char}
        parts.push({ keys: 'f', meaning: FIND_MOTION.meta.name })
        parts.push({ keys: cmd.motion.char, meaning: 'target character' })
      }

      const syntaxLabel = cmd.count !== undefined ? 'count + motion' : 'motion'
      return { commandStr, parts, syntaxLabel, rationale, variations }
    }

    case 'operator+motion': {
      const parts: CommandPart[] = []
      if (cmd.count !== undefined) parts.push(countPart(cmd.count))

      const opMeta = OPERATOR_META[cmd.operator]
      parts.push(opMeta ? metaToPart(opMeta) : { keys: cmd.operator, meaning: cmd.operator })

      if (typeof cmd.motion === 'string') {
        const meta = SIMPLE_MOTIONS.get(cmd.motion)?.meta
        parts.push(meta ? metaToPart(meta) : { keys: cmd.motion, meaning: cmd.motion })
      } else {
        parts.push({ keys: 'f', meaning: FIND_MOTION.meta.name })
        parts.push({ keys: cmd.motion.char, meaning: 'target character' })
      }

      const syntaxLabel =
        cmd.count !== undefined ? 'count + operator + motion' : 'operator + motion'
      return { commandStr, parts, syntaxLabel, rationale, variations }
    }

    case 'line-wise': {
      const parts: CommandPart[] = []
      if (cmd.count !== undefined) parts.push(countPart(cmd.count))

      const meta = LINE_WISE_META[cmd.operator]
      parts.push(meta ? metaToPart(meta) : { keys: `${cmd.operator}${cmd.operator}`, meaning: 'line-wise' })

      const syntaxLabel =
        cmd.count !== undefined ? 'count + line-wise operator' : 'line-wise operator'
      return { commandStr, parts, syntaxLabel, rationale, variations }
    }

    case 'operator+text-object': {
      const parts: CommandPart[] = []

      const opMeta = OPERATOR_META[cmd.operator]
      parts.push(opMeta ? metaToPart(opMeta) : { keys: cmd.operator, meaning: cmd.operator })

      const scopeKey = cmd.textObject.scope === 'inner' ? 'i' : 'a'
      const scopeLabel = cmd.textObject.scope === 'inner'
        ? 'inner (excludes surrounding whitespace/delimiters)'
        : 'around (includes surrounding whitespace/delimiters)'
      parts.push({ keys: scopeKey, meaning: scopeLabel })

      const targetName = TEXT_OBJECT_TARGET_NAMES[cmd.textObject.target] ?? cmd.textObject.target
      parts.push({ keys: cmd.textObject.target, meaning: targetName })

      return { commandStr, parts, syntaxLabel: 'operator + text-object', rationale, variations }
    }

    case 'paste': {
      const meta = cmd.where === 'after' ? pMeta : PMeta
      return {
        commandStr,
        parts: [metaToPart(meta)],
        syntaxLabel: 'standalone',
        rationale,
        variations,
      }
    }
  }
}
