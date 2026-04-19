'use client';
import { useRouter, useSearchParams } from 'next/navigation';

export default function DateFilter({ initialDate, baseUrl }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputId = `${baseUrl.replace(/[^a-z0-9]/gi, '-')}-status-date`;

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set('date', newDate);
    router.push(`${baseUrl}?${params.toString()}`);
  };

  return (
    <div className="input-group" style={{ marginBottom: 0 }}>
      <label htmlFor={inputId} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status Date</label>
      <input 
        id={inputId}
        type="date" 
        className="input-field" 
        value={initialDate} 
        onChange={handleDateChange}
        style={{ padding: '0.4rem 0.75rem' }}
      />
    </div>
  );
}
