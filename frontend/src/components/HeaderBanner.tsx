import React from 'react';

const SRM_LOGO_URL = "https://www.srmistvdp.edu.in/uploads/51ba570fe68fc088e0a942bdf8700cdce7eb8b1d/1766992169SRMIST-Vadapalani.webp";

export const HeaderBanner: React.FC = () => {
  return (
    <div className="srm-banner-3d">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
        <div className="logo-3d-card">
          <img src={SRM_LOGO_URL} alt="SRM University Logo" width="110px" style={{ display: 'block' }} />
        </div>
        <div>
          <h1 className="srm-title-3d">
            University-Wide ERP Timetable Scheduler
          </h1>
          <p className="srm-subtitle-3d">
            SRM Institute of Science and Technology • <span className="vdp-badge-3d">VADAPALANI Campus</span>
          </p>
        </div>
      </div>
    </div>
  );
};
