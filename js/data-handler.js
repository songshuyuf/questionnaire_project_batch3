// Google Sheets数据提交

async function submitToGoogleSheets(data) {
    try {
        // 检查是否配置了Google Sheets URL
        if (!CONFIG.GOOGLE_SHEETS_URL || CONFIG.GOOGLE_SHEETS_URL === 'YOUR_GOOGLE_SHEETS_WEB_APP_URL_HERE') {
            console.warn('Google Sheets未配置，数据已保存到本地');
            // 导出为JSON文件作为备份
            downloadAsJSON(data);
            return true;
        }
        
        // 将数据展平为表格格式
        const flattenedData = flattenResponses(data);
        
        // 提交到Google Sheets
        const response = await fetch(CONFIG.GOOGLE_SHEETS_URL, {
            method: 'POST',
            mode: 'no-cors', // Google Apps Script需要这个
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(flattenedData)
        });
        
        console.log('数据提交成功');
        return true;
        
    } catch (error) {
        console.error('提交失败:', error);
        // 导出为JSON文件作为备份
        downloadAsJSON(data);
        return false;
    }
}

// 将嵌套的响应数据展平为表格格式
function flattenResponses(data) {
    const rows = [];
    
    data.responses.forEach(response => {
        rows.push({
            userId: data.userId,
            timestamp: response.timestamp,
            imageIndex: response.imageIndex + 1, // 从1开始
            filename: response.filename,
            imageUrl: response.url,
            valence: response.valence,
            arousal: response.arousal,
            dominance: response.dominance,
            duration: data.duration,
            isPartialSubmission: data.isPartialSubmission || false,
            completedImages: data.completedImages || data.totalImages
        });
    });
    
    return {
        userId: data.userId,
        startTime: data.startTime,
        endTime: data.endTime,
        totalDuration: data.duration,
        isPartialSubmission: data.isPartialSubmission || false,
        completedImages: data.completedImages || data.totalImages,
        responses: rows
    };
}

// 导出为JSON文件
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
    
    console.log('数据已导出为JSON文件');
}

// 导出为CSV文件
function downloadAsCSV(data) {
    let csv = 'User ID,Timestamp,Image Index,Filename,Image URL,Valence,Arousal,Dominance\n';
    
    data.responses.forEach(response => {
        csv += `${data.userId},${response.timestamp},${response.imageIndex + 1},${response.filename},${response.url},${response.valence},${response.arousal},${response.dominance}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `questionnaire_${data.userId}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('数据已导出为CSV文件');
}
