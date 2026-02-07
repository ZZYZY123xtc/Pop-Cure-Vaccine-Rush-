// 🌸 章节配置：沉浸式呼吸感背景
export const CHAPTER_CONFIG = {
    1: {
        id: 1,
        title: "CHAPTER 01",
        subtitle: "鼻腔防线 / Nasal Defense",
        // 渐变背景色：从上到下 🌸
        bgGradientStart: "#FFF5F7", // 极浅粉
        bgGradientEnd: "#FFD1DC",   // 樱花粉
        // 装饰粒子颜色 ✨
        particleColor: "rgba(255, 255, 255, 0.6)",
        // 关卡节点颜色
        nodeColor: "#88D8B0", // 现有的绿色
        // 气氛：轻松、通透
        atmosphere: "轻松、通透的鼻腔环境"
    },
    2: {
        id: 2,
        title: "CHAPTER 02", 
        subtitle: "咽喉重地 / Throat Zone",
        // 稍微深一点的红色，暗示发炎，但要柔和 🩷
        bgGradientStart: "#FFF0F0", 
        bgGradientEnd: "#FFB7B2",   // 柔和红
        particleColor: "rgba(255, 255, 255, 0.4)",
        nodeColor: "#FF9AA2", // 节点变红
        // 气氛：稍微温暖（轻微发炎）
        atmosphere: "温暖的咽喉区域"
    }
};

export const LEVELS = [
    {
        id: 1,
        chapter: 1, // 🌸 章节 1：鼻腔防线
        description: "初次接触 - 点击红色病毒，熟悉操作。",
        goal: 6,
        threshold: 30,
        spawnInterval: 2000,
        availableTypes: ['A'],  // 只有基础型
        difficulty: 1.0,
        intro: 'A',
        mapConfig: { x: 0.2, y: 0.15, icon: 'level' } // 重新布局
    },
    {
        id: 2,
        chapter: 1, // 🌸 章节 1：鼻腔防线
        description: "分裂变异 - 蓝色病毒死后会分裂，注意补刀！",
        goal: 25,
        threshold: 50,
        spawnInterval: 1600,
        availableTypes: ['A', 'B'],  // 引入分裂型
        difficulty: 1.3,
        intro: 'B',
        mapConfig: { x: 0.5, y: 0.45, icon: 'level' } // 中间位置
    },
    {
        id: 3,
        chapter: 1, // 🌸 章节 1：鼻腔防线
        description: "高速入侵 - 黄色病毒移动很快，集中注意力！",
        goal: 50,  // 压力测试关卡
        threshold: 70,
        spawnInterval: 1300,
        availableTypes: ['A', 'B', 'C'],  // 全部类型，压力最大
        difficulty: 1.0,
        intro: 'C',
        mapConfig: { x: 0.8, y: 0.75, icon: 'level' } // 右下角
    },
    {
        id: 4,
        chapter: 1, // 🌸 章节 1：鼻腔防线
        description: "低温防御 - 敌人太多？使用【冰冻】让全场静止！",
        goal: 75,
        threshold: 90,
        spawnInterval: 900,
        availableTypes: ['A', 'B', 'C'],
        difficulty: 1.0,
        reward: 'freeze',  // 🎁 解锁冰冻技能
        skillIntro: 'freeze',
        mapConfig: { x: 0.3, y: 0.25, icon: 'chest' } // 第一章左上
    },
    {
        id: 5,
        chapter: 1, // 🌸 章节 1：鼻腔防线
        description: "喷嚏风暴 - 最终防线！激活【纳米闪电】清除所有威胁！",
        goal: 100,
        threshold: 110,
        spawnInterval: 600,
        availableTypes: ['A', 'B', 'C'],
        difficulty: 1.0,
        reward: 'lightning',  // ⚡ 解锁闪电连击
        skillIntro: 'lightning',
        mapConfig: { x: 0.7, y: 0.65, icon: 'boss' } // 章节 2 的右下 Boss 战
    }
];

// 工具函数：获取关卡数据
export function getLevel(index) {
    return LEVELS[index] || null;
}

// 工具函数：检查是否有下一关
export function hasNextLevel(index) {
    return index + 1 < LEVELS.length;
}

// 工具函数：获取下一关
export function getNextLevel(index) {
    return getLevel(index + 1);
}

// 工具函数：获取总关卡数
export function getTotalLevels() {
    return LEVELS.length;
}

// 🌸 新增：章节相关工具函数
export function getChapterLevels(chapterId) {
    return LEVELS.filter(level => level.chapter === chapterId);
}

export function getLevelChapter(levelId) {
    const level = LEVELS.find(l => l.id === levelId);
    return level ? level.chapter : 1;
}

export function getChapterCount() {
    return Object.keys(CHAPTER_CONFIG).length;
}
