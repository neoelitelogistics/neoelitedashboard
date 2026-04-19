'use server';
import { getDb } from '@/lib/db';

function toIsoDate(value) {
  if (!value) return new Date().toISOString().split('T')[0];
  return value;
}

function differenceInDays(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
}

function createAgingBuckets() {
  return {
    '1 day': 0,
    '2-3 days': 0,
    '4-7 days': 0,
    '8+ days': 0,
  };
}

export async function getDashboardData(startDate, endDate) {
  const db = await getDb();
  const normalizedStartDate = toIsoDate(startDate);
  const normalizedEndDate = toIsoDate(endDate || startDate);
  const rangeStart = normalizedStartDate <= normalizedEndDate ? normalizedStartDate : normalizedEndDate;
  const rangeEnd = normalizedStartDate <= normalizedEndDate ? normalizedEndDate : normalizedStartDate;

  const vehicles = await db.all('SELECT * FROM Vehicles');
  const logs = await db.all(
    `SELECT truck_id, log_date, location, status, utilization, last_updated_at, last_updated_by
     FROM Daily_Logs
     WHERE log_date BETWEEN ? AND ?
     ORDER BY truck_id ASC, log_date DESC`,
    [rangeStart, rangeEnd]
  );

  const logsByTruck = new Map();
  const dailyBreakdownMap = new Map();
  let activeLogEntries = 0;
  let idleLogEntries = 0;
  const supervisorStatsMap = new Map();

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
      last_updated_at: latestLog?.last_updated_at || null,
      last_updated_by: latestLog?.last_updated_by || null,
      updated_days: vehicleLogs.length,
      active_days: activeDays,
      idle_days: idleDays,
      days_since_last_update: latestLog ? differenceInDays(latestLog.log_date, rangeEnd) : null,
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

  const idleAgingBuckets = createAgingBuckets();
  const staleVehicles = [];
  const actionQueue = [];

  for (const vehicle of vehiclesWithHistory) {
    if (!supervisorStatsMap.has(vehicle.supervisor_username)) {
      supervisorStatsMap.set(vehicle.supervisor_username, {
        supervisor: vehicle.supervisor_username,
        assignedFleet: 0,
        updatedVehicles: 0,
        activeDays: 0,
        idleDays: 0,
        staleVehicles: 0,
      });
    }

    const supervisorStats = supervisorStatsMap.get(vehicle.supervisor_username);
    supervisorStats.assignedFleet += 1;
    supervisorStats.activeDays += vehicle.active_days;
    supervisorStats.idleDays += vehicle.idle_days;

    if (vehicle.updated_days > 0) {
      supervisorStats.updatedVehicles += 1;
    }

    const isStale = !vehicle.last_log_date || vehicle.last_log_date < rangeEnd;
    if (isStale) {
      staleVehicles.push(vehicle);
      supervisorStats.staleVehicles += 1;
    }

    if (vehicle.current_utilization === 'Idle') {
      if (vehicle.idle_days <= 1) {
        idleAgingBuckets['1 day'] += 1;
      } else if (vehicle.idle_days <= 3) {
        idleAgingBuckets['2-3 days'] += 1;
      } else if (vehicle.idle_days <= 7) {
        idleAgingBuckets['4-7 days'] += 1;
      } else {
        idleAgingBuckets['8+ days'] += 1;
      }
    }

    const actionScore =
      (vehicle.current_status === 'Breakdown' ? 50 : 0) +
      (vehicle.current_status === 'Service Center' ? 45 : 0) +
      (vehicle.current_status === 'No Driver' ? 40 : 0) +
      (vehicle.current_utilization === 'Idle' ? 20 : 0) +
      (vehicle.mode === 'Line' && vehicle.current_utilization === 'Idle' ? 15 : 0) +
      (isStale ? 25 : 0) +
      (vehicle.idle_days || 0) +
      (vehicle.days_since_last_update || 0);

    if (actionScore > 0) {
      actionQueue.push({
        ...vehicle,
        action_score: actionScore,
        is_stale: isStale,
      });
    }
  }

  const supervisorPerformance = Array.from(supervisorStatsMap.values())
    .map((entry) => ({
      ...entry,
      updateRate: entry.assignedFleet
        ? Math.round((entry.updatedVehicles / entry.assignedFleet) * 100)
        : 0,
    }))
    .sort((a, b) => {
      if (b.staleVehicles !== a.staleVehicles) return b.staleVehicles - a.staleVehicles;
      return a.updateRate - b.updateRate;
    });

  const fleetUtilizationTrend = dailyBreakdown.map((day) => ({
    date: day.date,
    activeEntries: day.activeEntries,
    idleEntries: day.idleEntries,
    utilizationRate:
      day.activeEntries + day.idleEntries > 0
        ? Math.round((day.activeEntries / (day.activeEntries + day.idleEntries)) * 100)
        : 0,
  }));

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
      staleVehicles: staleVehicles.length,
    },
    dailyBreakdown,
    fleetUtilizationTrend,
    idleAgingBuckets,
    supervisorPerformance,
    actionQueue: actionQueue
      .sort((a, b) => b.action_score - a.action_score)
      .slice(0, 15),
    staleVehicles: staleVehicles
      .sort((a, b) => {
        const aDays = a.days_since_last_update ?? 9999;
        const bDays = b.days_since_last_update ?? 9999;
        return bDays - aDays;
      })
      .slice(0, 20),
  };
}
