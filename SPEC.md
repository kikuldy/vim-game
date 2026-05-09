# Vim Practice Game — SPEC

## 背景

浏览器内的 Vim 命令练习游戏。核心差异点：不是"背按键"，而是帮助玩家理解 `[count][operator][motion]` 这套组合语法。每个命令必须先解析成 AST，再执行，explainer 从 AST 实时生成解释。

---

## 关键设计决策

| 问题 | 决策 |
|------|------|
| 解析器架构 | **状态机**（ParseState 显式建模待续状态） |
| 解释面板位置 | **右侧常驻**（玩家操作时一直可见） |
| 非最优命令处理 | **阻断不执行**，buffer 不变，面板显示提示 |
| 视觉风格 | **浅色（Notion 风）**：白底，深色文字，蓝色光标 |
| 阶段 1 关卡密度 | **每个命令 1 关**，约 9 关完成阶段 1 后进入阶段 2 |

---

## 核心数据结构

### VimCommand AST

```typescript
type VimCommand =
  | { kind: 'motion'; motion: MotionKey; count?: number }
  | { kind: 'operator+motion'; operator: OperatorKey; motion: MotionKey; count?: number }
  | { kind: 'operator+text-object'; operator: OperatorKey; textObject: TextObject }
  | { kind: 'line-operator'; operator: 'dd' | 'yy'; count?: number }
  | { kind: 'paste'; where: 'after' | 'before' }

type MotionKey = 'h' | 'l' | 'j' | 'k' | 'w' | 'b' | 'e' | '0' | '$' | 'gg' | 'G' | { f: string }
type OperatorKey = 'd' | 'c' | 'y'
```

### Parser 状态机

```
idle
  → digit         → { phase: 'count', digits: string }
  → d / c / y     → { phase: 'operator', op, count? }
  → g             → { phase: 'g-prefix' }
  → f / F / t / T → { phase: 'await-char', motionPrefix }
  → motion key    → { phase: 'complete', cmd }

count
  → digit         → { phase: 'count', digits: appended }
  → d / c / y     → { phase: 'operator', op, count }
  → motion key    → { phase: 'complete', cmd: { kind:'motion', count, motion } }

operator
  → same op key   → { phase: 'complete', cmd: { kind:'line-operator', op } }   // dd, yy
  → motion key    → { phase: 'complete', cmd: { kind:'op+motion', op, motion } }
  → i / a         → { phase: 'text-object', op }

text-object
  → w / W / " / ' / ... → { phase: 'complete', cmd: { kind:'op+text-object' } }

g-prefix
  → g             → { phase: 'complete', cmd: { kind:'motion', motion:'gg' } }

await-char
  → any key       → { phase: 'complete', cmd: { kind:'motion', motion:{ f: key } } }
```

Escape 键：任意状态 → idle（取消待续操作）

### CommandMeta

```typescript
type CommandMeta = {
  readonly key: string;
  readonly name: string;
  readonly mnemonic: string;
  readonly category: 'motion' | 'operator' | 'text-object';
  readonly description: string;
  readonly examples: ReadonlyArray<{
    before: string;
    cursor: number;
    after: string;
    cursorAfter: number;
  }>;
  readonly combinesWith?: ReadonlyArray<string>;
}
```

### BufferState

```typescript
type BufferState = {
  readonly lines: ReadonlyArray<string>;
  readonly cursor: { readonly line: number; readonly col: number };
}
```

### Level

```typescript
type Level = {
  readonly id: string;
  readonly title: string;
  readonly initialBuffer: BufferState;
  readonly goalBuffer: string;           // 目标纯文本（不含光标位置）
  readonly optimalKeys: string;          // 最优解，如 "dw"
  readonly allowedCommands: string[];    // 完整命令白名单，如 ["dw","d2w","2dw"]
  readonly introducesCommands: string[];
  readonly explanation: {
    readonly breakdown: string;
    readonly rationale: string;
    readonly variations: ReadonlyArray<string>;
  };
}
```

`allowedCommands` 的作用：parser 完成一个 command AST 后，先序列化成字符串，再检查是否在白名单中。不在 → 不执行，右侧面板显示提示。

### GameState（Zustand store）

```typescript
type GameState = {
  levels: Level[];
  currentLevelIndex: number;
  buffer: BufferState;
  parseState: ParseState;       // 实时待续状态（UI 显示 "d_"）
  keyHistory: string[];         // 本关按键历史
  status: 'playing' | 'complete';
  hint: string | null;          // 非最优命令触发的提示文字
  // actions
  pressKey: (key: string) => void;
  retry: () => void;
  nextLevel: () => void;
}
```

### localStorage 结构

```typescript
type ProgressData = {
  version: 1;
  completedLevels: string[];
  bestKeys: Record<string, string>;   // level id → 玩家最优按键序列
}
// key: 'vim-game-progress'
```

---

## 项目结构

```
src/
├── engine/
│   ├── types.ts              # 所有类型（VimCommand, BufferState, CommandMeta, ParseState 等）
│   ├── parser/
│   │   ├── index.ts          # parseKey(state: ParseState, key: string): ParseState
│   │   └── index.test.ts
│   ├── motions/
│   │   ├── registry.ts       # Map<string, MotionImpl & CommandMeta>
│   │   ├── hjkl.ts           # h, l, j, k
│   │   ├── word.ts           # w, b, e
│   │   ├── line.ts           # 0, $, ^
│   │   ├── file.ts           # gg, G
│   │   ├── find.ts           # f{char}
│   │   └── *.test.ts
│   ├── operators/
│   │   ├── registry.ts
│   │   ├── delete.ts         # d, dd
│   │   ├── change.ts         # c
│   │   ├── yank.ts           # y, yy
│   │   ├── paste.ts          # p, P
│   │   └── *.test.ts
│   ├── executor/
│   │   ├── index.ts          # execute(cmd: VimCommand, buf: BufferState): BufferState
│   │   └── index.test.ts
│   └── explainer/
│       ├── index.ts          # explain(cmd: VimCommand, level: Level): Explanation
│       └── index.test.ts
├── game/
│   ├── types.ts
│   ├── levels/
│   │   ├── index.ts
│   │   ├── phase1-motion.ts
│   │   ├── phase2-operator.ts
│   │   ├── phase3-combo.ts
│   │   ├── phase4-textobj.ts
│   │   └── phase5-count.ts
│   └── store.ts
├── ui/
│   ├── App.tsx
│   ├── GameBoard.tsx
│   ├── Buffer.tsx
│   ├── Explainer.tsx
│   ├── KeyDisplay.tsx
│   ├── LevelNav.tsx
│   └── HintBanner.tsx
└── main.tsx
```

---

## UI 布局

```
┌───────────────────────────────────────────────────────────────┐
│  Vim Practice  │  Level 3: Delete a Word  │  ████████░░ 3/20  │
├───────────────────────────────┬───────────────────────────────┤
│                               │  本关引入                     │
│  现在 (buffer)                │  ┌─────────────────────────┐  │
│  ┌──────────────────────────┐ │  │ dw                      │  │
│  │ hello world              │ │  │ d = delete              │  │
│  │ [h]ello world            │ │  │ w = word forward        │  │
│  └──────────────────────────┘ │  │ 组合 = 删除一个词       │  │
│                               │  └─────────────────────────┘  │
│  目标 (goal)                  │                               │
│  ┌──────────────────────────┐ │  可以推广到                  │
│  │  world                   │ │  d$  → 删到行末              │
│  └──────────────────────────┘ │  cw  → 改一词                │
│                               │  yw  → 复制一词              │
│  按键：d_                     │                               │
│                               │  ⚡ 本关只接受 dw 系列        │
├───────────────────────────────┴───────────────────────────────┤
│  [重试]                                          [下一关 →]   │
└───────────────────────────────────────────────────────────────┘
```

- **Buffer**：`<pre>` 渲染，光标用绝对定位 `<span>` 覆盖在对应字符上
- **Explainer**：常驻右侧，始终显示当前关卡 `explanation`；通关后额外展示"你用了 X，最优解 Y"
- **HintBanner**：非法命令触发，2 秒后自动淡出
- **KeyDisplay**：从 `parseState` 读取，operator phase 显示 `d_`，完成后显示完整命令

---

## 关卡列表（MVP）

### 阶段 1 — 纯 Motion

| ID | 命令 | 场景 |
|----|------|------|
| 1-1 | `l` | 单行右移到指定位置 |
| 1-2 | `h` | 单行左移 |
| 1-3 | `j` / `k` | 跨行上下移动 |
| 1-4 | `w` | 跳到下一词起点（含标点分隔） |
| 1-5 | `b` | 后退一词 |
| 1-6 | `e` | 跳到词尾 |
| 1-7 | `0` / `$` | 行首/行末跳转 |
| 1-8 | `gg` / `G` | 文件首/末跳转 |
| 1-9 | `f{char}` | 行内字符定位 |

### 阶段 2 — 纯 Operator

| ID | 命令 | 场景 |
|----|------|------|
| 2-1 | `dd` | 删一整行 |
| 2-2 | `yy` + `p` | 复制并粘贴一行 |

### 阶段 3 — Operator + Motion（关键跃迁）

| ID | 命令 | 场景 |
|----|------|------|
| 3-1 | `dw` | 删一词 |
| 3-2 | `d$` | 删到行末 |
| 3-3 | `cw` | 改一词 |
| 3-4 | `yw` + `p` | 复制并粘贴一词 |

### 阶段 4 — Text Objects

| ID | 命令 | 场景 |
|----|------|------|
| 4-1 | `diw` | 删内部词（不含空格） |
| 4-2 | `ci"` | 改引号内内容 |
| 4-3 | `yap` | 复制整段 |

### 阶段 5 — Count 前缀

| ID | 命令 | 场景 |
|----|------|------|
| 5-1 | `3w` | 跳 3 词 |
| 5-2 | `d2w` | 删 2 词 |
| 5-3 | `5dd` | 删 5 行 |

---

## 非最优命令的阻断逻辑

```
player presses key
  → parser.parseKey(currentParseState, key) → newState
  → if newState.phase === 'complete':
      serialized = serializeCommand(newState.cmd)
      if serialized NOT in level.allowedCommands:
        dispatch hint(level 对应提示)
        reset parseState to idle
        return  // buffer 不变
      else:
        buffer = executor.execute(newState.cmd, buffer)
        if bufferToString(buffer) === level.goalBuffer:
          status = 'complete'
  → else:
      parseState = newState
```

---

## 视觉规范（Tailwind）

| 元素 | 说明 |
|------|------|
| 页面背景 | `bg-white text-gray-900` |
| Buffer 区 | `bg-gray-50 border border-gray-200 rounded font-mono` |
| 光标 | `bg-blue-600 text-white`，绝对定位 span |
| 目标 Buffer | `bg-gray-100 text-gray-400 border-dashed` |
| Explainer 面板 | `bg-white border-l border-gray-200` |
| 错误提示 | `bg-red-50 text-red-700 border border-red-200` |
| 通关提示 | `bg-green-50 text-green-700` |
| 字体 | JetBrains Mono，Google Fonts CDN，`index.html` 中引入 |

---

## 实现顺序

1. `src/engine/types.ts`
2. `src/engine/parser/` （先写测试）
3. `src/engine/motions/hjkl.ts` + 测试
4. `src/engine/motions/word.ts` + 测试
5. `src/engine/motions/line.ts`、`file.ts`、`find.ts` + 测试
6. `src/engine/operators/delete.ts` + 测试
7. `src/engine/operators/yank.ts`、`paste.ts` + 测试
8. `src/engine/executor/`
9. `src/engine/explainer/`
10. `src/game/levels/phase1-motion.ts`
11. `src/game/store.ts`
12. `src/ui/Buffer.tsx`、`KeyDisplay.tsx`
13. `src/ui/Explainer.tsx`
14. `src/ui/GameBoard.tsx`、`App.tsx`
15. localStorage 进度读写
16. 后续阶段关卡数据

每步完成后停下等确认。

---

## 验证方式

- `pnpm test --run` 全绿（engine 每命令 ≥ 3 个测试）
- `pnpm typecheck` 无错误（strict 模式）
- `pnpm dev` 启动，手动过 1-1 到 1-4
- 阶段 3 关卡中按 `x` → buffer 不变，提示出现
- 刷新页面 → 进度从 localStorage 恢复
