import { CONFIG } from '../utils/config.js';
import { Virus } from '../utils/virus.js';
import { skillManager } from '../utils/skills.js';
import { OpeningScene } from './opening.js';
import { tutorialManager } from '../components/tutorial.js';
import { uiManager } from '../components/ui-manager.js';
import { modals } from '../components/modals-ui.js';
import { gameManager, GAME_STATE } from './game-manager.js';
import { effectsManager } from './effects.js';
import { SKILL_GUIDE } from './story.js';
import { LEVELS } from './levels.js';

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
}