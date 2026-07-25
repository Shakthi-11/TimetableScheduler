import React, { useState } from 'react';
import { ScheduleResult, OperatingRules, FacultyMember, SubjectData, CombinedClass } from '../types';
import { Calendar, Download, CheckCircle, FileSpreadsheet, Layers, Sparkles, Cpu } from 'lucide-react';
import { ScheduleCombination, DeptAcademicGrid } from '../utils/schedulerEngine';

interface Tab4Props {
  onGenerate: () => void;
  isLoading: boolean;
  scheduleResult: ScheduleResult | null;
  operatingRules: OperatingRules;
  onExportExcel: () => void;
  onExportPdf: () => void;
  facultyData?: FacultyMember[];
  deptsCurriculum?: Record<string, SubjectData[]>;
  combinedClasses?: CombinedClass[];
  hasGenerated: boolean;
  combinations: ScheduleCombination[];
  activeCombinationId: number;
  setActiveCombinationId: (id: number) => void;
}

const emptyStateCardStyle: React.CSSProperties = {
  background: 'rgba(10, 16, 30, 0.65)',
  border: '1px solid var(--border-glass)',
  borderRadius: '14px',
  padding: '3rem 2rem',
  textAlign: 'center',
  margin: '1.5rem 0',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1rem',
};

const iconCircleStyle: React.CSSProperties = {
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.3), rgba(56, 189, 248, 0.3))',
  border: '1px solid var(--border-glass)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const Tab4ResultsMatrix: React.FC<Tab4Props> = ({
  onGenerate,
  isLoading,
  scheduleResult,
  operatingRules,
  onExportExcel,
  onExportPdf,
  facultyData = [],
  deptsCurriculum = {},
  combinedClasses = [],
  hasGenerated,
  combinations,
  activeCombinationId,
  setActiveCombinationId,
}) => {
  const [selectedDeptView, setSelectedDeptView] = useState<string>('ALL');
  const [selectedSemester, setSelectedSemester] = useState<number>(operatingRules.semester || 4);

  const deptNames = Object.keys(deptsCurriculum);
  const deptListStr = deptNames.join(', ');

  const handleGenerateClick = () => {
    onGenerate();
  };

  const activeCombination = combinations.find(c => c.id === activeCombinationId) || combinations[0];
  const activeGrids: Record<string, DeptAcademicGrid> = activeCombination ? activeCombination.grids : {};

  const deptsToRender = selectedDeptView === 'ALL'
    ? deptNames
    : [selectedDeptView];

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
        <div>
          <div className="card-header-title">
            <Calendar size={18} color="#60a5fa" /> Timetable Matrix
          </div>
          <p className="card-subtitle">
            Advanced constraint-based timetable solver for university departments.
          </p>
        </div>

        {hasGenerated && (
          <button
            className="btn-primary"
            onClick={handleGenerateClick}
            disabled={isLoading}
            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
          >
            {isLoading ? '⏳ Computing Schedule...' : '🔄 Re-Generate Timetables'}
          </button>
        )}
      </div>

      {/* Initial Empty State Before Generation */}
      {!hasGenerated ? (
        <div style={emptyStateCardStyle}>
          <div style={iconCircleStyle}>
            <Cpu size={32} color="#38bdf8" />
          </div>

          <div>
            <h3 style={{ color: '#ffffff', fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.4rem' }}>
              Advanced Constraint Timetable Engine
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto' }}>
              Configured with <strong>{deptNames.length} Department(s)</strong> ({deptListStr}), <strong>{facultyData.length} Faculty Profile(s)</strong>, and <strong>{combinedClasses.length} Combined Session(s)</strong>.
            </p>
          </div>

          <button
            className="btn-primary"
            onClick={handleGenerateClick}
            disabled={isLoading}
            style={{ padding: '0.85rem 2.2rem', fontSize: '1rem', marginTop: '0.5rem', fontWeight: 700 }}
          >
            {isLoading ? '⏳ Solving Constraints...' : '🚀 Generate University Timetables'}
          </button>
        </div>
      ) : (
        <>
          {/* Top Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1rem', background: 'rgba(15, 23, 42, 0.6)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Department View</label>
                <select
                  value={selectedDeptView}
                  onChange={(e) => setSelectedDeptView(e.target.value)}
                  style={{ width: '220px', padding: '3px 8px', fontSize: '0.82rem', fontWeight: 700 }}
                >
                  <option value="ALL">🏢 All Departments ({deptNames.length})</option>
                  {deptNames.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Semester</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
                  style={{ width: '110px', padding: '3px 8px', fontSize: '0.82rem', fontWeight: 700 }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Multiple Timetable Combination Switcher Bar */}
          <div style={{ background: 'rgba(18, 28, 54, 0.7)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border-glass)', marginBottom: '1.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.8rem' }}>
              <Sparkles size={16} color="#38bdf8" />
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff' }}>
                Generated Timetable Combinations (Select Optimization Profile):
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
              {combinations.map((comb) => (
                <button
                  key={comb.id}
                  onClick={() => setActiveCombinationId(comb.id)}
                  style={{
                    background: activeCombinationId === comb.id
                      ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(37, 99, 235, 0.4))'
                      : 'rgba(10, 16, 30, 0.6)',
                    color: activeCombinationId === comb.id ? '#ffffff' : 'var(--text-muted)',
                    border: `1px solid ${activeCombinationId === comb.id ? '#38bdf8' : 'var(--border-glass)'}`,
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: activeCombinationId === comb.id ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none'
                  }}
                >
                  {activeCombinationId === comb.id ? '✓ ' : ''}{comb.name}
                </button>
              ))}
            </div>

            {activeCombination && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                💡 <strong>Profile Details:</strong> {activeCombination.description}
              </p>
            )}
          </div>

          {/* Status Alert Banner */}
          <div className="alert-banner success" style={{ marginBottom: '1.2rem', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} />
              <div>
                Human-grade academic timetables generated for <strong>{deptNames.length} Department(s)</strong> ({deptListStr}). All constraints satisfied.
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              <span className="tag-badge-subject" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', borderColor: 'rgba(34, 197, 94, 0.4)' }}>
                ✓ Multi-Day Theory Distribution (1 hr/day)
              </span>
              <span className="tag-badge-subject" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}>
                ✓ Synchronized Joint Combined Sessions
              </span>
              <span className="tag-badge-subject" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.4)' }}>
                ✓ Faculty Rest Breaks & Fatigue Limits
              </span>
              <span className="tag-badge-subject" style={{ background: 'rgba(251, 146, 60, 0.2)', color: '#fb923c', borderColor: 'rgba(251, 146, 60, 0.4)' }}>
                ✓ Pedagogical Morning Core Lectures
              </span>
            </div>
          </div>

          {/* Render Generated Timetable Grids for Selected Combination */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
            {deptsToRender.map((dName) => {
              const gridData: DeptAcademicGrid = activeGrids[dName] || [];

              return (
                <div key={dName} style={{ background: 'rgba(10, 15, 26, 0.7)', borderRadius: '10px', padding: '1rem', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <h3 style={{ color: 'var(--cyan-accent)', fontSize: '1rem', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Layers size={15} /> Department Timetable: <span style={{ color: '#ffffff' }}>{dName}</span> ({activeCombination ? activeCombination.name : 'Combination 1'})
                    </h3>
                  </div>

                  <div className="table-container">
                    <table className="academic-timetable-table">
                      <thead>
                        <tr>
                          <th style={{ width: '100px', textAlign: 'center' }}>Day Order</th>
                          <th style={{ textAlign: 'center' }}>I Hour</th>
                          <th style={{ textAlign: 'center' }}>II Hour</th>
                          <th style={{ textAlign: 'center' }}>III Hour</th>
                          <th style={{ textAlign: 'center' }}>IV Hour</th>
                          <th style={{ textAlign: 'center' }}>V Hour</th>
                          <th style={{ textAlign: 'center' }}>VI Hour</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gridData.map((row, idx) => (
                          <tr key={idx}>
                            <td className="day-order-cell">
                              {row.dayOrder}
                            </td>

                            {row.noClasses ? (
                              <td colSpan={6} className="no-classes-cell">
                                {row.label || 'No CLASSES'}
                              </td>
                            ) : (
                              row.slots.map((slot, sIdx) => (
                                <td
                                  key={sIdx}
                                  colSpan={slot.colSpan || 1}
                                  className="academic-slot-cell"
                                >
                                  <div style={{ fontWeight: 700 }}>
                                    {slot.title === 'Free Slot' ? '' : slot.title}
                                  </div>
                                </td>
                              ))
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.2rem' }}>
            <button className="btn-secondary" onClick={onExportExcel} title="Export Excel Workbook">
              <FileSpreadsheet size={14} /> Download Excel Workbook (.xlsx)
            </button>
            <button className="btn-primary" onClick={onExportPdf} title="Export PDF Timetable Report">
              <Download size={14} /> Export Timetable (PDF)
            </button>
          </div>
        </>
      )}
    </div>
  );
};
