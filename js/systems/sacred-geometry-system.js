/**
 * 🍦 Level 24：信仰连结系统 (Sacred Geometry System)
 * 玩家自建防御网 - 信标 + 激光线
 */

export class SacredGeometrySystem {
    constructor(canvasWidth, canvasHeight, config = {}) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        
        // 配置
        this.beaconLifetime = config.beaconLifetime || 3000; // 信标存在3秒
        this.beaconRadius = config.beaconRadius || 8;
        this.beaconColor = config.beaconColor || 'rgba(212, 175, 55, 0.9)';
        this.laserColor = config.laserColor || 'rgba(255, 215, 0, 0.6)';
        this.laserWidth = config.laserWidth || 3;
        this.minBeaconsForLaser = config.minBeaconsForLaser || 2;
        
        // 信标数组
        this.beacons = [];
        
        console.log('[SacredGeometry] 🍦 信仰连结系统已初始化');
    }
    
    /**
     * 创建新信标（病毒死亡位置）
     */
    createBeacon(x, y) {
        this.beacons.push({
            x: x,
            y: y,
            age: 0,
            pulseTimer: Math.random() * Math.PI * 2
        });
        console.log('[SacredGeometry] ✨ 信标生成:', x.toFixed(0), y.toFixed(0));
    }
    
    /**
     * 更新信标和检测激光碰撞
     */
    update(dt, viruses) {
        // 更新信标寿命
        for (let i = this.beacons.length - 1; i >= 0; i--) {
            const beacon = this.beacons[i];
            beacon.age += dt;
            beacon.pulseTimer += dt * 0.003;
            
            // 寿命结束，移除信标
            if (beacon.age >= this.beaconLifetime) {
                this.beacons.splice(i, 1);
                console.log('[SacredGeometry] 💨 信标消失');
                continue;
            }
        }
        
        // 如果信标数量不足，无法形成激光
        if (this.beacons.length < this.minBeaconsForLaser) {
            return null;
        }
        
        // 检测病毒与激光线的碰撞
        const killedViruses = [];
        
        for (let i = 0; i < this.beacons.length; i++) {
            for (let j = i + 1; j < this.beacons.length; j++) {
                const b1 = this.beacons[i];
                const b2 = this.beacons[j];
                
                // 检测每个病毒是否与这条激光线相交
                for (const virus of viruses) {
                    if (virus.isTutorial || virus.laserKilled) continue;
                    
                    // 点到线段的距离
                    const distance = this.pointToSegmentDistance(
                        virus.x, virus.y,
                        b1.x, b1.y,
                        b2.x, b2.y
                    );
                    
                    if (distance < virus.radius) {
                        // 病毒触碰激光线！
                        virus.laserKilled = true;
                        killedViruses.push(virus);
                    }
                }
            }
        }
        
        return killedViruses.length > 0 ? killedViruses : null;
    }
    
    /**
     * 计算点到线段的距离
     */
    pointToSegmentDistance(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthSq = dx * dx + dy * dy;
        
        if (lengthSq === 0) {
            // 线段退化为点
            return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
        }
        
        // 计算投影参数 t
        let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
        t = Math.max(0, Math.min(1, t)); // 限制在[0, 1]范围内
        
        // 计算线段上最近点
        const closestX = x1 + t * dx;
        const closestY = y1 + t * dy;
        
        // 返回距离
        return Math.sqrt((px - closestX) * (px - closestX) + (py - closestY) * (py - closestY));
    }
    
    /**
     * 绘制信标和激光线
     */
    draw(ctx) {
        // 如果信标数量 >= 2，绘制激光线
        if (this.beacons.length >= this.minBeaconsForLaser) {
            ctx.save();
            ctx.strokeStyle = this.laserColor;
            ctx.lineWidth = this.laserWidth;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#FFD700';
            
            // 连接所有信标对
            for (let i = 0; i < this.beacons.length; i++) {
                for (let j = i + 1; j < this.beacons.length; j++) {
                    const b1 = this.beacons[i];
                    const b2 = this.beacons[j];
                    
                    ctx.beginPath();
                    ctx.moveTo(b1.x, b1.y);
                    ctx.lineTo(b2.x, b2.y);
                    ctx.stroke();
                }
            }
            
            ctx.restore();
        }
        
        // 绘制信标点
        for (const beacon of this.beacons) {
            ctx.save();
            
            // 呼吸效果
            const pulseScale = 1 + Math.sin(beacon.pulseTimer) * 0.3;
            const currentRadius = this.beaconRadius * pulseScale;
            
            // 外发光
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#FFD700';
            
            // 信标主体（金色圆点）
            ctx.fillStyle = this.beaconColor;
            ctx.beginPath();
            ctx.arc(beacon.x, beacon.y, currentRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // 内部白色高光
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(beacon.x - currentRadius * 0.3, beacon.y - currentRadius * 0.3, currentRadius * 0.4, 0, Math.PI * 2);
            ctx.fill();
            
            // 寿命指示环（逐渐缩小）
            const lifePercent = 1 - (beacon.age / this.beaconLifetime);
            ctx.strokeStyle = `rgba(212, 175, 55, ${lifePercent * 0.5})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(beacon.x, beacon.y, currentRadius + 5, 0, Math.PI * 2 * lifePercent);
            ctx.stroke();
            
            ctx.restore();
        }
    }
    
    /**
     * 调整尺寸
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
    
    /**
     * 清理资源
     */
    destroy() {
        this.beacons = [];
        console.log('[SacredGeometry] 🍦 信仰连结系统已清理');
    }
}
