# Ajaia Docs — Architecture and Product Decisions

## 1. Project Goal

Build a lightweight, Google Docs-inspired document workspace that supports the complete workflow:

**Create → Edit → Autosave → Persist → Share → Reopen**

The priority is a reliable, functional full-stack application rather than reproducing every feature of Google Docs.

## 2. System Architecture

```text
Browser (HTML, CSS, JavaScript)
              |
              | HTTP / JSON
              v
      Node.js HTTP Server
           server.js
              |
              | Validation and Access Control
              v
        Database Layer
              |
       +------+------+
       |             |
       v             v
  Local SQLite   Turso Database
    db.js         db-turso.js
       |             |
       v             v
 better-sqlite3   @libsql/client
 Development       Production
                       |
                    Render
```

### Frontend

The frontend uses HTML, CSS, and vanilla JavaScript.

Key responsibilities include:

- Document dashboard and navigation
- Rich-text editing using `contenteditable`
- Formatting through browser `execCommand`
- Debounced autosaving
- File import
- Document search and filtering
- Sharing interface
- Demonstration user switching

The frontend is served by the same Node.js application that provides the API.

### Backend

The backend is implemented using Node.js and its built-in HTTP server.

`server.js` handles:

- Static frontend delivery
- REST-style JSON API endpoints
- Request validation
- Document creation, retrieval, updating, and deletion
- Sharing and access revocation
- Owner and viewer permissions
- Error responses

Requests are limited to 1 MB. Document titles and content sizes are validated before saving.

### Database

The application supports two database configurations.

**Local Development**

- SQLite through `better-sqlite3`
- Database implementation: `db.js`
- Database stored locally
- No external database credentials required

**Production**

- Turso hosted SQLite database
- Database implementation: `db-turso.js`
- Connection through `@libsql/client`
- Database URL and authentication token configured using environment variables
- Persistent document storage independent of Render's application filesystem

The server selects Turso when `TURSO_DATABASE_URL` is configured. Otherwise, it uses local SQLite.

### Database Schema

The application uses three tables:

| Table | Purpose |
|---|---|
| `users` | Stores demonstration users |
| `documents` | Stores document ownership, titles, HTML content, and timestamps |
| `shares` | Stores document access grants |

The `shares` table connects documents to users who have permission to view them.

## 3. API Design

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/users` | Retrieve demonstration users |
| GET | `/api/documents` | List accessible documents |
| POST | `/api/documents` | Create a document |
| GET | `/api/documents/:id` | Open an accessible document |
| PUT | `/api/documents/:id` | Update an owned document |
| DELETE | `/api/documents/:id` | Delete an owned document |
| POST | `/api/documents/:id/share` | Grant viewer access |
| POST | `/api/documents/:id/unshare` | Revoke viewer access |

## 4. Authorization Model

Two demonstration users are available:

- Alex Morgan (`alex`)
- Sam Rivera (`sam`)

The selected identity is sent to the backend using the `X-Demo-User` request header.

The backend checks:

- Whether a user owns a document
- Whether a user has been granted access to read it
- Whether the user is authorized to edit, delete, share, or revoke access

Document owners have editing permissions. Shared recipients have read-only permissions.

**Important:** The demonstration identity header is not secure authentication. It can be spoofed and is intended only for the engineering demonstration.

## 5. Document Persistence and Autosaving

The editor automatically saves changes after approximately 650 milliseconds of inactivity.

Document content is stored as HTML in the database.

The production application uses Turso so documents remain stored independently of Render service restarts and redeployments.

Autosaving reduces manual interaction, but abrupt browser termination before a pending save completes may result in lost changes.

## 6. Deployment Architecture

**Frontend and Backend:** Render Web Service

**Database:** Turso hosted SQLite

**Source Control:** GitHub

Deployment flow:

```text
Developer
    |
    v
GitHub Repository
    |
    v
Render Build and Deployment
    |
    v
Node.js Application
    |
    v
Turso Hosted Database
```

Live application:

https://ajaia-docs-iq6c.onrender.com

GitHub repository:

https://github.com/shreyashisandhiri/ajaia-docs

## 7. Technical Tradeoffs

### Vanilla JavaScript Instead of React

Using vanilla JavaScript reduced setup complexity and allowed rapid development.

A production editor could benefit from React and a structured editor such as Tiptap or ProseMirror.

### SQLite and Turso Instead of PostgreSQL

SQLite simplified local development. Turso provides a hosted SQLite-compatible database suitable for this demonstration.

### Debounced Autosave

Autosaving improves usability but introduces a short interval in which unsaved changes may be lost.

### Read-Only Sharing

Read-only sharing demonstrates backend permission enforcement without requiring concurrent editing or conflict resolution.

### Limited File Import

TXT and Markdown files are supported as text imports. DOCX and PDF parsing were excluded to keep the implementation focused.

## 8. Security Considerations

The backend performs ownership checks and validates incoming document data.

HTML content is restricted to a small set of permitted tags, and unsupported attributes are removed.

However, this is not a production-grade security implementation.

Production improvements would include:

- Real authentication and authenticated sessions
- Stronger HTML sanitization
- CSRF protection where applicable
- Auditing and monitoring
- Additional authorization and integration tests

The application should not be used for sensitive information.

## 9. Testing and Verification

Automated tests run using:

```bash
npm test
```

Three tests verify:

- Document ownership and editing permissions
- Read-only sharing and unauthorized access restrictions
- Rejection of invalid sharing recipients

The live application was also manually verified for:

- Document creation
- Editing and autosaving
- Reopening after browser refresh
- Sharing between demonstration users
- Read-only access for shared documents

The automated tests primarily cover the local SQLite implementation. Production database behavior was verified through manual browser testing.

## 10. Future Improvements

- Real user authentication
- Real-time collaborative editing
- Document revision history
- Conflict detection
- DOCX and PDF import
- Automated end-to-end browser tests
- Improved observability and error reporting
- Production-grade security controls
