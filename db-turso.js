import { randomUUID } from 'node:crypto';

export function createTursoClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    throw new Error(
      'TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be configured'
    );
  }

  return createClient({
    url,
    authToken
  });
}
export async function initializeTursoDatabase(client) {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      )
    `);
  
    await client.execute(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        html TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  
    await client.execute(`
      CREATE TABLE IF NOT EXISTS shares (
        document_id TEXT NOT NULL
          REFERENCES documents(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id),
        PRIMARY KEY (document_id, user_id)
      )
    `);
  
    await client.execute({
      sql: 'INSERT OR IGNORE INTO users(id, name) VALUES (?, ?)',
      args: ['alex', 'Alex Morgan']
    });
  
    await client.execute({
      sql: 'INSERT OR IGNORE INTO users(id, name) VALUES (?, ?)',
      args: ['sam', 'Sam Rivera']
    });
  }
  export async function listTursoDocuments(client, userId) {
    const result = await client.execute({
      sql: `SELECT d.id, d.title, d.owner_id, d.updated_at,
                   u.name AS owner_name,
                   CASE WHEN d.owner_id = ? THEN 'owned'
                        ELSE 'shared' END AS access
            FROM documents d
            JOIN users u ON u.id = d.owner_id
            WHERE d.owner_id = ?
               OR EXISTS (
                 SELECT 1 FROM shares s
                 WHERE s.document_id = d.id AND s.user_id = ?
               )
            ORDER BY d.updated_at DESC, d.id DESC`,
      args: [userId, userId, userId]
    });
  
    return result.rows;
  }
  
  export async function canTursoWrite(client, docId, userId) {
    const result = await client.execute({
      sql: 'SELECT 1 FROM documents WHERE id = ? AND owner_id = ?',
      args: [docId, userId]
    });
  
    return result.rows.length > 0;
  }
  
  export async function canTursoRead(client, docId, userId) {
    const result = await client.execute({
      sql: `SELECT 1 FROM documents d
            WHERE d.id = ?
            AND (
              d.owner_id = ?
              OR EXISTS (
                SELECT 1 FROM shares s
                WHERE s.document_id = d.id AND s.user_id = ?
              )
            )`,
      args: [docId, userId, userId]
    });
  
    return result.rows.length > 0;
  }
  export async function createTursoDocument(client, userId, title = 'Untitled document', html = '') {
    const id = randomUUID();
    await client.execute({
      sql: 'INSERT INTO documents(id, owner_id, title, html) VALUES (?, ?, ?, ?)',
      args: [id, userId, title, html]
    });
    return id;
  }
  
  export async function getTursoDocument(client, id, userId) {
    if (!(await canTursoRead(client, id, userId))) return null;
  
    const result = await client.execute({
      sql: `SELECT d.*, u.name AS owner_name
            FROM documents d JOIN users u ON u.id = d.owner_id
            WHERE d.id = ?`,
      args: [id]
    });
  
    const doc = result.rows[0];
    if (!doc) return null;
  
    const shares = await client.execute({
      sql: `SELECT u.id, u.name FROM shares s
            JOIN users u ON u.id = s.user_id
            WHERE s.document_id = ?`,
      args: [id]
    });
  
    return { ...doc, shared_with: shares.rows };
  }
  
  export async function updateTursoDocument(client, id, userId, fields) {
    if (!(await canTursoWrite(client, id, userId))) return false;
  
    const result = await client.execute({
      sql: 'SELECT title, html FROM documents WHERE id = ? AND owner_id = ?',
      args: [id, userId]
    });
  
    if (!result.rows.length) return false;
  
    const existing = result.rows[0];
  
    await client.execute({
      sql: `UPDATE documents
            SET title = ?, html = ?,
                updated_at = strftime('%Y-%m-%d %H:%M:%f', 'now')
            WHERE id = ? AND owner_id = ?`,
      args: [
        fields.title ?? existing.title,
        fields.html ?? existing.html,
        id,
        userId
      ]
    });
  
    return true;
  }
  
  export async function shareTursoDocument(client, id, ownerId, recipientId) {
    if (!(await canTursoWrite(client, id, ownerId))) return 'forbidden';
  
    const recipient = await client.execute({
      sql: 'SELECT 1 FROM users WHERE id = ?',
      args: [recipientId]
    });
  
    if (!recipient.rows.length) return 'unknown_user';
    if (recipientId === ownerId) return 'self';
  
    await client.execute({
      sql: 'INSERT OR IGNORE INTO shares(document_id, user_id) VALUES (?, ?)',
      args: [id, recipientId]
    });
  
    return 'ok';
  }