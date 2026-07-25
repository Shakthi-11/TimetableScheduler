import pandas as pd
import streamlit as st
from scheduler import StaffRegistry, FacultyMember, InstitutionalScheduler
from utils import export_to_excel, export_to_pdf

# 1. PAGE CONFIGURATION
st.set_page_config(
    page_title="SRMIST Vadapalani - Institutional ERP Timetable Scheduler",
    page_icon="📅",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# 2. LOGO URL & BRANDING ASSETS
SRM_LOGO_URL = "https://www.srmistvdp.edu.in/uploads/51ba570fe68fc088e0a942bdf8700cdce7eb8b1d/1766992169SRMIST-Vadapalani.webp"

# 3. 3D METALLIC BLUE CUSTOM CSS
st.markdown("""
<style>
    /* Hide Sidebar Completely */
    [data-testid="stSidebar"] {
        display: none !important;
    }

    /* Global Font & Spacing */
    * {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    }

    .block-container {
        padding: 2rem 3.5rem !important;
        max-width: 100% !important;
    }

    /* 3D Metallic Blue Header Banner */
    .srm-banner-3d {
        background: linear-gradient(135deg, #0b2545 0%, #003366 45%, #002244 75%, #001229 100%);
        border-radius: 16px;
        padding: 1.8rem 2.5rem;
        margin-bottom: 2.2rem;
        position: relative;
        overflow: hidden;
        box-shadow: 
            0 14px 30px -5px rgba(0, 51, 102, 0.6),
            0 6px 15px -2px rgba(0, 0, 0, 0.4),
            inset 0 1px 1px rgba(255, 255, 255, 0.3),
            inset 0 -3px 6px rgba(0, 0, 0, 0.4);
        border-top: 1px solid rgba(255, 255, 255, 0.25);
        border-left: 1px solid rgba(255, 255, 255, 0.15);
        border-bottom: 4px solid #001020;
    }

    /* 3D Frame for SRM Logo */
    .logo-3d-card {
        background: linear-gradient(145deg, #ffffff, #f0f4f8);
        padding: 10px 16px;
        border-radius: 14px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-shadow: 
            0 10px 20px rgba(0, 0, 0, 0.35),
            inset 0 2px 3px rgba(255, 255, 255, 0.9),
            inset 0 -2px 4px rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.9);
    }

    .srm-title-3d {
        color: #ffffff !important;
        font-size: 2.2rem !important;
        font-weight: 800 !important;
        margin: 0 !important;
        letter-spacing: -0.5px;
        text-shadow: 0 2px 5px rgba(0,0,0,0.5), 0 0 20px rgba(0, 102, 204, 0.4);
    }

    .srm-subtitle-3d {
        color: #cbd5e1 !important;
        font-size: 1.05rem !important;
        margin-top: 6px !important;
        margin-bottom: 0 !important;
    }

    .vdp-badge-3d {
        color: #ff4d4d;
        font-weight: 800;
        letter-spacing: 0.8px;
        text-shadow: 0 1px 3px rgba(0,0,0,0.8);
    }

    /* High-Contrast Headings */
    h2, h3, h4 {
        color: #38bdf8 !important;
        font-weight: 700 !important;
        margin-top: 1rem !important;
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    /* Custom Navigation Tabs */
    .stTabs [data-baseweb="tab-list"] {
        gap: 12px;
        border-bottom: 2px solid rgba(56, 189, 248, 0.2);
    }

    .stTabs [data-baseweb="tab"] {
        height: 48px;
        border-radius: 8px 8px 0 0;
        padding: 0 24px;
        font-weight: 600;
        color: #94a3b8;
    }

    .stTabs [aria-selected="true"] {
        color: #38bdf8 !important;
        border-bottom: 3px solid #38bdf8 !important;
    }

    /* 3D Primary Action Buttons */
    .stButton>button[type="primary"], .stButton>button {
        background: linear-gradient(180deg, #004080 0%, #002b55 100%) !important;
        color: #ffffff !important;
        border-radius: 10px !important;
        border: 1px solid #0059b3 !important;
        border-bottom: 3px solid #001a33 !important;
        padding: 0.6rem 1.8rem !important;
        font-weight: 700 !important;
        box-shadow: 0 4px 12px rgba(0, 51, 102, 0.4) !important;
        transition: all 0.15s ease-in-out !important;
    }

    .stButton>button:hover {
        background: linear-gradient(180deg, #0059b3 0%, #003366 100%) !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 6px 16px rgba(0, 89, 179, 0.5) !important;
    }

    /* Metric Card Styling */
    [data-testid="stMetric"] {
        background: linear-gradient(145deg, rgba(15, 23, 42, 0.7), rgba(30, 41, 59, 0.7));
        border: 1px solid rgba(56, 189, 248, 0.25);
        border-radius: 12px;
        padding: 1rem 1.25rem;
        box-shadow: 0 6px 16px rgba(0,0,0,0.25);
    }

    [data-testid="stMetricValue"] {
        color: #38bdf8 !important;
        font-weight: 800 !important;
    }
</style>
""", unsafe_allow_html=True)

# 4. HEADER BANNER
st.markdown(f"""
<div class="srm-banner-3d">
    <div style="display: flex; align-items: center; gap: 2rem;">
        <div class="logo-3d-card">
            <img src="{SRM_LOGO_URL}" width="140px" style="display: block;">
        </div>
        <div>
            <h1 class="srm-title-3d">University-Wide ERP Timetable Scheduler</h1>
            <p class="srm-subtitle-3d">SRM Institute of Science and Technology • <span class="vdp-badge-3d">VADAPALANI</span> Campus</p>
        </div>
    </div>
</div>
""", unsafe_allow_html=True)

# 5. INITIALIZE STATE & DEFAULT PRESETS
if "faculty_registry_data" not in st.session_state:
    st.session_state.faculty_registry_data = [
        {"Faculty_ID": "MR", "Name": "Prof. MR", "Primary_Dept": "B.sc CS", "Qualified": "Python, Python Lab, AI", "Max_Daily": 4, "Max_Cons": 2},
        {"Faculty_ID": "VR", "Name": "Prof. VR", "Primary_Dept": "B.sc CS", "Qualified": "ML, ML Lab, Data Mining", "Max_Daily": 4, "Max_Cons": 2},
        {"Faculty_ID": "JP", "Name": "Dr. JP", "Primary_Dept": "BCA", "Qualified": "Project-c, Ethics, Signals & Systems", "Max_Daily": 4, "Max_Cons": 2},
        {"Faculty_ID": "JPS", "Name": "Prof. JPS", "Primary_Dept": "BCA", "Qualified": "Signals & Systems, Signals, Systems, Project-OOPS", "Max_Daily": 4, "Max_Cons": 2},
    ]

if "depts_curriculum" not in st.session_state:
    st.session_state.depts_curriculum = {
        "B.sc CS": [
            {"Subject": "Python", "Faculty": "MR", "Hours": 4, "Type": "Theory", "Category": "Core Theory"},
            {"Subject": "Python Lab", "Faculty": "MR", "Hours": 3, "Type": "Lab", "Category": "Lab"},
            {"Subject": "ML", "Faculty": "VR", "Hours": 3, "Type": "Theory", "Category": "Core Theory"},
            {"Subject": "ML Lab", "Faculty": "VR", "Hours": 3, "Type": "Lab", "Category": "Lab"},
        ],
        "BCA": [
            {"Subject": "Signals & Systems", "Faculty": "JPS", "Hours": 3, "Type": "Theory", "Category": "Core Theory"},
            {"Subject": "ML", "Faculty": "VR", "Hours": 3, "Type": "Theory", "Category": "Core Theory"}, # VR shared across departments!
            {"Subject": "Project-c", "Faculty": "JP", "Hours": 2, "Type": "Theory", "Category": "Core Theory"},
        ]
    }

if "combined_classes_data" not in st.session_state:
    st.session_state.combined_classes_data = [
        {
            "Subject": "Ethics in Tech",
            "Faculty": "JP",
            "ParticipatingDepts": ["B.sc CS", "BCA"],
            "Hours": 2,
            "Type": "Theory"
        }
    ]

# 6. MAIN NAVIGATION TABS
tab_staff, tab_depts, tab_combined, tab_results = st.tabs([
    "👤 Staff Registry",
    "🏢 Multi-Department Curriculums",
    "🔗 Combined Classes Config",
    "🚀 Institutional Timetable & Global State Matrix"
])

# ----------------------------------------------------
# TAB 1: STAFF REGISTRY & QUALIFICATIONS
# ----------------------------------------------------
with tab_staff:
    st.subheader("1. University Staff Registry & Qualification Engine")
    st.caption("Manage faculty profiles, qualified course mappings, daily contact limits, and continuous teaching break rules.")

    registry_df = pd.DataFrame(st.session_state.faculty_registry_data)
    edited_registry = st.data_editor(
        registry_df,
        num_rows="dynamic",
        use_container_width=True,
        column_config={
            "Faculty_ID": st.column_config.TextColumn("Faculty ID / Code", required=True),
            "Name": st.column_config.TextColumn("Faculty Name"),
            "Primary_Dept": st.column_config.TextColumn("Primary Department"),
            "Qualified": st.column_config.TextColumn("Qualified Subjects (Comma-Separated)"),
            "Max_Daily": st.column_config.NumberColumn("Max Daily Hours", min_value=1, max_value=8, default=4),
            "Max_Cons": st.column_config.NumberColumn("Max Continuous Hours (Rest Buffer)", min_value=1, max_value=4, default=2),
        },
        key="registry_editor"
    )

    st.session_state.faculty_registry_data = edited_registry.to_dict("records")

# ----------------------------------------------------
# TAB 2: MULTI-DEPARTMENT CURRICULUMS
# ----------------------------------------------------
with tab_depts:
    st.subheader("2. Institutional Operating Rules & Department Curriculums")

    c1, c2, c3, c4 = st.columns(4)
    with c1:
        working_days = st.number_input("Weekly Working Days", 1, 7, 4)
    with c2:
        hours_per_day = st.number_input("Daily Operating Hours", 1, 10, 6)
    with c3:
        break_option = st.selectbox("Institutional Lunch Break Slot", ["None", "Hour IV (Lunch)", "Hour III (Lunch)"], index=0)
    with c4:
        semester = st.selectbox("Current Semester", [1, 2, 3, 4, 5, 6, 7, 8], index=3)

    break_slot_map = {"None": None, "Hour IV (Lunch)": 3, "Hour III (Lunch)": 2}
    break_slot_idx = break_slot_map.get(break_option)

    st.divider()
    st.subheader("Department Curriculums Setup")

    available_faculties = [f["Faculty_ID"] for f in st.session_state.faculty_registry_data if f.get("Faculty_ID")]

    dept_names = list(st.session_state.depts_curriculum.keys())
    selected_dept = st.selectbox("Select Department to Configure", dept_names)

    if st.button("➕ Add New Department"):
        new_dept_name = f"Department {len(dept_names)+1}"
        st.session_state.depts_curriculum[new_dept_name] = []
        st.rerun()

    if selected_dept:
        st.markdown(f"#### Managing Curriculum for **{selected_dept}**")
        curr_list = st.session_state.depts_curriculum[selected_dept]
        
        dept_df = pd.DataFrame(curr_list) if curr_list else pd.DataFrame(columns=["Subject", "Faculty", "Hours", "Type", "Category"])
        
        # 1. Convert Staff Registry into DataFrame
        staff_registry_df = pd.DataFrame(st.session_state.faculty_registry_data)
        
        # 2. Extract qualified subjects strictly mapped to currently selected department
        dept_qualified_subjects = []
        if not staff_registry_df.empty:
            dept_col = "Primary_Dept" if "Primary_Dept" in staff_registry_df.columns else "Primary Department"
            qual_col = "Qualified" if "Qualified" in staff_registry_df.columns else "Qualified Subjects (Comma-Separated)"
            
            if dept_col in staff_registry_df.columns and qual_col in staff_registry_df.columns:
                # Filter staff registry strictly for faculty matching selected_dept
                dept_staff = staff_registry_df[
                    staff_registry_df[dept_col].astype(str).str.strip().str.lower() == selected_dept.strip().lower()
                ]
                # Extract and split comma-separated strings
                for qual_str in dept_staff[qual_col].dropna().astype(str):
                    for subj in qual_str.split(","):
                        subj_clean = subj.strip()
                        if subj_clean and subj_clean not in dept_qualified_subjects:
                            dept_qualified_subjects.append(subj_clean)

        # Preserve existing subjects already in department curriculum dataframe if any
        if not dept_df.empty and "Subject" in dept_df.columns:
            for s in dept_df["Subject"].dropna().tolist():
                s_clean = str(s).strip()
                if s_clean and s_clean not in dept_qualified_subjects:
                    dept_qualified_subjects.append(s_clean)

        edited_dept_df = st.data_editor(
            dept_df,
            num_rows="dynamic",
            use_container_width=True,
            column_config={
                "Subject": st.column_config.SelectboxColumn(
                    "Course Code / Name", 
                    options=dept_qualified_subjects, 
                    required=True
                ),
                "Faculty": st.column_config.SelectboxColumn("Assigned Faculty", options=available_faculties, required=True),
                "Hours": st.column_config.NumberColumn("Weekly Contact Hours", min_value=1, max_value=10, default=3),
                "Type": st.column_config.SelectboxColumn("Type", options=["Theory", "Lab"], default="Theory"),
                "Category": st.column_config.SelectboxColumn("Category", options=["Core Theory", "Elective Theory", "Lab"], default="Core Theory"),
            },
            key=f"dept_editor_{selected_dept}"
        )

        st.session_state.depts_curriculum[selected_dept] = edited_dept_df.to_dict("records")

# ----------------------------------------------------
# TAB 3: COMBINED CLASSES CONFIG
# ----------------------------------------------------
with tab_combined:
    st.subheader("3. Combined / Merged Multi-Department Sessions")
    st.caption("Schedule joint lectures where a single faculty teaches multiple department sections simultaneously in the exact same slot.")

    comb_df = pd.DataFrame(st.session_state.combined_classes_data)
    edited_comb_df = st.data_editor(
        comb_df,
        num_rows="dynamic",
        use_container_width=True,
        column_config={
            "Subject": st.column_config.TextColumn("Joint Course Name", required=True),
            "Faculty": st.column_config.SelectboxColumn("Assigned Faculty", options=available_faculties, required=True),
            "ParticipatingDepts": st.column_config.ListColumn("Participating Departments"),
            "Hours": st.column_config.NumberColumn("Weekly Contact Hours", min_value=1, max_value=6, default=2),
            "Type": st.column_config.SelectboxColumn("Type", options=["Theory", "Lab"], default="Theory"),
        },
        key="combined_editor"
    )

    st.session_state.combined_classes_data = edited_comb_df.to_dict("records")

# ----------------------------------------------------
# TAB 4: INSTITUTIONAL EXECUTION & RESULTS
# ----------------------------------------------------
with tab_results:
    if st.button("🚀 Generate University-Wide ERP Timetable", type="primary", use_container_width=True):
        # Build StaffRegistry object
        registry = StaffRegistry()
        for f in st.session_state.faculty_registry_data:
            f_id = f.get("Faculty_ID", "").strip()
            if f_id:
                quals = [q.strip() for q in str(f.get("Qualified", "")).split(",") if q.strip()]
                registry.add_faculty(FacultyMember(
                    faculty_id=f_id,
                    name=f.get("Name", f_id),
                    primary_dept=f.get("Primary_Dept", ""),
                    qualified_subjects=quals,
                    max_daily_hours=int(f.get("Max_Daily", 4)),
                    max_consecutive_hours=int(f.get("Max_Cons", 2))
                ))

        # Build departments_data dict
        departments_data = {}
        for d_name, sub_list in st.session_state.depts_curriculum.items():
            departments_data[d_name] = {
                "subject_data": sub_list,
                "break_slot_idx": break_slot_idx
            }

        # Instantiate Institutional Scheduler
        scheduler = InstitutionalScheduler(
            departments_data=departments_data,
            staff_registry=registry,
            combined_classes=st.session_state.combined_classes_data,
            working_days=int(working_days),
            hours_per_day=int(hours_per_day),
            use_day_orders=True
        )

        dept_timetables, conflicts, metrics = scheduler.generate_all()

        st.session_state.last_dept_timetables = dept_timetables
        st.session_state.last_conflicts = conflicts
        st.session_state.last_metrics = metrics
        st.session_state.last_global_matrix = scheduler.global_matrix

    if "last_dept_timetables" in st.session_state:
        dept_timetables = st.session_state.last_dept_timetables
        conflicts = st.session_state.last_conflicts
        metrics = st.session_state.last_metrics
        global_matrix = st.session_state.last_global_matrix

        m1, m2, m3, m4 = st.columns(4)
        with m1:
            st.metric(label="🏢 Total Departments", value=metrics["total_departments"])
        with m2:
            st.metric(label="👤 Faculty Matrix Tracked", value=metrics["total_faculty"])
        with m3:
            st.metric(label="⏱️ Total Allocated Hours", value=metrics["total_allocated_slots"])
        with m4:
            st.metric(label="📊 Institutional Capacity", value=metrics["total_institution_slots"])

        st.divider()
        st.markdown("### ⚠️ Institutional Conflict & Fatigue Diagnostics")
        if conflicts:
            st.markdown("""
            <div style="background-color: #450a0a; border: 1px solid #f87171; padding: 1rem 1.5rem; border-radius: 8px; border-left: 5px solid #ef4444; margin-bottom: 1.5rem;">
                <p style="color: #fca5a5; font-weight: 700; margin-top: 0;">Institutional Schedule Warnings / Qualification Alerts Identified:</p>
            </div>
            """, unsafe_allow_html=True)
            for conf in conflicts:
                st.markdown(f"- {conf}")
        else:
            st.markdown("""
            <div style="background-color: #052e16; border: 1px solid #4ade80; padding: 1rem 1.5rem; border-radius: 8px; border-left: 5px solid #22c55e; margin-bottom: 1.5rem;">
                <p style="color: #86efac; font-weight: 700; margin: 0; font-size: 1.05rem;">✅ Zero Cross-Department Double-Bookings Detected. Global Faculty Matrix State Verified with Rest Breaks Enforced.</p>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("### 🗓️ View Timetable Matrices")

        v_tab1, v_tab2, v_tab3 = st.tabs(["🏢 Department Class Grids", "👤 Global Faculty Master Matrix", "📈 Workload Analytics"])

        with v_tab1:
            selected_v_dept = st.selectbox("Select Department View", list(dept_timetables.keys()))
            if selected_v_dept in dept_timetables:
                st.dataframe(dept_timetables[selected_v_dept], use_container_width=True)

        with v_tab2:
            all_fac_ids = sorted(list(global_matrix.faculty_ids))
            selected_fac = st.selectbox("Select Faculty Master Schedule", all_fac_ids)
            if selected_fac:
                fac_df = global_matrix.to_dataframe(selected_fac)
                st.markdown(f"#### Master Schedule Matrix for **{selected_fac}** (Cross-Department View)")
                st.dataframe(fac_df, use_container_width=True)

        with v_tab3:
            dept_load = {d: m["allocated_slots"] for d, m in metrics["dept_metrics"].items()}
            chart_df = pd.DataFrame(list(dept_load.items()), columns=["Department", "Allocated Contact Hours"])
            st.bar_chart(chart_df.set_index("Department"), use_container_width=True)

        st.divider()
        st.markdown("### 📥 Branded Export Utility")

        col_ex1, col_ex2 = st.columns(2)

        with col_ex1:
            excel_bytes = export_to_excel(dept_timetables, global_matrix, metrics)
            st.download_button(
                label="📊 Download Multi-Sheet Excel Workbook (.xlsx)",
                data=excel_bytes,
                file_name=f"SRMIST_VDP_University_Timetable_Sem{semester}.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                use_container_width=True
            )

        with col_ex2:
            pdf_bytes = export_to_pdf(dept_timetables, "University ERP", semester, global_matrix)
            st.download_button(
                label="📄 Generate Formal PDF Institutional Report (.pdf)",
                data=pdf_bytes,
                file_name=f"SRMIST_VDP_University_Timetable_Sem{semester}.pdf",
                mime="application/pdf",
                use_container_width=True
            )
