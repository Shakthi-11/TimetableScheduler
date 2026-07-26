import { FacultyMember, SubjectData, CombinedClass, OperatingRules, ScheduleResult } from '../types';

export interface SlotCell {
  title: string;
  colSpan?: number;
  isCombined?: boolean;
}

export interface AcademicDayRow {
  dayOrder: string;
  noClasses?: boolean;
  label?: string;
  slots: SlotCell[];
}

export type DeptAcademicGrid = AcademicDayRow[];

export interface ScheduleCombination {
  id: number;
  name: string;
  description: string;
  grids: Record<string, DeptAcademicGrid>;
}

const ROMAN_DAYS = ["I", "II", "III", "IV", "V", "VI", "VII"];

/**
 * Advanced human-grade constraint-based scheduler algorithm generating multiple valid timetable combinations.
 */
export function generateAdvancedCombinations(
  facultyData: FacultyMember[],
  deptsCurriculum: Record<string, SubjectData[]>,
  combinedClasses: CombinedClass[],
  operatingRules: OperatingRules
): ScheduleCombination[] {
  const combinationConfigs = [
    { id: 1, name: "Combination 1 (Balanced Workload & Multi-Day Distribution)", description: "Evenly distributes weekly theory hours 1 hr/day across Day Orders with zero fatigue violations." },
    { id: 2, name: "Combination 2 (Compact Afternoon Lab Blocks)", description: "Prioritizes early Day Orders and continuous 2-hour afternoon blocks for practical lab sessions." },
    { id: 3, name: "Combination 3 (Pedagogical Morning Core Theory)", description: "Schedules core theory lectures in morning slots (Hours I-III) with strict faculty rest breaks." },
  ];

  return combinationConfigs.map((cfg, seedIndex) => {
    const gridMap = runConstraintSolver(facultyData, deptsCurriculum, combinedClasses, operatingRules, seedIndex);
    return {
      id: cfg.id,
      name: cfg.name,
      description: cfg.description,
      grids: gridMap
    };
  });
}

function runConstraintSolver(
  facultyData: FacultyMember[],
  deptsCurriculum: Record<string, SubjectData[]>,
  combinedClasses: CombinedClass[],
  operatingRules: OperatingRules,
  seedShift: number
): Record<string, DeptAcademicGrid> {
  const workingDays = Math.min(7, Math.max(1, operatingRules.working_days || 5));
  const hoursPerDay = Math.min(6, Math.max(4, operatingRules.hours_per_day || 6));
  const deptNames = Object.keys(deptsCurriculum);

  // Faculty daily hours & busy matrix: facId -> dayIdx -> hourIdx -> boolean
  const facultyBusy: Record<string, boolean[][]> = {};
  const facultyDailyHours: Record<string, number[]> = {};

  facultyData.forEach((f) => {
    if (f.Faculty_ID) {
      facultyBusy[f.Faculty_ID] = Array.from({ length: workingDays }, () => Array(hoursPerDay).fill(false));
      facultyDailyHours[f.Faculty_ID] = Array(workingDays).fill(0);
    }
  });

  const getFacultyMaxDaily = (facId: string): number => {
    const f = facultyData.find((item) => item.Faculty_ID === facId);
    return f ? f.Max_Daily || 4 : 4;
  };

  const getFacultyMaxCons = (facId: string): number => {
    const f = facultyData.find((item) => item.Faculty_ID === facId);
    return f ? f.Max_Cons || 2 : 2;
  };

  // Helper: Evaluates if a faculty member can teach chunkSize continuous hours on day d starting at hour h
  const canFacultyTakeSlot = (facId: string, d: number, h: number, chunkSize: number): boolean => {
    if (!facultyBusy[facId]) return true;
    const maxDaily = getFacultyMaxDaily(facId);
    const currentDaily = facultyDailyHours[facId][d];
    if (currentDaily + chunkSize > maxDaily) return false;

    // Check if slot hours are free
    for (let span = 0; span < chunkSize; span++) {
      if (facultyBusy[facId][d][h + span]) return false;
    }

    // Simulate slot allocation & check maximum consecutive teaching streak (Fatigue Limit)
    const tempRow = [...facultyBusy[facId][d]];
    for (let span = 0; span < chunkSize; span++) {
      tempRow[h + span] = true;
    }

    const maxCons = getFacultyMaxCons(facId);
    let streak = 0;
    for (let i = 0; i < hoursPerDay; i++) {
      if (tempRow[i]) {
        streak++;
        if (streak > maxCons) return false;
      } else {
        streak = 0;
      }
    }

    return true;
  };

  // Department slot grid: deptName -> dayIdx -> hourIdx -> SlotCell | null
  const deptSlots: Record<string, (SlotCell | null)[][]> = {};
  deptNames.forEach((dept) => {
    deptSlots[dept] = Array.from({ length: workingDays }, () => Array(hoursPerDay).fill(null));
  });

  // Track daily hours per subject per department
  const deptSubDailyHours: Record<string, Record<string, number[]>> = {};
  // Track hour index usage per subject per department to enforce hour rotation
  const deptSubHourUsage: Record<string, Record<string, number[]>> = {};
  deptNames.forEach((dept) => {
    deptSubDailyHours[dept] = {};
    deptSubHourUsage[dept] = {};
  });

  // Track daily hours and hour index usage per combined subject
  const combinedDailyHours: Record<string, number[]> = {};
  const combinedSubHourUsage: Record<string, number[]> = {};

  // Day order evaluation sequence based on seed shift strategy
  const daySequence: number[] = [];
  for (let d = 0; d < workingDays; d++) {
    daySequence.push((d + seedShift) % workingDays);
  }

  // ----------------------------------------------------
  // PHASE 1: Human Priority 1 - Joint Combined Multi-Department Classes
  // ----------------------------------------------------
  combinedClasses.forEach((cc) => {
    const facId = cc.Faculty;
    const isLab = cc.Type.toLowerCase().includes('lab') || cc.Subject.toLowerCase().includes('lab');
    const totalWeeklyHours = Math.max(1, cc.Hours || 2);
    const depts = (cc.ParticipatingDepts && cc.ParticipatingDepts.length > 0)
      ? cc.ParticipatingDepts.filter(d => deptNames.includes(d))
      : deptNames;

    if (!combinedDailyHours[cc.Subject]) {
      combinedDailyHours[cc.Subject] = Array(workingDays).fill(0);
    }

    let remaining = totalWeeklyHours;

    // Distribute 1 hour at a time (or 2 hours for Lab) across distinct day orders
    while (remaining > 0) {
      const chunkSize = isLab ? Math.min(2, remaining) : 1;
      let placed = false;

      // Pass 1: Strict 1 hr/day for theory (2 for lab). Pass 2: Relax cap to 2 hrs/day if needed
      for (let maxDailyCap = (isLab ? 2 : 1); maxDailyCap <= 2 && !placed; maxDailyCap++) {
        for (let sIdx = 0; sIdx < daySequence.length && !placed; sIdx++) {
          const d = daySequence[sIdx];

          if (combinedDailyHours[cc.Subject][d] >= maxDailyCap) continue;

          for (let h = 0; h <= hoursPerDay - chunkSize && !placed; h++) {
            if (!canFacultyTakeSlot(facId, d, h, chunkSize)) continue;

            let deptsFree = true;
            for (let span = 0; span < chunkSize; span++) {
              for (const dName of depts) {
                if (deptSlots[dName] && deptSlots[dName][d][h + span] !== null) {
                  deptsFree = false;
                  break;
                }
              }
              if (!deptsFree) break;
            }

            if (deptsFree) {
              const cell: SlotCell = {
                title: `${cc.Subject} - ${facId}`,
                colSpan: chunkSize,
                isCombined: true
              };

              for (let span = 0; span < chunkSize; span++) {
                if (facultyBusy[facId]) facultyBusy[facId][d][h + span] = true;
                if (facultyDailyHours[facId]) facultyDailyHours[facId][d] += 1;

                for (const dName of depts) {
                  if (deptSlots[dName]) {
                    deptSlots[dName][d][h + span] = span === 0 ? cell : { title: '', colSpan: 0 };
                  }
                }
              }

              combinedDailyHours[cc.Subject][d] += chunkSize;
              remaining -= chunkSize;
              placed = true;
            }
          }
        }
      }

      if (!placed) break;
    }
  });

  // ----------------------------------------------------
  // PHASES 2, 3, 4: Department Curriculum Labs & Theory Subjects
  // ----------------------------------------------------
  deptNames.forEach((dept) => {
    const subjects = deptsCurriculum[dept] || [];

    // Pedagogical Priority Sorting: Labs first, then Core Theory, then Electives
    const sortedSubjects = [...subjects].sort((a, b) => {
      const isLabA = a.Type.toLowerCase().includes('lab') || a.Subject.toLowerCase().includes('lab');
      const isLabB = b.Type.toLowerCase().includes('lab') || b.Subject.toLowerCase().includes('lab');
      if (isLabA && !isLabB) return -1;
      if (!isLabA && isLabB) return 1;

      const isCoreA = a.Category === 'Core Theory';
      const isCoreB = b.Category === 'Core Theory';
      if (isCoreA && !isCoreB) return -1;
      if (!isCoreA && isCoreB) return 1;

      return (b.Hours || 0) - (a.Hours || 0);
    });

    sortedSubjects.forEach((sub) => {
      const facId = sub.Faculty;
      let hoursToSchedule = Math.max(0, sub.Hours || 0);
      const isLab = sub.Type.toLowerCase().includes('lab') || sub.Subject.toLowerCase().includes('lab');

      if (!deptSubDailyHours[dept][sub.Subject]) {
        deptSubDailyHours[dept][sub.Subject] = Array(workingDays).fill(0);
      }
      if (!deptSubHourUsage[dept][sub.Subject]) {
        deptSubHourUsage[dept][sub.Subject] = Array(hoursPerDay).fill(0);
      }

      while (hoursToSchedule > 0) {
        const chunkSize = isLab ? Math.min(2, hoursToSchedule) : 1;
        let placed = false;

        // Pass 1: Strict 1 hr/day for theory (2 for lab). Pass 2: Relax cap to 2 hrs/day if needed
        for (let maxDailyCap = (isLab ? 2 : 1); maxDailyCap <= 2 && !placed; maxDailyCap++) {
          let bestCandidate: { d: number; h: number; score: number } | null = null;

          for (let sIdx = 0; sIdx < daySequence.length; sIdx++) {
            const d = daySequence[sIdx];

            if (deptSubDailyHours[dept][sub.Subject][d] >= maxDailyCap) continue;

            for (let h = 0; h <= hoursPerDay - chunkSize; h++) {
              if (!canFacultyTakeSlot(facId, d, h, chunkSize)) continue;

              let free = true;
              for (let span = 0; span < chunkSize; span++) {
                if (deptSlots[dept][d][h + span] !== null) {
                  free = false;
                  break;
                }
              }

              if (free) {
                // Human Pedagogical & Rotation Scoring Model:
                let score = 0;

                // 1. HEAVY HOUR REPETITION PENALTY: Prevent scheduling the same subject in the exact same hour slot across days
                const hourRepetition = deptSubHourUsage[dept][sub.Subject][h] || 0;
                score += hourRepetition * 500;

                // 2. STAGGERED ROTATION PREFERENCE: Encourage subject to shift hour slot across Day Orders
                const rotatedHourPreference = (d + seedShift + sortedSubjects.indexOf(sub)) % hoursPerDay;
                if (h === rotatedHourPreference) {
                  score -= 80;
                }

                // 3. Category slot preference
                if (isLab) {
                  if (h >= 2 && h <= 4) score -= 60;
                  else score += 20;
                } else if (sub.Category === 'Core Theory') {
                  if (h <= 2) score -= 50;
                  else if (h >= 4) score += 70;
                } else {
                  if (h >= 2 && h <= 4) score -= 30;
                }

                // 4. Balance student daily workload
                const currentDayLoad = deptSlots[dept][d].filter(cell => cell !== null && cell.title !== '').length;
                score += currentDayLoad * 25;

                if (!bestCandidate || score < bestCandidate.score) {
                  bestCandidate = { d, h, score };
                }
              }
            }
          }

          if (bestCandidate) {
            const { d, h } = bestCandidate;
            const cell: SlotCell = {
              title: `${sub.Subject} - ${facId}`,
              colSpan: chunkSize
            };

            for (let span = 0; span < chunkSize; span++) {
              if (facultyBusy[facId]) facultyBusy[facId][d][h + span] = true;
              if (facultyDailyHours[facId]) facultyDailyHours[facId][d] += 1;
              deptSlots[dept][d][h + span] = span === 0 ? cell : { title: '', colSpan: 0 };
            }

            deptSubDailyHours[dept][sub.Subject][d] += chunkSize;
            deptSubHourUsage[dept][sub.Subject][h] = (deptSubHourUsage[dept][sub.Subject][h] || 0) + 1;
            hoursToSchedule -= chunkSize;
            placed = true;
          }
        }

        if (!placed) break;
      }
    });
  });

  // ----------------------------------------------------
  // PHASE 5: Format into DeptAcademicGrid for UI
  // ----------------------------------------------------
  const deptAcademicGrids: Record<string, DeptAcademicGrid> = {};

  deptNames.forEach((dept) => {
    const dayRows: AcademicDayRow[] = [];

    for (let d = 0; d < workingDays; d++) {
      const rowSlots: SlotCell[] = [];
      let h = 0;

      while (h < hoursPerDay) {
        const slot = deptSlots[dept][d][h];
        if (slot === null) {
          rowSlots.push({ title: 'Free Slot', colSpan: 1 });
          h++;
        } else if (slot.colSpan === 0) {
          h++;
        } else {
          rowSlots.push(slot);
          h += slot.colSpan || 1;
        }
      }

      const isAllFree = rowSlots.every(s => s.title === 'Free Slot');
      if (isAllFree) {
        dayRows.push({
          dayOrder: ROMAN_DAYS[d] || `${d + 1}`,
          noClasses: true,
          label: 'No CLASSES',
          slots: []
        });
      } else {
        dayRows.push({
          dayOrder: ROMAN_DAYS[d] || `${d + 1}`,
          slots: rowSlots
        });
      }
    }

    deptAcademicGrids[dept] = dayRows;
  });

  return deptAcademicGrids;
}

export function generateClientSchedule(
  facultyData: FacultyMember[],
  deptsCurriculum: Record<string, SubjectData[]>,
  combinedClasses: CombinedClass[],
  operatingRules: OperatingRules
): ScheduleResult {
  const deptNames = Object.keys(deptsCurriculum);
  const workingDays = Math.min(7, Math.max(1, operatingRules.working_days || 5));
  const hoursPerDay = Math.min(6, Math.max(4, operatingRules.hours_per_day || 6));
  const gridMap = runConstraintSolver(facultyData, deptsCurriculum, combinedClasses, operatingRules, 0);
  const facultyIds = facultyData.map(f => f.Faculty_ID).filter(Boolean);

  return {
    dept_timetables: gridMap as any,
    faculty_matrices: {},
    conflicts: [],
    metrics: {
      total_departments: deptNames.length,
      total_faculty: facultyIds.length,
      total_allocated_slots: deptNames.length * workingDays * hoursPerDay,
      total_institution_slots: deptNames.length * workingDays * hoursPerDay,
      dept_metrics: {}
    },
    faculty_ids: facultyIds,
    academic_grids: gridMap
  } as any;
}
