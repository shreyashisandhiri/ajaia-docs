# Ajaia Docs — Submission manifest

## Included in this package
- `server.js` — Node HTTP server and JSON API
- `db.js` — SQLite schema and access-control/data helpers
- `public/index.html` — application UI
- `public/styles.css` — responsive styling
- `public/app.js` — editor, autosave, import, sharing, dashboard
- `tests/access.test.js` — automated authorization tests
- `package.json` — scripts and Node requirement
- `README.md` — setup, demo instructions, limitations, deployment
- `ARCHITECTURE.md` — design and tradeoffs
- `AI_WORKFLOW.md` — AI tools, contribution, verification
- `VIDEO_LINK.txt` — video link placeholder (replace before submitting)
- `DEPLOYMENT_URL.txt` — deployment link placeholder (replace before submitting)
- `screenshots/` — local preview screenshot if available

## Reviewer quick start
1. Use Node.js 22.13+.
2. Run `npm start`.
3. Open `http://localhost:3000`.
4. Use sidebar account switcher to test Alex Morgan and Sam Rivera.
5. Run `npm test` for authorization tests.

## External deliverables still required
- **Live deployment:** not created automatically; publish to a Node host with persistent SQLite storage.
- **Walkthrough video:** not recorded automatically; record a 3–5 minute Loom/YouTube demo.
- **Google Drive folder:** upload this package and share the folder with reviewers.

## Functionality status
Implemented: document CRUD, basic rich-text formatting, autosave, TXT/MD import, viewer sharing, owner/shared filters, local SQLite persistence, automated tests.

Not implemented: real authentication, real-time co-editing, DOCX import, version history, public deployment, walkthrough video.
