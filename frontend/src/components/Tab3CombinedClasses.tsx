import React from 'react';
import { CombinedClass, FacultyMember, SubjectData } from '../types';
import { Link2, Plus, Trash2, Users, Info } from 'lucide-react';

interface Tab3Props {
  combinedClasses: CombinedClass[];
  setCombinedClasses: React.Dispatch<React.SetStateAction<CombinedClass[]>>;
  facultyData: FacultyMember[];
  availableDepartments: string[];
  deptsCurriculum: Record<string, SubjectData[]>;
}

export const Tab3CombinedClasses: React.FC<Tab3Props> = ({
  combinedClasses,
  setCombinedClasses,
  facultyData,
  availableDepartments,
  deptsCurriculum,
}) => {
  const availableFaculties = facultyData.map((f) => f.Faculty_ID).filter(Boolean);

  const allCourseNames: string[] = [];
  
  Object.values(deptsCurriculum).forEach((subList) => {
    subList.forEach((sub) => {
      if (sub.Subject.trim() && !allCourseNames.includes(sub.Subject.trim())) {
        allCourseNames.push(sub.Subject.trim());
      }
    });
  });

  facultyData.forEach((f) => {
    const quals = f.Qualified.split(',').map((q) => q.trim()).filter(Boolean);
    quals.forEach((q) => {
      if (!allCourseNames.includes(q)) {
        allCourseNames.push(q);
      }
    });
  });

  if (allCourseNames.length === 0) {
    allCourseNames.push("Ethics in Tech", "Python", "ML", "Signals & Systems", "Project-c");
  }

  const handleCellChange = (index: number, field: keyof CombinedClass, value: any) => {
    const updated = [...combinedClasses];
    updated[index] = { ...updated[index], [field]: value };
    setCombinedClasses(updated);
  };

  const handleDeptToggle = (index: number, deptName: string) => {
    const current = combinedClasses[index].ParticipatingDepts || [];
    let updatedDepts: string[];
    if (current.includes(deptName)) {
      updatedDepts = current.filter((d) => d !== deptName);
    } else {
      updatedDepts = [...current, deptName];
    }
    handleCellChange(index, 'ParticipatingDepts', updatedDepts);
  };

  const handleAddCombined = () => {
    setCombinedClasses([
      ...combinedClasses,
      {
        Subject: allCourseNames[0] || 'Ethics in Tech',
        Faculty: availableFaculties[0] || 'JP',
        ParticipatingDepts: availableDepartments.slice(0, 2),
        Hours: 2,
        Type: 'Theory',
      },
    ]);
  };

  const handleDeleteCombined = (index: number) => {
    const updated = combinedClasses.filter((_, i) => i !== index);
    setCombinedClasses(updated);
  };

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="card-header-title">
            <Link2 size={18} color="#60a5fa" /> Combined / Merged Multi-Department Sessions
          </div>
          <p className="card-subtitle">
            Schedule joint lectures where a single faculty teaches multiple departments simultaneously.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(30, 41, 59, 0.5)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border-glass)' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={14} color="#fff" />
          </div>
          <span style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 700 }}>⇄</span>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={14} color="#fff" />
          </div>
        </div>
      </div>

      <div className="section-bar-header">
        <div className="section-bar-title">Create Joint Combined Session</div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Joint Course</th>
              <th>Assigned Faculty</th>
              <th>Participating Departments</th>
              <th style={{ textAlign: 'center' }}>Weekly Hours</th>
              <th>Type</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {combinedClasses.map((row, idx) => (
              <tr key={idx}>
                <td>
                  <select
                    value={row.Subject}
                    onChange={(e) => handleCellChange(idx, 'Subject', e.target.value)}
                  >
                    {allCourseNames.map((course) => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                    {!allCourseNames.includes(row.Subject) && (
                      <option value={row.Subject}>{row.Subject}</option>
                    )}
                  </select>
                </td>
                <td style={{ width: '130px' }}>
                  <select
                    value={row.Faculty}
                    onChange={(e) => handleCellChange(idx, 'Faculty', e.target.value)}
                  >
                    {availableFaculties.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {availableDepartments.map((dept) => {
                      const isSelected = (row.ParticipatingDepts || []).includes(dept);
                      return (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => handleDeptToggle(idx, dept)}
                          style={{
                            background: isSelected ? 'rgba(37, 99, 235, 0.25)' : 'rgba(30, 41, 59, 0.5)',
                            color: isSelected ? '#93c5fd' : 'var(--text-muted)',
                            border: `1px solid ${isSelected ? '#3b82f6' : 'var(--border-glass)'}`,
                            borderRadius: '10px',
                            padding: '2px 7px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {isSelected ? '✓ ' : '+ '}{dept}
                        </button>
                      );
                    })}
                  </div>
                </td>
                <td style={{ width: '90px', textAlign: 'center' }}>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={row.Hours}
                    onChange={(e) => handleCellChange(idx, 'Hours', parseInt(e.target.value) || 1)}
                    style={{ textAlign: 'center' }}
                  />
                </td>
                <td style={{ width: '110px' }}>
                  <select
                    value={row.Type}
                    onChange={(e) => handleCellChange(idx, 'Type', e.target.value)}
                  >
                    <option value="Theory">Theory</option>
                    <option value="Lab">Lab</option>
                  </select>
                </td>
                <td style={{ width: '70px', textAlign: 'center' }}>
                  <button className="btn-icon-action delete" onClick={() => handleDeleteCombined(idx)} title="Delete combined session">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '0.9rem' }}>
        <button className="btn-primary" onClick={handleAddCombined}>
          <Plus size={14} /> Add Joint Combined Session
        </button>
      </div>

      <div style={{ marginTop: '1.2rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <Info size={14} color="#60a5fa" />
        <span>Combined sessions will be placed in the timetable without clashes across selected departments.</span>
      </div>
    </div>
  );
};
