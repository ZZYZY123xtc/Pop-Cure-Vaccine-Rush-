export const CONFIG = {
    // --- 关卡制参数 ---
    LEVEL_GOAL: 50,                    // 本关需要消除的病毒总数
    INFECTION_THRESHOLD: 100,          // 感染阈值（屏幕上病毒达到此数量即失败）
    
    // 初始生成速度
    SPAWN_INTERVAL: 1200,              // 1.2秒生成一个病毒
    INITIAL_SPAWN_COUNT: 3,            // 开局生成 3 个病毒

    // 难度曲线
    DIFFICULTY: {
        rampUpInterval: 8000,          // 每 8 秒增加一次难度
        spawnRateDecrease: 80,         // 每次减少生成间隔
        minSpawnRate: 300              // 最快生成间隔
    },
    
    // 游戏状态枚举
    GAME_STATE: {
        PLAYING: 'playing',
        PAUSED: 'paused',
        WON: 'won',
        LOST: 'lost'
    },

    VIRUS_TYPES: {
        // Type A: 草莓冠状糖 - 基础兵 (Basic)
        A: {
            color: '#FF9AA2', 
            radius: 16, 
            speed: 1.5,  // 标准化速度：基础型
            hp: 1, 
            splitTime: 3500,
            splitCount: 2,
            cureValue: 1  // 治愈贡献值：最基础
        },
        // Type B: 蓝莓厚壁菌 - 肉盾 (Split)
        B: {
            color: '#B5EAD7', 
            radius: 24, // 更大，六边形
            speed: 1.0,  // 标准化速度：缓慢型
            hp: 2, 
            splitTime: 6000, 
            splitCount: 2,
            cureValue: 2  // 治愈贡献值：需要点两次，奖励2倍
        },
        // Type C: 柠檬三角 - 极速 (Fast)
        C: {
            color: '#FFDAC1', 
            radius: 20,
            speed: 2.8,  // 标准化速度：快速型（从4.0降低）
            hp: 1, 
            splitTime: 1800,
            splitCount: 2,
            cureValue: 3  // 治愈贡献值：速度极快最难抓，奖励3倍
        }
    }
};