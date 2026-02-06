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

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextLevelBtn = document.getElementById('next-level-btn');
// startBtn 现在在 init() 内部获取，确保 DOM 已加载

// 游戏常量
const SAFE_ZONE_SIZE = 120;

let viruses = [];
let lastTime = 0;

// 冰冻技能冷却
let freezeCooldown = 0;
const FREEZE_COOLDOWN_MAX = 45;

// 教程系统
let tutorialVirus = null;

// 启动游戏：从地图进入战斗
export function startGame(levelId) {
    console.log('[GAME] startGame 被调用, levelId =', levelId);
    
    // 确保Canvas可见并且尺寸正确
    resizeCanvas();
    console.log('[GAME] Canvas尺寸:', canvas.width, 'x', canvas.height);
    
    // levelId 是 1-indexed，需要转换为 0-indexed
    const levelIndex = levelId - 1;
    console.log('[GAME] 加载关卡索引:', levelIndex);
    
    loadLevel(levelIndex);
    // 注意：不在这里调用 loop，因为 loadLevel 内部会处理游戏启动
    // 如果有 intro，会在关闭弹窗后启动；如果没有 intro，会在 loadLevel 结束时启动
}

// 加载指定关卡
function loadLevel(index) {
    console.log('[GAME] loadLevel 开始, index =', index);
    const level = gameManager.loadLevel(index, viruses, effectsManager.particles);
    if (!level) {
        console.error('[GAME] loadLevel 失败：关卡不存在');
        return;
    }
    console.log('[GAME] 关卡加载成功:', level.id);
    
    // 🔥 根据当前关卡重置技能可用性（防止 localStorage 中的旧数据干扰）
    // 规则：
    // - Lv1-3：无技能
    // - Lv4+：有冰冻
    // - Lv5+：有冰冻 + 闪电
    console.log('[GAME] 根据关卡 ID 更新技能可用性...');
    const currentLevelId = level.id;
    if (currentLevelId <= 3) {
        // Lv1-3 没有技能，清除已解锁的技能
        skillManager.reset();
        console.log('[GAME] Lv1-3 阶段，无技能可用');
    } else if (currentLevelId === 4) {
        // Lv4 只有冰冻
        skillManager.reset();
        skillManager.unlock('freeze');
        console.log('[GAME] Lv4 阶段，已解锁冰冻');
    } else if (currentLevelId >= 5) {
        // Lv5+ 有冰冻 + 闪电
        skillManager.reset();
        skillManager.unlock('freeze');
        skillManager.unlock('lightning');
        console.log('[GAME] Lv5+ 阶段，已解锁冰冻 + 闪电');
    }
    
    // 清空粒子
    effectsManager.clearParticles();
    
    // 更新UI显示
    uiManager.hideAllModals();
    uiManager.updateLevelDisplay(gameManager.getCurrentLevelIndex(), gameManager.getTotalLevels());
    uiManager.updateSkillUI(tutorialManager.isActive(), gameManager.getCurrentLevelIndex(), skillManager);
    
    // 清空进度条
    uiManager.updateProgressBars(0, gameManager.getLevelGoal(), 0, gameManager.getInfectionThreshold());
    
    // 开局直接生成初始病毒
    const initialCount = CONFIG.INITIAL_SPAWN_COUNT || 3;
    console.log('[GAME] 准备生成', initialCount, '个初始病毒');
    
    // 特殊处理：第一关生成教程病毒（固定位置，基于画布相对坐标）
    if (gameManager.getCurrentLevelIndex() === 0) {
        // 使用相对坐标：62% 宽度，42% 高度（避免被弹窗遮挡，且居中偏右）
        const tutorialX = canvas.width * 0.62;
        const tutorialY = canvas.height * 0.42;
        
        spawnVirus(gameManager.getAvailableTypes()[0], tutorialX, tutorialY);
        
        // 保存教程病毒引用并设置特殊属性
        if (viruses.length > 0) {
            tutorialVirus = viruses[viruses.length - 1];
            tutorialVirus.vx = 0;
            tutorialVirus.vy = 0;
            tutorialVirus.isTutorial = true;  // 标记为教程病毒
            tutorialVirus.tutorialLock = true;  // 教程锁定，永不删除
            tutorialVirus.splitBaseTime = tutorialVirus.maxSplitTime; // 保存原始分裂时间
            tutorialVirus.nearSplitFlash = 0; // 临界闪烁计时器
            
            console.log('[GAME] 创建教程病毒:', {
                isTutorial: tutorialVirus.isTutorial,
                tutorialLock: tutorialVirus.tutorialLock,
                type: tutorialVirus.type,
                x: tutorialVirus.x.toFixed(1),
                y: tutorialVirus.y.toFixed(1)
            });
            
            // 设置到教程管理器
            tutorialManager.setTutorialVirus(tutorialVirus);
        }
        
        tutorialManager.activate();
    } else {
        // 其他关卡正常生成
        for (let i = 0; i < initialCount; i++) {
            const types = gameManager.getAvailableTypes();
            spawnVirus(types[Math.floor(Math.random() * types.length)]);
        }
    }
    
    // 暂停游戏以显示可能的弹窗
    gameManager.endGame();
    
    // 检查是否有技能教学（关卡开始前）
    if (level.skillIntro) {
        modals.showSkillUnlockModal(level.skillIntro, () => {
            // 技能教学关闭后，检查是否有新病毒介绍
            if (level.intro) {
                modals.showIntroModal(level.intro, () => {
                    // 弹窗关闭后恢复游戏状态并启动游戏
                    gameManager.gameState = GAME_STATE.PLAYING;
                    tutorialManager.checkTutorial(gameManager.getCurrentLevelIndex());
                    requestAnimationFrame(loop);
                });
            } else {
                // 没有病毒介绍，直接开始游戏
                gameManager.gameState = GAME_STATE.PLAYING;
                tutorialManager.checkTutorial(gameManager.getCurrentLevelIndex());
                requestAnimationFrame(loop);
            }
        });
        return;
    }
    
    // 检查是否有新病毒介绍
    if (level.intro) {
        modals.showIntroModal(level.intro, () => {
            // 弹窗关闭后恢复游戏状态
            gameManager.gameState = GAME_STATE.PLAYING;
            tutorialManager.checkTutorial(gameManager.getCurrentLevelIndex());
            // 确保游戏循环重新启动，不管lastTime的值
            requestAnimationFrame(loop);
        });
        return;  // 不立即开始游戏，等待玩家点击介绍弹窗的开始按钮
    }
    
    // 如果没有任何弹窗，直接检查教程并启动游戏
    console.log('[GAME] 没有弹窗，直接启动游戏');
    console.log('[GAME] 病毒数量:', viruses.length);
    gameManager.gameState = GAME_STATE.PLAYING;
    tutorialManager.checkTutorial(gameManager.getCurrentLevelIndex());
    console.log('[GAME] 启动游戏循环 (requestAnimationFrame)');
    requestAnimationFrame(loop);
}

export function init() {
    console.log('[INIT] init() called');
    console.log('[INIT] Canvas element:', canvas);
    console.log('[INIT] Canvas context:', ctx);
    console.log('[INIT] Canvas初始尺寸:', canvas ? `${canvas.width}x${canvas.height}` : 'Canvas不存在');
    
    // 🔥 在 init 内部获取按钮，确保 DOM 已加载
    const startBtn = document.getElementById('start-btn');
    console.log('[INIT] 开始按钮:', startBtn);
    
    // 检查关键元素是否存在
    if (!canvas || !uiManager.startScreen || !startBtn) {
        console.error('关键游戏元素未找到！请检查 HTML 结构');
        console.error({
            canvas: !!canvas,
            startScreen: !!uiManager.startScreen,
            startBtn: !!startBtn
        });
        return;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 加载游戏进度
    gameManager.loadPlayerProgress();
    
    // 初始化时显示开始屏幕
    uiManager.showStartScreen();
    
    // 🔥 绑定开始按钮点击事件（关键！）
    console.log('[INIT] 正在绑定开始按钮事件...');
    console.log('[INIT] 按钮元素:', startBtn);
    console.log('[INIT] 按钮 disabled 状态:', startBtn.disabled);
    console.log('[INIT] 按钮 style:', startBtn.style.cssText);
    
    startBtn.addEventListener('click', (e) => {
        console.log('[GAME] 🎯 点击"开始实验"按钮 - 事件触发成功！');
        console.log('[GAME] 事件对象:', e);
        
        // 隐藏开始屏幕
        uiManager.hideStartScreen();
        
        // 🎬 启动开场动画
        console.log('[GAME] 启动开场动画...');
        const opening = new OpeningScene(() => {
            console.log('[GAME] 开场动画完成，触发 startButtonClicked 事件');
            // 动画结束后才触发事件，让 index.html 初始化 SceneManager
            window.dispatchEvent(new CustomEvent('startButtonClicked'));
        });
        
        // 开始播放动画
        if (opening.initialized) {
            opening.start();
        } else {
            console.error('[GAME] 开场动画初始化失败，直接跳到地图');
            // 如果动画初始化失败，直接触发事件
            window.dispatchEvent(new CustomEvent('startButtonClicked'));
        }
    }, true); // 使用捕获阶段
    
    // 额外添加一个测试用的全局点击函数
    window.testStartButton = () => {
        console.log('[TEST] 手动触发按钮点击');
        startBtn.click();
    };
    
    console.log('[INIT] ✅ 开始按钮事件绑定完成');
    console.log('[INIT] 提示：如果按钮点不动，在 Console 输入 testStartButton() 测试');
    
    // Canvas 地图由 SceneManager 的 MapRenderer 管理
    // HTML 节点地图点击已废弃，改用 MapRenderer 的 Canvas 点击检测
    // 下方代码已删除：document.querySelectorAll('.level-node')...
    
    // 冰冻技能按钮点击事件
    if (uiManager.activeSkillBtn) {
        uiManager.activeSkillBtn.addEventListener('click', () => {
            if (gameManager.getGameState() !== GAME_STATE.PLAYING) return;
            if (freezeCooldown > 0) return; // 冷却中
            
            const success = skillManager.triggerFreeze();
            if (success) {
                // 开始冷却计时
                freezeCooldown = FREEZE_COOLDOWN_MAX;
                uiManager.activeSkillBtn.classList.add('cooldown');
            }
        });
    }

    // 失败弹窗"返回地图"按钮事件
    const gameOverBackBtn = document.getElementById('game-over-back-btn');
    if (gameOverBackBtn) {
        gameOverBackBtn.addEventListener('click', () => {
            console.log('[GAME] 点击"返回地图"按钮');
            uiManager.hideAllModals();
            // 触发返回地图事件
            window.dispatchEvent(new CustomEvent('backToMapRequested'));
        });
    }

    // 监听教程结束事件
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
        tutorialVirus = null;
        gameManager.gameState = GAME_STATE.PLAYING;
        console.log('[GAME] 游戏状态恢复为 PLAYING (值应该是 0)');
        
        // 🔥 核心修复：教程结束后生成真正的病毒开始游戏！
        const currentLevel = LEVELS[gameManager.getCurrentLevelIndex() - 1];
        const initialCount = currentLevel ? currentLevel.initialCount : 3;
        console.log(`[GAME] 教程结束，生成 ${initialCount} 个初始病毒`);
        
        for (let i = 0; i < initialCount; i++) {
            const types = gameManager.getAvailableTypes();
            spawnVirus(types[Math.floor(Math.random() * types.length)]);
        }
        
        uiManager.updateSkillUI(false, gameManager.getCurrentLevelIndex(), skillManager);
    });
}

// 更新技能UI显示
function updateSkillUI() {
    uiManager.updateSkillUI(tutorialManager.isActive(), gameManager.getCurrentLevelIndex(), skillManager);
}

// 更新连击显示
function updateComboDisplay() {
    uiManager.updateComboDisplay(skillManager.getCombo());
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.75;
    
    // 如果教程正在进行，重新定位气泡
    tutorialManager.handleResize();
}

function spawnVirus(type, x, y) {
    // 如果没指定类型，从当前关卡的可用类型中随机选择
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
            // 防止死循环（虽然概率极低）
            if (attempts > 100) break;
        } while (x > safeLeft - virusRadius && y > safeTop - virusRadius);
    }
    viruses.push(new Virus(x, y, type));
}

function ensureTutorialVirusInList() {
    if (tutorialManager.isActive() && tutorialVirus && !viruses.includes(tutorialVirus)) {
        viruses.push(tutorialVirus);
    }
}

let loopCounter = 0; // 游戏循环计数器
function loop(timestamp) {
    loopCounter++;
    if (loopCounter === 1 || loopCounter % 60 === 0) {
        console.log('[LOOP] 游戏循环运行中, 第', loopCounter, '帧');
        console.log('[LOOP] Canvas尺寸:', canvas.width, 'x', canvas.height);
        console.log('[LOOP] 病毒数:', viruses.length);
        console.log('[LOOP] 游戏状态:', gameManager.getGameState());
        console.log('[LOOP] ctx对象:', ctx);
    }
    
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    effectsManager.drawBackground(ctx, canvas.width, canvas.height);

    ensureTutorialVirusInList();
    
    // 教程模式：绘制高亮圈指示教程病毒
    if (tutorialManager.isActive() && tutorialVirus) {
        effectsManager.drawTutorialHighlight(ctx, tutorialVirus);
    }

    // === 状态机分支 ===
    if (gameManager.getGameState() === GAME_STATE.PLAYING) {
        // 更新游戏时间和生成计时器
        const shouldSpawn = gameManager.updateGameTime(dt);
        
        // 更新冷却计时
        if (freezeCooldown > 0) {
            freezeCooldown -= dt / 1000; // 转换为秒
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
                        v.nearSplitFlash = 300; // 300ms 闪烁
                        // 重置倒计时，继续循环
                        v.splitTimer = v.splitBaseTime || v.maxSplitTime;
                        // 只在教程激活时创建提示效果
                        if (tutorialManager.isActive()) {
                            effectsManager.createTutorialSplitWarning(v.x, v.y);
                        }
                    }
                }
                v.draw(ctx);
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
            
            v.draw(ctx);
        }
        viruses.push(...newBabies);

        // 绘制闪电特效
        skillManager.drawLightning(ctx);

        // 更新进度条
        uiManager.updateProgressBars(
            gameManager.getCuredCount(), 
            gameManager.getLevelGoal(), 
            viruses.length, 
            gameManager.getInfectionThreshold()
        );

        // 检查胜负条件
        const result = gameManager.checkWinConditions(viruses.length);
        if (result === 'win') {
            // 进入胜利动画阶段 - 已在gameManager中处理
        } else if (result === 'lose') {
            triggerGameOver();
            return;
        }
    } 
    else if (gameManager.getGameState() === GAME_STATE.WINNING) {
        // === 胜利光波动画 ===
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
    else {
        // 🔥 GAME_STATE.LEVEL_OVER 或其他状态
        // 核心修复：教程期间虽然暂停，但必须绘制病毒背景
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

// 关卡完成（暂停游戏，显示完成弹窗）
function triggerLevelComplete() {
    gameManager.endGame();
    // 直接显示关卡完成弹窗，不管奖励
    uiManager.showLevelComplete();
}

function triggerGameOver() {
    gameManager.endGame();
    uiManager.showGameOver();
    // 触发关卡失败事件，通知 SceneManager
    if (window.sceneManager) {
        const currentLevel = gameManager.getCurrentLevel();
        const event = new CustomEvent('levelFailed', { detail: { levelId: currentLevel?.id || 1 } });
        window.dispatchEvent(event);
    }
}

function triggerGameWin() {
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

canvas.addEventListener('mousedown', (e) => {
    // 教程期间只允许点击教程病毒
    if (tutorialManager.isActive()) {
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
});

// "前往下一关"按钮事件处理
nextLevelBtn.addEventListener('click', () => {
    const currentLevel = gameManager.getCurrentLevel();
    const nextLevel = gameManager.getNextLevel();
    
    uiManager.hideLevelComplete();
    
    // 检查当前关是否有奖励，如果有则根据下一关情况决定是否显示弹窗
    if (currentLevel && currentLevel.reward) {
        skillManager.unlock(currentLevel.reward);
        
        // 如果下一关有 skillIntro（技能教学），就不显示奖励弹窗，让 skillIntro 来展示
        if (nextLevel && nextLevel.skillIntro === currentLevel.reward) {
            // 悄悄解锁，不显示弹窗，直接进入下一关
            proceedToNextLevel();
        } else {
            // 否则显示奖励弹窗
            modals.showSkillUnlockModal(currentLevel.reward, () => {
                // 奖励弹窗关闭后，加载下一关
                proceedToNextLevel();
            });
        }
    } else {
        // 没有奖励，直接加载下一关
        proceedToNextLevel();
    }
});

// 加载下一关的辅助函数
function proceedToNextLevel() {
    if (gameManager.nextLevel()) {
        // 有下一关，加载下一关
        loadLevel(gameManager.getCurrentLevelIndex());
        requestAnimationFrame(loop);
    } else {
        // 最后一关已完成，游戏胜利
        triggerGameWin();
    }
}

// 添加窗口 resize 时重新定位教程气泡的处理
window.addEventListener('resize', () => {
    tutorialManager.handleResize();
});

// 将关键对象暴露到全局作用域以便控制台调试
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
window.loadLevel = loadLevel;

// 不在这里调用 init()，由 index.html 的 SceneManager 初始化后调用
// init() 会由外部调用


