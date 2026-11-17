
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  openDatabase,
  listDocuments,
  createDocument,
  getDocument,
  updateDocument,
  shareDocument,
  canWrite
} from './db.js';

import {
  createTursoClient,
  initializeTursoDatabase,
  listTursoDocuments,
  canTursoWrite,
  createTursoDocument,
  getTursoDocument,
  updateTursoDocument,
  shareTursoDocument
} from './db-turso.js';

const root = fileURLToPath(new URL('./public/', import.meta.url));

const useTurso = Boolean(process.env.TURSO_DATABASE_URL);
const db = useTurso ? createTursoClient() : openDatabase();

if (useTurso) {
  await initializeTursoDatabase(db);
}

console.log(`Database: ${useTurso ? 'Turso' : 'Local SQLite'}`);

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

const MAX_BODY = 1024 * 1024;

function respond(res, status, data) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });

  res.end(JSON.stringify(data));
}

function user(req) {
  const id = req.headers['x-demo-user'];
  return id === 'alex' || id === 'sam' ? id : null;
}

async function body(req) {
  let size = 0;
  const chunks = [];

  for await (const chunk of req) {
    size += chunk.length;

    if (size > MAX_BODY) {
      const error = new Error('Request exceeds 1 MB');
      error.status = 413;
      throw error;
    }

    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    const error = new Error('Invalid JSON');
    error.status = 400;
    throw error;
  }
}

function validateTitle(value) {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.trim().length <= 120
  );
}

function validateHtml(value) {
  return (
    typeof value === 'string' &&
    Buffer.byteLength(value, 'utf8') <= 500000
  );
}

function cleanHtml(input) {
  let html = input
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(
      /<(script|style|iframe|object|embed|svg|math|form|input|button|textarea|select|link|meta)[^>]*>[\s\S]*?<\/\1\s*>/gi,
      ''
    )
    .replace(
      /<(script|style|iframe|object|embed|svg|math|form|input|button|textarea|select|link|meta)\b[^>]*\/?\s*>/gi,
      ''
    );

  html = html.replace(
    /<\/?([a-z][a-z0-9:-]*)\b([^>]*)>/gi,
    (full, tag) => {
      tag = tag.toLowerCase();

      const allowed = new Set([
        'p',
        'div',
        'br',
        'strong',
        'b',
        'em',
        'i',
        'u',
        'h1',
        'h2',
        'h3',
        'ul',
        'ol',
        'li',
        'blockquote'
      ]);

      if (!allowed.has(tag)) return '';

      return full.startsWith('</') ? `</${tag}>` : `<${tag}>`;
    }
  );

  return html;
}

// Database helpers: support both local SQLite and Turso.

async function listDocs(userId) {
  return useTurso
    ? await listTursoDocuments(db, userId)
    : listDocuments(db, userId);
}

async function getDoc(id, userId) {
  return useTurso
    ? await getTursoDocument(db, id, userId)
    : getDocument(db, id, userId);
}

async function createDoc(userId, title, html) {
  return useTurso
    ? await createTursoDocument(db, userId, title, html)
    : createDocument(db, userId, title, html);
}

async function canEdit(id, userId) {
  return useTurso
    ? await canTursoWrite(db, id, userId)
    : canWrite(db, id, userId);
}

async function updateDoc(id, userId, fields) {
  return useTurso
    ? await updateTursoDocument(db, id, userId, fields)
    : updateDocument(db, id, userId, fields);
}

async function shareDoc(id, ownerId, recipientId) {
  return useTurso
    ? await shareTursoDocument(db, id, ownerId, recipientId)
    : shareDocument(db, id, ownerId, recipientId);
}

async function deleteDoc(id, ownerId) {
  if (useTurso) {
    await db.execute({
      sql: 'DELETE FROM shares WHERE document_id = ?',
      args: [id]
    });

    await db.execute({
      sql: 'DELETE FROM documents WHERE id = ? AND owner_id = ?',
      args: [id, ownerId]
    });
  } else {
    db.prepare('DELETE FROM shares WHERE document_id = ?').run(id);
    db.prepare(
      'DELETE FROM documents WHERE id = ? AND owner_id = ?'
    ).run(id, ownerId);
  }
}

async function unshareDoc(id, userId) {
  if (useTurso) {
    await db.execute({
      sql: 'DELETE FROM shares WHERE document_id = ? AND user_id = ?',
      args: [id, userId]
    });
  } else {
    db.prepare(
      'DELETE FROM shares WHERE document_id = ? AND user_id = ?'
    ).run(id, userId);
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;

    if (path.startsWith('/api/')) {
      const current = user(req);

      if (!current) {
        return respond(res, 401, {
          error: 'Choose a valid demo user'
        });
      }

      // Demo users
      if (path === '/api/users' && req.method === 'GET') {
        return respond(res, 200, {
          users: [
            { id: 'alex', name: 'Alex Morgan' },
            { id: 'sam', name: 'Sam Rivera' }
          ],
          current
        });
      }

      // List documents
      if (path === '/api/documents' && req.method === 'GET') {
        const documents = await listDocs(current);

        return respond(res, 200, { documents });
      }

      // Create document
      if (path === '/api/documents' && req.method === 'POST') {
        const data = await body(req);

        if (
          data.title !== undefined &&
          !validateTitle(data.title)
        ) {
          return respond(res, 400, {
            error: 'Title must be 1–120 characters'
          });
        }

        if (
          data.html !== undefined &&
          !validateHtml(data.html)
        ) {
          return respond(res, 400, {
            error: 'Document content too large'
          });
        }

        const title = data.title?.trim() || 'Untitled document';
        const html = cleanHtml(data.html || '');

        const id = await createDoc(current, title, html);
        const document = await getDoc(id, current);

        return respond(res, 201, { document });
      }

      const match = path.match(
        /^\/api\/documents\/([a-f0-9-]{36})(?:\/(share|unshare))?$/
      );

      if (match) {
        const [, id, action] = match;

        // Open document
        if (req.method === 'GET' && !action) {
          const document = await getDoc(id, current);

          return document
            ? respond(res, 200, { document })
            : respond(res, 404, {
                error: 'Document not found or not shared with you'
              });
        }

        // Edit and autosave document
        if (req.method === 'PUT' && !action) {
          if (!(await canEdit(id, current))) {
            return respond(res, 403, {
              error: 'Only the owner can edit this document'
            });
          }

          const data = await body(req);

          if (
            data.title !== undefined &&
            !validateTitle(data.title)
          ) {
            return respond(res, 400, {
              error: 'Title must be 1–120 characters'
            });
          }

          if (
            data.html !== undefined &&
            !validateHtml(data.html)
          ) {
            return respond(res, 400, {
              error: 'Document content too large'
            });
          }

          const fields = {
            title: data.title?.trim(),
            html:
              data.html === undefined
                ? undefined
                : cleanHtml(data.html)
          };

          await updateDoc(id, current, fields);

          const document = await getDoc(id, current);

          return respond(res, 200, { document });
        }

        // Delete document
        if (req.method === 'DELETE' && !action) {
          if (!(await canEdit(id, current))) {
            return respond(res, 403, {
              error: 'Only the owner can delete'
            });
          }

          await deleteDoc(id, current);

          return respond(res, 200, { ok: true });
        }

        // Share document
        if (req.method === 'POST' && action === 'share') {
          const data = await body(req);

          const result = await shareDoc(
            id,
            current,
            data.userId
          );

          if (result !== 'ok') {
            return respond(
              res,
              result === 'forbidden' ? 403 : 400,
              { error: result }
            );
          }

          const document = await getDoc(id, current);

          return respond(res, 200, { document });
        }

        // Revoke sharing
        if (req.method === 'POST' && action === 'unshare') {
          if (!(await canEdit(id, current))) {
            return respond(res, 403, {
              error: 'Only the owner can revoke access'
            });
          }

          const data = await body(req);

          await unshareDoc(id, data.userId);

          const document = await getDoc(id, current);

          return respond(res, 200, { document });
        }
      }

      return respond(res, 404, {
        error: 'API endpoint not found'
      });
    }

    // Serve frontend files
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return respond(res, 405, {
        error: 'Method not allowed'
      });
    }

    const target =
      path === '/' ? 'index.html' : decodeURIComponent(path.slice(1));

    const normalized = normalize(target);

    if (
      normalized.startsWith('..') ||
      normalized.startsWith('/') ||
      normalized.includes('\\')
    ) {
      return respond(res, 403, { error: 'Forbidden' });
    }

    const filepath = join(root, normalized);
    const file = await readFile(filepath);

    res.writeHead(200, {
      'content-type':
        mime[extname(filepath)] || 'application/octet-stream',
      'x-content-type-options': 'nosniff'
    });

    res.end(req.method === 'HEAD' ? undefined : file);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return respond(res, 404, {
        error: 'Not found'
      });
    }

    console.error(error);

    return respond(res, error.status || 500, {
      error: error.status
        ? error.message
        : 'Internal server error'
    });
  }
});

const port = Number(process.env.PORT || 3000);

server.listen(port, '0.0.0.0', () => {
  console.log(`Ajaia Docs running at http://localhost:${port}`);
});
