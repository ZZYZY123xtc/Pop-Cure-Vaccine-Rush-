/**
 * 游戏状态管理器 - 处理关卡、进度保存、状态管理
 */
import { CONFIG } from './config.js';
import { getLevel, hasNextLevel, getTotalLevels, getNextLevel, LEVELS } from '../data/levels.js';
import { skillManager } from '../data/skills.js';
import { toastTips } from '../ui/toast-tips.js';
import { audioManager } from '../managers/audio-manager.js';

export const GAME_STATE = {
    PLAYING: 0,
    WINNING: 1,  // 胜利动画阶段
    LEVEL_OVER: 2
};

export class GameManager {
    constructor() {
        // 🔊 音频系统初始化（单例）
        audioManager.init({
            bgm_map: './audio/Neon_Bloom_of_the_Celestial_Bloom.mp3',
            bgm_battle: './audio/Pastel_Reverie.mp3'
        });

        this.currentLevelIndex = 0;
        this.curedCount = 0;
        this.gameTime = 0;
        this._gameState = GAME_STATE.PLAYING;
        this.spawnTimer = 0;
        this.isGameActive = false; // 🎯 用于控制游戏循环是否运行
        this.isPaused = false; // ⏸️ 暂停状态：停止update但继续 draw
        
        // 关卡相关
        this.levelGoal = 0;
        this.infectionThreshold = 0;
        this.availableTypes = ['A'];
        this.currentSpawnInterval = CONFIG.SPAWN_INTERVAL;
        
        // 胜利光波
        this.vaccineRadius = 0;
        this.VACCINE_SPEED = 15;
        
        // 关卡完成状态
        this.isLevelComplete = false;
        
        // 🌬️ 风力系统（第6关专用）
        this.windForceX = 0;           // 当前风力（正数向右，负数向左）
        this.windDuration = 0;         // 当前吹风剩余时间
        this.windCooldown = 0;         // 停风剩余时间
        this.hasWind = false;          // 当前关卡是否有风
        this.windConfig = null;        // 当前风力配置
        this.hasShownWindTutorial = false; // 🎓 是否已显示过风力教程（整场游戏只显示一次）

        // 🍦 Level 25 运行态（用于显式重置）
        this.finalBossRuntime = {
            immuneLoad: 0,
            bossHp: 0,
            creamBalls: [],
            isGameOver: false
        };
    }

    resetLevelState(levelId) {
        if (levelId === 24) {
            this.finalBossRuntime.immuneLoad = 0;
            this.finalBossRuntime.bossHp = 0;
            this.finalBossRuntime.creamBalls = [];
            this.finalBossRuntime.isGameOver = false;

            // 同步通知运行时系统重置最终Boss状态
            if (typeof window.resetFinalBossRuntimeState === 'function') {
                window.resetFinalBossRuntimeState();
            }
        }
    }


    // 添加这两个方法，用来抓谁改了状态
    get gameState() {
        return this._gameState;
    }

    set gameState(newValue) {
        console.log(`🚨 状态发生改变! 从 ${this._gameState} 变为 ${newValue}`);
        
        if (newValue === GAME_STATE.WINNING) { // 如果变成了胜利状态
            console.error("🔥 抓到了！是谁把游戏设为胜利的？请看下方的调用栈 (Stack Trace) 👇");
            console.trace(); // 👈 这行代码会直接打印出是哪个文件、哪一行代码触发的胜利
        }
        
        this._gameState = newValue;
    }
    // 加载游戏进度
    loadPlayerProgress() {
        const saved = localStorage.getItem('playerProgress');
        if (saved) {
            const progress = JSON.parse(saved);
            this.currentLevelIndex = progress.currentLevel || 0;
        }
    }

    // 保存游戏进度 (🚫 已禁用)
    savePlayerProgress() {
        // 🚫 禁用进度保存：每次刷新都从第一关开始
        // const saved = localStorage.getItem('playerProgress');
        // let unlockedLevel = 0;
        // if (saved) {
        //     const progress = JSON.parse(saved);
        //     unlockedLevel = progress.unlockedLevel || 0;
        // }
        // 
        // // 更新已解锁的最高关卡
        // unlockedLevel = Math.max(unlockedLevel, this.currentLevelIndex);
        // 
        // localStorage.setItem('playerProgress', JSON.stringify({
        //     currentLevel: this.currentLevelIndex,
        //     unlockedLevel: unlockedLevel,
        //     timestamp: Date.now()
        // }));
    }

    // 获取已解锁的最高关卡
    getUnlockedLevel() {
        const saved = localStorage.getItem('playerProgress');
        if (saved) {
            const progress = JSON.parse(saved);
            return progress.unlockedLevel || 0;
        }
        return 0;
    }

    // 🚀 启动关卡 - 外部调用的主要入口（修复技能弹窗Bug）
    startLevel(levelId, uiManager, sceneManager) {
        console.log('[GameManager] 启动关卡:', levelId);

        // 🔊 进入任意战斗关卡统一切换战斗BGM
        audioManager.playBGM('bgm_battle', { fadeIn: 0.5, fadeOut: 0.5 });

        // 🍦 重中之重：第25关入口显式重置关卡状态
        this.resetLevelState(levelId);
        
        // 🔥 关键修复：强制关闭教程状态（除了第一关）
        if (levelId > 0 && window.tutorialManager) {
            window.tutorialManager.tutorialActive = false;
            console.log('[GameManager] ✅ 已强制关闭教程状态（非第一关）');
        }
        
        // 1. 🔥 强制重置所有状态 (Critical Reset - 修复Bug: 失败后重新进入依然是失败状态)
        this.gameState = GAME_STATE.PLAYING; // 强制设为游戏中状态
        this.curedCount = 0; // 必须归零
        this.isLevelComplete = false; // 重置关卡完成状态
        this.vaccineRadius = 0; // 重置胜利光波
        this.gameTime = 0; // 重置游戏时间
        this.isGameActive = false; // ⚠️ 关键：默认暂停，直到 UI 允许开始
        this.isPaused = false; // 重置暂停状态
        this.spawnTimer = 2000; // 给予初始缓冲时间
        
        // 重置风力系统状态
        this.windForceX = 0;
        this.windDuration = 0;
        this.windCooldown = 0;
        
        // 2. 清理场景
        if (sceneManager && sceneManager.clearViruses) {
            sceneManager.clearViruses();
        }
        
        // 3. 加载数据
        const level = this.loadLevel(levelId, 
            sceneManager ? sceneManager.viruses : [], 
            sceneManager ? sceneManager.particles : []);
        
        // 4. 更新关卡显示
        if (uiManager && uiManager.updateLevelDisplay) {
            const totalLevels = this.getTotalLevels();
            uiManager.updateLevelDisplay(levelId, totalLevels);
            console.log('[GameManager] ✅ 关卡显示已更新:', levelId + 1, '/', totalLevels);
        }
        
        // 🎮 动态更新关卡标题（任务 3）
        if (uiManager && uiManager.updateGameTitle && level) {
            uiManager.updateGameTitle(level);
        }
        
        if (!level) {
            console.error('[GameManager] 关卡加载失败:', levelId);
            return false;
        }
        
        // 🎬 显示关卡介绍（Level 11+ 第三章起）
        // levelId 是数组索引（Level 11的索引是10）
        if (levelId >= 10 && level.description && window.toastTips && !level.isFinalBoss) {
            // 延迟1秒显示，避免与开场动画冲突
            setTimeout(() => {
                const chapterNames = ['鼻腔防线', '咽喉重地', '支气管深渊', '血液狂飙', '淋巴圣域'];
                const chapterName = level.chapter && level.chapter <= 5 ? chapterNames[level.chapter - 1] : '未知章节';
                window.toastTips.show(
                    `🎮 第${levelId + 1}关 - ${chapterName}`,
                    level.description,
                    '🎮',
                    6000 // 显示6秒
                );
                console.log('[GameManager] ✅ 关卡介绍已显示:', level.description);
            }, 1000);
        } else if (levelId >= 10 && !level.isFinalBoss) {
            console.warn('[GameManager] ⚠️ 关卡介绍未显示:', 
                        'levelId:', levelId, 
                        'hasDescription:', !!level.description,
                        'hasToastTips:', !!window.toastTips);
        }

        // 🎯 处理有 intro 的关卡（显示新病毒图鉴）
        if (level.intro) {
            console.log(`[GameManager] 第${levelId + 1}关：显示病毒图鉴 (Type ${level.intro})`);
            
            // 🌸 第一关：完整教程流程（图鉴 + 教程气泡 + 点击引导）
            if (levelId === 0) {
                console.log('[GameManager] 第一关：初始化完整教程系统');
                
                // 生成教程病毒
                if (sceneManager && sceneManager.spawnVirus && sceneManager.canvas) {
                    const canvas = sceneManager.canvas;
                    // ✅ 使用逻辑尺寸（CSS 尺寸），而不是物理像素
                    const rect = canvas.getBoundingClientRect();
                    const dpr = window.devicePixelRatio || 1;
                    const logicalWidth = rect.width || canvas.width / dpr;
                    const logicalHeight = rect.height || canvas.height / dpr;
                    
                    const tutorialX = logicalWidth * 0.62;
                    const tutorialY = logicalHeight * 0.42;
                    
                    sceneManager.spawnVirus(this.availableTypes[0], tutorialX, tutorialY);
                    console.log('[GameManager] 教程病毒已生成，坐标:', tutorialX, tutorialY);
                }
                
                // 暂停游戏以显示病毒图鉴
                this.endGame();
                
                // 显示病毒图鉴弹窗
                if (uiManager && uiManager.showIntroModal) {
                    uiManager.showIntroModal(level.intro, () => {
                        console.log('[GameManager] 病毒图鉴已关闭，准备启动教程');
                        
                        // 激活教程管理器
                        if (window.tutorialManager) {
                            // 设置教程病毒
                            const viruses = sceneManager ? sceneManager.viruses : [];
                            if (viruses.length > 0) {
                                const tutorialVirus = viruses[viruses.length - 1];
                                tutorialVirus.vx = 0;
                                tutorialVirus.vy = 0;
                                tutorialVirus.isTutorial = true;
                                tutorialVirus.tutorialLock = true;
                                tutorialVirus.splitBaseTime = tutorialVirus.maxSplitTime;
                                tutorialVirus.nearSplitFlash = 0;
                                
                                window.tutorialManager.setTutorialVirus(tutorialVirus);
                                window.tutorialManager.activate();
                                console.log('[GameManager] 教程病毒已设置，教程已激活');
                            }
                            
                            // 显示教程气泡（会在内部设置游戏状态）
                            window.tutorialManager.checkTutorial(this.currentLevelIndex);
                        }
                    });
                }
                
                return true;
            }
            // 🌸 其他关卡：只显示图鉴，然后直接开始游戏
            else {
                console.log('[GameManager] 其他关卡：只显示病毒图鉴，无教程引导');
                
                // 暂停游戏以显示图鉴
                this.endGame();
                
                // 显示病毒图鉴弹窗
                if (uiManager && uiManager.showIntroModal) {
                    uiManager.showIntroModal(level.intro, () => {
                        console.log(`[GameManager] Type ${level.intro} 图鉴已关闭，开始游戏`);
                        
                        // 🔥 更新技能UI（显示已解锁的技能）
                        if (uiManager && uiManager.updateSkillUI) {
                            uiManager.updateSkillUI(false, this.currentLevelIndex, skillManager);
                            console.log('[GameManager] ✅ 技能UI已更新');
                        }
                        
                        // 图鉴关闭后直接激活游戏
                        this.isGameActive = true;
                        this.gameState = GAME_STATE.PLAYING;
                        
                        // 🔥 关键修复：重置生成计时器为负值，立即触发第一次生成
                        this.spawnTimer = -100;
                        
                        // 🧪 显示特殊关卡提示（延迟1秒显示，仅Level 6-10）
                        setTimeout(() => {
                            const currentLevel = this.currentLevel;
                            // Level 11+ 已经有统一的关卡介绍，不需要单独的特殊提示
                            if (this.currentLevelIndex >= 10) return;
                            
                            if (currentLevel?.hasMucusPits) {
                                toastTips.showMucusPitTip();
                            } else if (currentLevel?.isNightMode) {
                                toastTips.showNightModeTip();
                            } else if (currentLevel?.hasVortex) {
                                toastTips.showVortexTip();
                            } else if (currentLevel?.isBossLevel && !currentLevel?.isTaroBoss) {
                                // 只显示Level 10的普通Boss提示
                                toastTips.showBossTip();
                            }
                        }, 1000);
                        
                        console.log('[GameManager] ✅ 游戏已激活！');
                        console.log('[GameManager] - gameState:', this.gameState);
                        console.log('[GameManager] - isGameActive:', this.isGameActive);
                        console.log('[GameManager] - spawnTimer:', this.spawnTimer);
                        console.log('[GameManager] - availableTypes:', this.availableTypes);
                        console.log('[GameManager] - spawnInterval:', this.currentSpawnInterval);
                    });
                } else {
                    console.warn('[GameManager] 缺少 uiManager，直接激活游戏');
                    this.isGameActive = true;
                    this.spawnTimer = -100; // 立即生成
                }
                
                return true;
            }
        }

        // 4. 🎁 流程分叉：有技能 vs 无技能
        if (level.unlockSkill || level.skillIntro || level.reward) {
            console.log('[GameManager] 检测到技能解锁:', level.unlockSkill || level.skillIntro || level.reward);
            
            // 情况 A: 有技能 -> 显示弹窗 -> 等待回调 -> 开始游戏
            if (uiManager && uiManager.showSkillUnlockModal) {
                const skillType = level.unlockSkill || level.skillIntro || level.reward;
                console.log('[GameManager] 准备显示技能解锁弹窗:', skillType);
                uiManager.showSkillUnlockModal(skillType, () => {
                    console.log('[GameManager] 技能弹窗已关闭，激活游戏');
                    
                    // 🎁 解锁技能（保存到 localStorage）
                    skillManager.unlock(skillType);
                    console.log('[GameManager] ✨ 技能已解锁:', skillType);
                    
                    // 🔥 更新技能UI显示（关键！）
                    if (uiManager && uiManager.updateSkillUI) {
                        uiManager.updateSkillUI(false, this.currentLevelIndex, skillManager);
                        console.log('[GameManager] ✅ 技能UI已更新');
                    }
                    
                    // 🔥 完整激活游戏（与图鉴关闭后保持一致）
                    this.isGameActive = true;
                    this.gameState = GAME_STATE.PLAYING;
                    this.spawnTimer = -100; // 立即触发第一次生成
                    
                    // 🧪 显示特殊关卡提示（延迟1秒显示，仅Level 6-10）
                    setTimeout(() => {
                        const currentLevel = this.currentLevel;
                        // Level 11+ 已经有统一的关卡介绍，不需要单独的特殊提示
                        if (this.currentLevelIndex >= 10) return;
                        
                        if (currentLevel?.hasMucusPits) {
                            toastTips.showMucusPitTip();
                        } else if (currentLevel?.isNightMode) {
                            toastTips.showNightModeTip();
                        } else if (currentLevel?.hasVortex) {
                            toastTips.showVortexTip();
                        } else if (currentLevel?.isBossLevel && !currentLevel?.isTaroBoss) {
                            // 只显示Level 10的普通Boss提示
                            toastTips.showBossTip();
                        }
                    }, 1000);
                    
                    console.log('[GameManager] ✅ 游戏已激活！');
                    console.log('- gameState:', this.gameState);
                    console.log('- isGameActive:', this.isGameActive);
                    console.log('- spawnTimer:', this.spawnTimer);
                    console.log('- availableTypes:', this.availableTypes);
                });
            } else {
                console.warn('[GameManager] 缺少 showSkillUnlockModal 方法，直接激活游戏');
                this.isGameActive = true;
                this.spawnTimer = -100;
            }
        } else {
            // 情况 B: 无技能 -> 直接开始
            console.log('[GameManager] 无技能，直接激活游戏');

            // 🍦 Level 25：先弹确认说明，确认后才开始
            if (level.isFinalBoss) {
                this.pauseGame();
                this.gameState = GAME_STATE.LEVEL_OVER;

                setTimeout(() => {
                    if (uiManager && uiManager.showFinalBossBriefing) {
                        uiManager.showFinalBossBriefing(() => {
                            if (uiManager && uiManager.updateSkillUI) {
                                uiManager.updateSkillUI(false, this.currentLevelIndex, skillManager);
                            }

                            this.activateGame();
                            this.gameState = GAME_STATE.PLAYING;
                            this.spawnTimer = -100;
                            console.log('[GameManager] ✅ Level 25 已确认说明，游戏开始');
                        });
                    } else {
                        // 兜底：无UI方法时直接开始
                        if (uiManager && uiManager.updateSkillUI) {
                            uiManager.updateSkillUI(false, this.currentLevelIndex, skillManager);
                        }
                        this.activateGame();
                        this.gameState = GAME_STATE.PLAYING;
                        this.spawnTimer = -100;
                    }
                }, 300);

                return true;
            }
            
            // 更新技能UI（即使没有新技能，也要刷新UI以显示已解锁的技能）
            if (uiManager && uiManager.updateSkillUI) {
                uiManager.updateSkillUI(false, this.currentLevelIndex, skillManager);
                console.log('[GameManager] ✅ 技能UI已更新（无新技能解锁）');
            }
            
            this.isGameActive = true;
            this.spawnTimer = -100; // 立即生成
            
            // 🧪 显示特殊关卡提示（延迟1秒显示，仅Level 6-10）
            setTimeout(() => {
                const currentLevel = this.currentLevel;
                // Level 11+ 已经有统一的关卡介绍，不需要单独的特殊提示
                if (this.currentLevelIndex >= 10) return;
                
                if (currentLevel?.hasMucusPits) {
                    toastTips.showMucusPitTip();
                } else if (currentLevel?.isNightMode) {
                    toastTips.showNightModeTip();
                } else if (currentLevel?.hasVortex) {
                    toastTips.showVortexTip();
                } else if (currentLevel?.isBossLevel && !currentLevel?.isTaroBoss) {
                    // 只显示Level 10的普通Boss提示
                    toastTips.showBossTip();
                }
            }, 1000);
        }
        
        return true;
    }

    // 加载指定关卡（内部数据配置，不控制游戏流程）
    loadLevel(index, viruses = [], particles = []) {
        const level = getLevel(index);
        if (!level) {
            console.error('[GameManager] 关卡不存在:', index);
            return null;
        }
        
        // 设置关卡参数
        this.currentLevelIndex = index;
        this.levelGoal = level.goal;
        this.infectionThreshold = level.threshold;
        this.currentSpawnInterval = level.spawnInterval;
        this.availableTypes = level.availableTypes;
        
        // 保存完整的关卡信息以便后续使用
        this.currentLevel = level;
        
        // 🌬️ 初始化风力系统
        if (level.hasWind && level.windConfig) {
            this.hasWind = true;
            this.windConfig = level.windConfig;
            this.windForceX = 0;
            this.windDuration = 0;
            this.windCooldown = level.windConfig.cooldown; // 初始冷却
            console.log('[GameManager] 🌬️ 风力系统已激活', this.windConfig);
        } else if (level.hasTurbulence && level.turbulenceConfig) {
            // 🌪️ Level 11 湍流系统
            this.hasWind = false;
            this.windConfig = null;
            this.windForceX = 0;
            this.windDuration = 0;
            this.windCooldown = level.turbulenceConfig.gustCooldown; // 初始冷却
            console.log('[GameManager] 🌪️ 湍流系统已激活', level.turbulenceConfig);
        } else {
            this.hasWind = false;
            this.windConfig = null;
            this.windForceX = 0;
            this.windDuration = 0;
            this.windCooldown = 0;
        }
        
        // 🍑 Level 16：初始化红细胞载具配置
        if (level.hasRafts && level.raftConfig) {
            this.hasRafts = true;
            this.raftConfig = level.raftConfig;
            console.log('[GameManager] 🍑 红细胞载具系统已激活', this.raftConfig);
        } else {
            this.hasRafts = false;
            this.raftConfig = null;
        }
        
        // 🍑 Level 17：初始化瓣膜配置
        if (level.hasValves && level.valveConfig) {
            this.hasValves = true;
            this.valveConfig = level.valveConfig;
            console.log('[GameManager] 🍑 瓣膜系统已激活', this.valveConfig);
        } else {
            this.hasValves = false;
            this.valveConfig = null;
        }
        
        // 保留教程病毒
        if (viruses && viruses.length > 0) {
            const preservedTutorials = viruses.filter(v => v.tutorialLock || v.isTutorial);
            viruses.length = 0;
            viruses.push(...preservedTutorials);
        }
        
        // 清空粒子
        if (particles) {
            particles.length = 0;
        }
        
        // 在控制台显示关卡信息
        console.log(`[GameManager] 加载关卡配置: ${level.description}`);
        
        return level;
    }

    // 检查胜负条件
    checkWinConditions(currentVirusCount) {
        // 🔥 安全检查：如果游戏没开始，或者刚刚重置，绝对不能判赢
        if (!this.isGameActive) {
            return 'continue';
        }
        
        // 🔥 开局保护：防止在没有进度时误判胜利
        if (this.curedCount === 0 && this.levelGoal > 0) {
            return 'continue';
        }
        
        // 🐛 调试：定期打印关卡状态
        if (!this._winCheckCounter) this._winCheckCounter = 0;
        this._winCheckCounter++;
        if (this._winCheckCounter % 60 === 0) {
            console.log('[WinCheck] 关卡状态:', {
                curedCount: this.curedCount,
                levelGoal: this.levelGoal,
                currentVirusCount,
                infectionThreshold: this.infectionThreshold,
                isGameActive: this.isGameActive
            });
        }
        
        // 只有治愚数达标，才算赢！
        // ❌ 绝对不要写: if (currentVirusCount === 0) return 'win';
        // ✅ 必须写：
        if (this.curedCount >= this.levelGoal) {
            // 进入胜利动画阶段
            this.gameState = GAME_STATE.WINNING;
            this.vaccineRadius = 0;
            this.isLevelComplete = true;
            console.log('[WinCheck] ✅ 胜利！');
            return 'win';
        } else if (currentVirusCount >= this.infectionThreshold) {
            this.isLevelComplete = true;
            console.log('[WinCheck] ❌ 失败！病毒数量:', currentVirusCount, '>=', this.infectionThreshold);
            return 'lose';
        }
        return 'continue';
    }

    // 更新游戏时间和生成计时器
    updateGameTime(dt) {
        // 🎯 如果游戏未激活，不更新时间，不生成怪物
        if (!this.isGameActive) {
            // 🐛 调试：每100帧打印一次（避免刷屏）
            if (!this._debugCounter) this._debugCounter = 0;
            this._debugCounter++;
            if (this._debugCounter % 100 === 0) {
                console.warn('[updateGameTime] ⚠️ 游戏未激活，无法生成病毒！');
                console.warn('- isGameActive:', this.isGameActive);
                console.warn('- gameState:', this.gameState);
                console.warn('- spawnTimer:', this.spawnTimer);
            }
            return false;
        }
        
        this.gameTime += dt;
        this.spawnTimer -= dt;
        
        // 判断是否应该生成病毒
        const shouldSpawn = this.spawnTimer <= 0;
        
        // 🐛 调试：即将生成病毒时打印日志
        if (shouldSpawn) {
            console.log('[updateGameTime] ✅ 触发病毒生成！');
            console.log('- spawnTimer:', this.spawnTimer);
            console.log('- availableTypes:', this.availableTypes);
        }
        
        return shouldSpawn;
    }

    // 重置生成计时器
    resetSpawnTimer() {
        this.spawnTimer = this.currentSpawnInterval;
    }

    // 🌬️ 更新风力系统（每帧调用）
    updateWind(dt) {
        // 🌪️ Level 11 湍流模式：使用 turbulenceConfig
        if (this.currentLevel?.hasTurbulence && this.currentLevel.turbulenceConfig) {
            this.updateTurbulence(dt);
            return;
        }
        
        // 🌬️ Level 6 风力模式：使用 windConfig
        if (!this.hasWind || !this.windConfig) {
            return;
        }

        // 如果正在吹风
        if (this.windDuration > 0) {
            this.windDuration -= dt;
            
            // 风停了
            if (this.windDuration <= 0) {
                this.windForceX = 0;
                this.windCooldown = this.windConfig.cooldown;
                console.log('[Wind] 🌬️ 风停了，进入冷却时间:', this.windCooldown, 'ms');
            }
        }
        // 如果在冷却中
        else if (this.windCooldown > 0) {
            this.windCooldown -= dt;
            
            // 冷却结束，开始新一轮吹风
            if (this.windCooldown <= 0) {
                // 随机风向（50%向左，50%向右）
                const direction = Math.random() < 0.5 ? -1 : 1;
                // 随机风力强度
                const force = this.windConfig.minForce + 
                             Math.random() * (this.windConfig.maxForce - this.windConfig.minForce);
                
                this.windForceX = force * direction;
                this.windDuration = this.windConfig.duration;
                
                console.log('[Wind] 🌬️ 开始吹风！', 
                           `方向: ${direction > 0 ? '→' : '←'}`, 
                           `强度: ${force.toFixed(0)}`);
                
                // 🎓 首次刮风时显示萌系高能预警
                if (!this.hasShownWindTutorial) {
                    this.hasShownWindTutorial = true;
                    this.showWindTutorial();
                }
            }
        }
    }

    // 🌪️ 更新湍流系统（Level 11 专用）
    updateTurbulence(dt) {
        const config = this.currentLevel.turbulenceConfig;
        
        // 如果气流正在吹
        if (this.windDuration > 0) {
            this.windDuration -= dt;
            
            // 气流停了
            if (this.windDuration <= 0) {
                this.windForceX = 0;
                this.windCooldown = config.gustCooldown;
                console.log('[Turbulence] 🌪️ 气流停止，进入冷却时间:', this.windCooldown, 'ms');
            }
        }
        // 如果在冷却中
        else if (this.windCooldown > 0) {
            this.windCooldown -= dt;
            
            // 冷却结束，开始新一轮气流
            if (this.windCooldown <= 0) {
                // 湍流始终存在（通过 turbulenceOffsetX 实现 S 型走位）
                // 这里的 windForceX 用于控制风效特效的强度
                this.windForceX = config.gustForce || 600;
                this.windDuration = config.gustDuration;
                
                console.log('[Turbulence] 🌪️ 气流爆发！', 
                           `持续时间: ${config.gustDuration}ms`, 
                           `强度: ${config.gustForce}`);
            }
        }
    }

    // 🌬️ 获取当前风力（供病毒移动逻辑使用）
    getWindForce() {
        return this.windForceX;
    }

    // 🎓 显示首次刮风的萌系高能预警弹窗
    showWindTutorial() {
        // 创建弹窗元素
        const toast = document.createElement('div');
        toast.innerHTML = `
            <div style="font-size: 28px; margin-bottom: 8px;">⚠️ 警告：剧烈喘息！</div>
            <div style="font-size: 18px; line-height: 1.6;">
                气流会导致病毒走位偏移，<br>
                请预判点击！
            </div>
        `;
        
        // 萌系样式（猛男粉渐变背景 + 白字）
        Object.assign(toast.style, {
            position: 'fixed',
            top: '15%',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '30px 45px',
            background: 'linear-gradient(135deg, #FF9AA2 0%, #FFB7B2 60%, #FFDAC1 100%)',
            color: '#FFFFFF',
            fontWeight: 'bold',
            textAlign: 'center',
            borderRadius: '25px',
            boxShadow: '0 10px 40px rgba(255, 107, 107, 0.4), 0 0 0 4px rgba(255, 255, 255, 0.5)',
            zIndex: '10000',
            pointerEvents: 'none',
            opacity: '0',
            transition: 'opacity 0.4s ease-out',
            fontSize: '20px',
            fontFamily: '\'Varela Round\', \'Arial Rounded MT Bold\', sans-serif',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        });
        
        document.body.appendChild(toast);
        
        // 淡入动画
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
        });
        
        // 3.5秒后淡出并移除
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 400); // 等待淡出动画结束
        }, 3500);
    }

    // 更新胜利光波
    updateVaccineWave() {
        this.vaccineRadius += this.VACCINE_SPEED;
        return this.vaccineRadius;
    }

    // 检查光波是否完成
    isVaccineWaveComplete(canvasWidth, canvasHeight) {
        const maxDist = Math.hypot(canvasWidth, canvasHeight);
        return this.vaccineRadius > maxDist;
    }

    // 进入胜利状态
    startWinning() {
        this.gameState = GAME_STATE.WINNING;
        this.vaccineRadius = 0;
    }

    // 结束游戏
    endGame() {
        this.gameState = GAME_STATE.LEVEL_OVER;
    }

    // 增加治愈计数
    addCuredCount(value = 1) {
        this.curedCount += value;
    }

    // 前往下一关
    nextLevel() {
        if (hasNextLevel(this.currentLevelIndex)) {
            this.currentLevelIndex += 1;
            this.savePlayerProgress();
            return true;
        }
        return false;
    }

    // Getter 方法
    getCurrentLevelIndex() {
        return this.currentLevelIndex;
    }

    getCuredCount() {
        return this.curedCount;
    }

    getGameState() {
        return this.gameState;
    }

    getLevelGoal() {
        return this.levelGoal;
    }

    getInfectionThreshold() {
        return this.infectionThreshold;
    }

    getAvailableTypes() {
        return this.availableTypes;
    }

    getCurrentSpawnInterval() {
        return this.currentSpawnInterval;
    }

    getGameTime() {
        return this.gameTime;
    }

    getVaccineRadius() {
        return this.vaccineRadius;
    }

    shouldSpawn() {
        return this.spawnTimer <= 0;
    }

    // 获取当前关卡信息
    getCurrentLevel() {
        return this.currentLevel;
    }

    // 获取下一个关卡信息
    getNextLevel() {
        return getNextLevel(this.currentLevelIndex);
    }

    getTotalLevels() {
        return getTotalLevels();
    }

    // 🎯 游戏激活状态管理
    isGameRunning() {
        return this.isGameActive;
    }
    
    activateGame() {
        this.isGameActive = true;
        console.log('[GameManager] 游戏已激活');
    }
    
    pauseGame() {
        this.isGameActive = false;
        console.log('[GameManager] 游戏已暂停');
    }
}

// 创建全局实例
export const gameManager = new GameManager();