import pandas as pd
import streamlit as st
from scheduler import generate_timetable
from utils import export_to_excel, export_to_pdf

# 1. PAGE SETUP
st.set_page_config(
    page_title="SRMIST Vadapalani - Timetable Scheduler",
    page_icon="📅",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# 2. BRANDING ASSETS
SRM_LOGO_URL = "https://www.srmistvdp.edu.in/uploads/51ba570fe68fc088e0a942bdf8700cdce7eb8b1d/1766992169SRMIST-Vadapalani.webp"

# 3. 3D METALLIC BLUE THEME & CUSTOM CSS
st.markdown("""
<style>
    /* Hide Streamlit Sidebar Completely */
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
        /* 3D Depth & Lighting Effects */
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

    /* High-Contrast Section Headings (Legible in Dark/Light themes) */
    h2, h3, h4 {
        color: #38bdf8 !important; /* Vivid Light Blue for readability */
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

    /* 3D Action Buttons */
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

    .stButton>button:active {
        transform: translateY(1px) !important;
        border-bottom: 1px solid #001a33 !important;
    }

    /* 3D Metric Cards */
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

# 4. 3D BANNER WITH ENLARGED SRM LOGO
st.markdown(f"""
<div class="srm-banner-3d">
    <div style="display: flex; align-items: center; gap: 2rem;">
        <div class="logo-3d-card">
            <img src="{SRM_LOGO_URL}" width="140px" style="display: block;">
        </div>
        <div>
            <h1 class="srm-title-3d">Smart Timetable Scheduler</h1>
            <p class="srm-subtitle-3d">SRM Institute of Science and Technology • <span class="vdp-badge-3d">VADAPALANI</span> Campus</p>
        </div>
    </div>
</div>
""", unsafe_allow_html=True)

# 5. MAIN NAVIGATION TABS
tab1, tab2 = st.tabs(["Setup & Configuration", "Live Timetable & Metrics"])

with tab1:
    st.subheader("1. Department Institutional Settings")
    c1, c2, c3, c4 = st.columns(4)
    with c1:
        department = st.text_input("Department Profile", "B.Tech Computer Science")
    with c2:
        semester = st.selectbox("Current Semester", [1, 2, 3, 4, 5, 6, 7, 8], index=3)
    with c3:
        working_days = st.number_input("Weekly Working Days", 1, 7, 5)
    with c4:
        hours_per_day = st.number_input("Daily Operating Hours", 1, 10, 6)

    st.divider()
    st.subheader("2. Subject & Lab Allocation (Input Grid)")
    
    num_subjects_col1, num_subjects_col2 = st.columns([1, 4])
    with num_subjects_col1:
        num_subjects = st.number_input("Count of Subjects / Labs", min_value=1, max_value=15, value=5)

    subject_data = []
    for i in range(num_subjects):
        st.markdown(f"#### Subject {i+1} Details")
        
        # Native Streamlit Bordered Container (Fixes white bar bug)
        with st.container(border=True):
            col1, col2, col3, col4 = st.columns(4)

            with col1:
                subject = st.text_input("Course Code / Name", key=f"subject_{i}", value=f"Course {i+1}")
            with col2:
                faculty = st.text_input("Assigned Faculty", key=f"faculty_{i}", value=f"Prof. {chr(65+i)}")
            with col3:
                hours = st.number_input("Weekly Contact Hours", 1, 10, 4 if i % 2 == 0 else 2, key=f"hours_{i}")
            with col4:
                stype = st.selectbox("Allocation Type", ["Theory", "Lab"], key=f"type_{i}", index=1 if i == 1 else 0)

        subject_data.append({"Subject": subject, "Faculty": faculty, "Hours": hours, "Type": stype})

    st.divider()
    st.subheader("3. Faculty Constraint Profiles")
    unique_faculties = sorted(list(set(s["Faculty"] for s in subject_data if s.get("Faculty"))))
    days_list = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][:working_days]

    faculty_availability = {}
    if unique_faculties:
        f_cols = st.columns(min(len(unique_faculties), 4))
        for idx, fac in enumerate(unique_faculties):
            with f_cols[idx % len(f_cols)]:
                with st.container(border=True):
                    st.write(f"👤 **{fac}**")
                    faculty_availability[fac] = {}
                    inner_days_col1, inner_days_col2 = st.columns([1, 1])
                    for day_idx, day in enumerate(days_list):
                        current_col = inner_days_col1 if day_idx % 2 == 0 else inner_days_col2
                        with current_col:
                            faculty_availability[fac][day] = st.checkbox(f"{day}", value=True, key=f"{fac}_{day}")

with tab2:
    if st.button("🚀 Generate Smart Institutional Timetable", type="primary", use_container_width=True):
        timetable, conflicts = generate_timetable(subject_data, working_days, hours_per_day, faculty_availability)

        # Metrics Row
        m1, m2, m3 = st.columns(3)
        total_slots = working_days * hours_per_day
        assigned_slots = (timetable != "FREE").sum().sum()

        with m1:
            st.metric(label="📊 Institutional Slot Capacity", value=total_slots, help="Weekly available operating hours")
        with m2:
            st.metric(label="⏱️ Weekly Allocated Hours", value=assigned_slots, help="Total scheduled hours including theory and lab")
        with m3:
            st.metric(label="⏳ Remaining FREE Slots", value=total_slots - assigned_slots, help="Available free hours in the schedule")

        # Conflict Detection Panel
        st.divider()
        st.markdown("### ⚠️ Constraint Conflict Detection")
        if conflicts:
            st.markdown("""
            <div style="background-color: #450a0a; border: 1px solid #f87171; padding: 1rem 1.5rem; border-radius: 8px; border-left: 5px solid #ef4444; margin-bottom: 1.5rem;">
                <p style="color: #fca5a5; font-weight: 700; margin-top: 0;">Constraint Violations Identified:</p>
            </div>
            """, unsafe_allow_html=True)
            for conf in conflicts:
                st.markdown(f"- {conf}")
        else:
            st.markdown("""
            <div style="background-color: #052e16; border: 1px solid #4ade80; padding: 1rem 1.5rem; border-radius: 8px; border-left: 5px solid #22c55e; margin-bottom: 1.5rem;">
                <p style="color: #86efac; font-weight: 700; margin: 0; font-size: 1.05rem;">✅ Optimized: Zero Schedule Violations Detected.</p>
            </div>
            """, unsafe_allow_html=True)

        # Timetable Grid
        st.markdown("### 🗓️ Generated Schedule Matrix")
        st.dataframe(timetable, use_container_width=True)

        # Export Utility
        st.divider()
        st.markdown("### 📥 Branded Export Utility")

        col_ex1, col_ex2 = st.columns(2)

        with col_ex1:
            excel_bytes = export_to_excel(timetable)
            st.download_button(
                label="📊 Download Final Excel (.xlsx)",
                data=excel_bytes,
                file_name=f"SRMIST_VDP_Timetable_{department}_Sem{semester}.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                use_container_width=True
            )

        with col_ex2:
            pdf_bytes = export_to_pdf(timetable, department, semester)
            st.download_button(
                label="📄 Generate Formal PDF Report (.pdf)",
                data=pdf_bytes,
                file_name=f"SRMIST_VDP_Timetable_{department}_Sem{semester}.pdf",
                mime="application/pdf",
                use_container_width=True
            )
