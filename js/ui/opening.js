/**
 * 开场动画引擎 - 生物扫描仪风格
 */
import { STORY_DATA } from '../data/story.js';

export class OpeningScene {
    constructor(onComplete) {
        this.onComplete = onComplete;
        this.container = document.getElementById('story-layer');
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
        // ✅ 使用 canvas 逻辑尺寸而不是 window.innerWidth/Height
        // 这样气泡范围和实际绘制区域匹配
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: Math.random() * rect.width,
            y: rect.height + Math.random() * 100,
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
        
        // ✅ 可见性由 LayerManager 控制，不在这里操作
        // this.container.classList.remove('hidden');
        // ✅ Canvas 尺寸由 ViewportManager 统一管理，不再手动 resize
        // window.addEventListener('resize', () => this.resize());
        
        this.animateBackground();
        this.showSlide(0);
    }

    // ❌ 已废弃：Canvas 尺寸由 ViewportManager 管理
    // resize() {
    //     this.canvas.width = window.innerWidth;
    //     this.canvas.height = window.innerHeight;
    // }

    // --- 核心：动态背景绘制 ---
    animateBackground() {
        // ✅ 使用逻辑尺寸（CSS 尺寸），而不是物理像素
        // ViewportManager 已经对 ctx 应用了 scale(dpr, dpr)
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = rect.width || parseFloat(this.canvas.style.width) || this.canvas.width / dpr;
        const displayHeight = rect.height || parseFloat(this.canvas.style.height) || this.canvas.height / dpr;
        
        this.ctx.clearRect(0, 0, displayWidth, displayHeight);
        
        // 1. 渐变背景（模拟身体内部）
        const gradient = this.ctx.createLinearGradient(0, 0, 0, displayHeight);
        gradient.addColorStop(0, '#FFF0F5'); // 浅粉
        gradient.addColorStop(1, '#FFE4E1'); // 深粉
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, displayWidth, displayHeight);

        // 2. 绘制 DNA 气泡
        this.ctx.fillStyle = '#FFB7B2';
        this.bubbles.forEach(b => {
            b.y -= b.speed;
            if (b.y < -50) {
                b.y = displayHeight + 50;
                b.x = Math.random() * displayWidth; // 重新随机x位置
            }
            
            this.ctx.globalAlpha = b.alpha;
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1.0;

        // 3. 绘制科技感扫描线
        this.scanY += 2;
        if (this.scanY > displayHeight) this.scanY = 0;
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.scanY);
        this.ctx.lineTo(displayWidth, this.scanY);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // 扫描线拖尾
        const scanGrad = this.ctx.createLinearGradient(0, this.scanY - 50, 0, this.scanY);
        scanGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        scanGrad.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
        this.ctx.fillStyle = scanGrad;
        this.ctx.fillRect(0, this.scanY - 50, displayWidth, 50);

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
        // ✅ 可见性由 LayerManager 控制，不在这里操作
        // this.container.classList.add('hidden');
        if (this.onComplete) this.onComplete();
    }
}
