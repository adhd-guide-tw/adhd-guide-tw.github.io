// 正式上線的任務清單（task-catalog.mjs）：定義過得了啟動時的檢查，頁面送來的欄位與字數上限對得上。
//
// 執行：npm run test:ai-gateway
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { TASK_DEFINITIONS } from '../src/task-catalog.mjs';
import { createCatalog, validateInput, buildMessages, finalizeOutput } from '../src/tasks.mjs';

const catalog = createCatalog(TASK_DEFINITIONS);
const readRepoFile = (rel) => readFileSync(new URL(`../../${rel}`, import.meta.url), 'utf8');

/** PAGES 列出呼叫閘道的頁面，以及頁面上 ADHDChat.init 的輸入框。 */
const PAGES = [
    ['pages/faq.html', 'userInput'],
    ['pages/strategies.html', 'taskInput'],
    ['pages/toolbox.html', 'userInput'],
];

/**
 * pageWiring 從頁面與 assets/js/ai-chat.js 讀出這一頁呼叫的任務、送的欄位與輸入框的 maxlength。
 * @param {string} page @param {string} inputId @returns {{taskId: string, field: string, maxlength: number}}
 */
function pageWiring(page, inputId) {
    const html = readRepoFile(page);
    const promptType = /promptType: '(\w+)'/.exec(html)?.[1];
    const tag = new RegExp(`<(?:textarea|input)\\b[^>]*\\bid="${inputId}"[^>]*>`).exec(html)?.[0] ?? '';
    const mapping = new RegExp(`\\b${promptType}: \\{\\s*id: '([a-z-]+)',\\s*field: '(\\w+)'`).exec(readRepoFile('assets/js/ai-chat.js'));
    assert.ok(promptType && mapping, `${page}：找不到 promptType 或 ai-chat.js 的對應`);
    return { taskId: mapping[1], field: mapping[2], maxlength: Number(/\bmaxlength="(\d+)"/.exec(tag)?.[1]) };
}

test('每個任務定義都過得了啟動時的檢查（id、欄位），沒有重複的 id', () => {
    assert.equal(catalog.size, TASK_DEFINITIONS.length);
    assert.ok(catalog.size >= 1);
});

test('每個任務都組得出訊息：使用者的資料只在 user 訊息、包在資料標記裡', () => {
    for (const task of catalog.values()) {
        const input = Object.fromEntries(Object.keys(task.input).map((name) => [name, '測試內容']));
        const [system, user] = buildMessages(task, validateInput(task, input));
        assert.match(system.content, /^你是「ADHD 光譜」/, task.id);
        assert.doesNotMatch(system.content, /測試內容/, task.id);
        assert.match(user.content, /^<資料-[0-9a-f]{12} 欄位="[^"]+">\n測試內容\n<\/資料-[0-9a-f]{12}>/, task.id);
    }
});

// 依據見 task-catalog.mjs 的 TASK_DEFINITIONS。
test('任務都不設 timeoutMs，沿用 LLM_TASK_TIMEOUT_MS', () => {
    for (const task of catalog.values()) assert.equal(task.timeoutMs, undefined, task.id);
});

test('每一頁送的欄位就是任務唯一的欄位，輸入框的 maxlength 等於任務的 maxLength', () => {
    const used = new Set();
    for (const [page, inputId] of PAGES) {
        const { taskId, field, maxlength } = pageWiring(page, inputId);
        const task = catalog.get(taskId);
        assert.ok(task, `${page} 呼叫的 ${taskId} 不在清單裡`);
        assert.deepEqual(Object.keys(task.input), [field], page);
        assert.equal(maxlength, task.input[field].maxLength, page);
        used.add(taskId);
    }
    assert.deepEqual([...used].sort(), [...catalog.keys()].sort(), '清單裡有沒有頁面呼叫的任務');
});

test('字數上限：剛好上限可以，多一個字就是 invalid_input', () => {
    for (const task of catalog.values()) {
        const [[field, { maxLength }]] = Object.entries(task.input);
        assert.equal(validateInput(task, { [field]: '忘'.repeat(maxLength) })[field].length, maxLength, task.id);
        assert.throws(() => validateInput(task, { [field]: '忘'.repeat(maxLength + 1) }), { code: 'invalid_input', field }, task.id);
    }
});

test('都是文字任務：結果是去掉前後空白的字串', () => {
    for (const task of catalog.values()) {
        assert.equal(task.output.type, 'markdown', task.id);
        assert.equal(finalizeOutput(task, '\n回答\n'), '回答', task.id);
    }
});

// trim() 去不掉零寬空白（U+200B）與 word joiner（U+2060）
test('只有看不見的字元的回答不收', () => {
    for (const task of catalog.values()) {
        assert.throws(() => finalizeOutput(task, '\u200B\u2060'), { code: 'empty' }, task.id);
    }
});

test('maxOutputChars 是指令寫的字數上限的 4 倍，看診筆記以輸入上限 2000 字計；超過就是 too_long', () => {
    const caps = Object.fromEntries([...catalog.values()].map((t) => [t.id, t.maxOutputChars]));
    assert.deepEqual(caps, { 'adhd-faq': 2400, 'adhd-task-slicer': 1600, 'adhd-visit-notes': 8000 });
    assert.match(catalog.get('adhd-faq').instructions, /大約 300 到 600 字/);
    assert.match(catalog.get('adhd-task-slicer').instructions, /全文 400 字以內/);
    assert.equal(catalog.get('adhd-visit-notes').input.notes.maxLength * 4, 8000);
    assert.throws(() => finalizeOutput(catalog.get('adhd-task-slicer'), '字'.repeat(1601)), { code: 'too_long' });
});

// 免責聲明由頁面固定顯示：答案沒寫完、斷線或模型漏寫時都還在，也不會在答案結尾重複一次。
test('每一頁的 AI 區塊都固定顯示「可能有錯」與 119、1925；指令不再要模型附聲明', () => {
    for (const [page] of PAGES) {
        const notice = /<p id="aiNotice"[^>]*>([^<]*)<\/p>/.exec(readRepoFile(page))?.[1] ?? '';
        assert.match(notice, /由 AI [^。]*可能有錯[，。].*撥 119。1925 安心專線：心理諮詢，24 小時，免付費。$/, page);
    }
    assert.match(readRepoFile('pages/faq.html'), /可能有錯，不能取代醫師的診斷。要調整藥物，先問開藥的醫師。/);
    for (const task of catalog.values()) assert.doesNotMatch(task.instructions, /請注意|免責|---/, task.id);
});

// 三個任務共用 SYSTEM_PROMPT，刪掉其中一條，每個任務都會少一道防線。
test('每個任務的 system 訊息都有危機處理、用藥與格式的規則', () => {
    for (const task of catalog.values()) {
        const [system] = buildMessages(task, validateInput(task, { [Object.keys(task.input)[0]]: '測試' }));
        assert.match(system.content, /請立刻撥 119/, task.id);
        assert.match(system.content, /「1925 安心專線：心理諮詢，24 小時，免付費」/, task.id);
        assert.doesNotMatch(system.content, /免費/, task.id);
        assert.match(system.content, /第三級管制藥品/, task.id);
        assert.match(system.content, /網頁不認得 # 標題/, task.id);
    }
});

// 病名、科別與商品名的寫法和網站頁面相同；藥只列台灣有 ADHD 適應症許可證的 methylphenidate 與 atomoxetine。
test('病名、科別與台灣有許可證的藥名和網站寫法一致', () => {
    const faq = catalog.get('adhd-faq');
    const [system] = buildMessages(faq, validateInput(faq, { question: '測試' }));
    assert.match(system.content, /第一次寫「注意力不足過動症（ADHD）」/);
    assert.match(system.content, /成人寫「精神科」，孩子與青少年寫「兒童青少年精神科」/);
    assert.match(system.content, /「患者」只用在描述研究的受試者或就醫情境/);
    assert.match(faq.instructions, /methylphenidate（台灣商品名：利他能 Ritalin、利長能 Ritalin LA、專思達 Concerta、思有得 Methydur 等）/);
    assert.match(faq.instructions, /atomoxetine（台灣商品名：安保思定 Apo-Atomoxetine、思敏 Mixre、安妥 Atotine、思必靜 Xeirda、思專定 Atotine 等）/);
    assert.match(faq.instructions, /AADPA）2022 年/);
    for (const task of catalog.values()) assert.doesNotMatch(task.instructions, /到身心科|atomoxetine（思銳）/, task.id);
});

// 健保藥品給付規定 1.3.5 以 19 歲為界；模型不知道時會把長效藥寫成成人新診斷也能給付。
test('adhd-faq：健保給付照 1.3.5 的年齡條件回答', () => {
    const { instructions } = catalog.get('adhd-faq');
    assert.match(instructions, /19 歲以上、未滿 41 歲才第一次診斷的，長效 methylphenidate 不給付/);
    assert.match(instructions, /6 到 18 歲時已經用這類藥治療半年以上/);
    assert.match(instructions, /短效 methylphenidate 錠劑（10 毫克與 20 毫克）健保有給付/);
});
