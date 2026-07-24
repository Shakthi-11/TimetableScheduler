import pandas as pd

def generate_timetable(subject_data, working_days, hours_per_day, faculty_availability, faculty_daily_limits=None):
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][:working_days]
    hours = [f"Hour {h+1}" for h in range(hours_per_day)]
    
    timetable = pd.DataFrame("FREE", index=days, columns=hours)
    conflicts = []
    
    faculty_daily_hours = {fac: {day: 0 for day in days} for fac in faculty_availability}
    labs_per_day = {day: 0 for day in days}

    def get_max_limit(faculty, day):
        if faculty_daily_limits and faculty in faculty_daily_limits:
            return faculty_daily_limits[faculty].get(day, 3)
        return 3

    # 1. Allocate Labs (2 continuous hours required)
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

            for h in range(hours_per_day - 1):
                slot1, slot2 = hours[h], hours[h+1]
                
                if timetable.loc[day, slot1] == "FREE" and timetable.loc[day, slot2] == "FREE":
                    label = f"{name} ({faculty}) [Lab]"
                    timetable.loc[day, slot1] = label
                    timetable.loc[day, slot2] = label
                    
                    allocated += 2
                    labs_per_day[day] += 1
                    if faculty in faculty_daily_hours:
                        faculty_daily_hours[faculty][day] += 2
                    break
        
        if allocated < total_hours:
            conflicts.append(f"Could not allocate required hours for Lab: {name} ({faculty})")

    # 2. Allocate Theory Subjects (1 hour slots)
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
                    timetable.loc[day, h] = f"{name} ({faculty}) [Theory]"
                    allocated += 1
                    if faculty in faculty_daily_hours:
                        faculty_daily_hours[faculty][day] += 1
                    break

        if allocated < total_hours:
            conflicts.append(f"Could not allocate required hours for Theory: {name} ({faculty})")

    return timetable, conflicts
