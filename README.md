# Kasatria software Assessment: 3D Data View

Interactive 3D "periodic table" template from (three.js) that visualizes a Google Sheets dataset of 200 people with a Google Sign-In built-in authorization from a google cloud project that utilized OAuth API service. Built as the preliminary assignment for a Kasatria Software Developer application.

> **Version 1** — first iteration, implemented directly against the assessment structure and requirements provided by Kasatria.

## Features

- **Google Sign-In** via a Google Cloud OAuth client
- **Live data** from a link-shared Google Sheet: no backend, no API key
- **Net-worth coloring**: red `< $100K`, orange `$100K–$200K`, green `> $200K`
- **Four animated layouts**: Table (20×10), Sphere, double Helix, Grid (5×4×10)

## Tech stack

Vanilla HTML/CSS/JavaScript (no framework, no build step) | three.js CSS3D renderer via CDN import map | Google Identity Services (auth) | Google Sheets `gviz` JSON endpoint (data).

## Architecture & design choices

- **Static, no-build vanilla JS.** Two pages and one read-only data source don't justify a framework or bundler. The app ships as plain files.

- **Config separated from logic.** All environment-specific values (OAuth Client ID, Sheet ID) live in `js/config.js`; nothing is hard-coded in the logic files.

- **Client-side auth.** Google returns a signed JWT; the app decodes it and stores name/email/photo in `sessionStorage` to retrive from in the data view. A production app protecting private data would verify the token's signature server-side as well.

## Project structure

```
├── index.html        # Login page (Google Sign-In)
├── main.html         # Data view (3D periodic table)
├── css/style.css     # Styles for both pages
└── js/
    ├── config.js     # Client ID + Sheet ID
    ├── auth.js       # Google login, JWT decode, session
    ├── main.js       # Auth gate, top bar, sign out
    └── periodic.js   # google Sheet fetch + 3D layouts
```

## Running locally

Google Sign-In and ES modules require a served origin (not `file://`):

```bash
python3 -m http.server 5500
```

Then open `http://localhost:5500`. The origin must be listed in the Google Cloud OAuth client's **Authorized JavaScript origins**.
