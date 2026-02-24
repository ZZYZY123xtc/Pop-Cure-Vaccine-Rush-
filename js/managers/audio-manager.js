/**
 * AudioManager - 全局音频管理（Web Audio API）
 */

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.bgmGain = null;

        this.buffers = new Map();
        this.manifest = {
            bgm_map: './audio/Neon_Bloom_of_the_Celestial_Bloom.mp3',
            bgm_battle: './audio/Pastel_Reverie.mp3'
        };

        this.currentBGMSource = null;
        this.currentBGMTrack = null;

        this.initialized = false;
        this.isUnlocked = false;
        this.muted = false;
        this.unlockBound = false;

        this.MUTE_STORAGE_KEY = 'game_audio_muted';
    }

    init(manifest = null) {
        if (this.initialized) {
            return;
        }

        if (manifest && typeof manifest === 'object') {
            this.manifest = {
                ...this.manifest,
                ...manifest
            };
        }
        this.muted = localStorage.getItem(this.MUTE_STORAGE_KEY) === '1';

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
            console.warn('[AudioManager] 浏览器不支持 Web Audio API，音频功能降级禁用');
            return;
        }

        this.audioContext = new AudioCtx();

        this.masterGain = this.audioContext.createGain();
        this.bgmGain = this.audioContext.createGain();

        this.bgmGain.gain.value = 0.7;
        this.masterGain.gain.value = this.muted ? 0 : 1;

        this.bgmGain.connect(this.masterGain);
        this.masterGain.connect(this.audioContext.destination);

        this.bindFirstUserGestureUnlock();
        this.preloadAll();

        this.initialized = true;
        console.log('[AudioManager] ✅ 已初始化');
    }

    bindFirstUserGestureUnlock() {
        if (this.unlockBound) {
            return;
        }

        this.unlockBound = true;

        const unlock = async () => {
            await this.unlockAudioContext();

            // 首次用户交互后自动播放地图BGM
            this.playBGM('bgm_map', { fadeIn: 0.5, fadeOut: 0.5 });

            document.removeEventListener('mousedown', unlock);
            document.removeEventListener('touchstart', unlock);
        };

        document.addEventListener('mousedown', unlock, { once: true, passive: true });
        document.addEventListener('touchstart', unlock, { once: true, passive: true });
    }

    async unlockAudioContext() {
        if (!this.audioContext || this.isUnlocked) {
            return;
        }

        try {
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            this.isUnlocked = true;
            console.log('[AudioManager] 🔓 音频上下文已解锁');
        } catch (error) {
            console.warn('[AudioManager] 音频上下文解锁失败:', error);
        }
    }

    async preloadAll() {
        const entries = Object.entries(this.manifest);
        for (const [key, url] of entries) {
            await this.loadBuffer(key, url);
        }
        console.log('[AudioManager] 🎵 音频预加载完成，数量:', this.buffers.size);
    }

    async loadBuffer(key, url) {
        if (!this.audioContext || !url) {
            return;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.warn('[Audio] 未找到音乐文件:', url);
                return;
            }
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.buffers.set(key, audioBuffer);
        } catch (error) {
            console.warn('[Audio] 未找到音乐文件:', url);
        }
    }

    getBuffer(name) {
        return this.buffers.get(name) || null;
    }

    async playBGM(trackName, options = {}) {
        if (!this.audioContext) {
            return;
        }

        await this.unlockAudioContext();

        const nextBuffer = this.getBuffer(trackName);
        if (!nextBuffer) {
            console.warn('[AudioManager] BGM未找到:', trackName);
            return;
        }

        const fadeIn = options.fadeIn ?? 0.5;
        const fadeOut = options.fadeOut ?? 0.5;

        if (this.currentBGMTrack === trackName && this.currentBGMSource) {
            return;
        }

        if (this.currentBGMSource) {
            await this.fadeOutCurrentBGM(fadeOut);
        }

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        source.buffer = nextBuffer;
        source.loop = true;
        gainNode.gain.value = 0;

        source.connect(gainNode);
        gainNode.connect(this.bgmGain);

        source.start();

        const now = this.audioContext.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.exponentialRampToValueAtTime(1.0, now + fadeIn);

        this.currentBGMSource = source;
        this.currentBGMTrack = trackName;
        this.currentBGMGainNode = gainNode;
    }

    async fadeOutCurrentBGM(duration = 0.5) {
        if (!this.currentBGMSource || !this.currentBGMGainNode || !this.audioContext) {
            return;
        }

        const now = this.audioContext.currentTime;
        const gain = this.currentBGMGainNode.gain;
        gain.cancelScheduledValues(now);
        gain.setValueAtTime(Math.max(0.0001, gain.value || 1), now);
        gain.exponentialRampToValueAtTime(0.0001, now + duration);

        const sourceToStop = this.currentBGMSource;
        setTimeout(() => {
            try {
                sourceToStop.stop();
            } catch (error) {
                // ignore
            }
        }, Math.ceil(duration * 1000) + 30);

        this.currentBGMSource = null;
        this.currentBGMTrack = null;
        this.currentBGMGainNode = null;
    }

    async stopBGM(fadeOut = 0.5) {
        await this.fadeOutCurrentBGM(fadeOut);
    }

    toggleMute(forceValue = null) {
        if (!this.masterGain) {
            this.muted = forceValue !== null ? !!forceValue : !this.muted;
            localStorage.setItem(this.MUTE_STORAGE_KEY, this.muted ? '1' : '0');
            return this.muted;
        }

        this.muted = forceValue !== null ? !!forceValue : !this.muted;
        this.masterGain.gain.value = this.muted ? 0 : 1;
        localStorage.setItem(this.MUTE_STORAGE_KEY, this.muted ? '1' : '0');

        return this.muted;
    }

    bindMuteButton(buttonEl) {
        if (!buttonEl) {
            return;
        }

        const updateIcon = () => {
            buttonEl.textContent = this.muted ? '🔇' : '🎵';
            buttonEl.setAttribute('aria-pressed', this.muted ? 'true' : 'false');
            buttonEl.title = this.muted ? '取消静音' : '静音';
        };

        updateIcon();

        buttonEl.addEventListener('click', async () => {
            await this.unlockAudioContext();
            this.toggleMute();
            updateIcon();
        });
    }
}

export const audioManager = new AudioManager();