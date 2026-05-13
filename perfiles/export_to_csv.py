import pandas as pd
import os
import re
import io

def export_json_to_csv():
    json_path = 'perfiles/perfiles.json'
    csv_path = 'perfiles/perfiles_data.csv'
    
    if not os.path.exists(json_path):
        print(f"Error: No se encontró {json_path}")
        return

    with open(json_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    match = re.search(r'[\{\[]', content)
    if not match:
        print("Error: No se encontró formato JSON válido.")
        return
        
    df = pd.read_json(io.StringIO(content[match.start():]))
    
    df.to_csv(csv_path, index=False, encoding='utf-8-sig')
    print(f"¡Éxito! Archivo creado en: {csv_path}")

if __name__ == "__main__":
    export_json_to_csv()
