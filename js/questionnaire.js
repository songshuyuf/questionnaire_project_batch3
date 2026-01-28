// 问卷主逻辑

// 全局变量
let currentIndex = 0;
let responses = [];
let currentRatings = {
    valence: null,
    arousal: null,
    dominance: null
};
let userId = '';
let startTime = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async function() {
    // 加载图片URL
    await loadImageURLs();
    
    // 初始化SAM量表图标
    initializeSAMIcons();
    
    // 加载保存的进度
    loadProgress();
    
    // 更新总数
    document.getElementById('totalNumber').textContent = CONFIG.IMAGES.length;
});

// 开始问卷
function startQuestionnaire() {
    // 获取用户ID
    userId = document.getElementById('userId').value.trim() || `USER_${Date.now()}`;
    
    // 记录开始时间
    startTime = new Date();
    
    // 根据用户ID随机打乱图片顺序
    const seed = stringToSeed(userId);
    CONFIG.IMAGES = seededShuffle(CONFIG.IMAGES, seed);
    console.log(`用户 ${userId} 的图片顺序已随机打乱（种子：${seed}）`);
    
    // 切换到问卷页面
    showPage('questionnairePage');
    
    // 加载第一张图片
    loadImage(0);
}

// 初始化SAM图标
function initializeSAMIcons() {
    // 愉悦度
    createSAMScale('valenceIcons', 'valence');
    
    // 唤醒度
    createSAMScale('arousalIcons', 'arousal');
    
    // 支配度
    createSAMScale('dominanceIcons', 'dominance');
}

// 创建SAM量表
function createSAMScale(containerId, dimension) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    for (let i = 1; i <= 9; i++) {  // ← 必须是9！
        const item = document.createElement('div');
        item.className = 'sam-item';
        item.dataset.dimension = dimension;
        item.dataset.value = i;
        item.onclick = () => selectRating(dimension, i);
        
        // 计算对应的图标索引（5个小人对应9个级别）
        const iconIndex = Math.min(Math.floor((i - 1) / 2), 4);
        
        // SAM图标
        const icon = document.createElement('img');
        icon.className = 'sam-icon';
        icon.src = CONFIG.SAM_ICONS[dimension][iconIndex];
        icon.alt = `${dimension} ${i}`;
        
        // 单选圆圈
        const radio = document.createElement('div');
        radio.className = 'sam-radio';
        
        // 数字
        const number = document.createElement('div');
        number.className = 'sam-number';
        number.textContent = i;
        
        item.appendChild(icon);
        item.appendChild(radio);
        item.appendChild(number);
        
        container.appendChild(item);
    }
}

// 选择评分
function selectRating(dimension, value) {
    currentRatings[dimension] = value;
    
    // 更新UI
    const container = document.getElementById(`${dimension}Icons`);
    const items = container.querySelectorAll('.sam-item');
    
    items.forEach((item, index) => {
        if (parseInt(item.dataset.value) === value) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
    
    // 检查是否全部选择
    updateNavigationButtons();
}

// 加载图片
function loadImage(index) {
    if (index < 0 || index >= CONFIG.IMAGES.length) {
        return;
    }
    
    currentIndex = index;
    
    // 更新图片
    const imageData = CONFIG.IMAGES[index];
    document.getElementById('stimulusImage').src = imageData.url;
    document.getElementById('imageNumber').textContent = imageData.filename;
    
    // 更新进度
    updateProgress();
    
    // 加载已有的评分
    loadCurrentRatings();
    
    // 更新导航按钮
    updateNavigationButtons();
    
    // 保存进度
    saveProgress();
}

// 更新进度
function updateProgress() {
    const progress = ((currentIndex + 1) / CONFIG.IMAGES.length * 100).toFixed(1);
    
    document.getElementById('progressBar').style.width = progress + '%';
    document.getElementById('currentNumber').textContent = currentIndex + 1;
    document.getElementById('progressPercent').textContent = progress;
}

// 加载当前图片的评分
function loadCurrentRatings() {
    const existingResponse = responses[currentIndex];
    
    if (existingResponse) {
        currentRatings = {
            valence: existingResponse.valence,
            arousal: existingResponse.arousal,
            dominance: existingResponse.dominance
        };
        
        // 更新UI
        ['valence', 'arousal', 'dominance'].forEach(dim => {
            if (currentRatings[dim]) {
                const container = document.getElementById(`${dim}Icons`);
                const items = container.querySelectorAll('.sam-item');
                items.forEach(item => {
                    if (parseInt(item.dataset.value) === currentRatings[dim]) {
                        item.classList.add('selected');
                    } else {
                        item.classList.remove('selected');
                    }
                });
            }
        });
    } else {
        // 清空评分
        currentRatings = {
            valence: null,
            arousal: null,
            dominance: null
        };
        
        // 清空UI
        ['valence', 'arousal', 'dominance'].forEach(dim => {
            const container = document.getElementById(`${dim}Icons`);
            const items = container.querySelectorAll('.sam-item');
            items.forEach(item => item.classList.remove('selected'));
        });
    }
}

// 上一张
function previousImage() {
    if (currentIndex > 0) {
        saveCurrentRatings();
        loadImage(currentIndex - 1);
    }
}

// 下一张
function nextImage() {
    // 验证当前图片是否已评分
    if (!validateCurrentRatings()) {
        alert('请完成所有三个维度的评分！');
        return;
    }
    
    // 保存当前评分
    saveCurrentRatings();
    
    // 如果是最后一张，提交问卷
    if (currentIndex >= CONFIG.IMAGES.length - 1) {
        submitQuestionnaire();
    } else {
        loadImage(currentIndex + 1);
    }
}

// 验证当前评分
function validateCurrentRatings() {
    return currentRatings.valence !== null &&
           currentRatings.arousal !== null &&
           currentRatings.dominance !== null;
}

// 保存当前评分
function saveCurrentRatings() {
    if (validateCurrentRatings()) {
        responses[currentIndex] = {
            imageIndex: currentIndex,
            filename: CONFIG.IMAGES[currentIndex].filename,
            url: CONFIG.IMAGES[currentIndex].url,
            valence: currentRatings.valence,
            arousal: currentRatings.arousal,
            dominance: currentRatings.dominance,
            timestamp: new Date().toISOString()
        };
    }
}

// 更新导航按钮状态
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    // 上一张按钮
    prevBtn.disabled = currentIndex === 0;
    
    // 下一张按钮
    if (currentIndex >= CONFIG.IMAGES.length - 1) {
        nextBtn.textContent = '提交问卷';
    } else {
        nextBtn.textContent = '下一张 →';
    }
    
    // 如果当前图片未评分，禁用下一张按钮
    nextBtn.disabled = !validateCurrentRatings();
}

// 保存进度到本地
function saveProgress() {
    const progressData = {
        userId: userId,
        currentIndex: currentIndex,
        responses: responses,
        shuffledOrder: CONFIG.IMAGES, // 保存随机顺序
        lastUpdate: new Date().toISOString()
    };
    
    localStorage.setItem('questionnaireProgress', JSON.stringify(progressData));
}

// 加载保存的进度
function loadProgress() {
    const saved = localStorage.getItem('questionnaireProgress');
    
    if (saved) {
        try {
            const data = JSON.parse(saved);
            
            // 询问是否继续
            if (confirm(`检测到未完成的问卷（进度：${data.currentIndex + 1}/${CONFIG.IMAGES.length}），是否继续？`)) {
                userId = data.userId;
                currentIndex = data.currentIndex;
                responses = data.responses || [];
                
                // 恢复用户的随机顺序
                if (data.shuffledOrder) {
                    CONFIG.IMAGES = data.shuffledOrder;
                    console.log('已恢复用户的图片顺序');
                }
                
                document.getElementById('userId').value = userId;
            }
        } catch (e) {
            console.error('加载进度失败:', e);
        }
    }
}

// 清除保存的进度
function clearProgress() {
    localStorage.removeItem('questionnaireProgress');
}

// 保存并退出（提前交卷）
async function saveAndExit() {
    // 保存当前评分
    if (validateCurrentRatings()) {
        saveCurrentRatings();
    }
    
    // 统计已完成的数量
    const completedCount = responses.filter(r => r !== null && r !== undefined).length;
    
    if (completedCount === 0) {
        alert('您还没有完成任何图片的评分！');
        return;
    }
    
    // 确认是否保存并退出
    const confirmed = confirm(
        `您已完成 ${completedCount} / ${CONFIG.IMAGES.length} 张图片的评分。\n\n` +
        `点击"确定"将保存已完成的数据并退出。\n` +
        `下次打开问卷可以继续未完成的部分。`
    );
    
    if (!confirmed) {
        return;
    }
    
    // 显示加载提示
    showLoading(true);
    
    // 准备提交数据（只提交已完成的）
    const completedResponses = responses.filter(r => r !== null && r !== undefined);
    
    const submissionData = {
        userId: userId,
        startTime: startTime.toISOString(),
        endTime: new Date().toISOString(),
        duration: Math.floor((new Date() - startTime) / 1000),
        totalImages: CONFIG.IMAGES.length,
        completedImages: completedCount,
        isPartialSubmission: true, // 标记为部分提交
        responses: completedResponses
    };
    
    // 提交到Google Sheets
    const success = await submitToGoogleSheets(submissionData);
    
    // 隐藏加载提示
    showLoading(false);
    
    if (success) {
        alert(
            `数据保存成功！\n\n` +
            `已完成：${completedCount} / ${CONFIG.IMAGES.length} 张\n` +
            `您的进度已保存，下次可以继续完成。`
        );
        // 不清除进度，允许继续
    } else {
        alert('数据保存失败，请检查网络连接。您的进度仍保存在本地。');
    }
}

// 提交问卷
async function submitQuestionnaire() {
    // 显示加载提示
    showLoading(true);
    
    // 准备提交数据
    const submissionData = {
        userId: userId,
        startTime: startTime.toISOString(),
        endTime: new Date().toISOString(),
        duration: Math.floor((new Date() - startTime) / 1000), // 秒
        totalImages: CONFIG.IMAGES.length,
        responses: responses
    };
    
    // 提交到Google Sheets
    const success = await submitToGoogleSheets(submissionData);
    
    // 隐藏加载提示
    showLoading(false);
    
    if (success) {
        // 清除保存的进度
        clearProgress();
        
        // 显示完成页面
        const duration = Math.floor((new Date() - startTime) / 60000); // 分钟
        document.getElementById('completionTime').textContent = `${duration} 分钟`;
        showPage('completePage');
    } else {
        alert('数据提交失败，请检查网络连接或联系管理员。您的数据已保存在本地。');
    }
}

// 页面切换
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    document.getElementById(pageId).classList.add('active');
}

// 显示/隐藏加载提示
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

