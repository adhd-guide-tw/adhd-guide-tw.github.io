/**
 * ADHD 光譜 - 網站組件模組
 * 動態注入 Header 和 Footer
 */

const SiteComponents = {
    // 網站配置
    config: {
        siteName: 'ADHD 光譜',
        colors: {
            primary: '#A44A3F',
            secondary: '#6D9886',
            background: '#FEFDF8',
            text: '#3D352E'
        }
    },

    // Logo SVG (所有 Header 共用)
    logoSVG: `
        <svg width="40" height="40" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="#F2E1D9"/>
            <path d="M 30 60 C 40 75, 60 75, 70 60" stroke="#A44A3F" stroke-width="6" fill="none" stroke-linecap="round"/>
            <circle cx="35" cy="45" r="5" fill="#3D352E"/>
            <circle cx="65" cy="45" r="5" fill="#3D352E"/>
        </svg>
    `,

    // CC 授權圖示
    ccIcons: `
        <svg class="h-6 w-6 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512"><path fill="currentColor" d="M248,8C111,8,0,119,0,256S111,504,248,504,496,393,496,256,385,8,248,8ZM188.4,395.7c-27.4-4.8-51.5-16.5-71.3-33.3-1.3-1.1-2.4-2.3-3.5-3.5-8-9.4-14.7-20-19.9-31.5-6.3-14-10.4-29.2-11.8-45.2-1.3-14.9-1.2-29.9,.3-44.8,2.1-21.2,8.8-41.5,19.8-60.1,13.9-23.4,33.5-43.1,57.4-57.4,21.2-12.8,44.4-20.7,69-24.6,18.4-2.9,37-3.5,55.3-1.8,20.3,1.9,40,7.2,58.3,15.7,19.3,9,37.1,21.1,52.8,35.8,2.7,2.5,5.3,5.1,7.8,7.8,13.8,14.7,24.8,31.7,32.4,50.3,11.3,27.7,15.5,58,11.7,87.6-3.8,29.4-15.5,56.8-34,79.5-19,23.2-43.8,41-72.2,51.8-18.4,6.9-37.8,10.6-57.8,10.7-20.3,.1-40.5-3.3-59.5-9.9Z M322.1,154.5c-14.9-11.3-32.9-18.7-52.2-21.2-15.7-2.1-31.6-1.5-47.1,1.7-14.8,3-29,8.2-42.1,15.2-20.4,11.1-37.9,26.7-50.6,45.8-10.8,16.4-17.6,34.8-19.8,54.1-1.8,16.2-1.1,32.6,2,48.6,3.8,20.1,12.3,39,24.7,55.7,13.2,17.7,30.3,32.4,49.9,43.2,19.4,10.7,40.8,17,62.8,18.5,18.1,1.3,36.2-1,53.4-6.6,19.4-6.3,37.7-16.1,53.8-28.9,20.4-16.2,36.7-37.4,46.9-61.6,7.8-18.5,12.2-38.3,12.8-58.5,.6-18.9-2.3-37.9-8.7-55.8-9.4-26.4-25.9-49.8-48.2-67.6Z"/></svg>
        <svg class="h-6 w-6 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512"><path fill="currentColor" d="M248,8C111,8,0,119,0,256S111,504,248,504,496,393,496,256,385,8,248,8Zm0,96c48.6,0,88,39.4,88,88s-39.4,88-88,88-88-39.4-88-88,39.4-88,88-88Zm0,344c-58.7,0-111.3-26.6-146.5-68.2,18.8-35.4,55.6-59.8,98.5-59.8s79.7,24.4,98.5,59.8C359.3,417.4,306.7,448,248,448Z"/></svg>
        <svg class="h-6 w-6 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256,8C119,8,8,119,8,256s111,248,248,248,248-111,248-248S393,8,256,8Zm118.8,283.3c-28.9,28.9-69.5,45.4-112.1,45.4s-83.2-16.5-112.1-45.4c-3.1-3.1-3.1-8.2,0-11.3l11.3-11.3c3.1-3.1,8.2-3.1,11.3,0,19.3,19.3,45.9,30.1,74.2,30.1s54.9-10.8,74.2-30.1c3.1-3.1,8.2-3.1,11.3,0l11.3,11.3c3.2,3.1,3.2,8.2,0,11.3Zm-11.3-102.6c-19.3,19.3-45.9,30.1-74.2,30.1s-54.9-10.8-74.2-30.1c-3.1-3.1-8.2-3.1-11.3,0l-11.3,11.3c-3.1,3.1-3.1-8.2,0,11.3,39,39.4,95.1,52.1,151.2,52.1s112.2-12.7,151.2-52.1c3.1-3.1,3.1-8.2,0-11.3l-11.3-11.3c-3.1-3.1-8.2-3.1-11.3,0Z"/></svg>
    `,

    /**
     * 根據當前頁面深度取得相對路徑前綴
     */
    getPathPrefix() {
        const path = window.location.pathname;
        if (path.includes('/pages/articles/')) return '../../';
        if (path.includes('/pages/')) return '../';
        return '';
    },

    /**
     * 渲染完整導航 Header (用於首頁)
     */
    renderFullHeader() {
        const prefix = this.getPathPrefix();
        return `
        <header class="sticky top-0 z-50 bg-[#FEFDF8]/80 backdrop-blur-lg">
            <div class="container mx-auto px-6 py-4 flex justify-between items-center">
                <a href="${prefix}index.html" class="flex items-center space-x-3">
                    ${this.logoSVG}
                    <span class="text-2xl font-extrabold text-[#A44A3F]">ADHD 光譜</span>
                </a>
                <nav class="hidden md:flex items-center space-x-10 text-lg">
                    <a href="${prefix}pages/about-adhd.html" class="text-gray-700 hover:text-[#A44A3F] transition-colors">關於 ADHD</a>
                    <a href="${prefix}pages/holistic-approach.html" class="text-gray-700 hover:text-[#A44A3F] transition-colors">治療選項</a>
                    <a href="${prefix}pages/strategies.html" class="text-gray-700 hover:text-[#A44A3F] transition-colors">生活策略</a>
                    <a href="${prefix}pages/research.html" class="text-gray-700 hover:text-[#A44A3F] transition-colors">研究新知</a>
                </nav>
                <a href="${prefix}pages/contact.html" class="bg-[#3D352E] text-white font-bold py-2 px-5 rounded-full hover:bg-[#A44A3F] transition-colors">
                    聯絡我們
                </a>
            </div>
        </header>`;
    },

    /**
     * 渲染簡化 Header (用於內容頁面)
     */
    renderSimpleHeader(backLink = null, backText = '回到首頁') {
        const prefix = this.getPathPrefix();
        const link = backLink || `${prefix}index.html`;
        return `
        <header class="sticky top-0 z-50 bg-[#FEFDF8]/80 backdrop-blur-lg">
            <div class="container mx-auto px-6 py-4 flex justify-between items-center">
                <a href="${prefix}index.html" class="flex items-center space-x-3">
                    ${this.logoSVG}
                    <span class="text-2xl font-extrabold text-[#A44A3F]">ADHD 光譜</span>
                </a>
                <a href="${link}" class="text-gray-700 hover:text-[#A44A3F] transition-colors">&larr; ${backText}</a>
            </div>
        </header>`;
    },

    /**
     * 渲染完整 Footer
     */
    renderFullFooter() {
        const prefix = this.getPathPrefix();
        return `
        <footer class="bg-[#3D352E] text-white">
            <div class="container mx-auto px-6 py-12">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-left">
                    <div>
                        <h4 class="text-lg font-bold mb-4">核心內容</h4>
                        <ul class="space-y-2">
                            <li><a href="${prefix}pages/about-adhd.html" class="text-gray-300 hover:text-white transition-colors">認識 ADHD</a></li>
                            <li><a href="${prefix}pages/holistic-approach.html" class="text-gray-300 hover:text-white transition-colors">全方位治療</a></li>
                            <li><a href="${prefix}pages/strategies.html" class="text-gray-300 hover:text-white transition-colors">生活策略</a></li>
                            <li><a href="${prefix}pages/faq.html" class="text-gray-300 hover:text-white transition-colors">常見問答</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="text-lg font-bold mb-4">深度資源</h4>
                        <ul class="space-y-2">
                            <li><a href="${prefix}pages/research.html" class="text-gray-300 hover:text-white transition-colors">研究新知</a></li>
                            <li><a href="${prefix}pages/glossary.html" class="text-gray-300 hover:text-white transition-colors">詞彙表</a></li>
                            <li><a href="${prefix}pages/scales-explained.html" class="text-gray-300 hover:text-white transition-colors">認識量表</a></li>
                            <li><a href="${prefix}pages/toolbox.html" class="text-gray-300 hover:text-white transition-colors">實用工具箱</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="text-lg font-bold mb-4">關於我們</h4>
                        <ul class="space-y-2">
                            <li><a href="${prefix}pages/about.html" class="text-gray-300 hover:text-white transition-colors">網站緣起</a></li>
                            <li><a href="${prefix}pages/contact.html" class="text-gray-300 hover:text-white transition-colors">聯絡我們</a></li>
                            <li><a href="${prefix}pages/sitemap.html" class="text-gray-300 hover:text-white transition-colors">網站地圖</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="text-lg font-bold mb-4">給支持者</h4>
                        <ul class="space-y-2">
                            <li><a href="${prefix}pages/for-supporters.html" class="text-gray-300 hover:text-white transition-colors">支持者指南</a></li>
                        </ul>
                    </div>
                </div>
                <div class="mt-12 border-t border-gray-700 pt-8 text-center text-gray-400 text-sm">
                    <p class="text-gray-400">&copy; 2025 ADHD 光譜。本計畫由陽明交大高教深耕計畫支持。</p>
                    <div class="mt-4 flex justify-center items-center space-x-2">
                        <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.zh-hant" target="_blank" rel="noopener noreferrer" class="flex items-center space-x-2 hover:text-white transition-colors">
                            ${this.ccIcons}
                            <span class="ml-1">網站原創內容採用創用 CC 姓名標示─相同方式分享 4.0 國際授權條款。</span>
                        </a>
                    </div>
                </div>
            </div>
        </footer>`;
    },

    /**
     * 渲染簡化 Footer (用於內容頁面)
     */
    renderSimpleFooter(customMessage = null) {
        const message = customMessage || '本頁資訊基於現行科學研究與臨床實務整理，僅供教育參考。';
        return `
        <footer class="bg-[#3D352E] text-white mt-20">
            <div class="container mx-auto px-6 py-12 text-center">
                <p class="text-gray-300">${message}</p>
                <p class="text-gray-400 text-sm mt-4">&copy; 2025 ADHD 光譜。網站原創內容採用<a href="https://creativecommons.org/licenses/by-sa/4.0/deed.zh-hant" target="_blank" rel="noopener noreferrer" class="underline hover:text-white">創用 CC 姓名標示─相同方式分享 4.0 國際</a>授權條款。</p>
            </div>
        </footer>`;
    },

    /**
     * 初始化組件
     */
    init(options = {}) {
        const {
            headerType = 'simple',
            footerType = 'simple',
            backLink = null,
            backText = '回到首頁',
            footerMessage = null
        } = options;

        // 注入 Header
        const headerContainer = document.getElementById('site-header');
        if (headerContainer) {
            headerContainer.innerHTML = headerType === 'full'
                ? this.renderFullHeader()
                : this.renderSimpleHeader(backLink, backText);
        }

        // 注入 Footer
        const footerContainer = document.getElementById('site-footer');
        if (footerContainer) {
            footerContainer.innerHTML = footerType === 'full'
                ? this.renderFullFooter()
                : this.renderSimpleFooter(footerMessage);
        }
    }
};

// DOM 載入完成時自動初始化
document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const headerType = body.dataset.headerType || 'simple';
    const footerType = body.dataset.footerType || 'simple';
    const backLink = body.dataset.backLink || null;
    const backText = body.dataset.backText || '回到首頁';
    const footerMessage = body.dataset.footerMessage || null;

    SiteComponents.init({
        headerType,
        footerType,
        backLink,
        backText,
        footerMessage
    });
});

// 匯出供其他模組使用
window.SiteComponents = SiteComponents;
