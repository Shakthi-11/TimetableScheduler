import pandas as pd
import streamlit as st
from scheduler import generate_timetable
from utils import export_to_excel, export_to_pdf

# 1. Page Configuration
st.set_page_config(
    page_title="SRMIST Vadapalani - Timetable Scheduler",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 2. Official SRMIST Vadapalani Logo URL
SRM_LOGO_URL = "https://www.srmistvdp.edu.in/uploads/51ba570fe68fc088e0a942bdf8700cdce7eb8b1d/1766992169SRMIST-Vadapalani.webp"

# 3. Custom CSS for SRM Branding (Navy Blue & Gold Accents)
st.markdown("""
<style>
    /* SRM Deep Navy Blue Header Banner */
    .srm-banner {
        background: linear-gradient(135deg, #003366 0%, #001a33 100%);
        padding: 1.25rem 1.75rem;
        border-radius: 12px;
        color: white;
        margin-bottom: 1.5rem;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
    }
    .srm-banner h1 {
        color: #ffffff !important;
        font-size: 2rem !important;
        font-weight: 700 !important;
        margin: 0 !important;
    }
    .srm-banner p {
        color: #ffcc00 !important;
        font-size: 0.95rem !important;
        margin-top: 4px !important;
        margin-bottom: 0 !important;
    }
    /* Card Container Styling for Subject Inputs */
    .subject-card {
        background-color: #f8f9fa;
        padding: 1rem;
        border-radius: 8px;
        border-left: 4px solid #003366;
        margin-bottom: 0.75rem;
    }
    /* Style Primary Buttons */
    .stButton>button {
        border-radius: 8px !important;
        font-weight: 600 !important;
    }
</style>
""", unsafe_allow_html=True)

# 4. Sidebar Branding
st.sidebar.image(SRM_LOGO_URL, use_container_width=True)
st.sidebar.markdown("---")
st.sidebar.subheader("📌 About Application")
st.sidebar.info(
    "Automated timetable generation system for SRMIST Vadapalani. "
    "Handles lab consecutive allocations, faculty availability, and conflict detection."
)

# 5. Header Section with Logo
col_logo, col_header = st.columns([1, 5])

with col_logo:
    st.image(SRM_LOGO_URL, width=130)

with col_header:
    st.markdown("""
        <div class="srm-banner">
            <h1>🎓 Smart Timetable Scheduler</h1>
            <p>SRM Institute of Science and Technology • Vadapalani Campus</p>
        </div>
    """, unsafe_allow_html=True)

# 6. Navigation Tabs
tab1, tab2 = st.tabs(["📝 Setup & Input", "📊 Dashboard & Schedule"])

with tab1:
    st.subheader("1. Department Settings")
    c1, c2, c3, c4 = st.columns(4)
    with c1:
        department = st.text_input("Department", "B.Tech Computer Science")
    with c2:
        semester = st.selectbox("Semester", [1, 2, 3, 4, 5, 6, 7, 8], index=3)
    with c3:
        working_days = st.number_input("Working Days / Week", 1, 7, 5)
    with c4:
        hours_per_day = st.number_input("Hours / Day", 1, 10, 6)

    st.divider()
    st.subheader("2. Subject & Lab Allocation")

    num_subjects = st.number_input("Number of Subjects / Labs", min_value=1, max_value=15, value=5)

    subject_data = []
    for i in range(num_subjects):
        st.markdown(f"##### Subject {i+1}")
        col1, col2, col3, col4 = st.columns(4)

        with col1:
            subject = st.text_input("Subject Name", key=f"subject_{i}", value=f"Course {i+1}")
        with col2:
            faculty = st.text_input("Faculty Assigned", key=f"faculty_{i}", value=f"Prof. {chr(65+i)}")
        with col3:
            hours = st.number_input("Weekly Hours", 1, 10, 4 if i % 2 == 0 else 2, key=f"hours_{i}")
        with col4:
            stype = st.selectbox("Type", ["Theory", "Lab"], key=f"type_{i}", index=1 if i == 1 else 0)

        subject_data.append({"Subject": subject, "Faculty": faculty, "Hours": hours, "Type": stype})

    st.divider()
    st.subheader("3. Faculty Availability")
    unique_faculties = sorted(list(set(s["Faculty"] for s in subject_data if s.get("Faculty"))))
    days_list = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][:working_days]

    faculty_availability = {}
    if unique_faculties:
        f_cols = st.columns(min(len(unique_faculties), 4))
        for idx, fac in enumerate(unique_faculties):
            with f_cols[idx % len(f_cols)]:
                st.write(f"👤 **{fac}**")
                faculty_availability[fac] = {}
                for day in days_list:
                    faculty_availability[fac][day] = st.checkbox(f"{day}", value=True, key=f"{fac}_{day}")

with tab2:
    if st.button("🚀 Generate Smart Timetable", type="primary", use_container_width=True):
        timetable, conflicts = generate_timetable(subject_data, working_days, hours_per_day, faculty_availability)

        # Top Metrics
        m1, m2, m3 = st.columns(3)
        total_slots = working_days * hours_per_day
        assigned_slots = (timetable != "FREE").sum().sum()

        m1.metric("Total Weekly Slots", total_slots)
        m2.metric("Scheduled Hours", assigned_slots)
        m3.metric("Free Slots", total_slots - assigned_slots)

        # Display Conflicts if any
        if conflicts:
            st.error("⚠️ Scheduling Conflicts Detected:")
            for conf in conflicts:
                st.write(f"- {conf}")
        else:
            st.success("✅ Zero Scheduling Conflicts Detected!")

        st.subheader("🗓️ Generated Schedule Grid")
        st.dataframe(timetable, use_container_width=True)

        st.divider()
        st.subheader("📥 Export Options")

        col_ex1, col_ex2 = st.columns(2)

        with col_ex1:
            excel_bytes = export_to_excel(timetable)
            st.download_button(
                label="📊 Download Excel (.xlsx)",
                data=excel_bytes,
                file_name=f"Timetable_{department}_Sem{semester}.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                use_container_width=True
            )

        with col_ex2:
            pdf_bytes = export_to_pdf(timetable, department, semester)
            st.download_button(
                label="📄 Download PDF Report (.pdf)",
                data=pdf_bytes,
                file_name=f"Timetable_{department}_Sem{semester}.pdf",
                mime="application/pdf",
                use_container_width=True
            )
