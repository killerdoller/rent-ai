import os
from supabase import create_client, Client
from dotenv import load_dotenv
import uuid
import random

load_dotenv('.env.local')

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("❌ Error: Faltan variables de entorno en .env.local")
    exit(1)

supabase: Client = create_client(url, key)

# CONFIGURACIÓN DEL EXPERIMENTO
OWNER_EMAIL = "santiagonassir3@gmail.com"

def seed_analytics_data():
    print(f"🚀 Iniciando inyección de datos para {OWNER_EMAIL}...")

    # 1. Obtener el ID del propietario (o crearlo si no existe en owners)
    # Primero buscamos en profiles por si acaso el usuario está ahí
    profile_res = supabase.table("profiles").select("id").eq("email", OWNER_EMAIL).maybe_single().execute()
    if not profile_res.data:
        print(f"❌ No se encontró el perfil con email {OWNER_EMAIL}. Regístrate primero en la app.")
        return
    
    owner_id = profile_res.data['id']
    print(f"✅ ID de Propietario identificado: {owner_id}")

    # 2. Asegurar que existe en la tabla 'owners' (necesario para el Dashboard)
    existing_owner = supabase.table("owners").select("owner_id").eq("email", OWNER_EMAIL).execute()
    if existing_owner.data:
        print(f"ℹ️ El propietario ya existe en la tabla owners.")
        owner_id = existing_owner.data[0]['owner_id']
    else:
        supabase.table("owners").insert({
            "owner_id": owner_id,
            "name": "Santiago Nassir (Admin Demo)",
            "email": OWNER_EMAIL
        }).execute()
        print(f"✅ Propietario creado en la tabla owners.")

    # 3. Crear una propiedad falsa (evitando duplicados si corres el script varias veces)
    property_title = "Apartamento Pro en Chapinero (Demo Stats)"
    try:
        existing_prop = supabase.table("properties").select("property_id").eq("title", property_title).execute()
        if existing_prop.data:
            property_id = existing_prop.data[0]['property_id']
            print(f"ℹ️ La propiedad demo ya existe.")
        else:
            raise Exception("No existe")
    except:
        property_id = str(uuid.uuid4())
        property_data = {
            "property_id": property_id,
            "owner_id": owner_id,
            "title": property_title,
            "monthly_rent": 1850000,
            "neighborhood": "Chapinero Alto",
            "city": "Bogotá",
            "description": "Increíble vista, perfecto para testing de analítica.",
            "image_url": "https://picsum.photos/seed/rentai1/800/600"
        }
        supabase.table("properties").insert(property_data).execute()
        print(f"✅ Propiedad demo creada.")

    # 4. Crear 15 Arrendatarios interesados con perfiles psicográficos variados
    print("👥 Generando 15 interesados artificiales...")
    for i in range(15):
        u_id = str(uuid.uuid4())
        u_email = f"tester_{i}_{u_id[:4]}@example.com"
        
        # Perfil psicográfico
        # Queremos que el radar se vea interesante, así que crearemos 3 grupos
        if i < 5: # Grupo "Limpios y Callados"
            clean = random.randint(8, 10)
            social = random.randint(1, 4)
            budget = random.randint(1500000, 2500000)
        elif i < 10: # Grupo "Sociales"
            clean = random.randint(4, 7)
            social = random.randint(7, 10)
            budget = random.randint(1200000, 1800000)
        else: # Grupo "Equilibrado"
            clean = random.randint(5, 8)
            social = random.randint(5, 8)
            budget = random.randint(1000000, 3000000)

        # Insertar Perfil
        supabase.table("profiles").insert({
            "id": u_id,
            "email": u_email,
            "first_name": f"Tester {i}",
            "cleanliness_level": clean,
            "social_level": social,
            "monthly_budget": budget,
            "user_mode": "find-room"
        }).execute()

        # Generar el LIKE
        supabase.table("property_likes").insert({
            "user_id": u_id,
            "property_id": property_id
        }).execute()

        # Generar algunos MATCHES (para el funnel)
        if i % 3 == 0: # 1 de cada 3 hace match
            supabase.table("property_matches").insert({
                "user_id": u_id,
                "property_id": property_id,
                "owner_id": owner_id,
                "match_score": random.randint(80, 98)
            }).execute()

    print("\n✨ ¡PROCESO COMPLETADO! ✨")
    print(f"Ahora puedes entrar a /owner/dashboard con {OWNER_EMAIL}")
    print("Deberías ver:")
    print("- 15 Likes en el Funnel")
    print("- ~5 Matches en el Funnel")
    print("- Un Gráfico de Radar con promedios reales")
    print("- Comparativa de precio con el mercado")

if __name__ == "__main__":
    seed_analytics_data()
