/**
 * ADHD 光譜 - 共用工具函數
 */

const Utils = {
    /**
     * 複製文字到剪貼簿
     * @param {string} text - 要複製的文字
     * @param {HTMLElement} button - 按鈕元素（用於顯示回饋）
     */
    async copyToClipboard(text, button) {
        try {
            // 優先使用現代 API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                // 備援方案：使用舊版 API
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }

            // 顯示成功回饋
            if (button) {
                const originalText = button.textContent;
                button.textContent = '已複製';
                setTimeout(() => {
                    button.textContent = originalText;
                }, 2000);
            }
        } catch (err) {
            console.error('複製失敗:', err);
            if (button) {
                button.textContent = '複製失敗';
                setTimeout(() => {
                    button.textContent = '複製內容';
                }, 2000);
            }
        }
    },

    /**
     * 防抖函數
     * @param {Function} func - 要執行的函數
     * @param {number} wait - 等待時間（毫秒）
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * 節流函數
     * @param {Function} func - 要執行的函數
     * @param {number} limit - 限制時間（毫秒）
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * 平滑滾動到指定元素
     * @param {string} selector - 目標元素的選擇器
     * @param {number} offset - 滾動偏移量（預設 0）
     */
    scrollTo(selector, offset = 0) {
        const element = document.querySelector(selector);
        if (element) {
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    },

    /**
     * 格式化日期為繁體中文格式
     * @param {Date|string} date - 日期物件或字串
     * @returns {string} 格式化後的日期字串
     */
    formatDate(date) {
        const d = new Date(date);
        return d.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    /**
     * 檢查元素是否在視窗中可見
     * @param {HTMLElement} element - 要檢查的元素
     * @returns {boolean}
     */
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    /**
     * 取得 URL 參數
     * @param {string} name - 參數名稱
     * @returns {string|null} 參數值
     */
    getUrlParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
};

// 匯出供其他模組使用
window.Utils = Utils;
