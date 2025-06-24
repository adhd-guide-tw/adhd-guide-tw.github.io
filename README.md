# ✨ ADHD 光譜 (ADHD Spectrum)

[![授權條款](https://img.shields.io/badge/License-CC%20BY--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-sa/4.0/deed.zh_TW)
[![技術支援](https://img.shields.io/badge/Built%20with-Gemini%20API-4285F4)](https://ai.google.dev/)
[![專案狀態](https://img.shields.io/badge/status-completed-success)](#)

**ADHD 光譜** 是一個專為台灣成人與青少年設計的注意力不足/過動症 (ADHD) 線上衛教資訊站。

我們的使命是成為一座橋樑，連接冰冷的科學證據，與溫暖的個人生命經驗。我們將複雜的學術研究轉化為溫暖、易讀且科學嚴謹的內容，致力於破除污名，並提供具體可行的生活策略，陪伴每一位神經多樣性的夥伴，重新認識自己的大腦，找到與世界共處的獨特頻率。

> **線上瀏覽網站：** [https://adhd-guide-tw.github.io/](https://adhd-guide-tw.github.io/)

-----

## 🚀 關於作者與緣起

本專案的起點，始於一位姓蔡、目前在北榮旁邊讀大學的學生。

身為一位在 19 歲（大一）才確診 ADHD、並因課業需求而長期服藥的患者，作者深刻體會到，在藥物改善專注力的同時，其行為模式、情緒調節與內心世界也發生了細微而複雜的變化。個人的生命經驗，以及與同儕（其他 ADHD 夥伴）交流時發現的共同困惑，催生了本專案的核心研究關懷：

  * **藥物與獎賞系統：** 長期服藥後，是否會改變我們對「刺激」的追求，甚至影響用藥安全？
  * **信念與身體感受：** 安慰劑效應是否存在於我們的用藥經驗中？我們自行增減藥量的動機是什麼？
  * **社群的影響力：** 在這個資訊爆炸的時代，同儕與社群媒體上的用藥心得，如何形塑我們的認知與行為？

因為親身體會過實驗室中 `pipette` 的顫抖，作者選擇了認知心理學與社會科學的道路，希望透過文獻回顧與質性訪談，將這些複雜的議題梳理清晰。

這個網站，便是該專題研究的最終成果。它的目標不僅是呈現研究，更是要將這些得來不易的洞見，轉化為一個**開源、友善、能真正幫助到台灣在地社群的衛教平台**。

本專案由陽明交大高教深耕計畫支持。

## 🌟 網站核心特色

我們不只是一個資訊網站，更是一個經過精心設計的體驗。

  * **🧠 核心知識體系：** 從「我是誰」（[`about-adhd.html`](./about-adhd.html)）、「我該怎麼辦」（[`holistic-approach.html`](./holistic-approach.html)）到「我們如何共處」（[`for-supporters.html`](./for-supporters.html)），建構一條清晰的探索路徑。
  * **🔬 深度研究剖析：** 將您提供的每一份關鍵研究，都製作成獨立的深度文章頁面 (如 [`article-suicide-risk.html`](./article-suicide-risk.html), [`article-creativity.html`](./article-creativity.html) 等)，讓使用者能深入了解每個議題背後的科學證據。
  * **🤖 AI 賦能互動：** 在「常見問答」頁面 ([`faq.html`](./faq.html)) 與「資源工具箱」頁面 ([`resources.html`](./resources.html)) 中，整合了由 Gemini API 驅動的 AI 助理，讓使用者在找不到答案或需要整理思緒時，能獲得即時、個人化的協助。
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
| `faq.html`                      | 常見問題 (整合 Gemini API)                     |
| `glossary.html`                 | ADHD 詞彙表 (深度版)                           |
| `scales-explained.html`         | 認識專業評估量表                               |
| `about.html`                    | **關於我們** - 網站緣起與使命                  |
| `contact.html`                  | 聯絡我們                                       |
| `sitemap.html`                  | 網站地圖                                       |
| `adhd-inner-world.html`         | 感受 ADHD 的內心世界 (早期版本)                |
| `toolbox.html`                  | 資源工具箱 (早期版本)                          |

## 🛠️ 技術棧

本網站完全使用前端技術建構，確保了載入速度與部署的簡易性。

  * **HTML5**
  * **CSS3** (透過 [Tailwind CSS](https://tailwindcss.com/) 框架)
  * **JavaScript**:
      * 使用原生 JavaScript (Fetch API) 呼叫 [Google Gemini API](https://ai.google.dev/)。
      * 使用 [Alpine.js](https://alpinejs.dev/) 輔助部分頁面的簡單互動效果。

## 🤝 如何貢獻

我們歡迎任何形式的貢獻，讓這個社群變得更好！

1.  **內容建議與勘誤**：如果您發現任何資訊錯誤、過時，或有希望我們探討的新主題，歡迎透過網站的「[聯絡我們](./contact.html)」頁面，或直接在 GitHub 上開立一個 [Issue](https://github.com/adhd-guide-tw/adhd-guide-tw.github.io/issues)。
2.  **分享你的故事**：你的生命經驗是這個光譜中最寶貴的色彩，歡迎來信與我們分享。

## 📜 授權條款

本網站的所有原創內容，皆採用 **[創用 CC 姓名標示-相同方式分享 4.0 國際 (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/deed.zh_TW)** 授權條款進行授權。

歡迎您在遵守以下規則的前提下，自由地分享、散佈與改作本站內容：

  * **姓名標示 (BY)**：您必須給予適當的姓名標示，提供指向本授權條款的連結，並指明是否（對原始內容）有進行變更。
  * **相同方式分享 (SA)**：如果您基於本網站內容進行混合、轉換或創作，您必須基於相同的授權條款來散佈您的貢獻。

![Creative Commons License](https://i.creativecommons.org/l/by-sa/4.0/88x31.png)
