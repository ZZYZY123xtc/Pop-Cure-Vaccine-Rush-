/**
 * 🧪 萌萌的关卡提示Toast系统
 * 用于显示特殊机制的温馨提示
 */

export class ToastTips {
    constructor() {
        this.toastElement = document.getElementById('level-tip-toast');
        this.titleElement = document.getElementById('toast-title');
        this.textElement = document.getElementById('toast-text');
        this.iconElement = this.toastElement?.querySelector('.toast-icon');
        this.timeoutId = null;
    }

    /**
     * 显示Toast提示
     * @param {string} title - 提示标题
     * @param {string} text - 提示内容
     * @param {string} icon - 图标emoji（可选）
     * @param {number} duration - 显示时长（毫秒，默认4000）
     */
    show(title, text, icon = '🧪', duration = 4000) {
        if (!this.toastElement) return;

        // 清除之前的定时器
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        // 设置内容
        if (this.titleElement) this.titleElement.textContent = title;
        if (this.textElement) this.textElement.textContent = text;
        if (this.iconElement) this.iconElement.textContent = icon;

        // 显示Toast
        this.toastElement.classList.remove('hidden');
        // 强制重排以触发动画
        void this.toastElement.offsetWidth;
        this.toastElement.classList.add('show');

        // 自动隐藏
        this.timeoutId = setTimeout(() => {
            this.hide();
        }, duration);
    }

    /**
     * 隐藏Toast
     */
    hide() {
        if (!this.toastElement) return;

        this.toastElement.classList.remove('show');
        
        // 动画结束后彻底隐藏
        setTimeout(() => {
            this.toastElement.classList.add('hidden');
        }, 400);
    }

    /**
     * 显示黏液坑提示
     */
    showMucusPitTip() {
        this.show(
            '🧪 黏液保护机制',
            '小心！病毒躲进绿色黏液坑后会被保护并减速，你无法消灭它们。耐心等它们游出来吧！',
            '🧪',
            5000
        );
    }

    /**
     * 显示夜战模式提示
     */
    showNightModeTip() {
        this.show(
            '🌑 夜战模式启动',
            '灯光关闭啦~病毒变成霓虹灯了！使用闪电技能会有超炫的闪光效果哦~',
            '🌑',
            5000
        );
    }

    /**
     * 显示漩涡提示
     */
    showVortexTip() {
        this.show(
            '🌀 漩涡吸引力场',
            '中心的漩涡会不断吸引病毒！小心别让它们聚在一起~',
            '🌀',
            5000
        );
    }

    /**
     * 显示风力提示
     */
    showWindTip() {
        this.show(
            '🌬️ 强风环境',
            '注意！横向的强风会吹动病毒~预判它们的移动轨迹才能精准消灭！',
            '🌬️',
            5000
        );
    }

    /**
     * 显示Boss战提示
     */
    showBossTip() {
        this.show(
            '👑 Boss降临',
            '超级大病毒出现啦！小心它会召唤小怪治疗自己~优先清理小怪！',
            '👑',
            6000
        );
    }

    showTurbulenceTip() {
        this.show(
            '🌪️ 气旋湍流',
            '咳嗽气流让病毒走S型轨迹~请预判它们的飘忽走位！',
            '🌪️',
            6000
        );
    }

    showFogTip() {
        this.show(
            '🌫️ 香芋迷雾',
            '呼吸水汽遮挡视野~只能看到雾中闪烁的眼睛！凭记忆预判吧！',
            '🌫️',
            6000
        );
    }

    showPortalTip() {
        this.show(
            '🌌 肺泡传送阵',
            '病毒会通过传送门瞬移~警惕突然出现的Jump-scare！',
            '🌌',
            6000
        );
    }

    showTetheredTip() {
        this.show(
            '🔗 双子羁绊',
            '连体病毒！必须2秒内连击消灭，否则会复活！',
            '🔗',
            6000
        );
    }

    showTaroBossTip() {
        this.show(
            '👑 香芋大魔王',
            '拦截外卖！阻止小病毒投喂Boss~Boss会8字形移动并变大！',
            '👑',
            7000
        );
    }
}

// 导出单例
export const toastTips = new ToastTips();
