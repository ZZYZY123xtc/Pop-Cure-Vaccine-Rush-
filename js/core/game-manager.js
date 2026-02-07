/**
 * 游戏状态管理器 - 处理关卡、进度保存、状态管理
 */
import { CONFIG } from './config.js';
import { getLevel, hasNextLevel, getTotalLevels, getNextLevel } from '../data/levels.js';
import { skillManager } from '../data/skills.js';

export const GAME_STATE = {
    PLAYING: 0,
    WINNING: 1,  // 胜利动画阶段
    LEVEL_OVER: 2
};

export class GameManager {
    constructor() {
        this.currentLevelIndex = 0;
        this.curedCount = 0;
        this.gameTime = 0;
        this._gameState = GAME_STATE.PLAYING;
        this.spawnTimer = 0;
        this.isGameActive = false; // 🎯 用于控制游戏循环是否运行
        
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
        
        // 🔥 关键修复：强制关闭教程状态（除了第一关）
        if (levelId > 0 && window.tutorialManager) {
            window.tutorialManager.tutorialActive = false;
            console.log('[GameManager] ✅ 已强制关闭教程状态（非第一关）');
        }
        
        // 1. 🔥 强制重置所有状态 (Critical Reset)
        this.gameState = GAME_STATE.PLAYING;
        this.curedCount = 0; // 必须归零
        this.isLevelComplete = false;
        this.vaccineRadius = 0;
        this.gameTime = 0;
        this.isGameActive = false; // ⚠️ 关键：默认暂停，直到 UI 允许开始
        this.spawnTimer = 2000; // 给予初始缓冲时间
        
        // 2. 清理场景
        if (sceneManager && sceneManager.clearViruses) {
            sceneManager.clearViruses();
        }
        
        // 3. 加载数据
        const level = this.loadLevel(levelId, 
            sceneManager ? sceneManager.viruses : [], 
            sceneManager ? sceneManager.particles : []);
        
        if (!level) {
            console.error('[GameManager] 关卡加载失败:', levelId);
            return false;
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
                    const tutorialX = canvas.width * 0.62;
                    const tutorialY = canvas.height * 0.42;
                    
                    sceneManager.spawnVirus(this.availableTypes[0], tutorialX, tutorialY);
                    console.log('[GameManager] 教程病毒已生成');
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
            
            // 更新技能UI（即使没有新技能，也要刷新UI以显示已解锁的技能）
            if (uiManager && uiManager.updateSkillUI) {
                uiManager.updateSkillUI(false, this.currentLevelIndex, skillManager);
                console.log('[GameManager] ✅ 技能UI已更新（无新技能解锁）');
            }
            
            this.isGameActive = true;
            this.spawnTimer = -100; // 立即生成
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
        
        // 只有治愚数达标，才算赢！
        // ❌ 绝对不要写: if (currentVirusCount === 0) return 'win';
        // ✅ 必须写：
        if (this.curedCount >= this.levelGoal) {
            // 进入胜利动画阶段
            this.gameState = GAME_STATE.WINNING;
            this.vaccineRadius = 0;
            this.isLevelComplete = true;
            return 'win';
        } else if (currentVirusCount >= this.infectionThreshold) {
            this.isLevelComplete = true;
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
        
        // 🐛 调试：即将生成病毒时打印日志
        const shouldSpawn = this.spawnTimer <= 0;
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