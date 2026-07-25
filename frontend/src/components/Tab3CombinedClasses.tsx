import React from 'react';
import { CombinedClass, FacultyMember, SubjectData } from '../types';
import { Link2, Plus, Trash2 } from 'lucide-react';

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

  // Extract all unique course names across all department curriculums & staff qualifications
  const allCourseNames: string[] = [];
  
  // 1. From department curriculums
  Object.values(deptsCurriculum).forEach((subList) => {
    subList.forEach((sub) => {
      if (sub.Subject.trim() && !allCourseNames.includes(sub.Subject.trim())) {
        allCourseNames.push(sub.Subject.trim());
      }
    });
  });

  // 2. From staff registry qualified subjects
  facultyData.forEach((f) => {
    const quals = f.Qualified.split(',').map((q) => q.trim()).filter(Boolean);
    quals.forEach((q) => {
      if (!allCourseNames.includes(q)) {
        allCourseNames.push(q);
      }
    });
  });

  // Fallback defaults if empty
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
        Subject: allCourseNames[0] || 'Joint Lecture',
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
      <h2><Link2 style={{ display: 'inline', marginRight: '8px' }} /> 3. Combined / Merged Multi-Department Sessions</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1.5rem' }}>
        Schedule joint lectures where a single faculty teaches multiple department sections simultaneously in the exact same slot.
      </p>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Joint Course Name (All Courses Dropdown)</th>
              <th>Assigned Faculty</th>
              <th>Participating Departments</th>
              <th>Weekly Hours</th>
              <th>Type</th>
              <th>Action</th>
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
                <td style={{ width: '180px' }}>
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
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {availableDepartments.map((dept) => {
                      const isSelected = (row.ParticipatingDepts || []).includes(dept);
                      return (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => handleDeptToggle(idx, dept)}
                          style={{
                            background: isSelected ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.5)',
                            color: isSelected ? '#38bdf8' : 'var(--text-muted)',
                            border: `1px solid ${isSelected ? 'var(--cyan-accent)' : 'var(--border-glass)'}`,
                            borderRadius: '12px',
                            padding: '4px 10px',
                            fontSize: '0.8rem',
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
                <td style={{ width: '130px' }}>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={row.Hours}
                    onChange={(e) => handleCellChange(idx, 'Hours', parseInt(e.target.value) || 1)}
                  />
                </td>
                <td style={{ width: '140px' }}>
                  <select
                    value={row.Type}
                    onChange={(e) => handleCellChange(idx, 'Type', e.target.value)}
                  >
                    <option value="Theory">Theory</option>
                    <option value="Lab">Lab</option>
                  </select>
                </td>
                <td style={{ width: '70px', textAlign: 'center' }}>
                  <button className="btn-danger" onClick={() => handleDeleteCombined(idx)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1.2rem' }}>
        <button className="btn-primary" onClick={handleAddCombined}>
          <Plus size={16} /> Add Joint Combined Session
        </button>
      </div>
    </div>
  );
};
