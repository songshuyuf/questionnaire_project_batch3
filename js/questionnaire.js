// 问卷主逻辑

// 全局变量
let currentIndex = 0;
let responses = [];
let submittedIndices = new Set(); // 记录已提交的图片索引
let currentRatings = {
    valence: null,
    arousal: null
};
let userName = '';
let userGender = '';
let userAge = '';
let userId = ''; // 自动生成的唯一ID（不含时间戳）
let startTime = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async function() {
    await loadImageURLs();
    initializeSAMIcons();
    loadProgress();
    document.getElementById('totalNumber').textContent = CONFIG.IMAGES.length;
});

// 开始问卷
function startQuestionnaire() {
    // 获取用户信息
    userName = document.getElementById('userName').value.trim();
    userGender = document.getElementById('userGender').value;
    userAge = document.getElementById('userAge').value.trim();
    
    // 验证输入
    if (!userName || !userGender || !userAge) {
        alert('请填写所有必填项！');
        return;
    }
    
    if (userAge < 1 || userAge > 120) {
        alert('请输入有效的年龄（1-120）！');
        return;
    }
    
    // 生成唯一ID：只用姓名+性别+年龄（不加时间戳）
    const newUserId = `${userName}_${userGender}_${userAge}`;
    
    // 🆕 检查localStorage里是否有旧数据
    const saved = localStorage.getItem('questionnaireProgress');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            // 如果不是同一个人，清空旧数据
            if (data.userId && data.userId !== newUserId) {
                console.log('检测到不同用户，清空旧数据');
                clearProgress();
                responses = [];
                submittedIndices = new Set();
                currentIndex = 0;
                CONFIG.IMAGES_SHUFFLED = false;
            } else if (data.userId === newUserId) {
                // 同一个人，恢复进度
                console.log('检测到同一用户，恢复进度');
                currentIndex = data.currentIndex || 0;
                responses = data.responses || [];
                if (data.submittedIndices) {
                    submittedIndices = new Set(data.submittedIndices);
                }
                if (data.shuffledOrder) {
                    CONFIG.IMAGES = data.shuffledOrder;
                }
            }
        } catch (e) {
            console.error('读取旧数据失败:', e);
        }
    }
    
    userId = newUserId;
    
    // 记录开始时间
    if (!startTime) {
        startTime = new Date();
    }
    
    // 根据用户信息生成随机种子（固定的）
    const seedString = `${userName}${userGender}${userAge}`;
    const seed = stringToSeed(seedString);
    
    // 如果还没有随机打乱过（或者是新用户），打乱图片顺序
    if (!CONFIG.IMAGES_SHUFFLED) {
        CONFIG.IMAGES = seededShuffle(CONFIG.IMAGES, seed);
        CONFIG.IMAGES_SHUFFLED = true;
        console.log(`用户 ${userName} 的图片顺序已随机打乱（种子：${seed}）`);
    }
    
    // 切换到问卷页面
    showPage('questionnairePage');
    loadImage(currentIndex);
}

// 初始化SAM图标
function initializeSAMIcons() {
    createSAMScale('valenceIcons', 'valence');
    createSAMScale('arousalIcons', 'arousal');
}

// 创建SAM量表
function createSAMScale(containerId, dimension) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    for (let i = 1; i <= 9; i++) {
        const item = document.createElement('div');
        item.className = 'sam-item';
        item.dataset.dimension = dimension;
        item.dataset.value = i;
        item.onclick = () => selectRating(dimension, i);
        
        // 反转图标顺序：1→v5, 2→v5, 3→v4, ..., 9→v1
        const iconIndex = 4 - Math.min(Math.floor((i - 1) / 2), 4);
        
        const icon = document.createElement('img');
        icon.className = 'sam-icon';
        icon.src = CONFIG.SAM_ICONS[dimension][iconIndex];
        icon.alt = `${dimension} ${i}`;
        
        const radio = document.createElement('div');
        radio.className = 'sam-radio';
        
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
    
    const container = document.getElementById(`${dimension}Icons`);
    const items = container.querySelectorAll('.sam-item');
    
    items.forEach((item) => {
        if (parseInt(item.dataset.value) === value) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
    
    updateNavigationButtons();
}

// 加载图片
function loadImage(index) {
    if (index < 0 || index >= CONFIG.IMAGES.length) {
        return;
    }
    
    currentIndex = index;
    
    const imageData = CONFIG.IMAGES[index];
    document.getElementById('stimulusImage').src = imageData.url;
    document.getElementById('imageNumber').textContent = imageData.filename;
    
    updateProgress();
    loadCurrentRatings();
    updateNavigationButtons();
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
            arousal: existingResponse.arousal
        };
        
        ['valence', 'arousal'].forEach(dim => {
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
        currentRatings = {
            valence: null,
            arousal: null
        };
        
        ['valence', 'arousal'].forEach(dim => {
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
    if (!validateCurrentRatings()) {
        alert('请完成所有维度的评分！');
        return;
    }
    
    saveCurrentRatings();
    
    if (currentIndex >= CONFIG.IMAGES.length - 1) {
        submitQuestionnaire();
    } else {
        loadImage(currentIndex + 1);
    }
}

// 验证当前评分
function validateCurrentRatings() {
    return currentRatings.valence !== null &&
           currentRatings.arousal !== null;
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
            timestamp: new Date().toISOString()
        };
    }
}

// 更新导航按钮状态
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    prevBtn.disabled = currentIndex === 0;
    
    if (currentIndex >= CONFIG.IMAGES.length - 1) {
        nextBtn.textContent = '提交问卷';
    } else {
        nextBtn.textContent = '下一张 →';
    }
    
    nextBtn.disabled = !validateCurrentRatings();
}

// 保存进度到本地
function saveProgress() {
    const progressData = {
        userName: userName,
        userGender: userGender,
        userAge: userAge,
        userId: userId,
        currentIndex: currentIndex,
        responses: responses,
        submittedIndices: Array.from(submittedIndices), // 保存已提交的索引
        shuffledOrder: CONFIG.IMAGES,
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
            
            // 🆕 询问是否继续
            if (confirm(`检测到未完成的问卷（${data.userName}, ${data.userGender === 'male' ? '男' : data.userGender === 'female' ? '女' : '其他'}, ${data.userAge}岁，进度：${data.currentIndex + 1}/${CONFIG.IMAGES.length}），是否继续？`)) {
                // 点"确定" - 恢复进度并直接进入问卷
                userName = data.userName;
                userGender = data.userGender;
                userAge = data.userAge;
                userId = data.userId;
                currentIndex = data.currentIndex;
                responses = data.responses || [];
                
                // 恢复已提交的索引
                if (data.submittedIndices) {
                    submittedIndices = new Set(data.submittedIndices);
                }
                
                // 恢复图片顺序
                if (data.shuffledOrder) {
                    CONFIG.IMAGES = data.shuffledOrder;
                    CONFIG.IMAGES_SHUFFLED = true;
                    console.log('已恢复用户的图片顺序');
                }
                
                // 恢复开始时间（如果有）
                if (!startTime) {
                    startTime = new Date();
                }
                
                // 🆕 直接跳转到问卷页面
                showPage('questionnairePage');
                loadImage(currentIndex);
                
                // 同时在欢迎页面填入信息（如果用户返回能看到）
                document.getElementById('userName').value = userName;
                document.getElementById('userGender').value = userGender;
                document.getElementById('userAge').value = userAge;
            }
            // 点"取消" - 不做任何事，停留在欢迎页面
            // localStorage保留，如果用户输入相同信息会继续
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
    if (validateCurrentRatings()) {
        saveCurrentRatings();
    }
    
    // 只统计未提交的数量
    const unsubmittedResponses = responses.filter((r, idx) => 
        r !== null && r !== undefined && !submittedIndices.has(idx)
    );
    
    if (unsubmittedResponses.length === 0) {
        alert('没有新的数据需要提交！');
        return;
    }
    
    const completedCount = responses.filter(r => r !== null && r !== undefined).length;
    
    const confirmed = confirm(
        `您已完成 ${completedCount} / ${CONFIG.IMAGES.length} 张图片的评分。\n` +
        `本次将提交 ${unsubmittedResponses.length} 张新完成的评分。\n\n` +
        `点击"确定"将保存数据。\n` +
        `下次打开问卷可以继续未完成的部分。`
    );
    
    if (!confirmed) {
        return;
    }
    
    showLoading(true);
    
    const submissionData = {
        userName: userName,
        userGender: userGender,
        userAge: userAge,
        userId: userId,
        startTime: startTime.toISOString(),
        endTime: new Date().toISOString(),
        duration: Math.floor((new Date() - startTime) / 1000),
        totalImages: CONFIG.IMAGES.length,
        completedImages: completedCount,
        isPartialSubmission: true,
        responses: unsubmittedResponses // 只提交未提交的
    };
    
    const success = await submitToGoogleSheets(submissionData);
    
    showLoading(false);
    
    if (success) {
        // 标记这些responses为已提交
        unsubmittedResponses.forEach(r => {
            submittedIndices.add(r.imageIndex);
        });
        
        // 保存进度（包括已提交标记）
        saveProgress();
        
        alert(
            `数据保存成功！\n\n` +
            `本次提交：${unsubmittedResponses.length} 张\n` +
            `总完成：${completedCount} / ${CONFIG.IMAGES.length} 张\n` +
            `您的进度已保存，下次可以继续完成。`
        );
    } else {
        alert('数据保存失败，请检查网络连接。您的进度仍保存在本地。');
    }
}

// 提交问卷（完整提交）
async function submitQuestionnaire() {
    showLoading(true);
    
    // 只提交未提交的
    const unsubmittedResponses = responses.filter((r, idx) => 
        r !== null && r !== undefined && !submittedIndices.has(idx)
    );
    
    const submissionData = {
        userName: userName,
        userGender: userGender,
        userAge: userAge,
        userId: userId,
        startTime: startTime.toISOString(),
        endTime: new Date().toISOString(),
        duration: Math.floor((new Date() - startTime) / 1000),
        totalImages: CONFIG.IMAGES.length,
        isPartialSubmission: false,
        completedImages: CONFIG.IMAGES.length,
        responses: unsubmittedResponses.length > 0 ? unsubmittedResponses : responses // 如果有未提交的就提交，否则提交全部
    };
    
    const success = await submitToGoogleSheets(submissionData);
    
    showLoading(false);
    
    if (success) {
        // 清除保存的进度
        clearProgress();
        
        const duration = Math.floor((new Date() - startTime) / 60000);
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

