/**
 * Stage 架构集成示例
 * 
 * 展示如何在现有游戏代码中使用新的 Stage 架构
 */

// ============================================================
// 示例 1: 游戏开始流程
// ============================================================

// 从开始屏幕到地图
document.getElementById('start-btn').addEventListener('click', () => {
    // 播放开场动画（可选）
    playOpeningAnimation();
    
    // 切换到地图层
    window.layerManager.goToMap();
    
    // 初始化场景管理器
    if (!window.sceneManager) {
        window.sceneManager = new SceneManager();
    }
});

// ============================================================
// 示例 2: 选择关卡进入游戏
// ============================================================

function startLevel(levelId) {
    // 1. 切换到游戏层（自动显示 UI）
    window.layerManager.goToGame();
    
    // 2. 初始化游戏
    startGame(levelId);
}

// ============================================================
// 示例 3: 游戏结束后显示弹窗
// ============================================================

function showGameOver() {
    // 激活模态框层
    window.layerManager.showModalLayer();
    
    // 显示失败弹窗
    const gameOverModal = document.getElementById('game-over');
    gameOverModal.classList.remove('hidden');
}

// 返回地图
document.getElementById('game-over-back-btn').addEventListener('click', () => {
    // 隐藏弹窗
    document.getElementById('game-over').classList.add('hidden');
    window.layerManager.hideModalLayer();
    
    // 返回地图
    window.layerManager.goToMap();
});

// ============================================================
// 示例 4: Canvas 渲染器集成
// ============================================================

class GameRenderer {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 注册到 ViewportManager
        window.viewportManager.registerCanvas('gameCanvas', 
            (width, height, dpr) => this.onResize(width, height, dpr)
        );
        
        // 初始化完成后立即渲染一次
        this.render();
    }
    
    onResize(width, height, dpr) {
        console.log(`[GameRenderer] Canvas 尺寸变化: ${width}x${height} (DPR: ${dpr})`);
        
        // ViewportManager 已自动设置 canvas.width/height 和 DPR 缩放
        // 只需重新绘制即可
        this.render();
    }
    
    render() {
        const { width, height } = window.viewportManager.getViewport();
        
        // 清空画布
        this.ctx.clearRect(0, 0, width, height);
        
        // 绘制游戏内容（坐标系已由 ViewportManager 处理好 DPR）
        this.drawBackground();
        this.drawEntities();
        this.drawEffects();
    }
    
    drawBackground() {
        const { width, height } = window.viewportManager.getViewport();
        
        // 绘制背景
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, width, height);
    }
    
    drawEntities() {
        // 绘制游戏实体（病毒、粒子等）
        // 坐标直接使用逻辑坐标，无需关心 DPR
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(100, 100, 50, 50);
    }
    
    drawEffects() {
        // 绘制特效
    }
}

// ============================================================
// 示例 5: 地图渲染器集成
// ============================================================

class MapRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // 注册到 ViewportManager
        window.viewportManager.registerCanvas(canvasId, 
            (width, height, dpr) => this.resize(width, height, dpr)
        );
    }
    
    resize(width, height, dpr) {
        console.log(`[MapRenderer] Canvas 尺寸变化: ${width}x${height} (DPR: ${dpr})`);
        this.render();
    }
    
    render() {
        const { width, height } = window.viewportManager.getViewport();
        
        // 清空
        this.ctx.clearRect(0, 0, width, height);
        
        // 绘制地图背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);
        
        // 绘制关卡节点
        this.drawLevelNodes();
    }
    
    drawLevelNodes() {
        // 绘制关卡节点（使用相对坐标）
        const { width, height } = window.viewportManager.getViewport();
        
        // 示例：在屏幕中央绘制一个节点
        const centerX = width / 2;
        const centerY = height / 2;
        
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
        this.ctx.fill();
    }
}

// ============================================================
// 示例 6: 处理设备旋转
// ============================================================

// ViewportManager 会自动处理，无需手动编写 resize 逻辑
// 但如果需要在旋转时执行额外操作：

window.addEventListener('orientationchange', () => {
    console.log('[App] 设备旋转，所有 Canvas 会自动调整');
    
    // 可以在这里执行额外的 UI 调整
    // 例如：调整按钮位置、显示/隐藏某些元素等
});

// ============================================================
// 示例 7: 监听层切换事件
// ============================================================

window.addEventListener('layerChanged', (e) => {
    const { layerName, type } = e.detail;
    console.log(`[App] 层已切换: ${layerName} (类型: ${type})`);
    
    // 根据层的切换执行相应操作
    switch (layerName) {
        case 'game':
            // 进入游戏时暂停背景音乐，播放战斗音乐
            console.log('[App] 切换到游戏，准备战斗音乐');
            break;
        case 'map':
            // 返回地图时恢复背景音乐
            console.log('[App] 切换到地图，恢复背景音乐');
            break;
    }
});

// ============================================================
// 示例 8: 响应式 UI 调整
// ============================================================

function updateUILayout() {
    const { width, height } = window.viewportManager.getViewport();
    const isPortrait = height > width;
    
    if (isPortrait) {
        // 竖屏布局
        console.log('[App] 竖屏模式');
        document.body.classList.add('portrait');
        document.body.classList.remove('landscape');
    } else {
        // 横屏布局
        console.log('[App] 横屏模式');
        document.body.classList.add('landscape');
        document.body.classList.remove('portrait');
    }
}

// 初始化时调用一次
updateUILayout();

// 监听视口变化
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateUILayout);
}

// ============================================================
// 示例 9: 性能优化 - 降低 DPR
// ============================================================

// 检测低端设备，降低渲染分辨率
function optimizeForLowEndDevices() {
    const isLowEndDevice = navigator.hardwareConcurrency <= 2;
    
    if (isLowEndDevice) {
        console.log('[App] 检测到低端设备，降低渲染分辨率');
        window.viewportManager.dpr = 1;  // 强制使用 1x DPR
        window.viewportManager.refresh();
    }
}

// ============================================================
// 示例 10: 完整游戏流程
// ============================================================

async function completeGameFlow() {
    // 1. 显示开始屏幕
    window.layerManager.goToStart();
    await waitForUserClick('start-btn');
    
    // 2. 播放开场故事
    window.layerManager.goToStory();
    await playStory();
    
    // 3. 显示地图
    window.layerManager.goToMap();
    const levelId = await waitForLevelSelection();
    
    // 4. 进入游戏
    window.layerManager.goToGame();
    const result = await playLevel(levelId);
    
    // 5. 显示结果
    window.layerManager.showModalLayer();
    if (result.success) {
        showLevelComplete();
    } else {
        showGameOver();
    }
    
    // 6. 返回地图
    await waitForModalClose();
    window.layerManager.hideModalLayer();
    window.layerManager.goToMap();
}

// 辅助函数
function waitForUserClick(buttonId) {
    return new Promise(resolve => {
        document.getElementById(buttonId).addEventListener('click', 
            () => resolve(), { once: true }
        );
    });
}

async function playStory() {
    // 播放故事动画
    return new Promise(resolve => {
        setTimeout(resolve, 3000);
    });
}

async function waitForLevelSelection() {
    // 等待用户选择关卡
    return new Promise(resolve => {
        window.addEventListener('sceneManagerEnterLevel', 
            (e) => resolve(e.detail.levelId), { once: true }
        );
    });
}

async function playLevel(levelId) {
    // 运行游戏逻辑
    return new Promise(resolve => {
        // 游戏结束时 resolve
        window.addEventListener('gameEnded', 
            (e) => resolve(e.detail), { once: true }
        );
    });
}

// ============================================================
// 导出给全局使用
// ============================================================

window.gameIntegration = {
    GameRenderer,
    MapRenderer,
    optimizeForLowEndDevices,
    updateUILayout,
    completeGameFlow
};
