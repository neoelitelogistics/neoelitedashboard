import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

let db = null;

export async function getDb() {
  if (!db) {
    db = await open({
      filename: process.env.DB_PATH || path.join(process.cwd(), 'fleet.db'),
      driver: sqlite3.Database
    });
  }
  return db;
}
