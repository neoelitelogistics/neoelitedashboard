'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function DashboardDateRangeFilter({ initialStartDate, initialEndDate, baseUrl }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  const applyRange = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set('startDate', startDate);
    params.set('endDate', endDate);
    params.delete('date');
    router.push(`${baseUrl}?${params.toString()}`);
  };

  const resetToToday = () => {
    const today = new Date().toISOString().split('T')[0];
    const params = new URLSearchParams(searchParams.toString());
    params.set('startDate', today);
    params.set('endDate', today);
    params.delete('date');
    router.push(`${baseUrl}?${params.toString()}`);
  };

  return (
    <form onSubmit={applyRange} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <div className="input-group" style={{ marginBottom: 0 }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>From</label>
        <input
          type="date"
          className="input-field"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={{ padding: '0.4rem 0.75rem' }}
        />
      </div>
      <div className="input-group" style={{ marginBottom: 0 }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>To</label>
        <input
          type="date"
          className="input-field"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={{ padding: '0.4rem 0.75rem' }}
        />
      </div>
      <button type="submit" className="btn btn-primary">Apply Range</button>
      <button type="button" className="btn" onClick={resetToToday} style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
        Today
      </button>
    </form>
  );
}
