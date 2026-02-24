/**
 * 🍑 Level 18：白细胞巡警
 * Q软棉花糖形状的友军，误击会招来惩罚
 */

export class WhiteBloodCell {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.config = config || {};
        
        this.radius = this.config.radius || 35;
        this.moveSpeed = this.config.moveSpeed || 0.8;
        this.normalColor = this.config.color || 'rgba(255, 255, 255, 0.9)';
        this.glowColor = this.config.glowColor || '#B0E0E6';
        this.hitColor = this.config.hitColor || 'rgba(255, 182, 193, 0.9)';
        
        // 运动方向（1=向右，-1=向左）
        this.direction = Math.random() > 0.5 ? 1 : -1;
        
        // 受击状态
        this.isHit = false;
        this.hitTimer = 0;
        this.hitDuration = 800; // 受击状态持续800ms
        this.scaleMultiplier = 1.0;
        
        // 呼吸动效偏移
        this.breathOffset = Math.random() * Math.PI * 2;
    }
    
    /**
     * 更新白细胞状态
     * @param {number} dt - 时间增量（毫秒）
     * @param {number} canvasWidth - 画布宽度
     * @param {number} canvasHeight - 画布高度
     */
    update(dt, canvasWidth, canvasHeight) {
        // 横向移动
        this.x += this.direction * this.moveSpeed;
        
        // 边界反弹
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.direction = 1;
        } else if (this.x + this.radius > canvasWidth) {
            this.x = canvasWidth - this.radius;
            this.direction = -1;
        }
        
        // 受击状态倒计时
        if (this.isHit) {
            this.hitTimer -= dt;
            if (this.hitTimer <= 0) {
                this.isHit = false;
                this.scaleMultiplier = 1.0;
            } else {
                // Q弹回弹动画
                const progress = 1 - (this.hitTimer / this.hitDuration);
                this.scaleMultiplier = 1.2 - 0.2 * progress;
            }
        }
    }
    
    /**
     * 绘制白细胞
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     */
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 呼吸动效
        const breathScale = 1 + Math.sin(Date.now() / 800 + this.breathOffset) * 0.05;
        ctx.scale(breathScale * this.scaleMultiplier, breathScale * this.scaleMultiplier);
        
        // 当前颜色
        const currentColor = this.isHit ? this.hitColor : this.normalColor;
        
        // 发光效果
        ctx.shadowColor = this.isHit ? '#FFB6C1' : this.glowColor;
        ctx.shadowBlur = 15;
        
        // 绘制Q软云朵（5个重叠圆）
        const cloudPositions = [
            { x: 0, y: 0, r: this.radius },           // 中心
            { x: -this.radius * 0.4, y: -this.radius * 0.3, r: this.radius * 0.7 }, // 左上
            { x: this.radius * 0.4, y: -this.radius * 0.3, r: this.radius * 0.7 },  // 右上
            { x: -this.radius * 0.5, y: this.radius * 0.2, r: this.radius * 0.6 },  // 左下
            { x: this.radius * 0.5, y: this.radius * 0.2, r: this.radius * 0.6 }    // 右下
        ];
        
        ctx.fillStyle = currentColor;
        cloudPositions.forEach(pos => {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, pos.r, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // 移除阴影，绘制眼睛和嘴巴
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#333';
        
        // 眼睛
        const eyeOffsetX = this.radius * 0.25;
        const eyeOffsetY = -this.radius * 0.15;
        const eyeSize = this.radius * 0.12;
        
        // 如果受击，画愤怒的眼睛（斜线）
        if (this.isHit) {
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#333';
            ctx.lineCap = 'round';
            // 左眼（X形）
            ctx.beginPath();
            ctx.moveTo(-eyeOffsetX - eyeSize, eyeOffsetY - eyeSize);
            ctx.lineTo(-eyeOffsetX + eyeSize, eyeOffsetY + eyeSize);
            ctx.moveTo(-eyeOffsetX + eyeSize, eyeOffsetY - eyeSize);
            ctx.lineTo(-eyeOffsetX - eyeSize, eyeOffsetY + eyeSize);
            // 右眼（X形）
            ctx.moveTo(eyeOffsetX - eyeSize, eyeOffsetY - eyeSize);
            ctx.lineTo(eyeOffsetX + eyeSize, eyeOffsetY + eyeSize);
            ctx.moveTo(eyeOffsetX + eyeSize, eyeOffsetY - eyeSize);
            ctx.lineTo(eyeOffsetX - eyeSize, eyeOffsetY + eyeSize);
            ctx.stroke();
        } else {
            // 正常眼睛（圆点）
            ctx.beginPath();
            ctx.arc(-eyeOffsetX, eyeOffsetY, eyeSize, 0, Math.PI * 2);
            ctx.arc(eyeOffsetX, eyeOffsetY, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 嘴巴
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#333';
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (this.isHit) {
            // 愤怒嘴（倒U形）
            ctx.arc(0, this.radius * 0.3, this.radius * 0.2, Math.PI, 0, true);
        } else {
            // 微笑
            ctx.arc(0, this.radius * 0.15, this.radius * 0.2, 0.2, Math.PI - 0.2);
        }
        ctx.stroke();
        
        // 受击状态：画生气符号💢
        if (this.isHit) {
            ctx.fillStyle = '#FF4444';
            ctx.font = `${this.radius * 0.8}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💢', this.radius * 0.6, -this.radius * 0.8);
        }
        
        ctx.restore();
    }
    
    /**
     * 检查点击碰撞
     * @param {number} mouseX - 鼠标X坐标
     * @param {number} mouseY - 鼠标Y坐标
     * @returns {boolean} 是否命中
     */
    checkCollision(mouseX, mouseY) {
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distSq = dx * dx + dy * dy;
        return distSq <= (this.radius * this.radius);
    }
    
    /**
     * 触发受击状态
     */
    triggerHit() {
        this.isHit = true;
        this.hitTimer = this.hitDuration;
        this.scaleMultiplier = 1.2;
    }
}
