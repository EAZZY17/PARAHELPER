import React, { useState, useEffect } from 'react';
import { exportsAPI } from '../services/api';

export default function ShiftSummary({ profile, sessionId, onClose }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [shifts, setShifts] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [summaryRes, statusRes, shiftsRes] = await Promise.allSettled([
        exportsAPI.getShiftSummary(sessionId),
        exportsAPI.getStatus(profile.paramedic_id),
        exportsAPI.getShifts(profile.paramedic_id)
      ]);

      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data);
      if (statusRes.status === 'fulfilled') setStatus(statusRes.value.data);
      if (shiftsRes.status === 'fulfilled') setShifts(shiftsRes.value.data || []);
    } catch (err) {
      console.error('Failed to load shift summary:', err);
    }
    setLoading(false);
  };

  const StatusBadge = ({ value }) => (
    <span style={{
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 700,
      background: value === 'GOOD' ? 'rgba(72, 187, 120, 0.2)' : 'rgba(229, 62, 62, 0.2)',
      color: value === 'GOOD' ? '#68d391' : '#fc8181'
    }}>
      {value || 'N/A'}
    </span>
  );

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Shift Summary</h2>
            <p style={styles.subtitle}>{profile.first_name} {profile.last_name} - {new Date().toLocaleDateString()}</p>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div style={styles.content}>
          {loading ? (
            <div style={styles.loading}>Loading shift summary...</div>
          ) : (
            <>
              {summary && (
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>AI Summary</h3>
                  <p style={styles.summaryText}>{summary.summary}</p>
                </div>
              )}

              {status && (
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Compliance Status</h3>
                  <div style={styles.statusGrid}>
                    <div style={styles.statusItem}>
                      <span style={styles.statusLabel}>ACR Completion</span>
                      <StatusBadge value={status.acr_completion} />
                      {status.acr_unfinished > 0 && <span style={styles.statusNote}>{status.acr_unfinished} unfinished</span>}
                    </div>
                    <div style={styles.statusItem}>
                      <span style={styles.statusLabel}>Vaccination</span>
                      <StatusBadge value={status.vaccination} />
                    </div>
                    <div style={styles.statusItem}>
                      <span style={styles.statusLabel}>Driver License</span>
                      <StatusBadge value={status.driver_license} />
                    </div>
                    <div style={styles.statusItem}>
                      <span style={styles.statusLabel}>Education</span>
                      <StatusBadge value={status.education} />
                    </div>
                    <div style={styles.statusItem}>
                      <span style={styles.statusLabel}>Uniform Credits</span>
                      <StatusBadge value={status.uniform_status} />
                      <span style={styles.statusNote}>{status.uniform_credits} available</span>
                    </div>
                    <div style={styles.statusItem}>
                      <span style={styles.statusLabel}>Criminal Record</span>
                      <StatusBadge value={status.criminal_record} />
                    </div>
                    <div style={styles.statusItem}>
                      <span style={styles.statusLabel}>ACP Cert</span>
                      <StatusBadge value={status.acp_cert} />
                    </div>
                    <div style={styles.statusItem}>
                      <span style={styles.statusLabel}>Vacation</span>
                      <StatusBadge value={status.vacation} />
                    </div>
                    <div style={styles.statusItem}>
                      <span style={styles.statusLabel}>Missed Meals</span>
                      <StatusBadge value={status.missed_meals} />
                      {status.missed_meals_count > 0 && <span style={styles.statusNote}>{status.missed_meals_count} pending</span>}
                    </div>
                    <div style={styles.statusItem}>
                      <span style={styles.statusLabel}>Overtime</span>
                      <StatusBadge value={status.overtime} />
                      {status.overtime_count > 0 && <span style={styles.statusNote}>{status.overtime_count} pending</span>}
                    </div>
                  </div>
                </div>
              )}

              {shifts.length > 0 && (
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Recent Shifts</h3>
                  {shifts.slice(0, 5).map((s, i) => (
                    <div key={i} style={styles.shiftRow}>
                      <span style={styles.shiftDate}>{s.shift_date}</span>
                      <span>{s.shift_start}-{s.shift_end}</span>
                      <span>{s.station}</span>
                      <span>{s.calls_handled} calls</span>
                      <span style={{ color: s.status === 'active' ? '#68d391' : 'rgba(255,255,255,0.4)' }}>{s.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    width: '90%',
    maxWidth: '700px',
    maxHeight: '80vh',
    background: 'rgba(15, 25, 50, 0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '24px 28px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)'
  },
  title: { color: '#fff', fontSize: '22px', fontWeight: 700, margin: 0 },
  subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '4px 0 0' },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.4)',
    cursor: 'pointer',
    padding: '4px'
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 28px'
  },
  loading: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    padding: '40px'
  },
  section: { marginBottom: '28px' },
  sectionTitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    marginBottom: '12px'
  },
  summaryText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '14px',
    lineHeight: '1.6',
    padding: '16px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.06)'
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px'
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.06)'
  },
  statusLabel: { fontSize: '12px', color: 'rgba(255,255,255,0.6)', flex: 1 },
  statusNote: { fontSize: '10px', color: 'rgba(255,255,255,0.35)' },
  shiftRow: {
    display: 'flex',
    gap: '16px',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '8px',
    marginBottom: '4px',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.5)'
  },
  shiftDate: { fontWeight: 600, color: '#fff' }
};
