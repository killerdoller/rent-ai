import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv('.env.local')

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("❌ Error: Faltan variables de entorno en .env.local")
    exit(1)

supabase: Client = create_client(url, key)

def check_db():
    print("🔍 Verificando estado de la base de datos...")
    
    # Check profiles
    try:
        profiles = supabase.table("profiles").select("count", count="exact").execute()
        print(f"✅ Tabla 'profiles': {profiles.count} registros")
    except Exception as e:
        print(f"❌ Error en tabla 'profiles': {e}")

    # Check owners
    try:
        owners = supabase.table("owners").select("count", count="exact").execute()
        print(f"✅ Tabla 'owners': {owners.count} registros")
    except Exception as e:
        print(f"❌ Error en tabla 'owners': {e}")

    # Check Trigger notify_ai
    try:
        triggers = supabase.rpc("inspect_triggers").execute()
        print(f"✅ Triggers: {triggers.data}")
    except:
        # Si no existe la función RPC, intentamos query directo si tenemos permisos (complicado via SDK)
        print("ℹ️ No se pudo verificar triggers via RPC (es normal si no existe la función)")

if __name__ == "__main__":
    check_db()
