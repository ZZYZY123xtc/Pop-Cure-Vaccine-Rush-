export const LEVELS = [
    {
        id: 1,
        description: "Level 1: 初次接触",
        goal: 15,
        threshold: 30,
        spawnInterval: 2000,
        availableTypes: ['A'],
        difficulty: 1.0,
        intro: 'A'  // 首次出现病毒 A
    },
    {
        id: 2,
        description: "Level 2: 变异出现",
        goal: 30,
        threshold: 55,
        spawnInterval: 1600,
        availableTypes: ['A', 'B'],
        difficulty: 1.2,
        intro: 'B'  // 首次出现病毒 B
    },
    {
        id: 3,
        description: "Level 3: 多元威胁",
        goal: 50,
        threshold: 75,
        spawnInterval: 1200,
        availableTypes: ['A', 'B', 'C'],
        difficulty: 1.4,
        intro: 'C'  // 首次出现病毒 C
    },
    {
        id: 4,
        description: "Level 4: 疯狂繁殖",
        goal: 70,
        threshold: 100,
        spawnInterval: 900,
        availableTypes: ['A', 'B', 'C'],
        difficulty: 1.6
    },
    {
        id: 5,
        description: "Level 5: 终极对抗",
        goal: 100,
        threshold: 120,
        spawnInterval: 600,
        availableTypes: ['A', 'B', 'C'],
        difficulty: 2.0
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
