/**
 * 核心游戏入口
 * 负责初始化、Canvas管理、病毒生成、事件综合管理
 */

import { CONFIG } from './config.js';
import { Virus } from '../entities/virus.js';
import { skillManager } from '../data/skills.js';
import { OpeningScene } from '../ui/opening.js';
import { tutorialManager } from '../systems/tutorial.js';
import { uiManager } from '../managers/ui-manager.js';
import { modals } from '../ui/modals-ui.js';
import { gameManager, GAME_STATE } from './game-manager.js';
import { effectsManager } from '../systems/effects.js';
import { SKILL_GUIDE } from '../data/story.js';
import { LEVELS } from '../data/levels.js';

// 导入拆分出的系统模块
import { startGameLoop } from '../systems/game-loop.js';
import { initMouseHandler, initSkillButton, initNextLevelButton, initGameOverButton } from '../systems/input-handler.js';
import { initDebugger } from '../systems/debugger.js';
import { 
    triggerLevelComplete, 
    triggerGameOver, 
    triggerGameWin,
    proceedToNextLevel,
    initWindowResizeHandler
} from '../managers/game-events.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextLevelBtn = document.getElementById('next-level-btn');

// 游戏常量
const SAFE_ZONE_SIZE = 120;

let viruses = [];

// 冰冻技能冷却
window.freezeCooldown = 0;
const FREEZE_COOLDOWN_MAX = 20; // 🔥 冰冻CD时间

/**
 * 启动游戏：从地图进入战斗
 */
export function startGame(levelId) {
    console.log('[GAME] startGame 被调用, levelId =', levelId);
    
    // 🔥 关键修复：重置游戏循环标志，确保每次启动关卡都能重新启动渲染循环
    window.gameLoopStarted = false;
    console.log('[GAME] ✅ 重置游戏循环标志');
    
    // 🔥 重置冰冻技能CD（每关开始时重置）
    window.freezeCooldown = 0;
    console.log('[GAME] ✅ 冰冻技能CD已重置');
    
    // 🔥 立即更新UI，移除cooldown样式
    if (uiManager && uiManager.activeSkillBtn) {
        uiManager.activeSkillBtn.classList.remove('cooldown');
        if (uiManager.cooldownOverlay) {
            uiManager.cooldownOverlay.style.height = '0%';
        }
    }
    
    // 确保Canvas可见并且尺寸正确
    resizeCanvas();
    console.log('[GAME] Canvas尺寸:', canvas.width, 'x', canvas.height);
    
    // 强制隐藏所有弹窗
    uiManager.hideAllModals();
    
    // 构建场景管理器，传递游戏相关的上下文
    const sceneManager = { 
        viruses: viruses, 
        particles: effectsManager.particles,
        canvas: canvas,
        CONFIG: CONFIG,
        spawnVirus: spawnVirus,
        clearViruses: () => {
            viruses.length = 0;
            effectsManager.clearParticles();
        }
    };
    
    // ✅ 唯一入口：调用 gameManager.startLevel 处理所有初始化
    gameManager.startLevel(levelId, uiManager, sceneManager);
    
    // 启动游戏循环
    startGameLoop(canvas, ctx, viruses, window.freezeCooldown, FREEZE_COOLDOWN_MAX, {}, spawnVirus, 
        () => triggerLevelComplete(gameManager, uiManager), 
        () => triggerGameOver(gameManager, uiManager));
}

/**
 * 初始化函数
 */
export function init() {
    console.log('[INIT] init() called');
    
    // 🔥 在 init 内部获取按钮，确保 DOM 已加载
    const startBtn = document.getElementById('start-btn');
    
    // 检查关键元素是否存在
    if (!canvas || !uiManager.startScreen || !startBtn) {
        console.error('关键游戏元素未找到！请检查 HTML 结构');
        return;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 初始化时显示开始屏幕
    uiManager.showStartScreen();
    
    // 🔥 绑定开始按钮点击事件
    startBtn.addEventListener('click', (e) => {
        console.log('[GAME] 🎯 点击"开始实验"按钮');
        
        // 隐藏开始屏幕
        uiManager.hideStartScreen();
        
        // 🎬 启动开场动画
        const opening = new OpeningScene(() => {
            console.log('[GAME] 开场动画完成');
            window.dispatchEvent(new CustomEvent('startButtonClicked'));
        });
        
        if (opening.initialized) {
            opening.start();
        } else {
            window.dispatchEvent(new CustomEvent('startButtonClicked'));
        }
    }, true);
    
    console.log('[INIT] ✅ 初始化完成');
    
    // 初始化所有输入处理
    initMouseHandler(canvas, viruses, updateComboDisplay);
    initSkillButton(uiManager.activeSkillBtn, window.freezeCooldown, FREEZE_COOLDOWN_MAX, (cd) => {
        window.freezeCooldown = cd;
    });
    initNextLevelButton(nextLevelBtn, uiManager, () => proceedToNextLevel(canvas, gameManager, uiManager, startGame));
    initGameOverButton(document.getElementById('game-over-back-btn'));
    
    // 初始化教程结束事件和窗口事件
    initTutorialEndEvent();
    initWindowResizeHandler(tutorialManager);
    
    // 初始化调试工具
    initDebugger(uiManager, tutorialManager, viruses, window.freezeCooldown, FREEZE_COOLDOWN_MAX);
    
    // 暴露关键对象到全局作用域
    window.uiManager = uiManager;
    window.gameManager = gameManager;
    window.skillManager = skillManager;
    window.tutorialManager = tutorialManager;
    window.modals = modals;
    window.effectsManager = effectsManager;
    window.triggerLevelComplete = triggerLevelComplete;
    window.SKILL_GUIDE = SKILL_GUIDE;
    window.GAME_STATE = GAME_STATE;
    window.startGame = startGame;
}

/**
 * 更新连击显示
 */
function updateComboDisplay() {
    uiManager.updateComboDisplay(skillManager.getCombo());
}

/**
 * 调整Canvas尺寸
 */
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.75;
    tutorialManager.handleResize();
}

/**
 * 生成病毒
 */
function spawnVirus(type, x, y) {
    const availableTypes = gameManager.getAvailableTypes();
    if (type === undefined) {
        type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    }
    
    if (x === undefined || y === undefined) {
        const virusRadius = CONFIG.VIRUS_TYPES[type].radius;
        const safeLeft = canvas.width - SAFE_ZONE_SIZE;
        const safeTop = canvas.height - SAFE_ZONE_SIZE;
        let attempts = 0;
        
        do {
            const edge = Math.random() > 0.5;
            if (edge) {
                x = Math.random() > 0.5 ? 0 : canvas.width;
                y = Math.random() * canvas.height;
            } else {
                x = Math.random() * canvas.width;
                y = Math.random() > 0.5 ? 0 : canvas.height;
            }
            attempts++;
            if (attempts > 100) break;
        } while (x > safeLeft - virusRadius && y > safeTop - virusRadius);
    }
    viruses.push(new Virus(x, y, type));
}

/**
 * 生成初始病毒
 */
function spawnInitialViruses(count) {
    for (let i = 0; i < count; i++) {
        spawnVirus();
    }
}

/**
 * 初始化教程结束事件
 */
function initTutorialEndEvent() {
    window.addEventListener('tutorialEnd', () => {
        console.log('[GAME] 收到 tutorialEnd 事件');
        
        // 清理教程病毒
        viruses = viruses.filter(v => !v.tutorialLock && !v.isTutorial);
        console.log('[GAME] 教程病毒已清理，当前病毒数:', viruses.length);
        
        gameManager.gameState = GAME_STATE.PLAYING;
        gameManager.isGameActive = true;
        
        // 生成初始病毒
        const currentLevel = LEVELS[gameManager.getCurrentLevelIndex()];
        const initialCount = currentLevel?.initialCount || 3;
        console.log(`[GAME] 生成 ${initialCount} 个初始病毒`);
        spawnInitialViruses(initialCount);
        
        uiManager.updateSkillUI(false, gameManager.getCurrentLevelIndex(), skillManager);
        
        requestAnimationFrame(() => {});
    });
}


