'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function DashboardDateRangeFilter({ initialStartDate, initialEndDate, baseUrl }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startId = `${baseUrl.replace(/[^a-z0-9]/gi, '-')}-from-date`;
  const endId = `${baseUrl.replace(/[^a-z0-9]/gi, '-')}-to-date`;
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
        <label htmlFor={startId} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>From</label>
        <input
          id={startId}
          type="date"
          className="input-field"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={{ padding: '0.4rem 0.75rem' }}
        />
      </div>
      <div className="input-group" style={{ marginBottom: 0 }}>
        <label htmlFor={endId} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>To</label>
        <input
          id={endId}
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
