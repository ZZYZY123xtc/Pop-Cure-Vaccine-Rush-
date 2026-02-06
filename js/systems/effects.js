/**
 * 视觉效果管理器 - 处理粒子效果、爆炸、背景绘制等
 */
import { Particle } from '../entities/particle.js';

export class EffectsManager {
    constructor() {
        this.particles = [];
    }

    // 创建爆炸效果
    createExplosion(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
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
    updateParticles(ctx) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update();
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            } else {
                p.draw(ctx);
            }
        }
    }

    // 绘制波点背景
    drawBackground(ctx, canvasWidth, canvasHeight) {
        ctx.fillStyle = '#E8F1F2';
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

// 创建全局实例
export const effectsManager = new EffectsManager();