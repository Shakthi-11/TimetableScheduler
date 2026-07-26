import React, { useState } from 'react';
import { FacultyMember } from '../types';
import { Plus, Trash2, Upload, Download, Users, GraduationCap, Clock, TrendingUp, Search, Edit2, Building } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');

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
        Primary_Dept: availableDepartments[0] || 'B.Sc CS',
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
    const csvContent = "data:text/csv;charset=utf-8,Faculty_ID,Name,Primary_Dept,Qualified,Max_Daily,Max_Cons\nMR,Prof. MR,B.Sc CS,\"Python, Python Lab, AI\",4,2\nVR,Prof. VR,B.Sc CS,\"ML, ML Lab, Data Mining\",4,2";
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

  const filteredFaculty = facultyData.filter((f) => 
    f.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.Faculty_ID.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.Primary_Dept.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.Qualified.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
        <div>
          <div className="card-header-title">
            <Users size={18} color="#60a5fa" /> Staff Registry & Qualification Engine
          </div>
          <p className="card-subtitle">
            Manage faculty profiles, qualified course mappings, daily contact limits, and continuous teaching break rules.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={handleDownloadTemplate} title="Download CSV template">
            <Download size={14} /> Download Template
          </button>
          <button className="btn-primary" onClick={() => setShowCsvModal(true)} title="Upload faculty CSV">
            <Upload size={14} /> Bulk Import CSV
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="metrics-stat-grid">
        <div className="stat-card-mini">
          <div className="stat-icon-wrapper blue">
            <Users size={18} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Total Faculty</div>
            <div className="stat-value">{facultyData.filter((f: any) => f.status ? f.status === 'active' : true).length} <span className="stat-unit">Active</span></div>
          </div>
        </div>

        <div className="stat-card-mini">
          <div className="stat-icon-wrapper purple">
            <GraduationCap size={18} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Avg Daily Load</div>
            <div className="stat-value">4.2 <span className="stat-unit">Hours</span></div>
          </div>
        </div>

        <div className="stat-card-mini">
          <div className="stat-icon-wrapper green">
            <Clock size={18} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Max Daily Hours</div>
            <div className="stat-value">6 <span className="stat-unit">Hours</span></div>
          </div>
        </div>

        <div className="stat-card-mini">
          <div className="stat-icon-wrapper cyan">
            <TrendingUp size={18} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Utilization</div>
            <div className="stat-value">72% <span className="stat-unit">This Semester</span></div>
          </div>
        </div>
      </div>

      {/* Faculty Directory Section */}
      <div className="section-bar-header">
        <div className="section-bar-title">Faculty Directory</div>
        <div className="search-input-box">
          <Search size={14} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search faculty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container" style={{ flex: 1 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>FACULTY ID</th>
              <th>FACULTY NAME</th>
              <th>DEPARTMENT</th>
              <th>QUALIFIED SUBJECTS</th>
              <th style={{ textAlign: 'center' }}>MAX DAILY HOURS</th>
              <th style={{ textAlign: 'center' }}>MAX CONTINUOUS HOURS</th>
              <th style={{ textAlign: 'center' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredFaculty.map((row, idx) => (
              <tr key={idx}>
                <td style={{ width: '100px', fontWeight: 700, color: '#e2e8f0' }}>
                  <input
                    type="text"
                    value={row.Faculty_ID}
                    onChange={(e) => handleCellChange(idx, 'Faculty_ID', e.target.value)}
                    style={{ fontWeight: 700 }}
                  />
                </td>
                <td style={{ width: '140px' }}>
                  <input
                    type="text"
                    value={row.Name}
                    onChange={(e) => handleCellChange(idx, 'Name', e.target.value)}
                  />
                </td>
                <td style={{ width: '130px' }}>
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
                    style={{ marginBottom: '4px' }}
                  />
                  <div>
                    {row.Qualified.split(',').map((q, qIdx) => (
                      q.trim() ? <span key={qIdx} className="tag-badge-subject">{q.trim()}</span> : null
                    ))}
                  </div>
                </td>
                <td style={{ width: '100px', textAlign: 'center' }}>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={row.Max_Daily}
                    onChange={(e) => handleCellChange(idx, 'Max_Daily', parseInt(e.target.value) || 4)}
                    style={{ textAlign: 'center' }}
                  />
                </td>
                <td style={{ width: '110px', textAlign: 'center' }}>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    value={row.Max_Cons}
                    onChange={(e) => handleCellChange(idx, 'Max_Cons', parseInt(e.target.value) || 2)}
                    style={{ textAlign: 'center' }}
                  />
                </td>
                <td style={{ width: '70px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                    <button className="btn-icon-action edit" title="Edit faculty">
                      <Edit2 size={14} />
                    </button>
                    <button className="btn-icon-action delete" onClick={() => handleDeleteRow(idx)} title="Delete faculty">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '0.9rem', display: 'flex', gap: '10px' }}>
        <button className="btn-primary" onClick={handleAddRow}>
          <Plus size={14} /> Add New Faculty Member
        </button>
        <button className="btn-secondary" onClick={() => setShowAddDeptModal(true)}>
          <Building size={14} /> Add New Department
        </button>
      </div>

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ color: '#ffffff', marginBottom: '0.5rem' }}>📥 Bulk Import Staff Registry (CSV)</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
              Upload a CSV file containing columns: `Faculty_ID, Name, Primary_Dept, Qualified, Max_Daily, Max_Cons`.
            </p>
            <input type="file" accept=".csv" onChange={handleFileUpload} style={{ marginBottom: '1.2rem' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn-secondary" onClick={() => setShowCsvModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Department Modal */}
      {showAddDeptModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ color: '#ffffff', marginBottom: '0.5rem' }}>🏢 Add New Department to System</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Enter department name (e.g. `B.Sc CS`, `BCA`, `B.Tech CSE`):
            </p>
            <input
              type="text"
              placeholder="Department Name"
              value={newDeptInput}
              onChange={(e) => setNewDeptInput(e.target.value)}
              style={{ marginBottom: '1.2rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn-secondary" onClick={() => setShowAddDeptModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateDeptSubmit}>Add Department</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
