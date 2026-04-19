'use server';
import { getDb } from '@/lib/db';

function toIsoDate(value) {
  if (!value) return new Date().toISOString().split('T')[0];
  return value;
}

export async function getDashboardData(startDate, endDate) {
  const db = await getDb();
  const normalizedStartDate = toIsoDate(startDate);
  const normalizedEndDate = toIsoDate(endDate || startDate);
  const rangeStart = normalizedStartDate <= normalizedEndDate ? normalizedStartDate : normalizedEndDate;
  const rangeEnd = normalizedStartDate <= normalizedEndDate ? normalizedEndDate : normalizedStartDate;

  const vehicles = await db.all('SELECT * FROM Vehicles');
  const logs = await db.all(
    `SELECT truck_id, log_date, location, status, utilization
     FROM Daily_Logs
     WHERE log_date BETWEEN ? AND ?
     ORDER BY truck_id ASC, log_date DESC`,
    [rangeStart, rangeEnd]
  );

  const logsByTruck = new Map();
  const dailyBreakdownMap = new Map();
  let activeLogEntries = 0;
  let idleLogEntries = 0;

  for (const log of logs) {
    if (!logsByTruck.has(log.truck_id)) {
      logsByTruck.set(log.truck_id, []);
    }
    logsByTruck.get(log.truck_id).push(log);

    if (!dailyBreakdownMap.has(log.log_date)) {
      dailyBreakdownMap.set(log.log_date, {
        date: log.log_date,
        updatedTruckIds: new Set(),
        activeEntries: 0,
        idleEntries: 0,
      });
    }

    const day = dailyBreakdownMap.get(log.log_date);
    day.updatedTruckIds.add(log.truck_id);

    if (log.utilization === 'Active') {
      activeLogEntries += 1;
      day.activeEntries += 1;
    } else if (log.utilization === 'Idle') {
      idleLogEntries += 1;
      day.idleEntries += 1;
    }
  }

  const vehiclesWithHistory = vehicles.map((vehicle) => {
    const vehicleLogs = logsByTruck.get(vehicle.truck_id) || [];
    const latestLog = vehicleLogs[0] || null;
    const activeDays = vehicleLogs.filter((log) => log.utilization === 'Active').length;
    const idleDays = vehicleLogs.filter((log) => log.utilization === 'Idle').length;

    return {
      ...vehicle,
      current_status: latestLog?.status || null,
      current_location: latestLog?.location || null,
      current_utilization: latestLog?.utilization || null,
      last_log_date: latestLog?.log_date || null,
      updated_days: vehicleLogs.length,
      active_days: activeDays,
      idle_days: idleDays,
    };
  });

  const statusCounts = vehiclesWithHistory.reduce((acc, vehicle) => {
    const status = vehicle.current_status || 'Not Updated';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const customerCounts = vehiclesWithHistory.reduce((acc, vehicle) => {
    const customer = vehicle.customer_name || 'No Customer';
    acc[customer] = (acc[customer] || 0) + 1;
    return acc;
  }, {});

  const updatedVehicles = vehiclesWithHistory.filter((vehicle) => vehicle.updated_days > 0).length;
  const dailyBreakdown = Array.from(dailyBreakdownMap.values())
    .map((day) => ({
      date: day.date,
      updatedVehicles: day.updatedTruckIds.size,
      activeEntries: day.activeEntries,
      idleEntries: day.idleEntries,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    vehicles: vehiclesWithHistory,
    rangeStart,
    rangeEnd,
    statusCounts,
    customerCounts,
    summary: {
      totalFleet: vehicles.length,
      updatedVehicles,
      activeLogEntries,
      idleLogEntries,
      totalLogEntries: logs.length,
    },
    dailyBreakdown,
  };
}
