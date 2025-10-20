const fs = require('fs');
const path = require('path');

module.exports = function(eleventyConfig) {
	eleventyConfig.addPassthroughCopy("src/css");
	eleventyConfig.addPassthroughCopy("src/js");
	eleventyConfig.addPassthroughCopy("src/admin");
	eleventyConfig.addPassthroughCopy("src/images");
	eleventyConfig.addPassthroughCopy("src/game-embed.html");

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

	eleventyConfig.addFilter("gamesByCategory", function(games, categorySlug) {
		return games.filter(game => 
			game.category && game.category.toLowerCase() === categorySlug.toLowerCase()
		  );
	});

	eleventyConfig.addFilter("toLowerCase", function(str) {
		return str.toLowerCase();
	});
	  
	  
	eleventyConfig.addFilter("gamesByTag", function(games, tag) {
		return games.filter(game => game.tags && game.tags.includes(tag));
	});

	// Global Vars
	  
	eleventyConfig.addGlobalData("currentYear", () => {
		return new Date().getFullYear();
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