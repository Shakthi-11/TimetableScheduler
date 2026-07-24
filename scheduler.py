import pandas as pd
import re

def normalize_subject_name(name):
    """Strips lab/theory suffixes to find the core subject name."""
    clean = re.sub(r'(?i)\b(lab|theory|practical|l2b|l4)\b', '', name)
    return clean.strip().lower()

def generate_timetable(subject_data, working_days, hours_per_day, faculty_availability, faculty_daily_limits=None, use_day_orders=True):
    # Day Naming Strategy
    if use_day_orders:
        days = [f"Day Order {chr(73+i)}" if i < 3 else f"Day Order IV" if i == 3 else f"Day Order V" for i in range(working_days)]
    else:
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][:working_days]
    
    # Roman Numeral Hour Headers (I Hour, II Hour, ...)
    roman_numerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]
    hours = [f"{roman_numerals[h]} Hour" for h in range(hours_per_day)]
    
    timetable = pd.DataFrame("FREE", index=days, columns=hours)
    conflicts = []
    
    # ----------------------------------------------------
    # 1. ENFORCE SAME TEACHER FOR THEORY & LAB PAIRS
    # ----------------------------------------------------
    base_subject_teachers = {}
    for sub in subject_data:
        raw_name = sub.get("Subject", "").strip()
        faculty = sub.get("Faculty", "").strip()
        base_name = normalize_subject_name(raw_name)
        
        if not base_name or not faculty:
            continue
            
        if base_name in base_subject_teachers:
            existing_faculty = base_subject_teachers[base_name]
            if existing_faculty != faculty:
                conflicts.append(
                    f"⚠️ Mismatch: '{raw_name}' is assigned to {faculty}, "
                    f"but base subject is assigned to {existing_faculty}. "
                    f"Theory & Lab for the same subject MUST share the same teacher."
                )
        else:
            base_subject_teachers[base_name] = faculty

    faculty_daily_hours = {fac: {day: 0 for day in days} for fac in faculty_availability}
    labs_per_day = {day: 0 for day in days}

    def get_max_limit(faculty, day):
        if faculty_daily_limits and faculty in faculty_daily_limits:
            return faculty_daily_limits[faculty].get(day, 3)
        return 3

    # Standard 2-Hour Paired Blocks: (0,1), (2,3), (4,5) -> (Hours I-II), (Hours III-IV), (Hours V-VI)
    paired_blocks = [(i, i+1) for i in range(0, hours_per_day - 1, 2)]

    # ----------------------------------------------------
    # 2. ALLOCATE LABS & 2-HOUR PROJECTS (Fixed Paired Slots)
    # ----------------------------------------------------
    lab_subjects = [s for s in subject_data if s.get("Type") == "Lab"]
    for sub in lab_subjects:
        name = sub["Subject"]
        faculty = sub["Faculty"]
        total_hours = sub["Hours"]
        allocated = 0
        
        for day in days:
            if allocated >= total_hours:
                break
                
            if labs_per_day[day] >= 1:
                continue
                
            if faculty in faculty_availability and not faculty_availability[faculty].get(day, True):
                continue

            max_daily = get_max_limit(faculty, day)
            current_hrs = faculty_daily_hours.get(faculty, {}).get(day, 0)
            if current_hrs + 2 > max_daily:
                continue

            # Try paired blocks (I-II, III-IV, or V-VI)
            for idx1, idx2 in paired_blocks:
                if idx2 >= hours_per_day:
                    continue
                slot1, slot2 = hours[idx1], hours[idx2]
                
                if timetable.loc[day, slot1] == "FREE" and timetable.loc[day, slot2] == "FREE":
                    label = f"{name}-{faculty}"
                    timetable.loc[day, slot1] = label
                    timetable.loc[day, slot2] = label
                    
                    allocated += 2
                    labs_per_day[day] += 1
                    if faculty in faculty_daily_hours:
                        faculty_daily_hours[faculty][day] += 2
                    break
        
        if allocated < total_hours:
            conflicts.append(f"Could not fully allocate Lab block for: {name} ({faculty})")

    # ----------------------------------------------------
    # 3. ALLOCATE THEORY SUBJECTS (1-Hour Slots)
    # ----------------------------------------------------
    theory_subjects = [s for s in subject_data if s.get("Type") == "Theory"]
    for sub in theory_subjects:
        name = sub["Subject"]
        faculty = sub["Faculty"]
        total_hours = sub["Hours"]
        allocated = 0
        
        for day in days:
            if allocated >= total_hours:
                break
                
            if faculty in faculty_availability and not faculty_availability[faculty].get(day, True):
                continue
                
            max_daily = get_max_limit(faculty, day)
            current_hrs = faculty_daily_hours.get(faculty, {}).get(day, 0)
            if current_hrs + 1 > max_daily:
                continue

            for h in hours:
                if timetable.loc[day, h] == "FREE":
                    timetable.loc[day, h] = f"{name}-{faculty}"
                    allocated += 1
                    if faculty in faculty_daily_hours:
                        faculty_daily_hours[faculty][day] += 1
                    break

        if allocated < total_hours:
            conflicts.append(f"Could not fully allocate Theory hours for: {name} ({faculty})")

    return timetable, conflicts
