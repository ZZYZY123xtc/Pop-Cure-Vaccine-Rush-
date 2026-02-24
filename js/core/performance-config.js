/**
 * 性能优化配置
 * 在不改变游戏逻辑的前提下优化性能
 */

export const PERFORMANCE_CONFIG = {
    // ========== 日志控制 ==========
    // 设为 false 可大幅减少控制台输出，提升性能
    ENABLE_CONSOLE_LOG: false,  // 生产模式：关闭日志
    ENABLE_DEBUG_LOG: false,    // 调试日志（更详细）
    
    // ========== 粒子系统优化 ==========
    MAX_PARTICLES: 150,         // 粒子数量上限（原无限制）
    PARTICLE_POOL_SIZE: 200,    // 粒子对象池大小（复用对象）
    
    // ========== 渲染优化 ==========
    ENABLE_OFFSCREEN_CANVAS: true,  // 使用离屏Canvas缓存静态内容
    REDUCE_PARTICLE_QUALITY: false, // 降低粒子渲染质量（移动端可开启）
    
    // ========== UI更新优化 ==========
    UI_UPDATE_THROTTLE: 100,    // UI更新节流（毫秒）
    PROGRESS_BAR_UPDATE_THROTTLE: 50, // 进度条更新节流
    
    // ========== 性能监控 ==========
    ENABLE_FPS_COUNTER: true,   // 显示FPS计数器
    FPS_UPDATE_INTERVAL: 1000,  // FPS更新间隔（毫秒）
};

/**
 * 高性能日志包装器
 * 根据配置决定是否输出
 */
export const perfLog = {
    log: (...args) => {
        if (PERFORMANCE_CONFIG.ENABLE_CONSOLE_LOG) {
            console.log(...args);
        }
    },
    debug: (...args) => {
        if (PERFORMANCE_CONFIG.ENABLE_DEBUG_LOG) {
            console.log(...args);
        }
    },
    warn: (...args) => {
        // 警告总是显示
        console.warn(...args);
    },
    error: (...args) => {
        // 错误总是显示
        console.error(...args);
    }
};

/**
 * FPS计数器
 */
export class FPSCounter {
    constructor() {
        this.fps = 60;
        this.frames = 0;
        this.lastTime = performance.now();
        this.element = null;
        
        if (PERFORMANCE_CONFIG.ENABLE_FPS_COUNTER) {
            this.createDisplay();
        }
    }
    
    createDisplay() {
        this.element = document.createElement('div');
        this.element.id = 'fps-counter';
        this.element.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: #0f0;
            padding: 5px 10px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            z-index: 9999;
            pointer-events: none;
        `;
        document.body.appendChild(this.element);
    }
    
    update() {
        if (!PERFORMANCE_CONFIG.ENABLE_FPS_COUNTER) return;
        
        this.frames++;
        const now = performance.now();
        const delta = now - this.lastTime;
        
        if (delta >= PERFORMANCE_CONFIG.FPS_UPDATE_INTERVAL) {
            this.fps = Math.round((this.frames * 1000) / delta);
            if (this.element) {
                const color = this.fps >= 55 ? '#0f0' : this.fps >= 30 ? '#ff0' : '#f00';
                this.element.style.color = color;
                this.element.textContent = `FPS: ${this.fps}`;
            }
            this.frames = 0;
            this.lastTime = now;
        }
    }
    
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

/**
 * 节流函数
 */
export function throttle(func, delay) {
    let lastCall = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            return func.apply(this, args);
        }
    };
}
