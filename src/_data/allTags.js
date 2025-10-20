const fs = require('fs');
const path = require('path');

module.exports = function() {
  const gamesDir = path.join(__dirname, 'games');
  const tags = new Set();
  
  if (!fs.existsSync(gamesDir)) {
    console.log('Games directory not found');
    return [];
  }
  
  const gameFiles = fs.readdirSync(gamesDir).filter(file => file.endsWith('.json'));
  
  gameFiles.forEach(file => {
    try {
      const content = fs.readFileSync(path.join(gamesDir, file), 'utf8');
      const game = JSON.parse(content);
      
      if (game.tags && Array.isArray(game.tags)) {
        game.tags.forEach(tag => tags.add(tag));
      }
    } catch (error) {
      console.warn(`Error reading ${file}:`, error.message);
    }
  });
  
  const result = Array.from(tags);
  console.log('allTags loaded:', result);
  return result;
};
