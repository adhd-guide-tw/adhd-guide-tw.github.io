# ✨ ADHD 光譜 (ADHD Spectrum)

[![授權條款](https://img.shields.io/badge/License-CC%20BY--SA%204.0%20%7C%20MIT-lightgrey.svg)](#-授權條款)
[![AI](https://img.shields.io/badge/AI-self--hosted%20gateway-6D9886)](./ai-gateway/README.md)
[![專案狀態](https://img.shields.io/badge/status-completed-success)](#)

**ADHD 光譜** 是一個專為台灣成人與青少年設計的注意力不足/過動症 (ADHD) 線上衛教資訊站。

我們的使命是成為一座橋樑，連接冰冷的科學證據，與溫暖的個人生命經驗。我們將複雜的學術研究轉化為溫暖、易讀且科學嚴謹的內容，致力於破除污名，並提供具體可行的生活策略，陪伴每一位神經多樣性的夥伴，重新認識自己的大腦，找到與世界共處的獨特頻率。

> **線上瀏覽網站：** [https://adhd-guide-tw.github.io/](https://adhd-guide-tw.github.io/)

-----

## 🚀 關於作者與緣起

本專案由一位目前在北榮旁邊讀大學的學生建立。

他在 19 歲才確診 ADHD。個人經驗，以及和同儕交流時發現的共同疑問，是這個專案的出發點：

  * **藥物與獎賞系統：** 長期用藥的人，對刺激的追求會不會改變？會不會影響用藥安全？
  * **信念與身體感受：** 用藥經驗裡有沒有安慰劑效應？有人自行增減藥量的動機是什麼？
  * **社群的影響力：** 同儕與社群媒體上的用藥心得，怎麼影響讀者的看法與行為？

他用文獻回顧與質性訪談整理這些問題。

這個網站，便是該專題研究的最終成果。它的目標不僅是呈現研究，更是要將這些得來不易的洞見，轉化為一個**開源、友善、能真正幫助到台灣在地社群的衛教平台**。

本專案由陽明交大高教深耕計畫支持。

## 🌟 網站核心特色

我們不只是一個資訊網站，更是一個經過精心設計的體驗。

  * **🧠 核心知識體系：** 從「我是誰」（[`about-adhd.html`](./about-adhd.html)）、「我該怎麼辦」（[`holistic-approach.html`](./holistic-approach.html)）到「我們如何共處」（[`for-supporters.html`](./for-supporters.html)），建構一條清晰的探索路徑。
  * **🔬 深度研究剖析：** 將您提供的每一份關鍵研究，都製作成獨立的深度文章頁面 (如 [`article-suicide-risk.html`](./article-suicide-risk.html), [`article-creativity.html`](./article-creativity.html) 等)，讓使用者能深入了解每個議題背後的科學證據。
  * **🤖 AI 賦能互動：** 「常見問答」（[`faq.html`](./pages/faq.html)）、「生活策略」（[`strategies.html`](./pages/strategies.html)）與「資源工具箱」（[`toolbox.html`](./pages/toolbox.html)）各有一個 AI 表單，分別回答問題、陪你拆解任務、把雜亂的想法整理成看診筆記。AI 由自架的閘道代為呼叫模型，見 [`ai-gateway/`](./ai-gateway/README.md)。
  * **🧰 實用工具箱：** 提供「生活策略」([`strategies.html`](./strategies.html))、「評估量表介紹」([`scales-explained.html`](./scales-explained.html)) 與「ADHD 詞彙表」([`glossary.html`](./glossary.html))，將知識轉化為可應用的工具。
  * **🎨 ADHD 友善設計：** 整體網站採用溫暖、有機的設計風格，使用柔和的米白背景、高對比的深棕色文字，並透過卡片式佈局與清晰的導覽，致力於降低使用者的認知負荷，提供無壓力的瀏覽體驗。

## 🗺️ 網站結構總覽

本儲存庫包含以下所有核心頁面：

| 檔案名稱                        | 頁面主題                                       |
| ------------------------------- | ---------------------------------------------- |
| `index.html`                    | **首頁** - 網站入口與內容導覽                  |
| `about-adhd.html`               | **關於 ADHD** - 核心知識與概念介紹             |
| `medication-guide.html`         | 深入了解利他能/專思達 (藥物指南)               |
| `holistic-approach.html`        | 全方位療癒 (非藥物治療)                        |
| `strategies.html`               | 與ADHD共處的生活策略                           |
| `for-supporters.html`           | 給支持者的指南                                 |
| `research.html`                 | **研究新知** - 所有深度研究文章的入口          |
| `article-*.html`                | (共13篇) 針對特定研究報告的深度解讀文章        |
| `faq.html`                      | 常見問題 (含 AI 問答)                          |
| `glossary.html`                 | ADHD 詞彙表 (深度版)                           |
| `scales-explained.html`         | 認識專業評估量表                               |
| `about.html`                    | **關於我們** - 網站緣起與使命                  |
| `contact.html`                  | 聯絡我們                                       |
| `sitemap.html`                  | 網站地圖                                       |
| `adhd-inner-world.html`         | 感受 ADHD 的內心世界 (早期版本)                |
| `toolbox.html`                  | 資源工具箱 (早期版本)                          |

## 🛠️ 技術棧

網站本身是靜態頁面，載入快，部署也簡單。AI 功能另外呼叫一個自架的閘道。

  * **HTML5**
  * **CSS3** (透過 [Tailwind CSS](https://tailwindcss.com/) 框架)
  * **JavaScript**:
      * 使用原生 JavaScript 呼叫 AI 閘道，答案以 SSE 邊收邊顯示。
  * **AI 閘道**：Node 24，跑在 k3s 上，代為呼叫 WinLab 自架的模型，細節見 [`ai-gateway/README.md`](./ai-gateway/README.md)。
      * 使用 [Alpine.js](https://alpinejs.dev/) 輔助部分頁面的簡單互動效果。

## 🤝 如何貢獻

我們歡迎任何形式的貢獻，讓這個社群變得更好！

1.  **內容建議與勘誤**：如果您發現任何資訊錯誤、過時，或有希望我們探討的新主題，歡迎透過網站的「[聯絡我們](./contact.html)」頁面，或直接在 GitHub 上開立一個 [Issue](https://github.com/adhd-guide-tw/adhd-guide-tw.github.io/issues)。
2.  **分享你的故事**：你的生命經驗是這個光譜中最寶貴的色彩，歡迎來信與我們分享。

## 📜 授權條款

網站原創內容（`index.html` 與 `pages/` 的文字、`assets/images/`）採用[創用 CC 姓名標示─相同方式分享 4.0 國際（CC BY-SA 4.0）](https://creativecommons.org/licenses/by-sa/4.0/deed.zh-hant)授權條款：轉載或改作時要標示姓名、附上授權條款連結、標明是否有修改，改作的內容也要用同樣條款分享。頁面引用的第三方照片與文字不在此限。其餘部分採用 [MIT](./LICENSE)；`ai-gateway/src/s2t-table.mjs` 衍生自 OpenCC，照 Apache 2.0（見 `ai-gateway/licenses/`）。
