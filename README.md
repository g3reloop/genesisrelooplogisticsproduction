QMUL BA Politics – International Relations Timetable
===================================================

Static, accessible weekly timetable powered by Supabase (PostgreSQL) and deployable to any static host.

Tech Stack
 - Frontend: HTML5, CSS3, JavaScript
 - Backend: Supabase (PostgreSQL) with Row Level Security
 - Hosting: Netlify, Vercel, or GitHub Pages

Files
 - `index.html` – Main timetable page
 - `styles.css` – QMUL-inspired styling
 - `app.js` – Supabase integration and timetable logic
 - `supabase.sql` – Schema, RLS, indexes, and sample data
 - `README.md` – Setup instructions

Setup: Supabase
 1. Create a project at `https://supabase.com`.
 2. Open SQL Editor and run `supabase.sql`.
 3. Copy your Project URL and anon public key from Settings → API.

Configure Frontend
 1. Edit `app.js` and set `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
 2. Open `index.html` in a browser (or deploy).

Deploy
 - Netlify/Vercel: Import repo as a static site (no build step).
 - GitHub Pages: Enable Pages for the root.

Accessibility
 - Semantic table with sticky headers, strong contrast, focus states, aria-live status.

Updating Data
 - Insert/update rows in `timetable_events` via Supabase.

Troubleshooting
 - If no data: verify RLS read policy and table rows for Wed–Fri.

