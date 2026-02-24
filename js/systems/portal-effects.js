/**
 * ==========================================
 * 🌌 马卡龙传送门系统 (PortalEffectSystem)
 * ==========================================
 * 风格：发光的甜甜圈入口，粉紫配色
 * 作用：Level 13 让病毒在屏幕上空间跳跃
 * 核心机制：
 * - 一对传送门（入口A → 出口B）
 * - 病毒触碰传送门时瞬移到另一个传送门
 * - 呼吸缩放动画，强烈发光效果
 */
export class PortalEffectSystem {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        
        // 传送门配置
        this.portals = [];
        this.isActive = false;
        this.pulseTimer = 0; // 呼吸动画计时器
        
        this.config = {
            radius: 40,              // 传送门半径
            detectionRadius: 50,     // 触发传送的检测半径
            cooldownPerVirus: 500,   // 每个病毒传送后的冷却时间（毫秒）
            pulseSpeed: 3,           // 呼吸动画速度
            pulseAmplitude: 0.05     // 呼吸动画振幅（5% 缩放）
        };
        
        console.log('[Portal] 🌌 马卡龙传送门系统已初始化');
    }

    /**
     * 激活传送门系统
     * @param {Object} portalConfig - 传送门配置 { portals: [{id, x, y, linkedTo}], ... }
     */
    activate(portalConfig = null) {
        this.isActive = true;
        this.pulseTimer = 0;
        
        // 默认配置：左上角和右下角
        if (!portalConfig || !portalConfig.portals) {
            this.portals = [
                { 
                    id: 'A', 
                    x: this.width * 0.15, 
                    y: this.height * 0.15,
                    linkedTo: 'B'
                },
                { 
                    id: 'B', 
                    x: this.width * 0.85, 
                    y: this.height * 0.85,
                    linkedTo: 'A'
                }
            ];
        } else {
            // 🔥 修复：将相对坐标(0-1)转换为绝对坐标(像素)
            this.portals = portalConfig.portals.map(p => ({
                id: p.id,
                x: p.x * this.width,  // 0.15 → 实际像素位置
                y: p.y * this.height,
                linkedTo: p.linkedTo
            }));
            
            // 如果配置中有半径和检测半径，也更新到实例属性
            if (portalConfig.radius) this.config.radius = portalConfig.radius;
            if (portalConfig.detectionRadius) this.config.detectionRadius = portalConfig.detectionRadius;
            if (portalConfig.cooldownPerVirus) this.config.cooldownPerVirus = portalConfig.cooldownPerVirus;
        }
        
        console.log('[Portal] 🌌 传送门已激活，总数:', this.portals.length);
        this.portals.forEach(p => {
            console.log(`  [Portal] ${p.id} → ${p.linkedTo}: (${p.x.toFixed(0)}, ${p.y.toFixed(0)})`);
        });
    }

    /**
     * 停用传送门系统
     */
    deactivate() {
        this.isActive = false;
        this.portals = [];
    }

    /**
     * 更新传送门状态
     * @param {number} dt - 时间步长（毫秒）
     */
    update(dt) {
        if (!this.isActive) return;
        
        // 更新呼吸动画计时器
        this.pulseTimer += dt / 1000; // 转换为秒
    }

    /**
     * 检测病毒是否触碰传送门，如果是则返回目标传送门坐标
     * @param {number} virusX - 病毒 x 坐标
     * @param {number} virusY - 病毒 y 坐标
     * @param {number} virusId - 病毒唯一 ID（用于冷却判定）
     * @param {number} currentTime - 当前时间戳（毫秒）
     * @returns {Object|null} 目标传送门 {x, y, fromPortalId} 或 null
     */
    checkTeleport(virusX, virusY, virusId, currentTime) {
        if (!this.isActive) return null;

        for (const portal of this.portals) {
            const distance = Math.sqrt((virusX - portal.x) ** 2 + (virusY - portal.y) ** 2);
            
            // 病毒进入传送门检测半径
            if (distance < this.config.detectionRadius) {
                // 找到目标传送门
                const targetPortal = this.portals.find(p => p.id === portal.linkedTo);
                if (!targetPortal) continue;

                // 检查病毒是否在冷却中（避免无限传送循环）
                const cooldownKey = `virus_${virusId}_portal_${portal.id}`;
                const lastTeleportTime = this._cooldowns?.[cooldownKey] || 0;
                
                if (currentTime - lastTeleportTime < this.config.cooldownPerVirus) {
                    // 还在冷却中，不传送
                    continue;
                }

                // 记录传送时间
                if (!this._cooldowns) this._cooldowns = {};
                this._cooldowns[cooldownKey] = currentTime;

                console.log(`[Portal] 🌀 病毒 ${virusId} 从传送门 ${portal.id} 传送到 ${targetPortal.id}`);
                
                return {
                    x: targetPortal.x,
                    y: targetPortal.y,
                    fromPortalId: portal.id,
                    toPortalId: targetPortal.id
                };
            }
        }

        return null;
    }

    /**
     * 绘制传送门
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        if (!this.isActive) return;

        for (const portal of this.portals) {
            this.drawSinglePortal(ctx, portal.x, portal.y, portal.id);
        }
    }

    /**
     * 绘制单个传送门
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} x - 传送门 x 坐标
     * @param {number} y - 传送门 y 坐标
     * @param {string} label - 传送门标签（A 或 B）
     */
    drawSinglePortal(ctx, x, y, label) {
        ctx.save();
        ctx.translate(x, y);
        
        // 呼吸缩放效果
        const scale = 1 + Math.sin(this.pulseTimer * this.config.pulseSpeed) * this.config.pulseAmplitude;
        ctx.scale(scale, scale);
        
        // 外圈强烈发光
        ctx.shadowColor = '#FFB7C5'; // 软糖粉光晕
        ctx.shadowBlur = 25;
        
        // 传送门主体渐变（粉到紫）
        const gradient = ctx.createRadialGradient(
            0, 0, this.config.radius * 0.4, 
            0, 0, this.config.radius
        );
        gradient.addColorStop(0, '#FFFCE0');   // 中心奶油亮色
        gradient.addColorStop(0.5, '#FFB7C5'); // 中间软糖粉
        gradient.addColorStop(1, '#BCA9E8');   // 边缘香芋紫
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.config.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 内部漩涡线条（增加细节）
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, this.config.radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, this.config.radius * 0.5, 0, Math.PI * 2);
        ctx.stroke();
        
        // 传送门标签（A 或 B）
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#FFFFFF';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${this.config.radius * 0.8}px 'Varela Round', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 0, 0);
        
        ctx.restore();
    }

    /**
     * 窗口大小改变时调用
     */
    resize(newWidth, newHeight) {
        this.width = newWidth;
        this.height = newHeight;
        
        // 重新计算传送门位置（保持相对位置）
        if (this.portals.length > 0) {
            const oldWidth = this.width;
            const oldHeight = this.height;
            
            this.portals = this.portals.map(portal => ({
                ...portal,
                x: (portal.x / oldWidth) * newWidth,
                y: (portal.y / oldHeight) * newHeight
            }));
        }
        
        console.log('[Portal] 🌌 传送门系统尺寸已更新:', newWidth.toFixed(0), 'x', newHeight.toFixed(0));
    }
}
