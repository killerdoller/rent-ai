import pandas as pd
import random
import uuid
from datetime import datetime

# Categorías reales establecidas
INTERESES = ["Música", "Cine", "Deporte", "Viajes", "Gaming", "Arte", "Lectura", "Yoga", "Cocina", "Fotografía"]
LIFESTYLE = ["No fumador", "Fumador", "Noctámbulo", "Madrugador", "Mascotas", "Cocinero", "Deportista", "Trabajo desde casa"]

def generar_perfiles_completos(n=5):
    datos = []
    ciudades = ["Bogotá", "Medellín", "Bucaramanga"]
    universidades = ["Pontificia Universidad Javeriana", "Universidad de los Andes", "Universidad Nacional"]
    
    for i in range(n):
        perfil = {
            "age": random.randint(18, 28),
            "avatar_url": f"https://api.dicebear.com/7.x/avataaars/svg?seed=user{i}",
            "bio": "Estudiante responsable buscando un ambiente tranquilo para estudiar y convivir.",
            "city": random.choice(ciudades),
            "cleanliness_level": random.randint(3, 5),
            "clerk_user_id": f"user_clerk_{uuid.uuid4().hex[:10]}",
            "created_at": datetime.now().isoformat(),
            "email": f"estudiante_simulado_{i}@uni.edu.co",
            "first_name": random.choice(["Andrés", "Mariana", "Felipe", "Laura", "Camilo"]),
            "has_co_debtor": random.choice([True, False]),
            "id": str(uuid.uuid4()),
            "interests": random.sample(INTERESES, random.randint(2, 4)),
            "job_title": random.choice(["Estudiante", "Pasante", "Monitor Académico"]),
            "last_name": random.choice(["Gómez", "Rodríguez", "Martínez", "López", "Mendoza"]),
            "lifestyle_tags": random.sample(LIFESTYLE, random.randint(2, 4)),
            "monthly_budget": random.randint(900000, 2500000),
            "phone": f"+57 310 {random.randint(1000000, 9999999)}",
            "profile_completed": True,
            "profile_images": [f"https://picsum.photos/seed/{random.randint(1,1000)}/400/400"],
            "semester": random.randint(1, 10),
            "social_level": random.randint(1, 5),
            "university_name": random.choice(universidades),
            "updated_at": datetime.now().isoformat(),
            "user_mode": random.choice(["find-room", "find-roommate"])
        }
        datos.append(perfil)
    return pd.DataFrame(datos)

# Crear archivo
df_final = generar_perfiles_completos(5)
df_final.to_csv('perfiles/perfiles_simulados_v2.csv', index=False, encoding='utf-8-sig')

print("¡Archivo de 24 columnas creado exitosamente!")
print(f"Número de variables: {len(df_final.columns)}")
print(f"¿Hay nulos?: {df_final.isnull().values.any()}")
