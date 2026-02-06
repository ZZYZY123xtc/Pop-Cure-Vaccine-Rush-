import { MapRenderer } from './map-renderer.js';
import { LEVELS } from '../data/levels.js';

/**
 * 🎮 场景管理器：协调地图场景与战斗场景的切换
 * 管理玩家进度、体力系统、状态持久化
 */
export class SceneManager {
    constructor() {
        try {
            console.log('[SceneManager] ConstructorStart');
            
            // 从 localStorage 读取玩家状态，如果没有则初始化
            this.playerState = this.loadState() || {
                maxLevel: 1,        // 最高解锁关卡
                stars: {},          // 各关卡星数 {1: 2, 2: 3, ...}
                energy: 30,         // 当前体力值
                maxEnergy: 30,      // 最大体力值
                lastRecoveryTime: Date.now()
            };
            
            // 🔥 开发模式：每次刷新页面时重置体力到满
            this.playerState.energy = this.playerState.maxEnergy;
            this.playerState.lastRecoveryTime = Date.now();
            console.log('[SceneManager] PlayerState loaded');

            // 获取 DOM 元素
            this.mapLayer = document.getElementById('map-layer');
            this.gameLayer = document.getElementById('game-layer');

            if (!this.mapLayer || !this.gameLayer) {
                const err = 'DOM NOT FOUND: mapLayer=' + !!this.mapLayer + ', gameLayer=' + !!this.gameLayer;
                console.error('[SceneManager ERROR]', err);
                throw new Error(err);
            }
            console.log('[SceneManager] DOM elements found');

            // 显示地图层（使用 .active 类）
            console.log('[SceneManager] 显示地图层，隐藏游戏层');
            this.mapLayer.classList.add('active');
            this.gameLayer.style.display = 'none';
            console.log('[SceneManager] 地图层已显示 (.active 类激活)>');

            // 实例化地图渲染器
            console.log('[SceneManager] Creating MapRenderer...');
            this.mapRenderer = new MapRenderer(
                'map-canvas',
                LEVELS,
                this.playerState,
                (levelId) => this.onNodeClick(levelId)
            );
            console.log('[SceneManager] MapRenderer created');

            // 🌸 设置初始章节（根据当前最高关卡）
            this.updateMapChapter();
            console.log('[SceneManager] Initial chapter set');

            // 更新体力条显示
            this.updateEnergyDisplay();
            console.log('[SceneManager] Energy display updated');

            // 绑定全局事件（比如关卡完成时的回调）- 延迟绑定以避免初始化时序问题
            Promise.resolve().then(() => this.setupGameCallbacks());
            console.log('[SceneManager] Game callbacks scheduled');

            console.log('[SceneManager] Constructor completed successfully');
        } catch (err) {
            console.error('[SceneManager FATAL ERROR]', err);
            console.error('Stack:', err.stack);
            throw err;  // 重新抛出以便 index.html 中的 catch 能捕获
        }
    }

    /**
     * 从 localStorage 加载玩家状态
     */
    loadState() {
        const saved = localStorage.getItem('gameState');
        return saved ? JSON.parse(saved) : null;
    }

    /**
     * 保存玩家状态到 localStorage
     */
    saveState() {
        localStorage.setItem('gameState', JSON.stringify(this.playerState));
    }

    /**
     * 地图节点被点击时的处理
     */
    onNodeClick(levelId) {
        // 检查是否有足够体力
        if (this.playerState.energy < 5) {
            alert('⚠️ 体力不足！需要 5 点体力，当前仅有 ' + this.playerState.energy);
            return;
        }

        // 进入该关卡
        this.enterLevel(levelId);
    }

    /**
     * 进入战斗场景
     * @param {number} levelId - 关卡ID
     */
    enterLevel(levelId) {
        // 检查关卡是否解锁
        if (levelId > this.playerState.maxLevel) {
            alert('🔒 该关卡未解锁，请先完成前面的关卡！');
            return;
        }

        console.log('[SceneManager] 进入关卡', levelId);

        // 扣除体力
        this.playerState.energy -= 5;
        this.saveState();
        this.updateEnergyDisplay();
        console.log('[SceneManager] 扣除体力，剩余:', this.playerState.energy);

        // 隐藏地图层，显示游戏层
        console.log('[SceneManager] 隐藏地图层，显示游戏层');
        this.mapLayer.classList.remove('active');
        this.gameLayer.style.display = 'block';
        this.gameLayer.style.zIndex = '500';
        console.log('[SceneManager] 游戏层已显示 (z-index: 500)');

        // 触发游戏开始（通知 game.js 加载该关卡）
        // 使用 window.SCENE_MANAGER_CALLBACK 或 dispatchEvent 来通知
        const event = new CustomEvent('sceneManagerEnterLevel', { detail: { levelId } });
        window.dispatchEvent(event);
    }

    /**
     * 返回地图
     * 通常在关卡完成、失败或手动退出时调用
     */
    backToMap() {
        console.log('[SceneManager] 返回地图');
        // 隐藏游戏层，显示地图层（使用 .active 类）
        this.gameLayer.style.display = 'none';
        this.mapLayer.classList.add('active');
        console.log('[SceneManager] 地图层已显示 (.active 类激活)');

        // 保存状态
        this.saveState();

        // 重新绘制地图（刷新节点状态）
        // mapRenderer 的 loop 会自动更新，因为 playerState 被改变了
    }

    /**
     * 关卡完成时的回调
     * @param {number} levelId - 完成的关卡ID
     * @param {number} starsEarned - 获得的星数 (0-3)
     */
    onLevelComplete(levelId, starsEarned = 1) {
        // 更新星数
        if (!this.playerState.stars[levelId] || this.playerState.stars[levelId] < starsEarned) {
            this.playerState.stars[levelId] = starsEarned;
        }

        // 解锁下一关
        if (levelId >= this.playerState.maxLevel) {
            this.playerState.maxLevel = levelId + 1;
        }

        // 保存状态
        this.saveState();

        // 🌸 检查是否需要切换章节
        this.updateMapChapter();

        // 返回地图
        this.backToMap();
    }

    /**
     * 🌸 根据当前最高关卡，自动更新地图章节
     */
    updateMapChapter() {
        // 找到玩家当前最高关卡对应的章节
        const currentLevel = LEVELS.find(lvl => lvl.id === this.playerState.maxLevel);
        if (currentLevel && this.mapRenderer) {
            const targetChapter = currentLevel.chapter;
            if (this.mapRenderer.currentChapter !== targetChapter) {
                console.log(`[章节切换] 从第${this.mapRenderer.currentChapter}章切换到第${targetChapter}章`);
                this.mapRenderer.setChapter(targetChapter);
            }
        }
    }

    /**
     * 关卡失败时的回调
     * 体力已扣，不再退款
     */
    onLevelFail(levelId) {
        console.log(`[关卡失败] 关卡 ${levelId} 失败，等待用户操作...`);
        // 不立即跳转，等待用户在失败弹窗中点击按钮
        // 失败弹窗的按钮会触发 'backToMapRequested' 事件
    }

    /**
     * 设置游戏回调
     * 监听 game.js 的完成/失败事件
     */
    setupGameCallbacks() {
        try {
            // 监听自定义事件：关卡完成
            window.addEventListener('levelCompleted', (e) => {
                const { levelId, stars } = e.detail;
                this.onLevelComplete(levelId, stars);
            });

            // 监听自定义事件：关卡失败
            window.addEventListener('levelFailed', (e) => {
                const { levelId } = e.detail;
                this.onLevelFail(levelId);
            });

            // 监听自定义事件：手动返回（如果有"返回地图"按钮）
            window.addEventListener('backToMapRequested', () => {
                this.backToMap();
            });
            
            console.log('[SceneManager] 游戏事件回调设置完成');
        } catch (err) {
            console.error('[SceneManager ERROR] setupGameCallbacks 失败:', err);
        }
    }

    /**
     * 体力恢复（简单版本）
     * 每分钟恢复1点体力，最多30点
     */
    recoverEnergy() {
        const now = Date.now();
        const elapsed = now - this.playerState.lastRecoveryTime; // 毫秒
        const minutesPassed = elapsed / 60000; // 转换为分钟
        const pointsToRecover = Math.floor(minutesPassed);

        if (pointsToRecover > 0) {
            this.playerState.energy = Math.min(
                this.playerState.maxEnergy,
                this.playerState.energy + pointsToRecover
            );
            this.playerState.lastRecoveryTime = now;
            this.saveState();
            this.updateEnergyDisplay();
        }
    }

    /**
     * 更新体力条显示
     */
    updateEnergyDisplay() {
        try {
            const energyText = document.getElementById('energy-text');
            if (energyText) {
                energyText.textContent = `${this.playerState.energy}/${this.playerState.maxEnergy}`;
                console.log('[Energy] 体力更新:', this.playerState.energy);
            } else {
                console.warn('[Energy] energy-text 元素找不到');
            }

            // 注意: 移除了不安全的 setInterval。体力恢复收会在下一个 Phase 幞现
            // 当前仅保持 localStorage 永久性
        } catch (err) {
            console.error('[Energy ERROR]', err);
        }
    }

    /**
     * 获取当前玩家状态（供外部查询）
     */
    getPlayerState() {
        return this.playerState;
    }

    /**
     * 外部改变关卡进度（测试用）
     */
    setMaxLevel(levelId) {
        this.playerState.maxLevel = levelId;
        this.saveState();
        console.log('[Debug] 关卡进度设置为:', levelId);
    }

    /**
     * 外部充满体力（测试用）
     */
    fullEnergy() {
        this.playerState.energy = this.playerState.maxEnergy;
        this.saveState();
        this.updateEnergyDisplay();
        console.log('[Debug] 体力充满:', this.playerState.energy);
    }

    /**
     * 控制台诊断信息
     */
    debug() {
        console.log('[DEBUG] 玩家当前状态:', JSON.stringify(this.playerState, null, 2));
    }
}
