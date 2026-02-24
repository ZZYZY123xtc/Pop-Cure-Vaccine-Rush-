import { CONFIG } from '../core/config.js';
import { applyNeonStyle } from '../systems/effects.js';

// 🌌 病毒唯一ID生成器（用于传送门冷却追踪）
let virusIdCounter = 0;

export class Virus {
    constructor(x, y, typeKey, difficultyMultiplier = 1.0, targetX = null, targetY = null) {
        this.id = virusIdCounter++; // 🌌 分配唯一ID
        this.x = x;
        this.y = y;
        this.typeKey = typeKey;
        this.props = CONFIG.VIRUS_TYPES[typeKey];
        
        this.hp = this.props.hp;
        this.radius = this.props.radius;
        this.maxSplitTime = this.props.splitTime;
        this.splitTimer = this.maxSplitTime;
        this.isTethered = false;
        this.tetheredPairId = null;
        this.isEnraged = false;
        
        // 🔥 应用难度倍率到速度（修复Type C速度丢失问题）
        this.difficultyMultiplier = difficultyMultiplier; // 保存以便分裂时使用
        const finalSpeed = this.props.speed * difficultyMultiplier;
        
        // 👑 Level 10 Boss战：小怪向心冲锋
        if (targetX !== null && targetY !== null) {
            const dx = targetX - x;
            const dy = targetY - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            // 归一化方向向量，朝向目标
            this.vx = (dx / distance) * finalSpeed;
            this.vy = (dy / distance) * finalSpeed;
            this.isMinionMode = true; // 标记为小怪模式
        } else {
            // 普通模式：随机方向
            const angle = Math.random() * Math.PI * 2;
            this.vx = Math.cos(angle) * finalSpeed;
            this.vy = Math.sin(angle) * finalSpeed;
            this.isMinionMode = false;
        }
        
        this.flashTime = 0;
        this.pulseOffset = Math.random() * 100;
        this.blinkTimer = Math.random() * 2000;
        
        // 旋转角度 (Type B 和 C 用)
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.05; // 基础旋转速度
        if (this.typeKey === 'C') this.rotSpeed *= 4; // Type C 转得快
        
        // 🌪️ Level 11 湍流相位（用于S型走位）
        this.turbulencePhase = Math.random() * Math.PI * 2; // 随机起始相位，避免所有病毒同步
        
        // 🍑 Level 16 红细胞载具
        this.isRidingRaft = false; // 是否搭载红细胞
        this.raftConfig = null;    // 载具配置
        this.originalSpeedX = this.vx; // 保存原始X速度
        this.originalSpeedY = this.vy; // 保存原始Y速度

        // 🍦 Level 23：节奏判定视觉状态
        this.visualAlpha = 1.0;
        this.shakeTimer = 0;
    }

    update(dt, canvasWidth, canvasHeight, windForceX = 0, inMucus = false, hasTurbulence = false, turbulenceConfig = null) {
        // 🚀 禁止主线程阻塞：冰冻状态下立即返回，不执行任何运动逻辑
        // 注意：这是双重保险，game-loop也会跳过update调用
        if (window.skillManager && window.skillManager.isFrozen) {
            return; // ❄️ 冰冻中，不移动
        }
        
        // 🍦 Level 23：定身状态下不移动
        if (this.isStunned) {
            // 只更新计时器，不移动
            this.splitTimer -= dt;
            if (this.flashTime > 0) this.flashTime -= dt;
            this.rotation += this.rotSpeed;
            this.blinkTimer -= dt;
            if (this.blinkTimer < -200) this.blinkTimer = Math.random() * 2000 + 1000;
            return;
        }
        
        // ✅ 基于时间的平滑移动（标准化到60fps，避免帧率波动导致卡顿）
        const frameNormalization = dt / 16.67;  // 16.67ms ≈ 60fps
        
        // 🧪 Level 7：黏液减速效果（70%减速，即保留30%速度）
        const mucusSlowFactor = inMucus ? 0.3 : 1.0;
        const enragedSpeedYFactor = this.isEnraged ? 3 : 1;
        
        // 🌪️ Level 11：湍流S型走位（柔和的正弦波偏移）
        let turbulenceOffsetX = 0;
        let turbulenceSpeedBoost = 1.0; // 气旋加速倍率
        if (hasTurbulence && turbulenceConfig) {
            // 使用病毒的 y 坐标和时间来计算 S 型偏移
            // 频率决定弯曲的速度，振幅决定左右摆动的距离
            const frequency = turbulenceConfig.frequency || 0.003;
            const amplitude = turbulenceConfig.amplitude || 200; // 🔥 大幅增加振幅：80 → 200
            
            // 核心公式：Math.sin(y坐标 * 频率 + 时间相位) * 振幅
            // 这样不同病毒会因为y坐标不同而走出不同相位的S型
            const phase = this.y * frequency + this.turbulencePhase;
            turbulenceOffsetX = Math.sin(phase) * amplitude * frameNormalization;
            
            // 🌀 刮风时整体下落速度提升2倍
            turbulenceSpeedBoost = 2.0;
        }
        
        // 病毒自身移动（应用黏液减速 + 湍流偏移 + 气旋加速）
        this.x += (this.vx * mucusSlowFactor + turbulenceOffsetX) * frameNormalization;
        this.y += this.vy * frameNormalization * mucusSlowFactor * turbulenceSpeedBoost * enragedSpeedYFactor;
        
        // 🌬️ 风力影响（叠加到水平位置，2.0阻力系数提供强推背感）
        if (windForceX !== 0) {
            this.x += windForceX * 2.0 * frameNormalization * 0.01;
        }

        // 👑 小怪模式：不反弹，直线冲向Boss，超出屏幕则销毁
        if (this.isMinionMode) {
            // 不做反弹处理，让game-loop.js检测并清理超出屏幕的小怪
            // 继续倒计时和旋转等视觉效果
            this.splitTimer -= dt;
            if (this.flashTime > 0) this.flashTime -= dt;
            this.rotation += this.rotSpeed;
            this.blinkTimer -= dt;
            if (this.blinkTimer < -200) this.blinkTimer = Math.random() * 2000 + 1000;
            return;
        }

        // 反弹 - 使用绝对值强制方向，避免反向bug
        if (this.x - this.radius < 0) { 
            this.x = this.radius; 
            this.vx = Math.abs(this.vx); // 强制向右
        }
        else if (this.x + this.radius > canvasWidth) { 
            this.x = canvasWidth - this.radius; 
            this.vx = -Math.abs(this.vx); // 强制向左
        }
        if (this.y - this.radius < 0) { 
            this.y = this.radius; 
            this.vy = Math.abs(this.vy); // 强制向下
        }
        else if (this.y + this.radius > canvasHeight) { 
            this.y = canvasHeight - this.radius; 
            this.vy = -Math.abs(this.vy); // 强制向上
        }

        this.splitTimer -= dt;
        if (this.flashTime > 0) this.flashTime -= dt;
        
        // 更新旋转
        this.rotation += this.rotSpeed;

        // 眨眼倒计时
        this.blinkTimer -= dt;
        if (this.blinkTimer < -200) this.blinkTimer = Math.random() * 2000 + 1000;

        // 震动反馈计时
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
            if (this.shakeTimer < 0) this.shakeTimer = 0;
        }
    }

    shouldSplit() { 
        // 👑 小怪模式不分裂
        if (this.isMinionMode) return false;
        return this.splitTimer <= 0; 
    }

    split() {
        const babies = [];
        for (let i = 0; i < this.props.splitCount; i++) {
            // 🔥 分裂后的小病毒也应用相同的难度倍率
            const baby = new Virus(this.x, this.y, this.typeKey, this.difficultyMultiplier);
            baby.vx += (Math.random() - 0.5) * 3; // 分裂时炸得更开一点
            baby.vy += (Math.random() - 0.5) * 3;
            babies.push(baby);
        }
        return babies;
    }

    hit() {
        this.hp--;
        this.flashTime = 100;
        return this.hp <= 0;
    }

    getRenderColor() {
        return this.isEnraged ? '#FF6A00' : this.props.color;
    }

    draw(ctx, isNightMode = false, inMucus = false, totalViruses = 0) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Level 23：未充能稍暗、充能全亮
        if (typeof this.visualAlpha === 'number') {
            ctx.globalAlpha *= this.visualAlpha;
        }

        // 轻微震动反馈（未充能被点/被射线掠过）
        if (this.shakeTimer > 0) {
            const shakeStrength = (this.shakeTimer / 120) * 2.5;
            ctx.translate((Math.random() - 0.5) * shakeStrength, (Math.random() - 0.5) * shakeStrength);
        }
        
        // 🍑 Level 16：绘制红细胞载具（水润的蜜桃粉甜甜圈）
        if (this.isRidingRaft && this.raftConfig) {
            ctx.save();
            const raftRadius = this.radius * (this.raftConfig.raftRadius || 1.2);
            ctx.beginPath();
            ctx.arc(0, 0, raftRadius, 0, Math.PI * 2);
            ctx.lineWidth = this.raftConfig.raftLineWidth || 4;
            ctx.strokeStyle = this.raftConfig.raftColor || 'rgba(255, 140, 150, 0.9)';
            // 添加软弹感的发光效果
            ctx.shadowColor = 'rgba(255, 140, 150, 0.6)';
            ctx.shadowBlur = 12;
            ctx.stroke();
            // 内圈光晕增强果冻透亮感
            ctx.beginPath();
            ctx.arc(0, 0, raftRadius - 2, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 180, 190, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }

        // 🔥 性能优化：当病毒数量>30时关闭shadowBlur提升GPU性能
        const enableShadow = totalViruses <= 30;

        if (this.isEnraged) {
            const flicker = 0.5 + Math.sin(Date.now() / 60 + this.pulseOffset) * 0.5;
            const auraRadius = this.radius * (1.35 + flicker * 0.2);
            ctx.save();
            ctx.beginPath();
            ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 80, 20, ${0.18 + flicker * 0.2})`;
            ctx.fill();
            if (enableShadow) {
                ctx.shadowColor = 'rgba(255, 90, 0, 0.9)';
                ctx.shadowBlur = 18;
            }
            ctx.lineWidth = 2;
            ctx.strokeStyle = `rgba(255, 170, 60, ${0.7 + flicker * 0.3})`;
            ctx.stroke();
            ctx.restore();
        }

        // 🧪 Level 7：先绘制黏液膜包裹效果（在病毒形状之前）
        if (inMucus && enableShadow) {
            ctx.save();
            // 绿色半透明软膜，半径略大于病毒
            const membraneRadius = this.radius + 6;
            ctx.beginPath();
            ctx.arc(0, 0, membraneRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(150, 255, 150, 0.35)';
            ctx.fill();
            // 添加绿色发光效果（只在低病毒数时）
            ctx.shadowColor = 'rgba(150, 255, 150, 0.6)';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = 'rgba(180, 255, 180, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        } else if (inMucus) {
            // 高病毒数时的简化版本（无阴影）
            ctx.save();
            const membraneRadius = this.radius + 6;
            ctx.beginPath();
            ctx.arc(0, 0, membraneRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(150, 255, 150, 0.35)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(180, 255, 180, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }

        // 全局呼吸效果
        const pulse = 1 + Math.sin((Date.now() / 250) + this.pulseOffset) * 0.08;
        ctx.scale(pulse, pulse);

        // 🌑 Level 8：霓虹模式样式设置
        if (isNightMode) {
            applyNeonStyle(ctx, this.typeKey);
        } else {
            // 设置通用样式
            ctx.fillStyle = this.flashTime > 0 ? '#fff' : this.getRenderColor();
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(0,0,0,0.1)'; // 柔和描边
            ctx.lineJoin = 'round';
        }

        // --- 根据类型绘制不同形状 ---
        if (this.typeKey === 'A') {
            this.drawTypeA(ctx, isNightMode, enableShadow);
        } else if (this.typeKey === 'B') {
            this.drawTypeB(ctx, isNightMode, enableShadow);
        } else if (this.typeKey === 'C') {
            this.drawTypeC(ctx, isNightMode);
        }

        // 绘制表情 (在形状之上) - 霓虹模式不显示表情
        if (!isNightMode) {
            this.drawFace(ctx);
        }

        // 绘制分裂倒计时圈
        ctx.restore(); // 恢复坐标系，避免圈跟着形状转
        this.drawTimer(ctx, isNightMode);
    }

    // 🦠 Type A: 冠状软糖 (球体 + 周围一圈小肉球)
    drawTypeA(ctx, isNightMode = false, enableShadow = true) {
        // 1. 主体
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.8, 0, Math.PI * 2);
        if (isNightMode) {
            ctx.stroke(); // 霓虹模式：只描边
        } else {
            ctx.fill();
            ctx.stroke();
        }

        // 2. 突触 (像花瓣一样围一圈)
        const bumps = 8;
        for (let i = 0; i < bumps; i++) {
            const angle = (Math.PI * 2 / bumps) * i;
            const bx = Math.cos(angle) * this.radius;
            const by = Math.sin(angle) * this.radius;
            
            ctx.beginPath();
            ctx.arc(bx, by, this.radius * 0.25, 0, Math.PI * 2);
            if (isNightMode) {
                ctx.stroke(); // 霓虹模式：只描边
            } else {
                ctx.fillStyle = this.flashTime > 0 ? '#fff' : this.getRenderColor(); // 确保突触也变色
                ctx.fill();
                // 稍微加深突触的描边
                ctx.strokeStyle = 'rgba(0,0,0,0.05)';
                ctx.stroke();
            }
        }
    }

    // 🛡️ Type B: 聚合体细胞 (中心圆 + 周围小圆)
    drawTypeB(ctx, isNightMode = false, enableShadow = true) {
        ctx.rotate(this.rotation); // 缓慢自转

        // 中心的大圆
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2);
        if (isNightMode) {
            ctx.stroke();
        } else {
            ctx.fillStyle = this.flashTime > 0 ? '#fff' : this.getRenderColor();
            ctx.fill();
            ctx.stroke();
        }

        // 周围的小圆（聚合体效果）
        const circleCount = 7;
        const smallRadius = this.radius * 0.35;
        for (let i = 0; i < circleCount; i++) {
            const angle = (Math.PI * 2 / circleCount) * i;
            const cx = Math.cos(angle) * (this.radius * 0.65);
            const cy = Math.sin(angle) * (this.radius * 0.65);
            
            ctx.beginPath();
            ctx.arc(cx, cy, smallRadius, 0, Math.PI * 2);
            if (isNightMode) {
                ctx.stroke();
            } else {
                ctx.fillStyle = this.flashTime > 0 ? '#fff' : this.getRenderColor();
                ctx.fill();
                ctx.stroke();
            }
        }
    }

    // ⚡ Type C: 圆角四角星 (像手里剑，有危险感)
    drawTypeC(ctx, isNightMode = false) {
        ctx.rotate(this.rotation); // 快速自转

        // 绘制圆角四角星（手里剑形状）
        this.drawRoundedStar(ctx, 0, 0, this.radius);
        if (isNightMode) {
            ctx.stroke();
        } else {
            ctx.fillStyle = this.flashTime > 0 ? '#fff' : this.getRenderColor();
            ctx.fill();
            ctx.stroke();
        }
    }

    // 辅助工具：绘制圆角多边形
    drawRoundedPoly(ctx, x, y, radius, sides, cornerRadius) {
        ctx.beginPath();
        const angleStep = (Math.PI * 2) / sides;
        
        for (let i = 0; i <= sides; i++) {
            const angle = i * angleStep;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            
            const nextAngle = (i + 1) * angleStep;
            const nextPx = x + Math.cos(nextAngle) * radius;
            const nextPy = y + Math.sin(nextAngle) * radius;

            // 使用贝塞尔曲线连接各个顶点来实现圆角
            if (i === 0) ctx.moveTo((px + nextPx)/2, (py + nextPy)/2);
            else ctx.quadraticCurveTo(px, py, (px + nextPx)/2, (py + nextPy)/2);
        }
        ctx.closePath();
    }

    // 辅助工具：绘制圆角四角星（手里剑形状）
    drawRoundedStar(ctx, x, y, radius) {
        ctx.beginPath();
        const points = 4; // 四个角
        const angleStep = (Math.PI * 2) / points;
        
        for (let i = 0; i < points; i++) {
            const angle = i * angleStep - Math.PI / 2; // 从上方开始
            
            // 外点（星的尖端）
            const outerX = x + Math.cos(angle) * radius;
            const outerY = y + Math.sin(angle) * radius;
            
            // 下一个角的位置
            const nextAngle = angle + angleStep;
            const nextOuterX = x + Math.cos(nextAngle) * radius;
            const nextOuterY = y + Math.sin(nextAngle) * radius;
            
            // 中间的内点（创建V形缺口）
            const midAngle = angle + angleStep / 2;
            const innerX = x + Math.cos(midAngle) * (radius * 0.5);
            const innerY = y + Math.sin(midAngle) * (radius * 0.5);
            
            if (i === 0) {
                ctx.moveTo(outerX, outerY);
            } else {
                ctx.lineTo(outerX, outerY);
            }
            
            // 用二次贝塞尔曲线创建圆角
            ctx.quadraticCurveTo(innerX, innerY, nextOuterX, nextOuterY);
        }
        
        ctx.closePath();
    }

    drawFace(ctx) {
        // 如果旋转了，表情要反向旋转回来，保持正立（或者跟随旋转看你喜好，这里保持正立比较可爱）
        // Type B 和 C 会旋转，所以需要 save/restore 取消旋转
        if (this.typeKey === 'B' || this.typeKey === 'C') {
             ctx.rotate(-this.rotation);
        }

        ctx.fillStyle = '#333';
        const eyeOffsetX = this.radius * 0.25;
        const eyeOffsetY = -this.radius * 0.1;
        const eyeSize = this.radius * 0.12;

        // 眨眼
        if (this.blinkTimer < 0) {
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#333';
            ctx.beginPath();
            ctx.moveTo(-eyeOffsetX - eyeSize, eyeOffsetY);
            ctx.lineTo(-eyeOffsetX + eyeSize, eyeOffsetY);
            ctx.moveTo(eyeOffsetX - eyeSize, eyeOffsetY);
            ctx.lineTo(eyeOffsetX + eyeSize, eyeOffsetY);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(-eyeOffsetX, eyeOffsetY, eyeSize, 0, Math.PI * 2);
            ctx.arc(eyeOffsetX, eyeOffsetY, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // 嘴巴
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#333';
        ctx.lineCap = 'round';

        if (this.typeKey === 'A') { 
            ctx.arc(0, 0, this.radius * 0.2, 0.2, Math.PI - 0.2); 
        } else if (this.typeKey === 'B') { 
            // 呆萌小嘴
            ctx.moveTo(-this.radius * 0.1, this.radius * 0.2);
            ctx.lineTo(this.radius * 0.1, this.radius * 0.2);
        } else { 
            // 紧张嘴
            ctx.arc(0, this.radius * 0.25, this.radius * 0.1, Math.PI, 0);
        }
        ctx.stroke();
    }

    drawTimer(ctx, isNightMode = false) {
        if (this.flashTime > 0) return;
        
        ctx.save();
        ctx.translate(this.x, this.y); 
        
        const percent = Math.max(0, this.splitTimer / this.maxSplitTime);
        
        // 临界闪烁效果：如果正在闪烁，改变圈圈颜色
        let timerColor = this.getRenderColor();
        let timerAlpha = 0.4;
        
        // 🌑 霓虹模式：使用发光颜色
        if (isNightMode) {
            switch (this.typeKey) {
                case 'A': timerColor = '#00f0ff'; break;
                case 'B': timerColor = '#64ff64'; break;
                case 'C': timerColor = '#ff50ff'; break;
            }
            timerAlpha = 0.8;
        }
        
        if (this.nearSplitFlash && this.nearSplitFlash > 0) {
            // 闪烁时变成粉红色，透明度也变化
            timerColor = isNightMode ? '#ff00ff' : '#FF69B4';
            timerAlpha = 0.6 + Math.sin((300 - this.nearSplitFlash) * 0.02) * 0.4;
        }
        
        ctx.strokeStyle = timerColor;
        ctx.lineWidth = 4;
        ctx.globalAlpha = timerAlpha;
        
        // 🌑 霓虹模式：添加发光效果（在低病毒数时）
        // 注意：不使用enableShadow变量，因为它不在作用域内
        if (isNightMode) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = timerColor;
        }
        
        ctx.beginPath();
        // 半径稍微大一点包住那些突触
        const ringRadius = this.typeKey === 'A' ? this.radius + 8 : this.radius + 6;
        ctx.arc(0, 0, ringRadius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * percent));
        ctx.stroke();
        ctx.restore();
    }

    /**
     * 🍑 Level 16：移除红细胞载具
     * @returns {boolean} 是否成功移除载具
     */
    removeRaft() {
        if (!this.isRidingRaft) return false;
        
        this.isRidingRaft = false;
        // 失去载具后，整体速度激增1.5倍
        const speedMultiplier = (this.raftConfig && this.raftConfig.speedMultiplier) ? this.raftConfig.speedMultiplier : 1.5;
        this.vx = this.originalSpeedX * speedMultiplier;
        this.vy = this.originalSpeedY * speedMultiplier;
        console.log('[Virus] 🍑 红细胞载具被击落！速度提升至', speedMultiplier, '倍');
        return true;
    }
    
    // 静态方法：绘制病毒在预览 Canvas 中（用于图鉴）
    static drawPreview(ctx, typeKey, centerX, centerY, scale = 1.0) {
        const virus = new Virus(0, 0, typeKey);  // 创建在原点
        ctx.save();
        ctx.translate(centerX, centerY);  // 移动到目标位置
        ctx.scale(scale, scale);  // 缩放
        virus.draw(ctx);
        ctx.restore();
    }
}
