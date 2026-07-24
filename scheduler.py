import random
import pandas as pd


def generate_timetable(subjects, working_days, hours_per_day, faculty_availability=None):
    if faculty_availability is None:
        faculty_availability = {}

    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][:working_days]
    hours = [f"Hour {i}" for i in range(1, hours_per_day + 1)]

    timetable = pd.DataFrame("FREE", index=days, columns=hours)
    conflicts = []

    # Total available slots check
    total_slots = working_days * hours_per_day
    total_required_hours = sum(int(s.get("Hours", 0)) for s in subjects if s.get("Subject"))

    if total_required_hours > total_slots:
        conflicts.append(
            f"Overbooked! Total required hours ({total_required_hours}) exceed available weekly slots ({total_slots})."
        )

    # Separate labs (require 2 consecutive slots) and theory
    labs = [s for s in subjects if s.get("Type") == "Lab" and s.get("Subject")]
    theory = [s for s in subjects if s.get("Type") != "Lab" and s.get("Subject")]

    # 1. Schedule Labs in 2 consecutive slots
    for lab in labs:
        remaining_hours = int(lab.get("Hours", 2))
        faculty = lab.get("Faculty", "")
        subject_name = lab.get("Subject", "")

        while remaining_hours >= 2:
            placed = False
            for day in days:
                if placed:
                    break
                for h_idx in range(hours_per_day - 1):
                    h1, h2 = hours[h_idx], hours[h_idx + 1]

                    # Check if both consecutive hours are FREE
                    if timetable.loc[day, h1] == "FREE" and timetable.loc[day, h2] == "FREE":
                        # Check faculty availability
                        if faculty in faculty_availability and not faculty_availability[faculty].get(day, True):
                            continue

                        entry = f"🔬 {subject_name}\n({faculty})\n[Lab]"
                        timetable.loc[day, h1] = entry
                        timetable.loc[day, h2] = entry
                        remaining_hours -= 2
                        placed = True
                        break

            if not placed:
                conflicts.append(f"Could not place full lab duration for {subject_name}.")
                break

    # 2. Schedule Theory slots
    theory_pool = []
    for s in theory:
        for _ in range(int(s.get("Hours", 1))):
            theory_pool.append(s)

    random.shuffle(theory_pool)

    for day in days:
        used_today = set()

        for hour in hours:
            if timetable.loc[day, hour] != "FREE":
                continue

            placed = False
            random.shuffle(theory_pool)

            for sub in theory_pool:
                sub_name = sub.get("Subject", "")
                faculty = sub.get("Faculty", "")

                if sub_name in used_today:
                    continue

                if faculty in faculty_availability and not faculty_availability[faculty].get(day, True):
                    continue

                timetable.loc[day, hour] = f"📖 {sub_name}\n({faculty})\n[Theory]"
                used_today.add(sub_name)
                theory_pool.remove(sub)
                placed = True
                break

            # Fallback pass if all remaining subjects were used today
            if not placed and theory_pool:
                for sub in theory_pool:
                    faculty = sub.get("Faculty", "")
                    if faculty in faculty_availability and not faculty_availability[faculty].get(day, True):
                        continue

                    timetable.loc[day, hour] = f"📖 {sub.get('Subject', '')}\n({faculty})\n[Theory]"
                    theory_pool.remove(sub)
                    placed = True
                    break

    return timetable, conflicts