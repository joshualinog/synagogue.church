module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    pathPrefix: "/synagogue.church/",
  };
};
