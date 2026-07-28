import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

const projectRoot = path.resolve(currentDirectory, "../..");
const dataDirectory = path.join(projectRoot, "data");
const databasePath = path.join(dataDirectory, "zalo.db");

fs.mkdirSync(dataDirectory, { recursive: true });

const db = new Database(databasePath);

db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      zalo_user_id TEXT NOT NULL UNIQUE,
      display_name TEXT,
      session_data TEXT,
      status TEXT NOT NULL DEFAULT 'inactive',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      zalo_user_id TEXT NOT NULL,
      display_name TEXT,
      avatar_url TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (account_id)
        REFERENCES accounts(id)
        ON DELETE CASCADE,

      UNIQUE(account_id, zalo_user_id)
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      zalo_conversation_id TEXT NOT NULL,
      conversation_type TEXT NOT NULL,
      title TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (account_id)
        REFERENCES accounts(id)
        ON DELETE CASCADE,

      UNIQUE(account_id, zalo_conversation_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      zalo_message_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      content TEXT,
      message_type TEXT NOT NULL DEFAULT 'text',
      sent_at TEXT NOT NULL,
      raw_data TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (conversation_id)
        REFERENCES conversations(id)
        ON DELETE CASCADE,

      UNIQUE(conversation_id, zalo_message_id)
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      attachment_type TEXT NOT NULL,
      file_name TEXT,
      local_path TEXT,
      remote_url TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (message_id)
        REFERENCES messages(id)
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sync_state (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      conversation_id INTEGER,
      last_message_id TEXT,
      last_synced_at TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      error_message TEXT,

      FOREIGN KEY (account_id)
        REFERENCES accounts(id)
        ON DELETE CASCADE,

      FOREIGN KEY (conversation_id)
        REFERENCES conversations(id)
        ON DELETE CASCADE,

      UNIQUE(account_id, conversation_id)
    );

    CREATE INDEX IF NOT EXISTS idx_messages_conversation
      ON messages(conversation_id);

    CREATE INDEX IF NOT EXISTS idx_messages_sent_at
      ON messages(sent_at);
  `);

  initializeFts();

  console.log(`Database initialized: ${databasePath}`);
}

function initializeFts() {
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts
    USING fts5(
      sender_id,
      content,
      content = 'messages',
      content_rowid = 'id',
      tokenize = 'unicode61 remove_diacritics 2'
    );

    CREATE TRIGGER IF NOT EXISTS messages_fts_after_insert
    AFTER INSERT ON messages
    BEGIN
      INSERT INTO messages_fts (
        rowid,
        sender_id,
        content
      )
      VALUES (
        new.id,
        new.sender_id,
        new.content
      );
    END;

    CREATE TRIGGER IF NOT EXISTS messages_fts_after_delete
    AFTER DELETE ON messages
    BEGIN
      INSERT INTO messages_fts (
        messages_fts,
        rowid,
        sender_id,
        content
      )
      VALUES (
        'delete',
        old.id,
        old.sender_id,
        old.content
      );
    END;

    CREATE TRIGGER IF NOT EXISTS messages_fts_after_update
    AFTER UPDATE ON messages
    BEGIN
      INSERT INTO messages_fts (
        messages_fts,
        rowid,
        sender_id,
        content
      )
      VALUES (
        'delete',
        old.id,
        old.sender_id,
        old.content
      );

      INSERT INTO messages_fts (
        rowid,
        sender_id,
        content
      )
      VALUES (
        new.id,
        new.sender_id,
        new.content
      );
    END;
  `);
}

export function closeDatabase() {
  if (db.open) {
    db.close();
  }
}

export { db, databasePath };