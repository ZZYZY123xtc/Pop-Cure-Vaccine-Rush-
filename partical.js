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
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // 增加一点空气阻力，让爆炸更有质感
        this.vx *= 0.95;
        this.vy *= 0.95;
        
        this.life -= this.decay;
        this.size *= 0.95; // 慢慢变小
    }

    draw(ctx) {
        if (this.life <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life); // 设置透明度
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}