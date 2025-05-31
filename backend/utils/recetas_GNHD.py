import re
import json
import pdfplumber


def texto_a_numero(texto):
    texto = texto.lower().strip()
    mapa = {
        "uno": 1, "una": 1,
        "dos": 2,
        "tres": 3,
        "cuatro": 4,
        "cinco": 5,
        "seis": 6,
        "siete": 7,
        "ocho": 8,
        "nueve": 9,
        "diez": 10
    }
    return mapa.get(texto)


def extract_recetas_from_pdf(pdf_path):
    recetas = []
    categoria_actual = None

    with pdfplumber.open(pdf_path) as pdf:
        pages = pdf.pages
        total = len(pages)
        i = 0

        while i < total:
            text1 = pages[i].extract_text() or ''
            lines1 = text1.split('\n')
            clean_lines1 = [l.strip() for l in lines1 if l.strip()]

            if len(clean_lines1) == 1 and re.match(r'^\d+\.', clean_lines1[0]):
                categoria_actual = clean_lines1[0]
                i += 1
                continue

            if i == total - 1 and len(clean_lines1) == 1:
                break

            if i + 1 >= total:
                break

            lines1 = lines1[:-1] if len(lines1) > 1 else lines1
            combo_lines = lines1.copy()

            text2 = pages[i + 1].extract_text() or ''
            lines2 = text2.split('\n')
            new_lines2 = []
            found_marker = False
            for idx, line in enumerate(lines2):
                if 'Cantidad Comentario nutricional:' in line or re.search(r'\bINGREDIENTES\b', line, re.IGNORECASE):
                    new_lines2 = lines2[idx:-1]
                    found_marker = True
                    break
            if not found_marker and len(lines2) > 1:
                new_lines2 = lines2[1:-1]

            combo_lines += new_lines2
            full_text = '\n'.join(combo_lines)
            title = combo_lines[0].strip()

            ingredientes = []
            ingredientes_set = set()
            n_dinners = None

            def extraer_ingredientes(desde_lineas):
                nonlocal n_dinners
                encontrados = []
                capturando = False
                for ln in desde_lineas:
                    texto = re.sub(r'\(\d+\)', '', ln).strip()
                    if not texto:
                        continue
                    if re.search(r'\bINGREDIENTES\b', texto, re.IGNORECASE):
                        m = re.search(r'(?:\(.*?(\d+)\s*(?:persona|personas|raciones|comensales)?\))', texto.lower()) or \
                            re.search(r'para\s+(\d+)\s*(?:persona|personas|raciones|comensales)?', texto.lower()) or \
                            re.search(r'ingredientes[:\s]*(\d+)', texto.lower()) or \
                            re.search(r'para\s+(\w+)', texto.lower())

                        if m:
                            try:
                                val = m.group(1)
                                if val.isdigit():
                                    n_dinners = int(val)
                                else:
                                    n_dinners = texto_a_numero(val)
                            except:
                                n_dinners = None

                        capturando = True
                        continue
                    if capturando:
                        if re.match(r'^(ELABORACI\u00d3N|PREPARACI\u00d3N|Cantidad|\d+\.|[A-Z])', texto, re.IGNORECASE):
                            break
                        if texto[0] in ('-', '•', '·') or texto[0].isdigit():
                            ingrediente = texto.lstrip('-•· ').strip()
                            if ingrediente and ingrediente.lower() not in ingredientes_set:
                                encontrados.append(ingrediente)
                                ingredientes_set.add(ingrediente.lower())
                        elif re.match(r'^\d+\s?g', texto):
                            if texto.lower() not in ingredientes_set:
                                encontrados.append(texto)
                                ingredientes_set.add(texto.lower())
                        else:
                            if texto.lower() not in ingredientes_set:
                                encontrados.append(texto)
                                ingredientes_set.add(texto.lower())
                return encontrados

            ingredientes += extraer_ingredientes(lines1)
            ingredientes += extraer_ingredientes(new_lines2)
            n_ingredients = len(ingredientes)

            steps = []
            elab_match = re.search(r'(ELABORACI\u00d3N|PREPARACI\u00d3N)\n(.*?)(?=\n(Cantidad|INGREDIENTES))', full_text, re.S | re.IGNORECASE)
            if elab_match:
                raw_text = elab_match.group(2)
                raw_lines = raw_text.split('\n')
                current_step = ''
                for ln in raw_lines:
                    stripped = ln.strip()
                    if not stripped or stripped.lower() in ingredientes_set:
                        continue
                    if re.match(r'^(\d+\.|\d+\u00ba|•|●|○|-|◦)', stripped):
                        if current_step:
                            steps.append(current_step.strip())
                        current_step = stripped
                    else:
                        current_step += ' ' + stripped
                if current_step:
                    steps.append(current_step.strip())
                n_steps = len(steps)
            else:
                n_steps = 0

            description = ''
            nutritional_info = {}
            
            patrones = {
                'energy_kcal': r'energ[\u00eda]a.*?(\d+[\.,]\d+)',
                'vitamin_a_ug': r'vit[\.\s]?a.*?(\d+[\.,]\d+)',
                'vitamin_c_mg': r'vit[\.\s]?c.*?(\d+[\.,]\d+)',
                'vitamin_b3_mg': r'(vit[\.\s]?b3|niacina).*?(\d+[\.,]\d+)',
                'vitamin_b1_mg': r'vit[\.\s]?b1.*?(\d+[\.,]\d+)',
                'vitamin_b9_ug': r'(vit[\.\s]?b9|[\u00e1a]cido f[\u00f3o]lico).*?(\d+[\.,]\d+)',
                'vitamin_e_mg': r'vit[\.\s]?e.*?(\d+[\.,]\d+)',
                'proteins_g': r'prote[\u00edi]nas.*?(\d+[\.,]\d+)',
                'carbohydrates_g': r'\bhc\b.*?(\d+[\.,]\d+)',
                'fiber_g': r'fibra.*?(\d+[\.,]\d+)',
                'fats_g': r'grasas.*?(\d+[\.,]\d+)',
                'cholesterol_mg': r'colesterol.*?(\d+[\.,]\d+)',
                'calcium_mg': r'calcio.*?(\d+[\.,]\d+)',
                'phosphorus_mg': r'(f[o\u00f3]sforo|fosforo).*?(\d+[\.,]\d+)',
                'potassium_mg': r'potasio.*?(\d+[\.,]\d+)',
                'sodium_mg': r'(sodio|mineral\s*na).*?(\d+[\.,]\d+)',
                'magnesium_mg': r'magnesio.*?(\d+[\.,]\d+)'
            }
            for key, pattern in patrones.items():
                match = re.search(pattern, full_text, re.IGNORECASE)
                if match:
                    nutritional_info[key] = float(match.group(1).replace(',', '.')) if len(match.groups()) == 1 else float(match.group(2).replace(',', '.'))

            receta = {
                'title': title,
                'category': categoria_actual,
                'n_dinners': n_dinners,
                'n_ingredients': n_ingredients,
                'ingredients': ingredientes,
                'steps': steps,
                'n_steps': n_steps,
                'description': description,
                'nutritional_info': nutritional_info,
                'language_ISO': 'ES',
                'origin_ISO': 'ESP',
                'source': 'Estudiantes de Principios de Dietética 3º GNHD (Grupo A) Curso académico 2024-25'
            }

            if not ingredientes:
                print(f"\u26a0\ufe0f Ingredientes vacíos en: {title}")
            if not steps:
                print(f"\u26a0\ufe0f Pasos vacíos en: {title}")
            if not nutritional_info:
                print(f"⚠️ Información nutricional vacía en: {title}")

            recetas.append(receta)
            i += 2

    return recetas

if __name__ == '__main__':
    pdf_path = '/Users/linqi/Downloads/transfer_92036_files_4b2c4082/Recetario_Grupo C.pdf'
    recetas = extract_recetas_from_pdf(pdf_path)
    with open('recetas.json', 'w', encoding='utf-8') as f:
        json.dump(recetas, f, ensure_ascii=False, indent=2)
    print(f"Extraídas {len(recetas)} recetas y guardadas en recetas.json")
