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

  const generateClientPdfReport = () => {
    const currentComb = combinations.find(c => c.id === activeCombinationId) || combinations[0];
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to generate the PDF report.");
      return;
    }

    const deptNames = availableDepartments;
    const hours = ["I Hour", "II Hour", "III Hour", "IV Hour", "V Hour", "VI Hour"];

    let pagesHtml = "";

    // 1. Department Timetables (Each on a Separate Page)
    if (currentComb && currentComb.grids) {
      for (const dept of deptNames) {
        const grid = currentComb.grids[dept] || [];
        let rowsHtml = "";
        grid.forEach(row => {
          let cellsHtml = `<td style="font-weight: bold; background-color: #f8fafc;">${row.dayOrder}</td>`;
          row.slots.forEach(slot => {
            cellsHtml += `<td ${slot.colSpan ? `colspan="${slot.colSpan}"` : ''} class="${slot.isCombined ? 'combined' : ''}">${slot.title || '-'}</td>`;
          });
          rowsHtml += `<tr>${cellsHtml}</tr>`;
        });

        pagesHtml += `
          <div class="print-page">
            <div class="header">
              <h1>SRM Institute of Science and Technology - Vadapalani Campus</h1>
              <p>Official Department Timetable | Semester ${operatingRules.semester}</p>
            </div>
            <div class="section-title">
              <h2>Department: ${dept}</h2>
              <span class="badge">${currentComb.name}</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Day Order</th>
                  ${hours.map(h => `<th>${h}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        `;
      }
    }

    // 2. Faculty Timetables (Each on a Separate Page)
    facultyData.forEach(fac => {
      const facId = fac.Faculty_ID.trim();
      if (!facId) return;

      const firstDept = deptNames[0];
      const deptGrid = currentComb?.grids[firstDept] || [];

      let facRowsHtml = "";
      deptGrid.forEach((deptRow, dayIdx) => {
        let cellsHtml = `<td style="font-weight: bold; background-color: #f8fafc;">${deptRow.dayOrder}</td>`;
        hours.forEach((_, hourIdx) => {
          const matched: string[] = [];
          deptNames.forEach(dept => {
            const row = currentComb?.grids[dept]?.[dayIdx];
            if (!row) return;
            let currentH = 0;
            for (const slot of row.slots) {
              const span = slot.colSpan || 1;
              if (hourIdx >= currentH && hourIdx < currentH + span) {
                if (slot.title && slot.title !== "-") {
                  const parts = slot.title.split("-").map(s => s.trim());
                  const slotFacId = parts[parts.length - 1];
                  if (slotFacId === facId) {
                    const subjectName = parts.slice(0, parts.length - 1).join("-").trim();
                    matched.push(`${subjectName} (${dept})`);
                  }
                }
                break;
              }
              currentH += span;
            }
          });
          const displayVal = matched.length > 0 ? Array.from(new Set(matched)).join(" / ") : "-";
          cellsHtml += `<td class="${matched.length > 0 ? 'occupied' : ''}">${displayVal}</td>`;
        });
        facRowsHtml += `<tr>${cellsHtml}</tr>`;
      });

      pagesHtml += `
        <div class="print-page">
          <div class="header">
            <h1>SRM Institute of Science and Technology - Vadapalani Campus</h1>
            <p>Master Faculty Teaching Schedule | Semester ${operatingRules.semester}</p>
          </div>
          <div class="section-title">
            <h2>Faculty: ${fac.Name} (${fac.Faculty_ID})</h2>
            <span class="badge">Primary Dept: ${fac.Primary_Dept || 'N/A'}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Day Order</th>
                ${hours.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${facRowsHtml}
            </tbody>
          </table>
        </div>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>SRMIST Vadapalani Timetable Report - Semester ${operatingRules.semester}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 12mm;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            color: #1e293b;
            background: #ffffff;
          }
          .print-page {
            page-break-after: always;
            break-after: page;
            box-sizing: border-box;
            padding: 10px;
          }
          .print-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 8px;
            margin-bottom: 16px;
          }
          .header h1 {
            margin: 0;
            font-size: 20px;
            color: #0f172a;
            font-weight: 700;
          }
          .header p {
            margin: 4px 0 0 0;
            font-size: 13px;
            color: #64748b;
          }
          .section-title {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }
          .section-title h2 {
            font-size: 16px;
            margin: 0;
            color: #0369a1;
          }
          .badge {
            font-size: 12px;
            background-color: #e0f2fe;
            color: #0369a1;
            padding: 4px 10px;
            border-radius: 9999px;
            font-weight: 600;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 10px 8px;
            text-align: center;
            font-size: 12px;
          }
          th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: 700;
          }
          td.combined {
            background-color: #f0fdf4;
            color: #166534;
            font-weight: 600;
          }
          td.occupied {
            background-color: #f0f9ff;
            color: #0369a1;
            font-weight: 600;
          }
          @media print {
            .print-page {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        ${pagesHtml}
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const generateClientExcelReport = () => {
    const currentComb = combinations.find(c => c.id === activeCombinationId) || combinations[0];
    const deptNames = availableDepartments;
    const hours = ["I Hour", "II Hour", "III Hour", "IV Hour", "V Hour", "VI Hour"];

    let csvLines: string[] = [];
    csvLines.push(`SRMIST Vadapalani Timetable Report - Semester ${operatingRules.semester}`);
    csvLines.push(`Optimization Profile: ${currentComb ? currentComb.name : 'Standard'}`);
    csvLines.push("");

    // 1. Department Timetables
    csvLines.push("=== DEPARTMENT TIMETABLES ===");
    csvLines.push("");

    if (currentComb && currentComb.grids) {
      for (const dept of deptNames) {
        csvLines.push(`Department: ${dept}`);
        csvLines.push(`Day Order,${hours.join(",")}`);
        const grid = currentComb.grids[dept] || [];
        grid.forEach(row => {
          const slotTitles: string[] = [];
          row.slots.forEach(slot => {
            const title = `"${(slot.title || '-').replace(/"/g, '""')}"`;
            slotTitles.push(title);
            if (slot.colSpan && slot.colSpan > 1) {
              for (let i = 1; i < slot.colSpan; i++) {
                slotTitles.push(title);
              }
            }
          });
          csvLines.push(`"${row.dayOrder}",${slotTitles.join(",")}`);
        });
        csvLines.push("");
      }
    }

    // 2. Master Faculty Schedules
    csvLines.push("=== MASTER FACULTY TIMETABLES ===");
    csvLines.push("");

    facultyData.forEach(fac => {
      const facId = fac.Faculty_ID.trim();
      if (!facId) return;

      csvLines.push(`Faculty: ${fac.Name} (${fac.Faculty_ID}) | Primary Dept: ${fac.Primary_Dept || 'N/A'}`);
      csvLines.push(`Day Order,${hours.join(",")}`);

      const firstDept = deptNames[0];
      const deptGrid = currentComb?.grids[firstDept] || [];

      deptGrid.forEach((deptRow, dayIdx) => {
        const slotTitles: string[] = [];
        hours.forEach((_, hourIdx) => {
          const matched: string[] = [];
          deptNames.forEach(dept => {
            const row = currentComb?.grids[dept]?.[dayIdx];
            if (!row) return;
            let currentH = 0;
            for (const slot of row.slots) {
              const span = slot.colSpan || 1;
              if (hourIdx >= currentH && hourIdx < currentH + span) {
                if (slot.title && slot.title !== "-") {
                  const parts = slot.title.split("-").map(s => s.trim());
                  const slotFacId = parts[parts.length - 1];
                  if (slotFacId === facId) {
                    const subjectName = parts.slice(0, parts.length - 1).join("-").trim();
                    matched.push(`${subjectName} (${dept})`);
                  }
                }
                break;
              }
              currentH += span;
            }
          });
          const val = matched.length > 0 ? Array.from(new Set(matched)).join(" / ") : "-";
          slotTitles.push(`"${val.replace(/"/g, '""')}"`);
        });
        csvLines.push(`"${deptRow.dayOrder}",${slotTitles.join(",")}`);
      });
      csvLines.push("");
    });

    const csvBlob = new Blob([csvLines.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(csvBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SRMIST_VDP_Timetable_Sem${operatingRules.semester}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        throw new Error("Backend server response not OK");
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
      console.warn("Backend Excel export unavailable, generating client-side export", e);
      generateClientExcelReport();
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
        throw new Error("Backend server response not OK");
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
      console.warn("Backend PDF export unavailable, generating client-side export", e);
      generateClientPdfReport();
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

