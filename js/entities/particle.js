export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        // 爆炸是向四面八方炸开的
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 2; // 随机爆炸速度
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.life = 1.0; // 生命值 1.0 -> 0.0
        this.decay = Math.random() * 0.03 + 0.02; // 消失速度
        this.size = Math.random() * 3 + 2;
        
        // 支持文字粒子
        this.text = null; // 文字内容
    }

    update(dt = 16.67) {
        // ✅ 基于时间的平滑移动
        const frameNormalization = dt / 16.67;
        this.x += this.vx * frameNormalization;
        this.y += this.vy * frameNormalization;
        
        // 增加一点空气阻力，让爆炸更有质感
        this.vx *= 0.95;
        this.vy *= 0.95;
        
        this.life -= this.decay * frameNormalization;
        if (!this.text) this.size *= 0.95; // 普通粒子慢慢变小，文字粒子不变小
    }

    draw(ctx) {
        if (this.life <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life); // 设置透明度
        
        if (this.text) {
            // 绘制文字粒子
            ctx.fillStyle = this.color;
            ctx.font = `${this.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // 添加文字描边让它更清晰
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            
            // 支持多行文字
            const lines = this.text.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const lineY = this.y + (i - (lines.length - 1) / 2) * (this.size + 2);
                ctx.strokeText(lines[i], this.x, lineY);
                ctx.fillText(lines[i], this.x, lineY);
            }
        } else {
            // 绘制普通圆形粒子
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}