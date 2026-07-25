import React, { useState } from 'react';
import { FacultyMember, SubjectData, OperatingRules } from '../types';
import { Building, Plus, Trash2, Edit3, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Tab2Props {
  operatingRules: OperatingRules;
  setOperatingRules: React.Dispatch<React.SetStateAction<OperatingRules>>;
  deptsCurriculum: Record<string, SubjectData[]>;
  setDeptsCurriculum: React.Dispatch<React.SetStateAction<Record<string, SubjectData[]>>>;
  facultyData: FacultyMember[];
  selectedDept: string;
  setSelectedDept: (dept: string) => void;
}

export const Tab2DepartmentCurriculum: React.FC<Tab2Props> = ({
  operatingRules,
  setOperatingRules,
  deptsCurriculum,
  setDeptsCurriculum,
  facultyData,
  selectedDept,
  setSelectedDept,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDeptNameInput, setNewDeptNameInput] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameInput, setRenameInput] = useState('');

  const deptNames = Object.keys(deptsCurriculum);
  const currentCurriculum = deptsCurriculum[selectedDept] || [];

  // Available faculties for dropdown
  const availableFaculties = facultyData.map((f) => f.Faculty_ID).filter(Boolean);

  // Extract qualified subjects for selected department from staff registry
  const deptQualifiedSubjects: string[] = [];
  facultyData.forEach((f) => {
    if (f.Primary_Dept.trim().toLowerCase() === selectedDept.trim().toLowerCase()) {
      const quals = f.Qualified.split(',').map((q) => q.trim()).filter(Boolean);
      quals.forEach((q) => {
        if (!deptQualifiedSubjects.includes(q)) {
          deptQualifiedSubjects.push(q);
        }
      });
    }
  });

  // Also include existing subjects in curriculum if any
  currentCurriculum.forEach((s) => {
    if (s.Subject.trim() && !deptQualifiedSubjects.includes(s.Subject.trim())) {
      deptQualifiedSubjects.push(s.Subject.trim());
    }
  });

  // Calculate capacity gauge metrics
  const totalConfiguredHours = currentCurriculum.reduce((acc, curr) => acc + (Number(curr.Hours) || 0), 0);
  const breakSlotCount = operatingRules.break_option !== 'None' ? 1 : 0;
  const maxDeptCapacity = operatingRules.working_days * (operatingRules.hours_per_day - breakSlotCount);
  const capacityPercent = maxDeptCapacity > 0 ? Math.min(100, Math.round((totalConfiguredHours / maxDeptCapacity) * 100)) : 0;
  const isOverCapacity = totalConfiguredHours > maxDeptCapacity;

  const handleCellChange = (index: number, field: keyof SubjectData, value: any) => {
    const updated = [...currentCurriculum];
    updated[index] = { ...updated[index], [field]: value };
    setDeptsCurriculum({
      ...deptsCurriculum,
      [selectedDept]: updated,
    });
  };

  const handleAddSubject = () => {
    const defaultSub = deptQualifiedSubjects[0] || 'New Subject';
    const updated = [
      ...currentCurriculum,
      {
        Subject: defaultSub,
        Faculty: availableFaculties[0] || 'MR',
        Hours: 3,
        Type: 'Theory',
        Category: 'Core Theory',
      },
    ];
    setDeptsCurriculum({
      ...deptsCurriculum,
      [selectedDept]: updated as SubjectData[],
    });
  };

  const handleDeleteSubject = (index: number) => {
    const updated = currentCurriculum.filter((_, i) => i !== index);
    setDeptsCurriculum({
      ...deptsCurriculum,
      [selectedDept]: updated,
    });
  };

  const handleCreateDepartment = () => {
    const name = newDeptNameInput.trim() || `Department ${deptNames.length + 1}`;
    if (!deptsCurriculum[name]) {
      setDeptsCurriculum({
        ...deptsCurriculum,
        [name]: [],
      });
      setSelectedDept(name);
    }
    setNewDeptNameInput('');
    setShowAddModal(false);
  };

  const handleRenameDepartment = () => {
    if (!renameInput.trim() || renameInput === selectedDept) {
      setIsRenaming(false);
      return;
    }
    const newName = renameInput.trim();
    const newCurriculumMap: Record<string, SubjectData[]> = {};
    Object.keys(deptsCurriculum).forEach((k) => {
      if (k === selectedDept) {
        newCurriculumMap[newName] = deptsCurriculum[k];
      } else {
        newCurriculumMap[k] = deptsCurriculum[k];
      }
    });
    setDeptsCurriculum(newCurriculumMap);
    setSelectedDept(newName);
    setIsRenaming(false);
  };

  const handleDeleteDepartment = () => {
    if (deptNames.length <= 1) {
      alert("At least one department must remain configured.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete department '${selectedDept}'?`)) {
      const copy = { ...deptsCurriculum };
      delete copy[selectedDept];
      setDeptsCurriculum(copy);
      setSelectedDept(Object.keys(copy)[0]);
    }
  };

  return (
    <div className="glass-card">
      <h2><Building style={{ display: 'inline', marginRight: '8px' }} /> 2. Institutional Operating Rules & Department Curriculums</h2>
      
      {/* Operating Parameters Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem', margin: '1.5rem 0' }}>
        <div>
          <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Weekly Working Days</label>
          <input
            type="number"
            min={1}
            max={7}
            value={operatingRules.working_days}
            onChange={(e) => setOperatingRules({ ...operatingRules, working_days: parseInt(e.target.value) || 4 })}
          />
        </div>
        <div>
          <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Daily Operating Hours</label>
          <input
            type="number"
            min={1}
            max={10}
            value={operatingRules.hours_per_day}
            onChange={(e) => setOperatingRules({ ...operatingRules, hours_per_day: parseInt(e.target.value) || 6 })}
          />
        </div>
        <div>
          <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Institutional Lunch Break Slot</label>
          <select
            value={operatingRules.break_option}
            onChange={(e) => setOperatingRules({ ...operatingRules, break_option: e.target.value as any })}
          >
            <option value="None">None</option>
            <option value="Hour IV (Lunch)">Hour IV (Lunch)</option>
            <option value="Hour III (Lunch)">Hour III (Lunch)</option>
          </select>
        </div>
        <div>
          <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Current Semester</label>
          <select
            value={operatingRules.semester}
            onChange={(e) => setOperatingRules({ ...operatingRules, semester: parseInt(e.target.value) || 4 })}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>
      </div>

      <hr style={{ borderColor: 'var(--border-glass)', margin: '1.8rem 0' }} />

      {/* Department Selector & Management Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontWeight: 700, color: 'var(--cyan-accent)' }}>Select Department:</label>
          {!isRenaming ? (
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{ width: '220px', fontWeight: 700 }}
            >
              {deptNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          ) : (
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                style={{ width: '180px' }}
              />
              <button className="btn-primary" onClick={handleRenameDepartment}>Save</button>
            </div>
          )}
          {!isRenaming && (
            <button
              className="btn-secondary"
              onClick={() => {
                setRenameInput(selectedDept);
                setIsRenaming(true);
              }}
              title="Rename Department"
            >
              <Edit3 size={15} /> Rename
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add New Department
          </button>
          <button className="btn-danger" onClick={handleDeleteDepartment} title="Delete Department">
            <Trash2 size={16} /> Delete Department
          </button>
        </div>
      </div>

      {/* Real-time Workload Capacity Progress Bar */}
      <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-glass)', padding: '1rem 1.2rem', borderRadius: '10px', margin: '1.5rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: isOverCapacity ? '#fca5a5' : '#86efac' }}>
            {isOverCapacity ? <AlertCircle size={16} style={{ display: 'inline', marginRight: '6px' }} /> : <CheckCircle2 size={16} style={{ display: 'inline', marginRight: '6px' }} />}
            Workload Capacity: {totalConfiguredHours} Allocated Contact Hours / {maxDeptCapacity} Max Available Slots
          </span>
          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: isOverCapacity ? '#ef4444' : 'var(--cyan-accent)' }}>
            {capacityPercent}%
          </span>
        </div>
        <div className="progress-bar-bg">
          <div
            className={`progress-bar-fill ${isOverCapacity ? 'overload' : 'normal'}`}
            style={{ width: `${capacityPercent}%` }}
          />
        </div>
      </div>

      {/* Curriculum Data Table */}
      <h3 style={{ fontSize: '1.1rem', marginTop: '1rem' }}>Curriculum Schedule for <strong>{selectedDept}</strong></h3>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Course Code / Name (Filtered by Staff Quals)</th>
              <th>Assigned Faculty</th>
              <th>Weekly Hours</th>
              <th>Type</th>
              <th>Category</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentCurriculum.map((row, idx) => (
              <tr key={idx}>
                <td>
                  <select
                    value={row.Subject}
                    onChange={(e) => handleCellChange(idx, 'Subject', e.target.value)}
                  >
                    {deptQualifiedSubjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    {!deptQualifiedSubjects.includes(row.Subject) && (
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
                <td style={{ width: '130px' }}>
                  <input
                    type="number"
                    min={1}
                    max={10}
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
                <td style={{ width: '160px' }}>
                  <select
                    value={row.Category}
                    onChange={(e) => handleCellChange(idx, 'Category', e.target.value)}
                  >
                    <option value="Core Theory">Core Theory</option>
                    <option value="Elective Theory">Elective Theory</option>
                    <option value="Lab">Lab</option>
                  </select>
                </td>
                <td style={{ width: '70px', textAlign: 'center' }}>
                  <button className="btn-danger" onClick={() => handleDeleteSubject(idx)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1.2rem' }}>
        <button className="btn-primary" onClick={handleAddSubject}>
          <Plus size={16} /> Add Subject to Curriculum
        </button>
      </div>

      {/* Add Department Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>➕ Add New Department Configuration</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0.8rem 0' }}>Enter unique department title:</p>
            <input
              type="text"
              placeholder="e.g., B.Tech ECE, B.Sc Data Science"
              value={newDeptNameInput}
              onChange={(e) => setNewDeptNameInput(e.target.value)}
              style={{ marginBottom: '1.5rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateDepartment}>Create Department</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
