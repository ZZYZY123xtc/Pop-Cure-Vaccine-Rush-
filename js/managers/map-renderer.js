/**
 * 🎨 萌菌大作战：美术级地图渲染器
 * 风格关键词：Soft, Organic, Kawaii, Living
 */
export class MapRenderer {
    constructor(canvasId, levels, playerState, onNodeClick) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.levels = levels;
        this.state = playerState; // { maxLevel: 1, stars: {}, energy: 30 }
        this.onNodeClick = onNodeClick;

        // 🎨 美术配置：这里掌管整个画面的颜值
        this.style = {
            // 背景渐变：从深粉红(肺部深处) -> 浅粉(口腔入口)
            bgTop: "#FFCDD2",    // Deep Pink
            bgBottom: "#FFEBEE", // Light Cream Pink
            
            // 装饰粒子 (营造体内环境)
            particleColor: "rgba(255, 255, 255, 0.4)",

            // 路径线
            pathColor: "rgba(255, 255, 255, 0.5)",
            pathWidth: 8,
            dashPattern: [15, 12], // 虚线样式

            // 节点颜色
            nodeLocked: "#E0E0E0", // 灰色
            nodeActive: "#FF4081", // 亮粉色 (当前关卡)
            nodePassed: "#81C784", // 抹茶绿 (已通关)
            
            // 字体
            font: "bold 16px 'Arial Rounded MT Bold', sans-serif"
        };

        // 动画系统
        this.time = 0;
        this.particles = this.createParticles(25); // 生成25个漂浮细胞
        
        // 绑定事件
        this.setupEvents();
        
        // 启动渲染循环
        this.loop();
    }

    // --- 1. 粒子系统 (让背景活起来) ---
    createParticles(count) {
        let p = [];
        for(let i=0; i<count; i++) {
            p.push({
                x: Math.random(), // 0-1 相对坐标
                y: Math.random(),
                r: Math.random() * 12 + 4, // 半径大小不一
                speed: Math.random() * 0.0005 + 0.0002, // 极慢漂浮
                phase: Math.random() * Math.PI * 2 // 闪烁相位
            });
        }
        return p;
    }

    // --- 2. 渲染主循环 ---
    loop() {
        this.time += 0.03; // 时间流逝速度
        
        // 适配屏幕尺寸 (Retina屏优化)
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        // 逻辑宽高
        this.width = rect.width;
        this.height = rect.height;

        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    // --- 3. 绘图指令 ---
    draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        // A. 绘制背景 (垂直渐变)
        let grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, this.style.bgTop);
        grad.addColorStop(1, this.style.bgBottom);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // B. 绘制漂浮粒子
        ctx.fillStyle = this.style.particleColor;
        this.particles.forEach(p => {
            p.y -= p.speed; // 向上漂浮
            if (p.y < -0.1) p.y = 1.1; // 循环

            // 粒子呼吸效果
            let alpha = 0.3 + Math.sin(this.time + p.phase) * 0.1;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            
            ctx.beginPath();
            ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
            ctx.fill();
        });

        // C. 绘制路径 (Saga 曲线)
        // 这里的 getY 辅助函数：输入 0(入口)-1(深处)，输出 Canvas 的 Y 坐标
        // 我们设定：Level 1 (y=0) 在最下面
        const getY = (percent) => h - (percent * h * 0.9) - (h * 0.05); // 留出上下边距

        if (this.levels.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = this.style.pathColor;
            ctx.lineWidth = this.style.pathWidth;
            ctx.setLineDash(this.style.dashPattern);
            ctx.lineCap = 'round';

            // 移动到第一关位置
            let first = this.levels[0].mapConfig;
            ctx.moveTo(first.x * w, getY(first.y));

            for (let i = 1; i < this.levels.length; i++) {
                let curr = this.levels[i].mapConfig;
                let prev = this.levels[i-1].mapConfig;
                
                let startX = prev.x * w;
                let startY = getY(prev.y);
                let endX = curr.x * w;
                let endY = getY(curr.y);

                // 贝塞尔控制点：让线条像蛇一样蜿蜒柔和
                let cp1x = startX;
                let cp1y = (startY + endY) / 2;
                let cp2x = endX;
                let cp2y = (startY + endY) / 2;

                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
            }
            ctx.stroke();
            ctx.setLineDash([]); // 重置虚线
        }

        // D. 绘制关卡节点
        this.levels.forEach(lvl => {
            let cx = lvl.mapConfig.x * w;
            let cy = getY(lvl.mapConfig.y);
            
            // 状态判断
            let isPassed = lvl.id < this.state.maxLevel;
            let isCurrent = lvl.id === this.state.maxLevel;
            let isLocked = lvl.id > this.state.maxLevel;

            // 半径计算 (呼吸效果)
            let baseR = 28;
            let r = baseR;
            if (isCurrent) {
                r += Math.sin(this.time * 3) * 3; // 快速心跳
            }

            // 1. 绘制阴影 (增加立体感)
            ctx.beginPath();
            ctx.arc(cx, cy + 4, r, 0, Math.PI*2);
            ctx.fillStyle = "rgba(0,0,0,0.1)";
            ctx.fill();

            // 2. 绘制球体
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI*2);
            if (isLocked) ctx.fillStyle = this.style.nodeLocked;
            else if (isCurrent) ctx.fillStyle = this.style.nodeActive;
            else ctx.fillStyle = this.style.nodePassed;
            ctx.fill();

            // 3. 绘制图标/文字
            ctx.fillStyle = "#FFF";
            ctx.font = this.style.font;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            if (isLocked) {
                ctx.fillText("🔒", cx, cy + 2);
            } else if (lvl.mapConfig.icon === 'chest') {
                ctx.fillText("🎁", cx, cy + 2);
            } else if (lvl.mapConfig.icon === 'boss') {
                ctx.fillText("😈", cx, cy + 2);
            } else {
                ctx.fillText(lvl.id, cx, cy + 2);
            }

            // 4. 绘制星星 (皇冠效果)
            let stars = this.state.stars[lvl.id] || 0;
            if (stars > 0 && !isLocked) {
                // 在球体上方画星星
                let starStr = "⭐".repeat(stars);
                ctx.font = "14px Arial"; // 星星用默认字体显示最好看
                ctx.shadowColor = "rgba(0,0,0,0.3)";
                ctx.shadowBlur = 4;
                ctx.fillText(starStr, cx, cy - r - 10);
                ctx.shadowBlur = 0;
            }

            // 5. 当前关卡指示箭头 (跳动)
            if (isCurrent) {
                let bounce = Math.abs(Math.sin(this.time * 2)) * 10;
                ctx.fillStyle = "#FF4081";
                ctx.font = "24px Arial";
                ctx.fillText("▼", cx, cy - r - 20 - bounce);
            }
        });
    }

    // --- 4. 交互逻辑 ---
    setupEvents() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            // 处理坐标缩放
            const scaleX = this.canvas.width / rect.width; 
            const scaleY = this.canvas.height / rect.height;
            
            // 获取点击在 Canvas 内部的逻辑坐标
            const mouseX = (e.clientX - rect.left); 
            const mouseY = (e.clientY - rect.top);
            
            const w = this.width;
            const h = this.height;
            const getY = (percent) => h - (percent * h * 0.9) - (h * 0.05);

            // 遍历所有关卡检测点击
            this.levels.forEach(lvl => {
                if (lvl.id > this.state.maxLevel) return; // 锁住的不管

                let cx = lvl.mapConfig.x * w;
                let cy = getY(lvl.mapConfig.y);
                
                // 计算距离
                let dist = Math.sqrt(Math.pow(mouseX - cx, 2) + Math.pow(mouseY - cy, 2));
                
                if (dist < 40) { // 点击判定半径
                    this.onNodeClick(lvl.id);
                }
            });
        });
    }
}
