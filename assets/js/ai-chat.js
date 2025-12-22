/**
 * ADHD 光譜 - AI 聊天模組
 * 使用 Puter.js 搭配 Gemini 3 Pro Preview 進行串流回應
 */

const ADHDChat = {
    // 配置設定
    config: {
        model: 'gemini-3-pro-preview',  // 使用最新 Gemini 3 Pro 模型
        streamingEnabled: true
    },

    // 不同情境的系統提示詞
    prompts: {
        // FAQ 問答助理
        faq: `你是一位溫暖、有同理心的 AI 衛教助理，服務於一個名為「ADHD 光譜」的台灣衛教網站。你的目標是根據現有的科學共識和心理健康知識，以支持、不帶批判的語氣回答使用者的問題。

請遵循以下規則：
1. 語氣溫暖、有同理心，並使用繁體中文。
2. 回答內容需基於普遍、公開的科學知識，避免提供個人化診斷或治療建議。
3. 將複雜概念分解成簡單、易於理解的點列式說明。
4. 在每一則回答的結尾，都必須加上以下免責聲明，並且用一個分隔線把它和主要內容分開：
---
**請注意：** AI 的回答僅供教育與參考目的，不能取代專業醫療建議。每個人的狀況都不同，若您有個人健康問題，請務必諮詢合格的醫師或心理師。`,

        // 任務拆解教練
        taskSlicer: `你是一位非常有經驗且溫暖的 ADHD 教練。你的專長是幫助人們將巨大、可怕的任務，分解成微小、無壓力、可立即執行的步驟。

請根據使用者提供的任務，為他量身打造一份「ADHD 友善的行動計畫」。

計畫需包含以下幾個部分，並用粗體標示標題：
1. **第一步，先深呼吸：** 用一句有同理心的話，承認這個任務很困難，安撫使用者的焦慮。
2. **清空大腦，準備工作區：** 建議使用者如何準備物理環境與心理狀態。
3. **拆解成「小石頭」步驟：** 這是最重要的部分。將大任務分解成 5-7 個非常具體、動詞開頭、微小到幾乎不可能失敗的步驟。
4. **啟動你的「番茄鐘」：** 建議一個工作/休息的時間循環（例如 25 分鐘工作，5 分鐘休息）。
5. **設定一個「小獎勵」：** 完成後可以給自己什麼樣的立即獎勵。

請用支持、鼓勵且充滿活力的語氣，以繁體中文回答。`,

        // 看診筆記生成器
        noteGenerator: `你是一位溫暖、有同理心的心理健康助理。一位可能患有ADHD的使用者正在準備他的第一次身心科看診，他寫下了這些雜亂的筆記，請你幫他整理成一份有條理、清晰、點列式的看診筆記，方便他與醫師溝通。

請將內容分類，使用以下標題：
- **【主要困擾與挑戰】**
- **【對日常生活的影響（工作/學業/人際）】**
- **【情緒與睡眠狀況】**
- **【我想詢問醫師的問題】** (如果使用者有提到問題的話)

請直接輸出整理好的筆記內容，語氣客觀中立，僅是整理而非給予建議或詮釋。請務必使用繁體中文和 Markdown 的點列格式。`
    },

    /**
     * 將 Markdown 轉換為 HTML
     * @param {string} text - Markdown 文字
     * @returns {string} HTML 字串
     */
    markdownToHtml(text) {
        // 先處理粗體（在列表處理之前，避免 ** 和 * 衝突）
        let html = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#BF4040]">$1</strong>');

        // 分隔線
        html = html.replace(/^---$/gm, '<hr class="my-4 border-gray-300">');

        // 按行處理
        const lines = html.split('\n');
        const result = [];
        let inOrderedList = false;
        let inUnorderedList = false;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();

            // 有序列表：數字 + 點 + 空格（或只有點）
            const orderedMatch = line.match(/^(\d+)\.\s*(.*)$/);
            // 無序列表：* 或 - 開頭
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
                // 非列表項目，關閉任何開啟的列表
                if (inOrderedList) {
                    result.push('</ol>');
                    inOrderedList = false;
                }
                if (inUnorderedList) {
                    result.push('</ul>');
                    inUnorderedList = false;
                }

                // 空行處理
                if (line === '') {
                    result.push('<br>');
                } else {
                    result.push(`<p class="my-2">${line}</p>`);
                }
            }
        }

        // 關閉未結束的列表
        if (inOrderedList) result.push('</ol>');
        if (inUnorderedList) result.push('</ul>');

        return result.join('');
    },

    /**
     * 發送聊天訊息並取得串流回應
     * @param {string} userMessage - 使用者輸入
     * @param {string} promptType - 提示詞類型 ('faq', 'taskSlicer', 'noteGenerator')
     * @param {HTMLElement} outputElement - 輸出內容的 DOM 元素
     * @param {Object} callbacks - 可選的回調函數
     */
    async sendMessage(userMessage, promptType, outputElement, callbacks = {}) {
        const { onStart, onChunk, onComplete, onError } = callbacks;

        // 建立完整提示詞
        const systemPrompt = this.prompts[promptType] || this.prompts.faq;
        const contextLabel = promptType === 'taskSlicer' ? '任務' : promptType === 'noteGenerator' ? '雜亂筆記' : '問題';
        const fullPrompt = `${systemPrompt}\n\n使用者的${contextLabel}是：\n「${userMessage}」`;

        // 重置輸出區域
        outputElement.innerHTML = '';

        try {
            if (onStart) onStart();

            if (this.config.streamingEnabled) {
                // 串流模式
                const response = await puter.ai.chat(fullPrompt, {
                    model: this.config.model,
                    stream: true
                });

                let fullText = '';

                for await (const part of response) {
                    if (part?.text) {
                        fullText += part.text;
                        // 即時轉換 Markdown 並更新顯示
                        outputElement.innerHTML = this.markdownToHtml(fullText);
                        if (onChunk) onChunk(part.text);
                    }
                }

                if (onComplete) onComplete(fullText);
            } else {
                // 非串流模式（備援）
                const response = await puter.ai.chat(fullPrompt, {
                    model: this.config.model,
                    stream: false
                });

                const generatedText = response?.message?.content;
                if (!generatedText) {
                    throw new Error('AI 回應的格式不正確或內容為空。');
                }

                outputElement.innerHTML = this.markdownToHtml(generatedText);
                if (onComplete) onComplete(generatedText);
            }

        } catch (error) {
            console.error('AI Chat Error:', error);
            if (onError) onError(error);
            throw error;
        }
    },

    /**
     * 在頁面上初始化 AI 聊天功能
     * @param {Object} options - 設定選項
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

        const buttonTextEl = button.querySelector('.button-text') || button.querySelector('span') || button;
        const loader = button.querySelector('.loader');

        button.addEventListener('click', async () => {
            const userText = input.value.trim();

            if (!userText) {
                if (errorEl) {
                    errorEl.textContent = '請先輸入內容喔！';
                    errorEl.classList.remove('hidden');
                }
                return;
            }

            // 隱藏先前的錯誤/結果
            if (errorEl) errorEl.classList.add('hidden');
            if (resultContainer) resultContainer.classList.add('hidden');

            try {
                await this.sendMessage(userText, promptType, output, {
                    onStart: () => {
                        button.disabled = true;
                        if (buttonTextEl.tagName === 'SPAN' || buttonTextEl === button) {
                            buttonTextEl.textContent = loadingText;
                        }
                        if (loader) loader.classList.remove('hidden');
                    },
                    onComplete: () => {
                        if (resultContainer) resultContainer.classList.remove('hidden');
                    },
                    onError: (error) => {
                        if (errorEl) {
                            errorEl.textContent = '哎呀，連線有點問題，請稍後再試一次。';
                            errorEl.classList.remove('hidden');
                        }
                    }
                });
            } catch (error) {
                // 錯誤已在 onError 中處理
            } finally {
                button.disabled = false;
                if (buttonTextEl.tagName === 'SPAN' || buttonTextEl === button) {
                    buttonTextEl.textContent = buttonText;
                }
                if (loader) loader.classList.add('hidden');
            }
        });
    }
};

// 匯出供使用
window.ADHDChat = ADHDChat;
