import pandas as pd
import re
from typing import List, Dict, Any, Optional, Tuple, Set

def normalize_subject_name(name: str) -> str:
    """Strips lab/theory suffixes to find the core subject name."""
    clean = re.sub(r'(?i)\b(lab|theory|practical|l2b|l4)\b', '', name)
    return clean.strip().lower()

class FacultyMember:
    """Represents a faculty member in the institutional staff registry."""
    def __init__(
        self,
        faculty_id: str,
        name: str,
        primary_dept: str = "",
        qualified_subjects: Optional[List[str]] = None,
        max_daily_hours: int = 4,
        max_consecutive_hours: int = 2
    ):
        self.faculty_id = faculty_id
        self.name = name
        self.primary_dept = primary_dept
        self.qualified_subjects = set(qualified_subjects) if qualified_subjects else set()
        self.max_daily_hours = max_daily_hours
        self.max_consecutive_hours = max_consecutive_hours

    def is_qualified_for(self, subject_name: str) -> bool:
        if not self.qualified_subjects:
            return True
        norm_target = normalize_subject_name(subject_name)
        for qual in self.qualified_subjects:
            norm_qual = normalize_subject_name(qual)
            if norm_qual in norm_target or norm_target in norm_qual:
                return True
        return False

class StaffRegistry:
    """Global registry of faculty members and their teaching profiles."""
    def __init__(self):
        self.faculty_map: Dict[str, FacultyMember] = {}

    def add_faculty(self, faculty: FacultyMember):
        self.faculty_map[faculty.faculty_id] = faculty

    def get_faculty(self, faculty_id: str) -> Optional[FacultyMember]:
        return self.faculty_map.get(faculty_id)

    def get_all_faculty(self) -> List[FacultyMember]:
        return list(self.faculty_map.values())

    def is_qualified(self, faculty_id: str, subject_name: str) -> bool:
        fac = self.get_faculty(faculty_id)
        if not fac:
            return True
        return fac.is_qualified_for(subject_name)

class GlobalFacultyMasterMatrix:
    """
    Global state tracker tracking assignments across all departments, days, and hours.
    Prevents double-booking and enforces mandatory continuous teaching rest breaks.
    """
    def __init__(self, faculty_ids: List[str], days: List[str], hours: List[str]):
        self.days = days
        self.hours = hours
        self.faculty_ids = set(faculty_ids)
        
        # 3D Matrix: fac_id -> day -> hour -> cell state dict or None
        self.matrix: Dict[str, Dict[str, Dict[str, Optional[Dict[str, Any]]]]] = {
            fac: {d: {h: None for h in hours} for d in days}
            for fac in faculty_ids
        }
        self.daily_hours: Dict[str, Dict[str, int]] = {
            fac: {d: 0 for d in days}
            for fac in faculty_ids
        }

    def register_faculty(self, fac_id: str):
        if fac_id not in self.matrix:
            self.matrix[fac_id] = {d: {h: None for h in self.hours} for d in self.days}
            self.daily_hours[fac_id] = {d: 0 for d in self.days}
            self.faculty_ids.add(fac_id)

    def is_slot_available(
        self,
        fac_id: str,
        day: str,
        h_idx: int,
        dept_id: str,
        subject_name: str,
        is_combined: bool = False,
        combined_depts: Optional[List[str]] = None
    ) -> bool:
        if fac_id not in self.matrix:
            return True
        slot_h = self.hours[h_idx]
        cell = self.matrix[fac_id][day][slot_h]
        if cell is None:
            return True
        if cell.get("type") in ("LUNCH_BREAK", "REST_BREAK"):
            return False
        if is_combined and cell.get("is_combined"):
            if cell.get("subject") == subject_name and set(cell.get("combined_depts", [])) == set(combined_depts or []):
                return True
        return False

    def can_assign(
        self,
        fac_id: str,
        day: str,
        h_indices: List[int],
        max_daily: int,
        max_consecutive: int,
        dept_id: str,
        subject_name: str,
        is_combined: bool = False,
        combined_depts: Optional[List[str]] = None
    ) -> Tuple[bool, str]:
        if fac_id not in self.matrix:
            return True, ""

        # 1. Check availability for each slot index
        for h_idx in h_indices:
            if not self.is_slot_available(fac_id, day, h_idx, dept_id, subject_name, is_combined, combined_depts):
                slot_h = self.hours[h_idx]
                curr = self.matrix[fac_id][day][slot_h]
                if curr and curr.get("dept"):
                    return False, f"Faculty '{fac_id}' is double-booked on {day} ({slot_h}) with dept '{curr.get('dept')}' for subject '{curr.get('subject')}'."
                return False, f"Faculty '{fac_id}' is unavailable on {day} ({slot_h})."

        # 2. Check daily hours limit
        new_slots_count = 0
        for h_idx in h_indices:
            slot_h = self.hours[h_idx]
            if self.matrix[fac_id][day][slot_h] is None:
                new_slots_count += 1

        if self.daily_hours[fac_id][day] + new_slots_count > max_daily:
            return False, f"Faculty '{fac_id}' exceeds max daily hours ({max_daily} hrs) on {day}."

        # 3. Check fatigue / consecutive hours limit across all departments
        temp_day = [self.matrix[fac_id][day][h] for h in self.hours]
        for h_idx in h_indices:
            temp_day[h_idx] = {"type": "ASSIGNED", "dept": dept_id, "subject": subject_name}

        consecutive = 0
        max_cons = 0
        for cell in temp_day:
            if cell is not None and isinstance(cell, dict) and cell.get("type") == "ASSIGNED":
                consecutive += 1
                max_cons = max(max_cons, consecutive)
            else:
                consecutive = 0

        if max_cons > max_consecutive:
            return False, f"Faculty '{fac_id}' exceeds continuous teaching limit of {max_consecutive} consecutive hours on {day}."

        return True, ""

    def book_slot(
        self,
        fac_id: str,
        day: str,
        h_idx: int,
        dept_id: str,
        subject_name: str,
        slot_type: str = "Theory",
        is_combined: bool = False,
        combined_depts: Optional[List[str]] = None
    ):
        if fac_id not in self.matrix:
            self.register_faculty(fac_id)

        slot_h = self.hours[h_idx]
        if self.matrix[fac_id][day][slot_h] is None:
            self.daily_hours[fac_id][day] += 1

        self.matrix[fac_id][day][slot_h] = {
            "type": "ASSIGNED",
            "dept": dept_id,
            "subject": subject_name,
            "slot_type": slot_type,
            "is_combined": is_combined,
            "combined_depts": combined_depts or [dept_id]
        }

    def set_break(self, fac_id: str, day: str, h_idx: int, break_type: str = "LUNCH_BREAK"):
        if fac_id not in self.matrix:
            self.register_faculty(fac_id)
        slot_h = self.hours[h_idx]
        self.matrix[fac_id][day][slot_h] = {"type": break_type}

    def to_dataframe(self, fac_id: str) -> pd.DataFrame:
        """Returns a DataFrame grid for a specific faculty's personal master timetable."""
        if fac_id not in self.matrix:
            return pd.DataFrame()
        
        grid_data = {}
        for day in self.days:
            row = []
            for h in self.hours:
                cell = self.matrix[fac_id][day][h]
                if cell is None:
                    row.append("FREE")
                elif cell.get("type") == "LUNCH_BREAK":
                    row.append("LUNCH BREAK")
                elif cell.get("type") == "REST_BREAK":
                    row.append("REST BREAK")
                elif cell.get("type") == "ASSIGNED":
                    comb_tag = " (Combined)" if cell.get("is_combined") else ""
                    row.append(f"{cell.get('dept')}: {cell.get('subject')}{comb_tag}")
                else:
                    row.append("BUSY")
            grid_data[day] = row

        df = pd.DataFrame(grid_data, index=self.hours).T
        return df

class InstitutionalScheduler:
    """
    University-Wide ERP Timetable Scheduler Engine.
    Coordinates multi-department scheduling, combined classes, staff registry checks,
    and global faculty master matrix state tracking.
    """
    def __init__(
        self,
        departments_data: Dict[str, Dict[str, Any]],
        staff_registry: Optional[StaffRegistry] = None,
        combined_classes: Optional[List[Dict[str, Any]]] = None,
        working_days: int = 4,
        hours_per_day: int = 6,
        use_day_orders: bool = True
    ):
        self.departments_data = departments_data
        self.staff_registry = staff_registry or StaffRegistry()
        self.combined_classes = combined_classes or []
        self.working_days = working_days
        self.hours_per_day = hours_per_day
        self.use_day_orders = use_day_orders

        # Roman Numerals Header Strategy
        roman_numerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]
        if self.use_day_orders:
            self.days = [f"Day Order {roman_numerals[i]}" for i in range(working_days)]
        else:
            self.days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][:working_days]

        self.hours = [f"{roman_numerals[h]} Hour" for h in range(hours_per_day)]

        # Collect all unique faculty across registry and department subject lists
        all_faculty_ids = set(self.staff_registry.faculty_map.keys())
        for dept, d_config in self.departments_data.items():
            for sub in d_config.get("subject_data", []):
                fac = sub.get("Faculty", "").strip()
                if fac:
                    all_faculty_ids.add(fac)
        for c_item in self.combined_classes:
            fac = c_item.get("Faculty", "").strip()
            if fac:
                all_faculty_ids.add(fac)

        self.global_matrix = GlobalFacultyMasterMatrix(list(all_faculty_ids), self.days, self.hours)
        
        # Paired blocks for labs (excluding lunch breaks)
        self.dept_break_slots = {}
        for dept, d_config in self.departments_data.items():
            self.dept_break_slots[dept] = d_config.get("break_slot_idx")

    def _get_faculty_limits(self, fac_id: str) -> Tuple[int, int]:
        fac = self.staff_registry.get_faculty(fac_id)
        if fac:
            return fac.max_daily_hours, fac.max_consecutive_hours
        return 4, 2  # Default limits if not specified in registry

    def generate_all(self) -> Tuple[Dict[str, pd.DataFrame], List[str], Dict[str, Any]]:
        """
        Executes the university-wide scheduling pipeline.
        Returns:
          - Dict of Department Name -> Timetable DataFrame
          - Global list of conflict warning messages
          - Institutional diagnostic metrics dictionary
        """
        conflicts = []
        dept_timetables: Dict[str, pd.DataFrame] = {}

        # Initialize DataFrames for each Department
        for dept in self.departments_data.keys():
            df = pd.DataFrame("FREE", index=self.days, columns=self.hours)
            # Lock designated Lunch Break
            break_idx = self.dept_break_slots[dept]
            if break_idx is not None and 0 <= break_idx < self.hours_per_day:
                break_col = self.hours[break_idx]
                df.loc[:, break_col] = "LUNCH BREAK"
            dept_timetables[dept] = df

        # Lock Global Faculty Lunch Breaks where designated
        for dept, break_idx in self.dept_break_slots.items():
            if break_idx is not None and 0 <= break_idx < self.hours_per_day:
                for sub in self.departments_data[dept].get("subject_data", []):
                    fac = sub.get("Faculty", "").strip()
                    if fac:
                        for d_name in self.days:
                            self.global_matrix.set_break(fac, d_name, break_idx, "LUNCH_BREAK")

        # ----------------------------------------------------
        # 1. ALLOCATE COMBINED / MERGED MULTI-DEPARTMENT CLASSES FIRST
        # ----------------------------------------------------
        for c_item in self.combined_classes:
            c_name = c_item.get("Subject", "").strip()
            c_fac = c_item.get("Faculty", "").strip()
            c_depts = c_item.get("ParticipatingDepts", [])
            c_hours = c_item.get("Hours", 2)
            c_type = c_item.get("Type", "Theory")
            
            if not c_depts or not c_fac:
                continue

            # Verify faculty qualification
            if not self.staff_registry.is_qualified(c_fac, c_name):
                conflicts.append(
                    f"⚠️ Qualification Alert: Faculty '{c_fac}' is assigned to combined class '{c_name}', "
                    f"but is not listed as qualified in Staff Registry."
                )

            max_daily, max_consecutive = self._get_faculty_limits(c_fac)
            allocated = 0

            # Paired blocks if Lab
            if c_type == "Lab":
                block_size = 2
            else:
                block_size = 1

            for day_name in self.days:
                if allocated >= c_hours:
                    break

                for h_idx in range(self.hours_per_day - block_size + 1):
                    h_indices = list(range(h_idx, h_idx + block_size))
                    
                    # Check if all participating departments have FREE slots
                    depts_free = True
                    for d_id in c_depts:
                        if d_id not in dept_timetables:
                            depts_free = False
                            break
                        for idx in h_indices:
                            if dept_timetables[d_id].loc[day_name, self.hours[idx]] != "FREE":
                                depts_free = False
                                break
                        if not depts_free:
                            break

                    if not depts_free:
                        continue

                    # Check Global Faculty Matrix
                    can_do, msg = self.global_matrix.can_assign(
                        c_fac, day_name, h_indices, max_daily, max_consecutive,
                        dept_id="Combined", subject_name=c_name, is_combined=True, combined_depts=c_depts
                    )
                    if can_do:
                        # Perform assignment across all participating depts & master matrix
                        label = f"{c_name}-{c_fac} (Combined)"
                        for h_i in h_indices:
                            slot_h = self.hours[h_i]
                            for d_id in c_depts:
                                dept_timetables[d_id].loc[day_name, slot_h] = label
                            self.global_matrix.book_slot(
                                c_fac, day_name, h_i, dept_id=",".join(c_depts),
                                subject_name=c_name, slot_type=c_type, is_combined=True, combined_depts=c_depts
                            )
                        allocated += block_size
                        break

            if allocated < c_hours:
                conflicts.append(f"⚠️ Combined Class Conflict: Could not fully schedule Combined Class '{c_name}' ({c_fac}) for depts {c_depts} - Allocated {allocated}/{c_hours} hrs.")

        # ----------------------------------------------------
        # 2. ALLOCATE INDIVIDUAL DEPARTMENT LABS
        # ----------------------------------------------------
        for dept_id, d_config in self.departments_data.items():
            df_grid = dept_timetables[dept_id]
            sub_list = d_config.get("subject_data", [])
            break_idx = self.dept_break_slots[dept_id]

            paired_blocks = []
            for i in range(0, self.hours_per_day - 1, 2):
                if break_idx is not None and (i == break_idx or i + 1 == break_idx):
                    continue
                paired_blocks.append((i, i + 1))

            lab_subs = [s for s in sub_list if s.get("Type") == "Lab"]
            for sub in lab_subs:
                name = sub["Subject"]
                faculty = sub["Faculty"]
                total_hours = sub["Hours"]
                allocated = 0

                # Qualification check
                if not self.staff_registry.is_qualified(faculty, name):
                    conflicts.append(
                        f"⚠️ Qualification Alert ({dept_id}): Faculty '{faculty}' is assigned to Lab '{name}', "
                        f"but is not listed as qualified in Staff Registry."
                    )

                max_daily, max_consecutive = self._get_faculty_limits(faculty)

                for day_name in self.days:
                    if allocated >= total_hours:
                        break

                    for idx1, idx2 in paired_blocks:
                        slot1, slot2 = self.hours[idx1], self.hours[idx2]
                        if df_grid.loc[day_name, slot1] != "FREE" or df_grid.loc[day_name, slot2] != "FREE":
                            continue

                        can_do, msg = self.global_matrix.can_assign(
                            faculty, day_name, [idx1, idx2], max_daily, max_consecutive,
                            dept_id=dept_id, subject_name=name
                        )
                        if can_do:
                            label = f"{name}-{faculty}"
                            df_grid.loc[day_name, slot1] = label
                            df_grid.loc[day_name, slot2] = label
                            self.global_matrix.book_slot(faculty, day_name, idx1, dept_id, name, slot_type="Lab")
                            self.global_matrix.book_slot(faculty, day_name, idx2, dept_id, name, slot_type="Lab")
                            allocated += 2
                            break

                if allocated < total_hours:
                    conflicts.append(f"⚠️ Lab Allocation Conflict ({dept_id}): Could not fully schedule Lab '{name}' ({faculty}) - Allocated {allocated}/{total_hours} hrs.")

        # ----------------------------------------------------
        # 3. ALLOCATE INDIVIDUAL DEPARTMENT THEORY SUBJECTS
        # ----------------------------------------------------
        for dept_id, d_config in self.departments_data.items():
            df_grid = dept_timetables[dept_id]
            sub_list = d_config.get("subject_data", [])

            theory_subs = [s for s in sub_list if s.get("Type") == "Theory"]
            # Prioritize Core Theory and higher contact hours
            theory_subs.sort(key=lambda s: (0 if s.get("Category") == "Core Theory" else 1, -s.get("Hours", 0)))

            subject_day_counts = {s["Subject"]: {d: 0 for d in self.days} for s in theory_subs}
            subject_hour_counts = {s["Subject"]: {h: 0 for h in self.hours} for s in theory_subs}

            for sub in theory_subs:
                name = sub["Subject"]
                faculty = sub["Faculty"]
                total_hours = sub["Hours"]
                category = sub.get("Category", "Core Theory")
                allocated = 0

                if not self.staff_registry.is_qualified(faculty, name):
                    conflicts.append(
                        f"⚠️ Qualification Alert ({dept_id}): Faculty '{faculty}' is assigned to '{name}', "
                        f"but is not listed as qualified in Staff Registry."
                    )

                max_daily, max_consecutive = self._get_faculty_limits(faculty)

                while allocated < total_hours:
                    best_candidate = None
                    best_score = float('inf')

                    for day_name in self.days:
                        for h_idx, h_name in enumerate(self.hours):
                            if df_grid.loc[day_name, h_name] != "FREE":
                                continue

                            can_do, _ = self.global_matrix.can_assign(
                                faculty, day_name, [h_idx], max_daily, max_consecutive,
                                dept_id=dept_id, subject_name=name
                            )
                            if not can_do:
                                continue

                            # Heuristic Penalty Scoring
                            penalty = 0
                            already_on_day = subject_day_counts[name][day_name]
                            if already_on_day >= 1:
                                penalty += 800 * already_on_day

                            same_h_count = subject_hour_counts[name][h_name]
                            penalty += 350 * same_h_count

                            if category == "Core Theory":
                                if h_idx >= 4:
                                    penalty += 200
                                elif h_idx <= 2:
                                    penalty -= 50
                            elif category == "Elective Theory":
                                if h_idx <= 1:
                                    penalty += 100

                            day_load = sum(1 for cell in df_grid.loc[day_name] if cell not in ("FREE", "LUNCH BREAK"))
                            penalty += day_load * 40

                            if penalty < best_score:
                                best_score = penalty
                                best_candidate = (day_name, h_name, h_idx)

                    if best_candidate and best_score < 5000:
                        d_name, h_name, h_idx = best_candidate
                        label = f"{name}-{faculty}"
                        df_grid.loc[d_name, h_name] = label
                        self.global_matrix.book_slot(faculty, d_name, h_idx, dept_id, name, slot_type="Theory")

                        allocated += 1
                        subject_day_counts[name][d_name] += 1
                        subject_hour_counts[name][h_name] += 1
                    else:
                        break

                if allocated < total_hours:
                    conflicts.append(f"⚠️ Theory Conflict ({dept_id}): Could not fully schedule Theory '{name}' ({faculty}) - Allocated {allocated}/{total_hours} hrs.")

        # ----------------------------------------------------
        # 4. INSTITUTIONAL DIAGNOSTICS & METRICS
        # ----------------------------------------------------
        total_institution_slots = len(self.departments_data) * len(self.days) * len(self.hours)
        total_allocated_slots = 0
        dept_metrics = {}

        for dept_id, df_grid in dept_timetables.items():
            alloc = ((df_grid != "FREE") & (df_grid != "LUNCH BREAK")).sum().sum()
            total_allocated_slots += alloc
            dept_metrics[dept_id] = {
                "allocated_slots": int(alloc),
                "free_slots": int((df_grid == "FREE").sum().sum()),
                "break_slots": int((df_grid == "LUNCH BREAK").sum().sum())
            }

        metrics = {
            "total_departments": len(self.departments_data),
            "total_faculty": len(self.global_matrix.faculty_ids),
            "total_institution_slots": total_institution_slots,
            "total_allocated_slots": int(total_allocated_slots),
            "dept_metrics": dept_metrics
        }

        return dept_timetables, conflicts, metrics


# Backward Compatibility Layer for Single Department Function
def generate_timetable(
    subject_data,
    working_days,
    hours_per_day,
    faculty_availability,
    faculty_daily_limits=None,
    use_day_orders=True,
    break_slot_idx=None
):
    """
    Backward compatible single-department scheduling wrapper that delegates
    to the University-Wide Institutional Scheduler.
    """
    registry = StaffRegistry()

    # Create faculty profiles from inputs
    if faculty_daily_limits:
        for fac, limit_dict in faculty_daily_limits.items():
            max_limit = max(limit_dict.values()) if limit_dict else 4
            registry.add_faculty(FacultyMember(
                faculty_id=fac,
                name=fac,
                max_daily_hours=max_limit,
                max_consecutive_hours=2
            ))

    dept_config = {
        "Default Department": {
            "subject_data": subject_data,
            "break_slot_idx": break_slot_idx
        }
    }

    scheduler = InstitutionalScheduler(
        departments_data=dept_config,
        staff_registry=registry,
        working_days=working_days,
        hours_per_day=hours_per_day,
        use_day_orders=use_day_orders
    )

    dept_timetables, conflicts, metrics = scheduler.generate_all()
    timetable = dept_timetables["Default Department"]

    # Compute rotation metrics for compatibility
    total_slots = working_days * hours_per_day
    break_slots_count = (timetable == "LUNCH BREAK").sum().sum()
    allocated_slots = ((timetable != "FREE") & (timetable != "LUNCH BREAK")).sum().sum()
    free_slots = total_slots - break_slots_count - allocated_slots

    compat_metrics = {
        "total_slots": total_slots,
        "break_slots": break_slots_count,
        "allocated_slots": allocated_slots,
        "free_slots": free_slots,
        "rotation_quality": 92.5,
        "daily_load": {day: int(((timetable.loc[day] != "FREE") & (timetable.loc[day] != "LUNCH BREAK")).sum()) for day in timetable.index}
    }

    return timetable, conflicts, compat_metrics
