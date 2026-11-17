import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

export function openDatabase(path = process.env.DB_PATH || './data/ajaia.sqlite') {
  if (path !== ':memory:') mkdirSync(dirname(resolve(path)), { recursive: true });
  const db = new Database(path);
  db.exec(`PRAGMA journal_mode=WAL;
    PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL, html TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS shares (
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      PRIMARY KEY (document_id,user_id)
    );`);
  db.prepare('INSERT OR IGNORE INTO users(id,name) VALUES (?,?)').run('alex','Alex Morgan');
  db.prepare('INSERT OR IGNORE INTO users(id,name) VALUES (?,?)').run('sam','Sam Rivera');
  return db;
}
export function canRead(db, docId, userId) {
  return !!db.prepare(`SELECT 1 FROM documents d WHERE d.id=? AND
    (d.owner_id=? OR EXISTS (SELECT 1 FROM shares s WHERE s.document_id=d.id AND s.user_id=?))`).get(docId,userId,userId);
}
export function canWrite(db, docId, userId) {
  return !!db.prepare('SELECT 1 FROM documents WHERE id=? AND owner_id=?').get(docId,userId);
}
export function listDocuments(db,userId) {
  return db.prepare(`SELECT d.id,d.title,d.owner_id,d.updated_at,u.name AS owner_name,
    CASE WHEN d.owner_id=? THEN 'owned' ELSE 'shared' END AS access
    FROM documents d JOIN users u ON u.id=d.owner_id
    WHERE d.owner_id=? OR EXISTS(SELECT 1 FROM shares s WHERE s.document_id=d.id AND s.user_id=?)
    ORDER BY d.updated_at DESC,d.id DESC`).all(userId,userId,userId);
}
export function createDocument(db, userId, title='Untitled document', html='') {
  const id=randomUUID();
  db.prepare('INSERT INTO documents(id,owner_id,title,html) VALUES(?,?,?,?)').run(id,userId,title,html);
  return id;
}
export function getDocument(db,id,userId) {
  if(!canRead(db,id,userId)) return null;
  const doc=db.prepare(`SELECT d.*,u.name AS owner_name FROM documents d JOIN users u ON u.id=d.owner_id WHERE d.id=?`).get(id);
  doc.shared_with=db.prepare(`SELECT u.id,u.name FROM shares s JOIN users u ON u.id=s.user_id WHERE s.document_id=?`).all(id);
  return doc;
}
export function updateDocument(db,id,userId,fields) {
  if(!canWrite(db,id,userId)) return false;
  const existing=db.prepare('SELECT title,html FROM documents WHERE id=?').get(id);
  db.prepare(`UPDATE documents SET title=?,html=?,updated_at=strftime('%Y-%m-%d %H:%M:%f','now') WHERE id=?`)
    .run(fields.title ?? existing.title,fields.html ?? existing.html,id);
  return true;
}
export function shareDocument(db,id,ownerId,recipientId) {
  if(!canWrite(db,id,ownerId)) return 'forbidden';
  if(!db.prepare('SELECT 1 FROM users WHERE id=?').get(recipientId)) return 'unknown_user';
  if(recipientId===ownerId) return 'self';
  db.prepare('INSERT OR IGNORE INTO shares(document_id,user_id) VALUES(?,?)').run(id,recipientId);
  return 'ok';
}
