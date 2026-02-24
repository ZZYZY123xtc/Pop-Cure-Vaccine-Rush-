/**
 * 视觉效果管理器 - 处理粒子效果、爆炸、背景绘制等
 */
import { Particle } from '../entities/particle.js';
import { PERFORMANCE_CONFIG } from '../core/performance-config.js';

// ==========================================
// 🎨 Level 7 美学：萌系生物黏液坑 (Mucus Pit)
// ==========================================
// 风格：半透明、果冻感、带有柔和生物荧光的坑洞。
export class MucusPitRenderer {
    constructor(canvasWidth, canvasHeight) {
        // 🔥 极致性能优化：存储配置和预计算的绝对坐标
        this.pitsConfig = [
            { xPercent: 0.25, yPercent: 0.35, radius: 70 },
            { xPercent: 0.75, yPercent: 0.65, radius: 60 },
            { xPercent: 0.5,  yPercent: 0.8,  radius: 50 }
        ];
        this.pits = []; // 预计算的绝对坐标数组
        this.pulseTimer = 0; // 用于制作轻微的"呼吸"动画
        
        // 立即初始化绝对坐标
        this.initPits(canvasWidth, canvasHeight);
    }

    // 🚀 极致性能优化：只计算一次绝对坐标
    initPits(canvasWidth, canvasHeight) {
        this.pits = this.pitsConfig.map(config => ({
            x: canvasWidth * config.xPercent,
            y: canvasHeight * config.yPercent,
            radius: config.radius,
            radiusSq: config.radius * config.radius // 预计算平方值，避免运行时乘法
        }));
        
        // 🚀 调试日志：输出坑的实际坐标
        console.log('[MucusPit] 初始化坑洞坐标：');
        console.log('  Canvas尺寸:', canvasWidth.toFixed(2), 'x', canvasHeight.toFixed(2));
        this.pits.forEach((pit, i) => {
            console.log(`  坑${i+1}: (${pit.x.toFixed(2)}, ${pit.y.toFixed(2)}), 半径=${pit.radius}`);
        });
    }

    update(dt) {
        this.pulseTimer += dt * 0.0015; // 控制呼吸速度（dt是毫秒）
    }

    // 🔥 性能优化：更新canvas尺寸时重新计算绝对坐标
    resize(width, height) {
        console.log('[MucusPit] resize 被调用:', width.toFixed(2), 'x', height.toFixed(2));
        this.initPits(width, height);
    }

    draw(ctx) {
        ctx.save();
        // ✅ 保持DPR缩放，使黏液坑和病毒在同一坐标系

        // 🚀 极致性能优化：直接使用预计算的绝对坐标
        this.pits.forEach((pit, index) => {
            // 计算一个轻微的呼吸缩放效果
            const scale = 1 + Math.sin(this.pulseTimer + index * 0.5) * 0.05;
            const currentRadius = pit.radius * scale;

            // 🔥 修复：绘制实体的半透明绿色黏液坑（移除过曝效果）
            const gradient = ctx.createRadialGradient(
                pit.x, pit.y, 0,
                pit.x, pit.y, currentRadius
            );
            // 中心是实体的半透明绿色
            gradient.addColorStop(0, 'rgba(120, 230, 120, 0.4)');
            gradient.addColorStop(0.5, 'rgba(100, 200, 100, 0.3)');
            // 边缘淡化到透明
            gradient.addColorStop(1, 'rgba(80, 170, 80, 0)');
            
            ctx.beginPath();
            ctx.arc(pit.x, pit.y, currentRadius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            // 🔥 添加柔和的边缘高光（正常混合模式）
            ctx.beginPath();
            ctx.arc(pit.x, pit.y, currentRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(150, 255, 150, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 添加一层内部高光，增强水渍感
            const innerGradient = ctx.createRadialGradient(
                pit.x - currentRadius * 0.2, pit.y - currentRadius * 0.2, 0,
                pit.x, pit.y, currentRadius * 0.6
            );
            innerGradient.addColorStop(0, 'rgba(180, 255, 180, 0.3)');
            innerGradient.addColorStop(1, 'rgba(180, 255, 180, 0)');
            
            ctx.beginPath();
            ctx.arc(pit.x, pit.y, currentRadius * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = innerGradient;
            ctx.fill();
        });

        ctx.restore();
    }
    
    // � 极致性能优化：使用预计算的绝对坐标和平方距离判断
    checkCollision(virusX, virusY) {
        // 遍历所有坑，使用平方距离比较（避免sqrt）
        for (let i = 0; i < this.pits.length; i++) {
            const pit = this.pits[i];
            const dx = virusX - pit.x;
            const dy = virusY - pit.y;
            const distSq = dx * dx + dy * dy;
            
            // 🔥 性能极致优化：直接用平方距离比较
            if (distSq <= pit.radiusSq) {                // 🚀 调试日志：输出碰撞检测结果
                console.log(`[MucusPit] 病毒(${virusX.toFixed(1)}, ${virusY.toFixed(1)}) 在坑${i+1}(${pit.x.toFixed(1)}, ${pit.y.toFixed(1)})内`);                return true;
            }
        }
        return false;
    }
}

// ==========================================
// 🎨 Level 8 美学：霓虹病毒与闪电 (Neon & Flash)
// ==========================================

// --- Part A: 霓虹病毒样式应用函数 ---
// 在 Virus.draw() 方法中，如果是第8关，调用此函数设置 context
// ✅ 注意：此函数必须在 ctx.save() 之后调用，确保 shadowBlur 不会污染其他绘制
export function applyNeonStyle(ctx, virusType) {
    let glowColor, strokeColor;
    switch (virusType) {
        case 'A': // 普通型 - 幽蓝光
            glowColor = 'rgba(0, 240, 255, 0.8)'; strokeColor = '#00f0ff'; break;
        case 'B': // 肉盾型 - 荧光绿
            glowColor = 'rgba(100, 255, 100, 0.8)'; strokeColor = '#64ff64'; break;
        case 'C': // 极速型 - 猛男粉
            glowColor = 'rgba(255, 80, 255, 0.8)'; strokeColor = '#ff50ff'; break;
        default:
            glowColor = 'rgba(255, 255, 255, 0.8)'; strokeColor = '#ffffff';
    }

    // 🚀 性能优化：设置强大的发光效果 (Glow)
    ctx.shadowBlur = 20;
    ctx.shadowColor = glowColor;
    // 设置描边样式，而不是填充
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 4; // 线条稍粗一点，更有灯管感
    ctx.fillStyle = 'rgba(0, 0, 0, 0)'; // 透明填充
    // 💡 提示：调用完这个后，用 ctx.stroke() 而不是 ctx.fill() 来画病毒
    // ⚠️ 记得用 ctx.restore() 清理 shadowBlur！
}

// ⚡ LightningFlashEffect已删除：导致白屏的全屏闪光特效
// 现在闪电技能使用原版的闪电链折线绘制（skills.js中的drawLightning方法）

export class EffectsManager {
    constructor() {
        this.particles = [];
    }

    // 🚀 性能优化：限制粒子数量
    _enforceParticleLimit() {
        if (this.particles.length > PERFORMANCE_CONFIG.MAX_PARTICLES) {
            const excess = this.particles.length - PERFORMANCE_CONFIG.MAX_PARTICLES;
            this.particles.splice(0, excess); // 移除最老的粒子
        }
    }

    // 创建爆炸效果
    createExplosion(x, y, color, count) {
        // 🚀 性能优化：在创建前检查是否需要限制（移动端减少粒子）
        const actualCount = PERFORMANCE_CONFIG.REDUCE_PARTICLE_QUALITY 
            ? Math.min(count, Math.floor(count * 0.6))  // 移动端减少40%粒子
            : count;
        
        for (let i = 0; i < actualCount; i++) {
            this.particles.push(new Particle(x, y, color));
        }
        
        // 🚀 创建后立即检查上限
        this._enforceParticleLimit();
    }

    // 教程病毒临界分裂警告效果
    createTutorialSplitWarning(x, y) {
        // 创建心形粒子效果
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const speed = 2 + Math.random() * 2;
            const p = new Particle(x, y, '#FFB6C1'); // 粉红色
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            p.size = 6 + Math.random() * 4;
            p.life = 800 + Math.random() * 400;
            this.particles.push(p);
        }
        
        // 删除了突兀的文字气泡效果，只保留粒子效果作为视觉反馈
    }

    // 更新所有粒子
    updateParticles(ctx, dt = 16.67) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update(dt);
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            } else {
                p.draw(ctx);
            }
        }
    }

    // 绘制波点背景
    drawBackground(ctx, canvasWidth, canvasHeight, isNightMode = false) {
        // 🌑 Level 8：暗夜模式背景
        if (isNightMode) {
            ctx.fillStyle = '#0a0510'; // 极暗的深紫黑色
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            return; // 暗夜模式不绘制波点
        }
        
        // 先填充浅色背景
        ctx.fillStyle = '#E8F1F2';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // 绘制波点
        ctx.fillStyle = '#D0DFE3';
        const r = 3;
        const gap = 40;
        
        for (let x = 20; x < canvasWidth; x += gap) {
            for (let y = 20; y < canvasHeight; y += gap) {
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // 绘制教程高亮圈
    drawTutorialHighlight(ctx, tutorialVirus) {
        if (!tutorialVirus) return;
        
        ctx.save();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;
        const pulseRadius = tutorialVirus.radius + 20 + Math.sin(Date.now() / 300) * 10;
        ctx.beginPath();
        ctx.arc(tutorialVirus.x, tutorialVirus.y, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // 绘制胜利光波
    drawVaccineWave(ctx, canvasWidth, canvasHeight, radius) {
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.shadowColor = '#B5EAD7';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制外圈发光效果
        ctx.strokeStyle = '#85E3B0';
        ctx.lineWidth = 5;
        ctx.shadowBlur = 50;
        ctx.stroke();
        ctx.restore();

        return { centerX, centerY };
    }

    // 检查病毒是否被光波触及
    isVirusInWave(virus, centerX, centerY, radius) {
        const dist = Math.hypot(virus.x - centerX, virus.y - centerY);
        return dist < radius;
    }

    // 清空所有粒子
    clearParticles() {
        this.particles.length = 0;
    }

    // 获取粒子数量
    getParticleCount() {
        return this.particles.length;
    }
}

// ==========================================
// 🎨 Level 9 美学：生物食道漩涡 (Bio Vortex)
// ==========================================
// 风格：深邃、肉质、缓慢旋转的生物组织纹理。
export class VortexRenderer {
    constructor(canvasWidth, canvasHeight) {
        this.centerX = canvasWidth / 2;
        this.centerY = canvasHeight / 2;
        this.angle = 0;
        this.radius = 180; // 漩涡半径
    }

    update(dt) {
        this.angle += dt * 0.0003; // 缓慢旋转（dt为毫秒）
    }
    
    resize(width, height) {
        this.centerX = width / 2;
        this.centerY = height / 2;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.centerX, this.centerY);
        ctx.rotate(this.angle); // 应用旋转

        // 创建螺旋渐变，模拟肉质纹理
        const gradient = ctx.createRadialGradient(0, 0, 20, 0, 0, this.radius);
        // 中心是深不见底的暗红/黑色
        gradient.addColorStop(0, 'rgba(40, 10, 10, 0.9)');
        // 中间是拉伸的肌肉组织颜色
        gradient.addColorStop(0.6, 'rgba(120, 40, 40, 0.6)');
        // 边缘淡出
        gradient.addColorStop(1, 'rgba(100, 30, 30, 0)');

        // 绘制多条螺旋臂，增加动态感
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.rotate(Math.PI / 4); // 每次旋转 45 度画下一条臂
            ctx.moveTo(0, 0);
            // 用贝塞尔曲线画出弯曲的螺旋臂
            ctx.quadraticCurveTo(this.radius * 0.6, this.radius * 0.6, this.radius, 0);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 25;
            ctx.lineCap = 'round'; // 圆润的笔触
            ctx.stroke();
        }

        // 绘制中心的"黑洞"核心，加强深邃感
        ctx.beginPath();
        ctx.arc(0, 0, 35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(20, 5, 5, 1)';
        ctx.shadowColor = 'rgba(60, 20, 20, 1)';
        ctx.shadowBlur = 30;
        ctx.fill();

        ctx.restore();
    }
}

// ==========================================
// 🎨 Level 10 美学：Boss 治愈波纹 (Heal Pulse)
// ==========================================
// 风格：爆发式的绿色能量环，代表生命力恢复。
export class BossHealEffect {
    constructor() {
        this.pulseTimer = 0;
    }

    // ➕ 当 Boss 回血时调用一次
    trigger() {
        this.pulseTimer = 1.0; // 重置动画计时器
    }

    update(dt) {
        if (this.pulseTimer > 0) {
            this.pulseTimer -= dt * 0.0018; // 动画持续约 0.5 秒（dt为毫秒）
            if (this.pulseTimer < 0) this.pulseTimer = 0;
        }
    }

    // 在 Boss 绘制完成后调用，传入 Boss 当前的位置和半径
    draw(ctx, bossX, bossY, bossRadius) {
        if (this.pulseTimer <= 0) return;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // 动画进度：从 1 到 0
        const t = this.pulseTimer;
        // 波纹从 Boss 身体大小开始扩散到 1.5 倍大
        const scale = 1 + (1 - t) * 0.5; 
        const currentRadius = bossRadius * scale;
        // 透明度随扩散渐隐
        const opacity = t;

        // 1. 绘制扩散的能量光环
        ctx.beginPath();
        ctx.arc(bossX, bossY, currentRadius, 0, Math.PI * 2);
        // 明亮的治愈绿色
        ctx.strokeStyle = `rgba(80, 255, 100, ${opacity * 0.8})`;
        ctx.lineWidth = 6 * t; // 线条也会随时间变细
        ctx.stroke();

        // 2. 让 Boss 本体也短暂发绿光
        ctx.shadowColor = `rgba(100, 255, 120, ${opacity})`;
        ctx.shadowBlur = 40 * t;
        ctx.beginPath();
        ctx.arc(bossX, bossY, bossRadius * 0.95, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0)'; // 仅绘制光晕
        ctx.fill();

        ctx.restore();
    }
}

// 创建全局实例
export const effectsManager = new EffectsManager();