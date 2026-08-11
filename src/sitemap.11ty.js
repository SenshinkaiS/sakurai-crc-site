// sitemap.xml をビルド時に自動生成（固定ページ + ブログ記事）
const BASE = "https://sakurai-crc.org";

const STATIC_PAGES = [
  { path: "/", priority: "1.0" },
  { path: "/first-visit.html", priority: "0.9" },
  { path: "/access.html", priority: "0.8" },
  { path: "/cardiac-rehab.html", priority: "0.9" },
  { path: "/checkup.html", priority: "0.8" },
  { path: "/clinic-info.html", priority: "0.6" },
  { path: "/contact.html", priority: "0.7" },
  { path: "/diseases.html", priority: "0.8" },
  { path: "/examinations.html", priority: "0.7" },
  { path: "/fees.html", priority: "0.6" },
  { path: "/internal-medicine.html", priority: "0.8" },
  { path: "/nash-treatment.html", priority: "0.7" },
  { path: "/news.html", priority: "0.7" },
  { path: "/primary-prevention.html", priority: "0.7" },
  { path: "/privacy-policy.html", priority: "0.3" },
  { path: "/sitemap.html", priority: "0.3" },
  { path: "/staff.html", priority: "0.7" },
  { path: "/telemedicine.html", priority: "0.8" },
  { path: "/vaccination.html", priority: "0.7" },
  { path: "/weight-management.html", priority: "0.7" },
  { path: "/blog/dr-blog.html", priority: "0.8" },
];

module.exports = class {
  data() {
    return { permalink: "sitemap.xml" };
  }
  render({ blog }) {
    const today = new Date().toISOString().slice(0, 10);
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    for (const p of STATIC_PAGES) {
      xml += `  <url>\n    <loc>${BASE}${p.path}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${p.priority}</priority>\n  </url>\n`;
    }
    for (const post of blog.posts) {
      xml += `  <url>\n    <loc>${BASE}/blog/posts/${post.slug}.html</loc>\n    <lastmod>${post.dateISO}</lastmod>\n    <priority>0.6</priority>\n  </url>\n`;
    }
    xml += "</urlset>\n";
    return xml;
  }
};
