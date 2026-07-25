import React, { useState } from 'react';
import { FacultyMember } from '../types';
import { Plus, Trash2, Upload, Download, UserCheck, Building } from 'lucide-react';

interface Tab1StaffRegistryProps {
  facultyData: FacultyMember[];
  setFacultyData: React.Dispatch<React.SetStateAction<FacultyMember[]>>;
  availableDepartments: string[];
  onAddNewDepartment: (deptName: string) => void;
}

export const Tab1StaffRegistry: React.FC<Tab1StaffRegistryProps> = ({
  facultyData,
  setFacultyData,
  availableDepartments,
  onAddNewDepartment,
}) => {
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDeptInput, setNewDeptInput] = useState('');

  const handleCellChange = (index: number, field: keyof FacultyMember, value: any) => {
    const updated = [...facultyData];
    updated[index] = { ...updated[index], [field]: value };
    setFacultyData(updated);
  };

  const handleAddRow = () => {
    const newId = `FAC_${facultyData.length + 1}`;
    setFacultyData([
      ...facultyData,
      {
        Faculty_ID: newId,
        Name: `Prof. ${newId}`,
        Primary_Dept: availableDepartments[0] || 'B.sc CS',
        Qualified: 'General Course',
        Max_Daily: 4,
        Max_Cons: 2,
      },
    ]);
  };

  const handleDeleteRow = (index: number) => {
    const updated = facultyData.filter((_, i) => i !== index);
    setFacultyData(updated);
  };

  const handleCreateDeptSubmit = () => {
    if (newDeptInput.trim()) {
      onAddNewDepartment(newDeptInput.trim());
      setNewDeptInput('');
      setShowAddDeptModal(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Faculty_ID,Name,Primary_Dept,Qualified,Max_Daily,Max_Cons\nMR,Prof. MR,B.sc CS,\"Python, Python Lab, AI\",4,2\nVR,Prof. VR,B.sc CS,\"ML, ML Lab, Data Mining\",4,2";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Staff_Registry_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      const parsed: FacultyMember[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length >= 4) {
          parsed.push({
            Faculty_ID: parts[0].trim(),
            Name: parts[1].trim(),
            Primary_Dept: parts[2].trim(),
            Qualified: parts[3].replace(/"/g, '').trim(),
            Max_Daily: parseInt(parts[4]) || 4,
            Max_Cons: parseInt(parts[5]) || 2,
          });
        }
      }
      if (parsed.length > 0) {
        setFacultyData(parsed);
        setShowCsvModal(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2><UserCheck style={{ display: 'inline', marginRight: '8px' }} /> 1. University Staff Registry & Qualification Engine</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Manage faculty profiles, qualified course mappings, daily contact limits, and continuous teaching break rules.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => setShowAddDeptModal(true)} title="Add a new department directly to the system">
            <Building size={16} /> ➕ Add New Department
          </button>
          <button className="btn-secondary" onClick={handleDownloadTemplate}>
            <Download size={16} /> Sample CSV Template
          </button>
          <button className="btn-primary" onClick={() => setShowCsvModal(true)}>
            <Upload size={16} /> Bulk Import CSV
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Faculty ID / Code</th>
              <th>Faculty Name</th>
              <th>Primary Department</th>
              <th>Qualified Subjects (Comma-Separated)</th>
              <th>Max Daily Hours</th>
              <th>Max Continuous Hours</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {facultyData.map((row, idx) => (
              <tr key={idx}>
                <td style={{ width: '130px' }}>
                  <input
                    type="text"
                    value={row.Faculty_ID}
                    onChange={(e) => handleCellChange(idx, 'Faculty_ID', e.target.value)}
                  />
                </td>
                <td style={{ width: '180px' }}>
                  <input
                    type="text"
                    value={row.Name}
                    onChange={(e) => handleCellChange(idx, 'Name', e.target.value)}
                  />
                </td>
                <td style={{ width: '170px' }}>
                  <select
                    value={row.Primary_Dept}
                    onChange={(e) => handleCellChange(idx, 'Primary_Dept', e.target.value)}
                  >
                    {availableDepartments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                    {!availableDepartments.includes(row.Primary_Dept) && (
                      <option value={row.Primary_Dept}>{row.Primary_Dept}</option>
                    )}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    value={row.Qualified}
                    onChange={(e) => handleCellChange(idx, 'Qualified', e.target.value)}
                  />
                  <div style={{ marginTop: '4px' }}>
                    {row.Qualified.split(',').map((q, qIdx) => (
                      q.trim() ? <span key={qIdx} className="tag-badge">{q.trim()}</span> : null
                    ))}
                  </div>
                </td>
                <td style={{ width: '120px' }}>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={row.Max_Daily}
                    onChange={(e) => handleCellChange(idx, 'Max_Daily', parseInt(e.target.value) || 4)}
                  />
                </td>
                <td style={{ width: '130px' }}>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    value={row.Max_Cons}
                    onChange={(e) => handleCellChange(idx, 'Max_Cons', parseInt(e.target.value) || 2)}
                  />
                </td>
                <td style={{ width: '70px', textAlign: 'center' }}>
                  <button className="btn-danger" onClick={() => handleDeleteRow(idx)} title="Delete faculty">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1.2rem', display: 'flex', gap: '10px' }}>
        <button className="btn-primary" onClick={handleAddRow}>
          <Plus size={16} /> Add New Faculty Member
        </button>
        <button className="btn-secondary" onClick={() => setShowAddDeptModal(true)}>
          <Building size={16} /> Add New Department
        </button>
      </div>

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>📥 Bulk Import Staff Registry (CSV)</h3>
            <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>
              Upload a `.csv` file with columns: `Faculty_ID, Name, Primary_Dept, Qualified, Max_Daily, Max_Cons`.
            </p>
            <input type="file" accept=".csv" onChange={handleFileUpload} style={{ marginBottom: '1.5rem' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setShowCsvModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Department Modal */}
      {showAddDeptModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>🏢 Add New Department to System</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0.8rem 0' }}>
              Enter department name (e.g. `B.Tech CSE`, `MBA`, `B.Sc Data Science`):
            </p>
            <input
              type="text"
              placeholder="Department Name"
              value={newDeptInput}
              onChange={(e) => setNewDeptInput(e.target.value)}
              style={{ marginBottom: '1.5rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setShowAddDeptModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateDeptSubmit}>Add Department</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
