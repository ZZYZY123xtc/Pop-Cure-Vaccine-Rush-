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
import { audioManager } from '../managers/audio-manager.js';
import { modals } from '../ui/modals-ui.js';
import { gameManager, GAME_STATE } from './game-manager.js';
import { effectsManager } from '../systems/effects.js';
import { SKILL_GUIDE } from '../data/story.js';
import { LEVELS } from '../data/levels.js';
import { toastTips } from '../ui/toast-tips.js';

// 导入拆分出的系统模块
import { startGameLoop } from '../systems/game-loop.js?v=20260223_fix1';
import { initMouseHandler, initSkillButton, initNextLevelButton, initGameOverButton, initPauseButton, initResumeButton, initPauseBackToMapButton } from '../systems/input-handler.js';
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
    
    // 🔥 **关键修复**：最先清理所有 UI 覆盖层（包括失败/胜利弹窗）
    uiManager.resetUIForNewLevel();
    
    // 🧪 显示特殊关卡提示（延迟1秒显示，让界面先初始化，仅Level 6-10）
    setTimeout(() => {
        const level = LEVELS[levelId]; // 🔥 修复：直接用数组索引，不要用id字段查找
        // Level 11+ 已经有统一的关卡介绍，不需要单独的特殊提示
        if (levelId >= 10) return; // levelId是数组索引，Level 11的索引是10
        
        if (level?.hasMucusPits) {
            toastTips.showMucusPitTip();
        } else if (level?.isNightMode) {
            toastTips.showNightModeTip();
        } else if (level?.hasVortex) {
            toastTips.showVortexTip();
        } else if (level?.isBossLevel && !level?.isTaroBoss) {
            toastTips.showBossTip();
        }
    }, 1000);
    console.log('[GAME] ✅ UI 已重置');
    
    // 🔥 关键修复：重置游戏循环标志，确保每次启动关卡都能重新启动渲染循环
    window.gameLoopStarted = false;
    console.log('[GAME] ✅ 重置游戏循环标志');
    
    // ✅ 重置游戏循环状态跟踪（避免卡顿）
    if (window.gameLoopLastGameState !== undefined) {
        window.gameLoopLastGameState = null;
    }
    
    // 🔥 重置冰冻技能CD（每关开始时重置）
    window.freezeCooldown = 0;
    console.log('[GAME] ✅ 冰冻技能CD已重置');
    
    // 🔥 重置 skillManager 的冰冻状态
    if (skillManager.isFrozen) {
        skillManager.isFrozen = false;
        console.log('[GAME] ✅ skillManager.isFrozen 已重置为 false');
    }
    
    // 🔥 清除可能残留的冰冻计时器
    if (skillManager.freezeTimer) {
        clearTimeout(skillManager.freezeTimer);
        skillManager.freezeTimer = null;
        console.log('[GAME] ✅ 清除残留的 freezeTimer');
    }
    
    // 🔥 重置冰冻剩余时间
    if (skillManager.freezeTimeRemaining > 0) {
        skillManager.freezeTimeRemaining = 0;
        console.log('[GAME] ✅ freezeTimeRemaining 已重置为 0');
    }
    
    // 🔥 立即更新UI，显示技能就绪状态（移除所有CD样式）
    if (uiManager && uiManager.updateCooldownUI) {
        uiManager.updateCooldownUI(0, 20, false);
        console.log('[GAME] ✅ UI更新为技能就绪状态');
    }
    
    // ✅ Canvas 尺寸由 ViewportManager 统一管理
    console.log('[GAME] Canvas尺寸:', canvas.width, 'x', canvas.height);
    
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
    const audioToggleBtn = document.getElementById('audio-toggle-btn');
    
    // 检查关键元素是否存在
    if (!canvas || !startBtn) {
        console.error('关键游戏元素未找到！请检查 HTML 结构');
        return;
    }
    
    // ✅ Canvas 尺寸由 ViewportManager 统一管理，不再手动 resize

    // 🔊 绑定全局静音按钮 + 读取本地静音偏好
    audioManager.bindMuteButton(audioToggleBtn);
    
    // ✅ 初始化时显示开始屏幕（由 index.html 中的 layerManager.goToStart() 处理）
    console.log('[INIT] 开始屏幕由 LayerManager 管理');
    
    // 🔥 绑定开始按钮点击事件
    startBtn.addEventListener('click', (e) => {
        console.log('[GAME] 🎯 点击"开始实验"按钮');

        // 🔊 首次用户交互时解锁音频上下文，兼容浏览器自动播放策略
        audioManager.unlockAudioContext();
        
        // ✅ 使用 LayerManager 切换到故事层
        if (window.layerManager) {
            window.layerManager.goToStory();
        }
        
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
    
    // ⏸️ 初始化暂停相关按钮（任务 1）
    // sceneManager 会在 startGame() 中创建，这里传递 null
    initPauseButton(document.getElementById('pause-btn'), null);
    initResumeButton(document.getElementById('resume-game-btn'));
    initPauseBackToMapButton(document.getElementById('pause-back-to-map-btn'), null);
    
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
    window.toastTips = toastTips; // 🎮 关卡提示Toast系统
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
 * ❌ 已废弃：调整Canvas尺寸
 * ✅ 现由 ViewportManager 统一管理
 */
// function resizeCanvas() {
//     canvas.width = window.innerWidth;
//     canvas.height = window.innerHeight * 0.75;
//     tutorialManager.handleResize();
// }

/**
 * 生成一个合法的随机出生点（避开右下角安全区）
 * @param {string} type
 * @returns {{x: number, y: number}}
 */
function createRandomSpawnPoint(type) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const logicalWidth = rect.width || canvas.width / dpr;
    const logicalHeight = rect.height || canvas.height / dpr;

    const virusRadius = CONFIG.VIRUS_TYPES[type].radius;
    const safeLeft = logicalWidth - SAFE_ZONE_SIZE;
    const safeTop = logicalHeight - SAFE_ZONE_SIZE;

    let x;
    let y;
    const isTopOrBottomEdge = Math.random() > 0.5;

    if (isTopOrBottomEdge) {
        y = Math.random() > 0.5 ? virusRadius : logicalHeight - virusRadius;
        if (y > logicalHeight / 2) {
            x = virusRadius + Math.random() * (safeLeft - virusRadius * 2);
        } else {
            x = virusRadius + Math.random() * (logicalWidth - virusRadius * 2);
        }
    } else {
        x = Math.random() > 0.5 ? virusRadius : logicalWidth - virusRadius;
        if (x > logicalWidth / 2) {
            y = virusRadius + Math.random() * (safeTop - virusRadius * 2);
        } else {
            y = virusRadius + Math.random() * (logicalHeight - virusRadius * 2);
        }
    }

    return { x, y };
}

/**
 * 生成病毒
 * @param {string} type - 病毒类型（可选）
 * @param {number} x - X坐标（可选）
 * @param {number} y - Y坐标（可选）
 * @param {Object} bossTarget - Boss目标对象（可选，包含x和y属性）
 */
function spawnVirus(type, x, y, bossTarget = null) {
    const availableTypes = gameManager.getAvailableTypes();
    if (type === undefined) {
        type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    }
    
    if (x === undefined || y === undefined) {
        const spawnPoint = createRandomSpawnPoint(type);
        x = spawnPoint.x;
        y = spawnPoint.y;
    }
    // 🔥 传递当前关卡的难度倍率（修复Type C速度问题）
    const difficulty = gameManager.currentLevel?.difficulty || 1.0;
    
    // 👑 Boss战模式：传递Boss坐标给病毒，让小怪向心冲锋
    let newVirus;
    if (bossTarget && bossTarget.x !== undefined && bossTarget.y !== undefined) {
        newVirus = new Virus(x, y, type, difficulty, bossTarget.x, bossTarget.y);
        viruses.push(newVirus);
    } else {
        newVirus = new Virus(x, y, type, difficulty);
        viruses.push(newVirus);
    }
    
    // 🔗 Level 14：双子羁绊机制 - 随机生成羁绊对
    if (gameManager.currentLevel?.hasTetheredPairs && window.tetheredPairSystem) {
        const pairChance = gameManager.currentLevel.tetheredConfig?.pairSpawnChance || 0.4;
        
        // 随机决定是否创建羁绊对
        if (Math.random() < pairChance && viruses.length >= 2) {
            // 找到刚生成的病毒
            const virus1 = newVirus;
            
            // 再生成一个病毒作为伙伴（相同类型，位置随机）
            const pairSpawnPoint = createRandomSpawnPoint(type);
            const virus2 = new Virus(pairSpawnPoint.x, pairSpawnPoint.y, type, difficulty);
            viruses.push(virus2);
            
            // 创建羁绊对
            window.tetheredPairSystem.createPair(virus1, virus2);
        }
    }
    
    // 🍑 Level 16：红细胞载具机制 - 30%概率生成
    if (gameManager.currentLevel?.hasRafts && gameManager.currentLevel.raftConfig) {
        const spawnChance = gameManager.currentLevel.raftConfig.spawnChance || 0.3;
        if (Math.random() < spawnChance) {
            newVirus.isRidingRaft = true;
            newVirus.raftConfig = gameManager.currentLevel.raftConfig;
            newVirus.originalSpeedY = newVirus.vy; // 保存原始速度
            console.log('[GAME] 🍑 生成红细胞载具病毒');
        }
    }
    
    return newVirus;
}

/**
 * 生成初始病毒（优化：直接生成，不分批）
 */
function spawnInitialViruses(count) {
    // 🔥 修复卡顿：改回同步生成，但减少初始数量
    // 分批生成反而导致视觉上的卡顿感
    console.log(`[GAME] 正在生成 ${count} 个初始病毒...`);
    for (let i = 0; i < count; i++) {
        spawnVirus();
    }
    console.log(`[GAME] ✅ 已生成 ${count} 个病毒`);
}

/**
 * 初始化教程结束事件
 */
function initTutorialEndEvent() {
    window.addEventListener('tutorialEnd', () => {
        console.log('[GAME] 收到 tutorialEnd 事件');
        
        // 🔥 修复：直接修改原始数组，而不是创建新数组
        // 这样游戏循环中的 viruses 引用才能正确更新
        for (let i = viruses.length - 1; i >= 0; i--) {
            if (viruses[i].tutorialLock || viruses[i].isTutorial) {
                viruses.splice(i, 1);
            }
        }
        console.log('[GAME] 教程病毒已清理，当前病毒数:', viruses.length);
        
        gameManager.gameState = GAME_STATE.PLAYING;
        gameManager.isGameActive = true;
        console.log('[GAME] 游戏状态设置为 PLAYING，isGameActive =', gameManager.isGameActive);
        
        // 🔥 重置生成计时器（使其立即可以生成新病毒）
        gameManager.spawnTimer = gameManager.currentSpawnInterval;
        console.log('[GAME] spawnTimer 已重置为:', gameManager.currentSpawnInterval);
        
        // 生成初始病毒
        const currentLevel = LEVELS[gameManager.getCurrentLevelIndex()];
        const initialCount = currentLevel?.isFinalBoss ? 0 : (currentLevel?.initialCount || 3);
        console.log(`[GAME] 生成 ${initialCount} 个初始病毒`);
        spawnInitialViruses(initialCount);
        console.log('[GAME] 初始病毒已生成，当前病毒数:', viruses.length);
        
        uiManager.updateSkillUI(false, gameManager.getCurrentLevelIndex(), skillManager);
        
        requestAnimationFrame(() => {});
    });
}


