import React, { useState, useEffect } from 'react';
import { HeaderBanner } from './components/HeaderBanner';
import { TabBar } from './components/TabBar';
import { Tab1StaffRegistry } from './components/Tab1StaffRegistry';
import { Tab2DepartmentCurriculum } from './components/Tab2DepartmentCurriculum';
import { Tab3CombinedClasses } from './components/Tab3CombinedClasses';
import { Tab4ResultsMatrix } from './components/Tab4ResultsMatrix';
import { FacultyMember, SubjectData, CombinedClass, OperatingRules, ScheduleResult } from './types';

const API_BASE = 'http://localhost:8000/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Core State
  const [facultyData, setFacultyData] = useState<FacultyMember[]>([
    { Faculty_ID: "MR", Name: "Prof. MR", Primary_Dept: "B.sc CS", Qualified: "Python, Python Lab, AI", Max_Daily: 4, Max_Cons: 2 },
    { Faculty_ID: "VR", Name: "Prof. VR", Primary_Dept: "B.sc CS", Qualified: "ML, ML Lab, Data Mining", Max_Daily: 4, Max_Cons: 2 },
    { Faculty_ID: "JP", Name: "Dr. JP", Primary_Dept: "BCA", Qualified: "Project-c, Ethics, Signals & Systems", Max_Daily: 4, Max_Cons: 2 },
    { Faculty_ID: "JPS", Name: "Prof. JPS", Primary_Dept: "BCA", Qualified: "Signals & Systems, Signals, Systems, Project-OOPS", Max_Daily: 4, Max_Cons: 2 },
  ]);

  const [deptsCurriculum, setDeptsCurriculum] = useState<Record<string, SubjectData[]>>({
    "B.sc CS": [
      { Subject: "Python", Faculty: "MR", Hours: 4, Type: "Theory", Category: "Core Theory" },
      { Subject: "Python Lab", Faculty: "MR", Hours: 3, Type: "Lab", Category: "Lab" },
      { Subject: "ML", Faculty: "VR", Hours: 3, Type: "Theory", Category: "Core Theory" },
      { Subject: "ML Lab", Faculty: "VR", Hours: 3, Type: "Lab", Category: "Lab" },
    ],
    "BCA": [
      { Subject: "Signals & Systems", Faculty: "JPS", Hours: 3, Type: "Theory", Category: "Core Theory" },
      { Subject: "ML", Faculty: "VR", Hours: 3, Type: "Theory", Category: "Core Theory" },
      { Subject: "Project-c", Faculty: "JP", Hours: 2, Type: "Theory", Category: "Core Theory" },
    ]
  });

  const [combinedClasses, setCombinedClasses] = useState<CombinedClass[]>([
    {
      Subject: "Ethics in Tech",
      Faculty: "JP",
      ParticipatingDepts: ["B.sc CS", "BCA"],
      Hours: 2,
      Type: "Theory"
    }
  ]);

  const [operatingRules, setOperatingRules] = useState<OperatingRules>({
    working_days: 4,
    hours_per_day: 6,
    break_option: "None",
    semester: 4
  });

  const [selectedDept, setSelectedDept] = useState<string>("B.sc CS");
  const [scheduleResult, setScheduleResult] = useState<ScheduleResult | null>(null);

  // Available departments derived from deptsCurriculum keys
  const availableDepartments = Object.keys(deptsCurriculum);

  // Function to handle adding a new department from Tab 1 or Tab 2
  const handleAddNewDepartment = (deptName: string) => {
    const trimmed = deptName.trim();
    if (trimmed && !deptsCurriculum[trimmed]) {
      setDeptsCurriculum({
        ...deptsCurriculum,
        [trimmed]: [],
      });
      setSelectedDept(trimmed);
    }
  };

  // Local Storage Auto-Restore on Mount
  useEffect(() => {
    const saved = localStorage.getItem("srm_timetable_config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.facultyData) setFacultyData(parsed.facultyData);
        if (parsed.deptsCurriculum) setDeptsCurriculum(parsed.deptsCurriculum);
        if (parsed.combinedClasses) setCombinedClasses(parsed.combinedClasses);
        if (parsed.operatingRules) setOperatingRules(parsed.operatingRules);
      } catch (e) {
        console.error("Failed to parse saved config", e);
      }
    }
  }, []);

  // Local Storage Auto-Save on Change
  useEffect(() => {
    const payload = { facultyData, deptsCurriculum, combinedClasses, operatingRules };
    localStorage.setItem("srm_timetable_config", JSON.stringify(payload));
  }, [facultyData, deptsCurriculum, combinedClasses, operatingRules]);

  // Export session state to JSON
  const handleExportState = () => {
    const payload = { facultyData, deptsCurriculum, combinedClasses, operatingRules };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `SRMIST_Timetable_Config_Sem${operatingRules.semester}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import session state from JSON
  const handleImportState = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.facultyData) setFacultyData(parsed.facultyData);
        if (parsed.deptsCurriculum) setDeptsCurriculum(parsed.deptsCurriculum);
        if (parsed.combinedClasses) setCombinedClasses(parsed.combinedClasses);
        if (parsed.operatingRules) setOperatingRules(parsed.operatingRules);
        alert("Configuration state restored successfully!");
      } catch (err) {
        alert("Failed to load JSON config file. Invalid format.");
      }
    };
    reader.readAsText(file);
  };

  // Robust Generate Timetable API call
  const handleGenerateSchedule = async () => {
    setIsLoading(true);
    try {
      const payload = {
        faculty_registry_data: facultyData,
        depts_curriculum: deptsCurriculum,
        combined_classes_data: combinedClasses,
        operating_rules: operatingRules,
      };

      const res = await fetch(`${API_BASE}/schedule/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseText = await res.text();

      if (!res.ok) {
        let errMessage = `Server error (${res.status})`;
        try {
          const errJson = JSON.parse(responseText);
          errMessage = errJson.detail || errMessage;
        } catch {
          if (res.status === 502 || res.status === 504 || responseText.includes('Proxy error')) {
            errMessage = "Backend server (http://localhost:8000) is NOT running.\n\nPlease start the backend API server in your terminal:\n  python -m uvicorn backend.main:app --reload --port 8000";
          }
        }
        throw new Error(errMessage);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonErr) {
        throw new Error(
          "Backend API server returned invalid response.\n\nPlease ensure the Python FastAPI backend is running:\n  python -m uvicorn backend.main:app --reload --port 8000"
        );
      }

      setScheduleResult(data);
      setActiveTab(3); // Switch to results tab
    } catch (e: any) {
      alert(`⚠️ Connection Error:\n\n${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Export Excel
  const handleExportExcel = async () => {
    try {
      const payload = {
        faculty_registry_data: facultyData,
        depts_curriculum: deptsCurriculum,
        combined_classes_data: combinedClasses,
        operating_rules: operatingRules,
      };

      const res = await fetch(`${API_BASE}/export/excel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Make sure backend API server is running on port 8000.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SRMIST_VDP_Timetable_Sem${operatingRules.semester}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      alert(`Failed to download Excel file: ${e.message}`);
    }
  };

  // Export PDF
  const handleExportPdf = async () => {
    try {
      const payload = {
        faculty_registry_data: facultyData,
        depts_curriculum: deptsCurriculum,
        combined_classes_data: combinedClasses,
        operating_rules: operatingRules,
      };

      const res = await fetch(`${API_BASE}/export/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Make sure backend API server is running on port 8000.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SRMIST_VDP_Timetable_Sem${operatingRules.semester}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      alert(`Failed to generate PDF report: ${e.message}`);
    }
  };

  return (
    <div>
      <HeaderBanner onExportState={handleExportState} onImportState={handleImportState} />
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 0 && (
        <Tab1StaffRegistry
          facultyData={facultyData}
          setFacultyData={setFacultyData}
          availableDepartments={availableDepartments}
          onAddNewDepartment={handleAddNewDepartment}
        />
      )}

      {activeTab === 1 && (
        <Tab2DepartmentCurriculum
          operatingRules={operatingRules}
          setOperatingRules={setOperatingRules}
          deptsCurriculum={deptsCurriculum}
          setDeptsCurriculum={setDeptsCurriculum}
          facultyData={facultyData}
          selectedDept={selectedDept}
          setSelectedDept={setSelectedDept}
        />
      )}

      {activeTab === 2 && (
        <Tab3CombinedClasses
          combinedClasses={combinedClasses}
          setCombinedClasses={setCombinedClasses}
          facultyData={facultyData}
          availableDepartments={availableDepartments}
          deptsCurriculum={deptsCurriculum}
        />
      )}

      {activeTab === 3 && (
        <Tab4ResultsMatrix
          onGenerate={handleGenerateSchedule}
          isLoading={isLoading}
          scheduleResult={scheduleResult}
          operatingRules={operatingRules}
          onExportExcel={handleExportExcel}
          onExportPdf={handleExportPdf}
        />
      )}
    </div>
  );
};
