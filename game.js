import { CONFIG } from './config.js';
import { Virus } from './virus.js';
import { Particle } from './partical.js';
import { LEVELS, getLevel, hasNextLevel, getTotalLevels } from './levels.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const cureBarHeader = document.getElementById('cure-bar-header');
const infectionBarFooter = document.getElementById('infection-bar-footer');
const gameOverScreen = document.getElementById('game-over');
const gameWinScreen = document.getElementById('game-win');
const levelCompleteScreen = document.getElementById('level-complete');
const levelDisplayHeader = document.getElementById('level-display-header');
const totalLevelsHeader = document.getElementById('total-levels-header');
const nextLevelBtn = document.getElementById('next-level-btn');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const mapScreen = document.getElementById('map-screen');
const skillContainer = document.getElementById('skill-container');

// 游戏常量
const SAFE_ZONE_SIZE = 120;

let viruses = [];
let particles = [];
let lastTime = 0;
let spawnTimer = 0;
let gameState = CONFIG.GAME_STATE.PLAYING;
let currentSpawnInterval = CONFIG.SPAWN_INTERVAL;
let gameTime = 0;

// 关卡相关
let curedCount = 0;  // 已消除的病毒总数
let currentLevelIndex = 0;  // 当前关卡索引
let levelGoal = 0;  // 本关卡的消除目标
let infectionThreshold = 0;  // 本关卡的失败阈值
let availableTypes = ['A'];  // 本关可用的病毒类型

// 加载游戏进度
function loadPlayerProgress() {
    const saved = localStorage.getItem('playerProgress');
    if (saved) {
        const progress = JSON.parse(saved);
        currentLevelIndex = progress.currentLevel || 0;
    }
}

// 保存游戏进度
function savePlayerProgress() {
    localStorage.setItem('playerProgress', JSON.stringify({
        currentLevel: currentLevelIndex,
        timestamp: Date.now()
    }));
}

// 获取已解锁的最高关卡
function getUnlockedLevel() {
    const saved = localStorage.getItem('playerProgress');
    if (saved) {
        const progress = JSON.parse(saved);
        return progress.unlockedLevel || 0;
    }
    return 0;
}

// 从地图启动游戏
function startGameAtLevel(levelIndex) {
    mapScreen.classList.add('hidden');
    loadLevel(levelIndex);
    requestAnimationFrame(loop);
}

// 加载指定关卡
function loadLevel(index) {
    const level = getLevel(index);
    if (!level) {
        console.error('关卡不存在:', index);
        return;
    }
    
    currentLevelIndex = index;
    levelGoal = level.goal;
    infectionThreshold = level.threshold;
    currentSpawnInterval = level.spawnInterval;
    availableTypes = level.availableTypes;
    
    // 重置游戏状态
    curedCount = 0;
    gameTime = 0;
    spawnTimer = 0;
    viruses = [];
    particles = [];
    gameState = CONFIG.GAME_STATE.PLAYING;
    lastTime = 0;
    
    // 清空进度条
    cureBarHeader.style.width = '0%';
    infectionBarFooter.style.width = '0%';
    
    // 更新关卡显示
    levelDisplayHeader.innerText = `Level ${index + 1}`;
    totalLevelsHeader.innerText = getTotalLevels();
    
    // 隐藏所有弹窗
    gameOverScreen.classList.add('hidden');
    gameWinScreen.classList.add('hidden');
    levelCompleteScreen.classList.add('hidden');
    
    // 在控制台显示关卡信息（可选）
    console.log(`加载 ${level.description}`);
    
    // 检查是否有新病毒介绍
    if (level.intro) {
        showIntroModal(level.intro);
        return;  // 不立即开始游戏，等待玩家点击介绍弹窗的开始按钮
    }
    
    // 开局直接生成初始病毒
    const initialCount = CONFIG.INITIAL_SPAWN_COUNT || 3;
    for (let i = 0; i < initialCount; i++) {
        spawnVirus(availableTypes[Math.floor(Math.random() * availableTypes.length)]);
    }
}

function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 加载游戏进度
    loadPlayerProgress();
    
    // 初始化时显示开始屏幕
    startScreen.classList.remove('hidden');
    startScreen.classList.add('visible');
    mapScreen.classList.add('hidden');
    
    // 地图节点点击事件
    document.querySelectorAll('.level-node').forEach(node => {
        node.addEventListener('click', (e) => {
            const levelIndex = parseInt(node.getAttribute('data-level'));
            if (levelIndex <= getUnlockedLevel()) {
                startGameAtLevel(levelIndex);
            }
        });
    });
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.75;
}

function spawnVirus(type, x, y) {
    // 如果没指定类型，从当前关卡的可用类型中随机选择
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

function createExplosion(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

// 绘制波点背景
function drawBackground() {
    ctx.fillStyle = '#E8F1F2';
    const r = 3;
    const gap = 40;
    
    for (let x = 20; x < canvas.width; x += gap) {
        for (let y = 20; y < canvas.height; y += gap) {
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// 更新进度条
function updateProgressBars() {
    // 治愈进度 = (已消除数 / 本关目标数) * 100%
    const curePercent = Math.min((curedCount / levelGoal) * 100, 100);
    cureBarHeader.style.width = curePercent + '%';
    
    // 感染进度 = (当前屏幕病毒数 / 本关警戒值) * 100%
    const infectionPercent = Math.min((viruses.length / infectionThreshold) * 100, 100);
    infectionBarFooter.style.width = infectionPercent + '%';
}

function loop(timestamp) {
    if (gameState !== CONFIG.GAME_STATE.PLAYING) return;
    
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    gameTime += dt;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
        spawnTimer = currentSpawnInterval;
        // 不再使用全局的难度调整，每关有自己的生成速度
        spawnVirus(); // 从本关的 availableTypes 中随机选择
    }

    // 粒子更新
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        if (p.life <= 0) particles.splice(i, 1);
        else p.draw(ctx);
    }

    // 病毒更新
    const newBabies = [];
    for (let i = viruses.length - 1; i >= 0; i--) {
        const v = viruses[i];
        v.update(dt, canvas.width, canvas.height);
        
        // 🔴 修复后的禁区碰撞逻辑 (Smart Bounce)
        const safeLeft = canvas.width - SAFE_ZONE_SIZE;
        const safeTop = canvas.height - SAFE_ZONE_SIZE;
        
        // 判定：只有当病毒进入右下角矩形区域时才触发
        // 判定条件：病毒右边缘 > 禁区左边缘 AND 病毒下边缘 > 禁区上边缘
        if (v.x + v.radius > safeLeft && v.y + v.radius > safeTop) {
            // 策略：判断是从"左侧"撞入还是"上方"撞入
            // 计算侵入深度：
            const overlapX = (v.x + v.radius) - safeLeft;
            const overlapY = (v.y + v.radius) - safeTop;
            
            // 如果 X 方向侵入较浅，说明是横向撞击 -> 弹回 X
            if (overlapX < overlapY) {
                v.x = safeLeft - v.radius;  // 【强制推离】：推到禁区外
                v.vx = -Math.abs(v.vx);     // 【强制变向】：绝对值保证一定向左飞
            } 
            // 否则是纵向撞击 -> 弹回 Y
            else {
                v.y = safeTop - v.radius;   // 【强制推离】
                v.vy = -Math.abs(v.vy);     // 【强制变向】：绝对值保证一定向上飞
            }
        }

        if (v.shouldSplit()) {
            newBabies.push(...v.split());
            viruses.splice(i, 1);
            createExplosion(v.x, v.y, '#FFB7B2', 5);
        }
        v.draw(ctx);
    }
    viruses.push(...newBabies);

    // 更新进度条
    updateProgressBars();

    // 检查胜负条件
    // 胜利：已消除病毒数达到本关目标
    if (curedCount >= levelGoal) {
        triggerLevelComplete();
    }
    // 失败：屏幕上病毒数超过本关阈值
    else if (viruses.length >= infectionThreshold) {
        triggerGameOver();
    } else {
        requestAnimationFrame(loop);
    }
}

// 关卡完成（暂停游戏，显示完成弹窗）
function triggerLevelComplete() {
    gameState = CONFIG.GAME_STATE.PAUSED;
    levelCompleteScreen.classList.remove('hidden');
    levelCompleteScreen.classList.add('visible');
}

function triggerGameOver() {
    gameState = CONFIG.GAME_STATE.LOST;
    gameOverScreen.classList.remove('hidden');
    gameOverScreen.classList.add('visible');
}

function triggerGameWin() {
    gameState = CONFIG.GAME_STATE.WON;
    gameWinScreen.classList.remove('hidden');
    gameWinScreen.classList.add('visible');
}

canvas.addEventListener('mousedown', (e) => {
    if (gameState !== CONFIG.GAME_STATE.PLAYING) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    for (let i = viruses.length - 1; i >= 0; i--) {
        const v = viruses[i];
        if (Math.hypot(mouseX - v.x, mouseY - v.y) < v.radius + 15) {
            const dead = v.hit();
            createExplosion(v.x, v.y, '#FFF', 3);
            
            if (dead) {
                createExplosion(v.x, v.y, v.props.color, 15);
                viruses.splice(i, 1);
                // 关键：病毒死亡时，根据病毒类型增加不同的治愈进度
                curedCount += v.props.cureValue || 1;  // 使用病毒的 cureValue，默认1
            }
            break;
        }
    }
});

// "前往下一关"按钮事件处理
nextLevelBtn.addEventListener('click', () => {
    levelCompleteScreen.classList.remove('visible');
    levelCompleteScreen.classList.add('hidden');
    
    if (hasNextLevel(currentLevelIndex)) {
        // 保存进度
        currentLevelIndex += 1;
        savePlayerProgress();
        // 有下一关，加载下一关
        loadLevel(currentLevelIndex);
        requestAnimationFrame(loop);
    } else {
        // 最后一关已完成，游戏胜利
        gameState = CONFIG.GAME_STATE.WON;
        gameWinScreen.classList.remove('hidden');
    }
});

// "开始实验"按钮事件处理
startBtn.addEventListener('click', () => {
    startScreen.classList.remove('visible');
    startScreen.classList.add('hidden');
    mapScreen.classList.remove('hidden');
});

// 图鉴弹窗逻辑
const introModal = document.getElementById('intro-modal');
const introCanvas = document.getElementById('intro-canvas');
const introName = document.getElementById('intro-name');
const introDesc = document.getElementById('intro-desc');
const introTip = document.getElementById('intro-tip');
const introStartBtn = document.getElementById('intro-start-btn');

const VIRUS_NAMES = {
    'A': { name: '🍓 草莓冠糖', desc: '最基础的病毒，行动缓慢，繁殖速度中等。', tip: '⏰ 周围的圈圈显示繁殖倒计时！倒计时完成后会分裂成两个。' },
    'B': { name: '🫐 蓝莓聚合体', desc: '由多个细胞聚合而成，防御力强，击杀需要多次。', tip: '💪 需要点击多次才能消灭！它会缓慢转动。' },
    'C': { name: '⚡ 柠檬闪电', desc: '移动速度最快，繁殖也很快。是最危险的病毒！', tip: '⚠️ 速度极快！要小心它躲避你的点击。' }
};

function showIntroModal(virusType) {
    const virusInfo = VIRUS_NAMES[virusType];
    introName.textContent = virusInfo.name;
    introDesc.textContent = virusInfo.desc;
    introTip.textContent = virusInfo.tip;
    
    // 1. 强制设置 Canvas 内部分辨率 (防止模糊)
    const canvas = introCanvas;
    canvas.width = 120;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    
    // 2. 实例化一个临时病毒用于展示
    // 注意：位置必须设为 0,0，因为我们会用 translate 移动画布中心
    const previewVirus = new Virus(0, 0, virusType);
    
    // 3. 启动一个小动画循环来画它
    let animationId;
    const renderPreview = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制背景
        ctx.fillStyle = '#FFF9F0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        // 核心修复：把画笔移动到 Canvas 正中心
        ctx.translate(canvas.width / 2, canvas.height / 2);
        
        // 稍微放大一点，看得清楚 (1.5倍)
        ctx.scale(1.5, 1.5);
        
        // 调用病毒自己的 draw 方法
        // 病毒 update 为了让它有呼吸/旋转动画
        previewVirus.update(16, 1000, 1000); // 传入假的时间和边界
        // 强制修正位置回 0,0 (因为 update 可能会移动它)
        previewVirus.x = 0;
        previewVirus.y = 0;
        
        previewVirus.draw(ctx);
        
        ctx.restore();
        
        if(!introModal.classList.contains('hidden')) {
            animationId = requestAnimationFrame(renderPreview);
        }
    };
    
    // 显示弹窗
    introModal.classList.remove('hidden');
    introModal.classList.add('visible');
    gameState = CONFIG.GAME_STATE.PAUSED;
    
    // 开始预览动画
    renderPreview();
    
    // 更新关闭按钮逻辑，关闭时取消动画
    introStartBtn.onclick = () => {
        introModal.classList.remove('visible');
        introModal.classList.add('hidden');
        cancelAnimationFrame(animationId);
        gameState = CONFIG.GAME_STATE.PLAYING;
        
        // 开局直接生成初始病毒
        const initialCount = CONFIG.INITIAL_SPAWN_COUNT || 3;
        for (let i = 0; i < initialCount; i++) {
            spawnVirus(availableTypes[Math.floor(Math.random() * availableTypes.length)]);
        }
        
        requestAnimationFrame(loop);
    };
}

introStartBtn.addEventListener('click', () => {
    // 此监听器已移至 showIntroModal 内部，保留此处以免报错
    // 实际逻辑由 showIntroModal 中的 onclick 处理
});

init();