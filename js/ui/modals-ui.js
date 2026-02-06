import { Virus } from '../entities/virus.js';
import SkillDemo from '../systems/skill-demo.js';
import { ENEMY_GUIDE, SKILL_GUIDE } from '../data/story.js';

export class ModalsUI {
    constructor() {
        // 关卡/结束弹窗
        this.gameOverScreen = document.getElementById('game-over');
        this.gameWinScreen = document.getElementById('game-win');
        this.levelCompleteScreen = document.getElementById('level-complete');

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

        // 技能演示画布（供技能弹窗使用）
        this.demoCanvas = document.getElementById('skill-demo-canvas');
        this.skillDemo = new SkillDemo(this.demoCanvas);

        this.previewAnimationId = null;
    }

    hideAllModals() {
        if (this.gameOverScreen) this.gameOverScreen.classList.add('hidden');
        if (this.gameWinScreen) this.gameWinScreen.classList.add('hidden');
        if (this.levelCompleteScreen) this.levelCompleteScreen.classList.add('hidden');
        if (this.skillUnlockModal) this.skillUnlockModal.classList.add('hidden');
        if (this.introModal) this.introModal.classList.add('hidden');
    }

    showGameOver() {
        if (!this.gameOverScreen) return;
        this.gameOverScreen.classList.remove('hidden');
        this.gameOverScreen.classList.add('visible');
    }

    showGameWin() {
        if (!this.gameWinScreen) return;
        this.gameWinScreen.classList.remove('hidden');
        this.gameWinScreen.classList.add('visible');
    }

    showLevelComplete() {
        if (!this.levelCompleteScreen) return;
        this.levelCompleteScreen.classList.remove('hidden');
        this.levelCompleteScreen.classList.add('visible');
    }

    hideLevelComplete() {
        if (!this.levelCompleteScreen) return;
        this.levelCompleteScreen.classList.remove('visible');
        this.levelCompleteScreen.classList.add('hidden');
    }

    // 显示图鉴弹窗并开始预览
    showIntroModal(virusType, onStart) {
        const enemyData = ENEMY_GUIDE[virusType];
        if (!enemyData) return;

        this.introName.textContent = enemyData.name;
        this.introDesc.textContent = enemyData.desc;
        this.introWeakness.textContent = enemyData.weakness;
        this.introHp.textContent = '❤️'.repeat(enemyData.hp);
        this.introDanger.textContent = '⭐'.repeat(enemyData.danger);

        this._setupIntroCanvas(virusType);

        this.introModal.classList.remove('hidden');
        this.introModal.classList.add('visible');

        this.introStartBtn.onclick = () => {
            this.introModal.classList.remove('visible');
            this.introModal.classList.add('hidden');
            if (this.previewAnimationId) cancelAnimationFrame(this.previewAnimationId);
            if (onStart) onStart();
        };
    }

    _setupIntroCanvas(virusType) {
        const canvas = this.introCanvas;
        if (!canvas) return;
        canvas.width = 120; canvas.height = 120;
        const ctx = canvas.getContext('2d');

        const previewVirus = new Virus(0, 0, virusType);

        const renderPreview = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#FFF9F0'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.save(); ctx.translate(canvas.width / 2, canvas.height / 2); ctx.scale(1.5, 1.5);
            previewVirus.update(16, 1000, 1000);
            previewVirus.x = 0; previewVirus.y = 0; previewVirus.draw(ctx);
            ctx.restore();
            if (!this.introModal.classList.contains('hidden')) this.previewAnimationId = requestAnimationFrame(renderPreview);
        };

        renderPreview();
    }

    // 显示技能解锁弹窗（包含演示）
    showSkillUnlockModal(skillName, onEquip) {
        const skillData = SKILL_GUIDE[skillName];
        if (!skillData) {
            console.error('未找到技能数据:', skillName);
            this.showLevelComplete();
            return;
        }

        this.unlockSkillIcon.textContent = skillData.icon;
        this.unlockSkillName.textContent = skillData.name;
        this.unlockSkillType.textContent = skillData.type;
        this.unlockSkillCd.textContent = skillData.cd;
        this.unlockSkillDesc.textContent = skillData.desc;

        this.skillUnlockModal.classList.remove('hidden');
        this.skillUnlockModal.classList.add('visible');

        // 启动演示
        this.skillDemo.start(skillName);

        this.equipSkillBtn.onclick = () => {
            this.skillDemo.stop();
            this.skillUnlockModal.classList.remove('visible');
            this.skillUnlockModal.classList.add('hidden');
            if (onEquip) onEquip();
            this.showLevelComplete();
        };
    }

    /**
     * 🎯 智能定位：显示教程气泡并对准目标（病毒或UI元素）
     * @param {Object} targetVirus - 目标病毒对象，包含 x, y, radius 坐标
     * @param {Object} tutorialStep - 教程步骤配置 (来自 TUTORIAL_STEPS)
     * @param {Function} onNext - 点击下一步的回调
     */
    showTutorialAt(targetVirus, tutorialStep, onNext) {
        console.log('[ModalsUI] showTutorialAt 调用, step:', tutorialStep.id);
        
        // 1. 获取气泡元素
        const bubbleSelector = `.guide-bubble.step-${tutorialStep.id}`;
        const bubble = document.querySelector(bubbleSelector);
        
        if (!bubble) {
            console.error('[ModalsUI] 气泡未找到:', bubbleSelector);
            return;
        }
        
        // 2. 先更新内容（在测量之前设置文本）
        const titleEl = bubble.querySelector('h3');
        const textEl = bubble.querySelector('p:not(.tip)');
        const tipEl = bubble.querySelector('p.tip');
        const btnEl = bubble.querySelector('button');
        
        if (titleEl) titleEl.textContent = tutorialStep.title;
        if (textEl) textEl.textContent = tutorialStep.text;
        if (tipEl) tipEl.textContent = tutorialStep.tip;
        if (btnEl) {
            btnEl.textContent = tutorialStep.buttonText || '下一步';
            btnEl.onclick = () => {
                if (onNext) onNext();
            };
        }
        
        // 🛑 3. 核心修复：使用 cssText 暴力禁止一切动画
        // 使用 cssText 一次性覆盖，防止任何 CSS 文件里的 transition 生效
        bubble.classList.remove('hidden');
        bubble.style.cssText = `
            position: fixed;
            opacity: 0;
            visibility: hidden;
            transition: none !important;
            transform: none !important;
            animation: none !important;
            left: 0px;
            top: 0px;
            z-index: 10000;
        `;
        
        // 📏 4. 同步测量 (立即执行，不等待下一帧)
        // 读取 offsetWidth 会强制浏览器在当前帧完成排版
        const finalWidth = bubble.offsetWidth;
        const finalHeight = bubble.offsetHeight;
        const GAP = 15;
        
        console.log('[ModalsUI] 气泡尺寸:', { finalWidth, finalHeight });
        
        // 🧮 5. 计算目标坐标
        let targetCenterX = 0;
        let targetBottomY = 0;
        let targetTopY = 0;
        
        // 移除旧的 placement 类
        bubble.classList.remove('placement-top', 'placement-bottom');
        
        if (targetVirus.radius !== undefined) {
            // 🦠 病毒 (Canvas实体)
            const canvas = document.getElementById('gameCanvas');
            if (!canvas) {
                console.error('[ModalsUI] Canvas 未找到');
                return;
            }
            const canvasRect = canvas.getBoundingClientRect();
            
            const screenX = canvasRect.left + targetVirus.x;
            const screenY = canvasRect.top + targetVirus.y;
            
            targetCenterX = screenX;
            targetBottomY = screenY + targetVirus.radius;
            targetTopY = screenY - targetVirus.radius;
            
            console.log('[ModalsUI] 🦠 病毒目标, 屏幕坐标:', { screenX, screenY });
        } else {
            // 📦 UI 元素 (DOM)
            const element = document.getElementById(tutorialStep.anchor.target);
            if (!element) {
                console.error('[ModalsUI] DOM元素未找到:', tutorialStep.anchor.target);
                return;
            }
            
            const rect = element.getBoundingClientRect();
            targetCenterX = rect.left + (rect.width / 2);
            targetBottomY = rect.bottom;
            targetTopY = rect.top;
            
            console.log('[ModalsUI] 📦 DOM元素目标:', tutorialStep.anchor.target);
        }
        
// 🎯 6. 计算气泡位置（居中）
        let left = targetCenterX - (finalWidth / 2);
        let top = 0;
        
        // 🛡️ ID 安全检查：防止 id 是字符串 "3" 导致 === 3 失败
        const isStep3 = (tutorialStep.id == 3);

        // 上下位置判定
        if (tutorialStep.placement === 'top') {
            top = targetTopY - finalHeight - GAP;
            
            // 🔧 特殊处理：第3步（感染警报）强制抬高
            if (isStep3) {
                // 这里设置 70px 或更多，确保让出免疫条的位置
                top -= 80; 
                console.log('检测到第3步，已强制抬高气泡');
            }
            
            bubble.classList.add('placement-top');
        } else {
            top = targetBottomY + GAP;
            bubble.classList.add('placement-bottom');
        }
        
        // 🚧 7. 边界修正
        const margin = 10;
        if (left < margin) left = margin;
        if (left + finalWidth > window.innerWidth - margin) {
            left = window.innerWidth - finalWidth - margin;
        }

        // 🔥 关键修改在这里！
        // 如果是第3步，跳过顶部的边界检查
        // 否则它会被下一行代码强制推下来，再次挡住免疫条
        if (!isStep3) {
            if (top < margin) top = margin;
        }

        if (top + finalHeight > window.innerHeight - margin) {
            top = window.innerHeight - finalHeight - margin;
        }
        
        // 📍 8. 立即应用坐标
        bubble.style.left = `${left}px`;
        bubble.style.top = `${top}px`;
        
        console.log('[ModalsUI] 气泡最终位置:', { left, top });
        
        // ✨ 9. 下一帧再开启淡入效果
        requestAnimationFrame(() => {
            bubble.style.visibility = 'visible';
            // 重新允许 opacity 动画（只针对 opacity，不影响 left/top）
            bubble.style.transition = 'opacity 0.2s ease-out';
            bubble.style.opacity = '1';
            console.log('[ModalsUI] 气泡淡入显示');
        });
    }

    startSkillDemo(skillName) { if (this.skillDemo) this.skillDemo.start(skillName); }
    stopSkillDemo() { if (this.skillDemo) this.skillDemo.stop(); }
}

// 导出默认实例，方便全局和调用方使用
export const modals = new ModalsUI();
export default ModalsUI;
