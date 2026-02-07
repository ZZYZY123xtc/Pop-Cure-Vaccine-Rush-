/**
 * 输入事件处理系统
 * 负责处理鼠标点击、技能触发等用户输入
 */

import { skillManager } from '../data/skills.js';
import { tutorialManager } from './tutorial.js';
import { effectsManager } from './effects.js';
import { gameManager, GAME_STATE } from '../core/game-manager.js';
import { uiManager } from '../managers/ui-manager.js';

const SAFE_ZONE_SIZE = 120;

/**
 * 初始化鼠标点击事件处理
 */
export function initMouseHandler(canvas, viruses, updateComboDisplay) {
    canvas.addEventListener('mousedown', (e) => {
        handleCanvasClick(e, canvas, viruses, updateComboDisplay);
    });
}

/**
 * 初始化技能按钮事件
 */
export function initSkillButton(activeSkillBtn, freezeCooldown, FREEZE_COOLDOWN_MAX, setFreezeCooldown) {
    if (!activeSkillBtn) return;

    activeSkillBtn.addEventListener('click', () => {
        if (gameManager.getGameState() !== GAME_STATE.PLAYING) return;
        if (freezeCooldown > 0) return; // 冷却中
        
        // 🔥 修复：传入回调，在冰冻结束后才开始CD
        const success = skillManager.triggerFreeze(() => {
            // 冰冻效果结束后，开始CD倒计时
            setFreezeCooldown(FREEZE_COOLDOWN_MAX);
            activeSkillBtn.classList.add('cooldown');
            console.log('🔥 冰冻技能开始CD，剩余', FREEZE_COOLDOWN_MAX, '秒');
        });
        
        if (!success) {
            console.log('❌ 冰冻技能触发失败');
        }
    });
}

/**
 * 处理Canvas点击事件
 */
function handleCanvasClick(e, canvas, viruses, updateComboDisplay) {
    // 教程期间只允许点击教程病毒
    if (tutorialManager.isActive()) {
        const tutorialVirus = tutorialManager.getTutorialVirus?.();
        if (!tutorialVirus) return;
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // 只检测教程病毒
        if (Math.hypot(mouseX - tutorialVirus.x, mouseY - tutorialVirus.y) < tutorialVirus.radius + 15) {
            // 教程病毒被点击，显示特效但不移除
            effectsManager.createExplosion(tutorialVirus.x, tutorialVirus.y, '#FFF', 5);
            // 可以选择在这里触发"点击成功"的反馈，比如让气泡闪烁
        }
        return;
    }
    
    if (gameManager.getGameState() !== GAME_STATE.PLAYING) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let hitVirus = false;
    
    for (let i = viruses.length - 1; i >= 0; i--) {
        const v = viruses[i];
        if (v.isTutorial || v.tutorialLock) continue;  // 保护教程病毒
        if (Math.hypot(mouseX - v.x, mouseY - v.y) < v.radius + 15) {
            hitVirus = true;
            const dead = v.hit();
            effectsManager.createExplosion(v.x, v.y, '#FFF', 3);
            
            if (dead) {
                effectsManager.createExplosion(v.x, v.y, v.props.color, 15);
                viruses.splice(i, 1);
                gameManager.addCuredCount(v.props.cureValue || 1);
                
                // 检查连击并触发闪电
                const triggerLightning = skillManager.checkCombo(true);
                updateComboDisplay();
                
                if (triggerLightning) {
                    // 寻找 200px 范围内的其他病毒
                    const lightningTargets = [];
                    for (let j = viruses.length - 1; j >= 0; j--) {
                        const target = viruses[j];
                        if (target.isTutorial || target.tutorialLock) continue;  // 保护教程病毒
                        const dist = Math.hypot(target.x - mouseX, target.y - mouseY);
                        if (dist < 200) {
                            lightningTargets.push({ x: target.x, y: target.y });
                            // 消灭被闪电击中的病毒
                            effectsManager.createExplosion(target.x, target.y, target.props.color, 15);
                            viruses.splice(j, 1);
                            gameManager.addCuredCount(target.props.cureValue || 1);
                        }
                    }
                    
                    // 激活闪电特效
                    if (lightningTargets.length > 0) {
                        skillManager.activateLightning(mouseX, mouseY, lightningTargets);
                    }
                }
            }
            break;
        }
    }
    
    // 未击中任何病毒，连击清零
    if (!hitVirus) {
        skillManager.checkCombo(false);
        updateComboDisplay();
    }
}

/**
 * 初始化"下一关"按钮事件
 */
export function initNextLevelButton(nextLevelBtn, uiManager, proceedToNextLevel) {
    if (!nextLevelBtn) return;

    nextLevelBtn.addEventListener('click', () => {
        uiManager.hideLevelComplete();
        proceedToNextLevel();
    });
}

/**
 * 初始化失败弹窗按钮
 */
export function initGameOverButton(gameOverBackBtn) {
    if (!gameOverBackBtn) return;

    gameOverBackBtn.addEventListener('click', () => {
        console.log('[GAME] 点击"返回地图"按钮');
        window.uiManager.hideAllModals();
        // 触发返回地图事件
        window.dispatchEvent(new CustomEvent('backToMapRequested'));
    });
}

export const inputHandler = {
    initMouseHandler,
    initSkillButton,
    initNextLevelButton,
    initGameOverButton
};
