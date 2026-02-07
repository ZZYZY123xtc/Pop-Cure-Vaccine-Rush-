/**
 * 游戏调试工具系统
 * 提供控制台快捷命令用于测试和调试
 */

import { skillManager } from '../data/skills.js';
import { gameManager, GAME_STATE } from '../core/game-manager.js';
import { startGame } from '../core/game.js';

/**
 * 初始化所有调试命令
 */
export function initDebugger(uiManager, tutorialManager, viruses, freezeCooldown, FREEZE_COOLDOWN_MAX) {
    // ------- 调试命令 -------
    
    window.debugJumpToLevel = (levelIndex) => {
        console.log(`[DEBUG] 🚀 跳转到第 ${levelIndex + 1} 关`);
        
        // 强制关闭所有弹窗
        uiManager.hideAllModals();
        document.querySelectorAll('.modal, .screen').forEach(el => {
            el.classList.remove('visible');
            el.classList.add('hidden');
        });
        
        // 强制关闭教程
        if (tutorialManager) {
            tutorialManager.tutorialActive = false;
        }
        
        // 解锁到目标关卡
        if (window.sceneManager && window.sceneManager.playerState) {
            window.sceneManager.playerState.maxLevel = levelIndex + 1;
            console.log(`[DEBUG] ✅ 已解锁到第 ${levelIndex + 1} 关`);
        }
        
        // 🔥 根据关卡自动解锁对应的技能（模拟正常通关）
        skillManager.unlockedSkills.clear(); // 先清空
        if (levelIndex >= 3) {
            // 第4关及以后：解锁冰冻
            skillManager.unlock('freeze');
            console.log('[DEBUG] ✅ 已解锁冰冻技能');
        }
        if (levelIndex >= 4) {
            // 第5关及以后：解锁闪电
            skillManager.unlock('lightning');
            console.log('[DEBUG] ✅ 已解锁闪电技能');
        }
        
        // 直接启动关卡
        startGame(levelIndex);
        
        // 🔥 强制更新技能UI
        setTimeout(() => {
            if (uiManager && uiManager.updateSkillUI) {
                uiManager.updateSkillUI(false, levelIndex, skillManager);
                console.log('[DEBUG] ✅ 技能UI已更新');
            }
        }, 500);
        
        console.log('[DEBUG] ✅ 关卡已启动');
        console.log('[DEBUG] 使用 debugShowStatus() 查看当前状态');
    };

    window.debugShowStatus = () => {
        console.log('=== 🎮 游戏状态 ===');
        console.log('当前关卡:', gameManager.getCurrentLevelIndex() + 1);
        console.log('游戏状态:', gameManager.getGameState(), '(0=PLAYING, 1=WINNING, 2=LEVEL_OVER)');
        console.log('游戏激活:', gameManager.isGameActive);
        console.log('病毒数量:', viruses.length);
        console.log('治愈数:', gameManager.getCuredCount(), '/', gameManager.getLevelGoal());
        console.log('生成计时器:', gameManager.spawnTimer?.toFixed(0) || 'N/A');
        console.log('生成间隔:', gameManager.getCurrentSpawnInterval());
        console.log('可用病毒类型:', gameManager.getAvailableTypes());
        console.log('已解锁技能:', Array.from(skillManager.unlockedSkills || []));
        console.log('冰冻CD:', freezeCooldown.toFixed(1) + 's / ' + FREEZE_COOLDOWN_MAX + 's');
        console.log('教程激活:', tutorialManager.isActive());
        console.log('冰冻状态:', skillManager.isFrozen);
        console.log('连击数:', skillManager.getCombo());
        console.log('==================');
    };

    window.debugUnlockAllSkills = () => {
        skillManager.unlock('freeze');
        skillManager.unlock('lightning');
        console.log('[DEBUG] ✅ 已解锁所有技能');
    };

    window.debugCloseAllModals = () => {
        uiManager.hideAllModals();
        document.querySelectorAll('.modal, .screen').forEach(el => {
            el.classList.remove('visible');
            el.classList.add('hidden');
        });
        console.log('[DEBUG] ✅ 已关闭所有弹窗');
    };

    window.debugActivateGame = () => {
        gameManager.isGameActive = true;
        gameManager.gameState = GAME_STATE.PLAYING;
        gameManager.spawnTimer = -100;
        console.log('[DEBUG] ✅ 已强制激活游戏');
    };

    window.debugUpdateSkillUI = () => {
        if (uiManager && uiManager.updateSkillUI) {
            uiManager.updateSkillUI(false, gameManager.getCurrentLevelIndex(), skillManager);
            console.log('[DEBUG] ✅ 技能UI已更新');
            console.log('[DEBUG] 已解锁技能:', Array.from(skillManager.unlockedSkills || []));
        }
    };

    window.debugResetCooldown = () => {
        window.freezeCooldown = 0;
        if (uiManager && uiManager.activeSkillBtn) {
            uiManager.activeSkillBtn.classList.remove('cooldown');
            if (uiManager.cooldownOverlay) {
                uiManager.cooldownOverlay.style.height = '0%';
            }
        }
        console.log('[DEBUG] ✅ 冰冻技能CD已重置');
    };

    window.debugClearProgress = () => {
        localStorage.removeItem('gameProgress');
        localStorage.removeItem('unlockedSkills');
        console.log('[DEBUG] ✅ 游戏进度已清除');
        console.log('[DEBUG] 刷新页面后将从第一关开始');
    };

    // 打印使用说明
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    🎮 游戏调试命令                             ║
╠═══════════════════════════════════════════════════════════════╣
║  debugJumpToLevel(n)     - 直接跳到第 n+1 关                   ║
║                            例：debugJumpToLevel(3) → 第4关    ║
║                                                                ║
║  debugShowStatus()       - 查看当前游戏状态                    ║
║  debugCloseAllModals()   - 关闭所有弹窗和遮罩                  ║
║  debugUnlockAllSkills()  - 解锁所有技能                        ║
║  debugActivateGame()     - 强制激活游戏（如果卡住）            ║
║  debugUpdateSkillUI()    - 手动更新技能UI显示                  ║
║  debugResetCooldown()    - 重置冰冻技能CD                      ║
║  debugClearProgress()    - 清除游戏进度（回到第一关）          ║
╠═══════════════════════════════════════════════════════════════╣
║  快速测试示例：                                                ║
║    debugJumpToLevel(3)   // 跳到第4关（冰冻技能）             ║
║    debugShowStatus()     // 查看状态                           ║
║    debugUpdateSkillUI()  // 如果技能按钮没显示                ║
║    debugResetCooldown()  // 立即重置CD（测试用）              ║
║    debugClearProgress()  // 清除进度从头开始                  ║
╚═══════════════════════════════════════════════════════════════╝
`);
}

export const debugger_utils = { initDebugger };
