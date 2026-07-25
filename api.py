from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import sys

from scheduler import StaffRegistry, FacultyMember, InstitutionalScheduler

app = FastAPI(title="SRMIST ERP Timetable Scheduler API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateScheduleRequest(BaseModel):
    faculty_registry_data: List[Dict[str, Any]]
    depts_curriculum: Dict[str, List[Dict[str, Any]]]
    combined_classes_data: List[Dict[str, Any]]
    operating_rules: Dict[str, Any]

@app.get("/")
def read_root():
    return {"status": "ok", "message": "SRMIST ERP Timetable Scheduler API is running"}

@app.post("/api/schedule/generate")
def generate_schedule(req: GenerateScheduleRequest):
    try:
        # Build Staff Registry
        registry = StaffRegistry()
        for f in req.faculty_registry_data:
            f_id = str(f.get("Faculty_ID", "")).strip()
            if f_id:
                quals = [q.strip() for q in str(f.get("Qualified", "")).split(",") if q.strip()]
                registry.add_faculty(FacultyMember(
                    faculty_id=f_id,
                    name=str(f.get("Name", f_id)),
                    primary_dept=str(f.get("Primary_Dept", "")),
                    qualified_subjects=quals,
                    max_daily_hours=int(f.get("Max_Daily", 4)),
                    max_consecutive_hours=int(f.get("Max_Cons", 2))
                ))

        # Break slot mapping
        break_option = req.operating_rules.get("break_option", "None")
        break_slot_map = {"None": None, "Hour IV (Lunch)": 3, "Hour III (Lunch)": 2}
        break_slot_idx = break_slot_map.get(break_option)

        # Prepare departments data
        departments_data = {}
        for d_name, sub_list in req.depts_curriculum.items():
            departments_data[d_name] = {
                "subject_data": sub_list,
                "break_slot_idx": break_slot_idx
            }

        working_days = int(req.operating_rules.get("working_days", 4))
        hours_per_day = int(req.operating_rules.get("hours_per_day", 6))

        scheduler = InstitutionalScheduler(
            departments_data=departments_data,
            staff_registry=registry,
            combined_classes=req.combined_classes_data,
            working_days=working_days,
            hours_per_day=hours_per_day,
            use_day_orders=True
        )

        dept_timetables, conflicts, metrics = scheduler.generate_all()

        # Convert faculty matrices to dict of list of dicts
        faculty_matrices = {}
        all_fac_ids = sorted(list(scheduler.global_matrix.faculty_ids))
        for fac_id in all_fac_ids:
            fac_df = scheduler.global_matrix.to_dataframe(fac_id)
            faculty_matrices[fac_id] = fac_df.to_dict("records")

        # Convert department timetables to list of dicts
        dept_tt_dict = {}
        for dept, tt_df in dept_timetables.items():
            dept_tt_dict[dept] = tt_df.to_dict("records")

        return {
            "dept_timetables": dept_tt_dict,
            "faculty_matrices": faculty_matrices,
            "conflicts": conflicts,
            "metrics": metrics,
            "faculty_ids": all_fac_ids
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
