/**
 * ADHD 光譜 - FAQ 手風琴模組
 *
 * 問題是 <button aria-expanded aria-controls>，鍵盤可以操作；一次只展開一題。
 * 答案收合時由 CSS 的 visibility 藏起來，展開時加上 .is-open 並設 max-height 做動畫。
 * 展開後內容變高（縮放、只放大文字、轉向）時，ResizeObserver 跟著更新 max-height，答案才不會被切掉。
 */

const Accordion = {
    /**
     * 初始化手風琴功能
     * @param {string} containerSelector - FAQ 項目的選擇器，預設為 '.faq-item'
     */
    init(containerSelector = '.faq-item') {
        const items = Array.from(document.querySelectorAll(containerSelector))
            .map((item) => ({
                question: item.querySelector('.faq-question'),
                answer: item.querySelector('.faq-answer'),
            }))
            .filter(({ question, answer }) => question && answer);

        const setOpen = ({ question, answer }, open) => {
            question.setAttribute('aria-expanded', String(open));
            question.querySelector('svg')?.classList.toggle('rotate-180', open);
            answer.classList.toggle('is-open', open);
            answer.style.maxHeight = open ? answer.scrollHeight + 'px' : null;
        };

        const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(() => {
            items.forEach(({ question, answer }) => {
                if (question.getAttribute('aria-expanded') === 'true') answer.style.maxHeight = answer.scrollHeight + 'px';
            });
        }) : null;

        items.forEach((entry) => {
            resize?.observe(entry.answer.firstElementChild || entry.answer);
            entry.question.addEventListener('click', () => {
                const open = entry.question.getAttribute('aria-expanded') !== 'true';
                items.forEach((other) => {
                    if (other !== entry) setOpen(other, false);
                });
                setOpen(entry, open);
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
