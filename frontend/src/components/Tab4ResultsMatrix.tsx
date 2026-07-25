import React, { useState } from 'react';
import { ScheduleResult, OperatingRules } from '../types';
import { Rocket, AlertTriangle, CheckCircle, FileSpreadsheet, FileText, Building, Users, Clock, BarChart3 } from 'lucide-react';

interface Tab4Props {
  onGenerate: () => void;
  isLoading: boolean;
  scheduleResult: ScheduleResult | null;
  operatingRules: OperatingRules;
  onExportExcel: () => void;
  onExportPdf: () => void;
}

export const Tab4ResultsMatrix: React.FC<Tab4Props> = ({
  onGenerate,
  isLoading,
  scheduleResult,
  operatingRules,
  onExportExcel,
  onExportPdf,
}) => {
  const [selectedDeptView, setSelectedDeptView] = useState<string>('');
  const [selectedFacView, setSelectedFacView] = useState<string>('');
  const [viewTab, setViewTab] = useState<'depts' | 'faculty' | 'analytics'>('depts');

  const deptNames = scheduleResult ? Object.keys(scheduleResult.dept_timetables) : [];
  const facultyIds = scheduleResult ? scheduleResult.faculty_ids : [];

  const activeDeptView = selectedDeptView || deptNames[0] || '';
  const activeFacView = selectedFacView || facultyIds[0] || '';

  const currentDeptTimetable = (scheduleResult && activeDeptView) ? scheduleResult.dept_timetables[activeDeptView] || [] : [];
  const currentFacMatrix = (scheduleResult && activeFacView) ? scheduleResult.faculty_matrices[activeFacView] || [] : [];

  return (
    <div className="glass-card">
      <h2><Rocket style={{ display: 'inline', marginRight: '8px' }} /> 4. Institutional Timetable & Global State Matrix</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1.5rem' }}>
        Generate university-wide timetable grids with zero double-bookings and enforced rest breaks across all departments.
      </p>

      <button
        className="btn-primary"
        onClick={onGenerate}
        disabled={isLoading}
        style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', marginBottom: '2rem' }}
      >
        {isLoading ? '⏳ Computing Optimal Institutional Constraints...' : '🚀 Generate University-Wide ERP Timetable'}
      </button>

      {scheduleResult && (
        <>
          {/* Metrics Header */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label"><Building size={16} /> Total Departments</div>
              <div className="metric-value">{scheduleResult.metrics.total_departments}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label"><Users size={16} /> Faculty Matrix Tracked</div>
              <div className="metric-value">{scheduleResult.metrics.total_faculty}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label"><Clock size={16} /> Total Allocated Hours</div>
              <div className="metric-value">{scheduleResult.metrics.total_allocated_slots}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label"><BarChart3 size={16} /> Institutional Capacity</div>
              <div className="metric-value">{scheduleResult.metrics.total_institution_slots}</div>
            </div>
          </div>

          {/* Conflict Diagnostics Banner */}
          {scheduleResult.conflicts && scheduleResult.conflicts.length > 0 ? (
            <div className="alert-banner warning">
              <AlertTriangle size={24} />
              <div>
                <p style={{ fontWeight: 700, margin: 0 }}>Institutional Schedule Warnings / Qualification Alerts Identified:</p>
                <ul style={{ marginTop: '6px', paddingLeft: '20px' }}>
                  {scheduleResult.conflicts.map((conf, i) => (
                    <li key={i}>{conf}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="alert-banner success">
              <CheckCircle size={24} />
              <div>
                ✅ Zero Cross-Department Double-Bookings Detected. Global Faculty Matrix State Verified with Rest Breaks Enforced.
              </div>
            </div>
          )}

          {/* View Selection Tabs */}
          <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-glass)', marginBottom: '1.5rem', marginTop: '1.5rem' }}>
            <button
              className={`tab-btn ${viewTab === 'depts' ? 'active' : ''}`}
              onClick={() => setViewTab('depts')}
            >
              🏢 Department Class Grids
            </button>
            <button
              className={`tab-btn ${viewTab === 'faculty' ? 'active' : ''}`}
              onClick={() => setViewTab('faculty')}
            >
              👤 Global Faculty Master Matrix
            </button>
            <button
              className={`tab-btn ${viewTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setViewTab('analytics')}
            >
              📈 Workload Analytics
            </button>
          </div>

          {/* View 1: Department Class Grids */}
          {viewTab === 'depts' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                <label style={{ fontWeight: 700, color: 'var(--cyan-accent)' }}>Select Department View:</label>
                <select
                  value={activeDeptView}
                  onChange={(e) => setSelectedDeptView(e.target.value)}
                  style={{ width: '220px' }}
                >
                  {deptNames.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      {currentDeptTimetable.length > 0 && Object.keys(currentDeptTimetable[0]).map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentDeptTimetable.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {Object.values(row).map((cell, cIdx) => (
                          <td key={cIdx} style={{ fontWeight: cIdx === 0 ? 700 : 400, color: String(cell).includes('LUNCH') ? 'var(--text-muted)' : 'inherit' }}>
                            {String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* View 2: Global Faculty Master Matrix */}
          {viewTab === 'faculty' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                <label style={{ fontWeight: 700, color: 'var(--cyan-accent)' }}>Select Faculty Master Schedule:</label>
                <select
                  value={activeFacView}
                  onChange={(e) => setSelectedFacView(e.target.value)}
                  style={{ width: '220px' }}
                >
                  {facultyIds.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <h4 style={{ marginBottom: '1rem' }}>Master Schedule Matrix for <strong>{activeFacView}</strong> (Cross-Department View)</h4>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      {currentFacMatrix.length > 0 && Object.keys(currentFacMatrix[0]).map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentFacMatrix.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {Object.values(row).map((cell, cIdx) => (
                          <td key={cIdx} style={{ fontWeight: cIdx === 0 ? 700 : 400 }}>
                            {String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* View 3: Workload Analytics */}
          {viewTab === 'analytics' && (
            <div>
              <h4 style={{ marginBottom: '1rem' }}>Departmental Allocated Hours Summary</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                {Object.entries(scheduleResult.metrics.dept_metrics).map(([d, m]) => (
                  <div key={d} className="glass-card" style={{ background: 'rgba(30, 41, 59, 0.6)' }}>
                    <h5 style={{ color: 'var(--cyan-accent)', fontSize: '1.1rem', marginBottom: '6px' }}>{d}</h5>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Allocated Contact Hours: <strong style={{ color: '#fff' }}>{m.allocated_slots} hrs</strong></p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Capacity Load Factor: <strong style={{ color: 'var(--cyan-accent)' }}>{(m.load_factor * 100).toFixed(1)}%</strong></p>
                    <div className="progress-bar-bg" style={{ marginTop: '10px' }}>
                      <div className="progress-bar-fill normal" style={{ width: `${Math.min(100, m.load_factor * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Branded Export Utility */}
          <hr style={{ borderColor: 'var(--border-glass)', margin: '2rem 0' }} />
          <h3>📥 Branded Export Utility</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginTop: '1rem' }}>
            <button className="btn-primary" onClick={onExportExcel} style={{ padding: '0.9rem' }}>
              <FileSpreadsheet size={20} /> Download Multi-Sheet Excel Workbook (.xlsx)
            </button>
            <button className="btn-primary" onClick={onExportPdf} style={{ padding: '0.9rem' }}>
              <FileText size={20} /> Generate Formal PDF Institutional Report (.pdf)
            </button>
          </div>
        </>
      )}
    </div>
  );
};
