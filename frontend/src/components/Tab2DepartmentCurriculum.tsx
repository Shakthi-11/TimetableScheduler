import React, { useState } from 'react';
import { FacultyMember, SubjectData, OperatingRules } from '../types';
import { Building, Plus, Trash2, Edit2, Calendar, Clock, Utensils, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';

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

  const availableFaculties = facultyData.map((f) => f.Faculty_ID).filter(Boolean);

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

  currentCurriculum.forEach((s) => {
    if (s.Subject.trim() && !deptQualifiedSubjects.includes(s.Subject.trim())) {
      deptQualifiedSubjects.push(s.Subject.trim());
    }
  });

  const totalConfiguredHours = currentCurriculum.reduce((acc, curr) => acc + (Number(curr.Hours) || 0), 0);
  const maxDeptCapacity = operatingRules.working_days * operatingRules.hours_per_day;
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
      <div className="card-header-title">
        <Building size={18} color="#60a5fa" /> Institutional Operating Rules & Department Curriculums
      </div>
      <p className="card-subtitle">
        Configure institutional rules and manage department-wise curriculum and workload.
      </p>

      {/* 4 Operating Rule Metric Cards */}
      <div className="rules-grid">
        <div className="rule-card">
          <div className="stat-icon-wrapper blue">
            <Calendar size={16} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Weekly Working Days</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <input
                type="number"
                min={1}
                max={7}
                value={operatingRules.working_days}
                onChange={(e) => setOperatingRules({ ...operatingRules, working_days: parseInt(e.target.value) || 5 })}
                style={{ width: '50px', padding: '2px 4px', fontSize: '0.9rem', fontWeight: 700 }}
              />
              <span style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 700 }}>Days</span>
            </div>
          </div>
        </div>

        <div className="rule-card">
          <div className="stat-icon-wrapper blue">
            <Clock size={16} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Daily Operating Hours</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <input
                type="number"
                min={1}
                max={10}
                value={operatingRules.hours_per_day}
                onChange={(e) => setOperatingRules({ ...operatingRules, hours_per_day: parseInt(e.target.value) || 6 })}
                style={{ width: '50px', padding: '2px 4px', fontSize: '0.9rem', fontWeight: 700 }}
              />
              <span style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 700 }}>Hours / Day</span>
            </div>
          </div>
        </div>

        <div className="rule-card">
          <div className="stat-icon-wrapper blue">
            <Utensils size={16} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Lunch Break Slot</div>
            <select
              value="None"
              disabled
              style={{ padding: '2px 4px', fontSize: '0.8rem', marginTop: '2px', fontWeight: 700, opacity: 0.9 }}
            >
              <option value="None">None</option>
            </select>
          </div>
        </div>

        <div className="rule-card">
          <div className="stat-icon-wrapper blue">
            <BookOpen size={16} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Current Semester</div>
            <select
              value={operatingRules.semester}
              onChange={(e) => setOperatingRules({ ...operatingRules, semester: parseInt(e.target.value) || 4 })}
              style={{ padding: '2px 4px', fontSize: '0.8rem', marginTop: '2px', fontWeight: 700 }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Department Selector & Management Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Select Department</label>
          {!isRenaming ? (
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{ width: '180px', fontWeight: 700 }}
            >
              {deptNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          ) : (
            <div style={{ display: 'flex', gap: '4px' }}>
              <input
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                style={{ width: '140px' }}
              />
              <button className="btn-primary" onClick={handleRenameDepartment} style={{ padding: '4px 8px' }}>Save</button>
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
              <Edit2 size={13} /> Rename
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={14} /> Add New Department
          </button>
          <button className="btn-danger-outline" onClick={handleDeleteDepartment} title="Delete Department">
            <Trash2 size={14} /> Delete Department
          </button>
        </div>
      </div>

      {/* Real-time Workload Capacity Progress Bar */}
      <div className="progress-bar-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: isOverCapacity ? '#fca5a5' : '#4ade80' }}>
            {isOverCapacity ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
            Workload Capacity: <span style={{ color: '#ffffff', fontWeight: 700 }}>{totalConfiguredHours} Allocated</span> / {maxDeptCapacity} Max Available Slots
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: isOverCapacity ? '#ef4444' : 'var(--cyan-accent)' }}>
            {capacityPercent}%
          </div>
        </div>
        <div className="progress-bar-bg">
          <div
            className={`progress-bar-fill ${isOverCapacity ? 'overload' : 'normal'}`}
            style={{ width: `${capacityPercent}%` }}
          />
        </div>
      </div>

      {/* Curriculum Schedule Table */}
      <div className="section-bar-header" style={{ marginTop: '0.5rem' }}>
        <div className="section-bar-title">Curriculum Schedule for {selectedDept}</div>
      </div>

      <div className="table-container" style={{ flex: 1 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>COURSE / SUBJECT</th>
              <th>ASSIGNED FACULTY</th>
              <th style={{ textAlign: 'center' }}>WEEKLY HOURS</th>
              <th>TYPE</th>
              <th>CATEGORY</th>
              <th style={{ textAlign: 'center' }}>ACTIONS</th>
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
                <td style={{ width: '100px', textAlign: 'center' }}>
                  <input
                    type="number"
                    min={1}
                    max={10}
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
                <td style={{ width: '130px' }}>
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
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                    <button className="btn-icon-action edit" title="Edit subject">
                      <Edit2 size={14} />
                    </button>
                    <button className="btn-icon-action delete" onClick={() => handleDeleteSubject(idx)} title="Delete subject">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '0.9rem' }}>
        <button className="btn-primary" onClick={handleAddSubject}>
          <Plus size={14} /> Add Subject to Curriculum
        </button>
      </div>

      {/* Add Department Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ color: '#ffffff', marginBottom: '0.5rem' }}>➕ Add New Department Configuration</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>Enter unique department title:</p>
            <input
              type="text"
              placeholder="e.g., B.Tech ECE, B.Sc Data Science"
              value={newDeptNameInput}
              onChange={(e) => setNewDeptNameInput(e.target.value)}
              style={{ marginBottom: '1.2rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateDepartment}>Create Department</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
