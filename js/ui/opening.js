/**
 * 开场动画引擎 - 生物扫描仪风格
 */
import { STORY_DATA } from '../data/story.js';

export class OpeningScene {
    constructor(onComplete) {
        this.onComplete = onComplete;
        this.container = document.getElementById('story-screen');
        this.canvas = document.getElementById('story-canvas');
        
        // 错误检查
        if (!this.container || !this.canvas) {
            console.error('开场动画元素未找到！', {
                container: this.container,
                canvas: this.canvas
            });
            this.initialized = false;
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        this.titleEl = document.getElementById('story-title');
        this.textEl = document.getElementById('story-text');
        this.btnEl = document.getElementById('story-next-btn');
        
        // 检查所有必需元素
        if (!this.titleEl || !this.textEl || !this.btnEl) {
            console.error('开场动画文本元素未找到！', {
                titleEl: this.titleEl,
                textEl: this.textEl,
                btnEl: this.btnEl
            });
            // 如果元素缺失，跳过初始化
            this.initialized = false;
            return;
        }
        
        this.initialized = true;
        this.currentIndex = 0;
        this.charIndex = 0;
        this.isTyping = false;
        this.typingSpeed = 50; // 打字速度（ms）
        this.animationId = null;
        
        // 背景气泡粒子
        this.bubbles = [];
        for (let i = 0; i < 20; i++) {
            this.bubbles.push(this.createBubble());
        }
        
        // 扫描线位置
        this.scanY = 0;

        // 绑定点击事件
        this.btnEl.onclick = () => this.nextStep();
        
        // 响应点击屏幕加速打字
        this.container.onclick = (e) => {
            if (e.target !== this.btnEl && this.isTyping) {
                this.finishTyping();
            }
        };
    }

    createBubble() {
        return {
            x: Math.random() * window.innerWidth,
            y: window.innerHeight + Math.random() * 100,
            r: Math.random() * 10 + 5,
            speed: Math.random() * 1 + 0.5,
            alpha: Math.random() * 0.5 + 0.1
        };
    }

    start() {
        if (!this.initialized || !this.container || !this.canvas || !this.ctx) {
            console.error('无法启动开场动画，元素缺失或初始化失败');
            if (this.onComplete) this.onComplete();
            return;
        }
        
        this.container.classList.remove('hidden');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.animateBackground();
        this.showSlide(0);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    // --- 核心：动态背景绘制 ---
    animateBackground() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 1. 渐变背景（模拟身体内部）
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#FFF0F5'); // 浅粉
        gradient.addColorStop(1, '#FFE4E1'); // 深粉
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. 绘制 DNA 气泡
        this.ctx.fillStyle = '#FFB7B2';
        this.bubbles.forEach(b => {
            b.y -= b.speed;
            if (b.y < -50) {
                b.y = this.canvas.height + 50;
                b.x = Math.random() * this.canvas.width; // 重新随机x位置
            }
            
            this.ctx.globalAlpha = b.alpha;
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1.0;

        // 3. 绘制科技感扫描线
        this.scanY += 2;
        if (this.scanY > this.canvas.height) this.scanY = 0;
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.scanY);
        this.ctx.lineTo(this.canvas.width, this.scanY);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // 扫描线拖尾
        const scanGrad = this.ctx.createLinearGradient(0, this.scanY - 50, 0, this.scanY);
        scanGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        scanGrad.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
        this.ctx.fillStyle = scanGrad;
        this.ctx.fillRect(0, this.scanY - 50, this.canvas.width, 50);

        this.animationId = requestAnimationFrame(() => this.animateBackground());
    }

    // --- 打字机逻辑 ---
    showSlide(index) {
        if (index >= STORY_DATA.OPENING.length) {
            this.end();
            return;
        }
        
        const data = STORY_DATA.OPENING[index];
        this.titleEl.textContent = data.title;
        this.fullText = data.text;
        this.textEl.innerHTML = ''; // 清空
        this.charIndex = 0;
        this.isTyping = true;
        this.btnEl.textContent = "跳过打字 ▶"; // 打字时按钮变为加速
        this.btnEl.classList.add('faded'); // 稍微变淡

        this.typeWriter();
    }

    typeWriter() {
        if (!this.isTyping) return;

        if (this.charIndex < this.fullText.length) {
            const char = this.fullText.charAt(this.charIndex);
            // 处理换行符
            this.textEl.innerHTML += (char === '\n') ? '<br>' : char;
            this.charIndex++;
            setTimeout(() => this.typeWriter(), this.typingSpeed);
        } else {
            this.finishTyping();
        }
    }

    finishTyping() {
        this.isTyping = false;
        // 显示完整文本（替换换行符）
        this.textEl.innerHTML = this.fullText.replace(/\n/g, '<br>');
        this.btnEl.textContent = (this.currentIndex === STORY_DATA.OPENING.length - 1) 
            ? "开始任务 🔥" 
            : "继续 ▶";
        this.btnEl.classList.remove('faded');
    }

    nextStep() {
        if (this.isTyping) {
            this.finishTyping(); // 如果还在打字，点击按钮直接显示全字
        } else {
            this.currentIndex++;
            this.showSlide(this.currentIndex);
        }
    }

    end() {
        cancelAnimationFrame(this.animationId);
        this.container.classList.add('hidden');
        if (this.onComplete) this.onComplete();
    }
}
