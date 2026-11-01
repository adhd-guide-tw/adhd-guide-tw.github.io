// 網站的 assets/js/ai-chat.js：答案轉成 HTML、沒寫完的答案怎麼顯示。
//
// 執行：npm run test:ai-gateway
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const context = { window: {} };
vm.runInNewContext(readFileSync(new URL('../../assets/js/ai-chat.js', import.meta.url), 'utf8'), context);
const chat = context.window.ADHDChat;

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

test('partialHtml：開頭標明沒有寫完，落單的粗體記號拿掉，不補任何聲明', () => {
    const html = chat.partialHtml('- **第一點');
    assert.match(html, /^<p[^>]*>AI 的回答（沒有寫完）<\/p><ul[^>]*><li>第一點<\/li><\/ul>$/);
    assert.doesNotMatch(chat.partialHtml('**接下來'), /\*\*|<hr/);
});
