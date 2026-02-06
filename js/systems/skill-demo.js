/**
 * SkillDemo - 独立的技能演示模块（Canvas 实时渲染）
 */
export class SkillDemo {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas ? canvas.getContext('2d') : null;
        this.animationId = null;
        this.startTime = 0;
        this.runningSkill = null;
    }

    start(skillName) {
        if (!this.ctx || !this.canvas) return;
        this.startTime = Date.now();
        this.runningSkill = skillName;
        if (skillName === 'lightning') this.runLightningDemo();
        else if (skillName === 'freeze') this.runFreezeDemo();
    }

    stop() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = null;
        this.runningSkill = null;
    }

    // === 闪电演示 ===
    runLightningDemo() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const width = canvas.width;
        const height = canvas.height;

        const demoViruses = [
            { x: 140, y: 70, radius: 18, type: 'A', destroyed: false },
            { x: 80, y: 50, radius: 16, type: 'A', destroyed: false },
            { x: 180, y: 100, radius: 20, type: 'B', destroyed: false },
            { x: 220, y: 60, radius: 14, type: 'C', destroyed: false },
            { x: 60, y: 110, radius: 17, type: 'A', destroyed: false }
        ];

        const animate = () => {
            const currentTime = Date.now();
            const elapsed = (currentTime - this.startTime) % 6000;

            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = '#333';
            for (let i = 0; i < 15; i++) ctx.fillRect((i * 73) % width, (i * 37) % height, 1, 1);

            if (elapsed < 4000) {
                const phase = Math.floor(elapsed / 800);
                demoViruses.forEach((v, idx) => { v.destroyed = idx <= phase; });

                demoViruses.forEach((v, idx) => {
                    if (!v.destroyed) this.drawRealVirus(ctx, v, idx === phase);
                });

                let clickX = demoViruses[phase] ? demoViruses[phase].x : 0;
                let clickY = demoViruses[phase] ? demoViruses[phase].y : 0;

                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 16px Arial';
                ctx.fillText(`Combo: ${phase}`, 10, 25);

                if (phase < demoViruses.length) {
                    const pulseAlpha = 0.5 + 0.5 * Math.sin((elapsed % 800) / 800 * Math.PI * 4);
                    ctx.globalAlpha = pulseAlpha;
                    ctx.fillStyle = '#FFD700';
                    ctx.font = 'bold 14px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('↓ 点击消灭 ↓', clickX, clickY - 28);
                    ctx.textAlign = 'left';
                    ctx.globalAlpha = 1;
                }

                if (phase === 4 && (elapsed % 800) > 400) {
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#00D9FF';
                    ctx.shadowBlur = 10;
                    demoViruses.slice(1, 4).forEach(t => this.drawLightningBolt(ctx, clickX, clickY, t.x, t.y));
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = '#00D9FF';
                    ctx.font = 'bold 18px Arial';
                    ctx.fillText('⚡ 连环闪电！', 50, 130);
                }
            } else {
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('连击5次触发群体攻击', width / 2, height / 2 - 10);
                ctx.fillText('范围: 200px', width / 2, height / 2 + 10);
                ctx.textAlign = 'left';
            }

            this.animationId = requestAnimationFrame(animate);
        };

        animate();
    }

    // === 冰冻演示 ===
    runFreezeDemo() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const width = canvas.width;
        const height = canvas.height;

        const demoViruses = [
            { x: 60, y: 70, vx: 1.5, vy: 0.8, radius: 16, type: 'A', frozen: false },
            { x: 160, y: 50, vx: -1, vy: 1.5, radius: 18, type: 'B', frozen: false },
            { x: 100, y: 100, vx: 0.8, vy: -1.2, radius: 14, type: 'C', frozen: false }
        ];

        const animate = () => {
            const currentTime = Date.now();
            const elapsed = (currentTime - this.startTime) % 8000;

            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = '#333';
            for (let i = 0; i < 12; i++) ctx.fillRect((i * 67) % width, (i * 41) % height, 1, 1);

            const freezeActive = elapsed >= 3000 && elapsed < 8000;

            demoViruses.forEach(virus => {
                if (!freezeActive) {
                    virus.x += virus.vx;
                    virus.y += virus.vy;
                    if (virus.x <= virus.radius || virus.x >= width - virus.radius) virus.vx *= -1;
                    if (virus.y <= virus.radius || virus.y >= height - virus.radius) virus.vy *= -1;
                }
                virus.frozen = freezeActive;
                this.drawRealVirus(ctx, virus, false);

                if (freezeActive) {
                    ctx.save();
                    ctx.globalAlpha = 0.7;
                    ctx.strokeStyle = '#87CEEB';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(virus.x, virus.y, virus.radius + 6, 0, Math.PI * 2);
                    ctx.stroke();

                    const crystals = 6;
                    for (let i = 0; i < crystals; i++) {
                        const angle = (i / crystals) * Math.PI * 2 + elapsed * 0.001;
                        const x1 = virus.x + Math.cos(angle) * (virus.radius + 4);
                        const y1 = virus.y + Math.sin(angle) * (virus.radius + 4);
                        const x2 = virus.x + Math.cos(angle) * (virus.radius + 10);
                        const y2 = virus.y + Math.sin(angle) * (virus.radius + 10);
                        ctx.strokeStyle = '#00BFFF';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x2, y2);
                        ctx.stroke();
                    }
                    ctx.restore();
                }
            });

            if (elapsed < 3000) {
                const buttonX = width - 35;
                const buttonY = height - 25;
                ctx.fillStyle = '#4A9EFF';
                ctx.beginPath();
                ctx.arc(buttonX, buttonY, 20, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#FFF';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('❄️', buttonX, buttonY + 5);
                const pulseAlpha = 0.5 + 0.5 * Math.sin(elapsed * 0.005);
                ctx.globalAlpha = pulseAlpha;
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 10px Arial';
                ctx.fillText('点击激活', buttonX, buttonY - 28);
                ctx.globalAlpha = 1;
                ctx.textAlign = 'left';
            } else if (elapsed < 8000) {
                ctx.fillStyle = '#00BFFF';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('❄️ 极寒领域激活', width / 2, 20);
                ctx.fillText('病毒停止移动和分裂', width / 2, 35);
                ctx.textAlign = 'left';
            }

            this.animationId = requestAnimationFrame(animate);
        };

        animate();
    }

    // --- 绘制辅助（复用游戏内风格） ---
    drawRealVirus(ctx, virusData, highlight = false) {
        ctx.save();
        ctx.translate(virusData.x, virusData.y);
        if (highlight) {
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 12;
            const time = Date.now() * 0.005;
            const pulseRadius = virusData.radius + 3 + 2 * Math.sin(time);
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, 0, pulseRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        const mockVirus = {
            typeKey: virusData.type,
            radius: virusData.radius,
            rotation: virusData.frozen ? 0 : Date.now() * 0.001,
            props: this.getVirusProps(virusData.type)
        };

        ctx.fillStyle = mockVirus.props.color;
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';

        if (mockVirus.typeKey === 'A') this.drawVirusTypeA(ctx, mockVirus);
        else if (mockVirus.typeKey === 'B') this.drawVirusTypeB(ctx, mockVirus);
        else if (mockVirus.typeKey === 'C') this.drawVirusTypeC(ctx, mockVirus);

        this.drawVirusFace(ctx, mockVirus);
        ctx.restore();
    }

    getVirusProps(type) {
        const props = { 'A': { color: '#FFB6C1' }, 'B': { color: '#87CEEB' }, 'C': { color: '#FFD700' } };
        return props[type] || props['A'];
    }

    drawVirusTypeA(ctx, virus) {
        ctx.beginPath(); ctx.arc(0, 0, virus.radius * 0.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        const bumps = 8;
        for (let i = 0; i < bumps; i++) {
            const angle = (Math.PI * 2 / bumps) * i;
            const bx = Math.cos(angle) * virus.radius;
            const by = Math.sin(angle) * virus.radius;
            ctx.beginPath(); ctx.arc(bx, by, virus.radius * 0.25, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
    }

    drawVirusTypeB(ctx, virus) {
        ctx.rotate(virus.rotation);
        ctx.beginPath(); ctx.arc(0, 0, virus.radius * 0.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        const circleCount = 7; const smallRadius = virus.radius * 0.35;
        for (let i = 0; i < circleCount; i++) {
            const angle = (Math.PI * 2 / circleCount) * i;
            const cx = Math.cos(angle) * (virus.radius * 0.65);
            const cy = Math.sin(angle) * (virus.radius * 0.65);
            ctx.beginPath(); ctx.arc(cx, cy, smallRadius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
    }

    drawVirusTypeC(ctx, virus) { ctx.rotate(virus.rotation); this.drawRoundedStar(ctx, 0, 0, virus.radius); ctx.fill(); ctx.stroke(); }

    drawVirusFace(ctx, virus) {
        if (virus.typeKey === 'B' || virus.typeKey === 'C') ctx.rotate(-virus.rotation);
        ctx.fillStyle = '#333';
        const eyeOffsetX = virus.radius * 0.25; const eyeOffsetY = -virus.radius * 0.1; const eyeSize = virus.radius * 0.12;
        ctx.beginPath(); ctx.arc(-eyeOffsetX, eyeOffsetY, eyeSize, 0, Math.PI * 2); ctx.arc(eyeOffsetX, eyeOffsetY, eyeSize, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#333'; ctx.lineCap = 'round';
        if (virus.typeKey === 'A') ctx.arc(0, virus.radius * 0.1, virus.radius * 0.15, 0.2, Math.PI - 0.2);
        else if (virus.typeKey === 'B') { ctx.moveTo(-virus.radius * 0.1, virus.radius * 0.2); ctx.lineTo(virus.radius * 0.1, virus.radius * 0.2); }
        else ctx.arc(0, virus.radius * 0.25, virus.radius * 0.1, Math.PI, 0);
        ctx.stroke();
    }

    drawRoundedStar(ctx, x, y, radius) {
        ctx.beginPath(); const points = 4; const angleStep = (Math.PI * 2) / points;
        for (let i = 0; i < points; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const outerX = x + Math.cos(angle) * radius; const outerY = y + Math.sin(angle) * radius;
            const nextAngle = angle + angleStep; const nextOuterX = x + Math.cos(nextAngle) * radius; const nextOuterY = y + Math.sin(nextAngle) * radius;
            const midAngle = angle + angleStep / 2; const innerX = x + Math.cos(midAngle) * (radius * 0.5); const innerY = y + Math.sin(midAngle) * (radius * 0.5);
            if (i === 0) ctx.moveTo(outerX, outerY); else ctx.lineTo(outerX, outerY);
            ctx.quadraticCurveTo(innerX, innerY, nextOuterX, nextOuterY);
        }
        ctx.closePath();
    }

    drawLightningBolt(ctx, x1, y1, x2, y2) {
        const segments = 6; const dx = (x2 - x1) / segments; const dy = (y2 - y1) / segments;
        ctx.beginPath(); ctx.moveTo(x1, y1);
        for (let i = 1; i < segments; i++) {
            const x = x1 + dx * i + (Math.random() - 0.5) * 15; const y = y1 + dy * i + (Math.random() - 0.5) * 15; ctx.lineTo(x, y);
        }
        ctx.lineTo(x2, y2); ctx.stroke();
    }
}

export default SkillDemo;
