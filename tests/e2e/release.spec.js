const { test, expect } = require('@playwright/test');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const localBaseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';
const prodBaseUrl =
  process.env.E2E_PROD_BASE_URL || 'https://neoelitedashboard-production.up.railway.app';
const managementUsername = process.env.MANAGEMENT_USERNAME || 'management';
const managementPassword = process.env.MANAGEMENT_PASSWORD || 'neoelite@123';
const today = '2026-04-20';

const seededOpsVehicle = {
  truck_id: 'E2EOPS001',
  vehicle_no: 'E2E-OPS-001',
  vehicle_type: 'MXL',
  mode: 'Line',
  customer_name: 'E2E Fleet',
  supervisor_username: 'saddam',
};

const seededStaleVehicle = {
  truck_id: 'E2ESTALE001',
  vehicle_no: 'E2E-STALE-001',
  vehicle_type: 'MXL',
  mode: 'Line',
  customer_name: 'E2E Fleet',
  supervisor_username: 'devi',
};

async function withDb(run) {
  const db = await open({
    filename: path.join(process.cwd(), 'fleet.db'),
    driver: sqlite3.Database,
  });
  try {
    return await run(db);
  } finally {
    await db.close();
  }
}

async function seedReleaseData() {
  await withDb(async (db) => {
    await db.run(`DELETE FROM Daily_Logs WHERE truck_id LIKE 'E2E%'`);
    await db.run(`DELETE FROM Vehicles WHERE truck_id LIKE 'E2E%'`);

    for (const vehicle of [seededOpsVehicle, seededStaleVehicle]) {
      await db.run(
        'INSERT INTO Vehicles (truck_id, vehicle_no, vehicle_type, mode, customer_name, supervisor_username) VALUES (?, ?, ?, ?, ?, ?)',
        [
          vehicle.truck_id,
          vehicle.vehicle_no,
          vehicle.vehicle_type,
          vehicle.mode,
          vehicle.customer_name,
          vehicle.supervisor_username,
        ]
      );
    }

    const seedLogs = [
      [
        seededOpsVehicle.truck_id,
        '2026-04-17',
        'Plant',
        'In Transit',
        'Active',
        '2026-04-17T09:30:00.000Z',
        'saddam',
      ],
      [
        seededOpsVehicle.truck_id,
        '2026-04-18',
        'Yard',
        'Breakdown',
        'Idle',
        '2026-04-18T11:30:00.000Z',
        'saddam',
      ],
      [
        seededOpsVehicle.truck_id,
        '2026-04-19',
        'Service Center',
        'Service Center',
        'Idle',
        '2026-04-19T18:15:00.000Z',
        'saddam',
      ],
      [
        seededStaleVehicle.truck_id,
        '2026-04-17',
        'Plant',
        'Idle - Waiting for load',
        'Idle',
        '2026-04-17T07:45:00.000Z',
        'devi',
      ],
    ];

    for (const row of seedLogs) {
      await db.run(
        'INSERT INTO Daily_Logs (truck_id, log_date, location, status, utilization, last_updated_at, last_updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        row
      );
    }
  });
}

async function cleanupReleaseData() {
  await withDb(async (db) => {
    await db.run(`DELETE FROM Daily_Logs WHERE truck_id LIKE 'E2E%'`);
    await db.run(`DELETE FROM Vehicles WHERE truck_id LIKE 'E2E%'`);
  });
}

async function loginManagement(page, baseUrl) {
  await page.goto(`${baseUrl}/login`);
  await page.getByLabel('Username').fill(managementUsername);
  await page.getByLabel('Password').fill(managementPassword);
  await page.getByRole('button', { name: 'Login as Management' }).click();
  await page.waitForURL('**/dashboard');
}

test.beforeAll(async () => {
  await seedReleaseData();
});

test.afterAll(async () => {
  await cleanupReleaseData();
});

test('admin CRUD flow works end to end', async ({ page }) => {
  const uniqueSuffix = `${Date.now()}`.slice(-6);
  const createdVehicleNo = `E2E-CRUD-${uniqueSuffix}`;
  const updatedVehicleNo = `E2E-EDIT-${uniqueSuffix}`;
  const createdTruckId = `E2ECRUD${uniqueSuffix}`;
  const updatedTruckId = `E2EEDIT${uniqueSuffix}`;

  await page.goto(`${localBaseUrl}/login`);

  await page.getByLabel('Username').fill(managementUsername);
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Login as Management' }).click();
  await expect(page.getByText('Invalid management credentials.')).toBeVisible();

  await page.getByLabel('Username').fill(managementUsername);
  await page.getByLabel('Password').fill(managementPassword);
  await page.getByRole('button', { name: 'Login as Management' }).click();
  await page.waitForURL('**/dashboard');
  await expect(page.getByRole('heading', { name: 'Management Dashboard' })).toBeVisible();

  await page.getByRole('link', { name: 'Vehicle Master Admin' }).click();
  await expect(page.getByRole('heading', { name: 'Vehicle Master Admin' })).toBeVisible();

  await page.getByLabel('Truck ID').fill(createdTruckId);
  await page.getByLabel('Vehicle No').fill(createdVehicleNo);
  await page.getByLabel('Vehicle Type').fill('MXL');
  await page.getByLabel('Mode').selectOption('Line');
  await page.getByLabel('Customer Name').fill('E2E Customer');
  await page.getByLabel('Supervisor').selectOption('saddam');
  await page.getByRole('button', { name: 'Add Vehicle' }).click();

  await page.getByLabel('Search Master Database').fill(createdVehicleNo);
  const createdRow = page.locator('tbody tr').filter({ hasText: createdVehicleNo }).first();
  await expect(createdRow).toBeVisible();

  await page.getByLabel('Search Master Database').fill('E2E Customer');
  await expect(page.locator('tbody tr').filter({ hasText: createdVehicleNo }).first()).toBeVisible();

  await page.getByLabel('Search Master Database').fill('line');
  await expect(page.locator('tbody tr').filter({ hasText: createdVehicleNo }).first()).toBeVisible();

  await page.getByLabel('Search Master Database').fill('saddam');
  await expect(page.locator('tbody tr').filter({ hasText: createdVehicleNo }).first()).toBeVisible();

  await page.getByLabel('Search Master Database').fill(createdVehicleNo);
  await page
    .locator('tbody tr')
    .filter({ hasText: createdVehicleNo })
    .getByRole('button', { name: 'Edit' })
    .click();

  const modal = page
    .locator('form')
    .filter({ has: page.getByRole('button', { name: 'Update Vehicle' }) })
    .first();
  await modal.getByLabel('Truck ID').fill(updatedTruckId);
  await modal.getByLabel('Vehicle No').fill(updatedVehicleNo);
  await modal.getByLabel('Vehicle Type').fill('TEST-TYPE');
  await modal.getByLabel('Mode').selectOption('Other');
  await modal.getByLabel('Customer Name').fill('Updated Customer');
  await modal.getByLabel('Supervisor').selectOption('devi');
  await page.getByRole('button', { name: 'Update Vehicle' }).click();

  await page.getByLabel('Search Master Database').fill(updatedVehicleNo);
  const updatedRow = page.locator('tbody tr').filter({ hasText: updatedVehicleNo }).first();
  await expect(updatedRow).toContainText('TEST-TYPE');
  await expect(updatedRow).toContainText('Updated Customer');
  await expect(updatedRow).toContainText('DEVI');

  await updatedRow.getByRole('button', { name: 'Delete' }).click();
  await expect(page.locator('tbody tr').filter({ hasText: updatedVehicleNo })).toHaveCount(0);
});

test('supervisor daily update workflow works', async ({ page }) => {
  await page.goto(`${localBaseUrl}/login`);
  await page.getByRole('button', { name: /Login as SADDAM \(Supervisor\)/ }).click();
  await page.waitForURL('**/supervisor');
  await expect(page.getByRole('heading', { name: /Portal: SADDAM/ })).toBeVisible();

  await page.getByLabel('Status Date').fill(today);
  await page.getByPlaceholder('Search by Vehicle No or Customer...').fill(seededOpsVehicle.vehicle_no);

  const vehicleCard = page.locator('button').filter({ hasText: seededOpsVehicle.vehicle_no }).first();
  await expect(vehicleCard.getByText('Pending')).toBeVisible();

  await vehicleCard.click();
  await page.getByRole('button', { name: /Update 1 Vehicles/ }).click();

  const modal = page
    .locator('form')
    .filter({ has: page.getByRole('button', { name: 'Apply Status' }) })
    .first();
  await modal.getByRole('button', { name: 'Breakdown' }).click();
  const locationInput = modal.locator('input.input-field').first();
  await expect(locationInput).toHaveJSProperty('required', true);
  await modal.getByRole('button', { name: 'Service Center' }).last().click();
  await modal.getByRole('button', { name: 'Apply Status' }).click();

  await expect(page.getByText(/Last updated by you on/i)).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('Location: Service Center')).toBeVisible();
  await expect(page.getByText('1 updated,')).toBeVisible();

  await page.getByLabel('Status Date').fill('2026-04-21');
  await page.getByPlaceholder('Search by Vehicle No or Customer...').fill(seededOpsVehicle.vehicle_no);
  const nextDayCard = page.locator('button').filter({ hasText: seededOpsVehicle.vehicle_no }).first();
  await expect(nextDayCard.getByText('Pending')).toBeVisible();
});

test('management dashboards show historical analytics and alerts', async ({ page }) => {
  await loginManagement(page, localBaseUrl);
  await expect(page.getByRole('heading', { name: 'Management Dashboard' })).toBeVisible();

  await page.locator('input[id$="from-date"]').fill('2026-04-17');
  await page.locator('input[id$="to-date"]').fill(today);
  await page.getByRole('button', { name: 'Apply Range' }).click();

  await expect(page.getByRole('heading', { name: 'Historical Summary' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Idle Aging Buckets' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Supervisor Performance View' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Fleet Utilization Trend' })).toBeVisible();
  await expect(page.locator('h2').filter({ hasText: 'Action Queue' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Stale Data Alerts' })).toHaveCount(0);

  await page.goto(`${localBaseUrl}/dashboard?date=${today}`);
  await expect(page.getByText('ACTION REQUIRED: Idle Line Vehicles')).toBeVisible();

  await page.getByRole('link', { name: 'Active Vehicles' }).click();
  await expect(page.getByRole('heading', { name: 'Active Vehicles' })).toBeVisible();
  await expect(page.getByText('Metric: Active')).toBeVisible();

  await page.getByRole('link', { name: 'Idle Line Vehicles' }).click();
  await expect(page.getByText('Metric: Idle Line')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Vehicle No' }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Live Status Table (All Vehicles)' })).toHaveCount(0);
});

test('production smoke: login and main views load without server errors', async ({ page }) => {
  await page.goto(`${prodBaseUrl}/login`);
  await expect(
    page.getByRole('heading', { name: 'Neo Elite Logistics Private Limited' })
  ).toBeVisible();

  await loginManagement(page, prodBaseUrl);
  await expect(page.getByRole('heading', { name: 'Management Dashboard' })).toBeVisible({
    timeout: 20000,
  });
  await expect(page.locator('input[type="date"]').first()).toBeVisible();
  await expect(page.locator('h2').filter({ hasText: 'Action Queue' })).toBeVisible();

  await page.getByRole('link', { name: 'Vehicle Master Admin' }).click();
  await expect(page.getByLabel('Search Master Database')).toBeVisible();

  await page.goto(`${prodBaseUrl}/login`);
  await page.getByRole('button', { name: /Login as SADDAM \(Supervisor\)/ }).click();
  await page.waitForURL('**/supervisor');
  await expect(page.getByRole('heading', { name: /Portal: SADDAM/ })).toBeVisible({
    timeout: 20000,
  });
});
