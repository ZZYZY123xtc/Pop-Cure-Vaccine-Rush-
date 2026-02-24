/**
 * 游戏循环系统
 * 负责主渲染循环、病毒更新、状态检查等核心游戏逻辑
 */

import { skillManager } from '../data/skills.js';
import { tutorialManager } from './tutorial.js';
import { effectsManager, MucusPitRenderer, VortexRenderer, BossHealEffect } from './effects.js';
import { gameManager, GAME_STATE } from '../core/game-manager.js';
import { uiManager } from '../managers/ui-manager.js';
import { WindEffectSystem } from './wind-effects.js';
import { FogEffectSystem } from './fog-effects.js';
import { PortalEffectSystem } from './portal-effects.js';
import { TetheredPairSystem } from './tethered-pairs.js';
import { ValveSystem } from './valve-system.js'; // 🍑 Level 17 瓣膜系统
import { WhiteBloodCell } from '../entities/white-blood-cell.js'; // 🍑 Level 18 白细胞
import { ArterialTidesSystem } from './arterial-tides.js'; // 🍑 Level 19 动脉潮汐
import { VanillaVeilSystem } from './vanilla-veil-system.js'; // 🍦 Level 21 香草视野
import { HolyBubblesSystem } from './holy-bubbles-system.js'; // 🍦 Level 22 神圣气泡
import { SacredBeatSystem } from './sacred-beat-system.js'; // 🍦 Level 23 神圣节拍
import { SacredGeometrySystem } from './sacred-geometry-system.js'; // 🍦 Level 24 信仰连结
import { Boss, TaroBroodmotherBoss, PeachThrombusBoss } from '../entities/boss.js';
import { FinalBoss } from '../entities/final-boss.js'; // 🍦 Level 25 最终Boss
import { PERFORMANCE_CONFIG, perfLog, FPSCounter } from '../core/performance-config.js';

let lastTime = 0;
let loopCounter = 0;
let lastGameState = null;  // ✅ 跟踪游戏状态变化

// 🚀 性能监控
let fpsCounter = null;

// ✅ 性能优化：缓存canvas尺寸，避免每帧调用getBoundingClientRect
let cachedCanvasSize = { width: 0, height: 0 };
let canvasSizeNeedsUpdate = true;

// 🚀 防止主循环重叠：保存动画ID用于清理
let currentAnimationId = null;

// 🌬️ 风力特效系统（全局单例）
let windEffectSystem = null;

// 🌫️ 迷雾特效系统（全局单例）
let fogEffectSystem = null;

// 🌌 传送门特效系统（全局单例）
let portalEffectSystem = null;

// 🔗 双子羁绊系统（全局单例）
let tetheredPairSystem = null;

// 🍑 瓣膜系统（全局单例）
let valveSystem = null;

// 🍑 白细胞列表（全局）
let whiteBloodCells = [];

// 🍑 动脉潮汐系统（全局单例）
let arterialTidesSystem = null;

// 🍦 香草视野系统（全局单例）
let vanillaVeilSystem = null;

// 🍦 神圣气泡系统（全局单例）
let holyBubblesSystem = null;

// 🍦 神圣节拍系统（全局单例）
let sacredBeatSystem = null;

// 🍦 信仰连结系统（全局单例）
let sacredGeometrySystem = null;

// 🧪 黏液坑渲染器（全局单例）
let mucusPitRenderer = null;

// 🌀 漩涡渲染器（全局单例）
let vortexRenderer = null;

// 👑 Boss实体（全局单例）
let boss = null;
let finalBossInfectionLoad = 0; // 🍦 Level 25 专用免疫负荷

function resetFinalBossRuntimeState() {
    boss = null;
    bossHealEffect = null;
    finalBossInfectionLoad = 0;
}

// 暴露给GameManager显式调用（修复失败后重进状态残留）
window.resetFinalBossRuntimeState = resetFinalBossRuntimeState;

// 💚 Boss治愈特效（全局单例）
let bossHealEffect = null;

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
    // 🔄 每次开关卡都重置Boss实例，避免状态残留（如最终关失败后重进仍失败）
    resetFinalBossRuntimeState();
    // 🔄 每次开局重置时间基准，避免首帧使用上一局时间戳造成卡顿突变
    lastTime = 0;

    // ✅ 初始化时更新尺寸缓存
    function updateCanvasSize() {
        const rect = canvas.getBoundingClientRect();
        cachedCanvasSize.width = rect.width || parseFloat(canvas.style.width) || canvas.width / (window.devicePixelRatio || 1);
        cachedCanvasSize.height = rect.height || parseFloat(canvas.style.height) || canvas.height / (window.devicePixelRatio || 1);
        canvasSizeNeedsUpdate = false;
        
        // 🌬️ 更新风力特效系统尺寸
        if (windEffectSystem) {
            windEffectSystem.resize(cachedCanvasSize.width, cachedCanvasSize.height);
        }
        
        // 🌫️ 更新迷雾系统尺寸
        if (fogEffectSystem) {
            fogEffectSystem.resize(cachedCanvasSize.width, cachedCanvasSize.height);
        }
        
        // 🌌 更新传送门系统尺寸
        if (portalEffectSystem) {
            portalEffectSystem.resize(cachedCanvasSize.width, cachedCanvasSize.height);
        }
        
        // 🧪 更新黏液坑渲染器尺寸
        if (mucusPitRenderer) {
            mucusPitRenderer.resize(cachedCanvasSize.width, cachedCanvasSize.height);
        }
        
        // 🌀 更新漩涡渲染器尺寸
        if (vortexRenderer) {
            vortexRenderer.resize(cachedCanvasSize.width, cachedCanvasSize.height);
        }
    }
    
    updateCanvasSize();
    
    // 🚀 初始化FPS计数器
    if (!fpsCounter && PERFORMANCE_CONFIG.ENABLE_FPS_COUNTER) {
        fpsCounter = new FPSCounter();
        perfLog.log('[LOOP] 🚀 FPS计数器已启动');
    }
    
    // 🌬️ 初始化风力特效系统
    if (!windEffectSystem) {
        windEffectSystem = new WindEffectSystem(cachedCanvasSize.width, cachedCanvasSize.height);
        perfLog.log('[LOOP] 🌬️ 风力特效系统已初始化');
    }
    
    // 🌪️ 根据关卡设置风力特效风格
    if (windEffectSystem && gameManager.currentLevel) {
        const style = gameManager.currentLevel.hasTurbulence ? 'taro' : 'default';
        windEffectSystem.setStyle(style);
        perfLog.log(`[LOOP] 🌪️ 风力特效风格设置为: ${style}`);
    }
    
    // 🧪 初始化黏液坑渲染器（如果关卡需要）
    if (!mucusPitRenderer && gameManager.currentLevel?.hasMucusPits) {
        console.log('[LOOP] 🧪 初始化黏液坑渲染器，Canvas尺寸:', cachedCanvasSize.width.toFixed(2), 'x', cachedCanvasSize.height.toFixed(2));
        mucusPitRenderer = new MucusPitRenderer(cachedCanvasSize.width, cachedCanvasSize.height);
        perfLog.log('[LOOP] 🧪 黏液坑渲染器已初始化');
    }
    
    // 🌀 初始化漩涡渲染器（如果关卡需要）
    if (!vortexRenderer && gameManager.currentLevel?.hasVortex) {
        vortexRenderer = new VortexRenderer(cachedCanvasSize.width, cachedCanvasSize.height);
        perfLog.log('[LOOP] 🌀 漩涡渲染器已初始化');
    }
    
    // 🌫️ 初始化迷雾系统（如果关卡需要）
    if (!fogEffectSystem) {
        fogEffectSystem = new FogEffectSystem(cachedCanvasSize.width, cachedCanvasSize.height);
        perfLog.log('[LOOP] 🌫️ 迷雾系统已初始化');
    }
    if (gameManager.currentLevel?.hasFog) {
        fogEffectSystem.activate();
        perfLog.log('[LOOP] 🌫️ Level 12 迷雾系统已激活');
    } else {
        fogEffectSystem.deactivate();
    }
    
    // 🌌 初始化传送门系统（如果关卡需要）
    if (!portalEffectSystem) {
        portalEffectSystem = new PortalEffectSystem(cachedCanvasSize.width, cachedCanvasSize.height);
        perfLog.log('[LOOP] 🌌 传送门系统已初始化');
    }
    if (gameManager.currentLevel?.hasPortals) {
        portalEffectSystem.activate(gameManager.currentLevel.portalConfig);
        perfLog.log('[LOOP] 🌌 Level 13 传送门系统已激活');
    } else {
        portalEffectSystem.deactivate();
    }
    
    // � 初始化双子羁绊系统（如果关卡需要）
    if (!tetheredPairSystem) {
        tetheredPairSystem = new TetheredPairSystem();
        perfLog.log('[LOOP] 🔗 双子羁绊系统已初始化');
    }
    if (gameManager.currentLevel?.hasTetheredPairs) {
        tetheredPairSystem.activate();
        perfLog.log('[LOOP] 🔗 Level 14 双子羁绊系统已激活');
    } else {
        tetheredPairSystem.deactivate();
    }
        // 🍑 初始化瓣膜系统（如果关卡需要）
    if (!valveSystem && gameManager.currentLevel?.hasValves) {
        valveSystem = new ValveSystem(cachedCanvasSize.width, cachedCanvasSize.height, gameManager.currentLevel.valveConfig);
        perfLog.log('[LOOP] 🍑 Level 17 瓣膜系统已初始化');
        // 暴露到全局，供外部访问
        window.valveSystem = valveSystem;
    } else if (valveSystem && !gameManager.currentLevel?.hasValves) {
        // 关卡切换，清理瓣膜系统
        if (valveSystem.destroy) valveSystem.destroy();
        valveSystem = null;
        window.valveSystem = null;
    }
    
    // 👑 初始化Boss实体（如果是Boss关卡）
    if (!boss && gameManager.currentLevel?.isBossLevel) {
        if (gameManager.currentLevel.isTaroBoss) {
            // Level 15: 香芋大魔王
            boss = new TaroBroodmotherBoss(cachedCanvasSize.width, cachedCanvasSize.height);
            perfLog.log('[LOOP] 👑 香芋大魔王已初始化');
        } else if (gameManager.currentLevel.isPeachThrombusBoss) {
            // Level 20: 凝血巨兽
            boss = new PeachThrombusBoss(cachedCanvasSize.width, cachedCanvasSize.height, gameManager.currentLevel.bossConfig);
            perfLog.log('[LOOP] 🍑 凝血巨兽已初始化');
        } else if (gameManager.currentLevel.isFinalBoss) {
            // Level 25: 香草淋巴结守护者
            boss = new FinalBoss(cachedCanvasSize.width, cachedCanvasSize.height, gameManager.currentLevel.bossConfig);
            finalBossInfectionLoad = 0;
            perfLog.log('[LOOP] 🍦 最终Boss已初始化');
        } else {
            // Level 10: 普通Boss
            boss = new Boss(cachedCanvasSize.width, cachedCanvasSize.height);
            perfLog.log('[LOOP] 👑 Boss实体已初始化');
        }
        bossHealEffect = new BossHealEffect();
    }
    
    // 🍑 初始化白细胞（Level 18）
    if (gameManager.currentLevel?.hasWhiteBloodCells) {
        whiteBloodCells = [];
        const wbcConfig = gameManager.currentLevel.wbcConfig || {};
        const count = wbcConfig.count || 3;
        for (let i = 0; i < count; i++) {
            const x = Math.random() * cachedCanvasSize.width;
            const y = 100 + Math.random() * (cachedCanvasSize.height * 0.5);
            whiteBloodCells.push(new WhiteBloodCell(x, y, wbcConfig));
        }
        perfLog.log('[LOOP] 🍑 Level 18 白细胞已初始化，数量:', count);
        // 暴露到全局
        window.whiteBloodCells = whiteBloodCells;
    } else {
        whiteBloodCells = [];
        window.whiteBloodCells = null;
    }
    
    // 🍑 初始化动脉潮汐系统（Level 19）
    if (gameManager.currentLevel?.hasArterialTides) {
        if (!arterialTidesSystem) {
            arterialTidesSystem = new ArterialTidesSystem(cachedCanvasSize.width, cachedCanvasSize.height, gameManager.currentLevel.tidesConfig);
            perfLog.log('[LOOP] 🍑 Level 19 动脉潮汐系统已初始化');
            window.arterialTidesSystem = arterialTidesSystem;
        }
    } else if (arterialTidesSystem) {
        if (arterialTidesSystem.destroy) arterialTidesSystem.destroy();
        arterialTidesSystem = null;
        window.arterialTidesSystem = null;
        perfLog.log('[LOOP] 🍑 动脉潮汐系统已清理');
    }
    
    // 🍦 初始化香草视野系统（Level 21）
    if (gameManager.currentLevel?.hasVanillaVeil) {
        if (!vanillaVeilSystem) {
            vanillaVeilSystem = new VanillaVeilSystem(cachedCanvasSize.width, cachedCanvasSize.height, gameManager.currentLevel.veilConfig);
            perfLog.log('[LOOP] 🍦 Level 21 香草视野系统已初始化');
            window.vanillaVeilSystem = vanillaVeilSystem;
        }
    } else if (vanillaVeilSystem) {
        if (vanillaVeilSystem.destroy) vanillaVeilSystem.destroy();
        vanillaVeilSystem = null;
        window.vanillaVeilSystem = null;
        perfLog.log('[LOOP] 🍦 香草视野系统已清理');
    }
    
    // 🍦 初始化神圣气泡系统（Level 22）
    if (gameManager.currentLevel?.hasHolyBubbles) {
        if (!holyBubblesSystem) {
            holyBubblesSystem = new HolyBubblesSystem(cachedCanvasSize.width, cachedCanvasSize.height, gameManager.currentLevel.bubbleConfig);
            perfLog.log('[LOOP] 🍦 Level 22 神圣气泡系统已初始化');
            window.holyBubblesSystem = holyBubblesSystem;
        }
    } else if (holyBubblesSystem) {
        if (holyBubblesSystem.destroy) holyBubblesSystem.destroy();
        holyBubblesSystem = null;
        window.holyBubblesSystem = null;
        perfLog.log('[LOOP] 🍦 神圣气泡系统已清理');
    }
    
    // 🍦 初始化神圣节拍系统（Level 23）
    if (gameManager.currentLevel?.hasSacredBeat) {
        if (!sacredBeatSystem) {
            sacredBeatSystem = new SacredBeatSystem(cachedCanvasSize.width, cachedCanvasSize.height, gameManager.currentLevel.beatConfig);
            perfLog.log('[LOOP] 🍦 Level 23 神圣节拍系统已初始化');
            window.sacredBeatSystem = sacredBeatSystem;
        }
    } else if (sacredBeatSystem) {
        if (sacredBeatSystem.destroy) sacredBeatSystem.destroy();
        sacredBeatSystem = null;
        window.sacredBeatSystem = null;
        perfLog.log('[LOOP] 🍦 神圣节拍系统已清理');
    }
    
    // 🍦 初始化信仰连结系统（Level 24）
    if (gameManager.currentLevel?.hasSacredGeometry) {
        if (!sacredGeometrySystem) {
            sacredGeometrySystem = new SacredGeometrySystem(cachedCanvasSize.width, cachedCanvasSize.height, gameManager.currentLevel.geometryConfig);
            perfLog.log('[LOOP] 🍦 Level 24 信仰连结系统已初始化');
            window.sacredGeometrySystem = sacredGeometrySystem;
        }
    } else if (sacredGeometrySystem) {
        if (sacredGeometrySystem.destroy) sacredGeometrySystem.destroy();
        sacredGeometrySystem = null;
        window.sacredGeometrySystem = null;
        perfLog.log('[LOOP] 🍦 信仰连结系统已清理');
    }
    
    function loop(timestamp) {
        loopCounter++;
        
        // 🚀 更新FPS计数器
        if (fpsCounter) {
            fpsCounter.update();
        }
        
        // 检测游戏状态变化
        const currentGameState = gameManager.getGameState();
        const isStateJustActivated = (currentGameState === GAME_STATE.PLAYING && lastGameState !== GAME_STATE.PLAYING && gameManager.isGameRunning());
        
        if (isStateJustActivated) {
            perfLog.log('[LOOP] ✅ 检测到游戏激活，下一帧将使用安全dt');
        }
        lastGameState = currentGameState;
        
        // ✅ 如果尺寸需要更新，重新计算
        if (canvasSizeNeedsUpdate) {
            updateCanvasSize();
        }
        
        // � 获取当前canvas逻辑尺寸（必须在使用前定义）
        const displayWidth = cachedCanvasSize.width;
        const displayHeight = cachedCanvasSize.height;
        
        // 🔥 调试日志（性能模式下完全禁用）
        if (loopCounter === 1 || (PERFORMANCE_CONFIG.ENABLE_DEBUG_LOG && loopCounter % 300 === 0)) {
            perfLog.debug('[LOOP] 游戏循环运行中, 第', loopCounter, '帧');
            perfLog.debug('[LOOP] 逻辑尺寸:', Math.round(displayWidth), 'x', Math.round(displayHeight), '| 物理像素:', canvas.width, 'x', canvas.height);
            perfLog.debug('[LOOP] 病毒数:', viruses.length);
            perfLog.debug('[LOOP] 粒子数:', effectsManager.particles.length);
            perfLog.debug('[LOOP] 游戏状态:', gameManager.getGameState());
            
            // 🧪 黏液坑调试：输出坑的坐标
            if (mucusPitRenderer && gameManager.currentLevel?.hasMucusPits && loopCounter === 1) {
                console.log('[LOOP] 🧪 当前黏液坑坐标：');
                mucusPitRenderer.pits.forEach((pit, i) => {
                    console.log(`  坑${i+1}: (${pit.x.toFixed(2)}, ${pit.y.toFixed(2)}), 半径=${pit.radius}`);
                });
            }
            
            // 🚨 内存泄漏诊断：如果数组过大，输出警告
            if (viruses.length > 50) {
                console.warn('[LOOP] ⚠️ 病毒数量过多:', viruses.length, '可能存在内存泄漏！');
            }
            if (effectsManager.particles.length > 200) {
                console.warn('[LOOP] ⚠️ 粒子数量过多:', effectsManager.particles.length, '可能存在内存泄漏！');
            }
        }
        
        const dt = timestamp - lastTime;
        // 🚀 防止dt爆炸：严格限制dt上限，防止切后台或严重卡顿导致的时间差爆炸
        const clampedDt = (dt > 100) ? 16.67 : dt; // 最大100ms = 0.1秒，超过则使用标准帧时间
        // ✅ 第一帧、dt异常、或游戏刚激活时，使用标准帧时间，避免病毒瞬移
        const safeDt = (lastTime === 0 || isStateJustActivated) ? 16.67 : clampedDt;
        
        if (isStateJustActivated) {
            perfLog.log('[LOOP] 🎯 游戏激活帧：原始dt=', dt.toFixed(2), 'ms, 使用safeDt=', safeDt.toFixed(2), 'ms');
        }
        
        lastTime = timestamp;
        
        // 🌑 检测是否为暗夜模式
        const isNightMode = gameManager.currentLevel?.isNightMode || false;
        
        ctx.clearRect(0, 0, displayWidth, displayHeight);
        effectsManager.drawBackground(ctx, displayWidth, displayHeight, isNightMode);

        // 🌀 绘制漩涡（在背景之后，黏液坑之前）
        if (vortexRenderer && gameManager.currentLevel?.hasVortex) {
            vortexRenderer.draw(ctx);
        }

        // 🧪 绘制黏液坑（在背景之后，风力之前）
        if (mucusPitRenderer && gameManager.currentLevel?.hasMucusPits) {
            mucusPitRenderer.draw(ctx);
        }

        // 🌬️ 绘制风力特效（Level 6 风力 或 Level 11 湍流）
        if (windEffectSystem && (gameManager.hasWind || gameManager.currentLevel?.hasTurbulence)) {
            windEffectSystem.draw(ctx);
        }
        
        // 🌌 绘制传送门（Level 13）
        if (portalEffectSystem && gameManager.currentLevel?.hasPortals) {
            portalEffectSystem.draw(ctx);
        }
        
        // 🔗 绘制双子羁绊连接线（Level 14）
        if (tetheredPairSystem && gameManager.currentLevel?.hasTetheredPairs) {
            tetheredPairSystem.draw(ctx);
        }
        
        // 🍑 绘制动脉潮汐（Level 19，最底层背景，不阻挡点击）
        if (arterialTidesSystem && gameManager.currentLevel?.hasArterialTides) {
            arterialTidesSystem.draw(ctx);
        }
        
        // 🍑 绘制瓣膜（Level 17，在病毒之前绘制，作为背景元素）
        if (valveSystem && gameManager.currentLevel?.hasValves) {
            valveSystem.draw(ctx);
        }
        
        // 🍑 绘制白细胞（Level 18，在病毒之前绘制）
        if (whiteBloodCells && whiteBloodCells.length > 0) {
            whiteBloodCells.forEach(wbc => wbc.draw(ctx));
        }
        
        // 🍦 绘制神圣气泡（Level 22，在病毒之前绘制）
        if (holyBubblesSystem && gameManager.currentLevel?.hasHolyBubbles) {
            holyBubblesSystem.draw(ctx);
        }
        
        // 🍦 绘制神圣节拍波纹（Level 23，在病毒之前绘制背景波纹）
        if (sacredBeatSystem && gameManager.currentLevel?.hasSacredBeat) {
            sacredBeatSystem.draw(ctx, viruses);
        }
        
        // 🍦 绘制信仰连结（Level 24，激光线和信标）
        if (sacredGeometrySystem && gameManager.currentLevel?.hasSacredGeometry) {
            sacredGeometrySystem.draw(ctx);
        }

        ensureTutorialVirusInList(viruses);
        
        // 教程模式：绘制高亮圈指示教程病毒
        const tutorialVirus = tutorialManager.getTutorialVirus?.();
        if (tutorialManager.isActive() && tutorialVirus) {
            effectsManager.drawTutorialHighlight(ctx, tutorialVirus);
        }

        // === 🎯 状态机分支 ===
        if (gameManager.getGameState() === GAME_STATE.PLAYING && gameManager.isGameRunning() && !gameManager.isPaused) {
            updateGamePlaying(canvas, ctx, viruses, freezeCooldown, FREEZE_COOLDOWN_MAX, safeDt, spawnVirus, triggerGameOver, triggerLevelComplete, displayWidth, displayHeight, isNightMode);
        } 
        else if (gameManager.getGameState() === GAME_STATE.WINNING) {
            updateGameWinning(canvas, ctx, viruses, triggerLevelComplete, displayWidth, displayHeight, safeDt, isNightMode);
        } 
        else {
            // 🔥 GAME_STATE.LEVEL_OVER 或暂停状态
            if (tutorialManager.isActive() && tutorialVirus) {
                // 教程期间：绘制教程病毒和高亮效果
                effectsManager.drawTutorialHighlight(ctx, tutorialVirus);
                viruses.forEach(v => {
                    const inMucus = false; // 教程时无黏液坑
                    v.draw(ctx, isNightMode, inMucus, viruses.length);
                });
                effectsManager.updateParticles(ctx, safeDt);
            } else {
                // 非教程的暂停状态（如弹窗、结算、暂停菜单），绘制静态画面
                viruses.forEach(v => {
                    const inMucus = false; // 暂停时不检测
                    v.draw(ctx, isNightMode, inMucus, viruses.length);
                });
                effectsManager.updateParticles(ctx, safeDt);
            }
        }
        
        // 👑 绘制Boss和治愈特效（在病毒之后）
        if (boss && gameManager.currentLevel?.isBossLevel) {
            boss.draw(ctx);
            bossHealEffect.draw(ctx, boss.x, boss.y, boss.radius);
            
            // 🍦 Level 25：绘制屏幕闪光效果（残渣逃逸警告）
            if (gameManager.currentLevel.isFinalBoss && boss.drawScreenFlash) {
                boss.drawScreenFlash(ctx, displayWidth, displayHeight);
            }
        }
        
        // 🌫️ 绘制迷雾覆盖层（Level 12，在所有内容之上）
        if (fogEffectSystem && gameManager.currentLevel?.hasFog) {
            fogEffectSystem.draw(ctx);
        }
        
        // 🍦 绘制香草视野遮罩（Level 21，在所有内容之上）
        if (vanillaVeilSystem && gameManager.currentLevel?.hasVanillaVeil) {
            vanillaVeilSystem.draw(ctx);
        }
        
        // ❄️ 冰冻视觉效果：轻量级全屏遮罩，不阻塞渲染
        if (skillManager && skillManager.isFrozen) {
            ctx.save();
            ctx.fillStyle = 'rgba(100, 200, 255, 0.15)'; // 半透明蓝色
            ctx.fillRect(0, 0, displayWidth, displayHeight);
            ctx.restore();
        }

        // 🚀 保存动画ID以便后续取消
        currentAnimationId = requestAnimationFrame(loop);
    }

    // 🚀 防止主循环堆积：如果已有循环在运行，先强制取消
    if (currentAnimationId !== null) {
        perfLog.debug('[GAME] ⚠️ 检测到已存在的游戏循环，强制取消！');
        cancelAnimationFrame(currentAnimationId);
        currentAnimationId = null;
    }
    
    if (!window.gameLoopStarted) {
        perfLog.log('[GAME] 🚀 引擎启动！开始渲染循环...');
        if (PERFORMANCE_CONFIG.ENABLE_FPS_COUNTER) {
            perfLog.log('[PERF] FPS计数器已启用，右上角显示帧率');
        }
        window.gameLoopStarted = true;
        lastTime = 0;  // ✅ 重置时间戳，避免第一帧dt过大
        canvasSizeNeedsUpdate = true;  // ✅ 标记需要更新尺寸
        currentAnimationId = requestAnimationFrame(loop);
    }
    
    // 🔗 暴露羁绊系统到全局作用域（供input-handler和game.js使用）
    window.tetheredPairSystem = tetheredPairSystem;
}

// ✅ 导出函数供外部调用，当窗口resize时通知更新
export function markCanvasSizeNeedsUpdate() {
    canvasSizeNeedsUpdate = true;
}

/**
 * 游戏进行中的状态更新
 */
function updateGamePlaying(canvas, ctx, viruses, freezeCooldown, FREEZE_COOLDOWN_MAX, dt, spawnVirus, triggerGameOver, triggerLevelComplete, w, h, isNightMode = false) {
    // 更新游戏时间和生成计时器
    const shouldSpawn = gameManager.updateGameTime(dt);
    
    // 🌬️ 更新风力系统（包括 Level 6 风力和 Level 11 湍流）
    gameManager.updateWind(dt);
    
    // 🌬️ 更新风力特效（Level 6 风力模式 或 Level 11 湍流模式）
    if (windEffectSystem && (gameManager.hasWind || gameManager.currentLevel?.hasTurbulence)) {
        windEffectSystem.update(dt / 1000, gameManager.getWindForce());
    }
    
    // 🌫️ 更新迷雾系统（Level 12）
    if (fogEffectSystem && gameManager.currentLevel?.hasFog) {
        fogEffectSystem.update(dt);
    }
    
    // 🌌 更新传送门系统（Level 13）
    if (portalEffectSystem && gameManager.currentLevel?.hasPortals) {
        portalEffectSystem.update(dt);
    }
    
    // 🔗 更新双子羁绊系统（Level 14）
    if (tetheredPairSystem && gameManager.currentLevel?.hasTetheredPairs) {
        tetheredPairSystem.update(dt, viruses, spawnVirus);
    }
    
    // 🍑 更新瓣膜系统（Level 17）
    if (valveSystem && gameManager.currentLevel?.hasValves) {
        valveSystem.update(dt);
    }
    
    // 🍑 更新白细胞（Level 18）
    if (whiteBloodCells && whiteBloodCells.length > 0) {
        whiteBloodCells.forEach(wbc => wbc.update(dt, w, h));
    }
    
    // 🍑 更新动脉潮汐系统（Level 19）
    if (arterialTidesSystem && gameManager.currentLevel?.hasArterialTides) {
        arterialTidesSystem.update(dt);
    }
    
    // 🍦 更新神圣气泡系统（Level 22）
    if (holyBubblesSystem && gameManager.currentLevel?.hasHolyBubbles) {
        const result = holyBubblesSystem.update(dt, viruses);
        if (result && result.escapedWithVirus) {
            // 气泡带病毒逃逸 → 直接触发游戏失败！
            console.log('[LOOP] ❌ 气泡带病毒逃逸！游戏失败！');
            
            // 移除被带走的病毒
            const virusIndex = viruses.indexOf(result.virus);
            if (virusIndex !== -1) {
                viruses.splice(virusIndex, 1);
            }
            
            // 触发游戏失败
            triggerGameOver();
            return;
        }
    }
    
    // 🍦 更新神圣节拍系统（Level 23）
    if (sacredBeatSystem && gameManager.currentLevel?.hasSacredBeat) {
        sacredBeatSystem.update(dt, viruses);
    }
    
    // 🍦 更新信仰连结系统（Level 24）
    if (sacredGeometrySystem && gameManager.currentLevel?.hasSacredGeometry) {
        const killedViruses = sacredGeometrySystem.update(dt, viruses);
        if (killedViruses && killedViruses.length > 0) {
            // 激光杀死病毒
            for (const virus of killedViruses) {
                effectsManager.createExplosion(virus.x, virus.y, '#FFD700', 25);
                // 在被杀死位置创建新信标！
                sacredGeometrySystem.createBeacon(virus.x, virus.y);
                const index = viruses.indexOf(virus);
                if (index !== -1) {
                    viruses.splice(index, 1);
                    gameManager.addCuredCount(virus.props.cureValue || 1);
                }
            }
            console.log('[LOOP] ⚡ 激光连结消灭', killedViruses.length, '个病毒！');
        }
    }
    
    // 🧪 更新黏液坑动画
    if (mucusPitRenderer && gameManager.currentLevel?.hasMucusPits) {
        mucusPitRenderer.update(dt);
    }
    
    // 🌀 更新漩涡动画
    if (vortexRenderer && gameManager.currentLevel?.hasVortex) {
        vortexRenderer.update(dt);
    }
    
    // 👑 更新Boss实体和治愈特效
    if (boss && gameManager.currentLevel?.isBossLevel) {
        // 🍦 Level 25 FinalBoss需要额外参数（残渣逃逸处理）
        if (gameManager.currentLevel.isFinalBoss && boss.update) {
            const bossUpdateResult = boss.update(dt, w, h, gameManager);
            
            // 处理核心超时失败
            if (bossUpdateResult && bossUpdateResult.coreFailed) {
                console.log('[LOOP] ❌ 核心超时未击败！游戏失败！');
                triggerGameOver();
                return;
            }
            
            // 处理残渣逃逸：每个残渣=5点免疫负荷
            if (bossUpdateResult && bossUpdateResult.escaped) {
                finalBossInfectionLoad += 5;
                console.log('[LOOP] ⚠️ 残渣逃逸！最终关免疫负荷 +5，当前:', finalBossInfectionLoad);
            }
        } else {
            boss.update(dt);
        }
        bossHealEffect.update(dt);
        
        // 🍑 Level 20: 凝血巨兽特殊处理（拉扯病毒）
        if (gameManager.currentLevel.isPeachThrombusBoss && boss.tryPullVirus) {
            // 尝试拉扯新病毒
            boss.tryPullVirus(viruses);
            
            // 拉扯目标病毒
            if (boss.targetVirus) {
                const result = boss.pullTargetVirus(dt);
                if (result && result.eaten) {
                    // Boss吃掉病毒：移除病毒，玩家受到伤害
                    const index = viruses.indexOf(result.eaten);
                    if (index !== -1) {
                        viruses.splice(index, 1);
                        // 增加免疫负荷（惩罚）
                        console.log('[PeachBoss] ⚠️ 玩家受到惩罚！免疫负荷 +', result.immuneDamage);
                    }
                }
            }
        }
    }
    
    // 📛 失败判定：免疫负荷满了立即GameOver
    if (viruses.length >= gameManager.getInfectionThreshold()) {
        console.log('[LOOP] ❌ 免疫负荷已满！病毒数:', viruses.length, '>=', gameManager.getInfectionThreshold());
        triggerGameOver();
        return;
    }
    
    // �🔥 更新冰冻状态UI（冰冻期间优先显示冰冻倒计时）
    if (skillManager.isFrozen && skillManager.freezeTimeRemaining > 0) {
        // 冰冻期间：更新冰冻剩余时间
        skillManager.freezeTimeRemaining -= dt / 1000;
        if (skillManager.freezeTimeRemaining < 0) skillManager.freezeTimeRemaining = 0;
        
        // 显示冰冻倒计时（用负数或特殊标记表示冰冻状态）
        uiManager.updateCooldownUI(skillManager.freezeTimeRemaining, 5, true);
    } else if (window.freezeCooldown > 0) {
        // CD期间：更新CD倒计时
        window.freezeCooldown -= dt / 1000;
        if (window.freezeCooldown < 0) window.freezeCooldown = 0;
        
        uiManager.updateCooldownUI(window.freezeCooldown, FREEZE_COOLDOWN_MAX, false);
    }

    // 生成病毒（教程模式不生成新病毒，冰冻状态不生成）
    // Level 25：纯Boss战，不生成任何病毒
    const isFinalBossLevel = !!gameManager.currentLevel?.isFinalBoss;
    if (!isFinalBossLevel && !tutorialManager.isActive() && !skillManager.isFrozen && shouldSpawn) {
        gameManager.resetSpawnTimer();
        // 👑 Boss战模式：传递Boss坐标
        if (boss && gameManager.currentLevel?.isBossLevel) {
            spawnVirus(undefined, undefined, undefined, boss);
        } else {
            spawnVirus();
        }
    }

    // 粒子更新
        effectsManager.updateParticles(ctx, dt);
    // 病毒更新（Level 25 禁用并清空残留病毒）
    if (isFinalBossLevel) {
        if (viruses.length > 0) {
            viruses.length = 0;
        }
    } else {
        updateViruses(canvas, viruses, dt, w, h, isNightMode);
    }

    // 绘制闪电特效
    skillManager.drawLightning(ctx);

    // 👑 更新进度条（Boss战显示Boss血量，普通关卡显示击杀数）
    if (boss && gameManager.currentLevel?.isBossLevel) {
        // Boss战：进度条显示Boss剩余血量（反向显示，即Boss血越少进度越高）
        const bossHealthPercent = boss.hp / boss.maxHp;
        const progress = 1 - bossHealthPercent;  // 反向进度

        // 🦠 计算总免疫负荷（最终关使用残渣逃逸负荷）
        const totalInfectionLoad = isFinalBossLevel
            ? finalBossInfectionLoad
            : (viruses.length + Math.floor(boss.passivePollutionLoad));

        // 🍦 最终关免疫负荷条金光提示
        uiManager.setFinalBossLoadEffect?.(isFinalBossLevel);
        
        uiManager.updateProgressBars(
            progress * 100,  // 当前进度（0-100）
            100,             // 总目标（100%）
            totalInfectionLoad,  // 🦠 包含被动污染的总负荷
            gameManager.getInfectionThreshold()
        );
    } else {
        uiManager.setFinalBossLoadEffect?.(false);
        // 普通关卡：显示击杀数
        uiManager.updateProgressBars(
            gameManager.getCuredCount(), 
            gameManager.getLevelGoal(), 
            viruses.length, 
            gameManager.getInfectionThreshold()
        );
    }

    // 🎯 检查胜负条件（只有在游戏激活时才检查）
    if (gameManager.isGameRunning()) {
        // 👑 Boss战胜负判定
        if (boss && gameManager.currentLevel?.isBossLevel) {
            // 胜利条件：Boss HP <= 0
            if (boss.hp <= 0) {
                // 🚀 修复拼写错误：perfLogager → gameManager
                gameManager.gameState = GAME_STATE.WINNING;
                gameManager.vaccineRadius = 0;
                gameManager.isLevelComplete = true;
                perfLog.log('[LOOP] 👑 Boss战胜利！设置状态为WINNING...');
                // 🎉 立即显示胜利特效
                effectsManager.createExplosion(boss.x, boss.y, '#FFD700', 100); // 金色大爆炸
                console.log('[LOOP] 🎊 Boss已被击败，胜利特效启动！');
            }
            // 🦠 失败条件：最终关使用残渣逃逸负荷，其它Boss沿用原逻辑
            else if ((isFinalBossLevel ? finalBossInfectionLoad : (viruses.length + Math.floor(boss.passivePollutionLoad))) >= gameManager.getInfectionThreshold()) {
                if (isFinalBossLevel) {
                    console.log('[LOOP] ❌ 最终关失败！免疫负荷:', finalBossInfectionLoad, '>=', gameManager.getInfectionThreshold());
                } else {
                    console.log('[LOOP] ❌ Boss战失败！病毒数:', viruses.length, '+ 被动污染:', Math.floor(boss.passivePollutionLoad), '>=', gameManager.getInfectionThreshold());
                }
                triggerGameOver();
                return;
            }
        } else {
            // 普通关卡胜负判定
            const result = gameManager.checkWinConditions(viruses.length);
            if (result === 'win') {
                // 进入胜利动画阶段 - 已在gameManager中处理
            } else if (result === 'lose') {
                triggerGameOver();
                return;
            }
        }
    }
}

/**
 * 游戏胜利阶段的状态更新
 */
function updateGameWinning(canvas, ctx, viruses, triggerLevelComplete, w, h, dt, isNightMode = false) {
    const radius = gameManager.updateVaccineWave();
    
    // 绘制白色光波
    const { centerX, centerY } = effectsManager.drawVaccineWave(ctx, w, h, radius);
    
    // 碰撞检测：消灭被光波覆盖的病毒（保护教程病毒）
    for (let i = viruses.length - 1; i >= 0; i--) {
        const v = viruses[i];
        if (v.isTutorial || v.tutorialLock) {
            v.draw(ctx, false, false, viruses.length); // 教程病毒不受黏液影响
            continue;
        }
        
        if (effectsManager.isVirusInWave(v, centerX, centerY, radius)) {
            effectsManager.createExplosion(v.x, v.y, v.props.color, 20);
            viruses.splice(i, 1);
        } else {
            v.draw(ctx, isNightMode, false, viruses.length); // 胜利阶段不检测黏液
        }
    }
    
    // 粒子继续更新
    effectsManager.updateParticles(ctx, dt);
    
    // 结算条件：光波超出屏幕且病毒清空
    if (gameManager.isVaccineWaveComplete(w, h) && viruses.length === 0) {
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
function updateViruses(canvas, viruses, dt, w, h, isNightMode = false) {
    const SAFE_ZONE_SIZE = 120;
    const newBabies = [];
    
    // 🌬️ 获取当前风力
    const windForceX = gameManager.getWindForce();

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
            v.draw(canvas.getContext('2d'), isNightMode);
            continue;
        }
        
        // 🧊 冰冻状态：跳过移动和分裂逻辑
        if (!skillManager.isFrozen) {
            // 🧪 Level 7：检测病毒是否在黏液坑内
            const inMucus = mucusPitRenderer && gameManager.currentLevel?.hasMucusPits 
                && mucusPitRenderer.checkCollision(v.x, v.y);
            
            // �️ Level 11：获取湍流配置
            const hasTurbulence = gameManager.currentLevel?.hasTurbulence || false;
            const turbulenceConfig = gameManager.currentLevel?.turbulenceConfig || null;
            
            // 🌬️ 传递风力、黏液状态、湍流配置给病毒更新
            v.update(dt, w, h, windForceX, inMucus, hasTurbulence, turbulenceConfig);
            
            // 禁区碰撞逻辑
            const safeLeft = w - SAFE_ZONE_SIZE;
            const safeTop = h - SAFE_ZONE_SIZE;
            
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
            
            // 🌌 Level 13：传送门检测
            if (portalEffectSystem && gameManager.currentLevel?.hasPortals) {
                const virusId = v.id || i; // 使用病毒ID或索引
                const currentTime = Date.now();
                const teleportTarget = portalEffectSystem.checkTeleport(v.x, v.y, virusId, currentTime);
                
                if (teleportTarget) {
                    // 传送病毒到目标传送门
                    v.x = teleportTarget.x;
                    v.y = teleportTarget.y;
                    // 创建传送特效
                    effectsManager.createExplosion(teleportTarget.x, teleportTarget.y, '#FFB7C5', 10);
                    console.log(`[Virus] 🌀 病毒 ${virusId} 传送到 (${teleportTarget.x.toFixed(0)}, ${teleportTarget.y.toFixed(0)})`);
                }
            }
            
            // 🍑 Level 17：瓣膜碰撞检测（病毒被瓣膜阻挡）
            if (valveSystem && gameManager.currentLevel?.hasValves) {
                valveSystem.applyToVirus(v);
            }
            
            // 🍑 Level 19：动脉潮汐影响（车道内病毒加速下落）
            if (arterialTidesSystem && gameManager.currentLevel?.hasArterialTides) {
                arterialTidesSystem.applyToVirus(v, dt);
            }
            
            // 👑 Boss战碰撞检测：小怪触碰Boss → 销毁小怪 + Boss回血 + 触发特效
            if (boss && gameManager.currentLevel?.isBossLevel && v.isMinionMode) {
                if (boss.checkCollision(v.x, v.y, v.radius)) {
                    // 销毁小怪
                    viruses.splice(i, 1);
                    // Boss回血（判断Boss类型）
                    const healAmount = gameManager.currentLevel.bossConfig?.healPerMinion || 2;
                    if (boss.eatMinion) {
                        // TaroBroodmotherBoss 使用 eatMinion 方法
                        boss.eatMinion(healAmount);
                    } else if (boss.heal) {
                        // 普通Boss 使用 heal 方法
                        boss.heal(healAmount);
                    }
                    // 触发治愈特效
                    bossHealEffect.trigger();
                    // 创建爆炸粒子效果
                    effectsManager.createExplosion(v.x, v.y, v.props.color, 15);
                    continue;
                }
            }
            
            // 👑 清理逃出屏幕的小怪（Boss战专用）
            if (v.isMinionMode && (v.x < -50 || v.x > w + 50 || v.y < -50 || v.y > h + 50)) {
                viruses.splice(i, 1);
                continue;
            }

            // 分裂检查 - 确保教程病毒永不分裂
            if (v.shouldSplit() && !v.isTutorial && !v.tutorialLock) {
                newBabies.push(...v.split());
                viruses.splice(i, 1);
                effectsManager.createExplosion(v.x, v.y, '#FFB7B2', 5);
            }
        }
        
        const ctx = canvas.getContext('2d');
        // 🔥 修复：绘制时重新检测黏液状态
        const inMucus = mucusPitRenderer && gameManager.currentLevel?.hasMucusPits 
            && mucusPitRenderer.checkCollision(v.x, v.y);
        
        // 🌫️ Level 12：检测病毒是否在迷雾中
        const inFog = fogEffectSystem && gameManager.currentLevel?.hasFog 
            && fogEffectSystem.isInFog(v.x, v.y);
        
        if (inFog) {
            // 🌫️ 在迷雾中只显示发光眼睛
            fogEffectSystem.drawGlowingEyes(ctx, v.x, v.y, v.radius);
        } else {
            // 正常绘制病毒
            v.draw(ctx, isNightMode, inMucus, viruses.length);
        }
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

// 🧪 导出黏液坑渲染器，供 input-handler 使用
export function getMucusPitRenderer() {
    return mucusPitRenderer;
}

// 👑 导出Boss实体，供 input-handler 使用
export function getBoss() {
    return boss;
}

// 💚 导出Boss治愈特效，供调试使用
export function getBossHealEffect() {
    return bossHealEffect;
}

// Export fog system for input-layer shelter check
export function getFogEffectSystem() {
    return fogEffectSystem;
}

// 🍑 导出瓣膜系统，供外部访问
export function getValveSystem() {
    return valveSystem;
}
