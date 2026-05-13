import pandas as pd
import random
import uuid
import numpy as np
import json
from datetime import datetime, timedelta

# Categorías reales establecidas
INTERESES = ["Música", "Cine", "Deporte", "Viajes", "Cocina", "Arte", "Yoga", "Gaming", "Fotografía", "Lectura"]
LIFESTYLE = ["No fumador", "Fumador", "Mascotas", "Noctámbulo", "Madrugador", "Trabajo desde casa", "Deportista", "Cocinero"]
CIUDADES = ["Bogotá", "Medellín", "Cali", "Barranquilla", "Bucaramanga", "Pereira", "Manizales"]
UNIVERSIDADES = [
    "Universidad Javeriana", "Universidad de los Andes", "Universidad Nacional", 
    "Universidad del Rosario", "Universidad Externado", "Universidad de la Sabana", 
    "EAFIT", "Universidad de Antioquia"
]
NOMBRES = ["Santi", "Juan", "Mafe", "Vale", "Andrés", "Sebas", "Dani", "Paula", "Cami", "Nico", "Mateo", "Sara", "Isa", "Luisa", "Diego"]
APELLIDOS = ["Gómez", "Rodríguez", "Martínez", "López", "Mendoza", "García", "Pérez", "Sánchez", "Ramírez", "Cruz", "Hernández"]

def format_postgres_array(items):
    """Convierte una lista de Python a formato de array de Postgres {val1,val2}"""
    # Escapamos comillas si fuera necesario, pero aquí son strings simples
    inner = ",".join(f'"{item}"' for item in items)
    return f"{{{inner}}}"

def generar_perfiles_masivos(n=2000):
    datos = []
    start_date = datetime(2023, 1, 1)
    
    for i in range(n):
        created_at = start_date + timedelta(days=random.randint(0, 400), minutes=random.randint(0, 1440))
        
        # Base budget
        base_budget = int(np.random.normal(1200000, 300000))
        if base_budget < 600000: base_budget = 650000
        
        # New Recommendation Params
        min_budget = max(0, base_budget - random.randint(100000, 300000))
        max_budget = base_budget + random.randint(100000, 500000)
        
        exclusion_rules = {
            "no_smokers": random.choice([True, False]),
            "pets_accepted": random.choice([True, False]),
            "same_gender": random.choice([True, False])
        }
        
        importance_weights = {
            "budget": round(random.uniform(0.0, 1.0), 2),
            "lifestyle": round(random.uniform(0.0, 1.0), 2),
            "interests": round(random.uniform(0.0, 1.0), 2),
            "personality": round(random.uniform(0.0, 1.0), 2)
        }

        perfil = {
            "id": str(uuid.uuid4()),
            "first_name": random.choice(NOMBRES),
            "last_name": random.choice(APELLIDOS),
            "email": f"user_{i}_{uuid.uuid4().hex[:4]}@test.com",
            "age": random.randint(18, 32),
            "job_title": random.choice(["Estudiante", "Practicante", "Freelancer", "Analista", "Creativo"]),
            "university_name": random.choice(UNIVERSIDADES),
            "city": random.choice(CIUDADES),
            "bio": f"¡Hola! Soy {random.choice(['estudiante', 'profesional'])} y busco una excelente convivencia.",
            "avatar_url": f"https://api.dicebear.com/7.x/avataaars/svg?seed=user_{i}",
            
            # Budgets
            "monthly_budget": base_budget,
            "min_budget": min_budget,
            "max_budget": max_budget,
            
            # Levels (Scale 1-10)
            "cleanliness_level": random.randint(1, 10),
            "social_level": random.randint(1, 10),
            
            # Arrays
            "interests": format_postgres_array(random.sample(INTERESES, random.randint(2, 5))),
            "lifestyle_tags": format_postgres_array(random.sample(LIFESTYLE, random.randint(2, 4))),
            "profile_images": format_postgres_array([f"https://picsum.photos/seed/user{i}/400/400"]),
            
            # JSONB
            "exclusion_rules": json.dumps(exclusion_rules),
            "importance_weights": json.dumps(importance_weights),
            
            # Metadata
            "user_mode": random.choices(["find-room", "find-roommate", "landlord"], weights=[60, 30, 10])[0],
            "profile_completed": True,
            "created_at": created_at.isoformat(),
            "updated_at": created_at.isoformat()
        }
            
        datos.append(perfil)
    return pd.DataFrame(datos)

# Generar
print("🚀 Generando 2,000 registros con nuevos parámetros de recomendación...")
df_2000 = generar_perfiles_masivos(2000)

# Guardar
output_path = 'perfiles/perfiles_simulados_2000.csv'
df_2000.to_csv(output_path, index=False, encoding='utf-8-sig')

print(f"✅ ¡Hecho! Se han generado {len(df_2000)} registros con el nuevo esquema en '{output_path}'.")
print("Validación de nulos:", df_2000.isnull().values.any())
