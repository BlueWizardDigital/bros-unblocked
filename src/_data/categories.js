const fs = require('fs');
const path = require('path');

module.exports = function() {
  const categoriesDir = path.join(__dirname, 'categories');
  
  if (!fs.existsSync(categoriesDir)) {
    console.log('Categories directory not found');
    return [];
  }
  
  const categoryFiles = fs.readdirSync(categoriesDir).filter(file => file.endsWith('.json'));
  
  const categories = categoryFiles.map(file => {
    const content = fs.readFileSync(path.join(categoriesDir, file), 'utf8');
    const category = JSON.parse(content);
    
    if (!category.slug) {
      console.warn(`Category in ${file} is missing slug!`);
      return null;
    }
    
    return category;
  }).filter(Boolean);
  
  console.log(`Loaded ${categories.length} categories`);
  return categories;
};
