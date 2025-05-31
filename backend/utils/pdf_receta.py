import pdfplumber
import openpyxl

def pdf_to_excel(pdf_path, excel_path):
    # Crear archivo Excel
    workbook = openpyxl.Workbook()
    sheet = workbook.active
    sheet.title = "Texto PDF"
    sheet.append(["Página", "Texto"])

    # Abrir PDF y procesar página por página
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            text = page.extract_text()
            if text:
                lines = text.strip().split("\n")
                # Si hay más de una línea, eliminamos la última
                if len(lines) > 1:
                    lines = lines[:-1]
                processed_text = " ".join(lines)
            else:
                processed_text = ""
            
            sheet.append([i, processed_text])

    # Guardar Excel
    workbook.save(excel_path)
    print(f"Texto guardado en {excel_path}")

# Uso
pdf_path = '/Users/linqi/Downloads/transfer_92036_files_4b2c4082/Recetario_Grupo A.pdf'
       # Cambia por tu ruta de PDF
excel_path = "salidaA.xlsx"      # Nombre del Excel resultante
pdf_to_excel(pdf_path, excel_path)
