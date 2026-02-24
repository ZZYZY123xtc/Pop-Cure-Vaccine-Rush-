
// 🌸 章节配置：马卡龙萌系微观世界五部曲
export const CHAPTER_CONFIG = {
    1: {
        id: 1,
        title: "CHAPTER 01",
        subtitle: "樱花鼻腔 / Sakura Nasal",
        // 软糯樱花粉 🌸
        bgGradientStart: "#FFF5F7", 
        bgGradientEnd: "#FFD1DC",   
        particleColor: "rgba(255, 255, 255, 0.6)",
        nodeColor: "#FFB7C5", 
        atmosphere: "柔软通透的樱花粉色初级防线"
    },
    2: {
        id: 2,
        title: "CHAPTER 02", 
        subtitle: "薄荷气管 / Minty Trachea",
        // 清爽天蓝色/薄荷蓝 🧊 (打破暖色疲劳，引入标志性马卡龙蓝)
        bgGradientStart: "#F0F8FF", // 极浅冰蓝
        bgGradientEnd: "#BCE6FF",   // 马卡龙天蓝
        particleColor: "rgba(255, 255, 255, 0.7)", // 像冷气泡一样
        nodeColor: "#87CEFA", // 亮天蓝
        atmosphere: "清凉如薄荷般的湛蓝微风走廊"
    },
    3: {
        id: 3,
        title: "CHAPTER 03", 
        subtitle: "香芋支气管 / Taro Bronchus",
        // 梦幻香芋紫 🍠 (保留深邃感，但去除压抑，转为萌系神秘)
        bgGradientStart: "#F8F4FF", 
        bgGradientEnd: "#DCD0FF",   
        particleColor: "rgba(255, 255, 255, 0.5)", 
        nodeColor: "#BCA9E8", 
        atmosphere: "幽静神秘的香芋紫色肺部迷宫"
    },
    4: {
        id: 4,
        title: "CHAPTER 04", 
        subtitle: "蜜桃血管 / Peach vessel",
        // 活力蜜桃橘 🍑 (代表营养与血液的高速流动)
        bgGradientStart: "#FFF4E6", 
        bgGradientEnd: "#FFBCA5",   
        particleColor: "rgba(255, 255, 255, 0.6)", 
        nodeColor: "#FF9B73", 
        atmosphere: "活力流淌的蜜桃橘色微观高速路"
    },
    5: {
        id: 5,
        title: "CHAPTER 05", 
        subtitle: "奶油淋巴结 / Vanilla Citadel",
        // 神圣香草黄 🍦 (最终防线的耀眼与温柔)
        bgGradientStart: "#FFFFF0", 
        bgGradientEnd: "#FFF2B2",   
        particleColor: "rgba(255, 255, 255, 0.8)", 
        nodeColor: "#FFD166", 
        atmosphere: "散发着温柔奶香的最终守护圣域"
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
        mapConfig: { x: 0.20, y: 0.85, icon: 'level' } // 🎪 完美S型：左下起点
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
        mapConfig: { x: 0.80, y: 0.68, icon: 'level' } // 🎪 右侧大弯
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
        mapConfig: { x: 0.20, y: 0.50, icon: 'level' } // 🎪 左侧大弯
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
        mapConfig: { x: 0.80, y: 0.32, icon: 'level' } // 🎪 再次回到右侧
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
        mapConfig: { x: 0.50, y: 0.12, icon: 'level' } // 🎪 顶部正中央 (Boss)
    },
    {
        id: 6,
        chapter: 2, // 🩷 章节 2：咽喉重地
        description: "剧烈喘息 - 呼吸气流会吹动病毒！注意风向变化！",
        goal: 120,
        threshold: 120,
        spawnInterval: 800,
        availableTypes: ['A', 'B', 'C'],
        difficulty: 1.2,
        mechanic: 'wind',  // 🌬️ 特殊机制：风力系统
        hasWind: true,
        windConfig: {
            minForce: 300,      // 最小风力（提升3倍）
            maxForce: 900,      // 最大风力（提升3倍）
            duration: 2000,     // 吹风持续时间（毫秒）
            cooldown: 4000      // 停风间隔（毫秒）
        },
        mapConfig: { x: 0.50, y: 0.20, icon: 'level' } // 🎪 章节2起点：顶部中央
    },
    {
        id: 7,
        chapter: 2, // 🩷 章节 2：咽喉重地
        description: "化脓滤泡 - 黏液坑内的病毒无法被点击！小心规划路径！",
        goal: 150,
        threshold: 140,
        spawnInterval: 700,
        availableTypes: ['A', 'B', 'C'],
        difficulty: 1.3,
        mechanic: 'mucusPits',  // 🧪 特殊机制：黏液坑（绝对防御）
        hasMucusPits: true,
        mapConfig: { x: 0.25, y: 0.35, icon: 'level' } // 🎪 S型：左侧弯曲
    },
    {
        id: 8,
        chapter: 2, // 🩷 章节 2：咽喉重地
        description: "深喉暗影 - 夜战模式！病毒变成霓虹灯，闪电照亮黑暗！",
        goal: 180,
        threshold: 160,
        spawnInterval: 650,
        availableTypes: ['A', 'B', 'C'],
        difficulty: 1.4,
        mechanic: 'nightMode',  // 🌑 特殊机制：夜战模式（霓虹病毒 + 闪电闪光）
        isNightMode: true,
        mapConfig: { x: 0.40, y: 0.50, icon: 'level' } // 🎪 S型：中左过渡
    },
    {
        id: 9,
        chapter: 2, // 🩷 章节 2：咽喉重地
        description: "吞咽反射 - 中心漩涡会吸引病毒！避开旋涡中心！",
        goal: 200,
        threshold: 180,
        spawnInterval: 600,
        availableTypes: ['A', 'B', 'C'],
        difficulty: 1.5,
        mechanic: 'vortex',  // 🌪️ 特殊机制：中心漩涡（吸引效果）
        hasVortex: true,
        mapConfig: { x: 0.70, y: 0.60, icon: 'level' } // 🎪 S型：右侧弯曲
    },
    {
        id: 10,
        chapter: 2, // 🩷 章节 2：咽喉重地
        description: "初代首领 - 击败中心的吞噬者！阻止小怪靠近！",
        goal: 1, // Boss战：击败1个Boss
        threshold: 999, // Boss战模式下不使用感染阈值
        spawnInterval: 800,
        availableTypes: ['A', 'B', 'C'],
        difficulty: 1.2,
        mechanic: 'boss',  // 👑 特殊机制：Boss战
        isBossLevel: true,
        bossConfig: {
            maxHp: 100,
            healPerMinion: 2, // 每个小怪回血量
            minionSpeed: 1.5  // 小怪移动速度倍率
        },
        mapConfig: { x: 0.50, y: 0.75, icon: 'boss' } // 🎪 S型终点：中心偏下Boss战
    },
    {
        id: 11,
        chapter: 3, // 🍠 章节 3：支气管深渊
        description: "气旋湍流 - 咳嗽气流让病毒走S型！预判它们的飘忽轨迹！",
        goal: 220,
        threshold: 200,
        spawnInterval: 700,
        availableTypes: ['A', 'B', 'C'],
        difficulty: 1.5,
        mechanic: 'turbulence',  // 🌪️ 特殊机制：气旋湍流（S型走位）
        hasTurbulence: true,
        turbulenceConfig: {
            frequency: 0.003,      // S型振动频率（越大弯曲越快）
            amplitude: 80,         // S型振幅（左右偏移距离）
            gustDuration: 3000,    // 每次气流持续时间（毫秒）
            gustCooldown: 2000,    // 气流间隔时间（毫秒）
            gustForce: 600         // 气流强度（影响视觉特效密度）
        },
        mapConfig: { x: 0.50, y: 0.15, icon: 'level' } // 🎪 第三章起点：顶部中央
    },
    {
        id: 12,
        chapter: 3, // 🍠 章节 3：支气管深渊
        description: "香芋迷雾 - 呼吸水汽遮挡视野！只能看到雾中闪烁的眼睛！",
        goal: 250,
        threshold: 220,
        spawnInterval: 650,
        availableTypes: ['A', 'B', 'C'],
        difficulty: 1.6,
        mechanic: 'fog',  // 🌫️ 特殊机制：香芋迷雾（视野遮挡）
        hasFog: true,
        fogConfig: {
            fadeInDuration: 2000,    // 淡入时间（2秒）
            peakDuration: 2000,      // 峰值持续时间（2秒）
            fadeOutDuration: 2000,   // 淡出时间（2秒）
            clearDuration: 3000,     // 清晰期（3秒）
            maxOpacity: 0.85         // 最大不透明度
        },
        mapConfig: { x: 0.25, y: 0.25, icon: 'level' } // 🎪 左上
    },
    {
        id: 13,
        chapter: 3, // 🍠 章节 3：支气管深渊
        description: "肺泡传送阵 - 病毒会传送！警惕空间跳跃的Jump-scare！",
        goal: 280,
        threshold: 240,
        spawnInterval: 600,
        availableTypes: ['A', 'B', 'C'],
        difficulty: 1.7,
        mechanic: 'portal',  // 🌌 特殊机制：马卡龙传送门（空间跳跃）
        hasPortals: true,
        portalConfig: {
            portals: [
                { id: 'A', x: 0.15, y: 0.15, linkedTo: 'B' },  // 左上角 → 右下角
                { id: 'B', x: 0.85, y: 0.85, linkedTo: 'A' },  // 右下角 → 左上角
                { id: 'C', x: 0.85, y: 0.15, linkedTo: 'D' },  // 右上角 → 左下角
                { id: 'D', x: 0.15, y: 0.85, linkedTo: 'C' },  // 左下角 → 右上角
                { id: 'E', x: 0.50, y: 0.30, linkedTo: 'F' },  // 中上 → 中下
                { id: 'F', x: 0.50, y: 0.70, linkedTo: 'E' }   // 中下 → 中上
            ],
            radius: 40,              // 传送门半径
            detectionRadius: 50,     // 触发传送的检测半径
            cooldownPerVirus: 500    // 每个病毒传送后的冷却时间（毫秒）
        },
        mapConfig: { x: 0.75, y: 0.25, icon: 'level' } // 🎪 右上
    },
    {
        id: 14,
        chapter: 3, // 🍠 章节 3：支气管深渊
        description: "双子羁绊 - 连体病毒！必须2秒内连击消灭，否则复活！",
        goal: 300,
        threshold: 260,
        spawnInterval: 550,
        availableTypes: ['A', 'B', 'C'],
        difficulty: 1.8,
        mechanic: 'tethered',  // 🔗 特殊机制：双子羁绊（连击消灭）
        hasTetheredPairs: true,
        tetheredConfig: {
            reviveTime: 2000,        // 复活倒计时（2秒）
            pairSpawnChance: 0.4,    // 40%概率生成羁绊对
            linkColor: {
                normal: ['#FFB7C5', '#BCA9E8'],  // 正常状态：粉紫渐变
                warning: '#FFD700'                // 警告状态：金色
            }
        },
        mapConfig: { x: 0.50, y: 0.40, icon: 'level' } // 🎪 中央偏下
    },
    {
        id: 15,
        chapter: 3, // 🍠 章节 3：支气管深渊
        description: "香芋大魔王 - 拦截外卖！阻止小病毒投喂Boss！",
        goal: 1, // Boss战：击败1个Boss
        threshold: 999,
        spawnInterval: 700,
        availableTypes: ['A', 'B', 'C'],
        difficulty: 1.5,
        mechanic: 'taroBoss',  // 👑 特殊机制：香芋大魔王Boss战
        isBossLevel: true,
        isTaroBoss: true,      // 标记为香芋Boss
        bossConfig: {
            maxHp: 100,          // 降低血量，使难度更合理
            healPerMinion: 3,    // 每吃一个小病毒回血量
            minionSpeed: 1.8,    // 小怪冲向Boss的速度倍率
            movementSpeed: 0.8   // Boss 8字形运动速度
        },
        mapConfig: { x: 0.50, y: 0.65, icon: 'boss' } // 🎪 中央偏下Boss战
    },
    {
        id: 16,
        chapter: 4, // 🍑 章节 4：蜜桃血管
        description: "蜜桃红细胞载具 - 病毒搭载水润红细胞！击落载具后速度激增！",
        goal: 280,
        threshold: 250,
        spawnInterval: 650,
        availableTypes: ['A', 'B', 'C'],
        difficulty: 1.6,
        mechanic: 'rafts',  // 🍑 特殊机制：红细胞载具（第一击击落载具，第二击消灭病毒）
        hasRafts: true,
        raftConfig: {
            spawnChance: 0.3,      // 30%概率生成载具病毒
            speedMultiplier: 1.5,  // 失去载具后速度倍增
            raftColor: 'rgba(255, 140, 150, 0.9)', // 蜜桃粉色
            raftRadius: 1.2,       // 载具半径为病毒的1.2倍
            raftLineWidth: 4       // 甜甜圈线宽
        },
        mapConfig: { x: 0.15, y: 0.75, icon: 'level' } // 🎪 第四章入口：左下区域起点
    },
    {
        id: 17,
        chapter: 4, // 🍑 章节 4：蜜桃血管
        description: "动脉瓣膜 - 果肉般的瓣膜周期开闭！把握时机一网打尽！",
        goal: 300,
        threshold: 270,
        spawnInterval: 600,
        availableTypes: ['A', 'B', 'C'],
        difficulty: 1.7,
        mechanic: 'valves',  // 🍑 特殊机制：周期性瓣膜（病毒堆积与倾泻）
        hasValves: true,
        valveConfig: {
            positions: [0.33, 0.67], // Y轴1/3和2/3位置
            cycleDuration: 5000,     // 5秒一个周期
            closedDuration: 3000,    // 闭合3秒
            openDuration: 2000,      // 打开2秒
            valveColor: 'rgba(255, 140, 150, 0.9)', // 蜜桃粉色
            valveHeight: 8,          // 瓣膜厚度
            valveGap: 100,           // 中间缝隙宽度
            valveRadius: 16          // 圆角半径
        },
        mapConfig: { x: 0.30, y: 0.85, icon: 'level' } // 🎪 向右上弧形移动
    },
    {
        id: 18,
        chapter: 4, // 🍑 章节 4：蜜桃血管
        description: "白细胞巡警 - Q软棉花糖！小心误伤友军会招来惩罚！",
        goal: 320,
        threshold: 290,
        spawnInterval: 580,
        availableTypes: ['A', 'B', 'C'],
        difficulty: 1.8,
        mechanic: 'whiteBloodCells',  // 🍑 特殊机制：白细胞巡警（误击惩罚）
        hasWhiteBloodCells: true,
        wbcConfig: {
            count: 6,                  // 白细胞数量（增加到6个）
            moveSpeed: 0.8,            // 横向游走速度
            color: 'rgba(255, 255, 255, 0.9)', // 正常颜色
            glowColor: '#B0E0E6',      // 淡蓝发光
            hitColor: 'rgba(255, 182, 193, 0.9)', // 受击变粉红
            penaltyVirusCount: 3,      // 误击惩罚病毒数
            penaltySpeedMultiplier: 2.0, // 惩罚病毒速度倍增
            radius: 35                 // 白细胞半径
        },
        mapConfig: { x: 0.55, y: 0.80, icon: 'level' } // 🎪 继续向右移动，略微上升
    },
    {
        id: 19,
        chapter: 4, // 🍑 章节 4：蜜桃血管
        description: "动脉潮汐 - 血流汹涌！车道内病毒暴跌！把握节奏！",
        goal: 340,
        threshold: 300,
        spawnInterval: 550,
        availableTypes: ['A', 'B', 'C'],
        difficulty: 1.9,
        mechanic: 'arterialTides',  // 🍑 特殊机制：动脉潮汐（车道血崩）
        hasArterialTides: true,
        tidesConfig: {
            cycleDuration: 6000,       // 6秒一个完整周期
            warningDuration: 1500,     // 1.5秒预警
            surgeDuration: 1500,       // 1.5秒爆发
            cooldownDuration: 3000,    // 3秒冷却
            laneCount: 3,              // 三车道
            surgeSpeedMultiplier: 4.0, // 爆发时速度×4
            warningColor: 'rgba(255, 192, 203, 0.2)', // 马卡龙浅粉
            surgeColor: 'rgba(255, 105, 180, 0.3)'    // 果冻红
        },
        mapConfig: { x: 0.75, y: 0.70, icon: 'level' } // 🎪 到达右侧弧形顶端
    },
    {
        id: 20,
        chapter: 4, // 🍑 章节 4：蜜桃血管
        description: "凝血巨兽 - 水蜜桃Boss！触手吸血！击杀飞升病毒！",
        goal: 1, // Boss战：击败1个Boss
        threshold: 999,
        spawnInterval: 600,
        availableTypes: ['A', 'B', 'C'],
        difficulty: 2.0,
        mechanic: 'peachThrombusBoss',  // 👑 特殊机制：凝血巨兽Boss战
        isBossLevel: true,
        isPeachThrombusBoss: true,  // 标记为水蜜桃Boss
        bossConfig: {
            maxHp: 100,                // Boss血量
            healPerMinion: 5,          // 每吃一个病毒回血5（降低回血量）
            pullInterval: 3000,        // 每3秒拉扯一个病毒
            pullSpeed: 3.0,            // 拉扯速度
            moveSpeed: 1.0,            // 左右移动速度
            radius: 60,                // Boss半径
            tentacleColor: '#FF66CC',  // 泡泡糖粉
            bodyColor: 'rgba(255, 140, 150, 0.9)' // 蜜桃果冻
        },
        mapConfig: { x: 0.50, y: 0.55, icon: 'boss' } // 🎪 中央偏上，终极Boss战
    },
    {
        id: 21,
        chapter: 5, // 🍦 章节 5：奶油淋巴结
        description: "香草视野 - 浓稠奶油遮罩！用圣光手电筒寻找病毒！",
        goal: 350,
        threshold: 320,
        spawnInterval: 600,
        availableTypes: ['A', 'B', 'C'],
        difficulty: 2.1,
        mechanic: 'vanillaVeil',  // 🍦 特殊机制：视觉剥夺 + 手电筒
        hasVanillaVeil: true,
        veilConfig: {
            overlayColor: 'rgba(255, 255, 240, 0.95)', // 浓稠奶油遮罩
            spotlightRadius: 100,  // 圣光手电筒半径
            spotlightColor: 'rgba(255, 255, 255, 0.1)', // 手电筒边缘柔光
            fadeEdge: 30  // 手电筒边缘羽化距离
        },
        mapConfig: { x: 0.50, y: 0.50, icon: 'level' } // 🎪 第五章起点：中央
    },
    {
        id: 22,
        chapter: 5, // 🍦 章节 5：奶油淋巴结
        description: "神圣气泡 - 金色气泡会劫持病毒上升！⚠️ 注意：如果气泡带病毒逃出屏幕顶部，直接游戏失败！点击气泡解救被劫持的病毒。",
        goal: 370,
        threshold: 340,
        spawnInterval: 560,
        availableTypes: ['A', 'B', 'C'],
        difficulty: 2.2,
        mechanic: 'holyBubbles',  // 🍦 特殊机制：轨迹劫持
        hasHolyBubbles: true,
        bubbleConfig: {
            spawnInterval: 4500,   // 4.5秒生成一个气泡（加快频率）
            bubbleRadius: 40,      // 气泡半径
            riseSpeed: 2.0,        // 上升速度（再次提升到2.0）
            bubbleColor: 'rgba(212, 175, 55, 0.3)', // 金色半透明
            glowColor: '#FFD700',  // 发光颜色
            captureImmunePenalty: 5  // 气泡带病毒离开屏幕的惩罚
        },
        mapConfig: { x: 0.30, y: 0.40, icon: 'level' } // 🎪 左侧路径
    },
    {
        id: 23,
        chapter: 5, // 🍦 章节 5：奶油淋巴结
        description: "神圣节拍 - 只有被波纹扫过、带有金边的病毒可以被击杀！金边仅持续1秒，过期后恢复无敌。不要盲目点击，看准波纹，管理你的收割窗口！",
        goal: 400,
        threshold: 360,
        spawnInterval: 520,
        availableTypes: ['A', 'B', 'C'],
        difficulty: 2.3,
        mechanic: 'sacredBeat',  // 🍦 特殊机制：节奏判定 + 击退
        hasSacredBeat: true,
        beatConfig: {
            pulseInterval: 1500,   // 1.5秒一次心跳
            waveSpeed: 5,          // 波纹扩散速度 (px/frame)
            chargeWindow: 1000,    // 金边仅持续1秒
            warningWindow: 200,    // 末0.2秒闪烁预警
            knockbackDistance: 40, // 错误点击击退距离
            stunDuration: 500,     // 定身0.5秒
            waveColor: 'rgba(212, 175, 55, 0.4)', // 金色波纹
            vulnerableGlow: '#FFFFFF' // 可击杀时的高亮颜色
        },
        mapConfig: { x: 0.70, y: 0.40, icon: 'level' } // 🎪 右侧路径
    },
    {
        id: 24,
        chapter: 5, // 🍦 章节 5：奶油淋巴结
        description: "信仰连结 - 构建防御网！激光连带灭敌！",
        goal: 420,
        threshold: 380,
        spawnInterval: 480,
        availableTypes: ['A', 'B', 'C'],
        difficulty: 2.4,
        mechanic: 'sacredGeometry',  // 🍦 特殊机制：玩家自建防御网
        hasSacredGeometry: true,
        geometryConfig: {
            beaconLifetime: 3000,  // 信标存在3秒
            beaconRadius: 8,       // 信标半径
            beaconColor: 'rgba(212, 175, 55, 0.9)', // 金色信标
            laserColor: 'rgba(255, 215, 0, 0.6)', // 香草激光线
            laserWidth: 3,         // 激光线宽
            minBeaconsForLaser: 2  // 至少2个信标才连线
        },
        mapConfig: { x: 0.50, y: 0.30, icon: 'level' } // 🎪 向上推进
    },
    {
        id: 25,
        chapter: 5, // 🍦 章节 5：奶油淋巴结
        description: "终焉主脑 - 纯Boss战。点击奶油球剥落外壳并顺手拦截残渣；每个残渣逃逸会增加5点免疫负荷。剩余少于15个球时停止喷溅残渣，少于5个球暴露核心，10秒内连点100下击败核心，超时立即失败。",
        initialCount: 0, // 最终关开场不生成基础病毒
        goal: 1, // Boss战：击败1个Boss
        threshold: 100, // 每个残渣逃逸+5负荷，满100失败
        spawnInterval: 999999, // 禁用病毒自动生成，专注Boss机制
        availableTypes: ['A', 'B', 'C'],
        difficulty: 3.0,
        mechanic: 'finalBoss',  // 👑 特殊机制：终焉主脑Boss战
        isBossLevel: true,
        isFinalBoss: true,  // 标记为最终Boss
        bossConfig: {
            maxHp: 150,            // Boss血量（更高）
            ballCount: 45,
            regenerationRate: 3000, // 自然再生改为3秒1个
            debrisSpeed: 2.1,       // 残渣速度下调40%
            coreTimeout: 10000,     // 核心阶段延长到10秒
            phase1Threshold: 75,   // 阶段二触发阈值（50% HP）
            gravityInterval: 4000, // 4秒一次香草重力
            gravityStrength: 2.0,  // 重力吸引强度
            healPerVirus: 8,       // 吞噬病毒回血
            flashInterval: 2000,   // 阶段二：2秒闪烁一次
            decoyCount: 3,         // 虚假分身数量
            decoySpawnViruses: 3,  // 击中分身产生病毒数
            radius: 70,            // Boss半径
            coreColor: '#000000',  // 黑色核心
            armorColor: 'rgba(255, 242, 178, 0.8)' // 奶油装甲
        },
        mapConfig: { x: 0.50, y: 0.15, icon: 'boss' } // 🎪 顶部中央，最终决战
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
