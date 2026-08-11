// js/main.js

document.addEventListener('DOMContentLoaded', () => {

    // --- お知らせアコーディオン機能 ---
    function activateAccordion() {
        const accordionList = document.querySelector('.accordion-list');
        if (!accordionList) return;

        const accordionItems = accordionList.querySelectorAll('.accordion-item');
        accordionItems.forEach((item, index) => {
            const header = item.querySelector('.news-header');
            const content = item.querySelector('.accordion-content');
            if (header && content) {
                // キーボード操作対応
                header.setAttribute('role', 'button');
                header.setAttribute('tabindex', '0');
                header.setAttribute('aria-expanded', item.classList.contains('active') ? 'true' : 'false');

                const toggle = (e) => {
                    // aタグのクリックは除外
                    if (e.target.tagName === 'A') return;

                    const isActive = item.classList.contains('active');

                    // いったんすべて閉じる
                    accordionItems.forEach(otherItem => {
                        if (otherItem.classList.contains('active')) {
                            otherItem.classList.remove('active');
                            const otherContent = otherItem.querySelector('.accordion-content');
                            if (otherContent) otherContent.style.maxHeight = null;
                            const otherHeader = otherItem.querySelector('.news-header');
                            if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
                        }
                    });

                    // クリックしたものが非アクティブだったら開く
                    if (!isActive) {
                        item.classList.add('active');
                        content.style.maxHeight = (content.scrollHeight + 10) + 'px';
                        header.setAttribute('aria-expanded', 'true');
                    }
                };

                header.addEventListener('click', toggle);
                header.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggle(e);
                    }
                });
            }
        });
    }

    // --- トップページのお知らせを3ヶ月以内のものに絞って表示 ---
    function displayRecentNews() {
        // トップページの news-list がある場合のみ実行
        const newsContainer = document.querySelector('body.home .news-list.accordion-list');
        if (!newsContainer || typeof newsData === 'undefined' || typeof marked === 'undefined') return;

        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        // 3ヶ月以内のお知らせを表示。少ない場合でも直近3件は常に表示する
        const sortedNews = [...newsData].sort((a, b) => new Date(b.date) - new Date(a.date));
        let recentNews = sortedNews.filter(news => {
            const newsDate = new Date(news.date);
            return newsDate >= threeMonthsAgo;
        });
        if (recentNews.length < 3) {
            recentNews = sortedNews.slice(0, 3);
        }
        
        let newsHtml = '';
        recentNews.forEach(news => {
            newsHtml += `
                <li class="accordion-item">
                    <div class="news-header">
                        <time datetime="${news.date}">${news.date.replace(/-/g, '.')}</time>
                        <span class="accordion-title">${news.title}</span>
                    </div>
                    <div class="accordion-content">
                        ${marked.parse(news.content)}
                    </div>
                </li>
            `;
        });

        newsContainer.innerHTML = newsHtml || '<li>現在、新しいお知らせはありません。</li>';
        
        activateAccordion();
    }

    // --- お知らせ一覧ページ（news.html）の表示 ---
    function displayAllNews() {
        const newsContainer = document.querySelector('body.news-page .news-list.accordion-list');
        if (!newsContainer || typeof newsData === 'undefined' || typeof marked === 'undefined') return;
        
        let newsHtml = '';
        const sortedNewsData = [...newsData].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sortedNewsData.forEach(news => {
             newsHtml += `
                <li class="accordion-item">
                    <div class="news-header">
                        <time datetime="${news.date}">${news.date.replace(/-/g, '.')}</time>
                        <span class="accordion-title">${news.title}</span>
                    </div>
                    <div class="accordion-content">
                        ${marked.parse(news.content)}
                    </div>
                </li>
            `;
        });
        newsContainer.innerHTML = newsHtml || '<li>お知らせはまだありません。</li>';

        activateAccordion();
    }


    // --- ハンバーガーメニュー制御 ---
    const hamburgerButton = document.getElementById('hamburger-button');
    const mobileNav = document.getElementById('mobile-nav');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    const closeButton = mobileNav ? mobileNav.querySelector('.close-button') : null;
    const body = document.body;

    if (hamburgerButton && mobileNav && mobileNavOverlay && closeButton) {
        const openMenu = () => {
            hamburgerButton.setAttribute('aria-expanded', 'true');
            hamburgerButton.classList.add('is-open');
            mobileNav.classList.add('is-open');
            mobileNav.setAttribute('aria-hidden', 'false');
            mobileNavOverlay.classList.add('is-open');
            body.classList.add('mobile-nav-active');
        };
        const closeMenu = () => {
            hamburgerButton.setAttribute('aria-expanded', 'false');
            hamburgerButton.classList.remove('is-open');
            mobileNav.classList.remove('is-open');
            mobileNav.setAttribute('aria-hidden', 'true');
            mobileNavOverlay.classList.remove('is-open');
            body.classList.remove('mobile-nav-active');
        };
        hamburgerButton.addEventListener('click', () => {
            if (mobileNav.classList.contains('is-open')) {
                closeMenu();
            } else {
                openMenu();
            }
        });
        closeButton.addEventListener('click', closeMenu);
        mobileNavOverlay.addEventListener('click', closeMenu);
        const mobileNavLinks = mobileNav.querySelectorAll('a');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                closeMenu();
            });
        });
    }

    // --- ヒーロースライダー制御 ---
    const heroSlider = document.querySelector('.hero-slider');
    if (heroSlider) {
        const slides = heroSlider.querySelectorAll('.hero-slide');
        let currentSlide = 0;
        const slideInterval = 5000;

        if (slides.length > 1) {
            slides[currentSlide].classList.add('active');
            setInterval(() => {
                slides[currentSlide].classList.remove('active');
                currentSlide = (currentSlide + 1) % slides.length;
                slides[currentSlide].classList.add('active');
            }, slideInterval);
        } else if (slides.length === 1) {
             slides[0].classList.add('active');
        }
    }
    
    // --- 各ページの初期化処理 ---
    displayRecentNews();
    displayAllNews();
    
    // 静的生成されたお知らせを含む、全ページのアコーディオンを初期化
    activateAccordion();
});