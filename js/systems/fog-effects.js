/**
 * ==========================================
 * 🌫️ 香芋迷雾特效系统 (FogEffectSystem)
 * ==========================================
 * 风格：像奶盖一样的边缘模糊迷雾
 * 作用：Level 12 周期性遮挡视野，制造心理战
 * 核心机制：
 * - 中心透明，边缘浓郁香芋色径向渐变
 * - 病毒在雾中只显示发光眼睛
 * - 呼吸节奏：淡入 2s → 持续 2s → 淡出 2s
 */
export class FogEffectSystem {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        
        // 迷雾状态
        this.fogOpacity = 0; // 当前迷雾不透明度（0-1）
        this.isActive = false; // 迷雾是否激活
        this.phase = 'clear'; // 迷雾阶段：'clear'（清晰）、'fade-in'（淡入）、'peak'（峰值）、'fade-out'（淡出）
        
        // 时间控制
        this.timer = 0; // 当前阶段计时器（毫秒）
        this.config = {
            fadeInDuration: 2000,    // 淡入时间（2秒）
            peakDuration: 2000,      // 峰值持续时间（2秒）
            fadeOutDuration: 2000,   // 淡出时间（2秒）
            clearDuration: 3000,     // 清晰期（3秒）
            maxOpacity: 0.85,        // 最大不透明度
            fogColor: '#BCA9E8'      // 香芋紫主色调
        };

        // 兜底：迷雾视觉层永远不能拦截点击
        this.ensureOverlayPassthrough();
        
        console.log('[Fog] 🌫️ 香芋迷雾系统已初始化，周期:', this.getTotalCycle(), 'ms');
    }

    /**
     * 激活迷雾系统
     */
    activate() {
        this.isActive = true;
        this.phase = 'clear';
        this.timer = 0;
        this.fogOpacity = 0;
        this.ensureOverlayPassthrough();
        console.log('[Fog] 🌫️ 迷雾系统已激活');
    }

    /**
     * 停用迷雾系统
     */
    deactivate() {
        this.isActive = false;
        this.phase = 'clear';
        this.timer = 0;
        this.fogOpacity = 0;
    }

    /**
     * 获取完整周期时长
     */
    getTotalCycle() {
        return this.config.clearDuration + 
               this.config.fadeInDuration + 
               this.config.peakDuration + 
               this.config.fadeOutDuration;
    }

    /**
     * 更新迷雾状态
     * @param {number} dt - 时间步长（毫秒）
     */
    update(dt) {
        if (!this.isActive) return;

        this.timer += dt;

        // 根据当前阶段更新不透明度
        switch (this.phase) {
            case 'clear':
                this.fogOpacity = 0;
                if (this.timer >= this.config.clearDuration) {
                    this.phase = 'fade-in';
                    this.timer = 0;
                    console.log('[Fog] 🌬️ 开始呼气，迷雾淡入...');
                }
                break;

            case 'fade-in':
                // 线性淡入
                const fadeInProgress = this.timer / this.config.fadeInDuration;
                // 🔥 强化迷雾：最大不透明度提升到0.95
                this.fogOpacity = Math.min(fadeInProgress * 0.95, 0.95);
                if (this.timer >= this.config.fadeInDuration) {
                    this.phase = 'peak';
                    this.timer = 0;
                    this.fogOpacity = 0.95; // 峰值透明度0.95
                    console.log('[Fog] 🌫️ 迷雾达到峰值');
                }
                break;

            case 'peak':
                this.fogOpacity = 0.95; // 峰值透明度0.95
                if (this.timer >= this.config.peakDuration) {
                    this.phase = 'fade-out';
                    this.timer = 0;
                    console.log('[Fog] 💨 迷雾开始消散...');
                }
                break;

            case 'fade-out':
                // 线性淡出
                const fadeOutProgress = this.timer / this.config.fadeOutDuration;
                this.fogOpacity = Math.max((1 - fadeOutProgress) * 0.95, 0);
                if (this.timer >= this.config.fadeOutDuration) {
                    this.phase = 'clear';
                    this.timer = 0;
                    this.fogOpacity = 0;
                    console.log('[Fog] ✨ 迷雾完全消散');
                }
                break;
        }
    }

    /**
     * 检测病毒是否在迷雾中（边缘区域）
     * @param {number} x - 病毒 x 坐标
     * @param {number} y - 病毒 y 坐标
     * @returns {boolean} 是否在迷雾中
     */
    isInFog(x, y) {
        if (this.fogOpacity < 0.3) return false; // 迷雾太淡时不算

        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        
        // 距离中心超过屏幕宽度的 35% 就算在迷雾区
        const fogThreshold = this.width * 0.35;
        return distance > fogThreshold;
    }

    /**
     * 绘制香芋迷雾覆盖层
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        if (!this.isActive || this.fogOpacity <= 0) return;

        ctx.save();
        
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        // 创建径向渐变：中心透明，边缘浓郁香芋色
        const gradient = ctx.createRadialGradient(
            centerX, centerY, this.width * 0.2,  // 内圆：屏幕中心往外 20%
            centerX, centerY, this.width * 0.8   // 外圆：屏幕中心往外 80%
        );
        
        gradient.addColorStop(0, 'rgba(188, 169, 232, 0)');     // 中心完全透明
        gradient.addColorStop(0.6, `rgba(188, 169, 232, ${0.3 * this.fogOpacity})`);   // 过渡区
        gradient.addColorStop(1, `rgba(170, 150, 220, ${0.95 * this.fogOpacity})`);    // 边缘浓郁奶盖感
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
        
        ctx.restore();
    }

    /**
     * 🌫️ 绘制病毒在雾中的发光眼睛
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} x - 病毒 x 坐标
     * @param {number} y - 病毒 y 坐标
     * @param {number} radius - 病毒半径
     */
    drawGlowingEyes(ctx, x, y, radius) {
        ctx.save();
        ctx.translate(x, y);
        
        // 强烈的白色/淡紫色发光
        ctx.shadowColor = '#E6E6FA'; // 梦幻薰衣草光晕
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#FFFFFF';   // 纯白眼珠
        
        const eyeRadius = radius * 0.25;
        const eyeOffset = radius * 0.3;
        
        // 左眼
        ctx.beginPath();
        ctx.arc(-eyeOffset, -eyeOffset * 0.2, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // 右眼
        ctx.beginPath();
        ctx.arc(eyeOffset, -eyeOffset * 0.2, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    /**
     * 窗口大小改变时调用
     */
    resize(newWidth, newHeight) {
        this.width = newWidth;
        this.height = newHeight;
        this.ensureOverlayPassthrough();
        console.log('[Fog] 🌫️ 迷雾系统尺寸已更新:', newWidth.toFixed(0), 'x', newHeight.toFixed(0));
    }

    ensureOverlayPassthrough() {
        if (typeof document === 'undefined') return;

        const selectors = [
            '#fog-layer',
            '#fog-canvas',
            '.fog-layer',
            '.fog-overlay',
            '[data-fog-overlay]'
        ];

        for (const selector of selectors) {
            const nodes = document.querySelectorAll(selector);
            nodes.forEach((node) => {
                node.style.pointerEvents = 'none';
            });
        }
    }
}
