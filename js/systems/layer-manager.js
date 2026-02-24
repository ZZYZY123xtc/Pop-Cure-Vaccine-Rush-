/**
 * LayerManager - Stage 层管理器
 * 
 * 功能：
 * - 统一管理所有 stage 层的显示/隐藏
 * - 提供层切换的便捷方法
 * - 处理层之间的过渡动画
 */

export class LayerManager {
    constructor() {
        // 所有可用的层
        this.layers = {
            start: document.getElementById('start-layer'),
            map: document.getElementById('map-layer'),
            story: document.getElementById('story-layer'),
            game: document.getElementById('game-layer'),
            ui: document.getElementById('ui-layer'),
            modal: document.getElementById('modal-layer')
        };
        
        // 当前活跃的主层（start/map/story/game）
        this.currentMainLayer = 'start';
        
        // UI 层和 Modal 层是叠加层，可以独立控制
        this.isUILayerVisible = false;
        this.isModalLayerVisible = false;
        
        console.log('[LayerManager] 初始化完成', {
            layers: Object.keys(this.layers),
            currentMainLayer: this.currentMainLayer
        });
    }
    
    /**
     * 显示指定的主层（自动隐藏其他主层）
     * 
     * @param {string} layerName - 层名称 (start/map/story/game)
     * @param {boolean} immediate - 是否立即切换（不使用动画）
     */
    showMainLayer(layerName, immediate = false) {
        const validMainLayers = ['start', 'map', 'story', 'game'];
        
        if (!validMainLayers.includes(layerName)) {
            console.error(`[LayerManager] 无效的主层名称: ${layerName}`);
            return false;
        }
        
        const targetLayer = this.layers[layerName];
        if (!targetLayer) {
            console.error(`[LayerManager] 层元素不存在: ${layerName}`);
            return false;
        }
        
        // 隐藏所有主层
        validMainLayers.forEach(name => {
            if (name !== layerName && this.layers[name]) {
                this.layers[name].classList.add('hidden');
            }
        });
        
        // 显示目标层
        targetLayer.classList.remove('hidden');
        this.currentMainLayer = layerName;
        
        console.log(`[LayerManager] 已切换到主层: ${layerName}`);
        
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('layerChanged', {
            detail: { layerName, type: 'main' }
        }));
        
        return true;
    }
    
    /**
     * 显示 UI 层（叠加在主层之上）
     */
    showUILayer() {
        if (this.layers.ui) {
            this.layers.ui.classList.remove('hidden');
            this.isUILayerVisible = true;
            console.log('[LayerManager] UI 层已显示');
        }
    }
    
    /**
     * 隐藏 UI 层
     */
    hideUILayer() {
        if (this.layers.ui) {
            this.layers.ui.classList.add('hidden');
            this.isUILayerVisible = false;
            console.log('[LayerManager] UI 层已隐藏');
        }
    }
    
    /**
     * 切换 UI 层的显示状态
     */
    toggleUILayer() {
        if (this.isUILayerVisible) {
            this.hideUILayer();
        } else {
            this.showUILayer();
        }
    }
    
    /**
     * 显示 Modal 层（用于弹窗）
     */
    showModalLayer() {
        if (this.layers.modal) {
            this.layers.modal.classList.add('active');
            this.isModalLayerVisible = true;
            console.log('[LayerManager] Modal 层已激活');
        }
    }
    
    /**
     * 隐藏 Modal 层
     */
    hideModalLayer() {
        if (this.layers.modal) {
            this.layers.modal.classList.remove('active');
            this.isModalLayerVisible = false;
            console.log('[LayerManager] Modal 层已隐藏');
        }
    }
    
    /**
     * 获取当前状态
     */
    getState() {
        return {
            currentMainLayer: this.currentMainLayer,
            isUILayerVisible: this.isUILayerVisible,
            isModalLayerVisible: this.isModalLayerVisible
        };
    }
    
    /**
     * 场景切换快捷方法
     */
    
    // 切换到开始屏幕
    goToStart() {
        this.showMainLayer('start');
        this.hideUILayer();
    }
    
    // 切换到地图
    goToMap() {
        this.showMainLayer('map');
        this.hideUILayer();
    }
    
    // 切换到故事场景
    goToStory() {
        this.showMainLayer('story');
        this.hideUILayer();
    }
    
    // 切换到游戏
    goToGame() {
        this.showMainLayer('game');
        this.showUILayer();  // 游戏时显示 UI
    }
}

// 导出单例
export const layerManager = new LayerManager();
