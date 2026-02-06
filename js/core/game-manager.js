/**
 * 游戏状态管理器 - 处理关卡、进度保存、状态管理
 */
import { CONFIG } from './config.js';
import { getLevel, hasNextLevel, getTotalLevels, getNextLevel } from '../data/levels.js';

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
        this.gameState = GAME_STATE.PLAYING;
        this.spawnTimer = 0;
        
        // 关卡相关
        this.levelGoal = 0;
        this.infectionThreshold = 0;
        this.availableTypes = ['A'];
        this.currentSpawnInterval = CONFIG.SPAWN_INTERVAL;
        
        // 胜利光波
        this.vaccineRadius = 0;
        this.VACCINE_SPEED = 15;
    }

    // 加载游戏进度
    loadPlayerProgress() {
        const saved = localStorage.getItem('playerProgress');
        if (saved) {
            const progress = JSON.parse(saved);
            this.currentLevelIndex = progress.currentLevel || 0;
        }
    }

    // 保存游戏进度
    savePlayerProgress() {
        const saved = localStorage.getItem('playerProgress');
        let unlockedLevel = 0;
        if (saved) {
            const progress = JSON.parse(saved);
            unlockedLevel = progress.unlockedLevel || 0;
        }
        
        // 更新已解锁的最高关卡
        unlockedLevel = Math.max(unlockedLevel, this.currentLevelIndex);
        
        localStorage.setItem('playerProgress', JSON.stringify({
            currentLevel: this.currentLevelIndex,
            unlockedLevel: unlockedLevel,
            timestamp: Date.now()
        }));
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

    // 加载指定关卡
    loadLevel(index, viruses, particles) {
        const level = getLevel(index);
        if (!level) {
            console.error('关卡不存在:', index);
            return null;
        }
        
        this.currentLevelIndex = index;
        this.levelGoal = level.goal;
        this.infectionThreshold = level.threshold;
        this.currentSpawnInterval = level.spawnInterval;
        this.availableTypes = level.availableTypes;
        
        // 保存完整的关卡信息以便后续使用
        this.currentLevel = level;
        
        // 重置游戏状态
        this.curedCount = 0;
        this.gameTime = 0;
        this.spawnTimer = 0;
        this.gameState = GAME_STATE.PLAYING;
        this.vaccineRadius = 0;
        
        // 保留教程病毒
        const preservedTutorials = viruses.filter(v => v.tutorialLock || v.isTutorial);
        viruses.length = 0;
        viruses.push(...preservedTutorials);
        particles.length = 0;
        
        // 在控制台显示关卡信息（可选）
        console.log(`加载 ${level.description}`);
        
        return level;
    }

    // 检查胜负条件
    checkWinConditions(virusCount) {
        if (this.curedCount >= this.levelGoal) {
            // 进入胜利动画阶段
            this.gameState = GAME_STATE.WINNING;
            this.vaccineRadius = 0;
            return 'win';
        } else if (virusCount >= this.infectionThreshold) {
            return 'lose';
        }
        return 'continue';
    }

    // 更新游戏时间和生成计时器
    updateGameTime(dt) {
        this.gameTime += dt;
        this.spawnTimer -= dt;
        return this.spawnTimer <= 0;
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
}

// 创建全局实例
export const gameManager = new GameManager();