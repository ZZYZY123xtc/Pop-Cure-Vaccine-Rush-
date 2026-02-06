# 🧬 萌菌大作战 - 可爱版
**"Don't fight them. Cure them."** 一款基于 HTML5 Canvas 的 Roguelite 休闲策略网页游戏。
# 🧬 萌菌大作战 — 项目说明（已重构）

此仓库为 HTML5 Canvas 的休闲策略游戏源码。为提升可维护性，项目已重构为按职责分层的目录结构（见下）。本 README 保留为主说明文档，旧的 `README` 文件已删除。

## 🎮 游戏概览

### 核心机制
- **点击消杀**：鼠标点击屏幕上的圆形病毒进行消灭
- **进度条管理**：
  - 🟢 **治愈条（顶部）**：需要达到 100% 即可过关
  - 🔴 **感染条（底部）**：不能满格，否则任务失败
- **技能系统**：
  - ❄️ **冰冻**：关卡 3 解锁，关卡 4 教学，45 秒冷却
  - ⚡ **闪电连击**：关卡 4 解锁，关卡 5 教学，自动触发（连击满 6 次）

### 关卡配置表

| 关卡 | 描述 | 目标 | 难度 | 敌人类型 | 地图位置 | 生成频率 | 奖励 |
|------|------|------|------|---------|---------|---------|------|
| **Lv1** | 初次接触 | 6 | 1.0x | A | (0.5, 0.05) | 2.0s | — |
| **Lv2** | 变异出现 | 30 | 1.2x | A, B | (0.3, 0.15) | 1.6s | — |
| **Lv3** | 多元威胁 | 50 | 1.4x | A, B, C | (0.7, 0.25) | 1.2s | ❄️ 冰冻 |
| **Lv4** | 疯狂繁殖 | 70 | 1.6x | A, B, C | (0.4, 0.35) | 0.9s | ⚡ 闪电 |
| **Lv5** | 终极对抗 | 100 | 2.0x | A, B, C | (0.5, 0.45) | 0.6s | 🏆 胜利 |

## 🏗️ 代码架构

### 双场景系统（Phase 4 新增）

游戏现在采用 **地图 + 战斗** 的双场景架构：

```
启动
  ↓
开始屏幕 (uiManager.showStartScreen)
  ↓ [点击"开始实验"]
开场动画 (OpeningScene)
  ↓ [动画完成]
地图场景 (Canvas 绘制，SceneManager 管理)
  ├─ 粉色渐变背景
  ├─ 关卡节点（锁定/当前/通关三态）
  ├─ Bezier 曲线路径
  ├─ 漂浮粒子动画
  └─ 体力条 (30/30)
  ↓ [点击关卡节点]
扣除 5 点体力，进入战斗
  ↓
战斗场景 (Canvas + 三明治布局)
  ├─ Header (关卡显示 + 疫苗进度)
  ├─ GameCanvas (病毒绘制)
  ├─ Footer (感染条)
  └─ 技能区 (右下角)
  ↓ [战斗完成]
触发 'levelCompleted' 事件
  ↓
返回地图，显示星星，体力恢复
```

### 模块职责

#### 🎯 核心游戏逻辑
| 文件 | 行数 | 职责 |
|------|------|------|
| **game.js** | 578 | 游戏循环、病毒更新、点击处理、导出 startGame/init |
| **game-manager.js** | 200+ | 关卡加载、进度追踪、状态管理 |
| **virus.js** | 150+ | 病毒类、绘制、分裂逻辑 |

#### 🎨 UI 与视觉
| 文件 | 行数 | 职责 |
|------|------|------|
| **ui-manager.js** | 300+ | UI 更新、进度条、屏幕切换 |
| **modals-ui.js** | 200+ | 弹窗管理（图鉴、技能、完成） |
| **skill-demo.js** | 100+ | 技能演示动画（Canvas） |
| **effects.js** | 150+ | 粒子、爆炸、高亮效果 |

#### 📍 场景与地图（新）
| 文件 | 行数 | 职责 |
|------|------|------|
| **js/scene-manager.js** | 227 | **场景切换、体力系统、localStorage 持久化** |
| **js/map-renderer.js** | 247 | **Canvas 地图绘制、节点交互、美术渲染** |

#### 📚 数据与配置
| 文件 | 行数 | 职责 |
|------|------|------|
| **levels.js** | 80 | 所有关卡的 config + mapConfig 坐标 |
| **skills.js** | 200+ | 技能解锁、冷却、事件触发 |
| **config.js** | 50+ | 病毒类型、常量定义 |

#### 📖 教学与剧情
| 文件 | 行数 | 职责 |
|------|------|------|
| **tutorial.js** | 300+ | 4 步引导气泡系统、锚点定位 |
| **story.js** | 200+ | 剧情文案、教学说明、技能描述 |
| **opening.js** | 150+ | 开场扫描仪动画 |

#### 🎬 HTML 与样式
| 文件 | 行数 | 职责 |
|------|------|------|
| **index.html** | 352 | DOM 结构、双容器、module script |
| **style.css** | 10 | CSS aggregator |
| **css/base.css** | 85 | 全局动画、重置样式 |
| **css/layout.css** | 366 | Header/Footer 布局、地图屏幕 |
| **css/components.css** | 100 | 技能、进度条、组件 |
| **css/modals.css** | 554 | **所有弹窗样式** |
| **css/map.css** | 56 | **地图容器、体力条、粒子动画** |

---

## 🚀 快速开始

### 1️⃣ 导航地图
```javascript
// 游戏启动后，点击"开始实验"按钮
// 等待开场动画完成，地图会自动显示
// （需要先完成这一步，SceneManager 才会初始化）
```

### ⚙️ 测试 API
```javascript
// 在浏览器控制台中（务必先完成上述步骤）

// 查看玩家状态
window.sceneManager.getPlayerState();
// 返回: { maxLevel: 1, stars: {}, energy: 30, maxEnergy: 30 }

// 充满体力
window.sceneManager.fullEnergy();

// 解锁到第 5 关
window.sceneManager.setMaxLevel(5);

// 查看关卡数据
window.gameManager.getCurrentLevel();

// 查看技能状态
window.skillManager.getUnlockedSkills();
```

---

## 📊 游戏平衡数据

### 难度曲线
```
难度系数按关卡递增：
  Lv1: 1.0x (新手)
  Lv2: 1.2x (已逐步提升)
  Lv3: 1.4x (中等)
  Lv4: 1.6x (困难，冰冻教学)
  Lv5: 2.0x (地狱模式，闪电教学)
```

### 敌人生成
```
关卡    初始敌人   生成间隔  可用类型
Lv1    3 个      2.0 秒   A
Lv2    3 个      1.6 秒   A, B
Lv3    3 个      1.2 秒   A, B, C
Lv4    3 个      0.9 秒   A, B, C
Lv5    3 个      0.6 秒   A, B, C
```

### 体力系统
```
基础体力：        30 点
进入关卡消耗：    5 点
自动恢复速度：    每分钟 +1 点
最大体力值：      30 点

示例：
  初始 30 点 → 进关卡 5 分钟后 → 25 点
  空闲等待 30 分钟 → 回到 30 点满
```

---

## 🛠️ 开发优先级（下一步）

### Phase 5：星星评级系统
- [ ] 根据耗时/伤害计算星数 (1-3 星)
- [ ] 显示在地图节点上方
- [ ] localStorage 保存星数

### Phase 6：成就与排行
- [ ] 完成所有关卡奖励
- [ ] 连赢关卡计数
- [ ] 本地高分榜

### Phase 7：美术与音效
- [ ] 背景音乐循环播放
- [ ] 点击/胜利/失败音效
- [ ] 技能释放音效

### Phase 8：移动端适配
- [ ] 响应式布局调整
- [ ] 触摸事件支持
- [ ] 宽度 < 600px 适配

---

## 📋 关卡细化检查清单

### 难度测试
- [ ] Lv1 可以在 30 秒内完成（确认新手段）
- [ ] Lv3 引入第三种敌人（确认复杂度合理）
- [ ] Lv5 冻结 5 秒是否足以 "喘息"
- [ ] 感染条增速是否平衡（不应过快导致虐待）

### 技能测试
- [ ] 冰冻触发时，所有敌人完全停止
- [ ] 冰冻效果 5 秒后自动解除
- [ ] 闪电连击 6 次自动触发，是否合理
- [ ] 技能演示 Canvas 是否在所有浏览器清晰

### 教学测试
- [ ] Lv1 教程气泡是否正确指向教程病毒
- [ ] 技能介绍弹窗是否在恰当时机出现
- [ ] 关卡跳过教程，是否能手动回退

### 性能测试
- [ ] 10+ 敌人时帧率是否 > 30fps
- [ ] localStorage 切换关卡是否流畅
- [ ] 长时间游戏，内存是否稳定（检查内存泄漏）

---

## 🔧 本地测试

### 快速验证集成
```bash
# 检查所有文件完整性
node check-integration.js

# 预期输出：
# ✅ 29/29 检查通过
# ✅ 所有检查通过！集成完整。
```

### 浏览器测试步骤
1. 打开 `index.html` 在浏览器中
2. 打开 **开发者工具** → **控制台**
3. 查看是否有错误信息或警告
4. 点击"开始实验"按钮
5. 等待开场动画完成（约 3-5 秒）
6. 看到地图后，在控制台输入：
   ```javascript
   window.sceneManager.getPlayerState()
   ```
   应该返回玩家状态对象（不是 undefined）

---

## 🎯 关键知识点

### 双场景切换原理
- **地图层** (`#map-layer`)：正常显示，Canvas 绘制、交互
- **游戏层** (`#game-layer`)：默认 `display:none`，点击关卡时显示
- **切换函数**：`SceneManager.enterLevel()` / `backToMap()`

### 事件通信链路
```
MapRenderer.handleClick(levelId)
  → SceneManager.onNodeClick(levelId)
    → 扣体力，隐藏地图，显示游戏
      → 触发 'sceneManagerEnterLevel' 事件
        → game.js 监听，调用 startGame(levelId)
          → 游戏开始循环

游戏完成
  → triggerGameWin()
    → 派发 'levelCompleted' 事件
      → SceneManager 监听
        → onLevelComplete(levelId, stars)
          → 保存进度，backToMap()
```

### localStorage 数据格式
```javascript
{
  "gameState": {
    "maxLevel": 3,           // 最高解锁到第 3 关
    "stars": {"1": 3, "2": 2, "3": 1},  // 各关卡星数
    "energy": 20,            // 当前体力
    "maxEnergy": 30,         // 最大体力
    "lastRecoveryTime": 1707256800000  // 上次恢复时间戳
  }
}
```

---

## 📚 文件清单

```
containmen_virus/
├── README.md                ← 你在这里
├── index.html              ← 主 HTML（双容器）
├── game.js                 ← 游戏循环 + 导出 startGame/init
├── game-manager.js         ← 关卡/进度管理
├── config.js               ← 常量定义
├── ui-manager.js           ← UI 更新
├── modals-ui.js            ← 弹窗管理
├── skill-demo.js           ← 技能演示
├── skills.js               ← 技能逻辑
├── tutorial.js             ← 教程气泡
├── story.js                ← 剧情/描述
├── virus.js                ← 敌人类
├── effects.js              ← 粒子/特效
├── opening.js              ← 开场动画
├── levels.js               ← 关卡配置 + mapConfig ✨ 新
├── partical.js             ← 粒子类
├── style.css               ← CSS 聚合器
│
├── js/
│   ├── scene-manager.js    ← ✨ 场景切换 + 体力系统（新）
│   ├── map-renderer.js     ← ✨ 地图渲染（新）
│
├── css/
│   ├── base.css            ← 全局样式
│   ├── layout.css          ← 布局
│   ├── components.css      ← 组件
│   ├── modals.css          ← 弹窗
│   └── map.css             ← ✨ 地图样式（新）
│
├── check-integration.js    ← ✨ 集成检查脚本（新）
└── .git/                   ← Git 历史
```

---

## 🐛 已知问题与解决方案

### Issue #1：`window.sceneManager is undefined`
**原因**：SceneManager 只在点击"开始实验"后才初始化  
**解决**：
1. 点击"开始实验"按钮
2. 等待开场动画完成（3-5 秒）
3. 地图显示后再在控制台访问 `window.sceneManager`

### Issue #2：点击地图节点无反应
**可能原因**：
- [ ] 体力不足 (< 5)，使用 `window.sceneManager.fullEnergy()`
- [ ] 关卡未解锁，使用 `window.sceneManager.setMaxLevel(levelId)`
- [ ] Canvas 点击判定半径 40px，确保点击在节点圆形内

### Issue #3：游戏返回地图后，地图不更新
**解决**：地图是实时渲染的，`playerState` 改变时会自动重绘，无需手动刷新

---

## 💡 调试技巧

### 查看完整的玩家数据
```javascript
const state = window.sceneManager.getPlayerState();
console.table({
  '最高关卡': state.maxLevel,
  '体力': state.energy,
  '最大体力': state.maxEnergy,
  '星星': JSON.stringify(state.stars),
  '恢复时间': new Date(state.lastRecoveryTime).toLocaleString()
});
```

### 快速测试所有关卡
```javascript
// 解锁所有关卡
window.sceneManager.setMaxLevel(5);

// 查看每个关卡的 mapConfig
const { LEVELS } = window.gameManager;
LEVELS.forEach(l => {
  console.log(`Lv${l.id}:`, l.mapConfig);
});
```

### 监控事件触发
```javascript
window.addEventListener('levelCompleted', (e) => {
  console.log('[EVENT] 关卡完成:', e.detail);
});

window.addEventListener('levelFailed', (e) => {
  console.log('[EVENT] 关卡失败:', e.detail);
});

window.addEventListener('sceneManagerEnterLevel', (e) => {
  console.log('[EVENT] 进入关卡:', e.detail);
});
```

---

## 📞 支持与反馈

如有问题或建议，欢迎提出 Issue 或 PR！

**最后更新**：2026 年 2 月 6 日  
**架构版本**：Phase 4（双场景系统）

