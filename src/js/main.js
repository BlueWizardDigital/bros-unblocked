// ============================================
// BROS UNBLOCKED - MAIN JAVASCRIPT
// Improved with debouncing, error handling, and proper event delegation
// ============================================

let allContent = null;
let allResults = [];
const RESULTS_PER_PAGE = 10;
const RAW_BASE_URL = '/bros-unblocked/';
const BASE_URL = RAW_BASE_URL.endsWith('/') ? RAW_BASE_URL : (RAW_BASE_URL + '/');
const DEBOUNCE_DELAY = 300; // ms
const BUILD_VERSION = (document && document.body && document.body.dataset && document.body.dataset.build) || '0';

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
      try {
        func(...args);
      } catch (err) {
        // Swallow to avoid breaking UI; rely on global handlers/logs.
        console.error('Debounced function error:', err);
      }
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
  errorDiv.textContent = String(message || 'An error occurred');

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

/**
 * Simple type guards
 */
const isArray = Array.isArray;
const isNonEmptyString = (v) => typeof v === 'string' && v.length > 0;

// ============================================
// CONTENT LOADING
// ============================================

/**
 * Load content.json with error handling
 * @returns {Promise<boolean>} - Success status
 */
async function loadContent() {
  if (allContent) return true;

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 8000) : null;

  try {
    const url = `${BASE_URL}content.json?v=${encodeURIComponent(BUILD_VERSION)}`;
    const response = await fetch(url, { signal: controller ? controller.signal : undefined });

    if (!response || !response.ok) {
      throw new Error(`HTTP error! status: ${response && response.status}`);
    }

    const data = await response.json();

    // Validate content structure
    if (!data || !isArray(data.games) || !isArray(data.pages) || !isArray(data.categories)) {
      throw new Error('Invalid content structure');
    }

    allContent = data;
    return true;
  } catch (error) {
    console.error('Failed to load content:', error);
    allContent = null;
    return false;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
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
  if (!allContent || !isNonEmptyString(query) || !query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  const results = [];

  // Search games
  if (isArray(allContent.games)) {
    allContent.games.forEach((game) => {
      if (!game || !isNonEmptyString(game.title)) return;

      const titleMatch = game.title.toLowerCase().includes(lowerQuery) ? 10 : 0;
      const descMatch = (game.description && game.description.toLowerCase().includes(lowerQuery)) ? 5 : 0;
      const tagMatch = (isArray(game.tags) && game.tags.some((tag) => isNonEmptyString(tag) && tag.toLowerCase().includes(lowerQuery))) ? 3 : 0;

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
  if (isArray(allContent.pages)) {
    allContent.pages.forEach((page) => {
      if (!page || !isNonEmptyString(page.title)) return;

      const titleMatch = page.title.toLowerCase().includes(lowerQuery) ? 10 : 0;
      const contentMatch = (page.content && page.content.toLowerCase().includes(lowerQuery)) ? 5 : 0;

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
  if (isArray(allContent.categories)) {
    allContent.categories.forEach((category) => {
      if (!category || !isNonEmptyString(category.name)) return;

      const nameMatch = category.name.toLowerCase().includes(lowerQuery) ? 10 : 0;
      const descMatch = (category.description && category.description.toLowerCase().includes(lowerQuery)) ? 5 : 0;

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
  if (!item || typeof item !== 'object') return '📌 Untitled';

  const emojis = {
    game: '🎮',
    page: '📄',
    category: '🏷️'
  };

  const emoji = emojis[item.type] || '📌';
  const title = isNonEmptyString(item.title) ? item.title : (isNonEmptyString(item.name) ? item.name : 'Untitled');

  return `${emoji} ${title}`;
}

/**
 * Get URL for search result
 * @param {Object} item - Search result item
 * @returns {string} - Result URL
 */
function getResultLink(item) {
  if (!item || !isNonEmptyString(item.slug)) return '#';

  const slug = encodeURIComponent(String(item.slug).trim());

  switch (item.type) {
    case 'game':
      return `${BASE_URL}games/${slug}/`;
    case 'page':
      return `${BASE_URL}${slug}/`;
    case 'category':
      return `${BASE_URL}category/${slug}/`;
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
  if (typeof URLSearchParams === 'undefined') return null;
  try {
    const urlParams = new URLSearchParams(window.location.search || '');
    return urlParams.get(param);
  } catch {
    return null;
  }
}

// ============================================
// HEADER SEARCH (Dropdown)
// ============================================

/**
 * Handle search input with debouncing
 */
const handleSearchInput = debounce(async (query, searchDropdown) => {
  if (!searchDropdown) return;

  if (!isNonEmptyString(query) || !query.trim()) {
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

  const html = results
    .map(
      (result) => `
    <a href="${getResultLink(result)}" class="search-result search-result-${result.type}">
      ${formatResult(result)}
    </a>`
    )
    .join('');

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
    handleSearchInput((e && e.target && e.target.value) || '', searchDropdown);
  });

  // Handle Enter key - redirect to search page
  searchInput.addEventListener('keydown', (e) => {
    if (e && e.key === 'Enter') {
      e.preventDefault();
      const query = (e.target && e.target.value && e.target.value.trim()) || '';
      if (query) {
        window.location.href = `${BASE_URL}search/?q=${encodeURIComponent(query)}`;
      }
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest || !e.target.closest('.search-container')) {
      searchDropdown.classList.remove('active');
    }
  });

  // Close dropdown on escape key
  document.addEventListener('keydown', (e) => {
    if (e && e.key === 'Escape') {
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
  const resultsContainer = document.getElementById('searchResults');
  if (!resultsContainer) return;

  const totalPages = Math.max(1, Math.ceil((allResults && allResults.length ? allResults.length : 0) / RESULTS_PER_PAGE));
  const currentPage = Math.min(Math.max(parseInt(page, 10) || 1, 1), totalPages);
  const start = (currentPage - 1) * RESULTS_PER_PAGE;
  const pageResults = (allResults || []).slice(start, start + RESULTS_PER_PAGE);

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

  const html = pageResults
    .map(
      (result) => `
    <div class="search-result-card search-result-${result.type}">
      <a href="${getResultLink(result)}">
        <h3>${formatResult(result)}</h3>
        <p>${(result.description || result.content || 'No description available')}</p>
      </a>
    </div>`
    )
    .join('');

  resultsContainer.innerHTML = html;
  renderPagination(currentPage, totalPages);

  // Scroll to top of results (guard against unsupported browsers)
  try {
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch {
    // no-op
  }
}

/**
 * Render pagination controls
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 */
function renderPagination(currentPage, totalPages) {
  const paginationContainer = document.getElementById('pagination');

  if (!paginationContainer) return;

  if (!Number.isFinite(currentPage) || !Number.isFinite(totalPages) || totalPages <= 1) {
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

  // Event delegation (more resilient than binding each link)
  paginationContainer.addEventListener('click', (e) => {
    const target = e.target.closest && e.target.closest('.pagination-btn');
    if (!target) return;
    e.preventDefault();
    const pageStr = target.getAttribute('data-page');
    const page = parseInt(pageStr, 10);
    if (!Number.isNaN(page)) {
      renderResults(page);
    }
  }, { once: true }); // re-attached on re-render
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

  if (isNonEmptyString(query)) {
    if (searchPageInput) {
      searchPageInput.value = query;
    }

    allResults = searchContent(query);
    renderResults(1);

    // Update page title (guard)
    try {
      document.title = `Search: "${query}" | Bros Unblocked`;
    } catch {
      // no-op
    }
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
      if (e && e.key === 'Enter') {
        e.preventDefault();
        const newQuery = (e.target && e.target.value && e.target.value.trim()) || '';
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
    if (!e.target.closest || !e.target.closest('.header-main')) {
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
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img && img.dataset && img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  } else {
    // Fallback: load immediately
    document.querySelectorAll('img[data-src]').forEach((img) => {
      if (img && img.dataset && img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      }
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
  console.log(`Game played: ${String(gameName || '').slice(0, 200)}`);

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
  try {
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
  } catch (err) {
    console.error('Initialization error:', err);
  }
});

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Global error handler
 */
window.addEventListener('error', (event) => {
  // event.error can be undefined in some browsers
  console.error('Global error:', event && (event.error || event.message || event));
  // Don't show error to user for every error, just log it
});

/**
 * Unhandled promise rejection handler
 */
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event && (event.reason || event));
});

// Add CSS for loading animation
(() => {
  try {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  } catch {
    // no-op
  }
})();

// ============================================
// CONTACT FORM (defensive guards)
// ============================================

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const statusDiv = document.getElementById('form-status');
  const submitBtn = form.querySelector('.submit-btn');
  const issueTypeSelect = document.getElementById('issue-type');
  const gameSelectGroup = document.getElementById('game-select-group');
  const gameSelect = document.getElementById('game');

  if (!statusDiv || !submitBtn || !issueTypeSelect || !gameSelectGroup || !gameSelect) {
    console.warn('Contact form: missing expected elements');
  }

  // Show/hide game selector based on issue type
  if (issueTypeSelect && gameSelectGroup && gameSelect) {
    issueTypeSelect.addEventListener('change', function () {
      const val = this && this.value;
      if (val === 'Game Bug Report') {
        gameSelectGroup.style.display = 'block';
        gameSelect.required = true;
      } else {
        gameSelectGroup.style.display = 'none';
        gameSelect.required = false;
        gameSelect.value = ''; // Clear selection
      }
    });
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!submitBtn || !statusDiv) return;

    // Disable button to prevent double submission
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    // Hide previous status
    statusDiv.style.display = 'none';
    statusDiv.className = '';

    try {
      const formData = new FormData(form);

      const action = form.getAttribute('action');
      if (!isNonEmptyString(action)) {
        throw new Error('Form action is not defined');
      }

      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 10000) : null;

      const response = await fetch(action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' },
        signal: controller ? controller.signal : undefined
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (response && response.ok) {
        statusDiv.textContent = 'Thanks for your message! We\'ll get back to you soon.';
        statusDiv.className = 'success';
        form.reset();
        // Reset conditional field
        if (gameSelectGroup && gameSelect) {
          gameSelectGroup.style.display = 'none';
          gameSelect.required = false;
        }
      } else {
        const code = response ? response.status : 'no-response';
        throw new Error(`Form submission failed (${code})`);
      }
    } catch (error) {
      statusDiv.textContent = 'Oops! Something went wrong. Please try again.';
      statusDiv.className = 'error';
      console.error('Contact form error:', error);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      }
      if (statusDiv) {
        statusDiv.style.display = 'block';
      }
    }
  });
});