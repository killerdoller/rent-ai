import pandas as pd
import re
import os

def clean_to_float(text):
    if not text: return 0.0
    digits = re.sub(r'[^\d]', '', text)
    return float(digits) if digits else 0.0

def parse_txt_to_csv(input_path, output_path):
    # 1. Intentar cargar histórico o crear uno nuevo
    if os.path.exists(output_path):
        try:
            existing_df = pd.read_csv(output_path)
        except:
            existing_df = pd.DataFrame()
    else:
        existing_df = pd.DataFrame()

    if not os.path.exists(input_path):
        print(f"Error: No se encuentra el archivo {input_path}")
        return 0, 0

    with open(input_path, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f.readlines() if line.strip()]

    new_data = []
    
    # Recorremos las líneas buscando precios
    for i in range(len(lines)):
        if lines[i].startswith("$"):
            precio = clean_to_float(lines[i])
            
            # Filtro de seguridad: evitar precios absurdos
            if precio < 100000: continue

            # BUSCADOR: Miramos las siguientes 3 líneas para encontrar la descripción
            desc_completa = ""
            for j in range(1, 4): # Revisa línea i+1, i+2 e i+3
                if i + j < len(lines):
                    linea_revisada = lines[i+j]
                    # Si la línea tiene palabras clave de ubicación o tipo
                    if any(k in linea_revisada for k in ["Arriendo", "Bogotá", "D.C", "Apartamento", "Apartaestudio", "Casa"]):
                        desc_completa = linea_revisada
                        break
            
            if desc_completa:
                # Extraer zona (asumimos que está entre comas)
                parts = [p.strip() for p in desc_completa.split(',')]
                zona = parts[1] if len(parts) > 1 else "Centro"
                
                # Clasificación por tipo
                tipo = "Inmueble"
                if "Apartamento" in desc_completa: tipo = "Apartamento"
                elif "Apartaestudio" in desc_completa: tipo = "Apartaestudio"
                elif "Casa" in desc_completa: tipo = "Casa"

                new_data.append({
                    "precio canon": precio,
                    "zona": zona,
                    "tipo": tipo,
                    "descripcion": desc_completa,
                    "ciudad": "Bogotá"
                })

    if not new_data:
        print("No se encontraron anuncios válidos.")
        return 0, 0

    new_df = pd.DataFrame(new_data)
    
    if not existing_df.empty:
        final_df = pd.concat([existing_df, new_df], ignore_index=True)
    else:
        final_df = new_df

    # Limpiamos duplicados por precio y descripción
    final_df = final_df.drop_duplicates(subset=['precio canon', 'descripcion'])
    final_df.to_csv(output_path, index=False, encoding='utf-8-sig')
    
    return len(final_df), len(final_df) - len(existing_df)

if __name__ == "__main__":
    total, nuevos = parse_txt_to_csv("contenido_pagina_m2.txt", "apartamentos_m2_centro.csv")
    print(f"Proceso completado para MetroCuadrado...")
    print(f"- Total en CSV: {total}")
    print(f"- Nuevos agregados: {nuevos}")