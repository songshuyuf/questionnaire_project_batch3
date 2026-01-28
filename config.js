// 问卷配置文件
const CONFIG = {
    // Google Sheets Web App URL（部署后填入）
    GOOGLE_SHEETS_URL: 'https://script.google.com/macros/s/AKfycbx3daZshnasE8CCn_S-ETRoE-3i6SkF4CAODN3N2GDd0M94RJXPzLRZnz2w545Q1tGdyg/exec',
    
    // 图片URL列表（从你的GitHub图床）
    IMAGES: [],
    
    // SAM量表配置（只保留愉悦度和唤醒度）
    SAM_SCALES: {
        valence: {
            name: '愉悦度',
            subtitle: '（这张图片让您感到）',
            labels: ['很愉快', '中性', '很不愉快']
        },
        arousal: {
            name: '唤醒度',
            subtitle: '（这张图片让您感到）',
            labels: ['很平静', '中等', '很激动']
        }
    },
    
    // SAM图标路径
    SAM_ICONS: {
        valence: [
            'images/sam/valence/v1.png',
            'images/sam/valence/v2.png',
            'images/sam/valence/v3.png',
            'images/sam/valence/v4.png',
            'images/sam/valence/v5.png'
        ],
        arousal: [
            'images/sam/arousal/a1.png',
            'images/sam/arousal/a2.png',
            'images/sam/arousal/a3.png',
            'images/sam/arousal/a4.png',
            'images/sam/arousal/a5.png'
        ]
    },
    
    // SAM量表等级数（9级）
    SAM_LEVELS: 9
};

// 从JSON加载图片URL
async function loadImageURLs() {
    try {
        const response = await fetch('uploaded_urls/faces_batch1_urls.json');
        if (response.ok) {
            const data = await response.json();
            CONFIG.IMAGES = data.images.map(img => ({
                filename: img.filename,
                url: img.url
            }));
            console.log(`成功加载 ${CONFIG.IMAGES.length} 张图片URL`);
        } else {
            console.error('无法加载图片URL，使用测试数据');
            CONFIG.IMAGES = generateTestImages();
        }
    } catch (error) {
        console.error('加载图片URL失败:', error);
        CONFIG.IMAGES = generateTestImages();
    }
}

// 生成测试图片数据
function generateTestImages() {
    const testImages = [];
    for (let i = 1; i <= 200; i++) {
        const num = String(i).padStart(3, '0');
        testImages.push({
            filename: `A${num}.jpg`,
            url: `https://raw.githubusercontent.com/songshuyuf/questionnaire-images/main/faces_batch1/A${num}.jpg`
        });
    }
    return testImages;
}

// 随机打乱数组（使用种子确保同一用户看到相同顺序）
function seededShuffle(array, seed) {
    const shuffled = [...array];
    
    let random = seed;
    const seededRandom = () => {
        random = (random * 9301 + 49297) % 233280;
        return random / 233280;
    };
    
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
}

// 字符串转数字种子
function stringToSeed(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}