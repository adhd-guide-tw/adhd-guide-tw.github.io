#!/usr/bin/env node
// inject-ai-gateway-url 把 AI 閘道的網址寫進部署目錄裡載入 platform-ai.js 的頁面，成為
// <meta name="ai-gateway-url">。網址不進 repo，部署時由 repository variable AI_GATEWAY_URL 帶入。
//
//   AI_GATEWAY_URL=https://… node scripts/inject-ai-gateway-url.mjs <部署目錄> [--allow-localhost]
//
// 沒設 AI_GATEWAY_URL 時不寫入，網站照常部署，AI 功能顯示「尚未設定」；網址不合格時以 1 結束。
// --allow-localhost 只給本機測試用。
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { isIP } from 'node:net';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const META_NAME = 'ai-gateway-url';
const CLIENT_SCRIPT = /<script\b[^>]*\bsrc="[^"]*\/platform-ai\.js"/;

const BLOCKED_HOST_EXACT = new Set(['localhost', 'metadata', 'metadata.google.internal', 'metadata.goog', 'instance-data', 'instance-data.ec2.internal']);
const BLOCKED_HOST_SUFFIX = ['.localhost', '.local', '.internal', '.localdomain', '.home.arpa', '.intranet', '.corp', '.lan', '.private'];
/** BLOCKED_IPV4 是不收的網段與前綴長度：本機、私有網段、CGNAT（Tailscale 的位址）、link-local、群播與保留。 */
const BLOCKED_IPV4 = [['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.168.0.0', 16], ['224.0.0.0', 3]];

function ipv4ToInt(ip) {
    return ip.split('.').reduce((n, part) => (n << 8) + Number(part), 0) >>> 0;
}

function isBlockedIPv4(ip) {
    const n = ipv4ToInt(ip);
    return BLOCKED_IPV4.some(([base, bits]) => ((n >>> (32 - bits)) << (32 - bits)) >>> 0 === ipv4ToInt(base));
}

/**
 * isBlockedIPv6 判斷 new URL() 正規化過的 IPv6 是否是未指定、loopback、ULA、link-local，或對到內網 IPv4 的
 * ::ffff: 位址。正規化後 ::ffff:127.0.0.1 寫成 ::ffff:7f00:1，ULA 與 link-local 的第一段一定是四位數。
 * @param {string} h @returns {boolean}
 */
function isBlockedIPv6(h) {
    if (h === '::' || h === '::1') return true;
    if (/^f[cd][0-9a-f]{2}:/.test(h) || /^fe[89ab][0-9a-f]:/.test(h)) return true;
    const mapped = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(h);
    if (!mapped) return false;
    const n = (parseInt(mapped[1], 16) << 16) + parseInt(mapped[2], 16);
    return isBlockedIPv4([n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.'));
}

/**
 * gatewayUrlProblem 說明網址哪裡不合格，合格時回傳 null。前端的 getGatewayUrl() 為了本機開發接受
 * http://localhost，部署出去的網址卻只能是公開的 https，否則每個訪客都連不上。
 * @param {string} raw @param {{allowLocalhost?: boolean}} [options] @returns {string|null}
 */
export function gatewayUrlProblem(raw, { allowLocalhost = false } = {}) {
    let url;
    try {
        url = new URL(raw);
    } catch {
        return '不是合法的網址';
    }
    let host = url.hostname.toLowerCase();
    if (host.startsWith('[') && host.endsWith(']')) host = host.slice(1, -1);
    while (host.endsWith('.')) host = host.slice(0, -1);
    const loopback = host === 'localhost' || host === '::1' || /^127(\.\d{1,3}){3}$/.test(host);
    if (allowLocalhost && loopback) {
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return '必須是 http 或 https';
    } else {
        if (url.protocol !== 'https:') return '必須是 https';
        if (BLOCKED_HOST_EXACT.has(host) || BLOCKED_HOST_SUFFIX.some((s) => host.endsWith(s))) {
            return `不能指向本機或內部網路（${host}）`;
        }
        const family = isIP(host);
        if ((family === 4 && isBlockedIPv4(host)) || (family === 6 && isBlockedIPv6(host))) {
            return `不能指向本機或內部網路（${host}）`;
        }
    }
    if (url.username || url.password) return '不能帶帳號密碼';
    if (url.search || url.hash) return '不能帶查詢字串或 #';
    return null;
}

function escapeAttribute(text) {
    return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function listHtmlFiles(dir) {
    const files = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) files.push(...listHtmlFiles(full));
        else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
    }
    return files;
}

function main() {
    const args = process.argv.slice(2);
    const allowLocalhost = args.includes('--allow-localhost');
    const dir = args.find((a) => !a.startsWith('--'));
    if (!dir) {
        console.error('用法：AI_GATEWAY_URL=https://… node scripts/inject-ai-gateway-url.mjs <部署目錄> [--allow-localhost]');
        process.exit(2);
    }

    const pages = listHtmlFiles(dir).filter((file) => CLIENT_SCRIPT.test(readFileSync(file, 'utf8')));
    // 一頁都沒對到時照常部署的話，AI 功能全部「尚未設定」也不會有人發現。
    if (pages.length === 0) {
        console.error(`${dir} 底下沒有任何頁面載入 platform-ai.js`);
        process.exit(1);
    }
    for (const file of pages) {
        if (readFileSync(file, 'utf8').includes(`name="${META_NAME}"`)) {
            console.error(`${file} 已經有 <meta name="${META_NAME}">：網址不寫進 repo，請從原始檔刪掉`);
            process.exit(1);
        }
    }

    const raw = (process.env.AI_GATEWAY_URL ?? '').trim();
    if (!raw) {
        console.warn(`::warning::沒有設定 AI_GATEWAY_URL，${pages.length} 個頁面的 AI 功能會顯示「尚未設定」`);
        return;
    }
    const problem = gatewayUrlProblem(raw, { allowLocalhost });
    if (problem) {
        // 只印開頭：打錯的網址裡可能有帳密。
        console.error(`AI_GATEWAY_URL ${problem}：${raw.slice(0, 40)}…`);
        process.exit(1);
    }
    // 與前端的 getGatewayUrl() 一樣去掉結尾的斜線。
    const url = new URL(raw);
    const value = url.origin + url.pathname.replace(/\/+$/, '');
    const meta = `    <meta name="${META_NAME}" content="${escapeAttribute(value)}">\n`;

    for (const file of pages) {
        const html = readFileSync(file, 'utf8');
        const at = html.indexOf('</head>');
        if (at === -1) {
            console.error(`${file} 找不到 </head>`);
            process.exit(1);
        }
        writeFileSync(file, html.slice(0, at) + meta + html.slice(at));
    }
    console.log(`已寫入 ${pages.length} 個頁面：${pages.map((f) => path.relative(dir, f)).join('、')}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
