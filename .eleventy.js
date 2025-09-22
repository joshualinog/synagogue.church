module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  const isProd = process.env.ELEVENTY_ENV === "production";
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
    pathPrefix: isProd ? "/synagogue.church/" : "/",
  };
};
