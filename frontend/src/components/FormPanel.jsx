import React, { useState } from 'react';
import { formsAPI, healthAPI } from '../services/api';

const CONFIDENCE_COLORS = {
  high: { bg: 'rgba(72, 187, 120, 0.15)', border: '#48bb78', text: '#68d391' },
  medium: { bg: 'rgba(236, 201, 75, 0.15)', border: '#ecc94b', text: '#f6e05e' },
  low: { bg: 'rgba(229, 62, 62, 0.15)', border: '#e53e3e', text: '#fc8181' }
};

function toDisplayValue(v) {
  if (v == null) return null;
  if (typeof v === 'object' && v !== null && 'value' in v) return toDisplayValue(v.value);
  if (typeof v === 'object') return '—';
  return v;
}

function FieldRow({ label, field, required }) {
  if (!field) {
    return (
      <div style={styles.fieldRow}>
        <span style={styles.fieldLabel}>{label} {required && <span style={styles.required}>*</span>}</span>
        <div style={{ ...styles.fieldValue, ...styles.emptyField }}>
          {required ? 'Required - missing' : 'Not provided'}
        </div>
      </div>
    );
  }

  const colors = CONFIDENCE_COLORS[field.confidence] || CONFIDENCE_COLORS.low;
  const displayVal = toDisplayValue(field.value);

  return (
    <div style={styles.fieldRow}>
      <span style={styles.fieldLabel}>{label} {required && <span style={styles.required}>*</span>}</span>
      <div style={{
        ...styles.fieldValue,
        background: colors.bg,
        borderColor: colors.border,
        color: colors.text
      }}>
        {(displayVal != null && displayVal !== '') ? String(displayVal) : (required ? 'Required - missing' : '—')}
        <span style={{
          ...styles.confidenceDot,
          background: colors.border
        }} />
      </div>
    </div>
  );
}

function OccurrenceReportForm({ data, guardrail }) {
  const f = data?.fields || {};
  return (
    <div style={styles.formContent}>
      <div style={styles.formHeader}>
        <div style={styles.formIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fc8181" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div>
          <h3 style={styles.formTitle}>Occurrence Report</h3>
          <p style={styles.formSubtitle}>Incident Documentation</p>
        </div>
      </div>

      <div style={styles.sectionDivider}>
        <span style={styles.sectionLabel}>INCIDENT DETAILS</span>
      </div>
      <FieldRow label="Date" field={f.date} required />
      <FieldRow label="Time" field={f.time} required />
      <FieldRow label="Call Number" field={f.call_number} />
      <FieldRow label="Occurrence Type" field={f.occurrence_type} required />
      <FieldRow label="Reference #" field={f.occurrence_reference} />
      <FieldRow label="Severity" field={f.severity} required />

      <div style={styles.sectionDivider}>
        <span style={styles.sectionLabel}>VEHICLE & LOCATION</span>
      </div>
      <FieldRow label="Vehicle Number" field={f.vehicle_number} />
      <FieldRow label="Vehicle Description" field={f.vehicle_description} />
      <FieldRow label="Location" field={f.location} required />
      <FieldRow label="City" field={f.city} required />
      <FieldRow label="Province" field={f.province} required />

      <div style={styles.sectionDivider}>
        <span style={styles.sectionLabel}>PARAMEDIC INFO</span>
      </div>
      <FieldRow label="Service" field={f.service} />
      <FieldRow label="Role" field={f.role} required />
      <FieldRow label="Badge Number" field={f.badge_number} required />
      <FieldRow label="Paramedic Name" field={f.paramedic_name} required />

      <div style={styles.sectionDivider}>
        <span style={styles.sectionLabel}>REPORT</span>
      </div>
      <FieldRow label="Injuries Reported" field={f.injuries_reported} required />
      <FieldRow label="Equipment Damage" field={f.equipment_damage} required />
      <FieldRow label="Supervisor Notified" field={f.supervisor_notified} />
      <FieldRow label="Other Services" field={f.other_services} />
      <FieldRow label="Description" field={f.description} required />
      <FieldRow label="Action Taken" field={f.action_taken} required />
      <FieldRow label="Resolution" field={f.resolution} />
      <FieldRow label="Management Notes" field={f.management_notes} />
    </div>
  );
}

function TeddyBearForm({ data, guardrail }) {
  const f = data?.fields || {};
  return (
    <div style={styles.formContent}>
      <div style={styles.formHeader}>
        <div style={{ ...styles.formIcon, background: 'rgba(66, 153, 225, 0.15)', borderColor: 'rgba(66, 153, 225, 0.3)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#90cdf4" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
        </div>
        <div>
          <h3 style={styles.formTitle}>Teddy Bear Tracking</h3>
          <p style={styles.formSubtitle}>Comfort Item Record</p>
        </div>
      </div>

      <div style={styles.sectionDivider}>
        <span style={styles.sectionLabel}>EVENT DETAILS</span>
      </div>
      <FieldRow label="Date & Time" field={f.date_time} required />
      <FieldRow label="Unit" field={f.unit_id} />
      <FieldRow label="Location" field={f.location} />
      <FieldRow label="City" field={f.city} />
      <FieldRow label="Province" field={f.province} />

      <div style={styles.sectionDivider}>
        <span style={styles.sectionLabel}>MEDIC INFO</span>
      </div>
      <FieldRow label="Primary Medic (First)" field={f.primary_medic_first} required />
      <FieldRow label="Primary Medic (Last)" field={f.primary_medic_last} required />
      <FieldRow label="Badge Number" field={f.medic_number} required />
      <FieldRow label="Second Medic" field={f.second_medic} />

      <div style={styles.sectionDivider}>
        <span style={styles.sectionLabel}>RECIPIENT</span>
      </div>
      <FieldRow label="Recipient Age" field={f.recipient_age} required />
      <FieldRow label="Recipient Gender" field={f.recipient_gender} required />
      <FieldRow label="Recipient Type" field={f.recipient_type} required />
      <FieldRow label="Notes" field={f.notes} />
    </div>
  );
}

function StatusReportForm({ data }) {
  const f = data?.fields || {};

  const statusItems = [
    { code: 'ACRc', type: 'ACR Completion', desc: 'Unfinished ACRs/PCRs', status: f.acr_completion, issues: f.acr_unfinished, notes: 'Complete within 24 hours of call' },
    { code: 'CERT-DL', type: 'Drivers License', desc: 'License Validity', status: f.driver_license, issues: null, notes: 'Driver License Status' },
    { code: 'CERT-Va', type: 'Vaccinations', desc: 'Required vaccinations', status: f.vaccination, issues: f.vaccination_issues, notes: 'Per guidelines' },
    { code: 'CERT-CE', type: 'Education', desc: 'Continuing Education', status: f.education, issues: f.cme_outstanding, notes: 'CME outstanding' },
    { code: 'UNIF', type: 'Uniform', desc: 'Uniform credits', status: f.uniform_status, issues: f.uniform_credits, notes: 'Available credits' },
    { code: 'CRIM', type: 'CRC', desc: 'Criminal Record Check', status: f.criminal_record, issues: null, notes: 'Criminal Issue Free' },
    { code: 'ACP', type: 'ACP Status', desc: 'ACP Cert Valid', status: f.acp_cert, issues: null, notes: 'ACP certification' },
    { code: 'VAC', type: 'Vacation', desc: 'Vacation requested/approved', status: f.vacation, issues: null, notes: 'Yearly vacation' },
    { code: 'MEALS', type: 'Missed Meals', desc: 'Missed Meal Claims', status: f.missed_meals, issues: f.missed_meals_count, notes: 'Claims outstanding' },
    { code: 'OVER', type: 'Overtime Req.', desc: 'Overtime Requests', status: f.overtime, issues: f.overtime_count, notes: 'Claims outstanding' }
  ];

  return (
    <div style={styles.formContent}>
      <div style={styles.formHeader}>
        <div style={{ ...styles.formIcon, background: 'rgba(72, 187, 120, 0.15)', borderColor: 'rgba(72, 187, 120, 0.3)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#68d391" strokeWidth="2">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </div>
        <div>
          <h3 style={styles.formTitle}>Paramedic Status Report</h3>
          <p style={styles.formSubtitle}>Compliance Checklist</p>
        </div>
      </div>

      <div style={styles.sectionDivider}>
        <span style={styles.sectionLabel}>STATUS ITEMS</span>
      </div>

      <div style={styles.statusTable}>
        <div style={styles.statusHeader}>
          <span style={{ ...styles.statusCell, flex: 0.8 }}>Item</span>
          <span style={{ ...styles.statusCell, flex: 1 }}>Type</span>
          <span style={{ ...styles.statusCell, flex: 1.5 }}>Description</span>
          <span style={{ ...styles.statusCell, flex: 0.7 }}>Status</span>
          <span style={{ ...styles.statusCell, flex: 0.5 }}>#</span>
          <span style={{ ...styles.statusCell, flex: 1.2 }}>Notes</span>
        </div>
        {statusItems.map((item, i) => {
          const statusVal = toDisplayValue(item.status) ?? '—';
          const issuesVal = toDisplayValue(item.issues) ?? '0';
          const isGood = statusVal === 'GOOD';
          return (
            <div key={i} style={styles.statusRow}>
              <span style={{ ...styles.statusCell, flex: 0.8, fontWeight: 600, color: '#fff' }}>{item.code}</span>
              <span style={{ ...styles.statusCell, flex: 1 }}>{item.type}</span>
              <span style={{ ...styles.statusCell, flex: 1.5, fontSize: '11px' }}>{item.desc}</span>
              <span style={{
                ...styles.statusCell, flex: 0.7,
                color: isGood ? '#68d391' : '#fc8181',
                fontWeight: 700
              }}>
                {String(statusVal)}
              </span>
              <span style={{ ...styles.statusCell, flex: 0.5 }}>
                {String(issuesVal)}
              </span>
              <span style={{ ...styles.statusCell, flex: 1.2, fontSize: '11px' }}>{item.notes}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VehicleInventoryForm({ data, guardrail }) {
  const f = data?.fields || {};
  const vehicleItems = [
    { label: 'Engine Condition', field: f.engine_condition, opts: ['OK', 'Issue'] },
    { label: 'Fuel Level', field: f.fuel_level, opts: ['OK', 'Low'] },
    { label: 'Tire Pressure', field: f.tire_pressure, opts: ['OK', 'Low'] },
    { label: 'Emergency Lights', field: f.emergency_lights, opts: ['OK', 'Not Working'] },
    { label: 'Siren System', field: f.siren_system, opts: ['OK', 'Not Working'] },
    { label: 'Radio Communication', field: f.radio_communication, opts: ['OK', 'Not Working'] },
    { label: 'GPS / Navigation', field: f.gps_navigation, opts: ['OK', 'Not Working'] },
    { label: 'Ambulance Cleanliness', field: f.ambulance_cleanliness, opts: ['OK', 'Needs Cleaning'] }
  ];
  const equipItems = [
    { label: 'Stretcher', field: f.stretcher, opts: ['OK', 'Issue'] },
    { label: 'Oxygen Tank Level', field: f.oxygen_tank_level, opts: ['Full', 'Low'] },
    { label: 'Suction Device', field: f.suction_device, opts: ['OK', 'Issue'] },
    { label: 'Defibrillator', field: f.defibrillator, opts: ['OK', 'Issue'] },
    { label: 'First Aid Kit', field: f.first_aid_kit, opts: ['Complete', 'Missing Items'] }
  ];
  return (
    <div style={styles.formContent}>
      <div style={styles.formHeader}>
        <div style={{ ...styles.formIcon, background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
            <rect x="2" y="6" width="20" height="12" rx="2"/>
            <path d="M6 6V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/>
            <line x1="6" y1="14" x2="6.01" y2="14"/>
            <line x1="18" y1="14" x2="18.01" y2="14"/>
          </svg>
        </div>
        <div>
          <h3 style={styles.formTitle}>Vehicle Inventory</h3>
          <p style={styles.formSubtitle}>Pre-Shift Ambulance Check</p>
        </div>
      </div>
      <div style={styles.sectionDivider}><span style={styles.sectionLabel}>BASIC INFORMATION</span></div>
      <FieldRow label="Paramedic Name" field={f.paramedic_name} required />
      <FieldRow label="Employee ID" field={f.employee_id} required />
      <FieldRow label="Unit Number" field={f.unit_number} required />
      <FieldRow label="Date" field={f.date} required />
      <FieldRow label="Shift Time" field={f.shift_time} required />
      <FieldRow label="Station Location" field={f.station_location} required />
      <div style={styles.sectionDivider}><span style={styles.sectionLabel}>VEHICLE CONDITION</span></div>
      {vehicleItems.map(({ label, field }, i) => (
        <FieldRow key={i} label={label} field={field} required />
      ))}
      <div style={styles.sectionDivider}><span style={styles.sectionLabel}>EQUIPMENT CHECK</span></div>
      {equipItems.map(({ label, field }, i) => (
        <FieldRow key={i} label={label} field={field} required />
      ))}
      <FieldRow label="Notes / Issues" field={f.notes_issues} />
    </div>
  );
}

function EquipmentInventoryForm({ data, guardrail }) {
  const f = data?.fields || {};
  const equipRows = [
    { label: 'Oxygen Masks', field: f.oxygen_masks },
    { label: 'IV Kits', field: f.iv_kits },
    { label: 'Bandages', field: f.bandages },
    { label: 'Gloves', field: f.gloves },
    { label: 'Saline Bags', field: f.saline_bags },
    { label: 'Epinephrine', field: f.epinephrine },
    { label: 'Tourniquets', field: f.tourniquets },
    { label: 'Trauma Dressings', field: f.trauma_dressings }
  ];
  return (
    <div style={styles.formContent}>
      <div style={styles.formHeader}>
        <div style={{ ...styles.formIcon, background: 'rgba(34, 197, 94, 0.15)', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
            <path d="M20 7h-9"/>
            <path d="M14 17H5"/>
            <circle cx="17" cy="17" r="3"/>
            <circle cx="7" cy="7" r="3"/>
          </svg>
        </div>
        <div>
          <h3 style={styles.formTitle}>Equipment Inventory</h3>
          <p style={styles.formSubtitle}>Medical Supplies Check</p>
        </div>
      </div>
      <div style={styles.sectionDivider}><span style={styles.sectionLabel}>BASIC INFORMATION</span></div>
      <FieldRow label="Paramedic Name" field={f.paramedic_name} required />
      <FieldRow label="Employee ID" field={f.employee_id} required />
      <FieldRow label="Ambulance Unit" field={f.ambulance_unit} required />
      <FieldRow label="Date" field={f.date} required />
      <div style={styles.sectionDivider}><span style={styles.sectionLabel}>EQUIPMENT INVENTORY</span></div>
      {equipRows.map(({ label, field }, i) => (
        <FieldRow key={i} label={label} field={field} />
      ))}
      <div style={styles.sectionDivider}><span style={styles.sectionLabel}>EXPIRATION CHECK</span></div>
      <FieldRow label="Epinephrine Expiration" field={f.epinephrine_exp} />
      <FieldRow label="Saline Expiration" field={f.saline_exp} />
      <FieldRow label="Notes / Restock Request" field={f.notes_restock} />
    </div>
  );
}

function ShiftReportForm({ data }) {
  return (
    <div style={styles.formContent}>
      <div style={styles.formHeader}>
        <div style={{ ...styles.formIcon, background: 'rgba(236, 201, 75, 0.15)', borderColor: 'rgba(236, 201, 75, 0.3)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f6e05e" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div>
          <h3 style={styles.formTitle}>Shift Report</h3>
          <p style={styles.formSubtitle}>Schedule & Data</p>
        </div>
      </div>

      <div style={styles.sectionDivider}>
        <span style={styles.sectionLabel}>SHIFT DETAILS</span>
      </div>

      {data && Array.isArray(data) ? data.map((shift, i) => (
        <div key={i} style={styles.shiftCard}>
          <div style={styles.shiftDate}>{shift.shift_date}</div>
          <div style={styles.shiftDetails}>
            <span>{shift.shift_start} - {shift.shift_end}</span>
            <span>{shift.station}</span>
            <span>Unit {shift.unit_id}</span>
            <span>{shift.calls_handled} calls</span>
            {shift.overtime_hours > 0 && <span style={{ color: '#fc8181' }}>OT: {shift.overtime_hours}h</span>}
          </div>
        </div>
      )) : (
        <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '20px' }}>
          No shift data available yet
        </p>
      )}
    </div>
  );
}

function downloadFromBase64(base64, filename, mimeType) {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  const blob = new Blob([arr], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function FormPanel({ currentForms, guardrailResults, sessionId, pendingAutoSubmit, onAutoSubmitHandled, onFormSubmit, onOpenForm }) {
  const [activeTab, setActiveTab] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [lastExportResult, setLastExportResult] = useState(null);

  const formTypes = Object.keys(currentForms).filter(k => currentForms[k]);
  
  React.useEffect(() => {
    if (formTypes.length > 0 && !activeTab) {
      setActiveTab(formTypes[0]);
    }
  }, [formTypes, activeTab]);

  const handleSubmit = async (formTypeOverride, retryCount = 0) => {
    const formType = formTypeOverride || activeTab;
    if (!formType || submitting) return;
    if (!currentForms[formType]) return;
    setSubmitResult(null);
    if (formType !== activeTab) setActiveTab(formType);
    setSubmitting(true);

    try {
      const { data } = await formsAPI.submit(formType, currentForms[formType], sessionId);
      const emailOk = data.export_result?.emailResult?.success !== false;
      const msg = emailOk
        ? (data.message || 'Form submitted! Email sent to recipient.')
        : 'Form saved, but email delivery failed. Check GMAIL_APP_PASSWORD and FORM_RECIPIENT_EMAIL on backend.';
      setSubmitResult({ success: emailOk, message: msg });
      setLastExportResult(data.export_result || null);
      if (onFormSubmit) onFormSubmit(formType, data);
    } catch (err) {
      const errData = err.response?.data;
      const status = err.response?.status;
      const isNetworkError = !err.response;
      const canRetry = isNetworkError && retryCount < 1;

      if (canRetry) {
        setSubmitResult({ success: false, message: 'Connecting... retrying in 3 seconds.' });
        setSubmitting(false);
        setTimeout(() => handleSubmit(formTypeOverride, retryCount + 1), 3000);
        return;
      }

      let msg = errData?.guardrail
        ? `Please fix: ${(errData.guardrail.issues || []).slice(0, 3).map(i => i.message).join('; ')}`
        : errData?.error || err.message || 'Submission failed.';
      if (status === 500 && msg) msg += ' (Check backend logs for details.)';
      if (isNetworkError) {
        msg = `Could not reach server. ${err.code === 'ECONNABORTED' ? 'Request timed out—backend may be waking (Render). ' : ''}Click "Wake server & retry" below.`;
      }
      setSubmitResult({ success: false, message: msg, isNetworkError });
    } finally {
      setSubmitting(false);
    }
  };

  React.useEffect(() => {
    if (!pendingAutoSubmit || submitting) return;
    const formData = currentForms[pendingAutoSubmit];
    const guardrail = guardrailResults[pendingAutoSubmit];
    if (formData && guardrail?.passed) {
      handleSubmit(pendingAutoSubmit);
      if (onAutoSubmitHandled) onAutoSubmitHandled();
    }
  }, [pendingAutoSubmit]);

  const tabLabels = {
    occurrence_report: 'Occurrence',
    teddy_bear: 'Teddy Bear',
    status_report: 'Status',
    shift_report: 'Shifts',
    vehicle_inventory: 'Vehicle',
    equipment_inventory: 'Equipment'
  };

  const tabIcons = {
    occurrence_report: '#fc8181',
    teddy_bear: '#90cdf4',
    status_report: '#68d391',
    shift_report: '#f6e05e',
    vehicle_inventory: '#f59e0b',
    equipment_inventory: '#22c55e'
  };

  const guardrail = activeTab ? guardrailResults[activeTab] : null;
  const canSubmit = guardrail?.passed && activeTab !== 'shift_report';

  const handleWakeAndRetry = async () => {
    setSubmitResult({ success: false, message: 'Waking server... please wait up to 60 seconds.', isNetworkError: true });
    setSubmitting(true);
    try {
      await healthAPI.ping();
      setSubmitResult({ success: false, message: 'Server ready. Submitting now...', isNetworkError: true });
      setSubmitting(false);
      await handleSubmit(activeTab, 999);
    } catch (e) {
      setSubmitResult({ success: false, message: 'Server still not responding. Try again in a minute.', isNetworkError: true });
      setSubmitting(false);
    }
  };

  if (formTypes.length === 0) {
    return (
      <div style={styles.emptyPanel}>
        <div style={styles.emptyIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <p style={styles.emptyText}>Forms will appear here as you talk</p>
        <p style={styles.emptySubtext}>Or open a checklist instantly:</p>
        <div style={styles.quickActions}>
          {onOpenForm && (
            <>
              <button onClick={() => onOpenForm('vehicle_inventory')} style={{ ...styles.quickBtn, borderColor: 'rgba(245, 158, 11, 0.5)', color: '#f59e0b' }}>
                🚑 Vehicle Inventory
              </button>
              <button onClick={() => onOpenForm('equipment_inventory')} style={{ ...styles.quickBtn, borderColor: 'rgba(34, 197, 94, 0.5)', color: '#22c55e' }}>
                🧰 Equipment Inventory
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.panel}>
      <div style={styles.tabs}>
        {formTypes.map(ft => (
          <button
            key={ft}
            onClick={() => { setActiveTab(ft); setSubmitResult(null); setLastExportResult(null); }}
            style={{
              ...styles.tab,
              background: activeTab === ft ? `${tabIcons[ft]}22` : 'transparent',
              borderColor: activeTab === ft ? tabIcons[ft] : 'transparent',
              color: activeTab === ft ? tabIcons[ft] : 'rgba(255,255,255,0.4)'
            }}
          >
            {tabLabels[ft] || ft}
          </button>
        ))}
      </div>

      <div style={styles.formScroll}>
        {activeTab === 'occurrence_report' && <OccurrenceReportForm data={currentForms[activeTab]} guardrail={guardrail} />}
        {activeTab === 'teddy_bear' && <TeddyBearForm data={currentForms[activeTab]} guardrail={guardrail} />}
        {activeTab === 'status_report' && <StatusReportForm data={currentForms[activeTab]} />}
        {activeTab === 'shift_report' && <ShiftReportForm data={currentForms[activeTab]} />}
        {activeTab === 'vehicle_inventory' && <VehicleInventoryForm data={currentForms[activeTab]} guardrail={guardrail} />}
        {activeTab === 'equipment_inventory' && <EquipmentInventoryForm data={currentForms[activeTab]} guardrail={guardrail} />}
      </div>

      {guardrail && guardrail.issues.length > 0 && (
        <div style={styles.guardrailSection}>
          <div style={styles.guardrailHeader}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={guardrail.passed ? '#68d391' : '#fc8181'} strokeWidth="2">
              {guardrail.passed ? <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/> : <circle cx="12" cy="12" r="10"/>}
              {guardrail.passed ? <polyline points="22 4 12 14.01 9 11.01"/> : <line x1="12" y1="8" x2="12" y2="12"/>}
            </svg>
            <span style={{ color: guardrail.passed ? '#68d391' : '#fc8181', fontWeight: 600, fontSize: '12px' }}>
              {guardrail.summary.errors} errors, {guardrail.summary.warnings} warnings
            </span>
          </div>
          {guardrail.issues.slice(0, 5).map((issue, i) => (
            <div key={i} style={{
              ...styles.guardrailIssue,
              borderLeftColor: issue.severity === 'critical' ? '#e53e3e' : issue.severity === 'error' ? '#fc8181' : '#ecc94b'
            }}>
              {issue.message}
            </div>
          ))}
        </div>
      )}

      {activeTab && activeTab !== 'shift_report' && (
        <div style={styles.submitSection}>
          {submitResult && (
            <div style={{
              ...styles.submitResult,
              background: submitResult.success ? 'rgba(72, 187, 120, 0.15)' : 'rgba(229, 62, 62, 0.15)',
              color: submitResult.success ? '#68d391' : '#fc8181'
            }}>
              {submitResult.success ? (
                <>
                  {lastExportResult?.emailResult?.success === false
                    ? 'Form saved. Email failed — add GMAIL_USER + GMAIL_APP_PASSWORD to .env or verify SENDER_EMAIL in SendGrid. Download your copy below.'
                    : 'Form sent to Hillsidesplc@gmail.com. Download your copy below.'}
                </>
              ) : (
                submitResult.message
              )}
            </div>
          )}
          {submitResult?.success && lastExportResult && (lastExportResult.pdfBase64 || lastExportResult.docxBase64) && (
            <button
              onClick={() => {
                if (lastExportResult.pdfBase64) {
                  const fn = lastExportResult.fileName || lastExportResult.pdfName || `Form_${Date.now()}.pdf`;
                  downloadFromBase64(lastExportResult.pdfBase64, fn, 'application/pdf');
                } else if (lastExportResult.docxBase64) {
                  const fn = lastExportResult.fileName || `StatusReport_${Date.now()}.docx`;
                  downloadFromBase64(lastExportResult.docxBase64, fn, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                }
              }}
              style={styles.downloadButton}
            >
              Download your copy
            </button>
          )}
          {submitResult?.isNetworkError && !submitResult?.success && (
            <button
              onClick={handleWakeAndRetry}
              disabled={submitting}
              style={{
                ...styles.submitButton,
                marginBottom: '8px',
                background: 'rgba(90, 150, 255, 0.2)',
                borderColor: 'rgba(90, 150, 255, 0.6)',
                color: '#90cdf4'
              }}
            >
              {submitting ? 'Waking server...' : 'Wake server & retry'}
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting || !canSubmit}
            style={{
              ...styles.submitButton,
              opacity: submitting || !canSubmit ? 0.5 : 1,
              cursor: submitting || !canSubmit ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? 'Sending...' : canSubmit
              ? (activeTab === 'vehicle_inventory' ? 'Submit Vehicle Inspection' : activeTab === 'equipment_inventory' ? 'Submit Inventory' : 'Send Report')
              : 'Fix issues to send'}
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: 'rgba(10, 22, 40, 0.6)'
  },
  emptyPanel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '40px',
    background: 'rgba(10, 22, 40, 0.6)'
  },
  emptyIcon: { marginBottom: '16px', opacity: 0.5 },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: '15px', textAlign: 'center', margin: 0 },
  emptySubtext: { color: 'rgba(255,255,255,0.25)', fontSize: '13px', textAlign: 'center', marginTop: '8px' },
  quickActions: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px', width: '100%', maxWidth: '260px' },
  quickBtn: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid',
    background: 'rgba(255,255,255,0.03)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    transition: 'all 0.2s'
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    overflowX: 'auto'
  },
  tab: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: 'Inter, sans-serif',
    background: 'transparent'
  },
  formScroll: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px'
  },
  formContent: {},
  formHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px'
  },
  formIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'rgba(229, 62, 62, 0.15)',
    border: '1px solid rgba(229, 62, 62, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  formTitle: { color: '#fff', fontSize: '16px', fontWeight: 700, margin: 0 },
  formSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '2px 0 0' },
  sectionDivider: {
    padding: '10px 0 6px',
    marginBottom: '8px',
    borderBottom: '1px solid rgba(255,255,255,0.06)'
  },
  sectionLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: '1.5px'
  },
  fieldRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 0',
    gap: '12px'
  },
  fieldLabel: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.6)',
    flexShrink: 0,
    minWidth: '120px'
  },
  required: { color: '#fc8181' },
  fieldValue: {
    flex: 1,
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid',
    fontSize: '13px',
    fontWeight: 500,
    position: 'relative',
    textAlign: 'right'
  },
  emptyField: {
    background: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.25)',
    fontStyle: 'italic'
  },
  confidenceDot: {
    display: 'inline-block',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    marginLeft: '8px',
    verticalAlign: 'middle'
  },
  statusTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  statusHeader: {
    display: 'flex',
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.08)'
  },
  statusRow: {
    display: 'flex',
    padding: '8px 12px',
    background: 'rgba(10, 22, 40, 0.8)',
    transition: 'background 0.2s'
  },
  statusCell: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.6)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    paddingRight: '8px'
  },
  shiftCard: {
    padding: '12px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.06)',
    marginBottom: '8px'
  },
  shiftDate: { fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '6px' },
  shiftDetails: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)'
  },
  guardrailSection: {
    padding: '12px 16px',
    borderTop: '1px solid rgba(255,255,255,0.06)'
  },
  guardrailHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '8px'
  },
  guardrailIssue: {
    padding: '6px 10px',
    borderLeft: '3px solid',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '0 4px 4px 0',
    marginBottom: '4px',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.6)'
  },
  submitSection: { padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' },
  submitResult: {
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '10px',
    fontSize: '13px',
    textAlign: 'center'
  },
  submitButton: {
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #e53e3e, #c53030)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif',
    transition: 'all 0.2s'
  },
  downloadButton: {
    width: '100%',
    padding: '10px 14px',
    marginTop: '8px',
    borderRadius: '10px',
    border: '1px solid rgba(72, 187, 120, 0.5)',
    background: 'rgba(72, 187, 120, 0.15)',
    color: '#68d391',
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};
