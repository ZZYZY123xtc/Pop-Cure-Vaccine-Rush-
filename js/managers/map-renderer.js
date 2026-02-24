/**
 * 🎨 萌菌大作战：美术级地图渲染器 (章节系统版本)
 * 风格关键词：Soft, Organic, Kawaii, Living, Chapter-based
 */
import { CHAPTER_CONFIG } from '../data/levels.js';

export class MapRenderer {
    constructor(canvasId, levels, playerState, onNodeClick) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.levels = levels;
        this.state = playerState; // { maxLevel: 1, stars: {}, energy: 30 }
        this.onNodeClick = onNodeClick;

        // 初始化尺寸（等待 ViewportManager 设置）
        this.width = 0;
        this.height = 0;
        
        // 🔥 调试标志：是否已输出过绘制日志
        this.firstDrawLogged = false;
        
        // 🌸 章节系统
        this.currentChapter = 1; // 默认从第一章开始
        this.chapterConfig = CHAPTER_CONFIG[this.currentChapter];
        
        // 🎨 动态美术配置：根据当前章节调整
        this.updateStyleFromChapter();

        // 动画系统
        this.time = 0;
        this.particles = this.createParticles(25); // 生成25个漂浮细胞
        
        // 章节切换按钮状态
        this.buttons = {
            prevBtn: { x: 50, y: 0, width: 80, height: 40, visible: false },
            nextBtn: { x: 0, y: 0, width: 80, height: 40, visible: false }
        };
        this.nodeRenderCache = [];
        
        // 绑定事件
        this.setupEvents();
        
        // 启动渲染循环
        this.loop();
    }

    // 🌸 设置当前章节
    setChapter(chapterId) {
        if (CHAPTER_CONFIG[chapterId]) {
            this.currentChapter = chapterId;
            this.chapterConfig = CHAPTER_CONFIG[chapterId];
            this.updateStyleFromChapter();
            console.log(`[MapRenderer] 切换至章节 ${chapterId}: ${this.chapterConfig.subtitle}`);
        }
    }

    // 🎨 根据章节更新美术风格
    updateStyleFromChapter() {
        this.style = {
            // 🌸 从章节配置获取背景色
            bgTop: this.chapterConfig.bgGradientStart,
            bgBottom: this.chapterConfig.bgGradientEnd,
            
            // ✨ 从章节配置获取粒子色
            particleColor: this.chapterConfig.particleColor,

            // 路径线（保持半透明白色）
            pathColor: "rgba(255, 255, 255, 0.5)",
            pathWidth: 8,
            dashPattern: [15, 12], // 虚线样式

            // 🌸 从章节配置获取节点颜色
            nodeLocked: "#E0E0E0", // 灰色（锁定）
            nodeActive: this.chapterConfig.nodeColor, // 章节主题色（当前）
            nodePassed: "#81C784", // 抹茶绿（已通关）
            
            // 字体（圆润可爱）
            font: "bold 16px 'Varela Round', 'Arial Rounded MT Bold', sans-serif",
            titleFont: "bold 48px 'Varela Round', 'Arial Rounded MT Bold', sans-serif"
        };
    }

    // 🌸 获取当前章节的关卡列表
    getCurrentChapterLevels() {
        return this.levels.filter(level => level.chapter === this.currentChapter);
    }

    getMaxUnlockedLevel() {
        const totalLevels = this.levels.length;
        const rawMaxLevel = Number(this.state?.maxLevel);

        if (!Number.isFinite(rawMaxLevel)) return 1;

        const normalized = Math.floor(rawMaxLevel);
        return Math.min(Math.max(normalized, 1), totalLevels);
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

    // --- 1.5 响应 ViewportManager 的尺寸变化 ---
    resize(width, height, dpr) {
        console.log(`[MapRenderer] Canvas 尺寸已更新: ${width}x${height} (DPR: ${dpr})`);
        // ViewportManager 已经设置了 canvas.width/height 和 DPR 缩放
        // 这里只需要更新逻辑尺寸
        this.width = width;
        this.height = height;
        // 立即重绘（loop 会持续绘制，这里确保立即更新）
        this.draw();
    }

    // --- 2. 渲染主循环 ---
    loop() {
        this.time += 0.03; // 时间流逝速度
        
        // ✅ 尺寸由 ViewportManager 通过 resize() 回调管理
        // 不再每帧读取 getBoundingClientRect()，避免隐藏层返回 0
        
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    // --- 3. 绘图指令 ---
    draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        
        // 🔥 防御性检查：尺寸未初始化时不绘制
        if (w === 0 || h === 0) {
            console.warn('[MapRenderer] Canvas 尺寸为 0，跳过绘制');
            return;
        }

        // A. 🌸 绘制章节主题背景 (垂直渐变)
        this.drawChapterBackground(ctx, w, h);

        // B. ✨ 绘制漂浮粒子（呼吸感）
        this.drawBreathingParticles(ctx, w, h);

        // C. 🎨 绘制章节标题（水印效果）
        this.drawChapterTitle(ctx, w, h);

        // D. 🌸 只绘制当前章节的关卡
        const chapterLevels = this.getCurrentChapterLevels();
        this.drawLevelPath(ctx, w, h, chapterLevels);
        this.drawLevelNodes(ctx, w, h, chapterLevels);

        // E. 🔄 绘制章节切换按钮
        this.drawChapterButtons(ctx, w, h);
    }

    // 🌸 绘制章节背景
    drawChapterBackground(ctx, w, h) {
        let grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, this.style.bgTop);
        grad.addColorStop(1, this.style.bgBottom);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        
        // 🔥 仅在第一次绘制时输出日志
        if (!this.firstDrawLogged) {
            console.log('[MapRenderer] ✅ 首次绘制成功:', w, 'x', h, '| 渐变:', this.style.bgTop, '→', this.style.bgBottom);
            this.firstDrawLogged = true;
        }
    }

    // ✨ 绘制呼吸粒子
    drawBreathingParticles(ctx, w, h) {
        this.particles.forEach(p => {
            p.y -= p.speed; // 向上漂浮
            if (p.y < -0.1) p.y = 1.1; // 循环

            // 粒子呼吸效果（随时间闪烁）
            let alpha = 0.3 + Math.sin(this.time + p.phase) * 0.1;
            ctx.fillStyle = this.style.particleColor.replace(/[\d\.]+\)$/g, `${alpha})`);
            
            ctx.beginPath();
            ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // 🎨 绘制章节标题（水印效果）
    drawChapterTitle(ctx, w, h) {
        ctx.save();
        
        // 主标题（大字水印）
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)"; // 非常淡的黑色
        ctx.font = this.style.titleFont;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.chapterConfig.title, w / 2, h * 0.3);

        // 副标题（小字说明）
        ctx.fillStyle = "rgba(0, 0, 0, 0.15)"; // 稍微深一点
        ctx.font = "bold 18px 'Varela Round', sans-serif";
        ctx.fillText(this.chapterConfig.subtitle, w / 2, h * 0.36);
        
        // 氛围描述（诗意文字）
        if (this.chapterConfig.atmosphere) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.12)"; // 更淡的颜色
            ctx.font = "14px 'Varela Round', sans-serif";
            ctx.fillText(this.chapterConfig.atmosphere, w / 2, h * 0.40);
        }
        
        ctx.restore();
    }

    // 🌸 绘制关卡路径（只显示当前章节）
    drawLevelPath(ctx, w, h, chapterLevels) {
        if (chapterLevels.length === 0) return;

        const getY = (percent) => h - (percent * h * 0.9) - (h * 0.05);

        ctx.beginPath();
        ctx.strokeStyle = this.style.pathColor;
        ctx.lineWidth = this.style.pathWidth;
        ctx.setLineDash(this.style.dashPattern);
        ctx.lineCap = 'round';

        // 移动到第一关位置
        let first = chapterLevels[0].mapConfig;
        ctx.moveTo(first.x * w, getY(first.y));

        for (let i = 1; i < chapterLevels.length; i++) {
            let curr = chapterLevels[i].mapConfig;
            let prev = chapterLevels[i-1].mapConfig;
            
            let startX = prev.x * w;
            let startY = getY(prev.y);
            let endX = curr.x * w;
            let endY = getY(curr.y);

            // � 优雅贝塞尔曲线：紧致、流畅、有呼吸感
            // 计算两点间的向量
            let dx = endX - startX;
            let dy = endY - startY;
            
            // ✅ 美学微调：垂直偏移从 0.25 降低到 0.15
            // 让曲线的"肚子"更小，看起来更紧致、不会乱扭
            const midY = startY + (endY - startY) * 0.5;
            const cp1x = startX;
            const cp1y = midY;
            const cp2x = endX;
            const cp2y = midY;

            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
        }
        ctx.stroke();
        ctx.setLineDash([]); // 重置虚线
    }

    // 🌸 绘制关卡节点（只显示当前章节）
    drawLevelNodes(ctx, w, h, chapterLevels) {
        const getY = (percent) => h - (percent * h * 0.9) - (h * 0.05);
        const maxUnlockedLevel = this.getMaxUnlockedLevel();

        // 每帧重建，确保点击检测与绘制使用同一组坐标
        this.nodeRenderCache = [];

        chapterLevels.forEach(lvl => {
            const cx = lvl.mapConfig.x * w;
            const cy = getY(lvl.mapConfig.y);

            const isPassed = lvl.id < maxUnlockedLevel;
            const isCurrent = lvl.id === maxUnlockedLevel;
            const isLocked = lvl.id > maxUnlockedLevel;

            const baseR = 28;
            let r = baseR;
            if (isCurrent) {
                r += Math.sin(this.time * 3) * 3;
            }

            // 1) 阴影
            ctx.beginPath();
            ctx.arc(cx, cy + 4, r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fill();

            // 2) 球体
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            if (isLocked) ctx.fillStyle = this.style.nodeLocked;
            else if (isCurrent) ctx.fillStyle = this.style.nodeActive;
            else ctx.fillStyle = this.style.nodePassed;
            ctx.fill();

            // 3) 图标/文本
            ctx.fillStyle = '#FFF';
            ctx.font = this.style.font;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (isLocked) {
                ctx.fillText('🔒', cx, cy + 2);
            } else if (lvl.mapConfig.icon === 'chest') {
                ctx.fillText('🎁', cx, cy + 2);
            } else if (lvl.mapConfig.icon === 'boss') {
                ctx.fillText('👑', cx, cy + 2);
            } else {
                ctx.fillText(lvl.id, cx, cy + 2);
            }

            // 4) 星星
            const stars = this.state.stars[lvl.id] || 0;
            if (stars > 0 && !isLocked) {
                const starStr = '⭐'.repeat(stars);
                ctx.font = "14px 'Varela Round', Arial";
                ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                ctx.shadowBlur = 4;
                ctx.fillText(starStr, cx, cy - r - 10);
                ctx.shadowBlur = 0;
            }

            // 5) 当前关卡指示
            if (isCurrent) {
                const bounce = Math.abs(Math.sin(this.time * 2)) * 10;
                ctx.fillStyle = this.style.nodeActive;
                ctx.font = "24px 'Varela Round', Arial";
                ctx.fillText('⬇', cx, cy - r - 20 - bounce);
            }

            const clickPadding = lvl.mapConfig.icon === 'boss' ? 24 : 20;
            this.nodeRenderCache.push({
                id: lvl.id,
                cx,
                cy,
                hitRadius: baseR + clickPadding,
                unlocked: lvl.id <= maxUnlockedLevel
            });
        });
    }

    // 章节切换按钮
    drawChapterButtons(ctx, w, h) {
        const buttonY = h - 50; // 底部位置
        
        // 更新按钮位置和可见性
        this.buttons.prevBtn.y = buttonY;
        this.buttons.prevBtn.visible = this.currentChapter > 1;
        
        this.buttons.nextBtn.x = w - 130; // 右下角
        this.buttons.nextBtn.y = buttonY;
        this.buttons.nextBtn.visible = CHAPTER_CONFIG[this.currentChapter + 1] !== undefined;

        // 绘制上一章按钮
        if (this.buttons.prevBtn.visible) {
            this.drawButton(ctx, this.buttons.prevBtn, "< PREV", "#FFB7B2");
        }

        // 绘制下一章按钮
        if (this.buttons.nextBtn.visible) {
            this.drawButton(ctx, this.buttons.nextBtn, "NEXT >", "#88D8B0");
        }
    }

    // 🎨 绘制单个按钮
    drawButton(ctx, btn, text, color) {
        ctx.save();
        
        // 按钮背景（圆角矩形）
        ctx.fillStyle = color;
        ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
        ctx.shadowBlur = 8;
        ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
        
        // 按钮文字
        ctx.fillStyle = "#FFF";
        ctx.font = "bold 14px 'Varela Round', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowBlur = 0;
        ctx.fillText(text, btn.x + btn.width/2, btn.y + btn.height/2);
        
        ctx.restore();
    }

    // 🔄 点击检测 - 章节按钮
    getClickedChapterButton(x, y) {
        // 检测上一章按钮
        if (this.buttons.prevBtn.visible &&
            x >= this.buttons.prevBtn.x && x <= this.buttons.prevBtn.x + this.buttons.prevBtn.width &&
            y >= this.buttons.prevBtn.y && y <= this.buttons.prevBtn.y + this.buttons.prevBtn.height) {
            return 'prev';
        }

        // 检测下一章按钮
        if (this.buttons.nextBtn.visible &&
            x >= this.buttons.nextBtn.x && x <= this.buttons.nextBtn.x + this.buttons.nextBtn.width &&
            y >= this.buttons.nextBtn.y && y <= this.buttons.nextBtn.y + this.buttons.nextBtn.height) {
            return 'next';
        }

        return null;
    }

    // 🔄 切换章节
    switchChapter(direction) {
        if (direction === 'prev' && this.currentChapter > 1) {
            this.setChapter(this.currentChapter - 1);
            return true;
        } else if (direction === 'next' && CHAPTER_CONFIG[this.currentChapter + 1]) {
            this.setChapter(this.currentChapter + 1);
            return true;
        }
        return false;
    }

    // --- 4. 交互逻辑 ---
    setupEvents() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();

            // 统一映射到逻辑坐标，修复缩放场景下的命中偏移
            const scaleX = rect.width > 0 ? (this.width / rect.width) : 1;
            const scaleY = rect.height > 0 ? (this.height / rect.height) : 1;
            const mouseX = (e.clientX - rect.left) * scaleX;
            const mouseY = (e.clientY - rect.top) * scaleY;

            // 1. 优先检测章节按钮点击
            const chapterBtn = this.getClickedChapterButton(mouseX, mouseY);
            if (chapterBtn) {
                if (this.switchChapter(chapterBtn)) {
                    return;
                }
            }
            
            // 2. 检测关卡节点点击（只检测当前章节）
            for (const node of this.nodeRenderCache) {
                if (!node.unlocked) continue;

                const dx = mouseX - node.cx;
                const dy = mouseY - node.cy;
                const distSq = dx * dx + dy * dy;

                if (distSq <= node.hitRadius * node.hitRadius) {
                    this.onNodeClick(node.id);
                    return; // 只处理第一个匹配的关卡
                }
            }
        });
    }
}

