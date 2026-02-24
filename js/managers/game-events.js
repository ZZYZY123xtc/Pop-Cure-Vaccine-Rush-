/**
 * 游戏事件处理系统
 * 负责关卡切换、胜利失败、教程end等游戏事件
 */

import { LEVELS } from '../data/levels.js';
import { gameManager, GAME_STATE } from '../core/game-manager.js';
import { skillManager } from '../data/skills.js';

/**
 * 初始化教程结束事件
 */
export function initTutorialEndEvent(viruses, uiManager, tutorialManager, gameManager, resetSpawnViruses) {
    window.addEventListener('tutorialEnd', () => {
        console.log('[GAME] 收到 tutorialEnd 事件，清理教程病毒');
        console.log('[GAME] 清理前病毒数:', viruses.length);
        
        // 打印每个病毒的属性用于调试
        viruses.forEach((v, index) => {
            console.log(`[GAME] 病毒 ${index}:`, {
                isTutorial: v.isTutorial,
                tutorialLock: v.tutorialLock,
                type: v.type,
                x: v.x.toFixed(1),
                y: v.y.toFixed(1)
            });
        });
        
        viruses = viruses.filter(v => !v.tutorialLock && !v.isTutorial);
        console.log('[GAME] 清理后病毒数:', viruses.length);
        gameManager.gameState = GAME_STATE.PLAYING;
        gameManager.isGameActive = true; // ✅ 激活游戏逻辑
        console.log('[GAME] 游戏状态恢复为 PLAYING');
        
        // 🔥 核心修复：教程结束后生成真正的病毒开始游戏！
        const currentLevel = LEVELS[gameManager.getCurrentLevelIndex()];
        const initialCount = currentLevel?.initialCount || 3;
        console.log(`[GAME] 教程结束，生成 ${initialCount} 个初始病毒`);
        
        resetSpawnViruses(initialCount);
        
        uiManager.updateSkillUI(false, gameManager.getCurrentLevelIndex(), skillManager);
        
        // ✅ 启动游戏循环
        console.log('[GAME] 启动游戏循环');
        requestAnimationFrame(() => {});
    });
}

/**
 * 关卡完成处理
 */
export function triggerLevelComplete(gameManager, uiManager) {
    gameManager.endGame();
    // 直接显示关卡完成弹窗，不管奖励
    uiManager.showLevelComplete();
}

/**
 * 游戏失败处理
 */
export function triggerGameOver(gameManager, uiManager) {
    gameManager.endGame();
    uiManager.showGameOver();
    // 触发关卡失败事件，通知 SceneManager
    if (window.sceneManager) {
        const currentLevel = gameManager.getCurrentLevel();
        const event = new CustomEvent('levelFailed', { detail: { levelId: currentLevel?.id || 1 } });
        window.dispatchEvent(event);
    }
}

/**
 * 游戏胜利处理
 */
export function triggerGameWin(gameManager, uiManager) {
    gameManager.endGame();
    uiManager.showGameWin();
    // 触发关卡完成事件，通知 SceneManager
    if (window.sceneManager) {
        const currentLevel = gameManager.getCurrentLevel();
        // 计算星数（这里简单返回1星，可以改进为根据耗时/伤害计算）
        const event = new CustomEvent('levelCompleted', { detail: { levelId: currentLevel?.id || 1, stars: 1 } });
        window.dispatchEvent(event);
    }
}

/**
 * 下一关处理
 */
export function proceedToNextLevel(canvas, gameManager, uiManager, startGame) {
    if (gameManager.nextLevel()) {
        // 🔥 关键修复：重置游戏循环标志，确保下一关也能正常启动
        window.gameLoopStarted = false;
        
        // 🔥 重置冰冻技能CD（关卡切换时重置）
        if (window.freezeCooldown !== undefined) {
            window.freezeCooldown = 0;
            console.log('[GAME] ✅ 关卡切换：冰冻技能CD已重置');
        }
        
        // 🔥 重置 skillManager 的冰冻状态
        if (skillManager.isFrozen) {
            skillManager.isFrozen = false;
            console.log('[GAME] ✅ 关卡切换：skillManager.isFrozen 已重置');
        }
        
        // 🔥 清除可能残留的冰冻计时器
        if (skillManager.freezeTimer) {
            clearTimeout(skillManager.freezeTimer);
            skillManager.freezeTimer = null;
            console.log('[GAME] ✅ 关卡切换：清除残留的 freezeTimer');
        }
        
        // 🔥 重置冰冻剩余时间
        if (skillManager.freezeTimeRemaining > 0) {
            skillManager.freezeTimeRemaining = 0;
            console.log('[GAME] ✅ 关卡切换：freezeTimeRemaining 已重置');
        }
        
        // 🔥 立即更新UI，显示技能就绪状态
        if (uiManager && uiManager.updateCooldownUI) {
            uiManager.updateCooldownUI(0, 20, false);
            console.log('[GAME] ✅ 关卡切换：UI更新为技能就绪状态');
        }
        
        // 启动下一关
        startGame(gameManager.getCurrentLevelIndex());
    } else {
        // 最后一关已完成，游戏胜利
        triggerGameWin(gameManager, uiManager);
    }
}

/**
 * 初始化窗口 resize 处理
 */
export function initWindowResizeHandler(tutorialManager) {
    window.addEventListener('resize', () => {
        tutorialManager.handleResize();
    });
}

export const gameEvents = {
    initTutorialEndEvent,
    triggerLevelComplete,
    triggerGameOver,
    triggerGameWin,
    proceedToNextLevel,
    initWindowResizeHandler
};
