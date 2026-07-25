import os
import io
import pandas as pd
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from scheduler import StaffRegistry, FacultyMember, InstitutionalScheduler
from utils import export_to_excel, export_to_pdf

app = FastAPI(title="Timetable Scheduler ERP API", version="1.0")

# Enable CORS for React frontend (Vite default dev ports)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------
# PYDANTIC SCHEMAS
# ----------------------------------------------------
class FacultyMemberSchema(BaseModel):
    Faculty_ID: str
    Name: str = ""
    Primary_Dept: str = ""
    Qualified: str = ""
    Max_Daily: int = 4
    Max_Cons: int = 2

class SubjectSchema(BaseModel):
    Subject: str
    Faculty: str
    Hours: int = 3
    Type: str = "Theory"
    Category: str = "Core Theory"

class CombinedClassSchema(BaseModel):
    Subject: str
    Faculty: str
    ParticipatingDepts: List[str]
    Hours: int = 2
    Type: str = "Theory"

class OperatingRulesSchema(BaseModel):
    working_days: int = 4
    hours_per_day: int = 6
    break_option: str = "None"
    semester: int = 4

class ScheduleRequestSchema(BaseModel):
    faculty_registry_data: List[FacultyMemberSchema]
    depts_curriculum: Dict[str, List[SubjectSchema]]
    combined_classes_data: List[CombinedClassSchema]
    operating_rules: OperatingRulesSchema

# ----------------------------------------------------
# API ENDPOINTS
# ----------------------------------------------------
@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "ERP Timetable Scheduler API is running."}

@app.get("/api/presets")
def get_presets():
    return {
        "faculty_registry_data": [
            {"Faculty_ID": "MR", "Name": "Prof. MR", "Primary_Dept": "B.sc CS", "Qualified": "Python, Python Lab, AI", "Max_Daily": 4, "Max_Cons": 2},
            {"Faculty_ID": "VR", "Name": "Prof. VR", "Primary_Dept": "B.sc CS", "Qualified": "ML, ML Lab, Data Mining", "Max_Daily": 4, "Max_Cons": 2},
            {"Faculty_ID": "JP", "Name": "Dr. JP", "Primary_Dept": "BCA", "Qualified": "Project-c, Ethics, Signals & Systems", "Max_Daily": 4, "Max_Cons": 2},
            {"Faculty_ID": "JPS", "Name": "Prof. JPS", "Primary_Dept": "BCA", "Qualified": "Signals & Systems, Signals, Systems, Project-OOPS", "Max_Daily": 4, "Max_Cons": 2},
        ],
        "depts_curriculum": {
            "B.sc CS": [
                {"Subject": "Python", "Faculty": "MR", "Hours": 4, "Type": "Theory", "Category": "Core Theory"},
                {"Subject": "Python Lab", "Faculty": "MR", "Hours": 3, "Type": "Lab", "Category": "Lab"},
                {"Subject": "ML", "Faculty": "VR", "Hours": 3, "Type": "Theory", "Category": "Core Theory"},
                {"Subject": "ML Lab", "Faculty": "VR", "Hours": 3, "Type": "Lab", "Category": "Lab"},
            ],
            "BCA": [
                {"Subject": "Signals & Systems", "Faculty": "JPS", "Hours": 3, "Type": "Theory", "Category": "Core Theory"},
                {"Subject": "ML", "Faculty": "VR", "Hours": 3, "Type": "Theory", "Category": "Core Theory"},
                {"Subject": "Project-c", "Faculty": "JP", "Hours": 2, "Type": "Theory", "Category": "Core Theory"},
            ]
        },
        "combined_classes_data": [
            {
                "Subject": "Ethics in Tech",
                "Faculty": "JP",
                "ParticipatingDepts": ["B.sc CS", "BCA"],
                "Hours": 2,
                "Type": "Theory"
            }
        ],
        "operating_rules": {
            "working_days": 4,
            "hours_per_day": 6,
            "break_option": "None",
            "semester": 4
        }
    }

@app.post("/api/schedule/generate")
def generate_schedule(payload: ScheduleRequestSchema):
    try:
        # Build StaffRegistry object
        registry = StaffRegistry()
        for f in payload.faculty_registry_data:
            f_id = f.Faculty_ID.strip()
            if f_id:
                quals = [q.strip() for q in f.Qualified.split(",") if q.strip()]
                registry.add_faculty(FacultyMember(
                    faculty_id=f_id,
                    name=f.Name or f_id,
                    primary_dept=f.Primary_Dept,
                    qualified_subjects=quals,
                    max_daily_hours=f.Max_Daily,
                    max_consecutive_hours=f.Max_Cons
                ))

        break_slot_map = {"None": None, "Hour IV (Lunch)": 3, "Hour III (Lunch)": 2}
        break_slot_idx = break_slot_map.get(payload.operating_rules.break_option)

        # Build departments_data dict
        departments_data = {}
        for d_name, sub_list in payload.depts_curriculum.items():
            departments_data[d_name] = {
                "subject_data": [s.dict() for s in sub_list],
                "break_slot_idx": break_slot_idx
            }

        combined_list = [c.dict() for c in payload.combined_classes_data]

        # Instantiate Institutional Scheduler
        scheduler = InstitutionalScheduler(
            departments_data=departments_data,
            staff_registry=registry,
            combined_classes=combined_list,
            working_days=payload.operating_rules.working_days,
            hours_per_day=payload.operating_rules.hours_per_day,
            use_day_orders=True
        )

        dept_timetables, conflicts, metrics = scheduler.generate_all()

        # Convert department timetables dataframes to dict records
        dept_timetables_json = {}
        for d_name, df in dept_timetables.items():
            dept_timetables_json[d_name] = df.to_dict("records")

        # Convert faculty master matrix to dict records
        fac_matrices_json = {}
        all_fac_ids = sorted(list(scheduler.global_matrix.faculty_ids))
        for fac_id in all_fac_ids:
            fac_df = scheduler.global_matrix.to_dataframe(fac_id)
            fac_matrices_json[fac_id] = fac_df.to_dict("records")

        return {
            "dept_timetables": dept_timetables_json,
            "faculty_matrices": fac_matrices_json,
            "conflicts": conflicts,
            "metrics": metrics,
            "faculty_ids": all_fac_ids
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/export/excel")
def export_excel_endpoint(payload: ScheduleRequestSchema):
    try:
        registry = StaffRegistry()
        for f in payload.faculty_registry_data:
            f_id = f.Faculty_ID.strip()
            if f_id:
                quals = [q.strip() for q in f.Qualified.split(",") if q.strip()]
                registry.add_faculty(FacultyMember(
                    faculty_id=f_id,
                    name=f.Name or f_id,
                    primary_dept=f.Primary_Dept,
                    qualified_subjects=quals,
                    max_daily_hours=f.Max_Daily,
                    max_consecutive_hours=f.Max_Cons
                ))

        break_slot_map = {"None": None, "Hour IV (Lunch)": 3, "Hour III (Lunch)": 2}
        break_slot_idx = break_slot_map.get(payload.operating_rules.break_option)

        departments_data = {
            d_name: {"subject_data": [s.dict() for s in sub_list], "break_slot_idx": break_slot_idx}
            for d_name, sub_list in payload.depts_curriculum.items()
        }

        scheduler = InstitutionalScheduler(
            departments_data=departments_data,
            staff_registry=registry,
            combined_classes=[c.dict() for c in payload.combined_classes_data],
            working_days=payload.operating_rules.working_days,
            hours_per_day=payload.operating_rules.hours_per_day,
            use_day_orders=True
        )

        dept_timetables, conflicts, metrics = scheduler.generate_all()
        excel_bytes = export_to_excel(dept_timetables, scheduler.global_matrix, metrics)

        return Response(
            content=excel_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=SRMIST_VDP_Timetable_Sem{payload.operating_rules.semester}.xlsx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/export/pdf")
def export_pdf_endpoint(payload: ScheduleRequestSchema):
    try:
        registry = StaffRegistry()
        for f in payload.faculty_registry_data:
            f_id = f.Faculty_ID.strip()
            if f_id:
                quals = [q.strip() for q in f.Qualified.split(",") if q.strip()]
                registry.add_faculty(FacultyMember(
                    faculty_id=f_id,
                    name=f.Name or f_id,
                    primary_dept=f.Primary_Dept,
                    qualified_subjects=quals,
                    max_daily_hours=f.Max_Daily,
                    max_consecutive_hours=f.Max_Cons
                ))

        break_slot_map = {"None": None, "Hour IV (Lunch)": 3, "Hour III (Lunch)": 2}
        break_slot_idx = break_slot_map.get(payload.operating_rules.break_option)

        departments_data = {
            d_name: {"subject_data": [s.dict() for s in sub_list], "break_slot_idx": break_slot_idx}
            for d_name, sub_list in payload.depts_curriculum.items()
        }

        scheduler = InstitutionalScheduler(
            departments_data=departments_data,
            staff_registry=registry,
            combined_classes=[c.dict() for c in payload.combined_classes_data],
            working_days=payload.operating_rules.working_days,
            hours_per_day=payload.operating_rules.hours_per_day,
            use_day_orders=True
        )

        dept_timetables, conflicts, metrics = scheduler.generate_all()
        pdf_bytes = export_to_pdf(dept_timetables, "University ERP", payload.operating_rules.semester, scheduler.global_matrix)

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=SRMIST_VDP_Timetable_Sem{payload.operating_rules.semester}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
