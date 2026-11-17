# Ajaia Docs

A small, full-stack collaborative document workspace built for the Ajaia engineering exercise. **No npm install, API key, paid dependency, or external database is needed to run locally.**

## Requirements
- Node.js **22.13+** (uses the built-in `node:sqlite` module)

## Run locally
```bash
node --version
npm start
```
Open **http://localhost:3000**. For automatic server restarts while developing, use `npm run dev`.

## Demo users and sharing walkthrough
The top of the left sidebar contains a **Current Workspace** selector with two seeded identities:
- **Alex Morgan** (`alex`)
- **Sam Rivera** (`sam`)

1. As Alex, create a document, type content, format it, and wait for the **Saved** indicator.
2. Click **Share**, select Sam, and grant access.
3. Go back to All Documents, switch the demo user to Sam, then select **Shared with me**.
4. Open Alex's document. Sam can view but cannot edit, delete, or share it.
5. Switch back to Alex to revoke access in the Share dialog.

**Important:** Demo identity switching is intentionally not secure authentication. This is a product demo with backend-enforced permissions *for the supplied identity*, not a production-grade auth system. Do not expose sensitive information through this app.

## Feature set
- Create, rename, delete, save, and reopen documents
- Rich text: bold, italic, underline, headings, bullets, numbered lists, and clear formatting
- Autosave after ~650 ms of inactivity; save on navigation and Ctrl/Cmd+S
- Import `.txt` and `.md` files up to **500 KB** as editable documents. Markdown is imported as **plain text**, not converted to styled Markdown.
- Share with another demo user; owners can revoke sharing; shared documents are read-only
- Filter owned/shared documents and search by title
- SQLite persistence for document content and sharing grants
- Basic request validation, response errors, and tests

## Storage and environment
By default, SQLite is created at `./data/ajaia.sqlite`. Set `DB_PATH` to a writable persistent path if needed. `PORT` defaults to `3000`.

```bash
PORT=3000 DB_PATH=./data/ajaia.sqlite npm start
npm test
```

SQLite stores HTML for rich-text content. The server strips unsupported HTML tags and attributes before storing it. This is intentionally a constrained editor, not a full HTML sanitizer for arbitrary hostile markup.

## Deployment
Deploy to a **Node.js 22+ host with a persistent filesystem** (e.g., a small VPS or a service with an attached persistent disk):
1. Upload this repository or connect it to the hosting provider.
2. Set the start command to `npm start` and Node version to 22.13+.
3. Set `DB_PATH` to a path on the provider's **persistent volume** (for example `/data/ajaia.sqlite`).
4. Set the provider's port configuration to use the `PORT` environment variable.
5. Verify the homepage, create/edit/refresh, and share/switch-user flows on the public URL.

**Deployment caveat:** Platforms with ephemeral filesystems may lose SQLite data on restart/redeploy. A persistent disk or hosted database is necessary for durable production hosting. No live URL is included in this package because deployment requires access to the submitter's hosting account.

## Testing
Run `npm test`. Three automated tests cover ownership, unauthorized reads/writes, sharing permissions, and invalid recipients. Additionally, manually test import, formatting, autosave, refresh, user switching, and access revocation.

## Known limitations
- Demo identity switcher, not real sign-in; no account security
- Sharing is owner-edit / recipient-read-only, not simultaneous collaborative editing
- No document version history, comments, or PDF/DOCX import
- Markdown imported as text; formatting is not interpreted
- `document.execCommand` is used for toolbar formatting for timebox simplicity; a production editor would use Tiptap/ProseMirror
- Saving on abrupt browser termination is not guaranteed; the UI warns if unsaved changes remain

## Next 2–4 hours
Replace demo identities with real authentication and session checks; add conflict/version detection for concurrent edits; migrate to a structured rich-text editor; add browser-level E2E tests; deploy with persistent storage and monitor failures.
