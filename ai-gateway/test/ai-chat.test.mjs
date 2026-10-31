// 網站的 assets/js/ai-chat.js：答案轉成 HTML、沒寫完的答案怎麼顯示。
//
// 執行：npm run test:ai-gateway
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

import { TASK_DEFINITIONS } from '../src/task-catalog.mjs';

const context = { window: {} };
vm.runInNewContext(readFileSync(new URL('../../assets/js/ai-chat.js', import.meta.url), 'utf8'), context);
const chat = context.window.ADHDChat;

test('常見問答的 notice 與任務指令裡要模型附上的免責聲明一字不差', () => {
    const { instructions } = TASK_DEFINITIONS.find((def) => def.id === 'adhd-faq');
    assert.ok(instructions.split('\n').includes(chat.tasks.faq.notice));
    assert.equal(chat.tasks.taskSlicer.notice, undefined);
    assert.equal(chat.tasks.noteGenerator.notice, undefined);
});

test('dropUnclosedMarkers：最後一行落單的 ** 與 * 拿掉，成對的、行首的清單記號與算式裡的留著', () => {
    for (const [input, expected] of [
        ['**接下來 2 分鐘', '接下來 2 分鐘'],
        ['**接下來 2 分鐘*', '接下來 2 分鐘'],
        ['- **先說一句**\n- **接著做', '- **先說一句**\n- 接著做'],
        ['* 第一項', '* 第一項'],
        ['1. **第一步', '1. 第一步'],
        ['3 * 4 是 12', '3 * 4 是 12'],
        ['3 ** 2 是 9', '3 ** 2 是 9'],
        ['正常 **粗體** 結尾', '正常 **粗體** 結尾'],
        ['第一行 **\n第二行', '第一行 **\n第二行'],
    ]) {
        assert.equal(chat.dropUnclosedMarkers(input), expected, input);
    }
});

test('markdownToHtml 先跳脫再轉換：模型寫的 HTML 只會變成文字', () => {
    const html = chat.markdownToHtml('<img src=x onerror="alert(1)"> **<script>alert(1)</script>**');
    assert.doesNotMatch(html, /<img|<script/);
    assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
});

test('partialHtml：標明沒有寫完；常見問答在最後補上免責聲明，其他任務不補', () => {
    const faq = chat.partialHtml(chat.tasks.faq, '- **第一點');
    assert.match(faq, /^<p[^>]*>AI 的回答（沒有寫完）<\/p>/);
    assert.match(faq, /<li>第一點<\/li>/);
    assert.match(faq, /<hr[^>]*><p[^>]*><strong[^>]*>請注意：<\/strong> 這是 AI 產生的衛教資訊/);
    assert.ok(faq.indexOf('第一點') < faq.indexOf('請注意'));

    const slicer = chat.partialHtml(chat.tasks.taskSlicer, '**接下來');
    assert.doesNotMatch(slicer, /請注意|\*\*/);
});
