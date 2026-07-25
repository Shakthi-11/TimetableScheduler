import React from 'react';
import { Calendar, Download, Upload } from 'lucide-react';

interface HeaderBannerProps {
  onExportState: () => void;
  onImportState: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SRM_LOGO_URL = "https://www.srmistvdp.edu.in/uploads/51ba570fe68fc088e0a942bdf8700cdce7eb8b1d/1766992169SRMIST-Vadapalani.webp";

export const HeaderBanner: React.FC<HeaderBannerProps> = ({ onExportState, onImportState }) => {
  return (
    <div className="srm-banner-3d">
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div className="logo-3d-card">
          <img src={SRM_LOGO_URL} alt="SRM Logo" width="140px" style={{ display: 'block' }} />
        </div>
        <div>
          <h1 className="srm-title-3d">
            <Calendar style={{ display: 'inline', marginRight: '10px', verticalAlign: 'middle' }} />
            University-Wide ERP Timetable Scheduler
          </h1>
          <p className="srm-subtitle-3d">
            SRM Institute of Science and Technology • <span className="vdp-badge-3d">VADAPALANI</span> Campus
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn-secondary" onClick={onExportState} title="Backup session state to JSON file">
          <Download size={16} /> Backup JSON
        </button>
        <label className="btn-secondary" style={{ cursor: 'pointer' }} title="Restore session state from JSON file">
          <Upload size={16} /> Restore JSON
          <input type="file" accept=".json" onChange={onImportState} style={{ display: 'none' }} />
        </label>
      </div>
    </div>
  );
};
