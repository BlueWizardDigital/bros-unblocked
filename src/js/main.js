// ============================================
// SHARED SEARCH LOGIC
// ============================================

let allContent = null;
let allResults = [];
const RESULTS_PER_PAGE = 10;

const BASE_URL = '/bros-unblocked/';

async function loadContent() {
  if (allContent) return;
  
  try {
    const response = await fetch(`${BASE_URL}content.json`);
    allContent = await response.json();
  } catch (error) {
    console.error('Failed to load content:', error);
  }
}

function searchContent(query) {
  if (!query.trim() || !allContent) return [];
  
  const lowerQuery = query.toLowerCase();
  const results = [];
  
  allContent.games.forEach(game => {
    const titleMatch = game.title.toLowerCase().includes(lowerQuery) ? 10 : 0;
    const descMatch = game.description.toLowerCase().includes(lowerQuery) ? 5 : 0;
    const tagMatch = game.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ? 3 : 0;
    
    const score = titleMatch + descMatch + tagMatch;
    if (score > 0) {
      results.push({
        type: 'game',
        score,
        ...game
      });
    }
  });
  
  allContent.pages.forEach(page => {
    const titleMatch = page.title.toLowerCase().includes(lowerQuery) ? 10 : 0;
    const contentMatch = page.content.toLowerCase().includes(lowerQuery) ? 5 : 0;
    
    const score = titleMatch + contentMatch;
    if (score > 0) {
      results.push({
        type: 'page',
        score,
        ...page
      });
    }
  });
  
  allContent.categories.forEach(category => {
    const nameMatch = category.name.toLowerCase().includes(lowerQuery) ? 10 : 0;
    const descMatch = category.description.toLowerCase().includes(lowerQuery) ? 5 : 0;
    
    const score = nameMatch + descMatch;
    if (score > 0) {
      results.push({
        type: 'category',
        score,
        ...category
      });
    }
  });
  
  return results.sort((a, b) => b.score - a.score);
}

function formatResult(item) {
  switch(item.type) {
    case 'game':
      return `🎮 ${item.title}`;
    case 'page':
      return `📄 ${item.title}`;
    case 'category':
      return `🏷️ ${item.name}`;
    default:
      return item.title || item.name;
  }
}

function getResultLink(item) {
  switch(item.type) {
    case 'game':
      return `${BASE_URL}games/${item.slug}/`;
    case 'page':
      return `${BASE_URL}${item.slug}/`;
    case 'category':
      return `${BASE_URL}category/${item.slug}/`;
    default:
      return '#';
  }
}

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// ============================================
// HEADER SEARCH (Dropdown)
// ============================================

async function initHeaderSearch() {
  await loadContent();

  const searchInput = document.getElementById('searchInput');
  const searchDropdown = document.getElementById('searchDropdown');

  if (!searchInput || !searchDropdown) return;

  searchInput.addEventListener('input', async (e) => {
    const query = e.target.value;
    
    if (!query.trim()) {
      searchDropdown.innerHTML = '';
      searchDropdown.classList.remove('active');
      return;
    }
    
    const results = searchContent(query).slice(0, 5);
    
    if (results.length === 0) {
      searchDropdown.innerHTML = '<div class="no-results">No results found</div>';
      searchDropdown.classList.add('active');
      return;
    }
    
    const html = results.map(result => `
      <a href="${getResultLink(result)}" class="search-result search-result-${result.type}">
        ${formatResult(result)}
      </a>
    `).join('');
    
    searchDropdown.innerHTML = html;
    searchDropdown.classList.add('active');
  });
  
  // Handle Enter key - redirect to search page
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = e.target.value;
      window.location.href = `${BASE_URL}search/?q=${encodeURIComponent(query)}`;
    }
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      searchDropdown.classList.remove('active');
    }
  });
}

// ============================================
// SEARCH PAGE (Results + Pagination)
// ============================================

function renderResults(page = 1) {
  const totalPages = Math.ceil(allResults.length / RESULTS_PER_PAGE);
  const start = (page - 1) * RESULTS_PER_PAGE;
  const pageResults = allResults.slice(start, start + RESULTS_PER_PAGE);
  
  const resultsContainer = document.getElementById('searchResults');
  
  if (pageResults.length === 0) {
    resultsContainer.innerHTML = '<p class="no-results">No results found</p>';
    document.getElementById('pagination').innerHTML = '';
    return;
  }
  
  const html = pageResults.map(result => `
    <div class="search-result-card search-result-${result.type}">
      <a href="${getResultLink(result)}">
        <h3>${formatResult(result)}</h3>
        <p>${result.description || result.content || ''}</p>
      </a>
    </div>
  `).join('');
  
  resultsContainer.innerHTML = html;
  renderPagination(page, totalPages);
}

function renderPagination(currentPage, totalPages) {
  const paginationContainer = document.getElementById('pagination');
  let html = '';
  
  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }
  
  if (currentPage > 1) {
    html += `<a href="#" onclick="renderResults(${currentPage - 1}); return false;">← Previous</a>`;
  }
  
  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      html += `<span class="current">${i}</span>`;
    } else {
      html += `<a href="#" onclick="renderResults(${i}); return false;">${i}</a>`;
    }
  }
  
  if (currentPage < totalPages) {
    html += `<a href="#" onclick="renderResults(${currentPage + 1}); return false;">Next →</a>`;
  }
  
  paginationContainer.innerHTML = html;
}

async function initSearchPageResults() {
  await loadContent();
  
  const query = getQueryParam('q');
  const searchPageInput = document.getElementById('searchPageInput');
  
  if (query) {
    searchPageInput.value = query;
    allResults = searchContent(query);
    renderResults(1);
    document.title = `Search: "${query}"`;
  }
  
  // Handle Enter key on search page
  searchPageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const newQuery = e.target.value;
      window.location.href = `/search/?q=${encodeURIComponent(newQuery)}`;
    }
  });
  
  // Hide dropdown on search page
  const searchPageDropdown = document.getElementById('searchPageDropdown');
  if (searchPageDropdown) {
    searchPageDropdown.style.display = 'none';
  }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Init header search on all pages
  initHeaderSearch();
  
  // Init search page if we're on /search/
  if (document.getElementById('searchResults')) {
    initSearchPageResults();
  }
});