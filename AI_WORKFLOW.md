# Ajaia Docs — AI-Native Development Workflow

## 1. Overview

Ajaia Docs was developed as an AI-assisted full-stack engineering project.

The goal was to build and deploy a functional document workspace within a limited development time, prioritizing a complete working application over unnecessary complexity.

**Live Application:** https://ajaia-docs-iq6c.onrender.com

**GitHub Repository:** https://github.com/shreyashisandhiri/ajaia-docs

## 2. Development Tools

| Tool | Purpose |
|---|---|
| ChatGPT (GPT-6) | Requirements analysis, code generation, debugging assistance, documentation, and deployment guidance |
| Visual Studio Code | Editing and organizing project files |
| Node.js | Backend application and local execution |
| Node.js Test Runner | Automated verification |
| Git and GitHub | Version control and source hosting |
| Render | Application deployment |
| Turso | Persistent production database |

## 3. How AI Accelerated Development

### Requirements and Planning

ChatGPT helped break down the assignment into a practical implementation plan covering:

- Document creation and editing
- Rich-text formatting
- Autosaving and persistence
- Document sharing and permissions
- File importing
- Automated tests
- Deployment and documentation

The implementation prioritized completing the core user workflow:

**Create → Edit → Save → Reopen → Share**

### Code Generation

AI assistance was used to draft and refine:

- Node.js backend routes
- SQLite and Turso database functions
- Document access-control logic
- Frontend editing and sharing functionality
- Automated tests
- Architecture and submission documentation

Generated code was incorporated into the project and checked through local execution and testing.

### Debugging and Iteration

Several issues were encountered during development.

**Issue 1: JavaScript Syntax Error**

After modifying the document editing route, the application reported:

`SyntaxError: Missing catch or finally after try`

Reviewing the server code revealed duplicated code from the previous editing implementation, including an extra closing brace.

The server implementation was corrected, and `node --check server.js` subsequently completed successfully.

**Issue 2: Render Deployment Failure**

The initial Render deployment successfully built the application but failed during startup with:

`ReferenceError: createClient is not defined`

The issue was traced to a missing import in `db-turso.js`.

The required `createClient` import from `@libsql/client` was added, the change was committed to GitHub, and a subsequent Render deployment reached Live status.

**Issue 3: Persistent Production Storage**

Local SQLite storage was suitable for development, but Render's free instance does not provide durable local filesystem storage.

The application was extended to support Turso, a hosted SQLite-compatible database.

The backend now selects local SQLite for development and Turso when the production database environment variables are configured.

## 4. Human Review and Verification

AI-generated code was not treated as automatically correct.

The development process included:

- Running JavaScript syntax checks
- Running automated tests
- Reviewing terminal errors
- Inspecting Render deployment logs
- Correcting identified implementation issues
- Testing application behavior in the browser

Errors discovered during testing and deployment informed subsequent code changes.

## 5. Automated Testing

The project uses Node.js's built-in test runner.

Run:

```bash
npm test
```

The automated test suite contains three tests:

1. Owners can create and edit documents; other users cannot read them before sharing.
2. Sharing grants read-only access and prevents non-owners from sharing.
3. Invalid sharing recipients are rejected.

**Latest reported result:**

- Tests: 3
- Passed: 3
- Failed: 0

These automated tests primarily exercise the local SQLite implementation.

## 6. Live Deployment Verification

After deploying the application to Render, the following workflows were manually tested:

- Creating a document
- Entering document content
- Autosaving changes
- Refreshing the browser
- Reopening saved content
- Sharing a document from Alex Morgan to Sam Rivera
- Verifying that Sam can read the shared document
- Verifying that Sam cannot edit the shared document

These checks confirmed that the main user workflow operates on the deployed application.

## 7. Architecture and Engineering Decisions

### Simple Frontend Technology

HTML, CSS, and vanilla JavaScript were used to reduce setup overhead and keep the implementation lightweight.

### Node.js Backend

A Node.js HTTP server provides document APIs, validation, and access-control checks without introducing a larger backend framework.

### Local and Hosted SQLite

Local SQLite enables development without external credentials.

Turso provides persistent database storage for the deployed application.

### Demonstration User Model

Two selectable demonstration users were implemented to showcase document ownership and sharing.

This approach simplifies the demonstration but does not provide secure authentication.

### Read-Only Sharing

Shared users receive read-only access. Simultaneous collaborative editing was excluded from the initial scope.

## 8. Limitations and Responsible AI Use

AI assistance accelerated implementation but did not eliminate the need for testing or engineering judgment.

Known limitations include:

- Demonstration identities rather than secure authentication
- No real-time collaborative editing
- No document version history
- Limited import formats
- Browser `execCommand` used for rich-text formatting
- No automated browser-level end-to-end testing

The application is an engineering demonstration, not a production-grade document platform.

## 9. Future Improvements

With additional development time, the next priorities would be:

- Implementing secure user authentication
- Adding real-time collaboration and conflict handling
- Introducing a structured rich-text editor
- Expanding automated integration and browser tests
- Improving monitoring and security
- Supporting additional document import formats

## 10. Summary

AI-assisted development helped accelerate planning, implementation, debugging, and documentation.

The project progressed from a local document editor to a deployed full-stack application with persistent hosted storage and working document-sharing permissions.

The development process combined AI-generated suggestions with syntax checks, automated tests, deployment-log inspection, and manual verification.
