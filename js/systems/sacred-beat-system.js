/**
 * 🍦 Level 23：音律连爆系统 (Vanilla Resonance System)
 * 充能 + 连爆链式反应
 */

export class SacredBeatSystem {
    constructor(canvasWidth, canvasHeight, config = {}) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        
        // 配置
        this.pulseInterval = config.pulseInterval || 1500; // 1.5秒一次波纹
        this.waveSpeed = config.waveSpeed || 6; // 波纹扩散速度
        this.chargeWindow = config.chargeWindow || 1000; // 充能持续1秒（严格窗口）
        this.warningWindow = config.warningWindow || 200; // 最后0.2秒闪烁预警
        this.rayCount = config.rayCount || 4; // 连爆时发射4条射线
        this.rayLength = config.rayLength || 250; // 射线长度
        this.rayWidth = config.rayWidth || 8; // 射线宽度
        this.waveColor = config.waveColor || 'rgba(212, 175, 55, 0.4)';
        this.chargeColor = config.chargeColor || '#FFD700';
        
        // 中心点（屏幕中央）
        this.centerX = canvasWidth / 2;
        this.centerY = canvasHeight / 2;
        
        // 当前波纹状态
        this.waves = []; // {radius, age}
        this.pulseTimer = 0;
        this.waveIdCounter = 0;
        
        // 连爆射线动画
        this.activeRays = []; // {x, y, angle, length, alpha, age}
        this.chargeBursts = []; // {x, y, age}
        
        console.log('[VanillaResonance] 🍦 音律连爆系统已初始化');
    }
    
    /**
     * 更新波纹和充能状态
     */
    update(dt, viruses) {
        // 心跳计时
        this.pulseTimer += dt;
        if (this.pulseTimer >= this.pulseInterval) {
            this.emitPulse();
            this.pulseTimer = 0;
        }
        
        // 更新所有波纹
        const frameNormalization = dt / 16.67;
        
        for (let i = this.waves.length - 1; i >= 0; i--) {
            const wave = this.waves[i];
            
            // 波纹扩散
            wave.radius += this.waveSpeed * frameNormalization;
            wave.age += dt;
            
            // 波纹完全离开屏幕后移除
            const maxScreenDistance = Math.sqrt(this.width * this.width + this.height * this.height);
            if (wave.radius > maxScreenDistance) {
                this.waves.splice(i, 1);
                continue;
            }
            
            // 检测波纹划过病毒（充能逻辑）
            for (const virus of viruses) {
                if (virus.isTutorial || virus.isCaptured || virus.isStunned) continue;
                
                const dx = virus.x - this.centerX;
                const dy = virus.y - this.centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // 病毒在波纹边缘接触带内（严格窗口：缩小容差）
                const tolerance = Math.max(6, virus.radius * 0.35);
                if (Math.abs(distance - wave.radius) < tolerance) {
                    // 每个波纹只触发一次充能，避免同一波多帧重复刷新
                    if (virus.lastChargedWaveId !== wave.id) {
                        virus.lastChargedWaveId = wave.id;
                        virus.isCharged = true;
                        virus.chargeTimer = this.chargeWindow;
                        virus.chargeScale = 1.1; // 视觉放大
                        virus.visualAlpha = 1.0; // 充能瞬间全亮
                        this.chargeBursts.push({ x: virus.x, y: virus.y, age: 0 }); // 金色流光
                    }
                }
            }
        }
        
        // 更新病毒充能状态
        for (const virus of viruses) {
            if (virus.chargeTimer !== undefined && virus.chargeTimer > 0) {
                virus.chargeTimer -= dt;
                if (virus.chargeTimer <= 0) {
                    virus.isCharged = false;
                    virus.chargeScale = 1.0;
                    virus.chargeTimer = 0;
                }
            }

            // Level 23 视觉：未充能半透明，充能全亮
            virus.visualAlpha = virus.isCharged ? 1.0 : 0.7;
            
            // 逐渐回到默认缩放
            if (virus.chargeScale !== undefined && virus.chargeScale > 1.0) {
                virus.chargeScale = Math.max(1.0, virus.chargeScale - 0.01 * frameNormalization);
            }
        }
        
        // 更新连爆射线动画
        for (let i = this.activeRays.length - 1; i >= 0; i--) {
            const ray = this.activeRays[i];
            ray.age += dt;
            ray.alpha = Math.max(0, 1 - ray.age / 300); // 300ms淡出
            
            if (ray.age >= 300) {
                this.activeRays.splice(i, 1);
            }
        }

        // 更新充能瞬间流光
        for (let i = this.chargeBursts.length - 1; i >= 0; i--) {
            const burst = this.chargeBursts[i];
            burst.age += dt;
            if (burst.age >= 300) {
                this.chargeBursts.splice(i, 1);
            }
        }
    }
    
    /**
     * 发射心跳波纹
     */
    emitPulse() {
        this.waves.push({
            id: ++this.waveIdCounter,
            radius: 0,
            age: 0
        });
        console.log('[VanillaResonance] 💓 心跳波纹发射');
    }
    
    /**
     * 触发连爆（玩家点击充能病毒时调用）
     * @returns {killedViruses: Virus[], rays: Array} 被射线杀死的病毒和射线数据
     */
    triggerChainReaction(sourceVirus, allViruses) {
        const killedViruses = [];
        const glancedViruses = [];
        const rays = [];
        
        // 生成4条随机角度的射线
        const angleOffset = Math.random() * Math.PI * 2;
        for (let i = 0; i < this.rayCount; i++) {
            const angle = angleOffset + (Math.PI * 2 / this.rayCount) * i;
            
            // 计算射线终点
            const endX = sourceVirus.x + Math.cos(angle) * this.rayLength;
            const endY = sourceVirus.y + Math.sin(angle) * this.rayLength;
            
            // 记录射线用于绘制
            rays.push({
                x: sourceVirus.x,
                y: sourceVirus.y,
                angle: angle,
                length: this.rayLength,
                alpha: 1,
                age: 0
            });
            
            // 检测射线路径上的所有病毒
            for (const virus of allViruses) {
                if (virus === sourceVirus) continue;
                if (virus.isTutorial) continue;
                if (killedViruses.includes(virus)) continue;
                
                // 点到线段的距离判定
                const distance = this.pointToLineDistance(
                    virus.x, virus.y,
                    sourceVirus.x, sourceVirus.y,
                    endX, endY
                );
                
                if (distance < virus.radius + this.rayWidth / 2) {
                    if (virus.isCharged) {
                        killedViruses.push(virus);
                    } else {
                        glancedViruses.push(virus);
                        virus.shakeTimer = 120; // 非充能仅轻微震动
                    }
                }
            }
        }
        
        // 添加射线到动画队列
        this.activeRays.push(...rays);
        
        console.log('[VanillaResonance] ⚡ 连爆触发！击杀', killedViruses.length, '个病毒，掠过', glancedViruses.length, '个未充能病毒');
        
        return { killedViruses, glancedViruses, rays };
    }
    
    /**
     * 计算点到线段的距离
     */
    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthSq = dx * dx + dy * dy;
        
        if (lengthSq === 0) {
            return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
        }
        
        let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
        t = Math.max(0, Math.min(1, t));
        
        const closestX = x1 + t * dx;
        const closestY = y1 + t * dy;
        
        return Math.sqrt((px - closestX) * (px - closestX) + (py - closestY) * (py - closestY));
    }
    
    /**
     * 绘制波纹、充能特效、射线
     */
    draw(ctx, viruses) {
        // 1. 绘制心跳波纹
        for (const wave of this.waves) {
            ctx.save();
            ctx.strokeStyle = this.waveColor;
            ctx.lineWidth = 3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.chargeColor;
            
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, wave.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        
        // 2. 绘制充能病毒的金色描边和粒子拖尾
        for (const virus of viruses) {
            if (virus.isCharged) {
                ctx.save();

                // 最后0.2秒闪烁预警
                const isWarning = virus.chargeTimer <= this.warningWindow;
                const blinkVisible = !isWarning || Math.floor(virus.chargeTimer / 60) % 2 === 0;
                if (!blinkVisible) {
                    ctx.restore();
                    continue;
                }
                
                // 金色外发光描边
                ctx.strokeStyle = this.chargeColor;
                ctx.lineWidth = 3;
                ctx.shadowBlur = 20;
                ctx.shadowColor = this.chargeColor;
                
                const drawRadius = virus.radius * (virus.chargeScale || 1.1);
                
                ctx.beginPath();
                ctx.arc(virus.x, virus.y, drawRadius, 0, Math.PI * 2);
                ctx.stroke();
                
                // 流动的金色粒子拖尾（简化版：环状粒子）
                const particleCount = 8;
                const time = Date.now() * 0.003;
                for (let i = 0; i < particleCount; i++) {
                    const angle = (Math.PI * 2 / particleCount) * i + time;
                    const px = virus.x + Math.cos(angle) * (drawRadius + 8);
                    const py = virus.y + Math.sin(angle) * (drawRadius + 8);
                    
                    ctx.fillStyle = this.chargeColor;
                    ctx.beginPath();
                    ctx.arc(px, py, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                ctx.restore();
            }
        }

        // 2.5 绘制充能瞬间金色流光
        for (const burst of this.chargeBursts) {
            const progress = burst.age / 300;
            const alpha = Math.max(0, 1 - progress);
            const radius = 18 + progress * 30;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = this.chargeColor;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 14;
            ctx.shadowColor = this.chargeColor;
            ctx.beginPath();
            ctx.arc(burst.x, burst.y, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        
        // 3. 绘制连爆射线
        for (const ray of this.activeRays) {
            ctx.save();
            ctx.globalAlpha = ray.alpha;
            ctx.strokeStyle = this.chargeColor;
            ctx.lineWidth = this.rayWidth;
            ctx.shadowBlur = 25;
            ctx.shadowColor = this.chargeColor;
            ctx.lineCap = 'round';
            
            const endX = ray.x + Math.cos(ray.angle) * ray.length;
            const endY = ray.y + Math.sin(ray.angle) * ray.length;
            
            ctx.beginPath();
            ctx.moveTo(ray.x, ray.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            ctx.restore();
        }
    }
    
    /**
     * 调整尺寸
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.centerX = width / 2;
        this.centerY = height / 2;
    }
    
    /**
     * 清理资源
     */
    destroy() {
        this.waves = [];
        this.activeRays = [];
        this.chargeBursts = [];
        console.log('[VanillaResonance] 🍦 音律连爆系统已清理');
    }
}
