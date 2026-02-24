/**
 * 游戏剧情和教学文案数据
 */

// 开场剧情（动态演出版�?
export const STORY_DATA = {
    OPENING: [
        {
            title: "🔬 系统启动中..",
            text: "实习指挥官，欢迎来到【免疫防御指挥中心】！\n我是你的AI助手 MEDI-01。\n现在正在扫描宿主的生命体征.."
        },
        {
            title: "⚠️ 警报",
            text: "检测到异常！大量【果冻病毒】正在宿主体内快速繁殖！\n它们会不断分裂、越来越多..\n如果不及时清除，宿主的免疫系统将会崩溃！"
        },
        {
            title: "🎯 任务指引",
            text: "请拿起你的【泡泡消灭枪】，点击消灭这些病毒。\n记住：收集核酸数据达到100%，就能触发全屏净化光波！\n准备好了吗？让我们开始吧！"
        }
    ]
};

// 新手引导配置（锚点定位系统）
export const TUTORIAL_STEPS = [
    {
        id: 1,
        title: "👆 点击消除病毒",
        text: "看！这里有一只不动的果冻病毒！",
        tip: "💡 快点击它来收集【核酸数据】！",
        anchor: { type: 'virus', target: 'tutorialVirus' },
        placement: 'bottom',  // ✅ 气泡在病毒下方，箭头指向上方病毒
        buttonText: "知道了"
    },
    {
        id: 2,
        title: "\uD83D\uDCC8 \u75AB\u82D7\u7814\u53D1\u8FDB\u5EA6",
        text: "\u6BCF\u6D88\u706D\u4E00\u4E2A\u75C5\u6BD2\uFF0C\u5C31\u4F1A\u6536\u96C6\u5230\u4E00\u70B9\u3010\u6838\u9178\u6570\u636E\u3011\u3002\n\u6536\u96C6\u6838\u9178\u6570\u636E\u52A9\u529B\u75AB\u82D7\u7814\u7A76\uFF0C\u8FDB\u5EA6\u6EE1\u683C\u5C31\u80FD\u201C\u4E00\u4E3E\u6E05\u5C4F\u201D\uFF01\u2728",
        tip: "\uD83D\uDCCC \u9876\u90E8\u8FDB\u5EA6\u6761\u5C31\u662F\u75AB\u82D7\u7814\u53D1\u8FDB\u5EA6\u6761",
        anchor: { type: 'element', target: 'vaccine-progress' },
        placement: 'bottom',
        buttonText: "\u660E\u767D\u4E86 \u2192"
    },
    {
        id: 3,
        title: "⚠️ 感染警报",
        text: "病毒数量增加会提高【感染风险】！",
        tip: "💡 底部感染条满了就会失败！",
        anchor: { type: 'element', target: 'infection-bar-footer' },
        placement: 'top',
        buttonText: "我知道了"
    },
    {
        id: 4,
        title: "⏱️ 病毒会分裂！",
        text: "看到周围的【圈圈】了吗？那是繁殖倒计时！",
        tip: "💥 圈圈跑完前必须消灭它，否则会分裂成两个！",
        anchor: { type: 'virus', target: 'tutorialVirus' },
        placement: 'bottom',  // 气泡在病毒下方，避免遮挡
        buttonText: "开始游戏！"
    }
];

// 敌人图鉴
export const ENEMY_GUIDE = {
    'A': {
        name: "草莓冠状体(Type A)",
        hp: 1,
        desc: "基础病原体。虽然行动缓慢，但会不断呼吸分裂！",
        weakness: "只需要点击1次！",
        danger: 1 // 星级
    },
    'B': {
        name: "蓝莓聚合体(Type B)",
        hp: 2,
        desc: "拥有厚实的细胞壁，普通的攻击难以穿透！",
        weakness: "⚠️ 必须连续点击 2 次！",
        danger: 2
    },
    'C': {
        name: "柠檬手雷(Type C)",
        hp: 1,
        desc: "极速变异体！高速旋转移动，极难捕捉！",
        weakness: "它速度极快，必须优先击杀！",
        danger: 3
    },
    'D': {
        name: "分裂双核心(Type D)",
        hp: 1,
        desc: "极其狡猾的绿色变种，被打败后不会轻易消失！",
        weakness: "💣 死亡后会分裂成两个小怪！",
        danger: 3
    }
};

// 技能图鉴
export const SKILL_GUIDE = {
    'freeze': {
        name: "极寒领域 (Absolute Zero)",
        type: "主动技 (Active)",
        cd: "45秒",
        desc: "释放冷冻力场，瞬间冻结全屏病毒5秒！病毒将停止移动和分裂，给你宝贵的喘息时间。",
        icon: "🧊"
    },
    'lightning': {
        name: "连环闪电 (Chain Lightning)", 
        type: "被动技 (Passive)",
        cd: "连击触发",
        desc: "精准连击的奖励！每5次连续击杀自动触发范围闪电，瞬间清除200px内所有病毒！",
        icon: "⚡"
    }
};



