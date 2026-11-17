# Rishir Infotech — IT Services & Technical Staffing

A modern, high-performance IT Services and Technical Staffing website built with an editorial monochrome aesthetic, fluid responsive layouts, and self-contained static assets.

## Overview

- **Design Aesthetic**: Minimalist editorial typography, high-contrast monochrome palette, fluid responsive grids.
- **Self-Contained**: 100% offline-ready with local web fonts (Inter & Anonymous Pro), local vector graphics, and bundled assets.
- **Zero External Dependencies**: Zero dependencies on third-party CDNs or remote APIs.
- **Multi-Route Architecture**:
  - `/` (Home) — Hero, client trust marquee, IT engineering delivery showcase, service offerings, client reviews, and blog highlights.
  - `/about` — Agency story, mission, and team directory.
  - `/services` — Comprehensive technical service tiers, capability breakdown, and FAQ accordion.
  - `/portfolio` — Project case studies and capability showcases.
  - `/blogs` — Industry insights, engineering trends, and technical articles.
  - `/contact` — Client inquiry and project discovery form.
  - `404.html` — Custom error page.

## Project Structure

```
├── about/              # About route with pre-rendered static HTML
├── assets/
│   ├── fonts/          # 30 local WOFF2 font files (Inter & Anonymous Pro)
│   ├── fonts.css       # Local font-face declarations
│   ├── index-*.css     # Compiled styling & Tailwind CSS classes
│   └── index-*.js      # Client routing & interaction bundle
├── blogs/              # Blog route
├── contact/            # Contact route
├── images/             # All local photography, covers, and client logos
│   ├── blog/
│   ├── clients/
│   ├── cover/
│   ├── layout/         # Custom Rishir Infotech SVG logos (black & white)
│   ├── project/
│   ├── services/
│   └── team/
├── portfolio/          # Portfolio showcase route
├── services/           # Services route
├── 404.html            # 404 error page
└── index.html          # Main entry page
```

## Running Locally

Serve the directory with any static file server:

```bash
# Using Python
python -m http.server 8080

# Using Node.js npx serve
npx serve .
```

Open `http://localhost:8080/` in your browser.

