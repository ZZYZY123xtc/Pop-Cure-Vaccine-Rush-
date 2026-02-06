import { CONFIG } from '../core/config.js';

export class Virus {
    constructor(x, y, typeKey) {
        this.x = x;
        this.y = y;
        this.typeKey = typeKey;
        this.props = CONFIG.VIRUS_TYPES[typeKey];
        
        this.hp = this.props.hp;
        this.radius = this.props.radius;
        this.maxSplitTime = this.props.splitTime;
        this.splitTimer = this.maxSplitTime;
        
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * this.props.speed;
        this.vy = Math.sin(angle) * this.props.speed;
        
        this.flashTime = 0;
        this.pulseOffset = Math.random() * 100;
        this.blinkTimer = Math.random() * 2000;
        
        // 旋转角度 (Type B 和 C 用)
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.05; // 基础旋转速度
        if (this.typeKey === 'C') this.rotSpeed *= 4; // Type C 转得快
    }

    update(dt, canvasWidth, canvasHeight) {
        this.x += this.vx;
        this.y += this.vy;

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
    }

    shouldSplit() { return this.splitTimer <= 0; }

    split() {
        const babies = [];
        for (let i = 0; i < this.props.splitCount; i++) {
            const baby = new Virus(this.x, this.y, this.typeKey);
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

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // 全局呼吸效果
        const pulse = 1 + Math.sin((Date.now() / 250) + this.pulseOffset) * 0.08;
        ctx.scale(pulse, pulse);

        // 设置通用样式
        ctx.fillStyle = this.flashTime > 0 ? '#fff' : this.props.color;
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0,0,0,0.1)'; // 柔和描边
        ctx.lineJoin = 'round';

        // --- 根据类型绘制不同形状 ---
        if (this.typeKey === 'A') {
            this.drawTypeA(ctx);
        } else if (this.typeKey === 'B') {
            this.drawTypeB(ctx);
        } else if (this.typeKey === 'C') {
            this.drawTypeC(ctx);
        }

        // 绘制表情 (在形状之上)
        this.drawFace(ctx);

        // 绘制分裂倒计时圈
        ctx.restore(); // 恢复坐标系，避免圈跟着形状转
        this.drawTimer(ctx);
    }

    // 🦠 Type A: 冠状软糖 (球体 + 周围一圈小肉球)
    drawTypeA(ctx) {
        // 1. 主体
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 2. 突触 (像花瓣一样围一圈)
        const bumps = 8;
        for (let i = 0; i < bumps; i++) {
            const angle = (Math.PI * 2 / bumps) * i;
            const bx = Math.cos(angle) * this.radius;
            const by = Math.sin(angle) * this.radius;
            
            ctx.beginPath();
            ctx.arc(bx, by, this.radius * 0.25, 0, Math.PI * 2);
            ctx.fillStyle = this.flashTime > 0 ? '#fff' : this.props.color; // 确保突触也变色
            ctx.fill();
            // 稍微加深突触的描边
            ctx.strokeStyle = 'rgba(0,0,0,0.05)';
            ctx.stroke();
        }
    }

    // 🛡️ Type B: 聚合体细胞 (中心圆 + 周围小圆)
    drawTypeB(ctx) {
        ctx.rotate(this.rotation); // 缓慢自转

        // 中心的大圆
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = this.flashTime > 0 ? '#fff' : this.props.color;
        ctx.fill();
        ctx.stroke();

        // 周围的小圆（聚合体效果）
        const circleCount = 7;
        const smallRadius = this.radius * 0.35;
        for (let i = 0; i < circleCount; i++) {
            const angle = (Math.PI * 2 / circleCount) * i;
            const cx = Math.cos(angle) * (this.radius * 0.65);
            const cy = Math.sin(angle) * (this.radius * 0.65);
            
            ctx.beginPath();
            ctx.arc(cx, cy, smallRadius, 0, Math.PI * 2);
            ctx.fillStyle = this.flashTime > 0 ? '#fff' : this.props.color;
            ctx.fill();
            ctx.stroke();
        }
    }

    // ⚡ Type C: 圆角四角星 (像手里剑，有危险感)
    drawTypeC(ctx) {
        ctx.rotate(this.rotation); // 快速自转

        // 绘制圆角四角星（手里剑形状）
        this.drawRoundedStar(ctx, 0, 0, this.radius);
        ctx.fillStyle = this.flashTime > 0 ? '#fff' : this.props.color;
        ctx.fill();
        ctx.stroke();
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

    drawTimer(ctx) {
        if (this.flashTime > 0) return;
        
        ctx.save();
        ctx.translate(this.x, this.y); 
        
        const percent = Math.max(0, this.splitTimer / this.maxSplitTime);
        
        // 临界闪烁效果：如果正在闪烁，改变圈圈颜色
        let timerColor = this.props.color;
        let timerAlpha = 0.4;
        
        if (this.nearSplitFlash && this.nearSplitFlash > 0) {
            // 闪烁时变成粉红色，透明度也变化
            timerColor = '#FF69B4';
            timerAlpha = 0.6 + Math.sin((300 - this.nearSplitFlash) * 0.02) * 0.4;
        }
        
        ctx.strokeStyle = timerColor;
        ctx.lineWidth = 4;
        ctx.globalAlpha = timerAlpha;
        ctx.beginPath();
        // 半径稍微大一点包住那些突触
        const ringRadius = this.typeKey === 'A' ? this.radius + 8 : this.radius + 6;
        ctx.arc(0, 0, ringRadius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * percent));
        ctx.stroke();
        ctx.restore();
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