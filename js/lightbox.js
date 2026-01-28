// 图片放大灯箱功能

function openLightbox() {
    const currentImage = document.getElementById('stimulusImage').src;
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    
    lightboxImage.src = currentImage;
    lightbox.classList.add('active');
    
    // 阻止body滚动
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    
    // 恢复body滚动
    document.body.style.overflow = 'auto';
}

// ESC键关闭灯箱
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLightbox();
    }
});

// 阻止lightbox内部点击事件冒泡
document.getElementById('lightboxImage')?.addEventListener('click', function(e) {
    e.stopPropagation();
});