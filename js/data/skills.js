/**
 * 技能管理系统
 * 负责管理被动技能（闪电连击）和主动技能（冰冻）
 */

class SkillManager {
    constructor() {
        // 已解锁的技能集合
        this.unlockedSkills = new Set();
        
        // 冰冻状态
        this.isFrozen = false;
        this.freezeTimer = null;
        this.freezeTimeRemaining = 0; // 🔥 新增：冰冻剩余时间（用于UI显示）
        
        // 连击系统
        this.comboCount = 0;
        
        // 闪电特效状态
        this.lightningActive = false;
        this.lightningTimer = null;
        this.lightningTargets = []; // 存储闪电击中的目标位置
        this.lightningOrigin = { x: 0, y: 0 }; // 闪电起点
        
        // � 开发模式：预解锁所有已设计的技能（与地图解锁同步）
        this.unlockedSkills.add('freeze');      // 第4关解锁的冰冻技能
        this.unlockedSkills.add('lightning');   // 第5关解锁的闪电技能
        console.log('[开发模式] 技能预解锁: freeze, lightning');
        
        // �🚫 禁用技能进度保存：每次刷新都清空已解锁技能
        // this.loadProgress();
    }
    
    /**
     * 解锁技能并保存到 localStorage
     */
    unlock(skillName) {
        this.unlockedSkills.add(skillName);
        this.saveProgress();
        console.log(`✨ 技能已解锁: ${skillName}`);
    }
    
    /**
     * 检查是否已解锁某技能
     */
    hasSkill(skillName) {
        return this.unlockedSkills.has(skillName);
    }
    
    /**
     * 连击检测
     * @param {boolean} isHit - 是否击中病毒
     * @returns {boolean} 是否触发了闪电特效
     */
    checkCombo(isHit) {
        if (isHit) {
            this.comboCount++;
            
            // 检查是否触发闪电（每 5 连击触发一次）
            if (this.hasSkill('lightning') && this.comboCount >= 5) {
                console.log(`⚡ 闪电触发！Combo: ${this.comboCount} → 重置为0`);
                this.comboCount = 0; // 🔥 触发闪电后立即归零，重新开始计数
                return true;
            }
        } else {
            // 未击中则重置连击
            this.comboCount = 0;
        }
        return false;
    }
    
    /**
     * 获取当前连击数
     */
    getCombo() {
        return this.comboCount;
    }
    
    /**
     * 触发冰冻技能
     * @param {Function} onFreezeEnd - 冰冻结束后的回调函数
     * @returns {boolean} 是否成功触发（false 表示技能未解锁或正在冷却）
     */
    triggerFreeze(onFreezeEnd) {
        // 检查技能是否已解锁
        if (!this.hasSkill('freeze')) {
            console.log('❌ 冰冻技能尚未解锁');
            return false;
        }
        
        // 检查是否正在冰冻中
        if (this.isFrozen) {
            console.log('❌ 冰冻技能正在使用中');
            return false;
        }
        
        // 激活冰冻
        this.isFrozen = true;
        this.freezeTimeRemaining = 5; // 🔥 新增：冰冻剩余时间（秒）
        console.log('❄️ 冰冻技能已激活！');
        
        // 5 秒后自动解除冰冻
        this.freezeTimer = setTimeout(() => {
            this.isFrozen = false;
            this.freezeTimeRemaining = 0;
            console.log('❄️ 冰冻效果已结束');
            
            // 🔥 调用回调（在冰冻结束后才开始CD）
            if (onFreezeEnd) {
                onFreezeEnd();
            }
        }, 5000);
        
        return true;
    }
    
    /**
     * 激活闪电特效显示
     * @param {number} x - 起点 X 坐标
     * @param {number} y - 起点 Y 坐标
     * @param {Array} targets - 目标数组 [{x, y}, ...]
     */
    activateLightning(x, y, targets) {
        this.lightningActive = true;
        this.lightningOrigin = { x, y };
        this.lightningTargets = targets;
        
        console.log('[LIGHTNING] ⚡ 闪电技能已激活！绘制闪电链...');
        
        // 清除旧的定时器
        if (this.lightningTimer) {
            clearTimeout(this.lightningTimer);
        }
        
        // 300ms 后关闭特效（非阻塞）
        this.lightningTimer = setTimeout(() => {
            this.lightningActive = false;
            this.lightningTargets = [];
        }, 300);
    }
    
    /**
     * 绘制闪电特效
     * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
     */
    drawLightning(ctx) {
        if (!this.lightningActive || this.lightningTargets.length === 0) {
            return;
        }
        
        ctx.save();
        
        // 设置闪电样式
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00D9FF';
        ctx.shadowBlur = 15;
        ctx.lineCap = 'round';
        
        // 遍历所有目标，绘制从起点到目标的闪电
        this.lightningTargets.forEach(target => {
            this.drawLightningBolt(ctx, this.lightningOrigin.x, this.lightningOrigin.y, target.x, target.y);
        });
        
        ctx.restore();
    }
    
    /**
     * 绘制单条闪电折线
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} startX
     * @param {number} startY
     * @param {number} endX
     * @param {number} endY
     */
    drawLightningBolt(ctx, startX, startY, endX, endY) {
        const segments = 8; // 闪电分段数
        const jitter = 15; // 抖动幅度
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        // 计算每段的基础位置
        const dx = (endX - startX) / segments;
        const dy = (endY - startY) / segments;
        
        let currentX = startX;
        let currentY = startY;
        
        for (let i = 1; i <= segments; i++) {
            // 最后一段直接连到终点
            if (i === segments) {
                ctx.lineTo(endX, endY);
            } else {
                // 添加随机偏移
                const offsetX = (Math.random() - 0.5) * jitter;
                const offsetY = (Math.random() - 0.5) * jitter;
                
                currentX = startX + dx * i + offsetX;
                currentY = startY + dy * i + offsetY;
                
                ctx.lineTo(currentX, currentY);
            }
        }
        
        ctx.stroke();
    }
    
    /**
     * 保存技能进度到 localStorage (🚫 已禁用)
     */
    saveProgress() {
        // 🚫 禁用进度保存：每次刷新都重新开始
        // const data = {
        //     unlockedSkills: Array.from(this.unlockedSkills)
        // };
        // localStorage.setItem('skillProgress', JSON.stringify(data));
    }
    
    /**
     * 从 localStorage 加载技能进度
     */
    loadProgress() {
        const saved = localStorage.getItem('skillProgress');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.unlockedSkills = new Set(data.unlockedSkills || []);
                console.log('📦 已加载技能进度:', Array.from(this.unlockedSkills));
            } catch (e) {
                console.error('❌ 技能进度加载失败:', e);
            }
        }
    }
    
    /**
     * 重置所有技能（调试用）
     */
    reset() {
        this.unlockedSkills.clear();
        this.isFrozen = false;
        this.comboCount = 0;
        this.lightningActive = false;
        if (this.freezeTimer) clearTimeout(this.freezeTimer);
        if (this.lightningTimer) clearTimeout(this.lightningTimer);
        this.saveProgress();
        console.log('🔄 技能系统已重置');
    }
}

// 导出单例实例
export const skillManager = new SkillManager();
