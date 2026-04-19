const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function migrate() {
    const dbPath = process.env.DB_PATH || path.join(__dirname, 'fleet.db');
    console.log(`Connecting to database at ${dbPath}...`);
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    
    const updateResult = await db.run('UPDATE Vehicles SET supervisor_username = "umesh" WHERE supervisor_username = "sharath"');
    console.log(`Updated ${updateResult.changes} vehicles from Sharath to Umesh.`);
    
    const deleteResult = await db.run('DELETE FROM Users WHERE username = "sharath"');
    console.log(`Deleted Sharath user.`);
    
    console.log("Migration complete.");
}

migrate().catch(console.error);
