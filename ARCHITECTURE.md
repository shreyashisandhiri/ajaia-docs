# Architecture and product decisions

## Goal
Ship a coherent vertical slice: create → edit → persist → share → reopen. The priority is a reliable end-to-end flow, not visual parity with Google Docs.

## System
- **Client:** dependency-free HTML/CSS/JavaScript SPA, served by the same Node process as the API. The browser's `contenteditable` element provides editing; toolbar actions use `execCommand`.
- **API:** Node `http` server with JSON endpoints under `/api`, 1 MB request-body limit, title and content-size validation, and explicit 401/403/404 responses.
- **Persistence:** built-in SQLite via `node:sqlite`, three tables (`users`, `documents`, `shares`), with foreign keys and cascading share deletion.
- **Authorization:** every document read checks ownership or a share grant; every edit/delete/share/revoke operation checks ownership. No reliance on hidden UI controls.
- **User simulation:** `X-Demo-User` header selects one of two seeded users. This is not authentication and is a deliberate, disclosed demo-only compromise.
- **Content:** rich-text HTML is saved; the server removes attributes and tags outside a small allowlist. File imports are HTML-escaped and converted to paragraphs.

## API contract
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/users` | List demo users |
| GET | `/api/documents` | List owned and shared documents |
| POST | `/api/documents` | Create document |
| GET | `/api/documents/:id` | Read if owner or shared |
| PUT | `/api/documents/:id` | Owner updates title/content |
| DELETE | `/api/documents/:id` | Owner deletes |
| POST | `/api/documents/:id/share` | Owner grants viewer access |
| POST | `/api/documents/:id/unshare` | Owner revokes access |

## Tradeoffs
1. **Dependency-free implementation instead of React/Tiptap:** faster offline build, simpler reviewer setup; costs some editing robustness and future extensibility.
2. **SQLite instead of managed Postgres:** zero setup and durable local storage; requires a persistent volume in deployment.
3. **Debounced autosave instead of explicit Save:** improves usability; a browser crash during the debounce window may lose the last keystrokes.
4. **Viewer-only sharing:** demonstrates access-control logic without introducing edit conflicts.
5. **Text/Markdown import only:** provides a useful import flow without complex DOCX parsing; Markdown is not rendered.

## Security boundaries
Backend ownership checks are enforced, but the demo identity header is spoofable. The application must not be treated as secure multi-tenant production software. Production would require authenticated sessions, CSRF protections where appropriate, a mature HTML sanitizer, auditing, and robust authorization tests.

## Testing and verification
`npm test` validates access isolation and sharing. Manual browser checks should verify toolbar formatting, import, autosave, refresh, and sharing. No claims of production security or real-time co-editing are made.
