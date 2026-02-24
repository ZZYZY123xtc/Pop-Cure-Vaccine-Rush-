/**
 * 🍦 Level 22：神圣气泡系统 (Holy Bubbles System)
 * 轨迹劫持机制 - 金色气泡捕获病毒
 */

export class HolyBubblesSystem {
    constructor(canvasWidth, canvasHeight, config = {}) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        
        // 配置
        this.spawnInterval = config.spawnInterval || 8000;
        this.bubbleRadius = config.bubbleRadius || 40;
        this.riseSpeed = config.riseSpeed || 0.5;
        this.bubbleColor = config.bubbleColor || 'rgba(212, 175, 55, 0.3)';
        this.glowColor = config.glowColor || '#FFD700';
        this.captureImmunePenalty = config.captureImmunePenalty || 5;
        
        // 气泡数组
        this.bubbles = [];
        
        // 生成计时器
        this.spawnTimer = 0;
        
        console.log('[HolyBubbles] 🍦 神圣气泡系统已初始化');
    }
    
    /**
     * 更新气泡状态
     */
    update(dt, viruses) {
        // 生成新气泡
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnBubble();
            this.spawnTimer = 0;
        }
        
        // 更新现有气泡
        const frameNormalization = dt / 16.67;
        
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const bubble = this.bubbles[i];
            
            // 气泡上升
            bubble.y -= this.riseSpeed * frameNormalization;
            
            // 呼吸动画
            bubble.pulseTimer += dt * 0.001;
            bubble.currentRadius = bubble.radius + Math.sin(bubble.pulseTimer) * 3;
            
            // 检查是否离开屏幕
            if (bubble.y + bubble.radius < 0) {
                // 如果气泡带着病毒离开，增加免疫负荷
                if (bubble.capturedVirus) {
                    this.bubbles.splice(i, 1);
                    console.log('[HolyBubbles] ⚠️ 气泡带病毒离开屏幕！');
                    return { escapedWithVirus: true, penalty: this.captureImmunePenalty, virus: bubble.capturedVirus };
                }
                this.bubbles.splice(i, 1);
                continue;
            }
            
            // 如果气泡已捕获病毒，锁定病毒位置
            if (bubble.capturedVirus) {
                bubble.capturedVirus.x = bubble.x;
                bubble.capturedVirus.y = bubble.y;
                bubble.capturedVirus.vx = 0;
                bubble.capturedVirus.vy = 0;
                continue;
            }
            
            // 检测与病毒的碰撞
            for (const virus of viruses) {
                if (virus.isTutorial || virus.isCaptured) continue;
                
                const dx = bubble.x - virus.x;
                const dy = bubble.y - virus.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < bubble.radius + virus.radius) {
                    // 捕获病毒！
                    bubble.capturedVirus = virus;
                    virus.isCaptured = true;
                    console.log('[HolyBubbles] 🎯 气泡捕获病毒！');
                    break;
                }
            }
        }
        
        return null;
    }
    
    /**
     * 生成新气泡
     */
    spawnBubble() {
        const x = this.bubbleRadius + Math.random() * (this.width - this.bubbleRadius * 2);
        const y = this.height + this.bubbleRadius;
        
        this.bubbles.push({
            x: x,
            y: y,
            radius: this.bubbleRadius,
            currentRadius: this.bubbleRadius,
            pulseTimer: Math.random() * Math.PI * 2,
            capturedVirus: null
        });
        
        console.log('[HolyBubbles] ✨ 新气泡生成:', x.toFixed(0), y.toFixed(0));
    }
    
    /**
     * 点击检测（击破气泡或解救病毒）
     */
    checkClick(mouseX, mouseY, viruses) {
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const bubble = this.bubbles[i];
            const dx = mouseX - bubble.x;
            const dy = mouseY - bubble.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < bubble.currentRadius) {
                // 击中气泡！
                const capturedVirus = bubble.capturedVirus;
                
                // 移除气泡
                this.bubbles.splice(i, 1);
                
                // 如果气泡内有病毒，解除捕获状态
                if (capturedVirus) {
                    capturedVirus.isCaptured = false;
                    console.log('[HolyBubbles] 🔓 解救病毒！');
                }
                
                return { hitBubble: true, hadVirus: !!capturedVirus, virus: capturedVirus };
            }
        }
        
        return null;
    }
    
    /**
     * 绘制气泡
     */
    draw(ctx) {
        for (const bubble of this.bubbles) {
            ctx.save();
            
            // 外发光
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.glowColor;
            
            // 气泡主体
            ctx.strokeStyle = this.bubbleColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(bubble.x, bubble.y, bubble.currentRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            // 内部高光（模拟透明质感）
            const gradient = ctx.createRadialGradient(
                bubble.x - bubble.currentRadius * 0.3,
                bubble.y - bubble.currentRadius * 0.3,
                0,
                bubble.x,
                bubble.y,
                bubble.currentRadius
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // 如果捕获了病毒，绘制连接线
            if (bubble.capturedVirus) {
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(bubble.x, bubble.y);
                ctx.arc(bubble.x, bubble.y, bubble.currentRadius * 0.8, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            
            ctx.restore();
        }
    }
    
    /**
     * 调整尺寸
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
    
    /**
     * 清理资源
     */
    destroy() {
        // 释放所有捕获的病毒
        for (const bubble of this.bubbles) {
            if (bubble.capturedVirus) {
                bubble.capturedVirus.isCaptured = false;
            }
        }
        this.bubbles = [];
        console.log('[HolyBubbles] 🍦 神圣气泡系统已清理');
    }
}
