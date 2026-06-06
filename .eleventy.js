module.exports = function (eleventyConfig) {

  // ── Static asset passthrough ──────────────────────────────────────────────
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("memory");
  eleventyConfig.addPassthroughCopy("favicon.ico");
  eleventyConfig.addPassthroughCopy("favicon.svg");
  eleventyConfig.addPassthroughCopy("nanoranch-opengraph.png");
  eleventyConfig.addPassthroughCopy("seed/dist"); // compiled React assets → _site/seed/dist/

  // ── Ignore files that aren't 11ty-managed templates ──────────────────────
  eleventyConfig.ignores.add("index.html");       // replaced by index.njk
  eleventyConfig.ignores.add("img/**/*.html");    // reference/archived HTML in img folder
  // seed/ React app — ignore source, deps, and build output as templates;
  // seed/index.njk IS processed by Eleventy (it mounts the React app).
  eleventyConfig.ignores.add("seed/index.html");  // Vite standalone entry — conflicts with seed/index.njk
  eleventyConfig.ignores.add("seed/README.md");   // Vite scaffold readme — not a site page
  eleventyConfig.ignores.add("seed/src/**");
  eleventyConfig.ignores.add("seed/node_modules/**");
  eleventyConfig.ignores.add("seed/public/**");
  eleventyConfig.ignores.add("seed/dist/**");     // passthrough handles copying
  eleventyConfig.ignores.add(".claude/**");       // Claude Code worktrees
  eleventyConfig.ignores.add("CLAUDE.md");
  eleventyConfig.ignores.add("_partials/**");     // legacy copy-paste partials

  // ── Shortcodes ────────────────────────────────────────────────────────────
  eleventyConfig.addShortcode("year", () => String(new Date().getFullYear()));

  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
      layouts: "_includes",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["njk", "html", "md"],
  };
};
