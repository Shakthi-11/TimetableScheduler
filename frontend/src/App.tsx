import React, { useState, useEffect, useRef } from 'react';
import { HeaderBanner } from './components/HeaderBanner';
import { TabBar } from './components/TabBar';
import { Tab1StaffRegistry } from './components/Tab1StaffRegistry';
import { Tab2DepartmentCurriculum } from './components/Tab2DepartmentCurriculum';
import { Tab3CombinedClasses } from './components/Tab3CombinedClasses';
import { Tab4ResultsMatrix } from './components/Tab4ResultsMatrix';
import { FacultyMember, SubjectData, CombinedClass, OperatingRules, ScheduleResult } from './types';
import { generateAdvancedCombinations, ScheduleCombination } from './utils/schedulerEngine';

const API_BASE = 'https://srmtimetablescheduler-psi.vercel.app/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Core State
  const [facultyData, setFacultyData] = useState<FacultyMember[]>([
    { Faculty_ID: "MR", Name: "Prof. MR", Primary_Dept: "B.Sc CS", Qualified: "Python, Python Lab, AI", Max_Daily: 4, Max_Cons: 2 },
    { Faculty_ID: "VR", Name: "Prof. VR", Primary_Dept: "B.Sc CS", Qualified: "ML, ML Lab, Data Mining", Max_Daily: 4, Max_Cons: 2 },
    { Faculty_ID: "JP", Name: "Dr. JP", Primary_Dept: "BCA", Qualified: "Project-C, Ethics, Signals & Systems", Max_Daily: 4, Max_Cons: 2 },
    { Faculty_ID: "JPS", Name: "Prof. JPS", Primary_Dept: "BCA", Qualified: "Signals & Systems, Systems, Project-OOPS", Max_Daily: 4, Max_Cons: 2 },
  ]);

  const [deptsCurriculum, setDeptsCurriculum] = useState<Record<string, SubjectData[]>>({
    "B.Sc CS": [
      { Subject: "Python", Faculty: "MR", Hours: 4, Type: "Theory", Category: "Core Theory" },
      { Subject: "Python Lab", Faculty: "MR", Hours: 3, Type: "Lab", Category: "Lab" },
      { Subject: "ML", Faculty: "VR", Hours: 3, Type: "Theory", Category: "Core Theory" },
      { Subject: "ML Lab", Faculty: "VR", Hours: 3, Type: "Lab", Category: "Lab" },
    ],
    "BCA": [
      { Subject: "Signals & Systems", Faculty: "JPS", Hours: 3, Type: "Theory", Category: "Core Theory" },
      { Subject: "ML", Faculty: "VR", Hours: 3, Type: "Theory", Category: "Core Theory" },
      { Subject: "Project-C", Faculty: "JP", Hours: 2, Type: "Theory", Category: "Core Theory" },
    ]
  });

  const [combinedClasses, setCombinedClasses] = useState<CombinedClass[]>([
    {
      Subject: "Ethics in Tech",
      Faculty: "JP",
      ParticipatingDepts: ["B.Sc CS", "BCA"],
      Hours: 2,
      Type: "Theory"
    }
  ]);

  const [operatingRules, setOperatingRules] = useState<OperatingRules>({
    working_days: 5,
    hours_per_day: 6,
    break_option: "None",
    semester: 4
  });

  const [selectedDept, setSelectedDept] = useState<string>("B.Sc CS");
  const [scheduleResult, setScheduleResult] = useState<ScheduleResult | null>(null);

  // Generated Timetable State
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);
  const [combinations, setCombinations] = useState<ScheduleCombination[]>([]);
  const [activeCombinationId, setActiveCombinationId] = useState<number>(1);

  const isInitialMount = useRef(true);

  const availableDepartments = Object.keys(deptsCurriculum);

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
        if (parsed.operatingRules) {
          setOperatingRules({ ...parsed.operatingRules, break_option: "None" });
        }
      } catch (e) {
        console.error("Failed to parse saved config", e);
      }
    }
  }, []);

  // Local Storage Auto-Save on Change
  useEffect(() => {
    const payload = { facultyData, deptsCurriculum, combinedClasses, operatingRules: { ...operatingRules, break_option: "None" } };
    localStorage.setItem("srm_timetable_config", JSON.stringify(payload));
  }, [facultyData, deptsCurriculum, combinedClasses, operatingRules]);

  // Reset/Invalidate generated schedule whenever ANY input is modified
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setHasGenerated(false);
    setCombinations([]);
    setScheduleResult(null);
  }, [facultyData, deptsCurriculum, combinedClasses, operatingRules]);

  // Explicit Generate Timetable Action
  const handleGenerateSchedule = async () => {
    setIsLoading(true);
    try {
      const computedCombs = generateAdvancedCombinations(facultyData, deptsCurriculum, combinedClasses, operatingRules);
      setCombinations(computedCombs);
      setActiveCombinationId(1);
      setHasGenerated(true);

      const payload = {
        faculty_registry_data: facultyData,
        depts_curriculum: deptsCurriculum,
        combined_classes_data: combinedClasses,
        operating_rules: { ...operatingRules, break_option: "None" },
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
            errMessage = "Backend server is offline. Generated timetables using local client engine.";
          }
        }
        console.warn(errMessage);
      } else {
        const data = JSON.parse(responseText);
        setScheduleResult(data);
      }

      setActiveTab(3);
    } catch (e: any) {
      console.warn("API generate exception, client engine active", e);
      setActiveTab(3);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const payload = {
        faculty_registry_data: facultyData,
        depts_curriculum: deptsCurriculum,
        combined_classes_data: combinedClasses,
        operating_rules: { ...operatingRules, break_option: "None" },
      };

      const res = await fetch(`${API_BASE}/export/excel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Make sure backend API server is running.");
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

  const handleExportPdf = async () => {
    try {
      const payload = {
        faculty_registry_data: facultyData,
        depts_curriculum: deptsCurriculum,
        combined_classes_data: combinedClasses,
        operating_rules: { ...operatingRules, break_option: "None" },
      };

      const res = await fetch(`${API_BASE}/export/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Make sure backend API server is running.");
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
      <HeaderBanner />
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
          facultyData={facultyData}
          deptsCurriculum={deptsCurriculum}
          combinedClasses={combinedClasses}
          hasGenerated={hasGenerated}
          combinations={combinations}
          activeCombinationId={activeCombinationId}
          setActiveCombinationId={setActiveCombinationId}
        />
      )}
    </div>
  );
};

