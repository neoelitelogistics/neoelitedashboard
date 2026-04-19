const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

async function setup() {
  const dbFile = path.join(__dirname, 'fleet.db');
  if (fs.existsSync(dbFile)) {
    fs.unlinkSync(dbFile);
    console.log('Removed existing database.');
  }

  const db = await open({
    filename: dbFile,
    driver: sqlite3.Database
  });

  console.log('Creating tables...');
  await db.exec(`
    CREATE TABLE Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL
    );

    CREATE TABLE Vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      truck_id TEXT UNIQUE NOT NULL,
      vehicle_no TEXT NOT NULL,
      vehicle_type TEXT NOT NULL,
      mode TEXT NOT NULL,
      customer_name TEXT,
      supervisor_username TEXT NOT NULL
    );

    CREATE TABLE Daily_Logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      truck_id TEXT NOT NULL,
      log_date TEXT NOT NULL,
      location TEXT,
      status TEXT,
      utilization TEXT,
      FOREIGN KEY(truck_id) REFERENCES Vehicles(truck_id)
    );
  `);

  console.log('Reading CSV and seeding data...');
  const vehicles = [];
  const supervisorsSet = new Set();
  supervisorsSet.add('Admin'); // Just to keep track of names

  // Insert Admin user manually
  await db.run('INSERT INTO Users (name, username, role) VALUES (?, ?, ?)', ['Management Admin', 'admin', 'Admin']);

  await new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, 'vehicles.csv'))
      .pipe(csv())
      .on('data', (row) => {
        if (row.Truck_ID && row.Vehicle_No) {
          const supervisor = row.Supervisor ? row.Supervisor.trim() : 'UNASSIGNED';
          const username = supervisor.toLowerCase().replace(/\\s+/g, '_');
          
          if (!supervisorsSet.has(username) && supervisor !== 'UNASSIGNED') {
            supervisorsSet.add(username);
          }

          vehicles.push({
            truck_id: row.Truck_ID,
            vehicle_no: row.Vehicle_No,
            vehicle_type: row.Vehicle_Type || 'MXL',
            mode: row.Mode || 'Line',
            customer_name: row.Customer_Name || '',
            supervisor_username: username
          });
        }
      })
      .on('end', async () => {
        try {
          // Insert Supervisors
          for (const username of supervisorsSet) {
            if (username === 'Admin') continue;
            const name = username.toUpperCase();
            await db.run('INSERT INTO Users (name, username, role) VALUES (?, ?, ?)', [name, username, 'Supervisor']);
          }

          // Insert Vehicles
          for (const v of vehicles) {
            await db.run(
              'INSERT INTO Vehicles (truck_id, vehicle_no, vehicle_type, mode, customer_name, supervisor_username) VALUES (?, ?, ?, ?, ?, ?)',
              [v.truck_id, v.vehicle_no, v.vehicle_type, v.mode, v.customer_name, v.supervisor_username]
            );
          }
          console.log(`Successfully seeded ${supervisorsSet.size - 1} supervisors and ${vehicles.length} vehicles.`);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
  });

  console.log('Database setup complete.');
}

setup().catch(err => {
  console.error(err);
});
