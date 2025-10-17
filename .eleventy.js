module.exports = function(eleventyConfig) {
	eleventyConfig.addPassthroughCopy("src/css");
	eleventyConfig.addPassthroughCopy("src/js");
	eleventyConfig.addPassthroughCopy("src/admin");
	
	return {
	  dir: {
		input: "src",
		output: "_site"
	  },
	  serverOptions: {
		port: 8081
	  }
	};
  };