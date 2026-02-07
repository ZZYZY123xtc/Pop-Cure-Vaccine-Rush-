/**
 * 游戏循环系统
 * 负责主渲染循环、病毒更新、状态检查等核心游戏逻辑
 */

import { skillManager } from '../data/skills.js';
import { tutorialManager } from './tutorial.js';
import { effectsManager } from './effects.js';
import { gameManager, GAME_STATE } from '../core/game-manager.js';
import { uiManager } from '../managers/ui-manager.js';

let lastTime = 0;
let loopCounter = 0;

/**
 * 主游戏循环
 * @param {HTMLCanvasElement} canvas - 游戏Canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
 * @param {Array<Virus>} viruses - 病毒列表
 * @param {number} freezeCooldown - 冰冻技能CD
 * @param {number} FREEZE_COOLDOWN_MAX - 冰冻技能最大CD
 * @param {Object} gameState - 游戏状态对象
 * @param {Function} spawnVirus - 生成病毒函数
 * @param {Function} triggerLevelComplete - 关卡完成回调
 * @param {Function} triggerGameOver - 游戏失败回调
 */
export function startGameLoop(canvas, ctx, viruses, freezeCooldown, FREEZE_COOLDOWN_MAX, gameState, spawnVirus, triggerLevelComplete, triggerGameOver) {
    function loop(timestamp) {
        loopCounter++;
        if (loopCounter === 1 || loopCounter % 60 === 0) {
            console.log('[LOOP] 游戏循环运行中, 第', loopCounter, '帧');
            console.log('[LOOP] Canvas尺寸:', canvas.width, 'x', canvas.height);
            console.log('[LOOP] 病毒数:', viruses.length);
            console.log('[LOOP] 游戏状态:', gameManager.getGameState());
        }
        
        const dt = timestamp - lastTime;
        lastTime = timestamp;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        effectsManager.drawBackground(ctx, canvas.width, canvas.height);

        ensureTutorialVirusInList(viruses);
        
        // 教程模式：绘制高亮圈指示教程病毒
        const tutorialVirus = tutorialManager.getTutorialVirus?.();
        if (tutorialManager.isActive() && tutorialVirus) {
            effectsManager.drawTutorialHighlight(ctx, tutorialVirus);
        }

        // === 🎯 状态机分支 ===
        if (gameManager.getGameState() === GAME_STATE.PLAYING && gameManager.isGameRunning()) {
            updateGamePlaying(canvas, ctx, viruses, freezeCooldown, FREEZE_COOLDOWN_MAX, dt, spawnVirus, triggerGameOver, triggerLevelComplete);
        } 
        else if (gameManager.getGameState() === GAME_STATE.WINNING) {
            updateGameWinning(canvas, ctx, viruses, triggerLevelComplete);
        } 
        else {
            // 🔥 GAME_STATE.LEVEL_OVER 或其他状态
            if (tutorialManager.isActive() && tutorialVirus) {
                // 教程期间：绘制教程病毒和高亮效果
                effectsManager.drawTutorialHighlight(ctx, tutorialVirus);
                viruses.forEach(v => v.draw(ctx));
                effectsManager.updateParticles(ctx);
            } else {
                // 非教程的暂停状态（如弹窗、结算），也绘制静态画面
                viruses.forEach(v => v.draw(ctx));
                effectsManager.updateParticles(ctx);
            }
        }

        requestAnimationFrame(loop);
    }

    if (!window.gameLoopStarted) {
        console.log('[GAME] 🚀 引擎启动！开始渲染循环...');
        window.gameLoopStarted = true;
        requestAnimationFrame(loop);
    }
}

/**
 * 游戏进行中的状态更新
 */
function updateGamePlaying(canvas, ctx, viruses, freezeCooldown, FREEZE_COOLDOWN_MAX, dt, spawnVirus, triggerGameOver, triggerLevelComplete) {
    // 更新游戏时间和生成计时器
    const shouldSpawn = gameManager.updateGameTime(dt);
    
    // 更新冷却计时
    if (freezeCooldown > 0) {
        freezeCooldown -= dt / 1000;
        if (freezeCooldown < 0) freezeCooldown = 0;
        
        uiManager.updateCooldownUI(freezeCooldown, FREEZE_COOLDOWN_MAX);
    }

    // 生成病毒（教程模式不生成新病毒，冰冻状态不生成）
    if (!tutorialManager.isActive() && !skillManager.isFrozen && shouldSpawn) {
        gameManager.resetSpawnTimer();
        spawnVirus();
    }

    // 粒子更新
    effectsManager.updateParticles(ctx);

    // 病毒更新
    updateViruses(canvas, viruses, dt);

    // 绘制闪电特效
    skillManager.drawLightning(ctx);

    // 更新进度条
    uiManager.updateProgressBars(
        gameManager.getCuredCount(), 
        gameManager.getLevelGoal(), 
        viruses.length, 
        gameManager.getInfectionThreshold()
    );

    // 🎯 检查胜负条件（只有在游戏激活时才检查）
    if (gameManager.isGameRunning()) {
        const result = gameManager.checkWinConditions(viruses.length);
        if (result === 'win') {
            // 进入胜利动画阶段 - 已在gameManager中处理
        } else if (result === 'lose') {
            triggerGameOver();
            return;
        }
    }
}

/**
 * 游戏胜利阶段的状态更新
 */
function updateGameWinning(canvas, ctx, viruses, triggerLevelComplete) {
    const radius = gameManager.updateVaccineWave();
    
    // 绘制白色光波
    const { centerX, centerY } = effectsManager.drawVaccineWave(ctx, canvas.width, canvas.height, radius);
    
    // 碰撞检测：消灭被光波覆盖的病毒（保护教程病毒）
    for (let i = viruses.length - 1; i >= 0; i--) {
        const v = viruses[i];
        if (v.isTutorial || v.tutorialLock) {
            v.draw(ctx);
            continue;
        }
        
        if (effectsManager.isVirusInWave(v, centerX, centerY, radius)) {
            effectsManager.createExplosion(v.x, v.y, v.props.color, 20);
            viruses.splice(i, 1);
        } else {
            v.draw(ctx);
        }
    }
    
    // 粒子继续更新
    effectsManager.updateParticles(ctx);
    
    // 结算条件：光波超出屏幕且病毒清空
    if (gameManager.isVaccineWaveComplete(canvas.width, canvas.height) && viruses.length === 0) {
        gameManager.endGame();
        setTimeout(() => {
            triggerLevelComplete();
        }, 1000);
        return;
    }
}

/**
 * 病毒更新逻辑
 */
function updateViruses(canvas, viruses, dt) {
    const SAFE_ZONE_SIZE = 120;
    const newBabies = [];

    for (let i = viruses.length - 1; i >= 0; i--) {
        const v = viruses[i];
        
        // 教程病毒特殊处理：不移动，但倒计时正常更新
        if (v.isTutorial || v.tutorialLock) {
            // 更新倒计时和闪烁效果
            if (!skillManager.isFrozen) {
                v.splitTimer -= dt;
                if (v.nearSplitFlash > 0) v.nearSplitFlash -= dt;
                
                // 倒计时到期时的特殊处理 - 只要是教程病毒就重置，不分裂
                if (v.splitTimer <= 0) {
                    // 临界闪烁效果
                    v.nearSplitFlash = 300;
                    // 重置倒计时，继续循环
                    v.splitTimer = v.splitBaseTime || v.maxSplitTime;
                    // 只在教程激活时创建提示效果
                    if (tutorialManager.isActive()) {
                        effectsManager.createTutorialSplitWarning(v.x, v.y);
                    }
                }
            }
            v.draw(canvas.getContext('2d'));
            continue;
        }
        
        // 🧊 冰冻状态：跳过移动和分裂逻辑
        if (!skillManager.isFrozen) {
            v.update(dt, canvas.width, canvas.height);
            
            // 禁区碰撞逻辑
            const safeLeft = canvas.width - SAFE_ZONE_SIZE;
            const safeTop = canvas.height - SAFE_ZONE_SIZE;
            
            if (v.x + v.radius > safeLeft && v.y + v.radius > safeTop) {
                const overlapX = (v.x + v.radius) - safeLeft;
                const overlapY = (v.y + v.radius) - safeTop;
                
                if (overlapX < overlapY) {
                    v.x = safeLeft - v.radius;
                    v.vx = -Math.abs(v.vx);
                } else {
                    v.y = safeTop - v.radius;
                    v.vy = -Math.abs(v.vy);
                }
            }

            // 分裂检查 - 确保教程病毒永不分裂
            if (v.shouldSplit() && !v.isTutorial && !v.tutorialLock) {
                newBabies.push(...v.split());
                viruses.splice(i, 1);
                effectsManager.createExplosion(v.x, v.y, '#FFB7B2', 5);
            }
        }
        
        const ctx = canvas.getContext('2d');
        v.draw(ctx);
    }
    viruses.push(...newBabies);
}

/**
 * 确保教程病毒在列表中
 */
function ensureTutorialVirusInList(viruses) {
    const tutorialVirus = tutorialManager.getTutorialVirus?.();
    if (tutorialManager.isActive() && tutorialVirus && !viruses.includes(tutorialVirus)) {
        viruses.push(tutorialVirus);
    }
}

/**
 * 更新冰冻CD的值
 */
export function updateFreezeCooldown(dt) {
    let freezeCooldown = window.freezeCooldown || 0;
    if (freezeCooldown > 0) {
        freezeCooldown -= dt / 1000;
        if (freezeCooldown < 0) freezeCooldown = 0;
    }
    window.freezeCooldown = freezeCooldown;
    return freezeCooldown;
}

export const gameLoop = { startGameLoop, updateFreezeCooldown };
