/**
 * 🍑 Level 19：动脉潮汐系统
 * 车道血崩机制 - 局部病毒暴跌
 */

export class ArterialTidesSystem {
    constructor(canvasWidth, canvasHeight, config) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.config = config || {};
        
        // 配置参数
        this.cycleDuration = this.config.cycleDuration || 6000;
        this.warningDuration = this.config.warningDuration || 1500;
        this.surgeDuration = this.config.surgeDuration || 1500;
        this.cooldownDuration = this.config.cooldownDuration || 3000;
        this.laneCount = this.config.laneCount || 3;
        this.surgeSpeedMultiplier = this.config.surgeSpeedMultiplier || 4.0;
        this.warningColor = this.config.warningColor || 'rgba(255, 192, 203, 0.2)';
        this.surgeColor = this.config.surgeColor || 'rgba(255, 105, 180, 0.3)';
        
        // 状态
        this.cycleTimer = 0;
        this.currentPhase = 'cooldown'; // 'warning', 'surge', 'cooldown'
        this.activeLane = -1; // 当前激活的车道索引
        
        // 车道宽度
        this.laneWidth = canvasWidth / this.laneCount;
        
        console.log('[ArterialTides] 🍑 潮汐系统已初始化，车道宽度:', this.laneWidth);
    }
    
    /**
     * 更新潮汐状态
     * @param {number} dt - 时间增量（毫秒）
     */
    update(dt) {
        this.cycleTimer += dt;
        
        // 周期循环
        if (this.cycleTimer >= this.cycleDuration) {
            this.cycleTimer = 0;
            // 随机选择新车道
            this.activeLane = Math.floor(Math.random() * this.laneCount);
            this.currentPhase = 'warning';
            console.log('[ArterialTides] 🌊 新周期开始，车道:', this.activeLane);
        }
        
        // 判断当前阶段
        if (this.cycleTimer < this.warningDuration) {
            this.currentPhase = 'warning';
        } else if (this.cycleTimer < this.warningDuration + this.surgeDuration) {
            this.currentPhase = 'surge';
        } else {
            this.currentPhase = 'cooldown';
            // 冷却期间清除车道
            if (this.cycleTimer >= this.warningDuration + this.surgeDuration + 100) {
                // 稍微延迟一点清除，避免视觉突变
            }
        }
    }
    
    /**
     * 绘制潮汐效果（背景层，不阻挡点击）
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     */
    draw(ctx) {
        if (this.activeLane < 0 || this.currentPhase === 'cooldown') return;
        
        ctx.save();
        
        // 计算车道位置
        const laneX = this.activeLane * this.laneWidth;
        
        // 根据阶段设置颜色
        let color = this.warningColor;
        let alpha = 0.2;
        
        if (this.currentPhase === 'warning') {
            // 预警阶段：呼吸闪烁
            const breathAlpha = 0.1 + Math.abs(Math.sin(Date.now() / 300)) * 0.15;
            color = this.warningColor.replace(/[\d.]+\)$/, `${breathAlpha})`);
        } else if (this.currentPhase === 'surge') {
            // 爆发阶段：果冻红
            color = this.surgeColor;
        }
        
        // 绘制车道矩形（纯背景，无事件）
        ctx.fillStyle = color;
        ctx.fillRect(laneX, 0, this.laneWidth, this.canvasHeight);
        
        ctx.restore();
    }
    
    /**
     * 应用潮汐对病毒的影响
     * @param {Virus} virus - 病毒对象
     * @param {number} dt - 时间增量（毫秒）
     */
    applyToVirus(virus, dt) {
        // 只在爆发阶段影响病毒
        if (this.currentPhase !== 'surge' || this.activeLane < 0) return;
        
        // 检查病毒是否在激活车道内
        const laneStart = this.activeLane * this.laneWidth;
        const laneEnd = laneStart + this.laneWidth;
        
        if (virus.x >= laneStart && virus.x < laneEnd) {
            // 车道内病毒：Y速度额外增加（血崩效果）
            const frameNormalization = dt / 16.67;
            const surgeBoost = virus.vy * (this.surgeSpeedMultiplier - 1) * frameNormalization;
            virus.y += surgeBoost;
            
            // 标记病毒处于潮汐中（可选，用于视觉效果）
            virus.inTide = true;
        } else {
            virus.inTide = false;
        }
    }
    
    /**
     * 获取当前激活车道的边界
     * @returns {{left: number, right: number}|null}
     */
    getActiveLaneBounds() {
        if (this.activeLane < 0 || this.currentPhase === 'cooldown') return null;
        
        const laneStart = this.activeLane * this.laneWidth;
        return {
            left: laneStart,
            right: laneStart + this.laneWidth
        };
    }
    
    /**
     * 清理（销毁时调用）
     */
    destroy() {
        this.cycleTimer = 0;
        this.activeLane = -1;
        this.currentPhase = 'cooldown';
    }
}
