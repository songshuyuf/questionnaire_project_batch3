// 数据处理和提交

// 提交到Google Sheets
async function submitToGoogleSheets(data) {
    try {
        const formattedData = flattenResponses(data);
        
        // 更新加载提示文字
        const loadingText = document.querySelector('.loading-overlay p');
        if (loadingText) {
            loadingText.textContent = `正在提交${data.responses.length}张图片的数据，请稍候（约需1-2分钟）...`;
        }
        
        // 发送请求（no-cors模式无法读取响应）
        fetch(CONFIG.GOOGLE_SHEETS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formattedData)
        }).catch(err => {
            console.log('发送请求（no-cors模式）');
        });
        
        // 等待80秒（1分20秒），给Google Sheets充足的处理时间
        await new Promise(resolve => setTimeout(resolve, 80000));
        
        console.log('数据已提交到Google Sheets');
        return true;
        
    } catch (error) {
        console.error('提交失败:', error);
        downloadAsJSON(data);
        return false;
    }
}

// 将嵌套的响应数据展平为表格格式
function flattenResponses(data) {
    const rows = [];
    
    data.responses.forEach(response => {
        rows.push({
            userName: data.userName,
            userGender: data.userGender,
            userAge: data.userAge,
            userId: data.userId,
            timestamp: response.timestamp,
            imageIndex: response.imageIndex + 1,
            filename: response.filename,
            imageUrl: response.url,
            valence: response.valence,
            arousal: response.arousal,
            duration: data.duration,
            isPartialSubmission: data.isPartialSubmission || false,
            completedImages: data.completedImages || data.totalImages
        });
    });
    
    return {
        userName: data.userName,
        userGender: data.userGender,
        userAge: data.userAge,
        userId: data.userId,
        startTime: data.startTime,
        endTime: data.endTime,
        totalDuration: data.duration,
        isPartialSubmission: data.isPartialSubmission || false,
        completedImages: data.completedImages || data.totalImages,
        responses: rows
    };
}

// 下载为JSON文件（备用）
function downloadAsJSON(data) {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `questionnaire_${data.userId}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('数据已下载为JSON文件');
}
