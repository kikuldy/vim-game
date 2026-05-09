// ─── Buffer ────────────────────────────────────────────────────────────────

export type BufferState = {
  readonly lines: ReadonlyArray<string>
  readonly cursor: { readonly line: number; readonly col: number }
}

// ─── Command Keys ───────────────────────────────────────────────────────────

export type OperatorKey = 'd' | 'c' | 'y'

/** Simple motions are single identifiers; f{char} carries its target character. */
export type MotionKey =
  | 'h' | 'l' | 'j' | 'k'
  | 'w' | 'b' | 'e'
  | '0' | '$'
  | 'gg' | 'G'
  | { readonly kind: 'f'; readonly char: string }

export type TextObjectScope = 'inner' | 'around'

export type TextObjectTarget = 'w' | '"' | "'" | 'p'

export type TextObject = {
  readonly scope: TextObjectScope
  readonly target: TextObjectTarget
}

// ─── Command AST ────────────────────────────────────────────────────────────

/**
 * Every action the player takes is represented as one of these variants.
 * count is absent when the player typed no numeric prefix (distinct from count=1
 * for the explainer — "dw" vs "1dw" has the same effect but different explanations).
 */
export type VimCommand =
  | { readonly kind: 'motion'; readonly motion: MotionKey; readonly count?: number }
  | { readonly kind: 'operator+motion'; readonly operator: OperatorKey; readonly motion: MotionKey; readonly count?: number }
  | { readonly kind: 'operator+text-object'; readonly operator: OperatorKey; readonly textObject: TextObject }
  | { readonly kind: 'line-wise'; readonly operator: OperatorKey; readonly count?: number }
  | { readonly kind: 'paste'; readonly where: 'after' | 'before' }

// ─── Parser State Machine ───────────────────────────────────────────────────

export type ParseState =
  | { readonly phase: 'idle' }
  | { readonly phase: 'count'; readonly digits: string }
  | { readonly phase: 'operator'; readonly op: OperatorKey; readonly count?: number }
  | { readonly phase: 'text-object'; readonly op: OperatorKey; readonly scope: TextObjectScope }
  | { readonly phase: 'g-prefix'; readonly count?: number }
  | { readonly phase: 'await-char'; readonly op?: OperatorKey; readonly count?: number }
  | { readonly phase: 'complete'; readonly cmd: VimCommand }
  | { readonly phase: 'invalid' }

export const IDLE: ParseState = { phase: 'idle' }

// ─── Command Metadata ───────────────────────────────────────────────────────

/**
 * Example uses "|" to mark cursor position within the text, e.g.:
 *   before: "hello |world"
 *   after:  "hello world|"
 */
export type Example = {
  readonly before: string
  readonly after: string
}

export type CommandMeta = {
  readonly key: string
  readonly name: string
  readonly mnemonic: string
  readonly category: 'motion' | 'operator' | 'text-object'
  readonly description: string
  readonly examples: ReadonlyArray<Example>
  readonly combinesWith?: ReadonlyArray<string>
}

// ─── Explainer Output ───────────────────────────────────────────────────────

export type CommandPart = {
  readonly keys: string
  readonly meaning: string
}

/** The full mutable state of the engine (buffer + register). */
export type EngineState = {
  readonly buffer: BufferState
  readonly register: string | null
}

export type Explanation = {
  readonly commandStr: string
  readonly parts: ReadonlyArray<CommandPart>
  readonly syntaxLabel: string
  readonly rationale: string
  readonly variations: ReadonlyArray<string>
}
