const fs = require('fs');
const path = require('path');

module.exports = function() {
  const pagesDir = path.join(__dirname, 'pages');
  
  if (!fs.existsSync(pagesDir)) {
    console.log('Pages directory not found');
    return [];
  }
  
  const gameFiles = fs.readdirSync(pagesDir).filter(file => file.endsWith('.json'));
  
  const pages = gameFiles.map(file => {
    const content = fs.readFileSync(path.join(pagesDir, file), 'utf8');
    const page = JSON.parse(content);
    
    // Ensure slug exists
    if (!page.slug) {
      console.warn(`Page in ${file} is missing slug!`);
      return null;
    }
    
    return page;
  }).filter(Boolean); // Remove any null entries
  
  console.log(`Loaded ${pages.length} valid page`);
  return pages;
};
