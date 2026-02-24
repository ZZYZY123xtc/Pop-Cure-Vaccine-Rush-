/**
 * Boss 实体 - 第10关的巨型变异细胞
 * 固定在屏幕中央，等待小病毒送养分
 */

// 🦠 Boss被动污染机制：每秒增加16.65个等效病毒值（相当于1.67%免疫负荷/秒）
// 计算依据：threshold=999，60秒达到100% → 999/60≈16.65
const PASSIVE_POLLUTION_RATE = 16.65; // 每秒增加的等效病毒数

export class Boss {
    constructor(canvasWidth, canvasHeight) {
        // 固定在屏幕中央
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        
        // Boss 属性
        this.maxHp = 100;
        this.hp = this.maxHp;
        this.radius = 80; // 巨大的身躯
        
        // 🦠 被动污染机制：Boss的存在会持续增加免疫系统负荷
        this.passivePollutionLoad = 0; // 累积的等效病毒数量（从0开始）
        
        // 💖 萌系视觉效果
        this.pulseTimer = 0; // 呼吸动画计时器
        this.flashTime = 0; // 受击闪白
        
        // 🐙 胖嘟嘟的小触角
        this.tentacleCount = 12; // 胖嘟嘟的小触角数量
        this.tentacleOffsets = Array.from({ length: 12 }, () => Math.random() * Math.PI * 2); // 每根触角的随机偏移
    }
    
    /**
     * 更新 Boss 状态
     * @param {number} dt - 时间差（毫秒）
     */
    update(dt) {
        // 💖 呼吸动画计时器（胖嘟嘟的果冻感）
        this.pulseTimer += dt * 0.005;
        
        // 受击闪白效果
        if (this.flashTime > 0) {
            this.flashTime -= dt;
        }
        
        // 🦠 被动污染机制：Boss的存在持续增加免疫负荷
        // 计算公式：每秒增加PASSIVE_POLLUTION_RATE个等效病毒值
        // dt单位是毫秒，所以除以1000转换为秒
        this.passivePollutionLoad += (PASSIVE_POLLUTION_RATE * dt) / 1000;
        
        // 🐛 调试输出（每60帧打印一次，避免刷屏）
        if (!this._pollutionLogCounter) this._pollutionLogCounter = 0;
        this._pollutionLogCounter++;
        if (this._pollutionLogCounter >= 60) {
            console.log('[Boss] 🦠 被动污染负荷:', Math.floor(this.passivePollutionLoad), '/ 999（约', Math.floor(this.passivePollutionLoad / 999 * 100) + '%）');
            this._pollutionLogCounter = 0;
        }
    }
    
    /**
     * Boss 受到伤害
     */
    takeDamage(damage) {
        this.hp -= damage;
        this.flashTime = 100; // 闪白效果
        if (this.hp < 0) this.hp = 0;
        return this.hp <= 0; // 返回是否死亡
    }
    
    /**
     * Boss 回血
     */
    heal(amount) {
        this.hp += amount;
        if (this.hp > this.maxHp) this.hp = this.maxHp;
    }
    
    /**
     * 获取血量百分比
     */
    getHealthPercent() {
        return this.hp / this.maxHp;
    }
    
    /**
     * 绘制 Boss（萌系大魔王）
     */
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 1. 💖 呼吸缩放 (胖嘟嘟的果冻感)
        const pulseFactor = 1 + Math.sin(this.pulseTimer) * 0.06;
        const currentRadius = this.radius * pulseFactor;
        
        // 2. 🐙 绘制胖嘟嘟的小触角 (在身体后面)
        this.drawCuteTentacles(ctx, currentRadius, this.pulseTimer);
        
        // 3. 🍑 绘制本体 (软萌马卡龙渐变)
        ctx.beginPath();
        
        // 受击时闪白效果
        if (this.flashTime > 0) {
            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
            ctx.shadowBlur = 30 * pulseFactor;
        } else {
            ctx.shadowColor = 'rgba(255, 105, 180, 0.4)'; // 粉色柔和光晕
            ctx.shadowBlur = 20 * pulseFactor;
        }
        
        // 马卡龙渐变色（水蜜桃配色）
        const bodyGradient = ctx.createRadialGradient(0, -currentRadius * 0.2, 0, 0, 0, currentRadius);
        
        if (this.flashTime > 0) {
            // 受击时全白
            bodyGradient.addColorStop(0, '#ffffff');
            bodyGradient.addColorStop(0.6, '#ffffff');
            bodyGradient.addColorStop(1, '#ffdddd');
        } else {
            // 正常马卡龙配色
            bodyGradient.addColorStop(0, '#ffc3a0');   // 顶部高光（蜜桃粉）
            bodyGradient.addColorStop(0.6, '#ffafbd'); // 主体（樱花粉）
            bodyGradient.addColorStop(1, '#c94b4b');   // 边缘加深（树莓红），增加立体感
        }
        
        ctx.fillStyle = bodyGradient;
        ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // 关闭外阴影，准备画五官
        ctx.shadowBlur = 0;
        
        // 4. 👀 绘制"气呼呼的大眼睛"
        const eyeOffsetX = currentRadius * 0.35;
        const eyeOffsetY = -currentRadius * 0.1;
        const eyeRadius = currentRadius * 0.25;
        
        // 左眼
        this.drawEye(ctx, -eyeOffsetX, eyeOffsetY, eyeRadius, currentRadius);
        // 右眼
        this.drawEye(ctx, eyeOffsetX, eyeOffsetY, eyeRadius, currentRadius);
        
        // 5. 😠 气呼呼的小嘴巴 (倒 V 型)
        ctx.beginPath();
        ctx.strokeStyle = '#8a2b06';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(-currentRadius * 0.15, currentRadius * 0.3);
        ctx.lineTo(0, currentRadius * 0.2);
        ctx.lineTo(currentRadius * 0.15, currentRadius * 0.3);
        ctx.stroke();
        
        // 6. 💢 愤怒的小红晕 (脸颊)
        ctx.fillStyle = 'rgba(255, 50, 50, 0.4)';
        ctx.beginPath();
        ctx.arc(-currentRadius * 0.5, currentRadius * 0.15, currentRadius * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(currentRadius * 0.5, currentRadius * 0.15, currentRadius * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // 绘制血条（在 Boss 上方）
        this.drawHealthBar(ctx);
    }
    
    /**
     * 绘制胖嘟嘟小触角（萌系短手）
     */
    drawCuteTentacles(ctx, radius, timer) {
        ctx.save();
        ctx.lineWidth = 18; // 很粗的线条，显得胖乎乎
        ctx.lineCap = 'round';
        
        for (let i = 0; i < this.tentacleCount; i++) {
            const angle = (Math.PI * 2 / this.tentacleCount) * i;
            const offset = this.tentacleOffsets[i];
            
            // 触须颜色，稍微比身体深一点的粉红色
            ctx.strokeStyle = '#e85a71';
            
            const startX = Math.cos(angle) * radius * 0.8;
            const startY = Math.sin(angle) * radius * 0.8;
            
            // 短短胖胖的触角摆动
            const waveX = Math.cos(timer * 2 + offset) * 10;
            const waveY = Math.sin(timer * 2.5 + offset) * 10;
            
            const endX = Math.cos(angle) * (radius + 30) + waveX;
            const endY = Math.sin(angle) * (radius + 30) + waveY;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // 在触角尖端画个可爱的小圆球
            ctx.fillStyle = '#ffafbd';
            ctx.beginPath();
            ctx.arc(endX, endY, 12, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    /**
     * 绘制可爱单只眼睛（带卡姿兰大高光）
     */
    drawEye(ctx, x, y, radius, currentRadius) {
        // 眼白
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 黑眼珠 (微微向中间看，显得憨憨的)
        const pupilOffsetX = x > 0 ? -radius * 0.2 : radius * 0.2;
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.arc(x + pupilOffsetX, y, radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // 卡姿兰大高光
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x + pupilOffsetX - radius * 0.2, y - radius * 0.2, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // 小高光
        ctx.beginPath();
        ctx.arc(x + pupilOffsetX + radius * 0.2, y + radius * 0.15, radius * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        // 气呼呼的眉毛
        ctx.strokeStyle = '#8a2b06';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (x < 0) { // 左眉毛 向下倾斜
            ctx.moveTo(x - radius, y - radius * 1.2);
            ctx.lineTo(x + radius * 0.5, y - radius * 0.8);
        } else { // 右眉毛 向下倾斜
            ctx.moveTo(x - radius * 0.5, y - radius * 0.8);
            ctx.lineTo(x + radius, y - radius * 1.2);
        }
        ctx.stroke();
    }
    
    /**
     * 绘制血条
     */
    drawHealthBar(ctx) {
        const barWidth = 200;
        const barHeight = 20;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.radius - 40;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // 血量
        const healthPercent = this.getHealthPercent();
        const healthWidth = barWidth * healthPercent;
        
        // 根据血量变色
        let healthColor = '#00FF00';
        if (healthPercent < 0.3) {
            healthColor = '#FF0000';
        } else if (healthPercent < 0.6) {
            healthColor = '#FFA500';
        }
        
        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, healthWidth, barHeight);
        
        // 边框
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // 血量文字
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`BOSS HP: ${Math.ceil(this.hp)} / ${this.maxHp}`, this.x, barY + barHeight / 2);
    }
    
    /**
     * 检查点是否与Boss碰撞
     */
    checkCollision(x, y, radius = 0) {
        const dx = x - this.x;
        const dy = y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.radius + radius);
    }
}

/**
 * ==========================================
 * 👑 香芋大魔王 Boss - Level 15
 * ==========================================
 * 特性：
 * - 8字形运动轨迹
 * - 小病毒冲向Boss（而非玩家）
 * - 吃掉小病毒回血并变大
 * - Q弹的香芋糯米糍外观
 */
export class TaroBroodmotherBoss {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // 初始位置（屏幕中央）
        this.centerX = canvasWidth / 2;
        this.centerY = canvasHeight / 2;
        this.x = this.centerX;
        this.y = this.centerY;
        
        // Boss 属性
        this.maxHp = 100; // 降低血量，使难度更合理
        this.hp = this.maxHp;
        this.baseRadius = 90; // 基础半径
        this.radius = this.baseRadius;
        this.maxRadius = 140; // 吃掉小病毒后的最大半径
        
        // 🐛 吃掉小病毒的成长机制
        this.minionCount = 0; // 已吃掉的小病毒数量
        this.growthPerMinion = 2; // 每吃一个小病毒增长的半径
        
        // 🎵 8字形运动参数
        this.movementTimer = 0;
        this.movementSpeed = 0.8; // 运动速度
        this.movementScaleX = canvasWidth * 0.25; // 8字宽度
        this.movementScaleY = canvasHeight * 0.2; // 8字高度
        
        // 🦠 被动污染机制
        this.passivePollutionLoad = 0;
        
        // 💖 萌系视觉效果
        this.pulseTimer = 0;
        this.flashTime = 0;
        
        // 🐙 软软的触手
        this.tentacleCount = 16;
        this.tentacleOffsets = Array.from({ length: 16 }, () => Math.random() * Math.PI * 2);
        
        console.log('[TaroBoss] 👑 香芋大魔王已生成，初始HP:', this.hp);
    }
    
    /**
     * 更新 Boss 状态
     */
    update(dt) {
        // 💖 呼吸动画
        this.pulseTimer += dt * 0.005;
        
        // 受击闪白
        if (this.flashTime > 0) {
            this.flashTime -= dt;
        }
        
        // 🎵 8字形运动（李萨如曲线）
        this.movementTimer += dt * 0.001 * this.movementSpeed;
        
        // 8字形公式：x = sin(t), y = sin(2t)
        const t = this.movementTimer;
        this.x = this.centerX + Math.sin(t) * this.movementScaleX;
        this.y = this.centerY + Math.sin(2 * t) * this.movementScaleY;
        
        // 🐛 根据吃掉的小病毒数量动态调整半径
        const targetRadius = Math.min(
            this.baseRadius + this.minionCount * this.growthPerMinion,
            this.maxRadius
        );
        // 平滑过渡
        this.radius += (targetRadius - this.radius) * 0.1;
        
        // 🦠 被动污染
        this.passivePollutionLoad += (PASSIVE_POLLUTION_RATE * dt) / 1000;
    }
    
    /**
     * Boss 受到伤害
     */
    takeDamage(damage) {
        this.hp -= damage;
        this.flashTime = 100;
        if (this.hp < 0) this.hp = 0;
        return this.hp <= 0;
    }
    
    /**
     * Boss 吃掉小病毒：回血并变大
     */
    eatMinion(healAmount = 3) {
        this.hp += healAmount;
        if (this.hp > this.maxHp) this.hp = this.maxHp;
        
        this.minionCount++;
        console.log('[TaroBoss] 🍴 吃掉小病毒！当前大小:', this.radius.toFixed(0), 'HP:', this.hp);
    }
    
    /**
     * 获取血量百分比
     */
    getHealthPercent() {
        return this.hp / this.maxHp;
    }
    
    /**
     * 绘制 Boss（香芋糯米糍）
     */
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 1. Q弹呼吸效果
        const scaleX = 1 + Math.sin(this.pulseTimer) * 0.05;
        const scaleY = 1 + Math.cos(this.pulseTimer) * 0.05;
        ctx.scale(scaleX, scaleY);
        const currentRadius = this.radius;
        
        // 2. 绘制软软的触手（在身体后面）
        this.drawSoftTentacles(ctx, currentRadius, this.pulseTimer);
        
        // 3. 绘制本体：香芋糯米糍果冻层
        ctx.beginPath();
        
        // 受击闪白
        if (this.flashTime > 0) {
            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
            ctx.shadowBlur = 40;
        } else {
            // 柔和的香芋色光晕
            ctx.shadowColor = 'rgba(188, 169, 232, 0.6)';
            ctx.shadowBlur = 30;
        }
        
        // 径向渐变主体
        const bodyGradient = ctx.createRadialGradient(0, -currentRadius * 0.2, 0, 0, 0, currentRadius);
        
        if (this.flashTime > 0) {
            bodyGradient.addColorStop(0, '#ffffff');
            bodyGradient.addColorStop(0.6, '#ffffff');
            bodyGradient.addColorStop(1, '#e6d5ff');
        } else {
            bodyGradient.addColorStop(0, '#FFFCE0');   // 顶部高光（奶油色）
            bodyGradient.addColorStop(0.4, '#DCD0FF'); // 主体（浅香芋）
            bodyGradient.addColorStop(1, '#BCA9E8');   // 边缘立体感（深香芋）
        }
        
        ctx.fillStyle = bodyGradient;
        ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // 关闭外阴影
        ctx.shadowBlur = 0;
        
        // 4. 绘制萌萌的大眼睛
        const eyeOffsetX = currentRadius * 0.35;
        const eyeOffsetY = -currentRadius * 0.1;
        const eyeRadius = currentRadius * 0.25;
        
        this.drawEye(ctx, -eyeOffsetX, eyeOffsetY, eyeRadius, currentRadius);
        this.drawEye(ctx, eyeOffsetX, eyeOffsetY, eyeRadius, currentRadius);
        
        // 5. 贪吃的O型嘴巴
        ctx.beginPath();
        ctx.fillStyle = 'rgba(138, 43, 6, 0.7)';
        ctx.arc(0, currentRadius * 0.25, currentRadius * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // 6. 香芋色小腮红
        ctx.fillStyle = 'rgba(188, 169, 232, 0.3)';
        ctx.beginPath();
        ctx.arc(-currentRadius * 0.5, currentRadius * 0.15, currentRadius * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(currentRadius * 0.5, currentRadius * 0.15, currentRadius * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // 绘制血条
        this.drawHealthBar(ctx);
    }
    
    /**
     * 绘制软软的触手（香芋色）
     */
    drawSoftTentacles(ctx, radius, timer) {
        ctx.save();
        ctx.lineWidth = 16;
        ctx.lineCap = 'round';
        
        for (let i = 0; i < this.tentacleCount; i++) {
            const angle = (Math.PI * 2 / this.tentacleCount) * i;
            const offset = this.tentacleOffsets[i];
            
            // 香芋色触手
            ctx.strokeStyle = '#BCA9E8';
            
            const startX = Math.cos(angle) * radius * 0.8;
            const startY = Math.sin(angle) * radius * 0.8;
            
            const waveX = Math.cos(timer * 2 + offset) * 12;
            const waveY = Math.sin(timer * 2.5 + offset) * 12;
            
            const endX = Math.cos(angle) * (radius + 35) + waveX;
            const endY = Math.sin(angle) * (radius + 35) + waveY;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // 触手尖端小圆球
            ctx.fillStyle = '#DCD0FF';
            ctx.beginPath();
            ctx.arc(endX, endY, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    /**
     * 绘制眼睛
     */
    drawEye(ctx, x, y, radius, bossRadius) {
        // 白色眼白
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 黑色瞳孔
        const pupilRadius = radius * 0.5;
        ctx.fillStyle = '#2C1810';
        ctx.beginPath();
        ctx.arc(x, y + radius * 0.1, pupilRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // 白色高光
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(x - pupilRadius * 0.3, y - pupilRadius * 0.3, pupilRadius * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * 绘制血条
     */
    drawHealthBar(ctx) {
        const barWidth = 200;
        const barHeight = 20;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.radius - 50;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // 血条（香芋色渐变）
        const healthPercent = this.hp / this.maxHp;
        const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth * healthPercent, barY);
        gradient.addColorStop(0, '#BCA9E8');
        gradient.addColorStop(1, '#DCD0FF');
        ctx.fillStyle = gradient;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // 边框
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // 血量文字
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`👑 香芋大魔王 HP: ${Math.ceil(this.hp)} / ${this.maxHp}`, this.x, barY + barHeight / 2);
    }
    
    /**
     * 检查点是否与Boss碰撞
     */
    checkCollision(x, y, radius = 0) {
        const dx = x - this.x;
        const dy = y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.radius + radius);
    }
}

/**
 * 🍑 Level 20：凝血巨兽Boss（水蜜桃果冻史莱姆）
 * 触手拉扯机制 - 吸血回复
 */
export class PeachThrombusBoss {
    constructor(canvasWidth, canvasHeight, config = {}) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // Boss配置
        this.maxHp = config.maxHp || 100;
        this.hp = this.maxHp;
        this.healPerMinion = config.healPerMinion || 10;
        this.pullInterval = config.pullInterval || 3000;
        this.pullSpeed = config.pullSpeed || 3.0;
        this.moveSpeed = config.moveSpeed || 1.0;
        this.radius = config.radius || 60;
        this.tentacleColor = config.tentacleColor || '#FF66CC';
        this.bodyColor = config.bodyColor || 'rgba(255, 140, 150, 0.9)';
        
        // 位置（屏幕上方中央）
        this.x = canvasWidth / 2;
        this.y = 100;
        this.targetX = this.x;
        
        // 运动范围
        this.minX = this.radius + 50;
        this.maxX = canvasWidth - this.radius - 50;
        this.moveDirection = 1; // 1=向右，-1=向左
        
        // 拉扯目标
        this.targetVirus = null;
        this.pullTimer = 0;
                // 🦠 被动污染机制：Boss的存在会持续增加免疫系统负荷
        this.passivePollutionLoad = 0; // 累积的等效病毒数量（从0开始）
                // 动画状态
        this.pulseTimer = 0;
        this.flashTime = 0;
        this.scaleMultiplier = 1.0;
        this.hitScaleTimer = 0;
        
        console.log('[PeachBoss] 🍑 凝血巨兽已生成，HP:', this.hp);
    }
    
    /**
     * 更新Boss状态
     */
    update(dt) {
        // 呼吸动效
        this.pulseTimer += dt * 0.002;
        
        // 受击闪白
        if (this.flashTime > 0) {
            this.flashTime -= dt;
        }
        
        // 受击缩放回弹
        if (this.hitScaleTimer > 0) {
            this.hitScaleTimer -= dt;
            const progress = 1 - (this.hitScaleTimer / 200);
            this.scaleMultiplier = 0.9 + 0.1 * progress; // 0.9 -> 1.0
        }
        
        // 🦠 被动污染机制：Boss的存在持续增加免疫负荷
        // 计算公式：每秒增加PASSIVE_POLLUTION_RATE个等效病毒值
        this.passivePollutionLoad += (PASSIVE_POLLUTION_RATE * dt) / 1000;
        
        // 🐛 调试输出（每60帧打印一次，避免刷屏）
        if (!this._pollutionLogCounter) this._pollutionLogCounter = 0;
        this._pollutionLogCounter++;
        if (this._pollutionLogCounter >= 60) {
            console.log('[PeachBoss] 🦠 被动污染负荷:', Math.floor(this.passivePollutionLoad), '/ 999（约', Math.floor(this.passivePollutionLoad / 999 * 100) + '%）');
            this._pollutionLogCounter = 0;
        }
        
        // 左右移动
        this.x += this.moveDirection * this.moveSpeed;
        if (this.x <= this.minX) {
            this.x = this.minX;
            this.moveDirection = 1;
        } else if (this.x >= this.maxX) {
            this.x = this.maxX;
            this.moveDirection = -1;
        }
        
        // 拉扯计时器
        this.pullTimer += dt;
    }
    
    /**
     * 尝试拉扯病毒
     */
    tryPullVirus(viruses) {
        if (this.pullTimer < this.pullInterval) return null;
        if (this.targetVirus) return null; // 已有目标
        
        // 随机选择一个存活病毒
        const aliveViruses = viruses.filter(v => !v.isTutorial && !v.tutorialLock && !v.isMinionMode);
        if (aliveViruses.length === 0) return null;
        
        this.targetVirus = aliveViruses[Math.floor(Math.random() * aliveViruses.length)];
        this.pullTimer = 0;
        
        console.log('[PeachBoss] 🍑 开始拉扯病毒！');
        return this.targetVirus;
    }
    
    /**
     * 拉扯目标病毒
     */
    pullTargetVirus(dt) {
        if (!this.targetVirus) return null;
        
        // 计算方向
        const dx = this.x - this.targetVirus.x;
        const dy = this.y - this.targetVirus.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 检查是否到达Boss
        if (distance < this.radius + this.targetVirus.radius) {
            // 病毒被吃掉
            const eaten = this.targetVirus;
            this.targetVirus = null;
            this.heal(this.healPerMinion);
            console.log('[PeachBoss] 🍴 吃掉病毒！回血:', this.healPerMinion, '当前HP:', this.hp);
            return { eaten: eaten, immuneDamage: this.healPerMinion };
        }
        
        // 拉扯病毒向Boss
        const frameNormalization = dt / 16.67;
        const pullForceX = (dx / distance) * this.pullSpeed * frameNormalization;
        const pullForceY = (dy / distance) * this.pullSpeed * frameNormalization;
        
        this.targetVirus.x += pullForceX;
        this.targetVirus.y += pullForceY;
        
        // 覆盖病毒的正常运动
        this.targetVirus.vx = 0;
        this.targetVirus.vy = 0;
        
        return null;
    }
    
    /**
     * 清除拉扯目标（病毒被玩家击杀）
     */
    clearTarget(virus) {
        if (this.targetVirus === virus) {
            this.targetVirus = null;
            console.log('[PeachBoss] 🎯 拉扯目标被击杀！');
        }
    }
    
    /**
     * Boss受到伤害
     */
    takeDamage(damage) {
        this.hp -= damage;
        this.flashTime = 100;
        this.hitScaleTimer = 200; // 触发Q弹动画
        this.scaleMultiplier = 0.9;
        
        if (this.hp < 0) this.hp = 0;
        return this.hp <= 0;
    }
    
    /**
     * Boss回血
     */
    heal(amount) {
        this.hp += amount;
        if (this.hp > this.maxHp) this.hp = this.maxHp;
    }
    
    /**
     * 获取血量百分比
     */
    getHealthPercent() {
        return this.hp / this.maxHp;
    }
    
    /**
     * 绘制Boss
     */
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 呼吸缩放
        const breathScale = 1 + Math.sin(this.pulseTimer) * 0.08;
        ctx.scale(breathScale * this.scaleMultiplier, breathScale * this.scaleMultiplier);
        
        // 发光效果
        ctx.shadowColor = '#FFB6C1';
        ctx.shadowBlur = 20;
        
        // 绘制水蜜桃果冻史莱姆（多个重叠圆）
        const bodyColor = this.flashTime > 0 ? '#FFF' : this.bodyColor;
        
        // 主体（大圆）
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 左右两个肉肉
        ctx.beginPath();
        ctx.arc(-this.radius * 0.6, this.radius * 0.3, this.radius * 0.5, 0, Math.PI * 2);
        ctx.arc(this.radius * 0.6, this.radius * 0.3, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // 顶部小凸起
        ctx.beginPath();
        ctx.arc(0, -this.radius * 0.5, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // 渐变光泽
        const gradient = ctx.createRadialGradient(
            -this.radius * 0.3, -this.radius * 0.3, 0,
            0, 0, this.radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(0.5, 'rgba(255, 180, 190, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 100, 120, 0.1)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 去除阴影，绘制表情
        ctx.shadowBlur = 0;
        
        // 眼睛
        ctx.fillStyle = '#333';
        const eyeOffsetX = this.radius * 0.3;
        const eyeOffsetY = -this.radius * 0.15;
        const eyeSize = this.radius * 0.15;
        ctx.beginPath();
        ctx.arc(-eyeOffsetX, eyeOffsetY, eyeSize, 0, Math.PI * 2);
        ctx.arc(eyeOffsetX, eyeOffsetY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 嘴巴（邪恶微笑）
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, this.radius * 0.2, this.radius * 0.3, 0.3, Math.PI - 0.3);
        ctx.stroke();
        
        ctx.restore();
        
        // 绘制触手连线（如果有拉扯目标）
        if (this.targetVirus) {
            this.drawTentacle(ctx, this.targetVirus);
        }
        
        // 绘制血条
        this.drawHealthBar(ctx);
    }
    
    /**
     * 绘制触手连线
     */
    drawTentacle(ctx, virus) {
        ctx.save();
        
        // 泡泡糖粉色粗线
        ctx.strokeStyle = this.tentacleColor;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.shadowColor = this.tentacleColor;
        ctx.shadowBlur = 10;
        
        // 绘制曲线（贝塞尔曲线）
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.radius * 0.5);
        
        // 控制点（制造弧度）
        const midX = (this.x + virus.x) / 2;
        const midY = (this.y + virus.y) / 2 + 50; // 向下弯曲
        
        ctx.quadraticCurveTo(midX, midY, virus.x, virus.y);
        ctx.stroke();
        
        ctx.restore();
    }
    
    /**
     * 绘制血条
     */
    drawHealthBar(ctx) {
        const barWidth = 150;
        const barHeight = 20;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.radius - 40;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // 血量（蜜桃粉渐变）
        const healthPercent = this.getHealthPercent();
        const healthWidth = barWidth * healthPercent;
        
        const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
        gradient.addColorStop(0, '#FF8BAE');
        gradient.addColorStop(1, '#FF6B9D');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(barX, barY, healthWidth, barHeight);
        
        // 边框
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // 血量文字
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`🍑 凝血巨兽 HP: ${Math.ceil(this.hp)} / ${this.maxHp}`, this.x, barY + barHeight / 2);
    }
    
    /**
     * 检查点是否与Boss碰撞
     */
    checkCollision(x, y, radius = 0) {
        const dx = x - this.x;
        const dy = y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.radius + radius);
    }
}
