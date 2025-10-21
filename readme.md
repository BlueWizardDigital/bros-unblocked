# Bros Unblocked - Game Portal

A static game portal built with Eleventy, hosted on GitHub Pages, with a CMS for managing content.

## Tech Stack

- **Generator:** Eleventy (11ty)
- **CMS:** Decap CMS (Git-based)
- **Hosting:** GitHub Pages
- **CI/CD:** GitHub Actions
- **Search:** Client-side (vanilla JavaScript)

## Setup

### Prerequisites

- Node.js 18+
- Git
- GitHub account

### Installation
```bash
git clone https://github.com/BlueWizardDigital/bros-unblocked.git
cd bros-unblocked
npm install
```

### Local Development
```bash
npm run dev
```

Visit `http://localhost:8081`

### Build
```bash
npm run build
```

Outputs to `_site/`

## Architecture

### File Structure
```
src/
├── _data/           # Data collections (games, categories, pages)
├── _includes/       # Reusable templates
├── admin/           # Decap CMS config
├── css/             # Stylesheets
├── images/          # Static assets
├── js/              # Client-side JavaScript
├── index.njk        # Homepage
├── search.njk       # Search results page
├── games.njk        # All games listing
└── game.njk         # Individual game page
```

### Data Format

Games are stored as individual JSON files in `src/_data/games/`:
```json
{
  "slug": "puzzle-master-2",
  "title": "Puzzle Master 2",
  "description": "Challenge your mind...",
  "category": "Puzzle",
  "tags": ["puzzle", "brain-teaser"],
  "embedType": "iframe",
  "url": "https://example.com/game.html",
  "image": "/images/games/puzzle.png",
  "featured": true,
  "instructions": "..."
}
```

Same structure for categories and pages.

## Content Management

### CMS Access

Editors can manage content at: `https://bluewizarddigital.github.io/bros-unblocked/admin/`

### Adding Editors

1. Go to repo **Settings** → **Collaborators**
2. Add their GitHub username
3. They receive an invite
4. Once accepted, they can log into the CMS

### Adding Games

1. Log into `/admin/`
2. Navigate to **Games** collection
3. Click **New Game**
4. Fill in fields
5. Click **Publish**
6. GitHub Actions automatically rebuilds and deploys

## Search & Filtering

- **Header search:** Live dropdown with top 5 results
- **Search page:** Full results with pagination at `/search/?q=`
- **Category pages:** Auto-generated at `/category/[slug]/`
- **Tag pages:** Auto-generated at `/tag/[slug]/`

All search/filtering happens client-side using `content.json`.

## Build & Deploy

### GitHub Actions Workflow

On every push to `main`:

1. Install dependencies
2. Run Eleventy build
3. Deploy to GitHub Pages

Site is live at: `https://bluewizarddigital.github.io/bros-unblocked/`

### Manual Build
```bash
npx eleventy
# Output in _site/
```

## Configuration

### Site Settings

Edit `src/_data/site.json` via CMS or directly:
```json
{
  "title": "Bros Unblocked!",
  "description": "The ultimate game portal",
  "logo": "/images/logo.png",
  "hero": "/images/hero.jpg",
  "socialLinks": [...],
  "footerLinks": [...]
}
```

### Eleventy Config

`.eleventy.js` controls build behavior:

- `pathPrefix: "/bros-unblocked/"` — GitHub Pages subfolder
- Pass-through copy for assets (CSS, JS, images)
- Custom filters for search and pagination

## SEO

Each page has:
- Dynamic title tags based on content
- Meta descriptions
- Canonical URLs with pathPrefix
- Open Graph support (via meta tags in base.njk)

## Performance

- **Search:** Client-side (no server requests)
- **Pagination:** Client-side rendering
- **Assets:** Served from jsDelivr CDN
- **Build time:** ~0.2 seconds

## Troubleshooting

### Assets not loading (404 errors)

Ensure `.eleventy.js` has `pathPrefix: "/bros-unblocked/"` and all templates use `| url` filter:
```nunjucks
<img src="{{ '/images/logo.png' | url }}" alt="Logo">
```

### Search not working

Check browser console for errors. Ensure `content.json` is being generated:
```bash
npx eleventy
# Should output: Writing ./_site/content.json
```

### CMS login fails

1. Verify GitHub OAuth app is configured correctly
2. Check repo is public
3. Ensure your GitHub account is a collaborator

## Next Steps

- [ ] Add more games
- [ ] Customize CSS
- [ ] Set up Google AdSense
- [ ] Add analytics
- [ ] Enable comments/ratings (requires backend)

## License

MIT