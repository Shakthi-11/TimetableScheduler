import React from 'react';
import { Users, Building, Link2, Calendar } from 'lucide-react';

interface TabBarProps {
  activeTab: number;
  setActiveTab: (tab: number) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="nav-tabs">
      <button className={`tab-btn ${activeTab === 0 ? 'active' : ''}`} onClick={() => setActiveTab(0)}>
        <Users size={16} /> Staff Registry
      </button>
      <button className={`tab-btn ${activeTab === 1 ? 'active' : ''}`} onClick={() => setActiveTab(1)}>
        <Building size={16} /> Multi-Department Curriculums
      </button>
      <button className={`tab-btn ${activeTab === 2 ? 'active' : ''}`} onClick={() => setActiveTab(2)}>
        <Link2 size={16} /> Combined Classes Config
      </button>
      <button className={`tab-btn ${activeTab === 3 ? 'active' : ''}`} onClick={() => setActiveTab(3)}>
        <Calendar size={16} /> Timetable & State Matrix
      </button>
    </div>
  );
};
