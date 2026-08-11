// テンプレートページ（カテゴリ・タグ・アーカイブ絞り込み）と旧URLリダイレクトのために
// blog-data.js をビルド時に生成する。中身は microCMS（または legacy）由来のデータ。
module.exports = class {
  data() {
    return { permalink: "blog/blog-data.js" };
  }
  render({ blog }) {
    const legacy = blog.posts.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      date: p.dateJa,
      image: p.image,
      alt: p.alt,
      excerpt: p.excerpt,
      link: `posts/${p.slug}.html`,
      categories: p.categories,
      tags: p.tags,
      fullContent: p.bodyHtml,
    }));
    return (
      "// このファイルはビルド時に自動生成されます。直接編集しないでください。\n" +
      "const blogData = " +
      JSON.stringify(legacy, null, 1) +
      ";\n"
    );
  }
};
