/**
 * UI管理器 - 处理各种弹窗和界面更新
 */
import { Virus } from '../entities/virus.js';
import { modals } from '../ui/modals-ui.js';

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
        this.cdNumber = this.cooldownOverlay ? this.cooldownOverlay.querySelector('.cd-number') : null;
        
        // 图鉴弹窗元素
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

    // 更新关卡显示
    updateLevelDisplay(levelIndex, totalLevels) {
        this.levelDisplayHeader.innerText = `Level ${levelIndex + 1}`;
        this.totalLevelsHeader.innerText = totalLevels;
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
        
        // 被动技能（闪电）- Level 5+ 才能使用（Level 4 完成后解锁）
        const shouldShowLightning = skillManager.hasSkill('lightning') && currentLevelIndex >= 4;
        if (shouldShowLightning) {
            this.passiveSkillArea.classList.remove('hidden');
        } else {
            this.passiveSkillArea.classList.add('hidden');
        }
        
        // 主动技能（冰冻）- Level 4+ 才能使用（Level 3 完成后解锁）
        const shouldShowFreeze = skillManager.hasSkill('freeze') && currentLevelIndex >= 3;
        if (shouldShowFreeze) {
            this.skillContainer.classList.remove('hidden');
            this.activeSkillBtn.classList.remove('locked');
            this.activeSkillBtn.classList.remove('hidden');
        } else {
            // 技能未解锁或关卡不够时隐藏
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

    // 更新冷却UI
    updateCooldownUI(freezeCooldown, maxCooldown) {
        if (this.cooldownOverlay && this.cdNumber) {
            const percent = (freezeCooldown / maxCooldown) * 100;
            this.cooldownOverlay.style.height = percent + '%';
            this.cdNumber.textContent = Math.ceil(freezeCooldown);
        }
        
        if (freezeCooldown === 0) {
            this.activeSkillBtn.classList.remove('cooldown');
        }
    }

    // 隐藏所有弹窗
    hideAllModals() {
        this.gameOverScreen.classList.add('hidden');
        this.gameWinScreen.classList.add('hidden');  
        this.levelCompleteScreen.classList.add('hidden');
    }

    // 显示游戏结束界面
    showGameOver() {
        this.gameOverScreen.classList.remove('hidden');
        this.gameOverScreen.classList.add('visible');
    }

    // 显示游戏胜利界面
    showGameWin() {
        this.gameWinScreen.classList.remove('hidden');
        this.gameWinScreen.classList.add('visible');
    }

    // 显示关卡完成界面
    showLevelComplete() {
        this.levelCompleteScreen.classList.remove('hidden');
        this.levelCompleteScreen.classList.add('visible');
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

    // 切换屏幕显示


    showStartScreen() {
        console.log('[UI] 显示开始屏幕');
        this.startScreen.classList.remove('hidden');
        this.startScreen.style.display = 'flex';
        this.startScreen.style.zIndex = '10000';
        this.startScreen.style.opacity = '1'; /* 🔥 关键：强制不透明 */
        console.log('[UI] 开始屏幕 HTML:', this.startScreen ? 'Found' : 'Not Found');
        console.log('[UI] 已设置 opacity: 1');
    }
    
    hideStartScreen() {
        console.log('[UI] 隐藏开始屏幕');
        this.startScreen.classList.add('hidden');
        this.startScreen.style.display = 'none';
        console.log('[UI] 开始屏幕已隐藏');
    }

    hideLevelComplete() {
        this.levelCompleteScreen.classList.remove('visible');
        this.levelCompleteScreen.classList.add('hidden');
    }

    // 兼容方法：转发给 ModalsUI（保留以免外部直接调用失败）
    startSkillDemo(skillName) { if (modals && typeof modals.startSkillDemo === 'function') return modals.startSkillDemo(skillName); }
    stopSkillDemo() { if (modals && typeof modals.stopSkillDemo === 'function') return modals.stopSkillDemo(); }
}

// 创建全局实例
export const uiManager = new UIManager();