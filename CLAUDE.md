# Vim Practice Game

练习 Vim 命令的关卡游戏。每关给定起始文本和目标文本，玩家用最少按键达成目标。
浏览器运行，单页应用。

## 产品哲学（不可妥协）
这个游戏的核心目标不是让玩家"记住按键"，而是让玩家**理解 vim 命令的组合语法**。
玩家通关后应该能从已学命令推广出未见过的命令。

为此：
- 每个 vim 命令必须能被解析成结构化形式：[count][operator][motion/text-object]
- 例如 `d3w` = { count: 3, operator: 'd', motion: 'w' }
- 玩家完成关卡后必须看到：他按的键 → 解构 → 为什么这样组合 → 可推广的变体
- UI 上「解释面板」是核心功能，不是加分项

任何"快速实现"如果牺牲了可解释性，必须拒绝。比如不要用正则匹配 "dw" 字符串
直接执行删除词，而要先解析成 AST，再分别执行 operator 和 motion。

## 命令
- 启动开发：`pnpm dev`
- 测试：`pnpm test`（vitest watch 模式）
- 跑一次测试：`pnpm test --run`
- 类型检查：`pnpm typecheck`
- Lint + 格式化：`pnpm lint`
- 构建：`pnpm build`

## 技术栈
- Vite + React 18 + TypeScript（**strict 模式必须开**）
- 状态管理：Zustand（**不要引入 Redux 或 Context**）
- 样式：Tailwind CSS（**不要写自定义 CSS 文件**，全部用 Tailwind class）
- 字体：等宽字体（JetBrains Mono），从 CDN 引入
- 测试：vitest + @testing-library/react
- 包管理器：pnpm（**不要用 npm 或 yarn**）

## 项目结构（铁律）

src/
├── engine/
│   ├── parser/      # 把按键序列解析成命令 AST
│   ├── motions/     # 所有 motion 命令（w, b, e, $, 0, ^ 等）
│   ├── operators/   # 所有 operator（d, c, y 等）
│   ├── executor/    # 把 AST 在 buffer 上执行
│   └── explainer/   # 把 AST 转成人类可读的解释（核心功能）
├── game/            # 关卡数据 + 进度 + Zustand store
├── ui/              # React 组件
└── main.tsx

铁律：
- engine 不能 import 任何 React 相关的东西
- engine 必须 100% 可单元测试，函数尽量纯（输入 state，输出新 state）
- parser 必须先于 executor 完成，所有命令都先解析成 AST 再执行
- explainer 是 engine 的一等公民，不是事后添加的功能
- 每个 motion 和 operator 都必须自带元数据
- UI 组件不能直接修改 buffer，必须通过 store 调用 engine 提供的命令

## 命令元数据（核心数据结构）

每个 motion 和 operator 必须实现这个接口：

type CommandMeta = {
  key: string;              // 按键，如 'w'
  name: string;             // 全称，如 'word forward'
  mnemonic: string;         // 助记词来源，如 '"w" for word'
  category: 'motion' | 'operator' | 'text-object';
  description: string;      // 一句话描述行为
  examples: Example[];      // 至少 2 个例子（before/after）
  combinesWith?: string[];  // 常见组合，如 motion 'w' combinesWith ['d','c','y']
};

每个新命令必须先填这个元数据，再写实现。这不是文档，是代码。
explainer 模块直接从这些元数据生成关卡解释。

## 关卡数据结构

type Level = {
  id: string;
  title: string;
  initialBuffer: string;
  cursorStart: { line: number; col: number };
  goalBuffer: string;
  optimalKeys: string;             // 最少按键的标准答案，如 'dw'
  introducesCommands: string[];    // 这关首次引入的命令
  explanation: {
    breakdown: string;             // "d (delete) + w (word forward)"
    rationale: string;             // 为什么这样组合
    variations: string[];          // 推广，如 ['d$ 删到行末', 'cw 改一个词']
  };
};

设计关卡的原则：
- 每关只引入 1-2 个新命令
- 关卡顺序按"组合语法的渐进展开"排：先 motion，再 operator，再组合
- 关卡解释必须让玩家看到"组合规则"，不只是"这一关怎么过"

## 关卡进展（教学曲线）

阶段 1（纯 motion）：h/j/k/l → w/b → e → 0/$ → gg/G → f{char}
阶段 2（纯 operator）：dd → yy → p
阶段 3（operator + motion，关键飞跃）：dw → d$ → cw → yw
阶段 4（text objects）：diw → ci" → yap
阶段 5（count 前缀）：3w → d2w → 5dd

每跨一个阶段，关卡解释必须明确点出"现在多了什么维度的组合"。

## Vim 行为：真实性优先
**每个 vim 命令实现前，先在测试里写清楚它的行为**。
遇到不确定的细节，问我，不要凭印象实现。

容易写错的地方：
- `w` 跳到下个 word 起点，word 由非字母数字字符分隔
- `W` 跳到下个 WORD 起点，WORD 只由空白分隔
- `e` 跳到当前/下个 word 的末尾（不是开头）
- `b` 是 `w` 的反向
- `0` 跳到行首，`^` 跳到第一个非空白字符，`$` 跳到行末
- 数字前缀必须支持：`3w` = 执行 w 三次
- 行末/文件末的边界要单独测试

## 渲染规则
- buffer 用 `<pre>` 渲染，不要用 `<div>` 拼接
- 光标用 CSS 绝对定位的 `<span>` 实现，**不要用 contenteditable**
- 键盘监听绑在 window 上，用 useEffect + cleanup，依赖数组要正确
- 不要在每次渲染都重新绑定监听器（会导致输入卡顿）
- 性能优化等出现问题再做，不要预先优化

## 测试约定
- engine 的每个命令至少 3 个测试：正常 + 行首边界 + 行末边界
- 测试用注释画出 buffer 状态，光标位置用 `|` 标注：
  // before: hello |world
  // after:  hello world|
- engine 不需要 mock，纯函数直接传入 state 断言输出
- UI 组件测试用 @testing-library，测用户能看到的行为，不测实现细节

## TypeScript 约定
- 优先 `type` 不用 `interface`（除非需要继承）
- **禁止 `any`**，不知道类型用 `unknown`
- 数据结构用 `readonly` 标记不可变字段
- 函数参数和返回值都要标类型，不要靠推断

## 工作流
- 加新命令顺序：写元数据 → 写测试 → 实现 → 跑测试 → 在 docs/commands.md 登记
- 提交前必须 typecheck 通过 + 测试全绿
- 一个 commit 只做一件事
- 加新功能完成后停下来等我确认，不要一次写完所有命令

## 已知坑（每次踩坑往这里加）
（暂无）
