const markdownIt = require('markdown-it');
const fs = require('fs');
const path = require('path');
const htmlmin = require("html-minifier-terser");

// --- Helpers to avoid duplicated filesystem reads ---
const CATEGORIES_DIR = path.join(__dirname, 'src/_data/categories');
const GAMES_DIR = path.join(__dirname, 'src/_data/games');

function readJsonFilesIn(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
}

function buildCategoryMap() {
  const map = {};
  for (const obj of readJsonFilesIn(CATEGORIES_DIR)) {
    if (obj?.slug) map[obj.slug.toLowerCase()] = obj;
  }
  return map;
}

const { execSync } = require("node:child_process");

module.exports = function(eleventyConfig) {
	eleventyConfig.addPassthroughCopy("src/css");
	eleventyConfig.addPassthroughCopy("src/js");
	eleventyConfig.addPassthroughCopy("src/admin");
	eleventyConfig.addPassthroughCopy("src/images");
	eleventyConfig.addPassthroughCopy("src/game-embed.html");

	// collection management
	eleventyConfig.addCollection("games", function() {
		const catMap = buildCategoryMap();
		const gameObjs = readJsonFilesIn(GAMES_DIR);

		return gameObjs.map(game => {
		  const slugs = Array.isArray(game.category) ? game.category : (game.category ? [game.category] : []);
		  game.category = slugs; // keep as slugs
		  game.categoriesResolved = slugs.map(s => catMap[s.toLowerCase()] || { slug: s, name: s });
		  return game;
		});
	  });
	

	eleventyConfig.addCollection("categories", function() {
		return readJsonFilesIn(CATEGORIES_DIR);
	  });

	  eleventyConfig.addGlobalData("categoryMap", () => buildCategoryMap());
	

	const md = markdownIt({
		html: true,
		breaks: true,
		linkify: true
	  });

	  eleventyConfig.addFilter("categoryName", function(slug, categoryMap) {
		if (!slug) return "";
		const key = String(slug).toLowerCase();
		return (categoryMap && categoryMap[key]?.name) || slug;
	  });

	eleventyConfig.addFilter("markdown", function(content) {
		return md.render(content);
	});

	eleventyConfig.addFilter("urlencode", function(str) {
		return encodeURIComponent(str);
	  });
	
	// Add filter for limiting arrays
	eleventyConfig.addFilter("limit", function(array, limit) {
		if (!array || !Array.isArray(array)) return [];
		return array.slice(0, limit);
	});

	// Add filter for truncating text
	eleventyConfig.addFilter("truncate", function(str, length) {
		if (!str) return "";
		if (str.length > length) {
			return str.substring(0, length) + "...";
		}
		return str;
	});

	// Add filter for dumping JSON
	eleventyConfig.addFilter('dateFilter', function(obj) {
		return new Date().toISOString();
	});

	// Add filter for slugifying text
	eleventyConfig.addFilter("slug", function(str) {
		if (!str) return "";
		return str.toLowerCase().replace(/[^a-z0-9]+/g, '-');
	});

	eleventyConfig.addFilter("gamesByCategory", function (games, categorySlug) {
		console.log('games, categorySlug', categorySlug);
		if (!Array.isArray(games)) return [];
	  
		return games.filter((game) => {
		  if (!game.category) return false;
	  
		  if (Array.isArray(game.category)) {
			// multiple categories
			return game.category.some(
			  (cat) => cat.toLowerCase() === categorySlug.toLowerCase()
			);
		  }
	  
		  // single category
		  return game.category.toLowerCase() === categorySlug.toLowerCase();
		});
	  });

	  eleventyConfig.addFilter("asArray", (v) => {
		if (v == null) return [];
		return Array.isArray(v) ? v : [v];
	  });

	eleventyConfig.addFilter("toLowerCase", function(str) {
		return str.toLowerCase();
	});
	  
	  
	eleventyConfig.addFilter("gamesByTag", function(games, tag) {
		return games.filter(game => game.tags && game.tags.includes(tag));
	});

	eleventyConfig.addTransform("htmlmin", async (content, outputPath) => {
		if (outputPath && outputPath.endsWith(".html")) {
		  return await htmlmin.minify(content, {
			collapseWhitespace: true,
			removeComments: true,
			minifyCSS: true,
			minifyJS: true,
		  });
		}
		return content;
	  });

	// Global Vars
	eleventyConfig.addGlobalData("currentYear", () => {
		return new Date().getFullYear();
	  });

	  eleventyConfig.addGlobalData("buildVersion", () => {
		try {
		  return execSync("git rev-parse --short HEAD").toString().trim();
		} catch {
		  return Date.now().toString();
		}
	  });

	return {
	  pathPrefix: "/bros-unblocked/",
	  dir: {
		input: "src",
		output: "_site"
	  },
	  serverOptions: {
		port: 8081
	  }
	};
};