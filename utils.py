import io
import re
import pandas as pd
from fpdf import FPDF

def sanitize_pdf_text(text):
    """Strips emojis and non-Latin1 unicode characters that break FPDF fonts."""
    if not isinstance(text, str):
        text = str(text)
    # Remove emojis and non-standard unicode symbols
    clean = re.sub(r'[^\x00-\xFF]', '', text)
    return clean.strip()

def export_to_pdf(timetable_df, department="B.Tech CS", semester="4"):
    pdf = FPDF(orientation='L', unit='mm', format='A4')  # Landscape mode
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    
    # Title Header
    pdf.set_font("Helvetica", 'B', 16)
    title = sanitize_pdf_text(f"SRMIST Vadapalani - {department} (Semester {semester})")
    pdf.cell(0, 10, title, ln=True, align='C')
    
    pdf.set_font("Helvetica", 'I', 11)
    pdf.cell(0, 6, "Official Class Timetable", ln=True, align='C')
    pdf.ln(6)
    
    # Calculate column widths dynamically
    num_cols = len(timetable_df.columns) + 1
    page_width = 270  # A4 Landscape printable width
    col_width = page_width / num_cols
    
    # Table Header Row
    pdf.set_font("Helvetica", 'B', 9)
    pdf.cell(col_width, 10, "Day / Hour", border=1, align='C')
    for col in timetable_df.columns:
        pdf.cell(col_width, 10, sanitize_pdf_text(col), border=1, align='C')
    pdf.ln()
    
    # Data Rows
    pdf.set_font("Helvetica", '', 8)
    for day, row in timetable_df.iterrows():
        pdf.cell(col_width, 12, sanitize_pdf_text(day), border=1, align='C')
        for cell in row:
            pdf.cell(col_width, 12, sanitize_pdf_text(cell), border=1, align='C')
        pdf.ln()
        
    return bytes(pdf.output())

def export_to_excel(timetable_df):
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        timetable_df.to_excel(writer, sheet_name="Timetable")
    return output.getvalue()
