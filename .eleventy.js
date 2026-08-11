module.exports = function (eleventyConfig) {
  // 静的ファイルはそのままコピー（現行サイトの構成を維持）
  eleventyConfig.addPassthroughCopy({ "static": "." });
  eleventyConfig.setUseGitIgnore(false);

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    templateFormats: ["njk", "11ty.js"],
  };
};
