const fs = require('fs');
const path = require('path');

module.exports = function() {
  const gamesDir = path.join(__dirname, 'games');
  
  if (!fs.existsSync(gamesDir)) {
    console.log('Games directory not found');
    return [];
  }
  
  const gameFiles = fs.readdirSync(gamesDir).filter(file => file.endsWith('.json'));

  console.log(gameFiles);
  
  const games = gameFiles.map(file => {
    const content = fs.readFileSync(path.join(gamesDir, file), 'utf8');
    const game = JSON.parse(content);
    
    // Ensure slug exists
    if (!game.slug) {
      console.warn(`Game in ${file} is missing slug!`);
      return null;
    }
    
    return game;
  }).filter(Boolean); // Remove any null entries
  
  console.log(`Loaded ${games.length} valid games`);
  return games;
};
