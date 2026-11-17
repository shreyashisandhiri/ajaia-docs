# Ajaia Docs

A lightweight, full-stack document editor built for the Ajaia AI-Native Full Stack Developer engineering assignment.

**Live Application:** https://ajaia-docs-iq6c.onrender.com

**GitHub Repository:** https://github.com/shreyashisandhiri/ajaia-docs

## Features

- Create, rename, edit, delete, save, and reopen documents
- Rich-text formatting: bold, italic, underline, headings, and lists
- Automatic saving after approximately 650 ms of inactivity
- Import TXT and Markdown files as editable text
- Share documents between two demonstration users
- Owner-only editing and read-only shared access
- Search and filter documents
- Persistent storage using Turso (hosted SQLite)
- Input validation, error handling, and automated tests

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js HTTP server |
| Local database | SQLite using better-sqlite3 |
| Production database | Turso using @libsql/client |
| Deployment | Render |
| Version control | GitHub |
| Testing | Node.js built-in test runner |

## Run Locally

**Requirements:** Node.js 20 or 22 and npm.

```bash
git clone https://github.com/shreyashisandhiri/ajaia-docs.git
cd ajaia-docs
npm ci
npm start
```

Open http://localhost:3000.

The application automatically uses local SQLite when Turso environment variables are not configured.

## Production Database

The deployed application uses Turso for persistent document storage.

Configure these environment variables in Render:

- `TURSO_DATABASE_URL` — Turso database connection URL
- `TURSO_AUTH_TOKEN` — Turso database authentication token

Do not commit authentication tokens or environment secrets to GitHub.

## Demonstration Users

The application provides two demonstration identities:

- **Alex Morgan** — document owner
- **Sam Rivera** — shared-document viewer

### Sharing Walkthrough

1. Select Alex Morgan.
2. Create a document and enter formatted text.
3. Wait for the Saved indicator.
4. Share the document with Sam Rivera.
5. Switch to Sam Rivera.
6. Open the document under Shared with me.
7. Verify that Sam can read but cannot edit the document.

The backend checks ownership and sharing permissions for the selected demonstration identity.

**Security limitation:** The account selector is not secure authentication. This application is intended for demonstration purposes only. Do not store sensitive information.

## Testing

Run:

```bash
npm test
```

Three automated tests cover document ownership, access restrictions, sharing permissions, and invalid recipients.

The deployed application has also been manually verified for document creation, autosaving, reopening after refresh, and read-only sharing.

## Architecture

The browser interface communicates with a Node.js JSON API.

The API handles document operations, validation, and access-control checks.

The database layer selects local SQLite during development and Turso when production environment variables are configured.

Documents, users, and sharing permissions are stored in relational tables.

See `ARCHITECTURE.md` for further details.

## Known Limitations

- Demonstration identities rather than real authentication
- Read-only sharing rather than simultaneous collaborative editing
- No document version history or comments
- No PDF or DOCX import
- Markdown files are imported as plain text
- Rich-text formatting uses the browser's `execCommand` API
- No automated browser-level end-to-end test suite

## Future Improvements

- Secure user authentication
- Real-time collaborative editing
- Document version history
- Conflict detection for concurrent edits
- A structured editor such as Tiptap or ProseMirror
- Additional automated integration and browser tests
- Improved monitoring and production security

## Deployment

The application is deployed on Render using a free Node.js web service, with Turso providing persistent database storage.

**Live URL:** https://ajaia-docs-iq6c.onrender.com
