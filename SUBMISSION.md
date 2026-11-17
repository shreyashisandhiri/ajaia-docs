# Ajaia Docs — Submission Manifest

## Project Information

**Project:** Ajaia Docs — AI-Native Full Stack Developer Assignment

**Live Application:** https://ajaia-docs-iq6c.onrender.com

**GitHub Repository:** https://github.com/shreyashisandhiri/ajaia-docs

**Deployment:** Render (Node.js)

**Production Database:** Turso (hosted SQLite)

## Implemented Features

- Create, rename, edit, delete, and reopen documents
- Rich-text formatting with headings, bold, italic, underline, and lists
- Automatic document saving
- Import TXT and Markdown files
- Share documents between demonstration users
- Owner-only editing and read-only shared access
- Document search and filtering
- Persistent database storage
- Input validation and error handling

## Project Files

- `server.js` — HTTP server and REST API
- `db.js` — Local SQLite database implementation
- `db-turso.js` — Turso database implementation
- `public/index.html` — Application interface
- `public/styles.css` — Application styling
- `public/app.js` — Document editor and frontend functionality
- `tests/access.test.js` — Automated access-control tests
- `README.md` — Setup instructions and project documentation
- `ARCHITECTURE.md` — Architecture and design decisions
- `AI_WORKFLOW.md` — AI-assisted development workflow
- `package.json` — Dependencies and scripts

## Testing Results

**Automated tests:** 3 passed, 0 failed.

Verified locally using `npm test`.

**Live deployment manually verified:**

- Document creation
- Rich-text editing and autosaving
- Document reopening after browser refresh
- Sharing documents with another demonstration user
- Read-only permissions for shared documents

## Reviewer Walkthrough

1. Open https://ajaia-docs-iq6c.onrender.com.
2. Select Alex Morgan.
3. Create a new document.
4. Add formatted text and verify the Saved indicator.
5. Refresh the page and reopen the document.
6. Share the document with Sam Rivera.
7. Switch to Sam Rivera.
8. Open the shared document and verify that editing is disabled.

## Local Setup

```bash
git clone https://github.com/shreyashisandhiri/ajaia-docs.git
cd ajaia-docs
npm ci
npm start
```

Open http://localhost:3000.

Run automated tests with:

```bash
npm test
```

## Architecture and AI Development

See `ARCHITECTURE.md` for the system design, database architecture, access-control approach, and technical tradeoffs.

See `AI_WORKFLOW.md` for the AI-assisted implementation process, verification, and development decisions.

## Known Limitations

- Demonstration user switching is not secure authentication.
- Shared documents support read-only access, not simultaneous collaborative editing.
- No document version history, comments, or PDF/DOCX import.
- Browser-level end-to-end tests are not automated.

This application is a functional engineering demonstration and should not be used for sensitive documents.

## Additional Submission Deliverables

**Walkthrough Video:** To be added after recording.

**Google Drive Submission Folder:** To be added after uploading the final project package.

## Submission Status

- [x] Application implemented
- [x] Automated tests passing
- [x] GitHub repository published
- [x] Live application deployed
- [x] Persistent production database configured
- [x] Live document creation and sharing verified
- [ ] Walkthrough video recorded
- [ ] Google Drive folder prepared
- [ ] Final submission links collected
