# 🧬 Pop Cure: Vaccine Rush - AI 上下文索引 (README_AI.md)

## 1. 项目概览

**一句话描述**：基于 HTML5 Canvas + ES6 模块化的 5 关递进式病毒消除游戏，包含动画教程、技能解锁、体力系统、localStorage 持久化。

**技术栈**：
- 前端：HTML5 Canvas、原生 JavaScript ES6+（模块化架构）、CSS3 Grid/Flex
- 无框架依赖（Vanilla JS）
- 架构模式：分层架构（Core/Managers/Entities/Systems/Data/UI）

---

## 2. 文件结构与职责（关键文件）

```
containmen_virus/
├── index.html                    # 游戏主入口 DOM
├── style.css                     # CSS 模块聚合器
│
├── css/
│   ├── base.css                 # 全局字体、重置、基础动画
│   ├── layout.css               # 三层布局（Header 15% | Canvas 75% | Footer 10%）
│   ├── components.css           # 技能按钮、连击显示、HUD 样式
│   ├── modals.css               # 弹窗、图鉴、结算画面
│   └── map.css                  # 地图 Canvas 样式与交互
│
├── js/
│   ├── core/
│   │   ├── game.js              # ⚡ 游戏主入口：初始化、Canvas管理、事件整合、病毒生成
│   │   ├── config.js            # CONFIG 全局常量（病毒类型、关卡参数）
│   │   └── game-manager.js      # 关卡流转、游戏状态（PLAYING/WINNING/LEVEL_OVER）、胜负判定
│   │
│   ├── managers/
│   │   ├── scene-manager.js     # 地图场景控制、体力系统、localStorage 持久化
│   │   ├── ui-manager.js        # 页面 UI 更新接口（进度条、技能UI、连击、弹窗）
│   │   ├── map-renderer.js      # 地图 Canvas 渲染（关卡节点、路径、粒子背景）
│   │   └── game-events.js       # 游戏事件处理（教程结束、胜利失败、关卡切换）
│   │
│   ├── entities/
│   │   ├── virus.js             # 病毒类：运动、分裂、边界反弹、AABB碰撞、绘制多种外观
│   │   └── particle.js          # 粒子类：爆炸、飞散、视觉特效
│   │
│   ├── data/
│   │   ├── levels.js            # 关卡配置（5关：目标、阈值、生成节奏、可用敌人类型）
│   │   ├── skills.js            # 技能管理：解锁、CD、连击触发逻辑
│   │   └── story.js             # 剧情文本、教程气泡配置、图鉴文案
│   │
│   ├── systems/
│   │   ├── game-loop.js         # ⚡ 主游戏循环：状态机分支、病毒更新、渲染
│   │   ├── input-handler.js     # 鼠标点击、技能触发、按钮事件订阅
│   │   ├── tutorial.js          # 教学引导：气泡定位、步骤管理、教程病毒锚点
│   │   ├── effects.js           # 视觉效果：粒子池、爆炸、胜利光波、教程高亮
│   │   ├── skill-demo.js        # 技能解锁弹窗中的 Canvas 演示动画
│   │   └── debugger.js          # 调试命令（控制台快捷指令，用于开发测试）
│   │
│   └── ui/
│       ├── opening.js           # 开场动画：扫描仪/打字机效果 Canvas 绘制
│       └── modals-ui.js         # 弹窗 DOM 管理：图鉴、技能解锁、结算
│
└── 小结：共 3 层架构，每层明确职责，总计 20+ 文件，约 4000+ 行代码
```

---

## 3. 核心架构与逻辑映射

### 3.1 全局状态与管理中枢

#### 全局常量与枚举 (`js/core/config.js`)
```javascript
CONFIG = {
    VIRUS_TYPES: {
        A: { color, radius, speed, hp, splitTime, splitCount, cureValue },
        B: { ... },
        C: { ... }
    },
    SPAWN_INTERVAL: 1200,        // 初始生成间隔（毫秒）
    INFECTION_THRESHOLD: 100,    // 感染阈值（屏幕病毒数≥此值则失败）
}
```

#### 游戏状态枚举 (`js/core/game-manager.js`)
```javascript
export const GAME_STATE = {
    PLAYING: 0,         // 游戏进行中
    WINNING: 1,         // 胜利动画中
    LEVEL_OVER: 2       // 暂停/图鉴/弹窗中
};

class GameManager {
    isGameActive: boolean;      // 🔴 **关键**：控制是否更新病毒和生成新敌人
    gameState: GAME_STATE;      // 当前游戏状态
    gameTime: number;           // 本关已经过时间（毫秒）
    curedCount: number;         // 已治愈/消灭的病毒数
    spawnTimer: number;         // 距离下一次生成的倒计时
    currentSpawnInterval: number; // 当前生成间隔（会随难度递进减小）
    availableTypes: string[];   // 当前可用的病毒类型（["A"], ["A","B"], 或 ["A","B","C"]）
}
```

#### 技能系统 (`js/data/skills.js`)
```javascript
class SkillManager {
    unlockedSkills: Set<string>;     // 已解锁的技能集合
    combo: number;                    // 当前连击数
    isFrozen: boolean;                // 是否处于冰冻状态
    frozenEndTime: number;            // 冰冻结束的时间戳
    
    // 主动技能：冰冻
    triggerFreeze(onEndCallback);
    
    // 被动技能：闪电连击
    checkCombo(hitSuccessful): boolean; // 返回 true 时触发闪电
    activateLightning(x, y, targets);
    drawLightning(ctx);                 // 每帧绘制闪电特效
}
```

#### 教程系统 (`js/systems/tutorial.js`)
```javascript
class TutorialManager {
    tutorialActive: boolean;        // 教程是否激活
    tutorialVirus: Virus;           // 教程标记的病毒（锁定不动）
    currentGuideStep: number;       // 当前教学步骤（0 ~ totalGuideSteps）
    
    setTutorialVirus(virus);
    showGuideStep(stepIndex);       // 定位气泡指示教程病毒
    nextGuide();                    // 进入下一步
    endGuide();                     // 触发 tutorialEnd 事件
}
```

---

### 3.2 DOM 元素与 JS 逻辑映射表

| HTML ID / Class | 所在文件 | 对应 JS 变量/函数 | 更新时机 | 说明 |
|---|---|---|---|---|
| `#start-screen` | index.html | `uiManager.showStartScreen()` | 游戏初始化 | 开始界面（旧版开局屏） |
| `#game-layer` | index.html | 游戏主容器 | - | 战斗场景所有 UI 的根节点 |
| `#gameCanvas` | index.html | `ctx = canvas.getContext('2d')` | 每帧 60Hz | Canvas 渲染目标，所有游戏画面 |
| `#ui-header` | index.html | `uiManager` 控制 | - | 顶部 HUD（关卡数、疫苗进度条） |
| `#level-display-header` | index.html | `gameManager.currentLevelIndex` | 关卡启动时 | 显示"Level 1" 等 |
| `#cure-bar-header` | index.html | `uiManager.updateProgressBars()` | 每帧或击中病毒时 | 疫苗研发进度条（绿色，顶部） |
| `#ui-footer` | index.html | `uiManager` 控制 | - | 底部 HUD（免疫负荷条）一览 |
| `#infection-bar-footer` | index.html | `uiManager.updateProgressBars()` | 每帧 | 免疫系统负荷条（红色，底部） |
| `#active-skill-btn` | index.html | `uiManager.activeSkillBtn` | 技能解锁/CD时 | 右下角冰冻技能按钮 |
| `.cooldown-overlay` | css/components.css | `uiManager.updateCooldownUI(cd, max)` | CD 计时中 | 显示技能冷却进度 |
| `.combo-display` | index.html | `skillManager.getCombo()` + `uiManager.updateComboDisplay()` | 连击时 | 显示"⚡ Combo: 5" |
| `#passive-skill-area` | index.html | 被动技能显示区 | Level 5+ | 闪电连击指示区（隐藏/显示） |
| `#modal-intro` | index.html | `uiManager.showIntroModal(type, callback)` | 新病毒首次出现 | 病毒图鉴弹窗（Type A/B/C） |
| `#modal-skill-unlock` | index.html | `uiManager.showSkillUnlockModal(skillType, callback)` | 技能解锁 | 技能解锁弹窗+演示动画 |
| `#modal-level-complete` | index.html | `uiManager.showLevelComplete()` | 关卡通反时 | 关卡完成弹窗 |
| `#modal-game-over` | index.html | `uiManager.showGameOver()` | 失败时 | 游戏失败弹窗 |
| `#tutorial-overlay` | index.html | `tutorialManager.showTutorial()` | Level 1 教程 | 教程气泡遮罩 |
| `.guide-bubble` | 多数 css | `tutorialManager.showGuideStep()` | 教程步骤 | 教案提示气泡（绝对定位） |
| `#story-screen` | index.html | `OpeningScene` 类 | 游戏启动->地图 | 开场动画画面 |
| `#map-layer` | index.html | `sceneManager.show/hide` | 关卡选择 | 地图场景容器 |
| `#map-canvas` | index.html | `mapRenderer.draw()` | 每帧（地图中） | 地图 Canvas（关卡节点、物理）|
| `#energy-bar` | index.html | `sceneManager.updateEnergyDisplay()` | 体力变化 | 右上角体力条 |

---

### 3.3 关键流程与函数调用链

#### 流程图 1️⃣：游戏启动 → 第一关开始

```
index.html 加载
    ↓
game.js init() 初始化
    ├─ 绑定开始按钮点击事件 -> startBtn.click
    └─ 初始化输入处理 (initMouseHandler, initSkillButton, ...)
    
用户点击"开始实验"按钮
    ↓
opening.js: OpeningScene() 播放开场动画 (2~3秒扫描仪效果)
    ↓
开场完成 -> 派发 startButtonClicked 事件
    ↓
scene-manager.js: 初始化地图场景 (展示 5 个关卡节点)
    ↓
用户点击第一个关卡节点
    ↓
scene-manager.js: 消耗 5 点体力，调用 startGame(0)
    ↓
game.js: startGame(levelId)
    ├─ gameManager.startLevel(levelId, uiManager, sceneManager)
    │   ├─ loadLevel(levelId) -> 读取 LEVELS[0] 配置
    │   ├─ 检查是否有 intro -> LEVELS[0].intro = 'A'
    │   ├─ 显示病毒图鉴弹窗 uiManager.showIntroModal('A', callback)
    │   └─ 图鉴关闭后 callback()
    │       ├─ 激活 tutorialManager (仅 Level 1)
    │       ├─ 设置教程病毒 (isTutorial=true, 锁定位置)
    │       └─ 显示教程气泡 tutorialManager.checkTutorial()
    │
    └─ startGameLoop() -> 启动 requestAnimationFrame 循环
        └─ 状态为 LEVEL_OVER，教程病毒高亮显示，等待用户交互
```

#### 流程图 2️⃣：教程完成 → 游戏运行

```
用户完成 4 步教程，点击"我已了解"
    ↓
tutorial.js: window.endGuide() -> tutorialManager.endGuide()
    ├─ 隐藏教程气泡和遮罩
    ├─ 触发 window.dispatchEvent(new CustomEvent('tutorialEnd'))
    └─ 返回 true
    
game.js: window 监听 tutorialEnd 事件
    ↓
initTutorialEndEvent() 回调触发
    ├─ 清理教程病毒 (viruses.splice() 移除 isTutorial=true 的病毒)
    ├─ gameManager.gameState = GAME_STATE.PLAYING ✅ **关键**
    ├─ gameManager.isGameActive = true ✅ **关键**
    ├─ 重置 gameManager.spawnTimer = gameManager.currentSpawnInterval
    ├─ 生成初始 3 个病毒 spawnInitialViruses(3)
    └─ 更新技能 UI uiManager.updateSkillUI()
    
game-loop.js: 下一帧检测 gameState=PLAYING && isGameActive=true
    ↓
进入 updateGamePlaying() 逻辑
    ├─ 每帧调用 gameManager.updateGameTime(dt) -> 更新 spawnTimer
    ├─ spawnTimer 达到 0 时生成新病毒
    ├─ updateViruses() 更新所有病毒位置、分裂、碰撞
    ├─ 检测胜负条件 gameManager.checkWinConditions()
    └─ 绘制病毒、粒子特效
```

#### 流程图 3️⃣：点击病毒 → 伤害 → 连击判定

```
用户鼠标点击 Canvas
    ↓
input-handler.js: canvas mousedown 事件
    ├─ 检查游戏状态 gameState === GAME_STATE.PLAYING ✅
    ├─ 检查教程状态 tutorialManager.isActive() ?
    │   └─ 是 -> 仅允许点击教程病毒，显示特效但不移除
    └─ 否 -> 遍历 viruses[] 倒序，检测点击点与病毒圆形的距离
    
遍历击中病毒
    ├─ virus.hit() -> hp-- 并返回是否死亡
    ├─ 显示爆炸特效 effectsManager.createExplosion()
    ├─ 如果病毒死亡
    │   ├─ 从 viruses[] 移除 splice()
    │   ├─ gameManager.addCuredCount(virus.cureValue)
    │   └─ 调用 skillManager.checkCombo(true)
    │       └─ 连击数 ++ 并检查是否是 5 的倍数
    │           └─ 是 -> 返回 true，触发闪电
    │               ├─ 查找 200px 范围内的其他病毒
    │               ├─ 对每个目标显示爆炸 + 移除
    │               ├─ activateLightning(clickX, clickY, targets)
    │               └─ 下一帧 skillManager.drawLightning() 绘制视效
    └─ 如果病毒未亡 -> 仅显示受伤闪白
    
游戏循环下一帧
    ├─ uiManager.updateProgressBars() 更新进度条
    ├─ uiManager.updateComboDisplay() 更新连击显示
    └─ gameManager.checkWinConditions()
        └─ curedCount >= levelGoal ? -> 触发胜利
```

#### 流程图 4️⃣：胜利动画 → 下一关

```
gameManager.checkWinConditions() 返回 'win'
    ↓
gameManager.gameState = GAME_STATE.WINNING ✅
gameManager.vaccineRadius = 0
    ↓
game-loop.js: 下一帧检测 gameState=WINNING
    ↓
updateGameWinning() 逻辑
    ├─ gameManager.updateVaccineWave() -> vaccineRadius 递增（光波扩散）
    ├─ effectsManager.drawVaccineWave() -> 绘制白色光波
    ├─ 遍历 viruses[]，碰撞光波的病毒爆炸 + 移除
    └─ 当 vaccineRadius 超出屏幕边界 && viruses.length===0
        └─ gameManager.endGame()
        └─ 延迟 1000ms 后 triggerLevelComplete()
        
game-events.js: triggerLevelComplete()
    ├─ uiManager.showLevelComplete() -> 显示结算弹窗
    ├─ 弹窗内"下一关"按钮 click
    └─ proceedToNextLevel()
        ├─ gameManager.nextLevel() -> currentLevelIndex++
        ├─ window.gameLoopStarted = false (重置循环标志)
        ├─ startGame(nextLevelIndex) -> 再次执行流程 1️⃣
        └─ 如果 nextLevel() 返回 false (最后一关)
            └─ 显示游戏通关画面
```

---

### 3.4 病毒类生命周期

```javascript
// 构造阶段
new Virus(x, y, typeKey)
    ├─ this.x, this.y: 坐标
    ├─ this.vx, this.vy: 速度（随机方向）
    ├─ this.hp: 血量（1 或 2）
    ├─ this.splitTimer: 倒计时（初始化为 splitTime）
    ├─ this.nearSplitFlash: 分裂警告闪烁计时器
    └─ this.rotation: 旋转角度（用于绘制 Type B 和 C）

// 每帧更新阶段（game-loop.js: updateViruses)
virus.update(dt, canvasWidth, canvasHeight)
    ├─ 移动：x += vx, y += vy
    ├─ 边界反弹：检测 x±radius 或 y±radius 超过屏幕
    ├─ 倒计时：splitTimer -= dt
    ├─ 分裂检测：splitTimer <= 0 时触发分裂（产生 2 个新病毒）
    └─ (冰冻状态下跳过移动和分裂逻辑)

// 碰撞阶段（input-handler.js: handleCanvasClick)
virus.hit()
    ├─ hp--
    ├─ this.flashTime = 100 (受伤闪白周期)
    └─ return hp <= 0 (返回是否死亡)

// 绘制阶段（game-loop.js: updateViruses)
virus.draw(ctx)
    ├─ 根据 typeKey 选择不同的绘制方法
    ├─ Type A: 圆形 + 冠状突起
    ├─ Type B: 六边形 + 旋转
    ├─ Type C: 手里剑/四角星 + 高速旋转
    ├─ 如果 nearSplitFlash > 0: 绘制红色警告边框
    ├─ 如果 isTutorial: 不绘制，由教程高亮函数绘制
    └─ 如果处于闪白状态：overlay 半透明白色

// 移除阶段
viruses.splice(i, 1)
```

---

### 3.5 状态机转移图

```
                          ┌─────────────────┐
                          │   LEVEL_OVER    │
                          │ (图鉴/弹窗/暂停)│
                          └────────┬────────┘
                                   │
                                   │ showIntroModal() 关闭 -> callback()
                                   │ -> gameManager.isGameActive = true
                                   │
                                   ↓
                          ┌─────────────────┐
                          │   PLAYING       │ ◄─── 病毒更新、生成、碰撞
                          │ (正常游戏中)    │
                          └────────┬────────┘
                                   │
                                   │ checkWinConditions()
                                   │ -> curedCount >= levelGoal
                                   │
                                   ↓
                          ┌─────────────────┐
                          │   WINNING       │ ◄─── 继续渲染，但仅处理光波
                          │ (胜利动画中)    │
                          └────────┬────────┘
                                   │
                                   │ vaccineRadius > 屏幕对角线
                                   │ && viruses.length === 0
                                   │
                                   ↓
                          ┌─────────────────┐
                          │ triggerNxtLevel │
                          │ (下一关流程)    │
                          └─────────────────┘
```

---

## 4. 关键变量与控制点速查表

| 变量名 | 所在文件 | 类型 | 作用 | 何时修改 | 🔴 注意 |
|---|---|---|---|---|---|
| `gameManager.isGameActive` | game-manager.js | boolean | 控制游戏循环是否运行病毒/生成 | 弹窗关闭、教程结束时 | ✅ 教程结束后 **必须设为 true** |
| `gameManager.gameState` | game-manager.js | GAME_STATE | 游戏状态（PLAYING/WINNING/LEVEL_OVER） | 状态转移时 | ⚠️ 影响所有游戏逻辑分支 |
| `gameManager.curedCount` | game-manager.js | number | 已消灭病毒数 | 击杀病毒时 +cureValue | 达到 levelGoal 时判赢 |
| `gameManager.spawnTimer` | game-manager.js | number | 距离下次生成的倒计时(ms) | 每帧 -dt；触发生成后重置 | 教程结束后 **必须重置** |
| `viruses[]` | game.js | Virus[] | 场景所有活动病毒 | 生成/移除时 | ✅ **必须直接修改**，不能 = 新数组 |
| `tutorialManager.tutorialActive` | tutorial.js | boolean | 教程是否激活 | Level 1 时为 true | tutorial 结束后必须 false |
| `tutorialManager.tutorialVirus` | tutorial.js | Virus | 教程标记的病毒（锁定位置） | setTutorialVirus() 设置 | ⚠️ 不参与正常游戏逻辑 |
| `skillManager.isFrozen` | skills.js | boolean | 是否处于冰冻状态 | triggerFreeze() 时 true | 冰冻时病毒不动、不生成新敌人 |
| `skillManager.combo` | skills.js | number | 当前连击数 | 击中时 ++；空点时 = 0 | 每 5 的倍数触发闪电 |
| `window.freezeCooldown` | game.js | number | 冰冻技能 CD（秒） | 技能触发时 = FREEZE_COOLDOWN_MAX | 每帧 -= dt/1000 |
| `gameManager.currentSpawnInterval` | game-manager.js | number | 当前生成间隔(ms) | 关卡加载时设置 | 随难度递进可能减小 |

---

## 5. 当前实现状态 ✅ / ⚠️ / ❌

### ✅ 已完成功能

- **核心玩法**（5/5）
  - ✅ Canvas 渲染与病毒实体系统
  - ✅ 鼠标点击碰撞检测
  - ✅ 病毒分裂机制与倒计时可视化
  - ✅ 双进度条系统（疫苗进度 vs 感染警报）
  - ✅ 3 种病毒类型（A/B/C 差异化）

- **关卡与难度**（5/5）
  - ✅ 5 关递进式关卡
  - ✅ 关卡配置系统（LEVELS 数组）
  - ✅ 难度曲线（关卡 3 最难，4 有技能压力缓解）
  - ✅ 病毒图鉴弹窗
  - ✅ 关卡完成/失败结算

- **教学系统**（4/4）
  - ✅ 第一关强制教程流程
  - ✅ 4 步教学气泡（点击·血量·分裂·完成）
  - ✅ 教程病毒锚点定位
  - ✅ 教程结束后游戏激活

- **技能系统**（2/2）
  - ✅ 冰冻技能（主动 45s CD）
  - ✅ 闪电连击（被动 Combo×5 触发）
  - ✅ 技能解锁弹窗与 Canvas 演示
  - ✅ 技能 UI 显示与 CD 进度

- **场景切换**（2/2）
  - ✅ 开场动画（扫描仪效果）
  - ✅ 地图场景（5 个关卡节点）
  - ⚠️ 体力系统（已实现但可能需调试）

- **代码架构**（3/3）
  - ✅ 分层模块化（Core/Managers/Entities/Systems/Data/UI）
  - ✅ ES6 模块导入导出
  - ✅ 事件驱动（CustomEvent 通信）

### ⚠️ 已知 Bug（已修复）

- **BUG #1：教程结束后病毒不动** ✅ **已修复**
  - 原因：`viruses = viruses.filter(...)` 创建新数组，游戏循环引用不同步
  - 修复：使用 `viruses.splice()` 直接修改原数组，并重置 `spawnTimer`
  - 文件：`js/core/game.js` L224~251

### ❌ 可能的扩展方向 (TODO)

- [ ] **音效系统**：已引入文件但未触发播放
- [ ] **排行榜/成绩保存**：localStorage 框架已有，可扩展
- [ ] **坐骑/皮肤系统**：可在病毒外观层扩展
- [ ] **多倍倍速**：快进/慢放模式
- [ ] **关卡编辑器**：WYSIWYG 关卡配置 UI
- [ ] **移动端适配**：触摸事件替代鼠标
- [ ] **社交分享**：截屏+分数分享

---

## 6. 快速调试指令 (console command)

在浏览器开发者工具（F12 → Console）中直接运行：

```javascript
// 跳转关卡
debugJumpToLevel(3)     // → 跳到第 4 关（冰冻技能）

// 查看状态
debugShowStatus()       // → 打印完整游戏状态

// 技能相关
debugUnlockAllSkills()  // → 解锁所有技能（跳过 Level 3/4）
debugResetCooldown()    // → 立即重置冰冻 CD

// UI 修复
debugUpdateSkillUI()    // → 手动刷新技能 UI（如卡顿）
debugCloseAllModals()   // → 强制关闭所有弹窗

// 游戏状态
debugActivateGame()     // → 强制激活游戏（如卡在 LEVEL_OVER）

// 数据清空
debugClearProgress()    // → 清除进度，回到第一关
```

---

## 7. 高频问题排查表

| 问题 | 可能原因 | 排查步骤 | 修复方案 |
|---|---|---|---|
| 教程完成后病毒不动 | `isGameActive` 未设为 true；`spawnTimer` 未重置 | `debugShowStatus()` 查看这两个值 | 检查 `game.js` L240-242 |
| 技能按钮不显示 | UIManager 未调用 `updateSkillUI()` | `debugUpdateSkillUI()` 手动刷新 | 关卡启动回调中添加 UI 更新 |
| 卡在弹窗不动 | `gameState` 为 `LEVEL_OVER` 但弹窗未显示 | `debugShowStatus()` 查看 gameState | 调用 `uiManager.hideAllModals()` |
| 病毒无限分裂 | `splitTimer` 未正确递减或重置 | 检查 `virus.update()` | 验证 `Virus.splitTimer` 初始化 |
| 连击不工作 | `combo` 未在 `checkCombo()` 中递增 | 击杀病毒时控制台输出 `combo` 值 | 检查 `skills.js` 的 `checkCombo()` 逻辑 |
| 下一关启动失败 | `gameLoopStarted` 未重置 | 检查 `game-events.js` L14 | `proceedToNextLevel()` 中务必重置标志 |

---

## 8. 文件间通信与事件流

```
CustomEvent 事件列表：
├─ 'startButtonClicked'  : opening.js 派发 -> scene-manager.js 监听 -> 初始化地图
├─ 'tutorialEnd'         : tutorial.js 派发 -> game.js 监听 -> 清理教程病毒、激活游戏
├─ 'levelCompleted'      : game-events.js 派发 -> scene-manager.js 监听 -> 更新进度
├─ 'levelFailed'         : game-events.js 派发 -> scene-manager.js 监听 -> 红色提示
└─ 'backToMapRequested'  : 失败弹窗派发 -> scene-manager.js 监听 -> 返回地图

全局对象暴露（game.js 底部）：
├─ window.gameManager         : 游戏状态管理
├─ window.skilManager         : 技能系统
├─ window.tutorialManager     : 教程系统
├─ window.uiManager           : UI 管理
├─ window.effectsManager      : 视觉特效
├─ window.sceneManager        : 场景管理（在地图初始化时设置）
└─ window.GAME_STATE          : 游戏状态枚举
```

---

## 9. 性能指标与优化点

| 指标 | 目标 | 现状 | 优化方向 |
|---|---|---|---|
| 帧率 | 60 FPS | ✅ 稳定 60 FPS | - |
| 病毒数上限 | < 150 个 | ~100 个（关卡 5） | 粒子对象池 |
| Canvas 尺寸 | 内存可控 | 1920×1440（75vh） | 响应式自适应 |
| 加载时间 | < 2s | ~1.5s | 模块懒加载 |
| 持久化 | localStorage | ✅ 已实现 | 考虑 IndexedDB |

---

## 10. 代码指标速查

```javascript
// 核心常数
const SAFE_ZONE_SIZE = 120;         // 右下禁区 (game.js)
const FREEZE_COOLDOWN_MAX = 20;     // 冰冻 CD (game.js)
const VACCINE_SPEED = 15;           // 光波扩散速度 (game-manager.js)
const GAP = 40;                     // 教程气泡距离视管 (tutorial.js)

// 关卡统计
LEVELS.length = 5                   // 共 5 关
关卡 1：6 个病毒（教程）
关卡 2：25 个病毒 + Type B  
关卡 3：50 个病毒（压力最大）
关卡 4：75 个病毒 + 冰冻技能
关卡 5：100 个病毒 + 闪电技能（最终）
```

---

## 11. 常见的代码模式

### 模式 #1：检查游戏是否运行
```javascript
if (gameManager.gameState === GAME_STATE.PLAYING && gameManager.isGameActive) {
    // 执行游戏逻辑（更新、生成、渲染）
}
```

### 模式 #2：安全修改病毒数组
```javascript
// ❌ 错误（会破坏游戏循环的引用）
viruses = viruses.filter(v => ...);

// ✅ 正确（修改原数组）
for (let i = viruses.length - 1; i >= 0; i--) {
    if (condition) viruses.splice(i, 1);
}
```

### 模式 #3：派发自定义事件
```javascript
window.dispatchEvent(new CustomEvent('eventName', { detail: { ... } }));
```

### 模式 #4：异步回调链
```javascript
showIntroModal(type, () => {
    // 弹窗关闭回调
    gameManager.isGameActive = true;
    startGame();
});
```

---

**最后更新**：2026-02-12  
**周期维护**：每添加新大功能时更新第 3、5 部分
