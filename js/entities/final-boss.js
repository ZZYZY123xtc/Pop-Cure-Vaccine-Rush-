/**
 * 🍦 Level 25：最终Boss - 奶油坍塌 (The Vanilla Collapse)
 * 剥落机制 + 残渣拦截 + 核心过载
 */

import { Boss } from './boss.js';

export class FinalBoss extends Boss {
    constructor(canvasWidth, canvasHeight, config = {}) {
        super(canvasWidth, canvasHeight);
        
        // Boss 特殊属性
        this.maxHp = config.maxHp || 150;
        this.hp = this.maxHp;
        this.radius = 120; // 更大的体型（用于核心）
        
        // 奶油团组成部分
        this.creamBalls = []; // {x, y, radius, phase, color}
        this.initialBallCount = config.ballCount || 45; // 45个圆球
        this.regenerationRate = config.regenerationRate || 3000; // 3秒补回1个
        this.regenerationTimer = 0;
        
        // 残渣系统
        this.debris = []; // {x, y, vx, vy, radius, lifetime}
        this.debrisSpeed = config.debrisSpeed || 2.1; // 残渣弹射速度（下调40%）
        
        // 核心过载阶段
        this.coreExposed = false; // 是否暴露核心
        this.coreHp = 100; // 核心血量
        this.coreMaxHp = 100;
        this.coreTimeout = config.coreTimeout || 10000; // 10秒内必须击败核心
        this.coreTimer = 0;
        this.coreFailureTriggered = false;
        
        // 视觉效果
        this.glowTimer = 0;
        this.screenFlash = 0; // 屏幕闪光效果
        
        // 初始化奶油球
        this.initializeCreamBalls();
        
        console.log('[FinalBoss] 🍦 奶油巨堡已降临！');
        console.log('[FinalBoss] 初始球数:', this.initialBallCount);
    }
    
    /**
     * 初始化奶油球阵型
     */
    initializeCreamBalls() {
        this.creamBalls = [];
        
        // 在中心区域随机分布圆球
        for (let i = 0; i < this.initialBallCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 80; // 中心80px范围内
            
            this.creamBalls.push({
                x: this.x + Math.cos(angle) * distance,
                y: this.y + Math.sin(angle) * distance,
                radius: 30 + Math.random() * 30, // 30-60px
                phase: Math.random() * Math.PI * 2,
                color: `rgba(255, 255, 240, ${0.7 + Math.random() * 0.3})` // 香草色
            });
        }
    }
    
    /**
     * 更新Boss状态
     */
    update(dt, canvasWidth, canvasHeight, gameManager) {
        super.update(dt); // 调用基类更新（呼吸动画等）
        
        this.glowTimer += dt * 0.003;
        
        // 屏幕闪光衰减
        if (this.screenFlash > 0) {
            this.screenFlash -= dt * 0.005;
        }
        
        // 检查是否应暴露核心
        if (!this.coreExposed && this.creamBalls.length < 5) {
            this.exposeCore();
        }
        
        if (this.coreExposed) {
            // 核心阶段：倒计时
            this.coreTimer += dt;
            if (this.coreTimer >= this.coreTimeout && !this.coreFailureTriggered) {
                console.log('[FinalBoss] ⏰ 核心倒计时超时！已用时:', this.coreTimer, 'ms，限制:', this.coreTimeout, 'ms');
                this.coreFailureTriggered = true;
                // 返回失败标志，让game-loop处理
                return { coreFailed: true };
            }
        } else {
            // 普通阶段：自动再生圆球
            this.regenerationTimer += dt;
            if (this.regenerationTimer >= this.regenerationRate && this.creamBalls.length < this.initialBallCount) {
                this.regenerateBall();
                this.regenerationTimer = 0;
            }
        }
        
        // 更新残渣
        for (let i =this.debris.length - 1; i >= 0; i--) {
            const d = this.debris[i];
            
            d.x += d.vx;
            d.y += d.vy;
            d.lifetime += dt;
            
            // 检查是否飞出屏幕
            if (d.x < -50 || d.x > canvasWidth + 50 || d.y < -50 || d.y > canvasHeight + 50) {
                // 残渣逃逸：交由game-loop做最终关失败判定
                this.screenFlash = 1;
                this.debris.splice(i, 1);
                
                // 返回逃逸标志给game-loop处理
                if (gameManager) {
                    console.log('[FinalBoss] ⚠️ 残渣逃逸！');
                    return { escaped: true };
                }
            }
        }
        
        return null;
    }
    
    /**
     * 再生一个奶油球
     */
    regenerateBall() {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 80;
        
        this.creamBalls.push({
            x: this.x + Math.cos(angle) * distance,
            y: this.y + Math.sin(angle) * distance,
            radius: 30 + Math.random() * 30,
            phase: Math.random() * Math.PI * 2,
            color: `rgba(255, 255, 240, ${0.7 + Math.random() * 0.3})`
        });
        
        console.log('[FinalBoss] ✨ 再生奶油球！当前数量:', this.creamBalls.length);
    }
    
    /**
     * 暴露核心
     */
    exposeCore() {
        this.coreExposed = true;
        this.coreTimer = 0;
        console.log('[FinalBoss] 💥 核心暴露！8秒内必须击败！');
    }
    
    /**
     * 核心超时失败
     */
    triggerCoreFailure(gameManager) {
        this.coreFailureTriggered = true;
        console.log('[FinalBoss] ❌ 核心超时！玩家失败！');
        // 触发游戏失败
        if (gameManager && gameManager.triggerGameOver) {
            gameManager.triggerGameOver();
        }
    }
    
    /**
     * 检测点击（奶油球或残渣）
     */
    handleClick(mouseX, mouseY) {
        // 优先检测核心
        if (this.coreExposed) {
            const distToCore = Math.hypot(mouseX - this.x, mouseY - this.y);
            if (distToCore < this.radius * 0.4) { // 核心较小
                return { type: 'core', target: this };
            }
        }
        
        // 检测残渣点击（扩大点击范围到2.5倍，让残渣更好点）
        for (let i = this.debris.length - 1; i >= 0; i--) {
            const d = this.debris[i];
            const distToDebris = Math.hypot(mouseX - d.x, mouseY - d.y);
            if (distToDebris < d.radius * 2.5) { // 15px * 2.5 = 37.5px 点击范围
                this.debris.splice(i, 1); // 移除残渣
                return { type: 'debris', target: d };
            }
        }
        
        // 检测奶油球点击
        for (let i = this.creamBalls.length - 1; i >= 0; i--) {
            const ball = this.creamBalls[i];
            const distToBall = Math.hypot(mouseX - ball.x, mouseY - ball.y);
            if (distToBall < ball.radius) {
                // 剥落奶油球
                this.creamBalls.splice(i, 1);
                
                // 胜利曙光：剩余奶油球 < 15 时停止喷溅残渣
                if (this.creamBalls.length >= 15) {
                    this.createDebris(ball.x, ball.y);
                }
                
                return { type: 'ball', target: ball };
            }
        }
        
        return null;
    }
    
    /**
     * 创建残渣
     */
    createDebris(x, y) {
        const angle = Math.random() * Math.PI * 2;
        this.debris.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * this.debrisSpeed,
            vy: Math.sin(angle) * this.debrisSpeed,
            radius: 15,
            lifetime: 0
        });
    }
    
    /**
     * 核心受到伤害
     */
    damageCore(damage) {
        this.coreHp -= damage;
        this.flashTime = 100;
        
        if (this.coreHp <= 0) {
            this.coreHp = 0;
            return true; // 核心被摧毁
        }
        
        return false;
    }
    
    /**
     * 获取核心血量百分比
     */
    getCoreHealthPercent() {
        return this.coreHp / this.coreMaxHp;
    }
    
    /**
     * 绘制Boss + 奶油球 + 残渣 + 核心
     */
    draw(ctx) {
        // 1. 绘制奶油球
        for (const ball of this.creamBalls) {
            ctx.save();
            
            // 呼吸效果
            const pulseFactor = 1 + Math.sin(this.glowTimer + ball.phase) * 0.05;
            const drawRadius = ball.radius * pulseFactor;
            
            // 马卡龙Q弹渐变
            const gradient = ctx.createRadialGradient(
                ball.x - drawRadius * 0.2, ball.y - drawRadius * 0.2, 0,
                ball.x, ball.y, drawRadius
            );
            gradient.addColorStop(0, '#FFFEF0'); // 高光
            gradient.addColorStop(0.6, ball.color);
            gradient.addColorStop(1, '#E6D8B0'); // 阴影
            
            ctx.fillStyle = gradient;
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(255, 215, 0, 0.4)';
            
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, drawRadius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
        
        // 2. 绘制残渣
        for (const d of this.debris) {
            ctx.save();
            
            ctx.fillStyle = 'rgba(180, 160, 120, 0.8)'; // 深色残渣
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
        
        // 3. 绘制核心（如果暴露）
        if (this.coreExposed) {
            ctx.save();
            
            // 核心发光效果
            const coreIntensity = this.getCoreHealthPercent();
            const coreRadius = this.radius * 0.4;
            
            // 闪耀光环
            ctx.shadowBlur = 40 * coreIntensity;
            ctx.shadowColor = '#FFD700';
            
            const coreGradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, coreRadius
            );
            coreGradient.addColorStop(0, `rgba(255, 255, 255, ${coreIntensity})`);
            coreGradient.addColorStop(0.5, `rgba(255, 215, 0, ${coreIntensity})`);
            coreGradient.addColorStop(1, `rgba(212, 175, 55, ${coreIntensity})`);
            
            ctx.fillStyle = coreGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, coreRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // 核心血条
            this.drawCoreHealthBar(ctx);
            
            // 倒计时提示
            const remainingTime = Math.max(0, (this.coreTimeout - this.coreTimer) / 1000).toFixed(1);
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = remainingTime < 3 ? '#FF0000' : '#FFD700';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#000';
            ctx.fillText(`${remainingTime}s`, this.x, this.y - this.radius - 30);
            
            ctx.restore();
        }
        
        // 4. 球数提示
        if (!this.coreExposed) {
            ctx.save();
            ctx.font = 'bold 18px Arial';
            ctx.fillStyle = '#FFD700';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#000';
            ctx.fillText(`${this.creamBalls.length} balls`, this.x, this.y - this.radius - 50);
            ctx.restore();
        }
    }
    
    /**
     * 绘制核心血条
     */
    drawCoreHealthBar(ctx) {
        const barWidth = 200;
        const barHeight = 20;
        const barX = this.x - barWidth / 2;
        const barY = this.y + this.radius + 20;
        
        ctx.save();
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // 血量
        const healthPercent = this.getCoreHealthPercent();
        ctx.fillStyle = healthPercent > 0.5 ? '#FFD700' : '#FF4444';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // 边框
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // 文字
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`CORE: ${this.coreHp}/${this.coreMaxHp}`, this.x, barY + barHeight / 2);
        
        ctx.restore();
    }
    
    /**
     * 绘制屏幕闪光
     */
    drawScreenFlash(ctx, canvasWidth, canvasHeight) {
        if (this.screenFlash > 0) {
            ctx.save();
            ctx.fillStyle = `rgba(255, 0, 0, ${this.screenFlash * 0.2})`;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            ctx.restore();
        }
    }
    
    /**
     * 清理资源
     */
    destroy() {
        this.creamBalls = [];
        this.debris = [];
        console.log('[FinalBoss] 🍦 奶油巨堡已清理');
    }
}
