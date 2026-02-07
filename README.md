# 🧬 萌菌大作战 — Pop Cure: Vaccine Rush

**"Don't fight them. Cure them."**  
一款轻松治愈的 HTML5 Canvas 策略游戏，拯救宿主的免疫系统！

---

## 📖 游戏介绍

### 🎯 背景故事

**【免疫防御指挥中心】紧急通告：**

实习指挥官，欢迎来到免疫防御指挥中心！我是你的AI助手 MEDI-01。

检测到异常：大量【果冻病毒】正在宿主体内快速繁殖！它们会不断分裂，越来越多……如果不及时清除，宿主的免疫系统将会崩溃！

请拿起你的【泡泡消灭枪】，点击消灭这些病毒。记住：收集核酸数据达到100%，就能触发全屏净化光波！

### 🎮 核心玩法

- **点击消杀**：用鼠标点击屏幕上的圆形病毒进行消灭
- **双重进度管理**：
  - 🟢 **疫苗研发进度（顶部）**：消灭病毒收集核酸数据，达到 100% 通关
  - 🔴 **免疫系统负荷（底部）**：感染条不能满格，否则宿主免疫崩溃
- **技能升级系统**：关卡通关解锁强力技能
- **RPG式成长**：先苦后甜，每一关的奖励都是实打实的能力提升

### 🦠 病毒图鉴

#### Type A：草莓冠状体 🍓
- **外观**：粉色球体（#FF9AA2），周围一圈小肉球
- **血量**：1 HP（点击1次消灭）
- **速度**：1.8（中等）
- **分裂时间**：3.5秒
- **治愈值**：+1
- **特征**：基础病原体，虽然行动缓慢，但会不断呼吸分裂！
- **攻略**：新手友好型，优先击杀快分裂的

#### Type B：蓝莓厚壁菌 🫐
- **外观**：青色六边形聚合体（#B5EAD7）
- **血量**：2 HP（需点击2次）
- **速度**：0.6（缓慢）
- **分裂时间**：6.0秒
- **治愈值**：+2
- **特征**：拥有厚实的细胞壁，普通攻击难以穿透！
- **攻略**：⚠️ 必须连续点击2次才能消灭，当心被打断

#### Type C：柠檬手雷 🍋
- **外观**：橙色圆角四角星/手里剑（#FFDAC1）
- **血量**：1 HP
- **速度**：4.0（极速！）
- **分裂时间**：1.8秒（超快繁殖）
- **治愈值**：+3
- **特征**：极速变异体！高速旋转移动，极难捕捉！
- **攻略**：速度极快必须优先击杀，它的高治愈值是对手速的奖励

### ⚡ 技能系统

#### 1. 🧊 极寒领域 (Absolute Zero)
- **类型**：主动技能
- **解锁**：通关 Level 3
- **教学**：Level 4 开始时
- **冷却**：45 秒
- **效果**：释放冷冻力场，全屏病毒冻结 5 秒！病毒停止移动、分裂和生成
- **策略**：平时忍住不用，等怪物太多或 Type C 乱飞时开启"子弹时间"

#### 2. ⚡ 连环闪电 (Chain Lightning)
- **类型**：被动技能
- **解锁**：通关 Level 4
- **教学**：Level 5 开始时
- **触发条件**：Combo 达到 5 的倍数
- **效果**：下一次点击释放范围闪电链，自动秒杀 200px 内所有病毒
- **策略**：奖励精准点击！空点会清零 Combo，手越稳清怪越快

### 🎯 关卡系统

#### 🌸 章节设计（Chapter System）

游戏关卡按**章节**分组，每个章节都有独特的视觉主题和挑战难度：

| 章节 | 名称 | 关卡范围 | 主题配色 | 背景描述 |
|------|------|----------|----------|----------|
| **Chapter 01** | 鼻腔防线 | Level 1-3 | 粉色温和 | 人体第一道防线，温暖的鼻腔环境 |
| **Chapter 02** | 肺部深境 | Level 4-5 | 薄荷清爽 | 进入呼吸系统深处，清新的肺部空间 |

#### 🎨 沉浸式章节体验

- **渐变背景**：每章节独特的垂直渐变色彩
- **主题粒子**：漂浮的呼吸感粒子效果
- **水印标题**：淡雅的章节名称水印
- **智能切换**：随关卡进度自动切换章节，或手动切换浏览

#### 关卡详情

| 关卡 | 章节 | 名称 | 目标 | 难度 | 病毒类型 | 生成间隔 | 奖励/教学 |
|------|------|------|------|------|----------|---------|----------|
| **Lv 1** | 第一章 | 初次接触 | 6只 | 1.0x | A | 2.0s | 🎓 新手教程 |
| **Lv 2** | 第一章 | 变异出现 | 30只 | 1.2x | A, B | 1.6s | 🎓 Type B 图鉴 |
| **Lv 3** | 第一章 | 多元威胁 | 50只 | 1.4x | A, B, C | 1.2s | 🎁 解锁冰冻 |
| **Lv 4** | 第二章 | 疯狂繁殖 | 70只 | 1.6x | A, B, C | 0.9s | 🎁 解锁闪电 |
| **Lv 5** | 第二章 | 终极对抗 | 100只 | 2.0x | A, B, C | 0.6s | 🏆 最终胜利 |

### 🎨 设计理念

#### 三明治布局 (Sandwich UI)
- **顶部仪表盘（15%）**：关卡数 + 疫苗进度 + 被动技能指示
- **游戏主舞台（75%）**：纯净点击区 + 右下角浮动技能按钮
- **底部警戒区（10%）**：免疫系统负荷条（血条/失败条件）

#### 双场景系统
```
开始界面 → 开场动画 → 地图选关 → 战斗场景 → 完成结算 → 返回地图
```

#### 渐进难度曲线
- **前3关**：新手期，压力逐渐增大，让玩家渴望变强
- **Level 3**：压力局，Type C 极速病毒让玩家急需控场
- **Level 4**：爽局，有了冰冻技能可以轻松应对
- **Level 5**：技巧局，双技能组合展现操作极限

---

## �️ 设计流程与开发历程

### Phase 1：核心玩法建立
- ✅ Canvas 渲染与病毒实体系统
- ✅ 点击检测与碰撞判定
- ✅ 病毒分裂机制与倒计时可视化
- ✅ 双进度条系统（疫苗进度 vs 感染警报）

### Phase 2：内容扩充
- ✅ 三种病毒类型设计（速度/血量/分裂时间差异化）
- ✅ 关卡系统（5关渐进式难度）
- ✅ 粒子特效与爆炸反馈
- ✅ 新手教学气泡系统（4步引导）

### Phase 3：技能系统
- ✅ 冰冻技能（主动控场，45秒CD）
- ✅ 闪电连击（被动奖励，Combo触发）
- ✅ 技能解锁流程（RPG式成长）
- ✅ 技能演示Canvas动画

### Phase 4：双场景系统
- ✅ 地图场景（Canvas绘制，关卡节点交互）
- ✅ 体力系统（进入关卡消耗5点，每分钟恢复1点）
- ✅ localStorage持久化（进度/星数/体力保存）
- ✅ Bezier曲线路径与漂浮粒子背景

### Phase 5：重构与优化（当前）
- ✅ 代码分层架构（core/managers/entities/data/systems/ui）
- ✅ 模块化 CSS（base/layout/components/modals/map）
- ✅ 修正拼写错误（partical → particle）
- ✅ 完善文档与开发者指南

### 🎮 体力系统设计

**初衷**：模拟手游"肝度"，让玩家珍惜每次挑战机会，同时避免无限重试导致难度失衡。

- **初始体力**：30 点
- **进入消耗**：5 点/关
- **恢复机制**：每分钟 +1 点，最大 30 点
- **策略意义**：
  - 失败不会退款体力（提高挑战严肃性）
  - 连续挑战6关后需等待恢复（避免肝爆）
  - 可扩展为体力药剂/广告回复等商业化元素

---

## �📂 技术架构

## 快速目录总览

```
containmen_virus/
├── index.html
├── style.css
├── css/
├── js/
│   ├── core/
│   │   ├── game.js  ⚡ 重构：精简核心入口（~180行）
│   │   ├── config.js
│   │   └── game-manager.js
│   ├── managers/
│   │   ├── scene-manager.js
│   │   ├── ui-manager.js
│   │   ├── map-renderer.js
│   │   └── game-events.js ✨ 新增：游戏事件处理
│   ├── entities/
│   │   ├── virus.js
│   │   └── particle.js
│   ├── data/
│   │   ├── levels.js
│   │   ├── skills.js
│   │   └── story.js
│   ├── systems/
│   │   ├── tutorial.js
│   │   ├── effects.js
│   │   ├── skill-demo.js
│   │   ├── game-loop.js ✨ 新增：主游戏循环与渲染
│   │   ├── input-handler.js ✨ 新增：输入事件处理
│   │   └── debugger.js ✨ 新增：调试工具命令
│   └── ui/
│       ├── opening.js
│       └── modals-ui.js
└── ...
```

---

## 文件与职责（逐文件说明）

- `index.html`：入口 HTML，包含页面 DOM（含 `#start-screen`），并通过 `<script type="module">` 导入 `./js/core/game.js` 与 `./js/managers/scene-manager.js`。页面在“开始”按钮触发开场动画后初始化 `SceneManager`。

- `style.css`：将 `css/` 模块汇总的入口文件（通过 `@import` 加载 `css/` 下的模块化样式）。

CSS 模块（`css/` 目录）
- `base.css`：基础样式、全局字体与动画。
- `layout.css`：布局（Header/Footer/地图与故事屏幕）。
- `components.css`：组件样式（技能、连击、HUD）。
- `modals.css`：弹窗样式（图鉴、技能解锁、结束弹窗）。
- `map.css`：地图相关样式。

JS 层次（`js/`）

核心层（`js/core/`）
- **`game.js`** ⚡ **重构**：战斗场景核心入口，初始化、Canvas管理、病毒生成、事件整合。现已精简为 ~180 行，核心逻辑分离到系统模块。
- `config.js`：全局常量与病毒类型定义（`CONFIG`）。
- `game-manager.js`：高层关卡流转与游戏状态管理（关卡选择、胜利/失败判定、事件广播）。

管理层（`js/managers/`）
- `scene-manager.js`：地图场景控制、体力系统、localStorage 持久化、与 `map-renderer` 的交互。
- `ui-manager.js`：页面 UI 更新接口（进度条、技能 UI、连击、弹窗触发桥接）。
- `map-renderer.js`：地图 Canvas 渲染（关卡节点、路径、粒子背景与交互判定）。
- **`game-events.js`** ✨ **新增**：游戏事件处理（教程结束、胜利失败、关卡切换、窗口事件）。

实体层（`js/entities/`）
- `virus.js`：病毒类（运动、边界处理、分裂逻辑、绘制多种外观）。
- `particle.js`：粒子实体（爆炸、飞散粒子），原 `partical.js` 已重命名为 `particle.js`。

数据层（`js/data/`）
- `levels.js`：关卡配置（目标、阈值、生成节奏、可用敌人、地图坐标等）。
- `skills.js`：技能管理（解锁、冷却、连击判断与效果触发）。
- `story.js`：剧情文本与教学步骤（开场幻灯、教程气泡配置、图鉴文案）。

系统层（`js/systems/`）
- `tutorial.js`：教学引导逻辑（气泡定位、步骤管理、教程病毒锚点）。
- `effects.js`：视觉效果管理（粒子池、爆炸、胜利波、教程高亮）。
- `skill-demo.js`：技能弹窗内的小型演示/Canvas 动画。
- **`game-loop.js`** ✨ **新增**：主游戏循环（渲染、病毒更新、状态检查）。
- **`input-handler.js`** ✨ **新增**：输入事件处理（鼠标点击、技能触发、按钮事件）。
- **`debugger.js`** ✨ **新增**：调试工具命令（控制台快捷指令）。

界面层（`js/ui/`）
- `opening.js`：开场动画（扫描仪/打字机效果），完成后派发事件触发场景初始化。
- `modals-ui.js`：弹窗 DOM 管理与图鉴/技能解锁弹窗的 Canvas 预览适配。

其他
- `check-integration.js`（若存在）：用于快速集成/文件完整性检查（可选脚本）。

---

## 新增模块说明（拆分自 game.js）

### 📌 `js/systems/game-loop.js` - 游戏循环与渲染
负责核心游戏循环的运行和画面更新。

**主要函数：**
- `startGameLoop(canvas, ctx, viruses, ...)` - 启动主游戏循环
  - 处理状态机（PLAYING / WINNING / LEVEL_OVER）
  - 更新病毒、粒子、冷却时间
  - 检查胜负条件
- `updateGamePlaying()` - 游戏进行中的逻辑
- `updateGameWinning()` - 胜利动画逻辑
- `updateViruses()` - 病毒更新（移动、分裂、碰撞）

**使用场景：**
```javascript
import { startGameLoop } from '../systems/game-loop.js';
// 在 startGame() 中调用
startGameLoop(canvas, ctx, viruses, freezeCooldown, FREEZE_COOLDOWN_MAX, {}, spawnVirus, triggerComplete, triggerOver);
```

### 📌 `js/systems/input-handler.js` - 输入事件处理
负责处理所有用户输入（鼠标点击、技能按钮、导航按钮）。

**主要函数：**
- `initMouseHandler(canvas, viruses, updateCombo)` - 初始化Canvas点击事件
  - 教程模式：只能点击教程病毒
  - 游戏模式：点击消灭病毒、触发连击、激活闪电
- `initSkillButton(btn, freezeCooldown, maxCD, setCD)` - 初始化冰冻技能按钮
  - 检查CD和游戏状态
  - 执行技能回调
- `initNextLevelButton(btn, uiManager, callback)` - "下一关"按钮
- `initGameOverButton(btn)` - "返回地图"按钮

**使用场景：**
```javascript
import { initMouseHandler, initSkillButton } from '../systems/input-handler.js';
// 在 init() 中调用
initMouseHandler(canvas, viruses, updateComboDisplay);
initSkillButton(uiManager.activeSkillBtn, window.freezeCooldown, FREEZE_COOLDOWN_MAX, (cd) => {
    window.freezeCooldown = cd;
});
```

### 📌 `js/systems/debugger.js` - 调试工具
提供控制台快捷命令，用于快速测试和调试。

**可用命令：**
- `debugJumpToLevel(n)` - 跳到第 n+1 关并自动解锁对应技能
- `debugShowStatus()` - 打印当前游戏状态（关卡、病毒数、CD等）
- `debugResetCooldown()` - 立即重置冰冻CD
- `debugUnlockAllSkills()` - 解锁所有技能
- `debugCloseAllModals()` - 关闭所有弹窗
- `debugActivateGame()` - 强制激活游戏（如果卡住）
- `debugClearProgress()` - 清除游戏进度（回到第一关）

**使用场景：**
```javascript
import { initDebugger } from '../systems/debugger.js';
// 在 init() 中调用，会自动添加所有命令到 window
initDebugger(uiManager, tutorialManager, viruses, freezeCooldown, FREEZE_COOLDOWN_MAX);

// 然后在浏览器控制台输入
debugJumpToLevel(3);  // 跳到第4关
debugShowStatus();    // 查看状态
```

### 📌 `js/managers/game-events.js` - 游戏事件处理
管理游戏中的全局事件（教程结束、胜利失败、关卡切换等）。

**主要函数：**
- `initTutorialEndEvent(viruses, uiManager, ...)` - 监听教程结束事件
  - 清理教程病毒
  - 生成初始病毒
  - 激活游戏
- `triggerLevelComplete(gameManager, uiManager)` - 关卡完成（显示完成弹窗）
- `triggerGameOver(gameManager, uiManager)` - 游戏失败（显示失败弹窗）
- `triggerGameWin(gameManager, uiManager)` - 游戏全胜（显示胜利弹窗）
- `proceedToNextLevel(canvas, gameManager, uiManager, startGame)` - 进入下一关
  - 重置CD和循环标志
  - 调用 startGame() 启动下一关
- `initWindowResizeHandler(tutorialManager)` - 窗口resize处理

**使用场景：**
```javascript
import { triggerLevelComplete, triggerGameOver, proceedToNextLevel } from '../managers/game-events.js';

// 在游戏过程中触发
if (playerVictory) triggerLevelComplete(gameManager, uiManager);
if (playerDefeated) triggerGameOver(gameManager, uiManager);

// 点击"下一关"按钮时
proceedToNextLevel(canvas, gameManager, uiManager, startGame);
```

---

## 我已做过的动作（变更清单）

- 按你指定的分层结构将 JS 文件移动到 `js/` 下相应目录，并修正了模块导入路径。
- 将 `partical.js` 重命名为 `particle.js` 并更新引用。
- 删除了 `src/` 下重复或占位的文件（`src/utils/*`、`src/components/*`、`src/scenes/*`），因为实现已统一到 `js/` 下。
- 更新了 `index.html` 中导入路径，使其指向 `./js/core/game.js` 与 `./js/managers/scene-manager.js`。

### 🎯 Phase 6：代码重构分离（最新）
- ✅ **拆分 `game.js`（795行 → 180行）**
  - `js/systems/game-loop.js`：主游戏循环与渲染逻辑
  - `js/systems/input-handler.js`：鼠标点击、技能按钮、关卡切换事件
  - `js/systems/debugger.js`：调试命令（debugJumpToLevel 等）
  - `js/managers/game-events.js`：游戏事件处理（教程结束、胜利失败等）
- ✅ 保留 `game.js` 为精简的核心入口（init、startGame、基础初始化）
- ✅ 所有模块独立、职责清晰、便于调试

---

## 常见问题快速排查（开局提示不可见）

1. 检查 DOM：`#start-screen` 在 `index.html` 中应存在且初始化时为可见（默认有内联 `style`）。
2. 事件时序：`opening.js` 会播放开场并在完成后触发 `startButtonClicked` 或相应事件以初始化 `SceneManager`。如果 `SceneManager` 未初始化，地图与后续逻辑可能未出现。
3. 样式覆盖：确保没有外部 CSS 将 `#start-screen` 隐藏（`display:none` 或 `opacity:0`）。浏览器 DevTools 中查找该元素并观察 computed style。
4. 控制台错误：若脚本在加载时抛出错误，后续初始化会中断。请打开控制台查看是否有模块加载或运行时错误。

调试命令（在浏览器控制台）：

```js
// 检查 start 屏是否存在
document.getElementById('start-screen');

// 检查 SceneManager 是否已被初始化（开场动画完成后）
window.sceneManager;

// 触发开始（模拟） - 仅用于调试
document.getElementById('start-btn')?.click();
```

---

## 提交建议

建议将此次重构作为一次独立提交：

```bash
git add -A
git commit -m "chore: 重构项目目录，整理 JS 模块并修正 particle 拼写"
```

---

如果你愿意，我可以：
- 将 `README.md` 再细化为开发者参考（事件列表、导出 API、模块间接口）；或
- 立即排查“开局提示不可见”问题并修复（需要你确认是否在浏览器中可复现，或我直接检查 `opening.js` / `index.html` 的相关代码）。

请选择要继续的任务：
- 输入 `doc`：我将把 README 扩展为详尽的开发者文档（事件、API、示例）。
- 输入 `debug`：我将立刻排查并修复“开局提示”问题。
