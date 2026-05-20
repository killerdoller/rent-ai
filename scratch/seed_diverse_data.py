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

def seed_diverse_properties():
    print(f"🚀 Iniciando inyección de datos diversificados para {OWNER_EMAIL}...")

    # 1. Obtener el ID del propietario
    profile_res = supabase.table("profiles").select("id").eq("email", OWNER_EMAIL).maybe_single().execute()
    if not profile_res.data:
        print(f"❌ No se encontró el perfil con email {OWNER_EMAIL}.")
        return
    
    owner_id = profile_res.data['id']
    
    # 2. Asegurar que existe en la tabla 'owners'
    existing_owner = supabase.table("owners").select("owner_id").eq("email", OWNER_EMAIL).execute()
    if not existing_owner.data:
        supabase.table("owners").insert({
            "owner_id": owner_id,
            "name": "Santiago Nassir (Admin Demo)",
            "email": OWNER_EMAIL
        }).execute()
        print(f"✅ Propietario creado en la tabla owners.")
    else:
        owner_id = existing_owner.data[0]['owner_id']

    # 3. Crear Propiedad 2: Estudio en el Centro (Precio Bajo, Perfil Bohemio)
    prop2_id = str(uuid.uuid4())
    prop2_data = {
        "property_id": prop2_id,
        "owner_id": owner_id,
        "title": "Estudio Bohemio en La Candelaria",
        "monthly_rent": 950000,
        "neighborhood": "La Candelaria",
        "city": "Bogotá",
        "description": "Estilo colonial, cerca a universidades y vida nocturna.",
        "image_url": "https://picsum.photos/seed/rentai2/800/600"
    }
    supabase.table("properties").insert(prop2_data).execute()
    print(f"✅ Propiedad 2 creada: La Candelaria ($950.000)")

    # 3. Crear Propiedad 3: Penthouse en Cedritos (Precio Alto, Perfil Ejecutivo)
    prop3_id = str(uuid.uuid4())
    prop3_data = {
        "property_id": prop3_id,
        "owner_id": owner_id,
        "title": "Penthouse Moderno en Cedritos",
        "monthly_rent": 3200000,
        "neighborhood": "Cedritos",
        "city": "Bogotá",
        "description": "Acabados de lujo, gimnasio y zona BBQ.",
        "image_url": "https://picsum.photos/seed/rentai3/800/600"
    }
    supabase.table("properties").insert(prop3_data).execute()
    print(f"✅ Propiedad 3 creada: Cedritos ($3.200.000)")

    # 4. Generar Interesados para la Propiedad 2 (Bohemio: Social alto, Limpieza media, Presupuesto bajo)
    print("👥 Generando interesados para La Candelaria...")
    for i in range(12):
        u_id = str(uuid.uuid4())
        supabase.table("profiles").insert({
            "id": u_id,
            "email": f"bohemio_{i}_{u_id[:4]}@demo.com",
            "first_name": f"Inquilino Bohemio {i}",
            "cleanliness_level": random.randint(3, 6),
            "social_level": random.randint(8, 10),
            "monthly_budget": random.randint(800000, 1200000),
            "user_mode": "find-room"
        }).execute()
        supabase.table("property_likes").insert({"user_id": u_id, "property_id": prop2_id}).execute()
        if i % 4 == 0:
            supabase.table("property_matches").insert({"user_id": u_id, "property_id": prop2_id, "owner_id": owner_id, "match_score": random.randint(70, 90)}).execute()

    # 5. Generar Interesados para la Propiedad 3 (Ejecutivo: Limpieza alta, Social medio-bajo, Presupuesto alto)
    print("👥 Generando interesados para Cedritos...")
    for i in range(8):
        u_id = str(uuid.uuid4())
        supabase.table("profiles").insert({
            "id": u_id,
            "email": f"exec_{i}_{u_id[:4]}@demo.com",
            "first_name": f"Inquilino Ejecutivo {i}",
            "cleanliness_level": random.randint(8, 10),
            "social_level": random.randint(2, 5),
            "monthly_budget": random.randint(3000000, 5000000),
            "user_mode": "find-room"
        }).execute()
        supabase.table("property_likes").insert({"user_id": u_id, "property_id": prop3_id}).execute()
        if i % 2 == 0:
            supabase.table("property_matches").insert({"user_id": u_id, "property_id": prop3_id, "owner_id": owner_id, "match_score": random.randint(90, 99)}).execute()

    print("\n✨ ¡DIVERSIFICACIÓN COMPLETADA! ✨")
    print("Ahora en tu dashboard verás perfiles totalmente opuestos al cambiar de propiedad.")

if __name__ == "__main__":
    seed_diverse_properties()
