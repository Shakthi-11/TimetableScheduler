import io
from fpdf import FPDF
import pandas as pd


def export_to_excel(timetable_df):
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        timetable_df.to_excel(writer, sheet_name="Timetable")
    return output.getvalue()


def export_to_pdf(timetable_df, department, semester):
    pdf = FPDF(orientation="L", unit="mm", format="A4")
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)

    # Header
    pdf.cell(0, 10, f"Timetable - {department} (Semester {semester})", ln=True, align="C")
    pdf.set_font("Helvetica", "", 10)
    pdf.ln(5)

    # Table layout dimensions
    col_width = 270 / (len(timetable_df.columns) + 1)
    row_height = 12

    # Headers (Days / Hours)
    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(col_width, row_height, "Day / Hour", border=1, align="C")
    for col in timetable_df.columns:
        pdf.cell(col_width, row_height, str(col), border=1, align="C")
    pdf.ln(row_height)

    # Table Rows
    pdf.set_font("Helvetica", "", 7)
    for day, row in timetable_df.iterrows():
        pdf.cell(col_width, row_height, str(day), border=1, align="C")
        for val in row:
            clean_text = str(val).replace("\n", " | ")
            pdf.cell(col_width, row_height, clean_text, border=1, align="C")
        pdf.ln(row_height)

    return pdf.output()