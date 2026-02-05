// Game state
const game = {
    canvas: null,
    ctx: null,
    running: false,
    paused: false,
    viruses: [],
    particles: [],
    dna: 0,
    vaccineProgress: 0,
    level: 1,
    score: 0,
    lastSpawnTime: 0,
    spawnInterval: 2000, // ms
    virusGrowthRate: 1.05, // exponential growth multiplier
    upgrades: {
        clickPower: 1,
        dnaBoost: 1,
        growthSlow: 1,
        autoDamage: 0
    },
    upgradeCosts: {
        clickPower: 10,
        dnaBoost: 15,
        growthSlow: 20,
        autoDamage: 25
    },
    maxViruses: 50,
    virusesEliminated: 0,
    timeElapsed: 0,
    lastTime: 0
};

// Virus class
class Virus {
    constructor(x, y, level) {
        this.x = x;
        this.y = y;
        this.size = 20 + Math.random() * 20;
        this.health = 10 * level;
        this.maxHealth = this.health;
        this.speed = 0.5 + Math.random() * 0.5;
        this.angle = Math.random() * Math.PI * 2;
        this.color = this.getRandomColor();
        this.growthTimer = 0;
        this.dnaValue = Math.ceil(level * 2);
    }

    getRandomColor() {
        const colors = ['#ff6b6b', '#ee5a6f', '#f06595', '#cc5de8', '#845ef7'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update(deltaTime) {
        // Movement
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // Bounce off walls
        if (this.x < this.size || this.x > game.canvas.width - this.size) {
            this.angle = Math.PI - this.angle;
            this.x = Math.max(this.size, Math.min(game.canvas.width - this.size, this.x));
        }
        if (this.y < this.size || this.y > game.canvas.height - this.size) {
            this.angle = -this.angle;
            this.y = Math.max(this.size, Math.min(game.canvas.height - this.size, this.y));
        }

        // Exponential growth
        this.growthTimer += deltaTime;
        if (this.growthTimer >= 3000 / game.upgrades.growthSlow) { // grow every 3 seconds
            this.size *= game.virusGrowthRate;
            this.maxHealth *= game.virusGrowthRate;
            this.health = this.maxHealth;
            this.growthTimer = 0;
        }

        // Auto damage from upgrades
        if (game.upgrades.autoDamage > 0) {
            this.health -= game.upgrades.autoDamage * deltaTime / 1000;
        }
    }

    draw(ctx) {
        // Draw virus body
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Glow effect
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);

        // Main body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Spikes
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * this.size * 1.3, Math.sin(angle) * this.size * 1.3);
            ctx.stroke();
        }

        // Health bar
        const barWidth = this.size * 2;
        const barHeight = 5;
        const healthPercent = this.health / this.maxHealth;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(-barWidth / 2, this.size + 10, barWidth, barHeight);
        
        ctx.fillStyle = healthPercent > 0.5 ? '#10b981' : healthPercent > 0.25 ? '#f59e0b' : '#ef4444';
        ctx.fillRect(-barWidth / 2, this.size + 10, barWidth * healthPercent, barHeight);

        ctx.restore();
    }

    takeDamage(amount) {
        this.health -= amount;
        return this.health <= 0;
    }

    contains(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return dx * dx + dy * dy <= this.size * this.size;
    }
}

// Particle class for visual effects
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.life = 1;
        this.color = color;
        this.size = Math.random() * 4 + 2;
    }

    update(deltaTime) {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= deltaTime / 500;
        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Initialize game
function init() {
    game.canvas = document.getElementById('gameCanvas');
    game.ctx = game.canvas.getContext('2d');

    // Event listeners
    game.canvas.addEventListener('click', handleCanvasClick);
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    document.getElementById('vaccine-btn').addEventListener('click', useVaccine);
    document.getElementById('restart-btn').addEventListener('click', restartGame);

    // Upgrade buttons
    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        btn.addEventListener('click', () => handleUpgrade(btn.dataset.upgrade));
    });

    updateUI();
}

// Start game
function startGame() {
    if (game.running) return;

    game.running = true;
    game.paused = false;
    game.viruses = [];
    game.particles = [];
    game.lastSpawnTime = 0;
    game.lastTime = performance.now();

    document.getElementById('start-btn').disabled = true;
    document.getElementById('pause-btn').disabled = false;
    document.getElementById('game-over-modal').classList.remove('active');

    // Spawn initial viruses
    for (let i = 0; i < 3; i++) {
        spawnVirus();
    }

    gameLoop();
}

// Game loop
function gameLoop() {
    if (!game.running) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - game.lastTime;
    game.lastTime = currentTime;

    if (!game.paused) {
        update(deltaTime);
    }
    draw();

    requestAnimationFrame(gameLoop);
}

// Update game state
function update(deltaTime) {
    game.timeElapsed += deltaTime;

    // Spawn new viruses
    game.lastSpawnTime += deltaTime;
    if (game.lastSpawnTime >= game.spawnInterval && game.viruses.length < game.maxViruses) {
        spawnVirus();
        game.lastSpawnTime = 0;
    }

    // Update viruses
    for (let i = game.viruses.length - 1; i >= 0; i--) {
        game.viruses[i].update(deltaTime);

        // Remove dead viruses
        if (game.viruses[i].health <= 0) {
            eliminateVirus(game.viruses[i]);
            game.viruses.splice(i, 1);
        }
    }

    // Update particles
    game.particles = game.particles.filter(p => p.update(deltaTime));

    // Check game over
    if (game.viruses.length >= game.maxViruses) {
        gameOver(false);
    }

    // Check level completion
    if (game.virusesEliminated >= game.level * 20 && game.viruses.length === 0) {
        levelUp();
    }

    updateUI();
}

// Draw everything
function draw() {
    const ctx = game.ctx;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(102, 126, 234, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < game.canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, game.canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i < game.canvas.height; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(game.canvas.width, i);
        ctx.stroke();
    }

    // Draw particles
    game.particles.forEach(p => p.draw(ctx));

    // Draw viruses
    game.viruses.forEach(v => v.draw(ctx));

    // Draw warning if close to limit
    if (game.viruses.length >= game.maxViruses * 0.8) {
        ctx.save();
        ctx.font = 'bold 30px Arial';
        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 10;
        ctx.fillText('⚠️ 病毒过载警告 ⚠️', game.canvas.width / 2, 50);
        ctx.restore();
    }
}

// Spawn a new virus
function spawnVirus() {
    const margin = 50;
    const x = margin + Math.random() * (game.canvas.width - margin * 2);
    const y = margin + Math.random() * (game.canvas.height - margin * 2);
    game.viruses.push(new Virus(x, y, game.level));
}

// Handle canvas click
function handleCanvasClick(e) {
    if (!game.running || game.paused) return;

    const rect = game.canvas.getBoundingClientRect();
    const scaleX = game.canvas.width / rect.width;
    const scaleY = game.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check if clicked on a virus
    for (let i = game.viruses.length - 1; i >= 0; i--) {
        const virus = game.viruses[i];
        if (virus.contains(x, y)) {
            const killed = virus.takeDamage(game.upgrades.clickPower * 5);
            
            // Create particles
            for (let j = 0; j < 10; j++) {
                game.particles.push(new Particle(virus.x, virus.y, virus.color));
            }

            if (killed) {
                eliminateVirus(virus);
                game.viruses.splice(i, 1);
            }
            break;
        }
    }
}

// Eliminate a virus
function eliminateVirus(virus) {
    game.dna += virus.dnaValue * game.upgrades.dnaBoost;
    game.virusesEliminated++;
    game.vaccineProgress += 2;

    // Create more particles
    for (let i = 0; i < 20; i++) {
        game.particles.push(new Particle(virus.x, virus.y, virus.color));
    }

    updateUI();
}

// Handle upgrades
function handleUpgrade(type) {
    let cost;
    
    switch(type) {
        case 'click-power':
            cost = game.upgradeCosts.clickPower;
            if (game.dna >= cost) {
                game.dna -= cost;
                game.upgrades.clickPower += 0.5;
                game.upgradeCosts.clickPower = Math.ceil(game.upgradeCosts.clickPower * 1.5);
            }
            break;
        case 'dna-boost':
            cost = game.upgradeCosts.dnaBoost;
            if (game.dna >= cost) {
                game.dna -= cost;
                game.upgrades.dnaBoost += 0.3;
                game.upgradeCosts.dnaBoost = Math.ceil(game.upgradeCosts.dnaBoost * 1.5);
            }
            break;
        case 'slow-growth':
            cost = game.upgradeCosts.growthSlow;
            if (game.dna >= cost) {
                game.dna -= cost;
                game.upgrades.growthSlow += 0.2;
                game.upgradeCosts.growthSlow = Math.ceil(game.upgradeCosts.growthSlow * 1.5);
            }
            break;
        case 'auto-damage':
            cost = game.upgradeCosts.autoDamage;
            if (game.dna >= cost) {
                game.dna -= cost;
                game.upgrades.autoDamage += 1;
                game.upgradeCosts.autoDamage = Math.ceil(game.upgradeCosts.autoDamage * 1.5);
            }
            break;
    }

    updateUpgradeButtons();
    updateUI();
}

// Use vaccine (clear screen)
function useVaccine() {
    if (game.dna >= 100) {
        game.dna -= 100;
        
        // Create massive particle effect
        game.viruses.forEach(virus => {
            for (let i = 0; i < 30; i++) {
                game.particles.push(new Particle(virus.x, virus.y, '#10b981'));
            }
            game.dna += virus.dnaValue * 0.5; // Partial refund
        });

        game.viruses = [];
        game.vaccineProgress = Math.min(100, game.vaccineProgress + 30);
        
        updateUI();
    }
}

// Level up
function levelUp() {
    game.level++;
    game.virusesEliminated = 0;
    game.spawnInterval = Math.max(1000, game.spawnInterval - 100);
    
    // Show level up message
    const ctx = game.ctx;
    ctx.save();
    ctx.font = 'bold 40px Arial';
    ctx.fillStyle = '#10b981';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 15;
    ctx.fillText(`关卡 ${game.level} 完成! 🎉`, game.canvas.width / 2, game.canvas.height / 2);
    ctx.restore();

    setTimeout(() => {
        spawnVirus();
        spawnVirus();
    }, 1000);

    updateUI();
}

// Toggle pause
function togglePause() {
    game.paused = !game.paused;
    document.getElementById('pause-btn').textContent = game.paused ? '继续' : '暂停';
}

// Game over
function gameOver(victory) {
    game.running = false;
    document.getElementById('start-btn').disabled = false;
    document.getElementById('pause-btn').disabled = true;

    const modal = document.getElementById('game-over-modal');
    const title = document.getElementById('modal-title');
    const message = document.getElementById('modal-message');

    if (victory) {
        title.textContent = '🎉 胜利！🎉';
        message.textContent = `你成功研发出疫苗并拯救了世界！\n关卡: ${game.level}\n消灭病毒: ${game.virusesEliminated}\n收集DNA: ${Math.floor(game.dna)}`;
    } else {
        title.textContent = '💀 游戏结束 💀';
        message.textContent = `病毒数量超载！世界被吞噬...\n关卡: ${game.level}\n消灭病毒: ${game.virusesEliminated}\n收集DNA: ${Math.floor(game.dna)}`;
    }

    modal.classList.add('active');
}

// Restart game
function restartGame() {
    // Reset game state
    game.dna = 0;
    game.vaccineProgress = 0;
    game.level = 1;
    game.virusesEliminated = 0;
    game.timeElapsed = 0;
    game.spawnInterval = 2000;
    game.upgrades = {
        clickPower: 1,
        dnaBoost: 1,
        growthSlow: 1,
        autoDamage: 0
    };
    game.upgradeCosts = {
        clickPower: 10,
        dnaBoost: 15,
        growthSlow: 20,
        autoDamage: 25
    };

    updateUpgradeButtons();
    startGame();
}

// Update UI
function updateUI() {
    document.getElementById('dna-count').textContent = Math.floor(game.dna);
    document.getElementById('vaccine-progress').textContent = Math.min(100, Math.floor(game.vaccineProgress)) + '%';
    document.getElementById('level').textContent = game.level;
    document.getElementById('virus-count').textContent = game.viruses.length;

    // Enable/disable vaccine button
    const vaccineBtn = document.getElementById('vaccine-btn');
    vaccineBtn.disabled = game.dna < 100 || !game.running || game.paused;

    updateUpgradeButtons();
}

// Update upgrade buttons
function updateUpgradeButtons() {
    const upgrades = {
        'click-power': { cost: game.upgradeCosts.clickPower, level: game.upgrades.clickPower },
        'dna-boost': { cost: game.upgradeCosts.dnaBoost, level: game.upgrades.dnaBoost },
        'slow-growth': { cost: game.upgradeCosts.growthSlow, level: game.upgrades.growthSlow },
        'auto-damage': { cost: game.upgradeCosts.autoDamage, level: game.upgrades.autoDamage }
    };

    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        const type = btn.dataset.upgrade;
        const upgrade = upgrades[type];
        const costElement = btn.querySelector('.upgrade-cost');
        
        costElement.textContent = `消耗: ${upgrade.cost} DNA (等级 ${upgrade.level.toFixed(1)})`;
        btn.disabled = game.dna < upgrade.cost || !game.running;
    });
}

// Initialize on load
window.addEventListener('load', init);

// Expose game object for debugging
window.game = game;
