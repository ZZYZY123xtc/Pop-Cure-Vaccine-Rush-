/**
 * ==========================================
 * 🌬️ 萌系生物气流特效系统 (WindEffectSystem)
 * ==========================================
 * 风格：柔软、湿润、半透明的生物体内气流。
 * 作用：在第6关【剧烈喘息】和第11关【气旋湍流】中可视化风力。
 * 
 * 第6关：蓝白色矩形粒子（原版）
 * 第11关：香芋色贝塞尔丝带（马卡龙萌系）
 */
export class WindEffectSystem {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.particles = [];
        this.ribbons = [];  // 🌪️ Level 11 专用：贝塞尔丝带
        this.isActive = false; // 风是否在吹
        this.currentWindForce = 0; // 当前风力缓存
        this.effectStyle = 'default'; // 当前特效风格（default 或 taro）

        // 配置参数（可以微调）
        this.config = {
            particleCount: 60,    // 粒子数量（越多越密集）
            baseSpeed: 120,       // 粒子的基础流动速度（降低以减少视觉误差）
            colorPalette: [       // 萌系生物感的配色（浅蓝、乳白、淡紫）
                'rgba(220, 245, 255, 0.4)', // 湿润浅蓝
                'rgba(255, 255, 255, 0.3)', // 纯净乳白
                'rgba(230, 230, 255, 0.2)'  // 梦幻淡紫
            ],
            // 🌪️ Level 11 香芋色配色
            taroColorPalette: [
                'rgba(255, 255, 255, 0.4)',   // 奶油白
                'rgba(220, 208, 255, 0.4)',   // 柔和香芋色
                'rgba(188, 169, 232, 0.3)'    // 主色调香芋紫
            ]
        };

        this.initParticles();
    }

    // 初始化粒子池
    initParticles() {
        for (let i = 0; i < this.config.particleCount; i++) {
            this.particles.push(this.createParticle(true));
        }
    }

    // 创建单个气流粒子
    createParticle(randomX = false) {
        // 根据当前特效风格选择颜色板
        const palette = this.effectStyle === 'taro' 
            ? this.config.taroColorPalette 
            : this.config.colorPalette;
        const color = palette[Math.floor(Math.random() * palette.length)];
        
        // 粒子长度随机，制造错落感
        const length = 40 + Math.random() * 80; 
        // 粒子厚度随机，看起来软软的
        const thickness = 4 + Math.random() * 6; 
        
        return {
            x: randomX ? Math.random() * this.width : (this.currentWindForce > 0 ? -length : this.width + length),
            y: Math.random() * this.height,
            length: length,
            thickness: thickness,
            speedVariation: 0.5 + Math.random() * 1.5, // 每个粒子的速度差异，更自然
            color: color,
            opacity: 0.1 + Math.random() * 0.4 // 随机透明度
        };
    }

    /**
     * 🌪️ 设置特效风格
     * @param {string} style - 'default'（默认矩形粒子） 或 'taro'（香芋色贝塞尔丝带）
     */
    setStyle(style) {
        this.effectStyle = style;
        // 重新初始化粒子以应用新颜色
        this.particles = [];
        this.initParticles();
    }

    /**
     * 更新状态
     * @param {number} dt - 归一化时间步长
     * @param {number} windForceX - 全局风力 (正数向右，负数向左，0无风)
     */
    update(dt, windForceX) {
        this.currentWindForce = windForceX;
        // 只有风力大于某个阈值时才认为激活了特效
        this.isActive = Math.abs(windForceX) > 50; 

        if (!this.isActive && this.particles.length > 0) {
            // 如果风停了，可以让粒子慢慢淡出（这里简单处理，暂时不更新位置）
            // 如果想让它们慢慢飘完，可以继续更新，只是速度变慢
             this.particles.forEach(p => {
                 p.x += this.config.baseSpeed * p.speedVariation * dt * (windForceX > 0 ? 1 : -1);
             });
             return;
        }

        // 更新所有粒子位置
        this.particles.forEach(p => {
            // 粒子速度 = 基础慢速 + 风力加速
            const totalSpeed = (this.config.baseSpeed + Math.abs(windForceX) * 1.5) * p.speedVariation;
            
            if (windForceX > 0) {
                // 向右吹
                p.x += totalSpeed * dt;
                // 移出右屏幕后，回到左侧重置
                if (p.x > this.width) {
                    this.resetParticle(p, 'left');
                }
            } else if (windForceX < 0) {
                // 向左吹
                p.x -= totalSpeed * dt;
                // 移出左屏幕后，回到右侧重置
                if (p.x + p.length < 0) {
                    this.resetParticle(p, 'right');
                }
            }
        });
    }

    // 重置粒子到屏幕边缘
    resetParticle(p, side) {
        p.y = Math.random() * this.height;
        if (side === 'left') {
            p.x = -p.length - Math.random() * 100; // 稍微错开一点进入时间
        } else {
            p.x = this.width + Math.random() * 100;
        }
        // 每次重置微调一下外观，更有随机感
        p.length = 40 + Math.random() * 80;
    }

    /**
     * 绘制方法 (核心美学部分)
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        // 如果没有风，或者风力很小，就不画，保持画面干净
        if (!this.isActive) return;

        ctx.save();
        
        // 🌪️ Level 11 香芋色丝带风格
        if (this.effectStyle === 'taro') {
            this.drawTaroRibbons(ctx);
        } else {
            // 默认的矩形粒子风格（Level 6）
            // 使用 'lighter' 或 'screen' 混合模式，让气流叠加时更亮，有荧光感
            ctx.globalCompositeOperation = 'lighter'; 

            this.particles.forEach(p => {
                ctx.beginPath();
                // 关键：使用圆角矩形 (roundRect) 制造柔和的生物感边缘
                // 如果浏览器不支持 roundRect，可以用 arc + lineTo 代替，但现代浏览器基本都支持了
                if (ctx.roundRect) {
                    ctx.roundRect(p.x, p.y, p.length, p.thickness, p.thickness / 2);
                } else {
                    // 降级方案：画普通矩形（没那么萌了）
                    ctx.rect(p.x, p.y, p.length, p.thickness);
                }
                ctx.fillStyle = p.color;
                ctx.fill();
            });
        }

        ctx.restore();
    }

    /**
     * 🌪️ 绘制香芋色贝塞尔丝带（Level 11 专用）
     * 来源：用户提供的美学代码库
     * @param {CanvasRenderingContext2D} ctx 
     */
    drawTaroRibbons(ctx) {
        const time = Date.now() * 0.001; // 动画时间
        
        this.particles.forEach((p, index) => {
            // 丝带起点和终点
            const startX = p.x;
            const startY = p.y;
            const endX = p.x + p.length;
            const endY = p.y;
            
            // 贝塞尔曲线的控制点（随时间变化，制造动态感）
            const offset = time * 2 + index * 0.5; // 每根丝带的相位不同
            const cpX = (startX + endX) / 2 + Math.sin(offset) * 50;
            const cpY = (startY + endY) / 2 + Math.cos(offset) * 30;
            
            ctx.beginPath();
            ctx.lineWidth = p.thickness * 2; // 丝带要粗一些
            ctx.lineCap = 'round'; // 圆角端点，拒绝锋利！
            
            // 香芋色渐变（两端透明，中间香芋色）
            const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');   // 两端透明
            gradient.addColorStop(0.5, p.color); // 中间使用粒子的香芋色
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.strokeStyle = gradient;
            
            // 绘制贝塞尔曲线
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(cpX, cpY, endX, endY);
            ctx.stroke();
        });
    }

    // 窗口大小改变时调用
    resize(newWidth, newHeight) {
        this.width = newWidth;
        this.height = newHeight;
    }

    // 重置系统（切换关卡时调用）
    reset() {
        this.isActive = false;
        this.currentWindForce = 0;
        this.particles = [];
        this.initParticles();
    }
}
