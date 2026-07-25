import io
import re
import pandas as pd
from fpdf import FPDF

def sanitize_pdf_text(text):
    """
    Converts special unicode characters (dashes, quotes) to standard ASCII equivalents
    and strips non-Latin-1 characters (emojis) to prevent FPDFUnicodeEncodingException.
    """
    if text is None:
        return ""
    text = str(text)
    
    replacements = {
        '–': '-', '—': '-', '’': "'", '‘': "'",
        '“': '"', '”': '"', '…': '...', '•': '*'
    }
    for orig, repl in replacements.items():
        text = text.replace(orig, repl)
        
    return text.encode('latin-1', 'ignore').decode('latin-1')

def export_to_pdf(timetable_df_or_dict, department="Institutional ERP", semester="4", global_matrix=None):
    """
    Generates a formal PDF report.
    Supports either a single department DataFrame or a dictionary of multi-department DataFrames.
    Optionally appends faculty master schedule overview pages.
    """
    pdf = FPDF(orientation='L', unit='mm', format='A4')
    
    if isinstance(timetable_df_or_dict, pd.DataFrame):
        dept_dict = {department: timetable_df_or_dict}
    elif isinstance(timetable_df_or_dict, dict):
        dept_dict = timetable_df_or_dict
    else:
        dept_dict = {}

    for dept_name, df in dept_dict.items():
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=15)
        
        # Header Format
        pdf.set_font("Helvetica", 'B', 16)
        title = sanitize_pdf_text(f"SRMIST Vadapalani - {dept_name} (Semester {semester})")
        pdf.cell(0, 10, title, ln=True, align='C')
        
        pdf.set_font("Helvetica", 'I', 11)
        pdf.cell(0, 6, "Official Institutional Class Timetable", ln=True, align='C')
        pdf.ln(6)
        
        # Table Width Calculations
        num_cols = len(df.columns) + 1
        page_width = 270
        col_width = page_width / num_cols
        
        # Table Header Row
        pdf.set_font("Helvetica", 'B', 9)
        pdf.cell(col_width, 10, "Day / Hour", border=1, align='C')
        for col in df.columns:
            pdf.cell(col_width, 10, sanitize_pdf_text(col), border=1, align='C')
        pdf.ln()
        
        # Table Data Rows
        pdf.set_font("Helvetica", '', 8)
        for day, row in df.iterrows():
            pdf.cell(col_width, 12, sanitize_pdf_text(day), border=1, align='C')
            for cell in row:
                pdf.cell(col_width, 12, sanitize_pdf_text(cell), border=1, align='C')
            pdf.ln()

    # Append Global Faculty Schedules if provided
    if global_matrix and hasattr(global_matrix, 'faculty_ids'):
        for fac_id in sorted(list(global_matrix.faculty_ids)):
            fac_df = global_matrix.to_dataframe(fac_id)
            if fac_df.empty:
                continue
            pdf.add_page()
            pdf.set_font("Helvetica", 'B', 14)
            pdf.cell(0, 10, sanitize_pdf_text(f"Master Faculty Schedule: Prof./Dr. {fac_id}"), ln=True, align='C')
            pdf.set_font("Helvetica", 'I', 10)
            pdf.cell(0, 6, "Cross-Department Assignment Matrix", ln=True, align='C')
            pdf.ln(4)

            num_cols = len(fac_df.columns) + 1
            col_width = 270 / num_cols

            pdf.set_font("Helvetica", 'B', 9)
            pdf.cell(col_width, 10, "Day / Hour", border=1, align='C')
            for col in fac_df.columns:
                pdf.cell(col_width, 10, sanitize_pdf_text(col), border=1, align='C')
            pdf.ln()

            pdf.set_font("Helvetica", '', 8)
            for day, row in fac_df.iterrows():
                pdf.cell(col_width, 12, sanitize_pdf_text(day), border=1, align='C')
                for cell in row:
                    pdf.cell(col_width, 12, sanitize_pdf_text(cell), border=1, align='C')
                pdf.ln()

    return bytes(pdf.output())

def export_to_excel(timetable_df_or_dict, global_matrix=None, metrics=None):
    """
    Exports timetables to a multi-sheet Excel workbook.
    Supports single DataFrame or dictionary of department DataFrames, plus master matrix.
    """
    output = io.BytesIO()
    sheets_written = 0
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        if isinstance(timetable_df_or_dict, pd.DataFrame):
            timetable_df_or_dict.to_excel(writer, sheet_name="Timetable")
            sheets_written += 1
        elif isinstance(timetable_df_or_dict, dict):
            for dept_name, df in timetable_df_or_dict.items():
                safe_name = str(dept_name) if dept_name else "Department"
                safe_sheet_name = re.sub(r'[\:\\/\?\*\[\]]', '_', safe_name)[:31] or "Department"
                df.to_excel(writer, sheet_name=safe_sheet_name)
                sheets_written += 1

        if global_matrix and hasattr(global_matrix, 'faculty_ids'):
            for fac_id in sorted(list(global_matrix.faculty_ids)):
                fac_df = global_matrix.to_dataframe(fac_id)
                if not fac_df.empty:
                    safe_name = str(fac_id) if fac_id else "Faculty"
                    safe_sheet_name = re.sub(r'[\:\\/\?\*\[\]]', '_', f"Faculty_{safe_name}")[:31] or "Faculty"
                    fac_df.to_excel(writer, sheet_name=safe_sheet_name)
                    sheets_written += 1

        if metrics:
            summary_rows = [
                {"Metric": "Total Departments", "Value": metrics.get("total_departments", 1)},
                {"Metric": "Total Faculty Tracked", "Value": metrics.get("total_faculty", 0)},
                {"Metric": "Total Allocated Operating Hours", "Value": metrics.get("total_allocated_slots", 0)},
            ]
            pd.DataFrame(summary_rows).to_excel(writer, sheet_name="Institutional Diagnostics", index=False)
            sheets_written += 1

        if sheets_written == 0:
            pd.DataFrame({"Status": ["No data available"]}).to_excel(writer, sheet_name="Timetable", index=False)

    return output.getvalue()
