/**
 * ViewportManager - 统一管理所有 Canvas 的尺寸、DPR 和坐标系
 * 
 * 功能：
 * - 使用 visualViewport API 精确获取可视区域
 * - 统一管理所有 canvas 的尺寸和 DPR
 * - 广播 resize 事件给所有注册的 canvas
 * - 处理设备旋转、软键盘弹出等场景
 */

// ✅ 用于通知游戏循环更新缓存
let markCanvasSizeNeedsUpdate = null;

export function setCanvasSizeUpdateCallback(callback) {
    markCanvasSizeNeedsUpdate = callback;
}

export class ViewportManager {
    constructor() {
        // 注册的 canvas 及其回调
        this.registeredCanvases = new Map();
        
        // 当前视口信息
        this.width = 0;
        this.height = 0;
        this.dpr = window.devicePixelRatio || 1;
        
        // 初始化视口尺寸
        this.updateViewportSize();
        
        // 监听 resize 和 visualViewport 变化
        this.setupListeners();
        
        console.log('[ViewportManager] 初始化完成', {
            width: this.width,
            height: this.height,
            dpr: this.dpr,
            hasVisualViewport: !!window.visualViewport
        });
    }
    
    /**
     * 设置事件监听器
     */
    setupListeners() {
        // 优先使用 visualViewport API
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                this.onResize();
            });
            
            window.visualViewport.addEventListener('scroll', () => {
                // 软键盘弹出时可能触发 scroll
                this.onResize();
            });
        }
        
        // 备用：传统 window resize（兼容旧浏览器）
        window.addEventListener('resize', () => {
            this.onResize();
        });
        
        // 监听设备方向变化
        window.addEventListener('orientationchange', () => {
            // orientationchange 后需要延迟一帧，等待浏览器完成布局
            requestAnimationFrame(() => {
                this.onResize();
            });
        });
    }
    
    /**
     * 更新视口尺寸
     */
    updateViewportSize() {
        // 优先使用 visualViewport
        if (window.visualViewport) {
            this.width = window.visualViewport.width;
            this.height = window.visualViewport.height;
        } else {
            // 备用：使用 window.innerWidth/Height
            this.width = window.innerWidth;
            this.height = window.innerHeight;
        }
        
        // 更新 DPR
        this.dpr = window.devicePixelRatio || 1;
    }
    
    /**
     * Resize 事件处理
     */
    onResize() {
        const oldWidth = this.width;
        const oldHeight = this.height;
        
        this.updateViewportSize();
        
        // 只有尺寸真正变化时才广播
        if (oldWidth !== this.width || oldHeight !== this.height) {
            console.log('[ViewportManager] 视口尺寸变化', {
                from: `${oldWidth}x${oldHeight}`,
                to: `${this.width}x${this.height}`,
                dpr: this.dpr
            });
            
            // 广播给所有注册的 canvas
            this.notifyAllCanvases();
        }
    }
    
    /**
     * 注册一个 canvas，接管其尺寸管理
     * 
     * @param {string} canvasId - canvas 的 ID
     * @param {Function} resizeCallback - 尺寸变化回调 (width, height, dpr) => void
     * @param {Object} options - 配置选项
     * @param {boolean} options.fillStage - 是否填满整个 stage（默认 true）
     * @param {number} options.aspectRatio - 固定宽高比（可选，如 16/9）
     * @param {number} options.heightFactor - 高度缩放因子（可选，如 0.75 表示使用75%的viewport高度）
     * @returns {boolean} 注册是否成功
     */
    registerCanvas(canvasId, resizeCallback, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`[ViewportManager] Canvas 不存在: ${canvasId}`);
            return false;
        }
        
        const config = {
            fillStage: options.fillStage !== false,  // 默认 true
            aspectRatio: options.aspectRatio || null,
            heightFactor: options.heightFactor || 1.0,  // 默认 1.0（100%）
            resizeCallback
        };
        
        this.registeredCanvases.set(canvasId, { canvas, config });
        
        // 立即调用一次 resize
        this.resizeCanvas(canvasId);
        
        console.log(`[ViewportManager] Canvas 已注册: ${canvasId}`, config);
        return true;
    }
    
    /**
     * 取消注册 canvas
     */
    unregisterCanvas(canvasId) {
        if (this.registeredCanvases.has(canvasId)) {
            this.registeredCanvases.delete(canvasId);
            console.log(`[ViewportManager] Canvas 已取消注册: ${canvasId}`);
        }
    }
    
    /**
     * 调整单个 canvas 尺寸
     */
    resizeCanvas(canvasId) {
        const entry = this.registeredCanvases.get(canvasId);
        if (!entry) return;
        
        const { canvas, config } = entry;
        
        let targetWidth = this.width;
        let targetHeight = this.height;
        
        // ✅ 应用高度缩放因子（用于游戏Canvas只占75vh）
        if (config.heightFactor && config.heightFactor !== 1.0) {
            targetHeight = this.height * config.heightFactor;
        }
        
        // 如果指定了固定宽高比
        if (config.aspectRatio) {
            const viewportRatio = this.width / targetHeight;
            if (viewportRatio > config.aspectRatio) {
                // 视口更宽，按高度适配
                targetWidth = targetHeight * config.aspectRatio;
            } else {
                // 视口更高，按宽度适配
                targetHeight = this.width / config.aspectRatio;
            }
        }
        
        // 设置 CSS 尺寸（显示尺寸）
        canvas.style.width = `${targetWidth}px`;
        canvas.style.height = `${targetHeight}px`;
        
        // 设置 Canvas 分辨率（物理像素）
        canvas.width = Math.floor(targetWidth * this.dpr);
        canvas.height = Math.floor(targetHeight * this.dpr);
        
        // 如果 canvas 有 context，需要重新设置缩放
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置变换
            ctx.scale(this.dpr, this.dpr);      // 应用 DPR 缩放
        }
        
        // ✅ 通知游戏循环更新缓存的canvas尺寸
        if (markCanvasSizeNeedsUpdate) {
            markCanvasSizeNeedsUpdate();
        }
        
        // 调用回调
        if (config.resizeCallback) {
            config.resizeCallback(targetWidth, targetHeight, this.dpr);
        }
    }
    
    /**
     * 通知所有已注册的 canvas 进行 resize
     */
    notifyAllCanvases() {
        for (const canvasId of this.registeredCanvases.keys()) {
            this.resizeCanvas(canvasId);
        }
    }
    
    /**
     * 获取当前视口信息
     */
    getViewport() {
        return {
            width: this.width,
            height: this.height,
            dpr: this.dpr
        };
    }
    
    /**
     * 手动触发一次全局 resize（用于初始化或强制刷新）
     */
    refresh() {
        this.updateViewportSize();
        this.notifyAllCanvases();
    }
}

// 导出单例
export const viewportManager = new ViewportManager();
