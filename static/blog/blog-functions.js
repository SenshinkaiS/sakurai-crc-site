// 1ページに表示する記事の数
const POSTS_PER_PAGE = 5;

/**
 * ページのURLやIDに基づき、表示すべきコンテンツを動的に描画するメイン関数
 */
function displayPageContent() {
  const listContainer = document.getElementById('blog-posts-container');
  const postContainer = document.getElementById('post-container');

  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');

  if (postContainer && postId) {
    // 個別記事ページの場合
    displayFullPost(postContainer, parseInt(postId, 10));
  } else if (listContainer) {
    // 記事一覧ページの場合
    const category = urlParams.get('name');
    const tag = urlParams.get('tag');
    const archiveMonth = urlParams.get('month');
    const page = parseInt(urlParams.get('page') || '1', 10); // ★現在のページ番号を取得

    let allPosts = [];
    let pageTitle = '';
    let titlePrefix = '';
    let baseUrl = 'dr-blog.html'; // ★ベースURLを定義

    if (category) {
      titlePrefix = 'カテゴリー: ';
      pageTitle = decodeURIComponent(category);
      allPosts = blogData.filter(post => post.categories.includes(pageTitle));
      baseUrl = `template-category.html?name=${encodeURIComponent(category)}`;
    } else if (tag) {
      titlePrefix = 'タグ: ';
      pageTitle = decodeURIComponent(tag);
      allPosts = blogData.filter(post => post.tags && post.tags.includes(pageTitle));
      baseUrl = `template-tag.html?tag=${encodeURIComponent(tag)}`;
    } else if (archiveMonth) {
      titlePrefix = 'アーカイブ: ';
      const [year, month] = archiveMonth.split('-');
      pageTitle = `${year}年${parseInt(month, 10)}月`;
      allPosts = blogData.filter(post => {
        const postDate = new Date(post.date.replace(/年|月/g, '/').replace('日', '').trim());
        if (isNaN(postDate.getTime())) return false;
        return postDate.getFullYear() == year && (postDate.getMonth() + 1) == parseInt(month, 10);
      });
      baseUrl = `template-archive.html?month=${archiveMonth}`;
    } else {
      // ブログトップページ
      allPosts = blogData;
    }

    // ページタイトルと見出しを動的に設定
    const h2Element = document.getElementById('page-main-title');
    if (pageTitle && h2Element) {
      document.title = `${titlePrefix}${pageTitle} - 院長ブログ - 医療法人千心会 櫻井医院`;
      h2Element.textContent = `${titlePrefix}${pageTitle}`;
    }

    // ★ 日付でソートしてからページ分割する
    const sortedPosts = [...allPosts].sort((a, b) => new Date(b.date.replace(/年|月/g, '/').replace('日', '')) - new Date(a.date.replace(/年|月/g, '/').replace('日', '')));

    // ★ 表示する記事を計算
    const startIndex = (page - 1) * POSTS_PER_PAGE;
    const endIndex = startIndex + POSTS_PER_PAGE;
    const postsToDisplay = sortedPosts.slice(startIndex, endIndex);

    renderPosts(listContainer, postsToDisplay);
    
    // ★ ページネーションを描画
    const paginationContainer = document.getElementById('pagination-container');
    if (paginationContainer) {
      renderPagination(paginationContainer, page, sortedPosts.length, baseUrl);
    }
  }
}

/**
 * ★ 新設：ページネーションのHTMLを生成して描画する関数
 * @param {HTMLElement} container - ページネーションを描画するDOM要素
 * @param {number} currentPage - 現在のページ番号
 * @param {number} totalPosts - 記事の総数
 * @param {string} baseUrl - ページリンクのベースとなるURL
 */
function renderPagination(container, currentPage, totalPosts, baseUrl) {
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  container.innerHTML = ''; // コンテナをクリア

  if (totalPages <= 1) {
    return; // 1ページしかない場合は何も表示しない
  }

  let paginationHtml = '';

  // 「前へ」のリンク
  if (currentPage > 1) {
    const prevPageUrl = baseUrl.includes('?') ? `${baseUrl}&page=${currentPage - 1}` : `${baseUrl}?page=${currentPage - 1}`;
    paginationHtml += `<a href="${prevPageUrl}" class="page-link">&laquo;</a>`;
  }

  // ページ番号のリンク
  for (let i = 1; i <= totalPages; i++) {
    const pageUrl = baseUrl.includes('?') ? `${baseUrl}&page=${i}` : `${baseUrl}?page=${i}`;
    if (i === currentPage) {
      paginationHtml += `<a href="${pageUrl}" class="page-link active">${i}</a>`;
    } else {
      paginationHtml += `<a href="${pageUrl}" class="page-link">${i}</a>`;
    }
  }

  // 「次へ」のリンク
  if (currentPage < totalPages) {
    const nextPageUrl = baseUrl.includes('?') ? `${baseUrl}&page=${currentPage + 1}` : `${baseUrl}?page=${currentPage + 1}`;
    paginationHtml += `<a href="${nextPageUrl}" class="page-link">&raquo;</a>`;
  }

  container.innerHTML = paginationHtml;
}


/**
 * 個別のブログ記事をページに描画する関数
 */
function displayFullPost(container, postId) {
  // （変更なし）
  const post = blogData.find(p => p.id === postId);

  if (!post) {
    container.innerHTML = '<p>指定された記事が見つかりませんでした。</p>';
    return;
  }

  document.title = `${post.title} - 院長ブログ - 医療法人千心会 櫻井医院`;

  const categoriesHtml = post.categories.map(cat => `<span class="post-category">${cat}</span>`).join('');
  const tagsHtml = post.tags ? post.tags.map(tag => `<span class="post-tag">${tag}</span>`).join('') : '';

  const postHtml = `
    <header class="post-header" style="padding: 20px 20px 0;">
        <div class="post-meta">
            <div class="post-date">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                </svg>
                ${post.date}
            </div>
            <div class="post-categories">
                ${categoriesHtml}
            </div>
        </div>
        <h1 class="post-title" style="font-size: 2em; margin-top: 15px;">${post.title}</h1>
    </header>
    <figure class="post-image-container" style="margin: 20px 0;">
        <img src="${post.image}" alt="${post.alt}" class="post-image" style="height: auto; max-height: 400px; object-fit: contain; display: block; margin: 0 auto; border-radius: 8px;">
    </figure>
    <section class="post-full-content">
        ${marked.parse(post.fullContent)} </section>
    <footer class="post-footer" style="padding: 0 20px 20px;">
         <div class="post-tags">
             ${tagsHtml}
         </div>
    </footer>
  `;

  container.innerHTML = postHtml;
}


/**
 * サイドバーのカテゴリーリストを動的に生成
 */
function generateSidebarCategories() {
  // （変更なし）
  const container = document.querySelector('.sidebar-section .category-list');
  if (!container) return;

  const allCategories = new Set();
  blogData.forEach(post => {
    if (post.categories && Array.isArray(post.categories)) {
      post.categories.forEach(cat => allCategories.add(cat));
    }
  });
  
  let html = '';
  [...allCategories].sort().forEach(cat => {
    const url = `template-category.html?name=${encodeURIComponent(cat)}`;
    html += `<li><a href="${url}"><i class="material-icons category-icon">folder_open</i><span>${cat}</span></a></li>`;
  });
  
  container.innerHTML = html || '<li>カテゴリーはありません。</li>';
}

/**
 * サイドバーのアーカイブリストを動的に生成
 */
function generateSidebarArchives() {
  // （変更なし）
  const container = document.querySelector('.sidebar-section .archive-list');
  if (!container) return;

  const months = new Set();
  blogData.forEach(post => {
    const date = new Date(post.date.replace(/年|月/g, '/').replace('日', '').trim());
    if (isNaN(date.getTime())) return;
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    months.add(`${year}-${month}`);
  });

  let html = '';
  [...months].sort().reverse().forEach(monthStr => {
    const [year, month] = monthStr.split('-');
    const url = `template-archive.html?month=${monthStr}`;
    html += `<li><a href="${url}"><i class="material-icons category-icon">calendar_today</i><span>${year}年${parseInt(month, 10)}月</span></a></li>`;
  });
  
  container.innerHTML = html || '<li>アーカイブはありません。</li>';
}

/**
 * サイドバーのタグリストを動的に生成
 */
function generateSidebarTags() {
  // （変更なし）
  const container = document.querySelector('.sidebar-section .tag-list');
  if (!container) return;

  const allTags = new Set();
  blogData.forEach(post => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach(tag => allTags.add(tag));
    }
  });

  let html = '';
  [...allTags].sort((a,b) => a.localeCompare(b, 'ja')).forEach(tag => {
    const url = `template-tag.html?tag=${encodeURIComponent(tag)}`;
    html += `<li><a href="${url}">${tag}</a></li>`;
  });

  container.innerHTML = html || '<li>タグはありません。</li>';
}

/**
 * 記事の配列を受け取り、HTMLを描画する共通関数
 */
function renderPosts(container, posts) {
    if (!posts || posts.length === 0) {
        container.innerHTML = '<p style="padding: 20px;">この条件に該当する記事はありません。</p>';
        return;
    }
    
    // ★★ ここのソート処理は displayPageContent に移動したので削除します
    container.innerHTML = '';
    posts.forEach(post => {
        const categoriesHtml = post.categories.map(cat => `<span class="post-category">${cat}</span>`).join('');
        const postHtml = `
          <article class="blog-post">
              <img src="${post.image}" alt="${post.alt}" class="post-image">
              <div class="post-content">
                  <div class="post-meta">
                      <div class="post-date">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/></svg>
                          ${post.date}
                      </div>
                      <div class="post-categories">
                          ${categoriesHtml}
                      </div>
                  </div>
                  <h2 class="post-title">${post.title}</h2>
                  <div class="post-excerpt">
                      <p>${post.excerpt}</p>
                  </div>
                  <a href="${post.link}" class="read-more">続きを読む</a>
              </div>
          </article>
        `;
        container.innerHTML += postHtml;
    });
}

// ページの読み込みが完了したら各関数を実行
document.addEventListener('DOMContentLoaded', function() {
  generateSidebarCategories();
  generateSidebarArchives();
  generateSidebarTags();
  displayPageContent();
});