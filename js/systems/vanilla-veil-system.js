/**
 * 🍦 Level 21：香草视野系统 (Vanilla Veil System)
 * 视觉剥夺机制 - 浓稠奶油遮罩 + 圣光手电筒
 */

export class VanillaVeilSystem {
    constructor(canvasWidth, canvasHeight, config = {}) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        
        // 配置
        this.overlayColor = config.overlayColor || 'rgba(255, 255, 240, 0.95)';
        this.spotlightRadius = config.spotlightRadius || 100;
        this.spotlightColor = config.spotlightColor || 'rgba(255, 255, 255, 0.1)';
        this.fadeEdge = config.fadeEdge || 30;
        
        // 鼠标位置（手电筒位置）
        this.mouseX = canvasWidth / 2;
        this.mouseY = canvasHeight / 2;
        
        // 离屏Canvas用于遮罩处理
        this.maskCanvas = document.createElement('canvas');
        this.maskCanvas.width = canvasWidth;
        this.maskCanvas.height = canvasHeight;
        this.maskCtx = this.maskCanvas.getContext('2d');
        
        console.log('[VanillaVeil] 🍦 香草视野系统已初始化');
    }
    
    /**
     * 更新鼠标位置
     */
    updateMousePosition(x, y) {
        this.mouseX = x;
        this.mouseY = y;
    }
    
    /**
     * 调整尺寸
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.maskCanvas.width = width;
        this.maskCanvas.height = height;
    }
    
    /**
     * 绘制香草视野（在所有游戏内容之上）
     */
    draw(ctx) {
        const maskCtx = this.maskCtx;
        
        // 清空离屏Canvas
        maskCtx.clearRect(0, 0, this.width, this.height);
        
        // 1️⃣ 绘制浓稠奶油遮罩（完全覆盖）
        maskCtx.fillStyle = this.overlayColor;
        maskCtx.fillRect(0, 0, this.width, this.height);
        
        // 2️⃣ 使用 destination-out 模式挖出手电筒圆形
        maskCtx.globalCompositeOperation = 'destination-out';
        
        // 绘制径向渐变实现边缘羽化
        const gradient = maskCtx.createRadialGradient(
            this.mouseX, this.mouseY, this.spotlightRadius - this.fadeEdge,
            this.mouseX, this.mouseY, this.spotlightRadius
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');   // 中心完全透明
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');   // 边缘不透明
        
        maskCtx.fillStyle = gradient;
        maskCtx.beginPath();
        maskCtx.arc(this.mouseX, this.mouseY, this.spotlightRadius, 0, Math.PI * 2);
        maskCtx.fill();
        
        // 3️⃣ 恢复混合模式
        maskCtx.globalCompositeOperation = 'source-over';
        
        // 4️⃣ 将遮罩绘制到主Canvas
        ctx.drawImage(this.maskCanvas, 0, 0);
        
        // 5️⃣ 绘制手电筒外圈柔光提示
        ctx.save();
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.mouseX, this.mouseY, this.spotlightRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    
    /**
     * 清理资源
     */
    destroy() {
        this.maskCanvas = null;
        this.maskCtx = null;
        console.log('[VanillaVeil] 🍦 香草视野系统已清理');
    }
}
