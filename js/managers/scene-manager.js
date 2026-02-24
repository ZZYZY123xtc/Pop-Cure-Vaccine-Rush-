import { MapRenderer } from './map-renderer.js';
import { LEVELS } from '../data/levels.js';
import { audioManager } from './audio-manager.js';

/**
 * 🎮 场景管理器：协调地图场景与战斗场景的切换
 * 管理玩家进度、体力系统、状态持久化
 */
export class SceneManager {
    constructor() {
        try {
            console.log('[SceneManager] ConstructorStart');
            
            // 🔥 开发模式：所有关卡解锁，无需存档
            this.playerState = {
                maxLevel: 999,      // 所有关卡解锁
                stars: {},          // 各关卡星数
                energy: 999,        // 无限体力
                maxEnergy: 999,
                lastRecoveryTime: Date.now()
            };
            console.log('[开发模式] 所有关卡已解锁');

            // 获取 DOM 元素
            this.mapLayer = document.getElementById('map-layer');
            this.gameLayer = document.getElementById('game-layer');

            if (!this.mapLayer || !this.gameLayer) {
                const err = 'DOM NOT FOUND: mapLayer=' + !!this.mapLayer + ', gameLayer=' + !!this.gameLayer;
                console.error('[SceneManager ERROR]', err);
                throw new Error(err);
            }
            console.log('[SceneManager] DOM elements found');

            // ✅ 使用 LayerManager 统一管理层（不再直接操作 DOM）
            console.log('[SceneManager] 初始化时不操作层，由 index.html 的 layerManager.goToMap() 处理');

            // 实例化地图渲染器
            console.log('[SceneManager] Creating MapRenderer...');
            this.mapRenderer = new MapRenderer(
                'map-canvas',
                LEVELS,
                this.playerState,
                (levelId) => this.onNodeClick(levelId)
            );
            console.log('[SceneManager] MapRenderer created');

            // 🔥 立即触发一次 Canvas 尺寸更新
            // MapRenderer 创建时 width=0，需要从 ViewportManager 获取实际尺寸
            if (window.viewportManager) {
                const viewport = window.viewportManager.getViewport();
                this.mapRenderer.resize(viewport.width, viewport.height, viewport.dpr);
                console.log(`[SceneManager] MapRenderer 尺寸已初始化: ${viewport.width}x${viewport.height}`);
            }

            // 🌸 设置初始章节（开发模式固定为第一章）
            console.log('[开发模式] 固定显示第一章');
            this.mapRenderer.setChapter(1);
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
     * 地图节点被点击时的处理
     */
    onNodeClick(levelId) {
        // 🔥 开发模式：直接开始游戏，无需体力检查
        console.log(`[开始关卡] 关卡 ${levelId} - 开发模式`);
        this.enterLevel(levelId);
    }

    /**
     * 进入战斗场景
     * @param {number} levelId - 关卡ID
     */
    enterLevel(levelId) {
        // 🔥 开发模式：所有关卡均可进入，无需检查
        console.log('[开发模式] 进入关卡', levelId);

        // 🔥 开发模式：无需扣除体力
        console.log('[SceneManager] 开发模式 - 直接开始游戏');

        // ✅ 使用 LayerManager 切换层（会自动显示 UI 层）
        console.log('[SceneManager] 切换到游戏层');
        if (window.layerManager) {
            window.layerManager.goToGame();
            console.log('[SceneManager] ✅ 游戏层和 UI 层已显示');
        } else {
            console.error('[SceneManager] LayerManager 未初始化！');
        }

        // 触发游戏开始（通知 game.js 加载该关卡）
        // ✅ 修复：将关卡ID转换为数组索引（levelId - 1）
        const levelIndex = levelId - 1;
        console.log(`[SceneManager] 关卡ID ${levelId} -> 数组索引 ${levelIndex}`);
        const event = new CustomEvent('sceneManagerEnterLevel', { detail: { levelId: levelIndex } });
        window.dispatchEvent(event);
    }

    /**
     * 返回地图
     * 通常在关卡完成、失败或手动退出时调用
     */
    backToMap() {
        console.log('[SceneManager] 返回地图');

        // 🔊 切回地图背景音乐
        audioManager.playBGM('bgm_map', { fadeIn: 0.5, fadeOut: 0.5 });
        
        // 🔥 关键：暂停游戏状态，防止继续更新
        if (window.gameManager) {
            window.gameManager.endGame();
            console.log('[SceneManager] ✅ 游戏状态已暂停');
        }
        
        // 🔥 重置游戏循环标志，确保游戏层切换后不继续渲染
        window.gameLoopStarted = false;
        console.log('[SceneManager] ✅ 游戏循环标志已重置');
        
        // ✅ 使用 LayerManager 切换层（会自动隐藏 UI 层）
        console.log('[SceneManager] 切换到地图层');
        if (window.layerManager) {
            window.layerManager.goToMap();
            console.log('[SceneManager] ✅ 地图层已显示，UI 层已隐藏');
        } else {
            console.error('[SceneManager] LayerManager 未初始化！');
        }

        // 🔥 开发模式：无需保存状态
        console.log('[开发模式] 返回地图');

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

        // 🔥 开发模式：无需保存进度
        console.log(`[开发模式] 关卡 ${levelId} 完成，获得 ${starsEarned} 星`);

        // 🌸 检查是否需要切换章节
        this.updateMapChapter();

        // 返回地图
        this.backToMap();
    }

    /**
     * 🌸 根据当前最高关卡，自动更新地图章节
     * ⚠️ 仅在关卡完成后调用，防止新玩家自动跳转
     */
    updateMapChapter() {
        // 找到玩家当前最高关卡对应的章节
        const currentLevel = LEVELS.find(lvl => lvl.id === this.playerState.maxLevel);
        if (currentLevel && this.mapRenderer) {
            const targetChapter = currentLevel.chapter;
            
            // ⚠️ 保护逻辑：只有当前章节的所有关卡都解锁后，才允许跳转到下一章
            // 新玩家（maxLevel = 1）应该显示第一章
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
     * 🔥 开发模式：体力恢复（禁用）
     */
    recoverEnergy() {
        // 开发模式无需体力恢复
        console.log('[开发模式] 体力恢复已禁用');
    }

    /**
     * 🔥 开发模式：更新体力条显示（禁用）
     */
    updateEnergyDisplay() {
        // 开发模式无需显示体力
        console.log('[开发模式] 体力显示已禁用');
    }

    /**
     * 获取当前玩家状态（供外部查询）
     */
    getPlayerState() {
        return this.playerState;
    }

    /**
     * 🔥 开发模式：外部改变关卡进度（测试用）
     */
    setMaxLevel(levelId) {
        this.playerState.maxLevel = levelId;
        console.log('[Debug] 关卡进度设置为:', levelId);
    }

    /**
     * 🔥 开发模式：外部充满体力（已禁用）
     */
    fullEnergy() {
        console.log('[开发模式] 体力已无限，无需充满');
    }

    /**
     * 控制台诊断信息
     */
    debug() {
        console.log('[DEBUG] 玩家当前状态:', JSON.stringify(this.playerState, null, 2));
    }
}
