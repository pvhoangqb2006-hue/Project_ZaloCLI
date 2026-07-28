import Database from "better-sqlite3";
import fs from "node:fs";

const databasePath = "./data/zalo.db";

if (!fs.existsSync(databasePath)) {
  console.error("Database file does not exist:", databasePath);
  process.exit(1);
}

const db = new Database(databasePath, {
  readonly: true,
});

const tables = db
  .prepare(`
    SELECT
      name,
      type
    FROM sqlite_master
    WHERE type IN ('table', 'view')
      AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `)
  .all();

console.log("Database exists:", databasePath);
console.table(tables);

db.close();