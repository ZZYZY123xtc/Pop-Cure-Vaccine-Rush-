/**
 * 🍑 Level 17：动脉瓣膜系统
 * 蜜桃血管章节 - 果肉般的瓣膜周期开闭，病毒堆积与倾泻
 */

export class ValveSystem {
    constructor(canvasWidth, canvasHeight, valveConfig) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.config = valveConfig || {};
        
        // 瓣膜配置
        this.positions = this.config.positions || [0.33, 0.67]; // Y轴相对位置
        this.cycleDuration = this.config.cycleDuration || 5000;
        this.closedDuration = this.config.closedDuration || 3000;
        this.openDuration = this.config.openDuration || 2000;
        this.valveColor = this.config.valveColor || 'rgba(255, 140, 150, 0.9)';
        this.valveHeight = this.config.valveHeight || 8;
        this.valveGap = this.config.valveGap || 100;
        this.valveRadius = this.config.valveRadius || 16;
        
        // 瓣膜状态
        this.valves = this.positions.map(yRatio => ({
            y: canvasHeight * yRatio,  // 瓣膜Y坐标
            isOpen: false,             // 是否打开
            openProgress: 0,           // 开合进度 (0=完全闭合, 1=完全打开)
            cycleTimer: 0              // 周期计时器
        }));
        
        console.log('[ValveSystem] 🍑 瓣膜系统已初始化', this.valves);
    }
    
    /**
     * 更新瓣膜状态
     * @param {number} dt - 时间增量（毫秒）
     */
    update(dt) {
        for (const valve of this.valves) {
            valve.cycleTimer += dt;
            
            // 周期循环
            if (valve.cycleTimer >= this.cycleDuration) {
                valve.cycleTimer = 0;
            }
            
            // 判断当前应该是开还是关
            if (valve.cycleTimer < this.closedDuration) {
                // 闭合阶段
                valve.isOpen = false;
                valve.openProgress = 0;
            } else {
                // 打开阶段
                valve.isOpen = true;
                // 计算打开进度（平滑过渡）
                const openTime = valve.cycleTimer - this.closedDuration;
                valve.openProgress = Math.min(1, openTime / 500); // 500ms的打开动画
            }
        }
    }
    
    /**
     * 绘制瓣膜
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     */
    draw(ctx) {
        for (const valve of this.valves) {
            this.drawValve(ctx, valve);
        }
    }
    
    /**
     * 绘制单个瓣膜
     */
    drawValve(ctx, valve) {
        ctx.save();
        
        // 根据开合进度计算瓣膜长度
        const maxLength = (this.canvasWidth - this.valveGap) / 2;
        const currentLength = maxLength * (1 - valve.openProgress);
        
        // 左侧瓣膜（从左边缘向中间延伸）
        if (currentLength > 0) {
            this.drawValveSegment(ctx, 
                0, valve.y, 
                currentLength, this.valveHeight, 
                'left'
            );
            
            // 右侧瓣膜（从右边缘向中间延伸）
            this.drawValveSegment(ctx, 
                this.canvasWidth - currentLength, valve.y, 
                currentLength, this.valveHeight, 
                'right'
            );
        }
        
        ctx.restore();
    }
    
    /**
     * 绘制瓣膜段（柔软圆润的粉色长条）
     */
    drawValveSegment(ctx, x, y, width, height, side) {
        ctx.save();
        
        // 绘制圆角矩形
        ctx.beginPath();
        
        if (side === 'left') {
            // 左侧：左边直角，右边圆角
            ctx.moveTo(x, y - height / 2);
            ctx.lineTo(x + width - this.valveRadius, y - height / 2);
            ctx.arcTo(x + width, y - height / 2, x + width, y, this.valveRadius);
            ctx.arcTo(x + width, y + height / 2, x + width - this.valveRadius, y + height / 2, this.valveRadius);
            ctx.lineTo(x, y + height / 2);
            ctx.closePath();
        } else {
            // 右侧：右边直角，左边圆角
            ctx.moveTo(x + width, y - height / 2);
            ctx.lineTo(x + this.valveRadius, y - height / 2);
            ctx.arcTo(x, y - height / 2, x, y, this.valveRadius);
            ctx.arcTo(x, y + height / 2, x + this.valveRadius, y + height / 2, this.valveRadius);
            ctx.lineTo(x + width, y + height / 2);
            ctx.closePath();
        }
        
        // 填充蜜桃粉色
        ctx.fillStyle = this.valveColor;
        ctx.fill();
        
        // 添加果冻光泽（渐变）
        const gradient = ctx.createLinearGradient(x, y - height / 2, x, y + height / 2);
        gradient.addColorStop(0, 'rgba(255, 180, 190, 0.6)');
        gradient.addColorStop(0.5, 'rgba(255, 140, 150, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 100, 120, 0.4)');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 添加柔和的发光边缘
        ctx.shadowColor = 'rgba(255, 140, 150, 0.5)';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = 'rgba(255, 180, 190, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }
    
    /**
     * 检查病毒是否碰到瓣膜
     * @param {Virus} virus - 病毒对象
     * @returns {Object|null} 如果碰到瓣膜，返回 { valve, blocked }，否则返回 null
     */
    checkVirusCollision(virus) {
        for (const valve of this.valves) {
            // 瓣膜闭合时才检测碰撞
            if (!valve.isOpen || valve.openProgress < 0.5) {
                const distanceToValve = Math.abs(virus.y - valve.y);
                const threshold = this.valveHeight / 2 + virus.radius;
                
                // 病毒触碰到瓣膜
                if (distanceToValve < threshold && virus.vy > 0) {
                    return { valve, blocked: true };
                }
            }
        }
        return null;
    }
    
    /**
     * 应用瓣膜对病毒的影响
     * @param {Virus} virus - 病毒对象
     */
    applyToVirus(virus) {
        const collision = this.checkVirusCollision(virus);
        
        if (collision) {
            const valve = collision.valve;
            // 将病毒卡在瓣膜上方
            virus.y = valve.y - this.valveHeight / 2 - virus.radius;
            virus.vy = 0; // 停止下落
            // 轻微的X轴漂浮
            virus.vx += (Math.random() - 0.5) * 0.5;
        }
    }
    
    /**
     * 销毁（清理资源）
     */
    destroy() {
        this.valves = [];
    }
}
