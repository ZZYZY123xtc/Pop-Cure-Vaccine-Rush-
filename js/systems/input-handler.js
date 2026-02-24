/**
 * 输入事件处理系统
 * 负责处理鼠标点击、技能触发等用户输入
 */

import { CONFIG } from '../core/config.js';
import { skillManager } from '../data/skills.js';
import { tutorialManager } from './tutorial.js';
import { effectsManager } from './effects.js';
import { gameManager, GAME_STATE } from '../core/game-manager.js';
import { uiManager } from '../managers/ui-manager.js';
import { getMucusPitRenderer, getBoss, getFogEffectSystem } from './game-loop.js?v=20260223_fix1';
import { Virus } from '../entities/virus.js'; // 🍑 Level 18 白细胞惩罚生成病毒

const SAFE_ZONE_SIZE = 120;
const FOG_SHELTER_MIN_OPACITY = 0.72;
const FOG_CLEAR_RADIUS_RATIO_WHEN_LIGHT = 0.66;
const FOG_CLEAR_RADIUS_RATIO_WHEN_DENSE = 0.58;

// 🔥 防御机制：确保事件处理器只绑定一次
let mouseHandlerInitialized = false;

/**
 * 初始化鼠标点击事件处理
 */
export function initMouseHandler(canvas, viruses, updateComboDisplay) {
    // 🔥 防止重复绑定
    if (mouseHandlerInitialized) {
        console.warn('[INPUT] initMouseHandler 已初始化，跳过重复绑定');
        return;
    }
    
    console.log('[INPUT] 🎯 初始化鼠标点击事件处理');
    
    // PC端：鼠标点击
    canvas.addEventListener('mousedown', (e) => {
        handleCanvasClick(e, canvas, viruses, updateComboDisplay);
    });
    
    // 移动端：触摸事件
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault(); // 防止触发 mousedown
        handleCanvasClick(e, canvas, viruses, updateComboDisplay);
    }, { passive: false }); // 允许 preventDefault
    
    // 🍦 Level 21：鼠标移动事件（香草视野手电筒）
    canvas.addEventListener('mousemove', (e) => {
        handleMouseMove(e, canvas);
    });
    
    // 🍦 移动端：触摸移动事件
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        handleMouseMove(e, canvas);
    }, { passive: false });
    
    mouseHandlerInitialized = true;
    console.log('[INPUT] ✅ 鼠标点击事件处理已初始化');
}

/**
 * 初始化技能按钮事件
 */
export function initSkillButton(activeSkillBtn, freezeCooldown, FREEZE_COOLDOWN_MAX, setFreezeCooldown) {
    if (!activeSkillBtn) return;

    activeSkillBtn.addEventListener('click', () => {
        if (gameManager.getGameState() !== GAME_STATE.PLAYING) return;
        if (window.freezeCooldown > 0) return; // ✅ 检查当前CD状态
        
        // 🔥 修复：传入回调，在冰冻结束后才开始CD
        const success = skillManager.triggerFreeze(() => {
            // 冰冻效果结束后，开始CD倒计时
            setFreezeCooldown(FREEZE_COOLDOWN_MAX);
            activeSkillBtn.classList.add('cooldown');
        });
        
        if (!success) {
            console.log('[SKILL] ❌ 冰冻技能触发失败');
        }
    });
}

/**
 * 处理Canvas点击事件
 * @param {MouseEvent|TouchEvent} e - 鼠标或触摸事件
 */
function handleCanvasClick(e, canvas, viruses, updateComboDisplay) {
    // 教程期间只允许点击教程病毒
    if (tutorialManager.isActive()) {
        const tutorialVirus = tutorialManager.getTutorialVirus?.();
        if (!tutorialVirus) return;
        
        const rect = canvas.getBoundingClientRect();
        // 兼容鼠标和触摸事件
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;
        
        // 只检测教程病毒（使用触摸宽容度）
        // 🚀 性能优化：移除 Math.hypot，改用平方距离判断
        const dx = mouseX - tutorialVirus.x;
        const dy = mouseY - tutorialVirus.y;
        const distSq = dx * dx + dy * dy;
        const hitRadius = tutorialVirus.radius + CONFIG.TOUCH_PADDING;
        
        if (distSq <= hitRadius * hitRadius) {
            // 教程病毒被点击，显示特效但不移除
            effectsManager.createExplosion(tutorialVirus.x, tutorialVirus.y, '#FFF', 5);
            // 可以选择在这里触发"点击成功"的反馈，比如让气泡闪烁
        }
        return;
    }
    
    if (gameManager.getGameState() !== GAME_STATE.PLAYING) return;
    
    const rect = canvas.getBoundingClientRect();
    // 兼容鼠标和触摸事件
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    // Level 12：迷雾边缘区作为“物理掩体”，直接忽略点击
    if (isBlockedByFogShelter(mouseX, mouseY, rect.width, rect.height)) {
        return;
    }

    let hitVirus = false;
    
    // 👑 Boss战：优先检测Boss的点击（Boss优先级高于病毒）
    const boss = getBoss();
    if (boss && gameManager.currentLevel?.isBossLevel) {
        // 🍦 Level 25：奶油坍塌的特殊点击判定
        if (gameManager.currentLevel.isFinalBoss && boss.handleClick) {
            const clickResult = boss.handleClick(mouseX, mouseY);
            
            if (clickResult) {
                if (clickResult.type === 'core') {
                    // 点击核心：-1点伤害 + 金色爆炸
                    const coreDestroyed = boss.damageCore(1);
                    effectsManager.createExplosion(mouseX, mouseY, '#FFD700', 30);
                    
                    console.log('[INPUT] 🍦 击中核心！剩余HP:', boss.coreHp);
                    
                    if (coreDestroyed) {
                        console.log('[INPUT] 🍦 核心被摧毁！最终Boss被击败！');
                        effectsManager.createExplosion(boss.x, boss.y, '#FFD700', 100);
                        
                        // 触发胜利
                        // gameManager的胜利逻辑会在game-loop中处理
                    }
                } else if (clickResult.type === 'ball') {
                    // 点击奶油球：剥落 + 生成残渣
                    effectsManager.createExplosion(clickResult.target.x, clickResult.target.y, '#FFFEF0', 20);
                   console.log('[INPUT] 🍦 剥落奶油球！剩余:', boss.creamBalls.length);
                } else if (clickResult.type === 'debris') {
                    // 点击残渣：成功拦截
                    effectsManager.createExplosion(clickResult.target.x, clickResult.target.y, '#D4AF37', 12);
                    console.log('[INPUT] ✅ 拦截残渣！');
                }
                
                return; // 点击Boss相关元素后不再检测病毒
            }
        }
        
        // 🍑 其他Boss类型的常规判定
        if (boss.checkCollision(mouseX, mouseY)) {
            // 玩家点击Boss → Boss受伤
            const bossKilled = boss.takeDamage(1);
            
            // 🍑 Level 20：凝血巨兽使用粉色爱心粒子（马卡龙萌系）
            if (gameManager.currentLevel.isPeachThrombusBoss) {
                effectsManager.createExplosion(mouseX, mouseY, '#FFB6C1', 8); // 粉色爱心粒子
                // 额外的小粒子飞溅
                for (let i = 0; i < 3; i++) {
                    effectsManager.createExplosion(
                        mouseX + (Math.random() - 0.5) * 20, 
                        mouseY + (Math.random() - 0.5) * 20, 
                        '#FFAEC9', 
                        3
                    );
                }
            } else {
                effectsManager.createExplosion(mouseX, mouseY, '#8B0000', 10); // 深红色爆炸
            }
            
            console.log('[INPUT] 👑 Boss受伤！剩余HP:', boss.hp);
            
            if (bossKilled) {
                console.log('[INPUT] 👑 Boss被击败！');
                const explosionColor = gameManager.currentLevel.isPeachThrombusBoss ? '#FFB6C1' : '#FF0000';
                effectsManager.createExplosion(boss.x, boss.y, explosionColor, 50); // 巨大爆炸
            }
            
            // 点击Boss后不再检测病毒，直接返回
            return;
        }
    }
    
    // � Level 22：神圣气泡点击检测
    if (gameManager.currentLevel?.hasHolyBubbles && window.holyBubblesSystem) {
        const bubbleResult = window.holyBubblesSystem.checkClick(mouseX, mouseY, viruses);
        if (bubbleResult && bubbleResult.hitBubble) {
            // 击破气泡
            effectsManager.createExplosion(mouseX, mouseY, 'rgba(212, 175, 55, 0.8)', 12);
            console.log('[INPUT] 🍦 击破气泡！', bubbleResult.hadVirus ? '解救病毒' : '空泡');
            
            // 如果气泡内有病毒，现在可以正常点击它了
            // 不直接返回，继续检测病毒点击
        }
    }
    
    // �🍑 Level 18：白细胞点击检测（误击惩罚）
    if (gameManager.currentLevel?.hasWhiteBloodCells && window.whiteBloodCells) {
        for (const wbc of window.whiteBloodCells) {
            if (wbc.checkCollision(mouseX, mouseY)) {
                // 误击白细胞：触发受击状态
                wbc.triggerHit();
                effectsManager.createExplosion(mouseX, mouseY, 'rgba(255, 182, 193, 0.9)', 8);
                console.log('[INPUT] 🍑 误击白细胞！惩罚：生成', gameManager.currentLevel.wbcConfig?.penaltyVirusCount || 3, '个快速病毒');
                
                // 惩罚：生成多个快速病毒
                const penaltyCount = gameManager.currentLevel.wbcConfig?.penaltyVirusCount || 3;
                const penaltySpeedMultiplier = gameManager.currentLevel.wbcConfig?.penaltySpeedMultiplier || 2.0;
                
                for (let p = 0; p < penaltyCount; p++) {
                    // 在白细胞位置生成病毒
                    const availableTypes = gameManager.getAvailableTypes();
                    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
                    const difficulty = (gameManager.currentLevel?.difficulty || 1.0) * penaltySpeedMultiplier;
                    
                    const angle = (Math.PI * 2 / penaltyCount) * p;
                    const spawnX = wbc.x + Math.cos(angle) * 30;
                    const spawnY = wbc.y + Math.sin(angle) * 30;
                    
                    // 直接创建病毒
                    const penaltyVirus = new Virus(spawnX, spawnY, type, difficulty);
                    viruses.push(penaltyVirus);
                }
                
                // 误击白细胞后不再检测病毒
                return;
            }
        }
    }
    
    // 🚀 极致性能优化：倒序遍历病毒数组（先点中渲染在最顶层的病毒）
    for (let i = viruses.length - 1; i >= 0; i--) {
        const v = viruses[i];
        if (v.isTutorial || v.tutorialLock) continue;  // 保护教程病毒
        
        // 🚀 性能优化：移除 Math.hypot，改用平方距离判断
        const dx = mouseX - v.x;
        const dy = mouseY - v.y;
        const distSq = dx * dx + dy * dy;
        const hitRadius = v.radius + CONFIG.TOUCH_PADDING;
        
        // 使用触摸宽容度扩大点击判定区域（视觉大小不变）
        if (distSq <= hitRadius * hitRadius) {
            // 🧪 Level 7：检查病毒是否在黏液坑内（绝对防御机制）
            const mucusPitRenderer = getMucusPitRenderer();
            if (mucusPitRenderer && gameManager.currentLevel?.hasMucusPits) {
                if (mucusPitRenderer.checkCollision(v.x, v.y)) {
                    // 病毒被黏液保护，点击无效，静默忽略
                    console.log('[INPUT] 🧪 病毒在黏液坑内，被黏液保护');
                    break; // 阻止点击，不进行后续处理
                }
            }
            
            // 🔥 关键优化：点中病毒，立即标记并处理
            hitVirus = true;
            
            // � Level 23：神圣节拍判定（vulnerable vs 击退）
            if (gameManager.currentLevel?.hasSacredBeat && window.sacredBeatSystem) {
                if (v.isCharged) {
                    // 🎵 点击充能病毒 → 触发连爆！
                    const chainResult = window.sacredBeatSystem.triggerChainReaction(v, viruses);
                    
                    // 先杀死源病毒
                    effectsManager.createExplosion(v.x, v.y, '#FFD700', 30);
                    
                    // 🍦 Level 24：病毒死亡时创建信标
                    if (gameManager.currentLevel?.hasSacredGeometry && window.sacredGeometrySystem) {
                        window.sacredGeometrySystem.createBeacon(v.x, v.y);
                    }
                    
                    viruses.splice(i, 1);
                    gameManager.addCuredCount(v.props.cureValue || 1);
                    
                    // 杀死所有被射线击中的病毒
                    for (const killedVirus of chainResult.killedViruses) {
                        effectsManager.createExplosion(killedVirus.x, killedVirus.y, '#FFD700', 20);
                        
                        // 🍦 Level 24：病毒死亡时创建信标
                        if (gameManager.currentLevel?.hasSacredGeometry && window.sacredGeometrySystem) {
                            window.sacredGeometrySystem.createBeacon(killedVirus.x, killedVirus.y);
                        }
                        
                        const index = viruses.indexOf(killedVirus);
                        if (index !== -1) {
                            viruses.splice(index, 1);
                            gameManager.addCuredCount(killedVirus.props.cureValue || 1);
                        }
                    }

                    // 被射线掠过的未充能病毒：仅轻微震动 + 灰色微火花
                    if (chainResult.glancedViruses && chainResult.glancedViruses.length > 0) {
                        for (const glancedVirus of chainResult.glancedViruses) {
                            effectsManager.createExplosion(glancedVirus.x, glancedVirus.y, 'rgba(160, 160, 160, 0.35)', 4);
                        }
                    }
                    
                    // 连爆计入combo
                    const totalKills = 1 + chainResult.killedViruses.length;
                    skillManager.checkCombo(true);
                    updateComboDisplay();
                    
                    console.log('[INPUT] 🎵 音律连爆！总击杀:', totalKills);
                    break; // 连爆后跳出
                } else {
                    // 点击未充能病毒 → 无效！播放失败特效
                    effectsManager.createExplosion(v.x, v.y, 'rgba(150, 150, 150, 0.35)', 5);
                    v.shakeTimer = 120;

                    console.log('[INPUT] ❌ 未充能病毒无法击杀（严格判定）');
                    
                    // 不扣血，不移除病毒，只是给玩家反馈
                    break; // 点击后跳出循环
                }
            }
            
            // �🍑 Level 16：红细胞载具机制 - 第一击击落载具，第二击消灭病毒
            if (v.isRidingRaft && v.removeRaft) {
                // 病毒有载具：移除载具，播放粉色粒子飞溅
                const raftRemoved = v.removeRaft();
                if (raftRemoved) {
                    // 粉色粒子飞溅动画（蜜桃粉）
                    effectsManager.createExplosion(v.x, v.y, 'rgba(255, 140, 150, 0.9)', 12);
                    console.log('[INPUT] 🍑 红细胞载具被击落！病毒速度激增！');
                    // 不扣血，不移除病毒
                    break; // 退出循环
                }
            }
            
            // 没有载具或载具已被击落，正常攻击
            const dead = v.hit();
            effectsManager.createExplosion(v.x, v.y, '#FFF', 3);
            
            if (dead) {
                // 🍑 Level 20：清除凝血Boss的拉扯目标
                const boss = getBoss();
                if (boss && gameManager.currentLevel?.isPeachThrombusBoss && boss.clearTarget) {
                    boss.clearTarget(v);
                }
                
                // 🔗 Level 14：双子羁绊处理
                let shouldRemove = true;
                if (gameManager.currentLevel?.hasTetheredPairs && window.tetheredPairSystem) {
                    shouldRemove = window.tetheredPairSystem.onVirusKilled(v, viruses);
                }
                
                if (shouldRemove) {
                    effectsManager.createExplosion(v.x, v.y, v.props.color, 15);
                    
                    // 🍦 Level 24：病毒死亡时创建信标
                    if (gameManager.currentLevel?.hasSacredGeometry && window.sacredGeometrySystem) {
                        window.sacredGeometrySystem.createBeacon(v.x, v.y);
                    }
                    
                    viruses.splice(i, 1);
                    gameManager.addCuredCount(v.props.cureValue || 1);
                } else {
                    // 羁绊系统阻止移除（例如需要复活）
                    // 不从数组中删除，但仍然计数和特效
                    effectsManager.createExplosion(v.x, v.y, v.props.color, 15);
                    
                    // 🍦 Level 24：病毒死亡时创建信标
                    if (gameManager.currentLevel?.hasSacredGeometry && window.sacredGeometrySystem) {
                        window.sacredGeometrySystem.createBeacon(v.x, v.y);
                    }
                    
                    viruses.splice(i, 1);
                    gameManager.addCuredCount(v.props.cureValue || 1);
                }
                
                // 检查连击并触发闪电
                const triggerLightning = skillManager.checkCombo(true);
                updateComboDisplay();
                
                if (triggerLightning) {
                    const lightningTargets = [];
                    const lightningKillQueue = [];
                    const lightningKilledIds = new Set();
                    const lightningRangeSq = 200 * 200;

                    for (let j = viruses.length - 1; j >= 0; j--) {
                        const target = viruses[j];
                        if (target.isTutorial || target.tutorialLock) continue;

                        const tdx = target.x - mouseX;
                        const tdy = target.y - mouseY;
                        const tdistSq = tdx * tdx + tdy * tdy;

                        if (tdistSq <= lightningRangeSq) {
                            lightningTargets.push({ x: target.x, y: target.y });
                            lightningKillQueue.push(target);
                            lightningKilledIds.add(target.id);
                        }
                    }

                    // Resolve kills in a second pass so simultaneous lightning kills do not enrage partners.
                    for (const target of lightningKillQueue) {
                        if (!viruses.includes(target)) continue;

                        let shouldRemove = true;
                        if (gameManager.currentLevel?.hasTetheredPairs && window.tetheredPairSystem) {
                            shouldRemove = window.tetheredPairSystem.onVirusKilled(target, viruses, {
                                simultaneousKilledIds: lightningKilledIds
                            });
                        }

                        if (!shouldRemove) continue;

                        effectsManager.createExplosion(target.x, target.y, target.props.color, 15);
                        
                        // 🍦 Level 24：病毒死亡时创建信标
                        if (gameManager.currentLevel?.hasSacredGeometry && window.sacredGeometrySystem) {
                            window.sacredGeometrySystem.createBeacon(target.x, target.y);
                        }
                        
                        const currentIndex = viruses.indexOf(target);
                        if (currentIndex !== -1) {
                            viruses.splice(currentIndex, 1);
                            gameManager.addCuredCount(target.props.cureValue || 1);
                        }
                    }

                    if (lightningTargets.length > 0) {
                        skillManager.activateLightning(mouseX, mouseY, lightningTargets);
                    }
                }
            }
            
            // 🔥 最关键优化：一旦点中病毒，立即跳出循环！
            // 不管病毒是否死亡，都不再检测其他病毒
            break;
        }
    }
    
    // 未击中任何病毒，连击清零
    if (!hitVirus) {
        skillManager.checkCombo(false);
        updateComboDisplay();
    }
}

function isBlockedByFogShelter(x, y, width, height) {
    if (!gameManager.currentLevel?.hasFog) return false;
    if (width <= 0 || height <= 0) return false;

    const fogEffectSystem = getFogEffectSystem();
    if (!fogEffectSystem || !fogEffectSystem.isActive) return false;

    const fogOpacity = Number(fogEffectSystem.fogOpacity);
    if (!Number.isFinite(fogOpacity) || fogOpacity < FOG_SHELTER_MIN_OPACITY) {
        return false;
    }

    const maxFogOpacity = 0.95;
    const opacityRange = Math.max(maxFogOpacity - FOG_SHELTER_MIN_OPACITY, 0.01);
    const fogStrength = Math.min(
        Math.max((fogOpacity - FOG_SHELTER_MIN_OPACITY) / opacityRange, 0),
        1
    );

    const clearRadiusRatio =
        FOG_CLEAR_RADIUS_RATIO_WHEN_LIGHT -
        (FOG_CLEAR_RADIUS_RATIO_WHEN_LIGHT - FOG_CLEAR_RADIUS_RATIO_WHEN_DENSE) * fogStrength;

    const centerX = width / 2;
    const centerY = height / 2;
    const clearRadius = Math.min(width, height) * clearRadiusRatio;
    const distance = Math.hypot(x - centerX, y - centerY);

    return distance > clearRadius;
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
        
        // 🔥 确保失败界面被完全隐藏
        if (window.uiManager) {
            if (window.uiManager.gameOverScreen) {
                window.uiManager.gameOverScreen.classList.add('hidden');
                window.uiManager.gameOverScreen.classList.remove('visible');
                window.uiManager.gameOverScreen.style.display = 'none';
            }
            window.uiManager.hideAllModals();
        }
        
        // 触发返回地图事件
        window.dispatchEvent(new CustomEvent('backToMapRequested'));
    });
}

/**
 * ⏸️ 初始化暂停按钮事件（任务 1）
 * @param {HTMLElement} pauseBtn - 暂停按钮元素
 * @param {Object|null} sceneManager - 场景管理器（可选，暂时未使用）
 */
export function initPauseButton(pauseBtn, sceneManager = null) {
    if (!pauseBtn) return;

    pauseBtn.addEventListener('click', () => {
        console.log('[GAME] 点击暂停按钮');
        
        // 设置暂停状态
        if (gameManager) {
            gameManager.isPaused = true;
            console.log('[GAME] 游戏已暂停');
        }
        
        // 显示暂停菜单
        if (uiManager && uiManager.showPauseMenu) {
            uiManager.showPauseMenu();
        }
    });
}

/**
 * ▶️ 初始化继续游戏按钮事件（任务 1）
 */
export function initResumeButton(resumeBtn) {
    if (!resumeBtn) {
        console.warn('[INPUT] 继续游戏按钮未找到！');
        return;
    }
    
    console.log('[INPUT] ✅ 继续游戏按钮初始化:', resumeBtn.id);

    resumeBtn.addEventListener('click', () => {
        console.log('[GAME] 点击继续游戏按钮');
        
        // 恢复游戏状态
        if (gameManager) {
            gameManager.isPaused = false;
            console.log('[GAME] 游戏已恢复');
        }
        
        // 隐藏暂停菜单
        if (uiManager && uiManager.hidePauseMenu) {
            uiManager.hidePauseMenu();
        }
    });
}

/**
 * 🗺️ 初始化暂停菜单中的返回地图按钮（任务 1）
 * @param {HTMLElement} pauseBackBtn - 返回地图按钮元素
 * @param {Object|null} sceneManager - 场景管理器（可选）
 */
export function initPauseBackToMapButton(pauseBackBtn, sceneManager = null) {
    if (!pauseBackBtn) {
        console.warn('[INPUT] 返回地图按钮未找到！');
        return;
    }
    
    console.log('[INPUT] ✅ 返回地图按钮初始化:', pauseBackBtn.id);

    pauseBackBtn.addEventListener('click', () => {
        // 🔥 关键修复：只有在暂停状态下才允许返回地图
        if (!gameManager || !gameManager.isPaused) {
            console.warn('[INPUT] ⚠️ 游戏未暂停，拒绝返回地图！');
            return;
        }
        
        console.log('[GAME] 从暂停菜单返回地图');
        
        // 隐藏暂停菜单
        if (uiManager && uiManager.hidePauseMenu) {
            uiManager.hidePauseMenu();
        }
        
        // 清理游戏状态
        if (gameManager) {
            gameManager.isPaused = false;
            gameManager.endGame();
        }
        
        // 清理场景（如果sceneManager可用）
        if (sceneManager && sceneManager.clearViruses) {
            sceneManager.clearViruses();
        }
        
        // 触发返回地图事件
        window.dispatchEvent(new CustomEvent('backToMapRequested'));
    });
}

/**
 * 🍦 Level 21：处理鼠标移动（香草视野手电筒）
 */
function handleMouseMove(e, canvas) {
    if (!window.vanillaVeilSystem) return;
    
    const rect = canvas.getBoundingClientRect();
    
    // 兼容鼠标和触摸事件
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    
    // 更新手电筒位置
    window.vanillaVeilSystem.updateMousePosition(mouseX, mouseY);
}

export const inputHandler = {
    initMouseHandler,
    initSkillButton,
    initNextLevelButton,
    initGameOverButton,
    initPauseButton,
    initResumeButton,
    initPauseBackToMapButton
};
