# ai-gateway

ADHD 光譜網站上的三個 AI 表單都呼叫這個服務。它拿著 key，代替瀏覽器呼叫 WinLab 自架的模型 `qwen3.8-27b-fp8`。

```
瀏覽器 → Tailscale Funnel → ai-gateway（k3s）→ WinLab
```

多這一層有三個原因。key 不能放進公開的 JavaScript。WinLab 只接受校內網段的來源 IP，訪客在家連不到。單次輸出最多 8192 tokens，思考也算在內，答案被截斷時要有人請模型接著寫。

瀏覽器只送任務代號和使用者輸入（`POST /v1/tasks/<id>`），回應是 SSE。prompt、格式與字數上限都由這裡決定，不收任意 prompt：收了就成了誰都能用的免費 LLM 代理，CORS 擋不住 curl。

任務有三個：`adhd-faq` 給常見問答、`adhd-task-slicer` 給生活策略、`adhd-visit-notes` 給資源工具箱。定義在 `src/task-catalog.mjs`，頁面輸入框的字數上限要與它一致，測試會檢查。端點與事件的細節寫在 `src/server.mjs` 開頭，設定寫在 `src/config.mjs`。

## 提示詞的依據

三個任務共用的規則在 `src/tasks.mjs` 的 `SYSTEM_PROMPT`，各任務的指令在 `src/task-catalog.mjs`。改之前先看依據，資料查證於 2026-11-01。

危機處理。模型只看得到一則訊息，沒辦法追問，所以一出現風險訊號，就在同一則回答附上求助方式，不讓模型自己判斷輕重：聊天機器人對中等風險的判斷並不穩定（[Psychiatric Services 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12856735)）。諮詢專線只列 [1925](https://mohw.gov.tw/cp-16-50587-1.html)，它是唯一確認 24 小時服務的。不描述方法與致命程度，依據是 [WHO 的自殺報導指引](https://www.who.int/publications/i/item/9789240076846)與[衛福部對自殺防治法第 16 條的說明](https://www.mohw.gov.tw/dl-99285-84cb7ce4-c0e7-4d6c-b88f-a8bf7b196a85.html)。

用藥。methylphenidate 在台灣是[第三級管制藥品](https://mohw.gov.tw/cp-16-26925-1.html)，被濫用的興奮劑多半來自家人朋友（[FDA 2023](https://www.fda.gov/drugs/drug-safety-communications/fda-updating-warnings-improve-safe-use-prescription-stimulants-used-treat-adhd-and-other-conditions)），所以不給劑量建議，也不協助分享。台灣的用藥只列 methylphenidate 類與 atomoxetine，其他藥物查不到台灣的許可證。

不診斷，也不附和。[醫師法第 28 條](https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=L0020001&flno=28)規定非醫師不得執行醫療業務。模型遇到前提錯誤的用藥問題常照單全收（[npj Digital Medicine 2025](https://www.massgeneralbrigham.org/en/about/newsroom/press-releases/large-language-models-prioritize-helpfulness-over-accuracy-in-medical-contexts)），[APA 2025 的健康警示](https://www.apa.org/topics/artificial-intelligence-machine-learning/health-advisory-chatbots-wellness-apps)也把一味附和列為主要風險。

常見問答。內容對齊 [NICE NG87](https://www.nice.org.uk/guidance/ng87)、[AAP 2019](https://publications.aap.org/pediatrics/article/144/4/e20192528/81590/)、[CADDRA 4.1](https://www.caddra.ca/canadian-adhd-practice-guidelines/) 與 [2021 年世界 ADHD 聯盟的國際共識聲明](https://escholarship.org/content/qt2rv182tf/qt2rv182tf.pdf)。身高、心血管、神經回饋、飲食與運動的證據還不一致，要直說。

拆解任務。卡住的通常是開始，不是不知道該做什麼，所以第一步要小到馬上能做（[Ramsay](https://psychwire.com/free-resources/q-and-a/15i4yzk/cbt-for-adult-adhd-from-intention-to-action)）。延遲的獎勵效果較差（[統合分析](https://pubmed.ncbi.nlm.nih.gov/27722208/)），獎勵放在做完當下。番茄鐘沒有 ADHD 的試驗，只有[一般學生的研究](https://pubmed.ncbi.nlm.nih.gov/36859717/)，計時長度交給使用者選。

看診筆記。分段參考 [NICE NG87 第 1.3 節](https://www.nice.org.uk/guidance/ng87/chapter/recommendations)的評估內容。只整理、不推論，筆記沒提到的事寫成選填的問句。

格式。網頁只認得粗體、清單、分隔線與段落（`assets/js/ai-chat.js` 的 `markdownToHtml`），提示詞列出能用的格式並說明原因。模型仍寫出 # 標題時，網頁把它改成粗體。

## 開發與部署

```bash
npm run test:ai-gateway
```

測試只打本機的假上游，不需要 key。部署檔在 `deploy/k3s/`；`build-image.sh` 用 git commit 當映像檔的 tag，用到的檔案要先 commit。

簡轉繁的對照表 `src/s2t-table.mjs` 由 OpenCC 的資料產生，授權見 `licenses/OpenCC-LICENSE.txt`。
