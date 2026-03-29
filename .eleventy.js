module.exports = function (eleventyConfig) {

  // ── Static asset passthrough ──────────────────────────────────────────────
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("memory");
  eleventyConfig.addPassthroughCopy("favicon.ico");
  eleventyConfig.addPassthroughCopy("favicon.svg");
  eleventyConfig.addPassthroughCopy("nanoranch-opengraph.png");

  // ── Ignore files that aren't 11ty-managed templates ─────────────────────
  eleventyConfig.ignores.add("index.html");      // replaced by index.njk
  eleventyConfig.ignores.add("seed/**");          // React app — own build pipeline
  eleventyConfig.ignores.add("CLAUDE.md");
  eleventyConfig.ignores.add("_partials/**");     // legacy copy-paste partials

  // ── Add current year shortcode for footer copyright ───────────────────────
  eleventyConfig.addShortcode("year", () => String(new Date().getFullYear()));

  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
      layouts: "_includes",
    },
    // Treat all HTML and Markdown files as Nunjucks
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["njk", "html", "md"],
  };
};
