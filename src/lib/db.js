import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

let db = null;

async function ensureSchema(database) {
  const dailyLogsColumns = await database.all("PRAGMA table_info('Daily_Logs')");
  const columnNames = new Set(dailyLogsColumns.map((column) => column.name));

  if (!columnNames.has('last_updated_at')) {
    await database.exec("ALTER TABLE Daily_Logs ADD COLUMN last_updated_at TEXT");
  }

  if (!columnNames.has('last_updated_by')) {
    await database.exec("ALTER TABLE Daily_Logs ADD COLUMN last_updated_by TEXT");
  }
}

export async function getDb() {
  if (!db) {
    db = await open({
      filename: process.env.DB_PATH || path.join(process.cwd(), 'fleet.db'),
      driver: sqlite3.Database
    });
    await ensureSchema(db);
  }
  return db;
}
