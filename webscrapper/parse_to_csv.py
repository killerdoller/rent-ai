import pandas as pd
import re

def clean_to_float(text):
    if not text or pd.isna(text) or "Sin especificar" in text:
        return 0.0
    # Extraemos solo los dígitos (quitamos $, puntos, comas y texto)
    digits = re.sub(r'[^\d]', '', text)
    return float(digits) if digits else 0.0

def extract_number(text):
    if not text:
        return 0
    match = re.search(r'(\d+)', text)
    return int(match.group(1)) if match else 0

def parse_location(text):
    if not text or "Apartamento en" not in text:
        return "N/A", "Bogotá"
    
    # Ejemplo: "Apartamento en Chapinero, Bogotá, Bogotá, d.c."
    clean = text.replace("Apartamento en ", "")
    parts = [p.strip() for p in clean.split(',')]
    
    zona = parts[0] if len(parts) > 0 else "N/A"
    ciudad = parts[1] if len(parts) > 1 else "Bogotá"
    
    return zona, ciudad

def parse_txt_to_csv(input_path, output_path):
    # 1. Cargamos el histórico si existe
    existing_df = pd.DataFrame()
    if os.path.exists(output_path):
        existing_df = pd.read_csv(output_path)
        print(f"Base de datos actual: {len(existing_df)} apartamentos.")

    with open(input_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Dividimos por el patrón del contador de fotos o los delimitadores de página que agregamos
    blocks = re.split(r'\n[0-9]+ / [0-9]+\n|--- INICIO PAGINA [0-9]+ ---', content)
    new_apartments_data = []
    
    for block in blocks:
        lines = [l.strip() for l in block.split('\n') if l.strip()]
        if not lines or "FIN PAGINA" in lines[0]:
            continue
            
        data = {
            "inmobiliaria": "N/A",
            "precio canon": 0.0,
            "administracion": 0.0,
            "zona": "N/A",
            "ciudad": "Bogotá",
            "habitaciones": 0,
            "baños": 0,
            "metros_cuadrados": 0.0,
            "descripcion": "N/A"
        }
        
        idx = 0
        while idx < len(lines) and lines[idx] in ["DESTACADO", "BAJÓ DE PRECIO", "OPORTUNIDAD"]:
            idx += 1
            
        if idx < len(lines) and not lines[idx].startswith("$") and "Apartamento" not in lines[idx]:
            data["inmobiliaria"] = lines[idx]
            idx += 1
            
        raw_location = ""
        while idx < len(lines):
            line = lines[idx]
            if "$" in line:
                if "admin" in line.lower():
                    data["administracion"] = clean_to_float(line)
                else:
                    data["precio canon"] = clean_to_float(line)
            elif any(term in line for term in ["Habs", "Baño", "m²", "Hab"]):
                break
            elif "Apartamento en" in line:
                raw_location = line
            idx += 1

        data["zona"], data["ciudad"] = parse_location(raw_location)

        while idx < len(lines):
            line = lines[idx]
            if "Hab" in line:
                data["habitaciones"] = extract_number(line)
            elif "Baño" in line:
                data["baños"] = extract_number(line)
            elif "m²" in line:
                area_text = line.replace("m²", "").strip()
                try:
                    data["metros_cuadrados"] = float(area_text.replace(",", "."))
                except:
                    data["metros_cuadrados"] = 0.0
            else:
                break
            idx += 1

        desc_lines = []
        for i in range(idx, len(lines)):
            if any(term in lines[i] for term in ["Contactar", "Llamar", "Whatsapp", "--- FIN PAGINA"]):
                break
            desc_lines.append(lines[i])
        
        data["descripcion"] = " ".join(desc_lines)
        if data["precio canon"] > 0:
            new_apartments_data.append(data)

    new_df = pd.DataFrame(new_apartments_data)
    
    if existing_df.empty:
        final_df = new_df
    else:
        # Combinamos y eliminamos duplicados basándonos en columnas clave
        # Un apartamento se considera duplicado si tiene mismo precio, zona, habs y descripción parcial
        final_df = pd.concat([existing_df, new_df], ignore_index=True)
        # Usamos un subset de columnas para identificar duplicados reales
        # La descripción es muy larga, así que usamos los primeros 50 caracteres para comparar
        final_df['desc_short'] = final_df['descripcion'].str[:50]
        final_df = final_df.drop_duplicates(subset=['precio canon', 'zona', 'habitaciones', 'metros_cuadrados', 'desc_short'])
        final_df = final_df.drop(columns=['desc_short'])

    final_df.to_csv(output_path, index=False, encoding='utf-8-sig')
    return len(final_df), len(final_df) - len(existing_df)

if __name__ == "__main__":
    import os
    total, nuevos = parse_txt_to_csv("contenido_pagina.txt", "apartamentos_analizados_centro.csv")
    print(f"Proceso completado:")
    print(f"- Total en base de datos: {total}")
    print(f"- Nuevos agregados: {nuevos}")
