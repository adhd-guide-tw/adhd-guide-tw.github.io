/**
 * ADHD 光譜 - FAQ 手風琴模組
 */

const Accordion = {
    /**
     * 初始化手風琴功能
     * @param {string} containerSelector - FAQ 項目的選擇器，預設為 '.faq-item'
     */
    init(containerSelector = '.faq-item') {
        const items = document.querySelectorAll(containerSelector);

        if (items.length === 0) {
            return;
        }

        items.forEach(item => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');
            const icon = question?.querySelector('svg');

            if (!question || !answer) return;

            question.addEventListener('click', () => {
                // 關閉所有其他項目
                items.forEach(otherItem => {
                    if (otherItem !== item) {
                        const otherAnswer = otherItem.querySelector('.faq-answer');
                        const otherIcon = otherItem.querySelector('.faq-question svg');
                        if (otherAnswer?.style.maxHeight) {
                            otherAnswer.style.maxHeight = null;
                            otherIcon?.classList.remove('rotate-180');
                        }
                    }
                });

                // 切換當前項目
                if (answer.style.maxHeight) {
                    answer.style.maxHeight = null;
                    icon?.classList.remove('rotate-180');
                } else {
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                    icon?.classList.add('rotate-180');
                }
            });
        });
    }
};

// DOM 載入完成時自動初始化
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.faq-item')) {
        Accordion.init();
    }
});

// 匯出供其他模組使用
window.Accordion = Accordion;
