/**
 * 教学引导系统
 */
import { TUTORIAL_STEPS } from '../data/story.js';

export class TutorialManager {
    constructor() {
        this.currentGuideStep = 0;
        this.totalGuideSteps = TUTORIAL_STEPS.length;
        this.tutorialVirus = null;
        this.tutorialActive = false;
    }

    // 设置教程病毒引用
    setTutorialVirus(virus) {
        this.tutorialVirus = virus;
    }

    // 激活教程状态
    activate() {
        this.tutorialActive = true;
    }

    // 检查是否需要显示引导
    checkTutorial(currentLevelIndex) {
        // 第一关总是显示引导（病毒图鉴介绍后）
        if (currentLevelIndex === 0 && this.tutorialActive) {
            // 延迟显示，让玩家先看到游戏画面和教程病毒
            setTimeout(() => {
                this.showTutorial();
            }, 500);
        }
    }

    // 显示教学引导
    showTutorial() {
        const tutorialOverlay = document.getElementById('tutorial-overlay');
        if (tutorialOverlay) {
            // 🔥 恢复游戏状态（教程期间游戏应该暂停但不是 LEVEL_OVER）
            import('./game-manager.js').then(({gameManager, GAME_STATE}) => {
                console.log('[Tutorial] 设置游戏状态为 LEVEL_OVER （暂停）');
                gameManager.gameState = GAME_STATE.LEVEL_OVER;
            });
            
            tutorialOverlay.classList.remove('hidden');
            this.currentGuideStep = 0;  // 从 0 开始（数组索引）
            this.showGuideStep(this.currentGuideStep);
        }
    }

    // 显示指定步骤（使用锚点定位）
    showGuideStep(stepIndex) {
        if (stepIndex >= TUTORIAL_STEPS.length) {
            this.endGuide();
            return;
        }
        
        const stepConfig = TUTORIAL_STEPS[stepIndex];
        
        // 隐藏所有气泡
        document.querySelectorAll('.guide-bubble').forEach(bubble => {
            bubble.classList.add('hidden');
        });
        
        // 🎯 如果是病毒锚点，使用 modals.showTutorialAt 方法
        if (stepConfig.anchor.type === 'virus' && stepConfig.anchor.target === 'tutorialVirus' && this.tutorialVirus) {
            console.log('[Tutorial] 使用 modals.showTutorialAt 方法定位病毒');
            
            // 动态导入 modals（避免循环依赖）
            import('./modals-ui.js').then(({modals}) => {
                modals.showTutorialAt(this.tutorialVirus, stepConfig, () => {
                    this.nextGuide();
                });
            });
            return;
        }
        
        // 🎯 否则使用传统定位方法（DOM元素锚点）
        const currentBubble = document.querySelector(`.guide-bubble.step-${stepConfig.id}`);
        if (!currentBubble) return;
        
        // 更新气泡内容
        const titleEl = currentBubble.querySelector('h3');
        const textEl = currentBubble.querySelector('p:not(.tip)');
        const tipEl = currentBubble.querySelector('p.tip');
        const btnEl = currentBubble.querySelector('button');
        
        if (titleEl) titleEl.textContent = stepConfig.title;
        if (textEl) textEl.textContent = stepConfig.text;
        if (tipEl) tipEl.textContent = stepConfig.tip;
        if (btnEl) {
            btnEl.textContent = stepConfig.buttonText || '下一步';
            // 🔥 重新绑定按钮事件（避免 onclick 冲突）
            btnEl.onclick = () => this.nextGuide();
        }
        
        // 显示气泡
        currentBubble.classList.remove('hidden');
        
        // 计算并应用锚点位置
        this.positionTooltip(currentBubble, stepConfig.anchor, stepConfig.placement);
    }

    // 锚点定位核心函数（改进版：使用 modals.showTutorialAt）
    positionTooltip(bubble, anchor, placement) {
        let targetX = 0;
        let targetY = 0;
        
        if (anchor.type === 'virus') {
            // 病毒坐标（世界坐标转屏幕坐标）
            if (anchor.target === 'tutorialVirus' && this.tutorialVirus) {
                // 🎯 使用改进的坐标计算
                const canvas = document.getElementById('gameCanvas');
                if (!canvas) {
                    console.error('[Tutorial] Canvas 未找到');
                    return;
                }
                const canvasRect = canvas.getBoundingClientRect();
                
                // Canvas 的世界坐标 → 屏幕坐标
                targetX = canvasRect.left + this.tutorialVirus.x;
                targetY = canvasRect.top + this.tutorialVirus.y;
                
                console.log('[Tutorial] 病毒坐标计算:', {
                    canvasLeft: canvasRect.left,
                    canvasTop: canvasRect.top,
                    virusX: this.tutorialVirus.x,
                    virusY: this.tutorialVirus.y,
                    screenX: targetX,
                    screenY: targetY
                });
            }
        } else if (anchor.type === 'element') {
            // DOM 元素定位
            const element = document.getElementById(anchor.target);
            if (element) {
                const rect = element.getBoundingClientRect();
                targetX = rect.left + rect.width / 2;
                targetY = rect.top + rect.height / 2;
            }
        }
        
        // 如果目标坐标为0，说明锚点无效，直接居中显示
        if (targetX === 0 && targetY === 0) {
            console.warn('[Tutorial] 锚点无效，居中显示气泡');
            bubble.style.position = 'fixed';
            bubble.style.left = '50%';
            bubble.style.top = '50%';
            bubble.style.transform = 'translate(-50%, -50%)';
            return;
        }
        
        // 获取气泡尺寸
        const bubbleWidth = bubble.offsetWidth || 320;
        const bubbleHeight = bubble.offsetHeight || 150;
        
        console.log('[Tutorial] 气泡尺寸:', { bubbleWidth, bubbleHeight });
        
        // 根据 placement 计算气泡位置
        let bubbleX = targetX;
        let bubbleY = targetY;
        
        // 移除旧的 placement class
        bubble.classList.remove('placement-top', 'placement-bottom');
        
        const GAP = 40;  // 🔥 气泡和目标的安全距离（与 modals-ui.js 保持一致）
        
        if (placement === 'top') {
            // 🔥 核心修复：目标顶部 - 气泡高度 - 间距
            bubbleY = targetY - bubbleHeight - GAP;
            bubble.classList.add('placement-top');
            console.log('[Tutorial] placement=top, 气泡在目标上方');
        } else if (placement === 'bottom') {
            // 目标底部 + 间距
            bubbleY = targetY + GAP;
            bubble.classList.add('placement-bottom');
            console.log('[Tutorial] placement=bottom, 气泡在目标下方');
        }
        
        // 边界检测：防止气泡超出屏幕
        const margin = 20;
        let adjustedBubbleX = bubbleX;
        let adjustedBubbleY = bubbleY;
        
        if (adjustedBubbleY < margin) adjustedBubbleY = margin;
        if (adjustedBubbleY + bubbleHeight > window.innerHeight - margin) {
            adjustedBubbleY = window.innerHeight - bubbleHeight - margin;
        }
        
        console.log('[Tutorial] 气泡最终位置:', {
            targetX, targetY,
            bubbleX, bubbleY: adjustedBubbleY,
            placement
        });
        
        // 应用位置（使用 fixed 定位 + translateX 居中）
        bubble.style.position = 'fixed';
        bubble.style.left = `${adjustedBubbleX}px`;
        bubble.style.top = `${adjustedBubbleY}px`;
        bubble.style.transform = 'translateX(-50%)'; // 水平居中对准目标
    }

    // 下一个引导步骤
    nextGuide() {
        this.currentGuideStep++;
        this.showGuideStep(this.currentGuideStep);
    }

    // 结束引导
    endGuide() {
        const tutorialOverlay = document.getElementById('tutorial-overlay');
        if (tutorialOverlay) {
            tutorialOverlay.classList.add('hidden');
        }
        this.currentGuideStep = 0;
        this.tutorialActive = false;  // 结束教程状态
        this.tutorialVirus = null;  // 清除教程病毒引用
        
        console.log('[Tutorial] 教程结束，触发 tutorialEnd 事件');
        
        // 🔥 触发自定义事件通知主游戏清理
        window.dispatchEvent(new CustomEvent('tutorialEnd'));
        
        return true; // 告诉外部可以清理教程病毒
    }

    // 窗口 resize 时重新定位教程气泡
    handleResize() {
        if (this.tutorialActive && this.currentGuideStep < this.totalGuideSteps) {
            // 重新计算当前步骤的定位
            setTimeout(() => {
                this.showGuideStep(this.currentGuideStep);
            }, 100);
        }
    }

    // Getter 方法
    isActive() {
        return this.tutorialActive;
    }

    getCurrentStep() {
        return this.currentGuideStep;
    }
}

// 创建全局实例
export const tutorialManager = new TutorialManager();

// 为了兼容现有的全局函数调用，导出全局函数
window.nextGuide = function() {
    tutorialManager.nextGuide();
};

window.endGuide = function() {
    const shouldCleanup = tutorialManager.endGuide();
    // 触发自定义事件通知主游戏清理
    if (shouldCleanup) {
        window.dispatchEvent(new CustomEvent('tutorialEnd'));
    }
};