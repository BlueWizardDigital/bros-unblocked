// ============================================
// BROS UNBLOCKED - MAIN JAVASCRIPT
// Improved with debouncing, error handling, and proper event delegation
// ============================================

let allContent = null;
let allResults = [];
const RESULTS_PER_PAGE = 10;
const BASE_URL = '/bros-unblocked/';
const DEBOUNCE_DELAY = 300; // ms
const BUILD_VERSION = document?.body?.dataset?.build;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Debounce function to limit how often a function is called
 * @param {Function} func - The function to debounce
 * @param {number} wait - The delay in milliseconds
 * @returns {Function} - The debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Show error message to user
 * @param {string} message - Error message to display
 * @param {HTMLElement} container - Container to show error in
 */
function showError(message, container) {
  if (!container) return;
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.style.cssText = `
    padding: 16px;
    background: #fee;
    border: 2px solid #fcc;
    border-radius: 8px;
    color: #c33;
    margin: 20px 0;
    text-align: center;
    font-weight: 600;
  `;
  errorDiv.textContent = message;
  
  container.innerHTML = '';
  container.appendChild(errorDiv);
}

/**
 * Show loading state
 * @param {HTMLElement} container - Container to show loading in
 */
function showLoading(container) {
  if (!container) return;
  
  container.innerHTML = `
    <div class="loading-spinner" style="text-align: center; padding: 40px;">
      <div style="font-size: 48px; animation: spin 1s linear infinite;">🎮</div>
      <p style="color: #666; margin-top: 16px;">Loading games...</p>
    </div>
  `;
}

// ============================================
// CONTENT LOADING
// ============================================

/**
 * Load content.json with error handling
 * @returns {Promise<boolean>} - Success status
 */
async function loadContent() {
  if (allContent) return true;
  
  try {
    const response = await fetch(`${BASE_URL}content.json?v=${BUILD_VERSION}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    allContent = await response.json();
    
    // Validate content structure
    if (!allContent.games || !allContent.pages || !allContent.categories) {
      throw new Error('Invalid content structure');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to load content:', error);
    allContent = null;
    return false;
  }
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

/**
 * Search through all content types
 * @param {string} query - Search query
 * @returns {Array} - Sorted search results
 */
function searchContent(query) {
  if (!query.trim() || !allContent) return [];
  
  const lowerQuery = query.toLowerCase();
  const results = [];
  
  // Search games
  if (allContent.games && Array.isArray(allContent.games)) {
    allContent.games.forEach(game => {
      if (!game || !game.title) return;
      
      const titleMatch = game.title.toLowerCase().includes(lowerQuery) ? 10 : 0;
      const descMatch = game.description?.toLowerCase().includes(lowerQuery) ? 5 : 0;
      const tagMatch = game.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ? 3 : 0;
      
      const score = titleMatch + descMatch + tagMatch;
      if (score > 0) {
        results.push({
          type: 'game',
          score,
          ...game
        });
      }
    });
  }
  
  // Search pages
  if (allContent.pages && Array.isArray(allContent.pages)) {
    allContent.pages.forEach(page => {
      if (!page || !page.title) return;
      
      const titleMatch = page.title.toLowerCase().includes(lowerQuery) ? 10 : 0;
      const contentMatch = page.content?.toLowerCase().includes(lowerQuery) ? 5 : 0;
      
      const score = titleMatch + contentMatch;
      if (score > 0) {
        results.push({
          type: 'page',
          score,
          ...page
        });
      }
    });
  }
  
  // Search categories
  if (allContent.categories && Array.isArray(allContent.categories)) {
    allContent.categories.forEach(category => {
      if (!category || !category.name) return;
      
      const nameMatch = category.name.toLowerCase().includes(lowerQuery) ? 10 : 0;
      const descMatch = category.description?.toLowerCase().includes(lowerQuery) ? 5 : 0;
      
      const score = nameMatch + descMatch;
      if (score > 0) {
        results.push({
          type: 'category',
          score,
          ...category
        });
      }
    });
  }
  
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Format search result with proper emoji
 * @param {Object} item - Search result item
 * @returns {string} - Formatted result string
 */
function formatResult(item) {
  const emojis = {
    game: '🎮',
    page: '📄',
    category: '🏷️'
  };
  
  const emoji = emojis[item.type] || '📌';
  const title = item.title || item.name || 'Untitled';
  
  return `${emoji} ${title}`;
}

/**
 * Get URL for search result
 * @param {Object} item - Search result item
 * @returns {string} - Result URL
 */
function getResultLink(item) {
  if (!item || !item.slug) return '#';
  
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

/**
 * Get URL parameter value
 * @param {string} param - Parameter name
 * @returns {string|null} - Parameter value
 */
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// ============================================
// HEADER SEARCH (Dropdown)
// ============================================

/**
 * Handle search input with debouncing
 */
const handleSearchInput = debounce(async (query, searchDropdown) => {
  if (!query.trim()) {
    searchDropdown.innerHTML = '';
    searchDropdown.classList.remove('active');
    return;
  }
  
  const results = searchContent(query).slice(0, 5);
  
  if (results.length === 0) {
    searchDropdown.innerHTML = '<div class="no-results">No results found 😢</div>';
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
}, DEBOUNCE_DELAY);

/**
 * Initialize header search functionality
 */
async function initHeaderSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchDropdown = document.getElementById('searchDropdown');

  if (!searchInput || !searchDropdown) return;
  
  // Load content first
  const loaded = await loadContent();
  if (!loaded) {
    console.error('Failed to initialize search - content not loaded');
    return;
  }

  // Input event with debouncing
  searchInput.addEventListener('input', (e) => {
    handleSearchInput(e.target.value, searchDropdown);
  });
  
  // Handle Enter key - redirect to search page
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = e.target.value.trim();
      if (query) {
        window.location.href = `${BASE_URL}search/?q=${encodeURIComponent(query)}`;
      }
    }
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      searchDropdown.classList.remove('active');
    }
  });
  
  // Close dropdown on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchDropdown.classList.remove('active');
      searchInput.blur();
    }
  });
}

// ============================================
// SEARCH PAGE (Results + Pagination)
// ============================================

/**
 * Render search results for a specific page
 * @param {number} page - Page number to render
 */
function renderResults(page = 1) {
  const totalPages = Math.ceil(allResults.length / RESULTS_PER_PAGE);
  const start = (page - 1) * RESULTS_PER_PAGE;
  const pageResults = allResults.slice(start, start + RESULTS_PER_PAGE);
  
  const resultsContainer = document.getElementById('searchResults');
  
  if (!resultsContainer) return;
  
  if (pageResults.length === 0) {
    resultsContainer.innerHTML = `
      <div class="no-results">
        <p style="font-size: 48px; margin-bottom: 16px;">😢</p>
        <p>No results found. Try a different search term!</p>
      </div>
    `;
    const paginationContainer = document.getElementById('pagination');
    if (paginationContainer) {
      paginationContainer.innerHTML = '';
    }
    return;
  }
  
  const html = pageResults.map(result => `
    <div class="search-result-card search-result-${result.type}">
      <a href="${getResultLink(result)}">
        <h3>${formatResult(result)}</h3>
        <p>${result.description || result.content || 'No description available'}</p>
      </a>
    </div>
  `).join('');
  
  resultsContainer.innerHTML = html;
  renderPagination(page, totalPages);
  
  // Scroll to top of results
  resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Render pagination controls
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 */
function renderPagination(currentPage, totalPages) {
  const paginationContainer = document.getElementById('pagination');
  
  if (!paginationContainer) return;
  
  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }
  
  let html = '';
  
  // Previous button
  if (currentPage > 1) {
    html += `<a href="#" data-page="${currentPage - 1}" class="pagination-btn">← Previous</a>`;
  }
  
  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    // Show first page, last page, current page, and pages around current
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      if (i === currentPage) {
        html += `<span class="current">${i}</span>`;
      } else {
        html += `<a href="#" data-page="${i}" class="pagination-btn">${i}</a>`;
      }
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      html += `<span>...</span>`;
    }
  }
  
  // Next button
  if (currentPage < totalPages) {
    html += `<a href="#" data-page="${currentPage + 1}" class="pagination-btn">Next →</a>`;
  }
  
  paginationContainer.innerHTML = html;
  
  // Add event listeners using event delegation
  paginationContainer.querySelectorAll('.pagination-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const page = parseInt(e.target.dataset.page);
      if (!isNaN(page)) {
        renderResults(page);
      }
    });
  });
}

/**
 * Initialize search page results
 */
async function initSearchPageResults() {
  const resultsContainer = document.getElementById('searchResults');
  const searchPageInput = document.getElementById('searchPageInput');
  
  if (!resultsContainer) return;
  
  // Show loading state
  showLoading(resultsContainer);
  
  // Load content
  const loaded = await loadContent();
  
  if (!loaded) {
    showError('Failed to load search content. Please try again later.', resultsContainer);
    return;
  }
  
  const query = getQueryParam('q');
  
  if (query) {
    if (searchPageInput) {
      searchPageInput.value = query;
    }
    
    allResults = searchContent(query);
    renderResults(1);
    
    // Update page title
    document.title = `Search: "${query}" | Bros Unblocked`;
  } else {
    resultsContainer.innerHTML = `
      <div class="no-results">
        <p style="font-size: 48px; margin-bottom: 16px;">🔍</p>
        <p>Enter a search term to find games, pages, and categories!</p>
      </div>
    `;
  }
  
  // Handle Enter key on search page input
  if (searchPageInput) {
    searchPageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const newQuery = e.target.value.trim();
        if (newQuery) {
          window.location.href = `${BASE_URL}search/?q=${encodeURIComponent(newQuery)}`;
        }
      }
    });
  }
}

// ============================================
// MOBILE MENU (if needed in future)
// ============================================

/**
 * Initialize mobile menu toggle
 */
function initMobileMenu() {
  const toggle = document.querySelector('.mobile-menu-toggle');
  const nav = document.querySelector('.main-nav');
  
  if (!toggle || !nav) return;
  
  toggle.addEventListener('click', () => {
    nav.classList.toggle('active');
    toggle.classList.toggle('active');
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.header-main')) {
      nav.classList.remove('active');
      toggle.classList.remove('active');
    }
  });
}

// ============================================
// LAZY LOADING IMAGES
// ============================================

/**
 * Initialize lazy loading for images
 */
function initLazyLoading() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
}

// ============================================
// ANALYTICS (placeholder for future use)
// ============================================

/**
 * Track game plays
 * @param {string} gameName - Name of game being played
 */
function trackGamePlay(gameName) {
  // Placeholder for analytics tracking
  console.log(`Game played: ${gameName}`);
  
  // Add your analytics code here
  // Example: gtag('event', 'game_play', { game_name: gameName });
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize all functionality when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Bros Unblocked - Initializing...');
  
  // Initialize header search on all pages
  initHeaderSearch();
  
  // Initialize search page if we're on /search/
  if (document.getElementById('searchResults')) {
    initSearchPageResults();
  }
  
  // Initialize mobile menu
  initMobileMenu();
  
  // Initialize lazy loading
  initLazyLoading();
  
  console.log('✅ Bros Unblocked - Ready!');
});

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Global error handler
 */
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Don't show error to user for every error, just log it
});

/**
 * Unhandled promise rejection handler
 */
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Add CSS for loading animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);