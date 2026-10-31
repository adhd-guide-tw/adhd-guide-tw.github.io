# ai-gateway：ADHD 光譜的 AI 閘道

網站是 GitHub Pages 上的靜態頁面。常見問答、拆解任務、看診筆記這三個 AI 表單不直接呼叫模型，而是呼叫這個閘道。閘道拿著 key，代替瀏覽器呼叫 WinLab 自架的模型 `qwen3.8-27b-fp8`。

```
訪客的瀏覽器 → Tailscale Funnel（HTTPS）→ ai-gateway（k3s）→ WinLab → GPU
```

需要這一層有三個原因。key 不能寫進前端，公開的 JavaScript 誰都讀得到。WinLab 的 key 只接受校內網段的來源 IP，訪客在家或用手機時連不進去，閘道所在的主機可以。單次輸出最多 8192 tokens，思考也算在內，答案寫到一半被截斷時，得有人請模型接著寫完。

閘道沒有任何 npm 相依，只用 Node 24 內建的模組。

## 前端怎麼呼叫

瀏覽器只說要做哪個任務、輸入是什麼。prompt、輸出格式與字數上限都由閘道決定。閘道背後是有限的 GPU，收任意 prompt 等於架了一個免費的 LLM 代理，而 CORS 擋得住別的網站，擋不住 curl。

| 端點 | 說明 |
|---|---|
| `POST /v1/tasks/<id>` | body 是 `{"input": {...}}`，回應 `text/event-stream` |
| `OPTIONS /v1/tasks/<id>` | CORS 預檢，只允許 `ALLOWED_ORIGINS` 列出的網站 |
| `GET /healthz` | 程序活著就回 200 |
| `GET /readyz` | 有 key、上游設定合法、沒在關機才回 200 |

SSE 事件依序是 `accepted`、`progress`、文字片段 `delta`，最後是一個 `done` 或 `error`。開始串流之前的拒絕，例如輸入太長或限流，回的是 JSON `{"error": {...}}`。瀏覽器這一端在 `assets/js/platform-ai.js`，頁面的接法在 `assets/js/ai-chat.js`。

## 任務

任務定義在 `src/task-catalog.mjs`，每個只有一個輸入欄位。上限以字計算，頁面輸入框的 `maxlength` 與它相同，`test/task-catalog.test.mjs` 會沿著頁面、`ai-chat.js`、任務定義一路比對。

| 任務 | 頁面 | 欄位 | 上限 |
|---|---|---|---|
| `adhd-faq` | `pages/faq.html` | `question` | 500 |
| `adhd-task-slicer` | `pages/strategies.html` | `task` | 200 |
| `adhd-visit-notes` | `pages/toolbox.html` | `notes` | 2000 |

使用者的輸入放在 user 訊息裡，包在每次請求才產生的隨機標記中。system 訊息說明標記裡的文字只是資料，裡面就算寫了「忽略以上指示」，模型也照原本的任務做。答案送出前，零星的簡體字會轉成台灣繁體（`src/s2t.mjs`）。

答案被截斷時，`src/generate.mjs` 把已經寫好的部分放回對話，請模型接著寫，最多 `LLM_MAX_ROUNDS` 輪。怎麼接、怎麼去掉重複的開頭，寫在那個檔案的註解裡。

## 提示詞的依據

三個任務共用的規則在 `src/tasks.mjs` 的 `SYSTEM_PROMPT`，各任務的指令在 `src/task-catalog.mjs`。改規則之前先看這裡，知道它為什麼在那裡。以下資料查證於 2026-11-01。

危機處理。模型只看得到一則訊息，不能追問，所以只要出現風險訊號，同一則回答就要附上求助方式。[1925 安心專線](https://mohw.gov.tw/cp-16-50587-1.html)是唯一確認 24 小時服務的專線；[張老師 1980](https://www.1980.org.tw/service_item_show.php?service_item_id=1) 有服務時段，不當成緊急專線。不描述方法、地點與致命程度，依據是 [WHO 的自殺報導指引](https://www.who.int/publications/i/item/9789240076846)與[衛福部對自殺防治法第 16 條的說明](https://www.mohw.gov.tw/dl-99285-84cb7ce4-c0e7-4d6c-b88f-a8bf7b196a85.html)。研究發現聊天機器人對中等風險的訊息判斷不穩（[Psychiatric Services 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12856735)），所以規則寫成只要有訊號就處理，不要求模型分級。

用藥。methylphenidate 在台灣是[第三級管制藥品](https://mohw.gov.tw/cp-16-26925-1.html)，被濫用的興奮劑多半來自家人朋友（[FDA 2023](https://www.fda.gov/drugs/drug-safety-communications/fda-updating-warnings-improve-safe-use-prescription-stimulants-used-treat-adhd-and-other-conditions)），所以不給劑量建議，也不協助分享。台灣常用的藥物只列 methylphenidate 類與 atomoxetine：其他藥物查不到台灣的許可證，寫進去會讓人以為買得到。

不診斷、不附和。[醫師法第 28 條](https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=L0020001&flno=28)規定非醫師不得執行醫療業務。大型語言模型面對錯誤前提的用藥問題，常常照單全收（[npj Digital Medicine 2025](https://www.massgeneralbrigham.org/en/about/newsroom/press-releases/large-language-models-prioritize-helpfulness-over-accuracy-in-medical-contexts)），[APA 2025 的健康警示](https://www.apa.org/topics/artificial-intelligence-machine-learning/health-advisory-chatbots-wellness-apps)也把一味附和列為主要風險。

常見問答。內容對齊 [NICE NG87](https://www.nice.org.uk/guidance/ng87)、[AAP 2019](https://publications.aap.org/pediatrics/article/144/4/e20192528/81590/)、[CADDRA 4.1](https://www.caddra.ca/canadian-adhd-practice-guidelines/) 與 [2021 年世界 ADHD 聯盟國際共識聲明](https://escholarship.org/content/qt2rv182tf/qt2rv182tf.pdf)。美國成人 ADHD 指引（APSARD）到 2026 年 10 月仍未發布，不列。身高、心血管、神經回饋、飲食與運動的證據不一致，指令要求直說。

拆解任務。有 ADHD 的人卡在「做」而不是「知道」，第一步要小到能馬上開始（[Ramsay](https://psychwire.com/free-resources/q-and-a/15i4yzk/cbt-for-adult-adhd-from-intention-to-action)）。延遲的獎勵對他們效果較差（[統合分析](https://pubmed.ncbi.nlm.nih.gov/27722208/)），所以獎勵要在做完當下。番茄鐘沒有 ADHD 的試驗，只有[一般學生的研究](https://pubmed.ncbi.nlm.nih.gov/36859717/)，所以不寫死 25 分鐘，讓使用者自己選長度。

看診筆記。分段參考 [NICE NG87 第 1.3 節](https://www.nice.org.uk/guidance/ng87/chapter/recommendations)的評估內容：不同生活場域的表現、12 歲以前的情形、共病、身體狀況；用藥前醫師會問心臟方面的問題。只整理不推論，沒提到的事寫成選填的問句，不替使用者補上。

格式。網頁的 Markdown 只認得粗體、清單、分隔線與段落（`assets/js/ai-chat.js` 的 `markdownToHtml`），提示詞列出能用的格式並說明原因；模型偶爾仍寫出 # 標題時，網頁把它畫成粗體。

## 部署

閘道跑在實驗室主機的 k3s 上，命名空間是 `adhd-ai`。這台主機的出口 IP 在 WinLab key 的來源白名單內。命名空間強制 Pod Security restricted，網路預設全部拒絕，只開 DNS 與校內網段的 443。

1. 建立 key 的 Secret。只做一次。key 不進 git，也不放環境變數，以檔案掛進 pod：

   ```bash
   sudo k3s kubectl apply -f ai-gateway/deploy/k3s/namespace.yaml
   read -rsp 'LLM API key：' KEY; echo
   printf '%s' "$KEY" | sudo k3s kubectl -n adhd-ai create secret generic ai-gateway-env \
     --from-file=LLM_API_KEY=/dev/stdin
   unset KEY
   ```

   檔案裡只能有 key 本身。寫成 `LLM_API_KEY=…`、加了引號或分成好幾行，閘道都當成沒有設定，readiness 會一直不就緒。換 key 時，把上面的 `create` 換成 `create … --dry-run=client -o yaml | sudo k3s kubectl replace -f -`，再執行 `sudo k3s kubectl -n adhd-ai rollout restart deployment/ai-gateway`，因為 key 只在啟動時讀一次。

2. 建映像檔並換版：執行 `ai-gateway/deploy/k3s/build-image.sh`。映像檔的 tag 是 git commit，所以用到的檔案與 manifest 都要先 commit。腳本會把 `app.yaml` 的 image 換成新的 tag 再套用，換版成功後記得把這一行 commit。

   換版卡住時，腳本等 180 秒就結束，Deployment 停在新版。退回上一版用 `sudo k3s kubectl -n adhd-ai rollout undo deployment/ai-gateway`，再用 `git checkout` 還原 `app.yaml`。

3. 確認服務正常：

   ```bash
   curl -s http://10.43.0.88:8787/readyz
   curl -sN -H 'Origin: https://adhd-guide-tw.github.io' -H 'Content-Type: application/json' \
     -d '{"input":{"question":"ADHD 會遺傳嗎？"}}' http://10.43.0.88:8787/v1/tasks/adhd-faq | tail -n 3
   ```

   readyz 只檢查 key 與上游網址有沒有設定。第二個指令會真的用到 GPU，WinLab 忙的時候要等一兩分鐘，最後一個事件是 `done` 才算通。如果是 `error`，看 `sudo k3s kubectl -n adhd-ai logs deployment/ai-gateway` 裡的 `UPSTREAM-ERR`：`status` 401 代表 key 不對，504 或 408 是 WinLab 那端逾時。

4. 對外開放。Tailscale Funnel 只開放 443、8443、10000 三個埠，這個閘道用 8443：

   ```bash
   sudo tailscale funnel --bg --https=8443 http://10.43.0.88:8787
   tailscale funnel status
   ```

   目標要寫完整的 `http://` 網址。只寫埠號的話，Funnel 會轉到主機的 `127.0.0.1`，那裡沒有閘道，每個請求都是 502。Funnel 必須跑在主機上：主機連 ClusterIP 時，來源位址會變成 `10.42.0.1`，也就是 `TRUSTED_PROXIES`，閘道才會採信 Funnel 寫入的 `X-Forwarded-For`，依來源限流也才分得出不同訪客。

5. 接上網站。把對外網址 `https://<機器名稱>.<tailnet 名稱>.ts.net:8443` 填進 repository variable `AI_GATEWAY_URL`，再到 Actions 手動執行一次「Deploy to GitHub Pages」。網址只在部署時寫進頁面，不進 repo。

下架時先關掉 Funnel（`sudo tailscale funnel --https=8443 off`），再刪除命名空間。不要用 `tailscale funnel reset`，它會清掉這台主機上所有的 Funnel 設定。

Service 的 ClusterIP 固定為 `10.43.0.88`，Funnel 指向它，Service 重建後也不必改設定。這個位址在 Service 網段前 256 個位址的靜態區段，Kubernetes 動態配置時不會先拿走它。ClusterIP 建立後不能修改，要換位址得先刪掉 Service，Funnel 也要改指新的位址。

## 設定

全部來自環境變數，啟動時讀一次。數值寫錯時退回預設並在 log 警告；key 與上游網址寫錯則當成沒有設定，不會退回預設，免得把 key 送到沒打算送的地方。完整清單與理由在 `src/config.mjs`。

| 環境變數 | 預設 | 說明 |
|---|---|---|
| `LLM_API_KEY_FILE` | — | 從檔案讀 key，k3s 用這個 |
| `LLM_API_KEY` | — | 直接給 key，只建議本機開發用 |
| `LLM_MODEL` | `qwen3.8-27b-fp8` | |
| `LLM_REASONING_EFFORT` | `xhigh` | 第一輪的思考強度 |
| `LLM_MAX_TOKENS` | `8192` | 每一輪的上限，含思考 |
| `LLM_MAX_ROUNDS` | `3` | 連同第一輪最多幾輪 |
| `LLM_TASK_TIMEOUT_MS` | `900000` | 一個任務所有輪合計的時限 |
| `ALLOWED_ORIGINS` | `https://adhd-guide-tw.github.io` | 逗號分隔，只收 https，本機可用 http |
| `LLM_CONCURRENCY` | `4` | 同時進行的任務數，上限 8 |
| `RATE_LIMIT_MAX` | `100` | 每個來源 10 分鐘內最多開始幾個任務 |

`LLM_CONCURRENCY` 預設 4：key 同時最多 8 個請求，換版時新舊兩個 pod 會短暫重疊，合計正好是 8。

## WinLab 的實測行為

2026-10-21 與 10-22 實際送請求量到的，文件上沒有寫：

| 行為 | 結果 |
|---|---|
| `max_tokens` | 8192 可以，8193 回 400 |
| 沒送 `max_tokens` | 只給 2048，思考完答案就被截斷 |
| context | 32768 tokens，輸入加 `max_tokens` 超過就回 400，不會自動縮小 |
| `reasoning_effort` | 只收 `none`、`low`、`medium`、`xhigh` |
| 並行 | 同一把 key 同時最多 8 個請求，超過回 429 |
| 忙碌時 | 一個極小的請求等了 82.6 秒才收到第一個位元組 |

最後一項決定了幾個時限：排隊最多 4 分鐘，任務最多 15 分鐘，前端等 20 分鐘才放棄。

## 資源上限

pod 的記憶體上限是 256 MiB。Funnel 收完標頭就轉送，body 邊收邊送，慢慢上傳的連線每條約佔 50 KiB，沒有上限的話，幾十個來源就能讓 pod 被 OOMKill。所以同時在收 body 的請求到了 1000 個，新的任務請求立刻回 503；標頭超過 8 KiB，Node 回 431；連線到了 2048 條，新連線直接關掉。這是拿 503 換掉 OOM：2026-10-22 在 256 MiB 的 cgroup 裡持續灌慢速上傳，RSS 最高 162 MiB。

依來源的限流擋不住握有很多 IP 的人。這是取捨，不是保證。

## 測試

```bash
npm run test:ai-gateway
```

測試全部打本機的假上游（`test/fake-upstream.mjs`），不連外網，也不需要 key。GitHub Actions 的「AI Gateway Tests」跑的就是這一條。新增測試檔時要加進根目錄 `package.json` 的清單，`test/source-hygiene.test.mjs` 會檢查有沒有漏。

## 授權

簡轉繁的對照表 `src/s2t-table.mjs` 由 `scripts/build-s2t-table.mjs` 從 OpenCC 的資料產生，不要手動修改。OpenCC 以 Apache License 2.0 授權，全文在 `licenses/OpenCC-LICENSE.txt`。
