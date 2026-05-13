import pandas as pd
import random
import uuid

# Configuración de categorías reales establecidas
INTERESES_REALES = ["Música", "Cine", "Deporte", "Viajes", "Gaming", "Arte", "Lectura", "Yoga", "Cocina", "Fotografía"]
LIFESTYLE_TAGS_REALES = ["No fumador", "Fumador", "Noctámbulo", "Madrugador", "Mascotas", "Cocinero", "Deportista", "Trabajo desde casa"]
CIUDADES = ["Bogotá", "Medellín", "Bucaramanga", "Cali"]
UNIVERSIDADES = ["Pontificia Universidad Javeriana", "Universidad de los Andes", "Universidad Nacional", "Universidad del Rosario"]
MODOS = ["find-room", "find-roommate", "landlord"]
GENDER = ["Masculino", "Femenino", "No binario"]

def generar_perfiles(n=5):
    datos = []
    for i in range(n):
        perfil = {
            "id": str(uuid.uuid4()),
            "full_name": random.choice(["Andrés Felipe López", "Mariana Restrepo", "Juan Camilo García", "Valentina Torres", "Santiago Mendoza"]),
            "email": f"usuario_simulado_{i+1}@ejemplo.com",
            "age": random.randint(18, 26),
            "gender": random.choice(GENDER),
            "university": random.choice(UNIVERSIDADES),
            "city": random.choice(CIUDADES),
            "user_mode": random.choice(MODOS),
            "budget": random.randint(800000, 2500000),
            "bio": "Estudiante enfocado en sus estudios y con buena disposición para convivir.",
            "cleanliness_level": random.randint(3, 5),
            "social_level": random.randint(1, 5),
            # Elegimos muestras aleatorias de las etiquetas reales (entre 2 y 4 etiquetas)
            "lifestyle_tags": random.sample(LIFESTYLE_TAGS_REALES, random.randint(2, 4)),
            "interests": random.sample(INTERESES_REALES, random.randint(3, 5))
        }
        datos.append(perfil)
    
    return pd.DataFrame(datos)

# Generar y guardar
df_simulado = generar_perfiles(5)
# Usamos utf-8-sig para que los acentos en el CSV se vean bien en Excel/Windows
df_simulado.to_csv('perfiles/perfiles_simulados.csv', index=False, encoding='utf-8-sig')

print("¡Archivo 'perfiles/perfiles_simulados.csv' creado exitosamente sin nulos!")
print(df_simulado[['full_name', 'lifestyle_tags', 'interests']].to_string())
