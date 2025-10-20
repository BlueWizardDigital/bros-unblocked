const GAMES_PER_PAGE = 10;
let currentPage = 1;
const allGames = {{ games | dump | safe }};

function renderGamesPage(page = 1) {
  currentPage = page;
  
  const totalPages = Math.ceil(allGames.length / GAMES_PER_PAGE);
  const start = (page - 1) * GAMES_PER_PAGE;
  const pageGames = allGames.slice(start, start + GAMES_PER_PAGE);
  
  const container = document.getElementById('allGamesContainer');
  
  const html = pageGames.map(game => `
    <div class="game-card">
      <a href="/games/${game.slug}/">
        <img src="${game.image}" alt="${game.title}">
        <h3>${game.title}</h3>
        <p class="game-desc">${game.description.substring(0, 100)}...</p>
        <span class="category-badge">${game.category}</span>
      </a>
    </div>
  `).join('');
  
  container.innerHTML = html;
  renderGamesPagination(page, totalPages);
}

function renderGamesPagination(currentPage, totalPages) {
  const paginationContainer = document.getElementById('gamesPagination');
  let html = '';
  
  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }
  
  if (currentPage > 1) {
    html += `<a href="#" onclick="renderGamesPage(${currentPage - 1}); return false;">← Previous</a>`;
  }
  
  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      html += `<span class="current">${i}</span>`;
    } else {
      html += `<a href="#" onclick="renderGamesPage(${i}); return false;">${i}</a>`;
    }
  }
  
  if (currentPage < totalPages) {
    html += `<a href="#" onclick="renderGamesPage(${currentPage + 1}); return false;">Next →</a>`;
  }
  
  paginationContainer.innerHTML = html;
}

// Initialize
renderGamesPage(1);