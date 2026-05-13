import pandas as pd
import json
import re
import io
import os
import numpy as np

def load_data():
    path = 'perfiles/perfiles.json'
    if not os.path.exists(path):
        return None
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    match = re.search(r'[\{\[]', content)
    if not match:
        return None
    return pd.read_json(io.StringIO(content[match.start():]))

df = load_data()

if df is not None:
    print("--- ANÁLISIS DETALLADO POR VARIABLE ---")
    for col in df.columns:
        print(f"\nVARIABLE: {col}")
        non_null = df[col].count()
        completeness = (non_null / len(df)) * 100
        print(f"Tipo: {df[col].dtype}")
        print(f"Completitud: {completeness:.1f}%")
        
        # Diferenciar entre numéricas y categóricas
        if pd.api.types.is_numeric_dtype(df[col]):
            print(f"Media: {df[col].mean():.2f}")
            print(f"Mínimo: {df[col].min()}")
            print(f"Máximo: {df[col].max()}")
        else:
            unique_count = df[col].nunique()
            print(f"Valores únicos: {unique_count}")
            if unique_count < 12:
                print("Distribución:")
                print(df[col].value_counts().to_string())
            else:
                print(f"Ejemplos: {df[col].dropna().head(3).tolist()}")
else:
    print("No se pudo cargar el DataFrame.")
