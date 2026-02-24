/**
 * UI管理器 - 处理各种弹窗和界面更新
 */
import { Virus } from '../entities/virus.js';
import { modals } from '../ui/modals-ui.js';
import { PERFORMANCE_CONFIG, perfLog } from '../core/performance-config.js';

export class UIManager {
    constructor() {
        // 获取所有UI元素引用
        this.cureBarHeader = document.getElementById('cure-bar-header');
        this.infectionBarFooter = document.getElementById('infection-bar-footer');
        this.gameOverScreen = document.getElementById('game-over');
        this.gameWinScreen = document.getElementById('game-win');
        this.levelCompleteScreen = document.getElementById('level-complete');
        this.levelDisplayHeader = document.getElementById('level-display-header');
        this.totalLevelsHeader = document.getElementById('total-levels-header');
        this.startScreen = document.getElementById('start-screen');
        this.skillContainer = document.getElementById('skill-container');
        this.passiveSkillArea = document.getElementById('passive-skill-area');
        this.comboCountEl = document.getElementById('combo-count');
        this.activeSkillBtn = document.getElementById('active-skill-btn');
        this.cooldownOverlay = this.activeSkillBtn ? this.activeSkillBtn.querySelector('.cooldown-overlay') : null;
        this.cdNumber = this.activeSkillBtn ? this.activeSkillBtn.querySelector('.cd-number') : null; // 🔥 现在是skill-btn的直接子元素
        
        // 🔥 内部状态追踪
        this._lastLoggedCD = -1; // 用于减少日志频率
        this._lastDisplayTime = -1; // 🔥 性能优化：缓存上次显示的时间，避免每帧修改DOM
        this._lastCDPercent = -1; // 🔥 缓存上次的CD百分比
        
        // 后面是图鉴弹窗元素
        this.introModal = document.getElementById('intro-modal');
        this.introCanvas = document.getElementById('intro-canvas');
        this.introName = document.getElementById('intro-name');
        this.introDesc = document.getElementById('intro-desc');
        this.introHp = document.getElementById('intro-hp');
        this.introDanger = document.getElementById('intro-danger');
        this.introWeakness = document.getElementById('intro-weakness');
        this.introStartBtn = document.getElementById('intro-start-btn');
        
        // 技能解锁弹窗元素
        this.skillUnlockModal = document.getElementById('skill-unlock-modal');
        this.unlockSkillIcon = document.getElementById('unlock-skill-icon');
        this.unlockSkillName = document.getElementById('unlock-skill-name');
        this.unlockSkillType = document.getElementById('unlock-skill-type');
        this.unlockSkillCd = document.getElementById('unlock-skill-cd');
        this.unlockSkillDesc = document.getElementById('unlock-skill-desc');
        this.equipSkillBtn = document.getElementById('equip-skill-btn');
        
        // 暂停菜单元素
        this.pauseMenu = document.getElementById('pause-menu');
        this.resumeGameBtn = document.getElementById('resume-game-btn');
        this.pauseBackToMapBtn = document.getElementById('pause-back-to-map-btn');

        // 第25关奶油浮窗
        this.finalBossBriefing = document.getElementById('final-boss-briefing');
        this.finalBossBriefingBtn = document.getElementById('final-boss-briefing-btn');
        
        // 关卡标题元素
        this.gameTitle = document.getElementById('game-title');
        
        // 技能演示画布由 ModalsUI 管理（不在 UIManager 中保存 DOM 引用）
    }

    // 更新进度条
    updateProgressBars(curedCount, levelGoal, virusCount, infectionThreshold) {
        // 治愈进度 = (已消除数 / 本关目标数) * 100%
        const curePercent = Math.min((curedCount / levelGoal) * 100, 100);
        this.cureBarHeader.style.width = curePercent + '%';
        
        // 感染进度 = (当前屏幕病毒数 / 本关警戒值) * 100%
        const infectionPercent = Math.min((virusCount / infectionThreshold) * 100, 100);
        this.infectionBarFooter.style.width = infectionPercent + '%';
    }

    setFinalBossLoadEffect(enabled) {
        if (!this.infectionBarFooter) return;

        if (enabled) {
            this.infectionBarFooter.classList.add('final-boss-load');
        } else {
            this.infectionBarFooter.classList.remove('final-boss-load');
        }
    }

    // 更新关卡显示
    updateLevelDisplay(levelIndex, totalLevels) {
        this.levelDisplayHeader.innerText = `Level ${levelIndex + 1}`;
        this.totalLevelsHeader.innerText = totalLevels;
    }
    
    // 🎮 动态更新关卡标题（任务 3）
    updateGameTitle(levelConfig) {
        if (!this.gameTitle || !levelConfig) return;
        
        // 优先次：description > subtitle > 默认标题
        let title = '培养皿守护战';
        
        if (levelConfig.description) {
            // 提取 description 中的第一部分（" - "之前）
            const parts = levelConfig.description.split(' - ');
            title = parts[0] || title;
        } else if (levelConfig.subtitle) {
            title = levelConfig.subtitle;
        }
        
        this.gameTitle.textContent = title;
        console.log('[UI] 关卡标题已更新:', title);
    }

    // 更新技能UI显示
    updateSkillUI(tutorialActive, currentLevelIndex, skillManager) {
        // 教程期间强制隐藏所有技能
        if (tutorialActive) {
            this.passiveSkillArea.classList.add('hidden');
            this.skillContainer.classList.add('hidden');
            this.activeSkillBtn.classList.add('hidden');
            return;
        }
        
        // 🔥 修复：技能UI根据关卡索引显示（开发模式也遵循渐进解锁）
        // 被动技能（闪电）- 第5关（0-based: index 4）开始显示
        const shouldShowLightning = currentLevelIndex >= 4; // Level 5+
        if (shouldShowLightning) {
            this.passiveSkillArea.classList.remove('hidden');
            perfLog.log('[UI] ✅ 闪电技能UI已显示 (Level', currentLevelIndex + 1, ')');
        } else {
            this.passiveSkillArea.classList.add('hidden');
        }
        
        // 主动技能（冰冻）- 第4关（0-based: index 3）开始显示
        const shouldShowFreeze = currentLevelIndex >= 3; // Level 4+
        if (shouldShowFreeze) {
            this.skillContainer.classList.remove('hidden');
            this.activeSkillBtn.classList.remove('locked');
            this.activeSkillBtn.classList.remove('hidden');
            perfLog.log('[UI] ✅ 冰冻技能UI已显示 (Level', currentLevelIndex + 1, ')');
        } else {
            // 技能未解锁时隐藏
            this.skillContainer.classList.add('hidden');
            this.activeSkillBtn.classList.add('hidden');
            this.activeSkillBtn.classList.add('locked');
        }
    }

    // 更新连击显示
    updateComboDisplay(comboCount) {
        if (this.comboCountEl) {
            this.comboCountEl.textContent = comboCount;
        }
    }

    // 更新冷却UI（完全重构：明确区分三种状态）
    updateCooldownUI(timeRemaining, maxTime, isFreezing = false) {
        // 🔥 添加防御检查
        if (!this.activeSkillBtn || !this.cooldownOverlay || !this.cdNumber) {
            console.warn('[UI] updateCooldownUI: 技能UI元素不存在');
            return;
        }
        
        // ========== 状态1：冰冻释放中（5秒） ==========
        if (isFreezing) {
            // 添加 active-frost 类，移除 on-cd 和 cooldown 类
            if (!this.activeSkillBtn.classList.contains('active-frost')) {
                this.activeSkillBtn.classList.add('active-frost');
            }
            this.activeSkillBtn.classList.remove('on-cd', 'cooldown');
            
            // 强制隐藏遮罩层（冰冻期间不显示遮罩）
            if (this.cooldownOverlay.style.height !== '0%') {
                this.cooldownOverlay.style.height = '0%';
            }
            
            // 🔥 性能优化：只有当数字变化时才更新DOM
            const freezeTime = Math.ceil(timeRemaining);
            if (freezeTime !== this._lastDisplayTime) {
                this.cdNumber.textContent = freezeTime.toString();
                this._lastDisplayTime = freezeTime;
            }
            
            // 确保数字可见
            if (this.cdNumber.style.opacity !== '1') {
                this.cdNumber.style.opacity = '1';
                this.cdNumber.style.visibility = 'visible';
                this.cdNumber.style.display = 'block';
            }
            return;
        }
        
        // ========== 状态2：CD冷却中（20秒） ==========
        if (timeRemaining > 0) {
            // 添加 on-cd 类，移除 active-frost 类
            if (!this.activeSkillBtn.classList.contains('on-cd')) {
                this.activeSkillBtn.classList.add('on-cd');
            }
            this.activeSkillBtn.classList.remove('active-frost');
            
            // 🔥 性能优化：遮罩按比例显示，但只在变化超过1%时更新
            const percent = (timeRemaining / maxTime) * 100;
            const percentInt = Math.floor(percent);
            if (percentInt !== this._lastCDPercent) {
                this.cooldownOverlay.style.height = percent + '%';
                this._lastCDPercent = percentInt;
            }
            
            // 🔥 性能优化：只有当数字变化时才更新DOM
            const cdTime = Math.ceil(timeRemaining);
            if (cdTime !== this._lastDisplayTime) {
                this.cdNumber.textContent = cdTime.toString();
                this._lastDisplayTime = cdTime;
            }
            
            // 确保数字可见
            if (this.cdNumber.style.opacity !== '1') {
                this.cdNumber.style.opacity = '1';
                this.cdNumber.style.visibility = 'visible';
                this.cdNumber.style.display = 'block';
            }
            return;
        }
        
        // ========== 状态3：技能就绪（0秒） ==========
        // 移除所有状态类
        if (this.activeSkillBtn.classList.contains('active-frost') || 
            this.activeSkillBtn.classList.contains('on-cd') ||
            this.activeSkillBtn.classList.contains('cooldown')) {
            this.activeSkillBtn.classList.remove('active-frost', 'on-cd', 'cooldown');
        }
        
        // 遮罩归零
        if (this.cooldownOverlay.style.height !== '0%') {
            this.cooldownOverlay.style.height = '0%';
        }
        
        // 🔥 性能优化：清空数字时重置缓存
        if (this.cdNumber.textContent !== '') {
            this.cdNumber.textContent = '';
            this._lastDisplayTime = -1;
            this._lastCDPercent = -1;
        }
    }

    // 🔥 改进版：隐藏所有覆盖层和弹窗（包括开始屏幕）
    hideAllModals() {
        // 隐藏结算弹窗
        if (this.gameOverScreen) this.gameOverScreen.classList.add('hidden');
        if (this.gameWinScreen) this.gameWinScreen.classList.add('hidden');  
        if (this.levelCompleteScreen) this.levelCompleteScreen.classList.add('hidden');
        
        // 🔥 隐藏开始屏幕（返回地图后重新进关时的关键）
        if (this.startScreen) {
            this.startScreen.classList.add('hidden');
            this.startScreen.style.display = 'none';
        }
        
        // 隐藏技能相关UI（重新开始时清空）
        if (this.skillContainer) this.skillContainer.classList.add('hidden');
        if (this.passiveSkillArea) this.passiveSkillArea.classList.add('hidden');
        
        // 隐藏图鉴和技能解锁弹窗
        if (this.introModal) this.introModal.classList.add('hidden');
        if (this.skillUnlockModal) this.skillUnlockModal.classList.add('hidden');
        if (this.finalBossBriefing) {
            this.finalBossBriefing.classList.remove('visible');
            this.finalBossBriefing.classList.add('hidden');
        }
        
        perfLog.debug('[UI] ✅ 已隐藏所有覆盖层和弹窗');
    }
    
    // 🔥 新增：完整的 UI 重置方法（关卡启动时用）
    resetUIForNewLevel() {
        console.log('[UI] 重置 UI 以准备新关卡');
        
        // 隐藏所有弹窗
        this.hideAllModals();
        
        // 重置技能UI（不显示CDoverlay）
        if (this.cooldownOverlay) {
            this.cooldownOverlay.style.opacity = '0';
            this.cooldownOverlay.style.height = '0%';
        }
        
        // 清空连击显示
        if (this.comboCountEl) {
            this.comboCountEl.textContent = '0';
        }
        
        // 重置进度条
        if (this.cureBarHeader) {
            this.cureBarHeader.style.width = '0%';
        }
        if (this.infectionBarFooter) {
            this.infectionBarFooter.style.width = '0%';
            this.infectionBarFooter.classList.remove('final-boss-load');
        }
        
        console.log('[UI] ✅ UI 重置完毕');
    }

    // 🔥 修复：添加 null 检查防止崩溃
    showGameOver() {
        if (this.gameOverScreen) {
            this.gameOverScreen.classList.remove('hidden');
            this.gameOverScreen.classList.add('visible');
        }
    }

    // 🔥 修复：添加 null 检查防止崩溃
    showGameWin() {
        if (this.gameWinScreen) {
            this.gameWinScreen.classList.remove('hidden');
            this.gameWinScreen.classList.add('visible');
        }
    }

    // 🔥 修复：添加 null 检查防止崩溃
    showLevelComplete() {
        if (this.levelCompleteScreen) {
            this.levelCompleteScreen.classList.remove('hidden');
            this.levelCompleteScreen.classList.add('visible');
        }
    }

    // 显示图鉴弹窗
    showIntroModal(virusType, onStart) {
        if (modals && typeof modals.showIntroModal === 'function') {
            return modals.showIntroModal(virusType, onStart);
        }
        console.warn('Modals not available; intro modal not shown');
    }

    // 设置图鉴Canvas预览
    _setupIntroCanvas(virusType) {
        // 强制设置 Canvas 内部分辨率 (防止模糊)
        const canvas = this.introCanvas;
        canvas.width = 120;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');
        
        // 实例化一个临时病毒用于展示
        const previewVirus = new Virus(0, 0, virusType);
        
        // 启动一个小动画循环来画它
        const renderPreview = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // 绘制背景
            ctx.fillStyle = '#FFF9F0';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.save();
            // 把画笔移动到 Canvas 正中心
            ctx.translate(canvas.width / 2, canvas.height / 2);
            
            // 稍微放大一点 (1.5倍)
            ctx.scale(1.5, 1.5);
            
            // 调用病毒自己的 draw 方法
            previewVirus.update(16, 1000, 1000);
            // 强制修正位置回 0,0
            previewVirus.x = 0;
            previewVirus.y = 0;
            
            previewVirus.draw(ctx);
            
            ctx.restore();
            
            if(!this.introModal.classList.contains('hidden')) {
                this.previewAnimationId = requestAnimationFrame(renderPreview);
            }
        };
        
        // 开始预览动画
        renderPreview();
    }

    // 显示技能解锁弹窗
    showSkillUnlockModal(skillName, onEquip) {
        if (modals && typeof modals.showSkillUnlockModal === 'function') {
            return modals.showSkillUnlockModal(skillName, onEquip);
        }
        console.warn('Modals not available; skill unlock modal not shown');
    }

    // 第25关：显示奶油浮窗
    showFinalBossBriefing(onConfirm) {
        if (!this.finalBossBriefing || !this.finalBossBriefingBtn) return;

        this.finalBossBriefing.classList.remove('hidden');
        this.finalBossBriefing.classList.add('visible');

        this.finalBossBriefingBtn.onclick = () => {
            this.finalBossBriefing.classList.remove('visible');
            this.finalBossBriefing.classList.add('hidden');
            if (typeof onConfirm === 'function') {
                onConfirm();
            }
        };
    }

    // 切换屏幕显示


    showStartScreen() {
        perfLog.debug('[UI] 显示开始屏幕');
        this.startScreen.classList.remove('hidden');
        this.startScreen.style.display = 'flex';
        this.startScreen.style.zIndex = '10000';
        this.startScreen.style.opacity = '1'; /* 🔥 关键：强制不透明 */
        console.log('[UI] 开始屏幕 HTML:', this.startScreen ? 'Found' : 'Not Found');
        console.log('[UI] 已设置 opacity: 1');
    }
    
    hideStartScreen() {
        perfLog.debug('[UI] 隐藏开始屏幕');
        this.startScreen.classList.add('hidden');
        this.startScreen.style.display = 'none';
        console.log('[UI] 开始屏幕已隐藏');
    }

    hideLevelComplete() {
        this.levelCompleteScreen.classList.remove('visible');
        this.levelCompleteScreen.classList.add('hidden');
    }
    
    // ⏸️ 显示暂停菜单（任务 1）
    showPauseMenu() {
        if (this.pauseMenu) {
            this.pauseMenu.classList.remove('hidden');
            this.pauseMenu.classList.add('visible');
            console.log('[UI] 暂停菜单已显示');
        }
    }
    
    // ▶️ 隐藏暂停菜单（任务 1）
    hidePauseMenu() {
        if (this.pauseMenu) {
            this.pauseMenu.classList.remove('visible');
            this.pauseMenu.classList.add('hidden');
            console.log('[UI] 暂停菜单已隐藏');
        }
    }

    // 兼容方法：转发给 ModalsUI（保留以免外部直接调用失败）
    startSkillDemo(skillName) { if (modals && typeof modals.startSkillDemo === 'function') return modals.startSkillDemo(skillName); }
    stopSkillDemo() { if (modals && typeof modals.stopSkillDemo === 'function') return modals.stopSkillDemo(); }
}

// 创建全局实例
export const uiManager = new UIManager();