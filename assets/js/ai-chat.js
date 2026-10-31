// ai-chat.js 把頁面上的 AI 表單接到 AI 閘道，答案邊收邊顯示。要先載入 platform-ai.js。
// 頁面只送使用者輸入的文字，prompt 在閘道的任務定義裡（ai-gateway/src/task-catalog.mjs）。

/** ADHDChat 讓頁面用 init() 接上一組輸入框、按鈕與結果區，用法見 pages/faq.html。 */
const ADHDChat = {
    // 頁面的 promptType 對應的任務與欄位。字數上限在閘道，輸入框的 maxlength 要與它相同。
    tasks: {
        faq: { id: 'adhd-faq', field: 'question' },
        taskSlicer: { id: 'adhd-task-slicer', field: 'task' },
        noteGenerator: { id: 'adhd-visit-notes', field: 'notes' }
    },

    // platform-ai.js 沒載入時沒有 describeError 可用，改用這句，與它對未知錯誤的說法相同。
    fallbackErrorText: '抱歉，AI 服務發生錯誤，請稍後再試。',

    escapeHtml(text) {
        return String(text == null ? '' : text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    /**
     * markdownToHtml 把 AI 回答的 Markdown 子集轉成 HTML：粗體、分隔線、有序與無序清單、段落。
     * AI 的輸出不可信，先跳脫再套上自己寫死的標籤，模型塞不進可執行的 HTML。
     * @param {string} text @returns {string}
     */
    markdownToHtml(text) {
        let html = this.escapeHtml(text).replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#BF4040]">$1</strong>');
        html = html.replace(/^---$/gm, '<hr class="my-4 border-gray-300">');

        const lines = html.split('\n');
        const result = [];
        let inOrderedList = false;
        let inUnorderedList = false;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            // 提示詞要求不用 # 標題，模型偶爾仍會寫；改成粗體段落，# 才不會原樣出現在頁面上。
            const heading = line.match(/^#{1,6}\s+(.*)$/);
            if (heading) line = `<strong class="text-[#BF4040]">${heading[1]}</strong>`;

            // 「1.」後面不一定有空格；代價是「3.5 小時」這樣開頭的行也會變成清單。
            const orderedMatch = line.match(/^(\d+)\.\s*(.*)$/);
            const unorderedMatch = line.match(/^[\*\-]\s+(.*)$/);

            if (orderedMatch) {
                if (!inOrderedList) {
                    if (inUnorderedList) {
                        result.push('</ul>');
                        inUnorderedList = false;
                    }
                    result.push('<ol class="list-decimal ml-6 my-3 space-y-2">');
                    inOrderedList = true;
                }
                result.push(`<li>${orderedMatch[2]}</li>`);
            } else if (unorderedMatch) {
                if (!inUnorderedList) {
                    if (inOrderedList) {
                        result.push('</ol>');
                        inOrderedList = false;
                    }
                    result.push('<ul class="list-disc ml-6 my-3 space-y-2">');
                    inUnorderedList = true;
                }
                result.push(`<li>${unorderedMatch[1]}</li>`);
            } else {
                if (inOrderedList) {
                    result.push('</ol>');
                    inOrderedList = false;
                }
                if (inUnorderedList) {
                    result.push('</ul>');
                    inUnorderedList = false;
                }

                if (line === '') {
                    result.push('<br>');
                } else if (line.startsWith('<hr ')) {
                    result.push(line);
                } else {
                    result.push(`<p class="my-2">${line}</p>`);
                }
            }
        }

        if (inOrderedList) result.push('</ol>');
        if (inUnorderedList) result.push('</ul>');

        return result.join('');
    },

    /**
     * sendMessage 執行 promptType 對應的任務，邊收邊把答案畫進 outputElement，回傳完整的答案。
     * 失敗時丟出 PlatformAI.runTask 的錯誤。
     * @param {string} userMessage @param {string} promptType @param {HTMLElement} outputElement
     * @param {{signal?: AbortSignal, onProgress?: Function, onChunk?: Function}} [options]
     * @returns {Promise<string>}
     */
    async sendMessage(userMessage, promptType, outputElement, options = {}) {
        const { signal, onProgress, onChunk } = options;
        const task = this.tasks[promptType] || this.tasks.faq;

        outputElement.innerHTML = '';
        const { result } = await PlatformAI.runTask(task.id, { [task.field]: userMessage }, {
            signal,
            onProgress,
            onDelta: (chunk, text) => {
                outputElement.innerHTML = this.markdownToHtml(text);
                if (onChunk) onChunk(chunk, text);
            }
        });

        // 以 done 的結果為準，片段接起來的只是草稿。
        outputElement.innerHTML = this.markdownToHtml(result);
        return result;
    },

    /**
     * init 依選擇器找到輸入框、按鈕、結果區與錯誤訊息區，按下按鈕就執行 promptType 對應的任務。
     * @param {Object} options
     */
    init(options) {
        const {
            inputSelector,
            buttonSelector,
            outputSelector,
            resultContainerSelector,
            errorSelector,
            promptType = 'faq',
            buttonText = '送出',
            loadingText = '思考中...'
        } = options;

        const input = document.querySelector(inputSelector);
        const button = document.querySelector(buttonSelector);
        const output = document.querySelector(outputSelector);
        const resultContainer = document.querySelector(resultContainerSelector);
        const errorEl = document.querySelector(errorSelector);

        if (!input || !button || !output) {
            console.warn('AI Chat: 找不到必要的 DOM 元素');
            return;
        }

        const buttonTextEl = button.querySelector('.button-text') || button;

        // 閘道忙的時候要等一兩分鐘，按鈕下方顯示排隊名次、已等待幾秒和取消鈕。
        const progressEl = document.createElement('div');
        button.insertAdjacentElement('afterend', progressEl);

        const showError = (text, isCancel = false) => {
            if (!errorEl) return;
            errorEl.textContent = text;
            // 使用者自己取消不算錯誤，不用紅色。
            errorEl.classList.toggle('bg-red-50', !isCancel);
            errorEl.classList.toggle('text-red-700', !isCancel);
            errorEl.classList.toggle('bg-gray-100', isCancel);
            errorEl.classList.toggle('text-gray-700', isCancel);
            errorEl.classList.remove('hidden');
        };

        let busy = false;

        button.addEventListener('click', async () => {
            if (busy) return;
            const userText = input.value.trim();

            if (!userText) {
                showError('請先輸入內容喔！');
                return;
            }

            if (errorEl) errorEl.classList.add('hidden');
            if (resultContainer) resultContainer.classList.add('hidden');

            // 不用 disabled：按鈕會失去焦點，鍵盤使用者的焦點掉回 <body>。點擊照樣會進來，由 busy 擋下。
            busy = true;
            button.setAttribute('aria-disabled', 'true');
            button.classList.add('opacity-50', 'cursor-not-allowed');
            buttonTextEl.textContent = loadingText;

            const controller = new AbortController();
            // mountProgress 放在 try 裡：PlatformAI 沒載入時會丟 ReferenceError，按鈕仍要靠 finally 恢復。
            let progress = null;
            try {
                progress = PlatformAI.mountProgress(progressEl, {
                    onCancel: () => controller.abort(),
                    focusTarget: button
                });
                await this.sendMessage(userText, promptType, output, {
                    signal: controller.signal,
                    onProgress: progress.update,
                    // 收到第一段就打開結果區。
                    onChunk: () => {
                        if (resultContainer) resultContainer.classList.remove('hidden');
                    }
                });
                progress.finish();
                if (resultContainer) resultContainer.classList.remove('hidden');
            } catch (error) {
                if (progress) progress.finish();
                output.innerHTML = '';
                if (resultContainer) resultContainer.classList.add('hidden');
                const text = typeof PlatformAI === 'undefined' ? this.fallbackErrorText : PlatformAI.describeError(error);
                showError(text, Boolean(error && error.name === 'AbortError'));
            } finally {
                busy = false;
                button.removeAttribute('aria-disabled');
                button.classList.remove('opacity-50', 'cursor-not-allowed');
                buttonTextEl.textContent = buttonText;
            }
        });
    }
};

window.ADHDChat = ADHDChat;
