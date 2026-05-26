"""
scraper_to_supabase.py
Scrape apartments from Finca Raiz, upload ALL images to Supabase Storage,
and insert properties into the 'properties' table.

Usage:
    python scraper_to_supabase.py --url "..." --owner_id "demo@rentai.com"

    --owner_id accepts either:
      - A real UUID already in the owners table
      - An email address → the script creates the owner automatically if it doesn't exist

Environment variables required (.env file in this folder):
    SUPABASE_URL=https://xxxx.supabase.co
    SUPABASE_SERVICE_ROLE_KEY=eyJ...
"""

import asyncio
import json
import os
import re
import uuid
import argparse
import httpx
from playwright.async_api import async_playwright
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
BUCKET = "property-images"


def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def resolve_owner_id(supabase: Client, owner_id_or_email: str) -> str:
    """
    If owner_id_or_email looks like an email, find or create the owner and return its UUID.
    If it's already a UUID, verify it exists and return it as-is.
    """
    is_email = "@" in owner_id_or_email

    if is_email:
        email = owner_id_or_email
        result = supabase.table("owners").select("owner_id").eq("email", email).limit(1).execute()
        if result and hasattr(result, "data") and len(result.data) > 0:
            oid = result.data[0]["owner_id"]
            print(f"[owner] Owner existente encontrado: {oid}")
            return oid
            
        created = supabase.table("owners").insert({
            "name": "Demo Owner (Scraper)",
            "email": email,
        }).execute()
        oid = created.data[0]["owner_id"]
        print(f"[owner] Owner creado: {oid}")
        return oid
    else:
        result = supabase.table("owners").select("owner_id").eq("owner_id", owner_id_or_email).limit(1).execute()
        if not result or not hasattr(result, "data") or len(result.data) == 0:
            raise ValueError(
                f"No existe ningún owner con id '{owner_id_or_email}'. "
                "Pasa un email para crear uno automáticamente, ej: --owner_id tu@email.com"
            )
        return owner_id_or_email



# Números escritos en español → dígito
_WORD_TO_NUM = {
    "dos": 2, "tres": 3, "cuatro": 4, "cinco": 5,
    "seis": 6, "siete": 7, "ocho": 8, "nueve": 9, "diez": 10,
}

# Localidades canónicas de Bogotá. La lista debe coincidir con la de
# src/flow/components/CompleteProfile.tsx para que `desired_localities` en
# el perfil del inquilino haga match con `properties.localidad`.
_LOCALIDADES_CANONICAS = [
    "Usaquén", "Chapinero", "Santa Fe", "San Cristóbal", "Usme", "Tunjuelito",
    "Bosa", "Kennedy", "Fontibón", "Engativá", "Suba", "Barrios Unidos",
    "Teusaquillo", "Los Mártires", "Antonio Nariño", "Puente Aranda",
    "La Candelaria", "Rafael Uribe Uribe", "Ciudad Bolívar", "Sumapaz",
]


def _strip_accents(s: str) -> str:
    """Para comparar 'Engativá' con 'engativa', 'Chapinero' con 'CHAPINERO', etc."""
    import unicodedata
    return "".join(
        c for c in unicodedata.normalize("NFD", s)
        if unicodedata.category(c) != "Mn"
    ).lower()


# Catálogo de barrios canónicos por localidad. Mantener en sync con
# src/utils/bogotaZones.ts y scripts/backfill-neighborhoods.mjs.
#
# FincaRaíz rara vez expone el barrio en el JSON estructurado — `location_main`
# trae la LOCALIDAD. El barrio sí está en el texto del título y/o descripción.
# Aquí buscamos coincidencias contra esta lista canónica.
_NEIGHBORHOODS_BY_LOCALITY = {
    "Usaquén": ["Santa Bárbara", "Country Club", "Cedritos", "Toberín", "San Cristóbal Norte", "Verbenal", "Usaquén Centro", "Bella Suiza", "Santa Ana", "La Carolina", "Lijacá", "Country Sur"],
    "Chapinero": ["El Chicó", "El Nogal", "El Refugio", "El Retiro", "La Cabrera", "Los Rosales", "Quinta Camacho", "Chapinero Central", "Chapinero Alto", "La Salle", "El Castillo", "Antiguo Country", "La Porciúncula", "Sucre", "Pardo Rubio", "Marly", "San Luis", "Bellavista"],
    "Santa Fe": ["La Macarena", "La Perseverancia", "Las Aguas", "Santa Fe Centro", "Bosque Izquierdo", "Cruces", "Las Nieves"],
    "San Cristóbal": ["20 de Julio", "La Victoria", "San Blas", "Sosiego", "Velódromo", "La Gloria", "Altamira"],
    "Usme": ["Usme Centro", "La Esperanza", "Yomasa", "Comuneros", "Danubio", "Gran Yomasa"],
    "Tunjuelito": ["Tunjuelito Centro", "Venecia", "Tunal", "Muzú", "San Carlos"],
    "Bosa": ["Bosa Centro", "Bosa La Estación", "Apogeo", "Porvenir", "Holanda", "El Recreo"],
    "Kennedy": ["Castilla", "Banderas", "Kennedy Central", "Patio Bonito", "Tintal", "Timiza", "Class", "Marsella", "Britalia"],
    "Fontibón": ["Fontibón Centro", "Modelia", "Hayuelos", "Versalles", "Capellanía", "Ciudad Hayuelos", "El Refugio"],
    "Engativá": ["Boyacá Real", "Bolivia", "La Granja", "Engativá Centro", "Las Ferias", "Bellavista", "Florida", "Villa Luz", "Normandía"],
    "Suba": ["Niza", "Mazurén", "Britalia", "Pinar de Suba", "Suba Centro", "Tibabuyes", "Salitre Norte", "El Rincón", "Aures", "La Campiña", "La Carolina", "Casa Blanca"],
    "Barrios Unidos": ["Polo Club", "Los Andes", "La Castellana", "La Patria", "Modelo", "Once de Noviembre", "Alcázares", "Concepción Norte"],
    "Teusaquillo": ["Galerías", "La Soledad", "Teusaquillo Centro", "Quinta Paredes", "Pablo VI", "Sears", "Ciudad Salitre", "Belalcázar", "La Estrella"],
    "Los Mártires": ["Santa Isabel", "Voto Nacional", "La Sabana", "San Victorino", "Ricaurte", "La Pepita"],
    "Antonio Nariño": ["Restrepo", "San Antonio", "Ciudad Berna", "Olaya", "Eduardo Santos"],
    "Puente Aranda": ["Centro Industrial", "Ciudad Montes", "Puente Aranda Centro", "Salazar Gómez", "La Esperanza Sur", "Pensilvania"],
    "La Candelaria": ["La Candelaria", "Egipto", "Belén", "Centro Histórico"],
    "Rafael Uribe Uribe": ["Quiroga", "San José", "Marruecos", "Diana Turbay", "Olaya"],
    "Ciudad Bolívar": ["Lucero", "Ismael Perdomo", "Jerusalén", "San Francisco", "El Tesoro", "Arborizadora"],
    "Sumapaz": ["Nazareth", "San Juan"],
}



def locality_for_barrio(barrio: str | None) -> str | None:
    """Reverse lookup: dado un barrio canónico, devuelve su localidad."""
    if not barrio:
        return None
    norm = _strip_accents(barrio)
    for loc, hoods in _NEIGHBORHOODS_BY_LOCALITY.items():
        if any(_strip_accents(h) == norm for h in hoods):
            return loc
    return None


def normalize_localidad(raw: str | None) -> str | None:
    """
    Mapea una localidad raw al nombre canónico. EXACT match — antes usábamos
    substring inclusion y eso clasificaba "Chapinero Alto" como localidad
    "Chapinero" (bug que hacía perder barrios válidos).
    """
    if not raw:
        return None
    raw_norm = _strip_accents(raw).strip()
    for canonical in _LOCALIDADES_CANONICAS:
        if _strip_accents(canonical) == raw_norm:
            return canonical
    return None


def canonicalize_barrio(raw: str | None) -> str | None:
    """Devuelve el barrio canónico (con tildes y mayúsculas correctas) si el
    `raw` matchea alguno de la lista por _NEIGHBORHOODS_BY_LOCALITY. Es
    case-insensitive y accent-insensitive."""
    if not raw:
        return None
    raw_norm = _strip_accents(raw)
    for hoods in _NEIGHBORHOODS_BY_LOCALITY.values():
        for h in hoods:
            if _strip_accents(h) == raw_norm:
                return h
    return None


# Regex del título de FincaRaíz: "[Tipo] en [Arriendo|Venta] en [ZONA], Bogotá"
_TITLE_ZONE_RE = re.compile(
    r"\ben\s+(?:Arriendo|Venta|Renta)\s+en\s+(.+?)(?:,\s*Bogot[áa]|$)",
    re.IGNORECASE,
)


def extract_zone_from_title(title: str | None) -> str | None:
    """Parsea la zona (barrio o localidad) del título de FincaRaíz."""
    if not title:
        return None
    m = _TITLE_ZONE_RE.search(title)
    if not m:
        return None
    text = m.group(1).strip()
    # Strip "Zona " prefix: "Zona Chapinero" → "Chapinero"
    text = re.sub(r"^Zona\s+", "", text, flags=re.IGNORECASE)
    return text


def classify_zone(zone: str | None) -> tuple[str | None, str | None]:
    """Decide si una zona es barrio o localidad. Devuelve (barrio, localidad)."""
    if not zone:
        return None, None
    as_localidad = normalize_localidad(zone)
    if as_localidad:
        return None, as_localidad
    as_barrio = canonicalize_barrio(zone)
    if as_barrio:
        return as_barrio, None
    return None, None


def _description_mentions_barrio(text_no_acc_lower: str, barrio: str) -> bool:
    """Match con CONTEXTO de ubicación. Case-insensitive, accent-insensitive.
    Solo cuenta si el barrio aparece después de "en", "barrio", "sector", "zona",
    "ubicado en", "se encuentra en" — eso evita falsos positivos como "modelo
    de cocina" matcheando el barrio Modelo."""
    escaped = re.escape(_strip_accents(barrio))
    patterns = [
        rf"\ben\s+(?:el\s+barrio\s+)?{escaped}\b",
        rf"\bbarrio\s+(?:el\s+|la\s+|los\s+|las\s+)?{escaped}\b",
        rf"\bsector\s+(?:el\s+|la\s+)?{escaped}\b",
        rf"\bzona\s+(?:de\s+)?{escaped}\b",
        rf"\bubicad[oa]\s+en\s+(?:el\s+barrio\s+)?{escaped}\b",
        rf"\bse\s+encuentra\s+en\s+(?:el\s+barrio\s+)?{escaped}\b",
    ]
    for pat in patterns:
        if re.search(pat, text_no_acc_lower):
            return True
    return False


def find_barrio_in_description(description: str | None, prefer_locality: str | None = None) -> str | None:
    """Busca un barrio canónico DENTRO de la descripción, con contexto de
    ubicación. Prefiere los de la localidad indicada; dentro de cada lista
    prueba los más largos primero ("Chapinero Central" antes que "Central")."""
    if not description:
        return None
    text = _strip_accents(description)  # lowercased y sin acentos

    def try_group(hoods):
        for barrio in sorted(hoods, key=len, reverse=True):
            if _description_mentions_barrio(text, barrio):
                return barrio
        return None

    if prefer_locality and prefer_locality in _NEIGHBORHOODS_BY_LOCALITY:
        r = try_group(_NEIGHBORHOODS_BY_LOCALITY[prefer_locality])
        if r:
            return r
    for loc, hoods in _NEIGHBORHOODS_BY_LOCALITY.items():
        if loc == prefer_locality:
            continue
        r = try_group(hoods)
        if r:
            return r
    return None


_FLOORS_RE = re.compile(
    r"""
    (?:                          # opción A: "4 niveles / pisos / plantas"
        (?P<n1>\d+)\s*
        (?:niveles?|pisos?|plantas?|floors?)
    )
    |                            # opción B: "niveles / pisos / plantas de 4"
    (?:
        (?:niveles?|pisos?|plantas?)
        \s+de\s+
        (?P<n2>\d+)
    )
    |                            # opción C: palabra española "cuatro niveles"
    (?:
        (?P<nw>dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)
        \s*
        (?:niveles?|pisos?|plantas?)
    )
    """,
    re.IGNORECASE | re.VERBOSE,
)


def extract_floors_from_description(description: str) -> int:
    """
    Busca menciones de número de pisos/niveles/plantas en la descripción.
    Retorna el número encontrado, o 0 si no hay nada.
    Ejemplos detectados:
      '4 niveles', '3 pisos', '2 plantas', 'cuatro niveles',
      'casa de 3 pisos', '4 levels'
    """
    if not description:
        return 0
    for m in _FLOORS_RE.finditer(description):
        raw = m.group("n1") or m.group("n2")
        if raw:
            return int(raw)
        word = m.group("nw")
        if word:
            return _WORD_TO_NUM.get(word.lower(), 0)
    return 0


def extract_price(price_field) -> float:
    """Handle both raw numbers and Finca Raiz price objects."""
    if isinstance(price_field, dict):
        return float(price_field.get("amount", 0))
    try:
        return float(price_field or 0)
    except (TypeError, ValueError):
        return 0.0


def extract_all_image_urls(item: dict, max_images: int = 10) -> list[str]:
    """Extract image URLs from a Finca Raiz listing (limited to max_images)."""
    images = item.get("images") or []
    urls = []
    if images and isinstance(images, list):
        for img in images:
            url = img.get("image") if isinstance(img, dict) else img
            if url and isinstance(url, str):
                urls.append(url)
    # Fallback: top-level img field
    if not urls and item.get("img"):
        urls.append(item["img"])
    return urls[:max_images]


async def download_image(url: str) -> bytes | None:
    """Download an image and return raw bytes, or None on failure."""
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            r = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            r.raise_for_status()
            return r.content
    except Exception as e:
        print(f"    [warn] No se pudo descargar imagen {url}: {e}")
        return None


def upload_image_to_storage(supabase: Client, image_bytes: bytes, filename: str) -> str | None:
    """
    Upload image bytes to Supabase Storage and return the public URL.
    The bucket must exist and be PUBLIC.
    """
    try:
        try:
            supabase.storage.create_bucket(BUCKET, options={"public": True})
        except Exception:
            pass  # Already exists

        supabase.storage.from_(BUCKET).upload(
            path=filename,
            file=image_bytes,
            file_options={"content-type": "image/jpeg", "upsert": "true"},
        )
        return supabase.storage.from_(BUCKET).get_public_url(filename)
    except Exception as e:
        print(f"    [warn] Error subiendo imagen a Storage: {e}")
        return None


async def download_and_upload_all(
    supabase: Client,
    raw_urls: list[str],
    fincaraiz_id: str,
    dry_run: bool,
) -> tuple[str | None, list[str]]:
    """
    Download and upload ALL images for a listing.
    Returns (cover_url, all_urls_list).
    In dry-run mode returns the original URLs without uploading.
    """
    if dry_run:
        return (raw_urls[0] if raw_urls else None, raw_urls)

    uploaded: list[str] = []
    tasks = []
    for i, url in enumerate(raw_urls):
        tasks.append(download_image(url))

    results = await asyncio.gather(*tasks)

    for i, (img_bytes, raw_url) in enumerate(zip(results, raw_urls)):
        if img_bytes:
            filename = f"{fincaraiz_id}_{i}.jpg"
            public_url = upload_image_to_storage(supabase, img_bytes, filename)
            if public_url:
                uploaded.append(public_url)
                if i == 0:
                    print(f"    Imagen {i+1}/{len(raw_urls)} subida ✓")
                else:
                    print(f"    Imagen {i+1}/{len(raw_urls)} subida ✓")
            else:
                print(f"    Imagen {i+1}/{len(raw_urls)} falló al subir")
        else:
            print(f"    Imagen {i+1}/{len(raw_urls)} falló al descargar")

    cover = uploaded[0] if uploaded else None
    return cover, uploaded


def insert_property(supabase: Client, prop: dict) -> bool:
    """Insert a single property row. Returns True on success."""
    try:
        result = supabase.table("properties").insert(prop).execute()
        return bool(result.data)
    except Exception as e:
        print(f"    [error] Error insertando propiedad: {e}")
        return False


async def scrape_and_upload(url: str, owner_id: str, limit: int = 100, dry_run: bool = False, debug: bool = False):
    supabase = get_supabase()
    if not dry_run:
        owner_id = resolve_owner_id(supabase, owner_id)
    print(f"\n{'[DRY RUN] ' if dry_run else ''}Scraping: {url}\n")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            )
        )
        page = await context.new_page()

        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=60000)
            await page.wait_for_timeout(2500)

            script_tag = await page.query_selector("script#__NEXT_DATA__")
            if not script_tag:
                print("[error] No se encontró __NEXT_DATA__. El sitio puede haber bloqueado el acceso.")
                return

            raw = await script_tag.inner_text()
            data = json.loads(raw)

            try:
                listings = data["props"]["pageProps"]["fetchResult"]["searchFast"]["data"]
            except KeyError:
                print("[error] Estructura JSON inesperada. Claves disponibles:")
                print(list(data.get("props", {}).get("pageProps", {}).keys()))
                return

            if debug:
                print("=== ESTRUCTURA DEL PRIMER ITEM (debug) ===")
                print(json.dumps(listings[0], indent=2, ensure_ascii=False))
                print("==========================================\n")
                return

            listings = listings[:limit]
            print(f"Se encontraron {len(listings)} propiedades (límite: {limit}).\n")
            inserted = 0

            for item in listings:
                fincaraiz_id = str(item.get("id", uuid.uuid4()))
                title = item.get("title") or "Apartamento en arriendo"
                
                type_id = item.get("property_type_id")
                if type_id == 2:
                    property_type = "Apartamento"
                elif type_id == 1:
                    property_type = "Casa"
                elif type_id == 4:
                    property_type = "Habitación"
                else:
                    property_type = "Otro"
                    
                price = extract_price(item.get("price"))
                locations = item.get("locations") or {}
                location_main = locations.get("location_main") or {}

                # FincaRaíz entrega `neighbourhood` como un ARRAY de varios
                # barrios candidatos (no uno solo), y a veces incluye la
                # localidad como una entrada más. Antes solo tomábamos [0],
                # que podía ser:
                #   - Un barrio real (ej. "La Salle")
                #   - O la propia localidad (ej. "Chapinero")
                #   - O un barrio canónico pero no el correcto para esa propiedad
                # Iteramos todos, saltamos localidades, y nos quedamos con el
                # primer match canónico — al menos garantizamos un barrio real.
                neighborhood_entries = locations.get("neighbourhood") or []
                neighborhood_raw = None
                neighborhood_first_non_locality = None  # fallback no-canónico
                for entry in neighborhood_entries:
                    name = (entry or {}).get("name")
                    if not name:
                        continue
                    if normalize_localidad(name):
                        continue  # es la localidad, no un barrio
                    if neighborhood_first_non_locality is None:
                        neighborhood_first_non_locality = name
                    canonical = canonicalize_barrio(name)
                    if canonical:
                        neighborhood_raw = canonical
                        break
                # Si ningún entry matcheó canónico, usamos el primer no-localidad
                # como mejor esfuerzo (mejor que NULL si FincaRaíz al menos lo nombró).
                if neighborhood_raw is None:
                    neighborhood_raw = neighborhood_first_non_locality

                # FincaRaiz puede entregar la localidad bajo claves distintas:
                # `locality`, `location_main.name`, o como prefijo del neighborhood.
                # Intentamos varias y normalizamos al nombre canónico del perfil.
                locality_raw = (
                    (locations.get("locality") or [{}])[0].get("name")
                    if locations.get("locality") else None
                )
                localidad = (
                    normalize_localidad(locality_raw)
                    or normalize_localidad(location_main.get("name"))
                    or normalize_localidad(neighborhood_raw)
                )

                # `neighborhood` se asigna definitivamente más abajo, después
                # de buscar el barrio canónico en title+description. NO usar
                # la localidad como fallback aquí — ese era exactamente el bug
                # que queremos quitar.

                city_list = locations.get("city") or []
                city = city_list[0].get("name") if city_list else "Bogotá"
                description = item.get("description") or ""

                rooms = item.get("bedrooms") or 1
                bathrooms = int(item.get("bathrooms") or 0)
                area_sqm = float(item.get("m2Built") or item.get("m2") or 0.0)
                stratum = int(item.get("stratum") or 0)
                floor_number = int(item.get("floor") or 0)
                building_floors = int(item.get("floorsCount") or 0)

                # Si floorsCount no está en el JSON, intentar extraerlo
                # de la descripción con regex ("4 niveles", "3 pisos", etc.)
                if not building_floors and description:
                    building_floors = extract_floors_from_description(description)
                    if building_floors:
                        print(f"    [regex] Detectados {building_floors} niveles desde la descripción")

                facilities = item.get("facilities") or []
                tags = [f["name"] for f in facilities if f.get("name")]
                
                amenities_interior = []
                amenities_exterior = []
                amenities_sector = []
                utilities_included = []
                
                utility_keywords = ["agua", "luz", "energía", "energia", "gas", "internet", "wifi"]
                for f in facilities:
                    name = f.get("name", "")
                    group = f.get("group", "")
                    if not name:
                        continue
                    
                    name_lower = name.lower()
                    is_utility = any(kw in name_lower for kw in utility_keywords)
                    
                    if is_utility:
                        utilities_included.append(name)
                    elif group == "Interior":
                        amenities_interior.append(name)
                    elif group == "Exterior":
                        amenities_exterior.append(name)
                    elif group == "Sector":
                        amenities_sector.append(name)
                        
                address = item.get("address") or None
                latitude = item.get("latitude") or None
                longitude = item.get("longitude") or None

                # Resolución del barrio (3 pasos):
                # 1. Título: "[Tipo] en [Arriendo] en [ZONA], Bogotá" — parseado
                #    estructuradamente y matcheado contra catálogo canónico.
                # 2. Descripción: buscar barrios canónicos con CONTEXTO
                #    ("en X", "barrio X", "ubicado en X") para evitar falsos
                #    positivos como "modelo de cocina" → barrio Modelo.
                # 3. neighborhood_raw del JSON solo si no es una localidad.
                #
                # Nota: Nominatim descartado — devuelve UPZs en Bogotá, no barrios.
                title_zone = extract_zone_from_title(title)
                barrio_from_title, locality_from_title = classify_zone(title_zone)

                barrio_from_desc = None
                if not barrio_from_title:
                    barrio_from_desc = find_barrio_in_description(
                        description, localidad or locality_from_title,
                    )

                existing_is_locality = normalize_localidad(neighborhood_raw) is not None
                existing_usable = (
                    canonicalize_barrio(neighborhood_raw) or neighborhood_raw
                    if neighborhood_raw and not existing_is_locality
                    else None
                )

                neighborhood = barrio_from_title or barrio_from_desc or existing_usable or None

                # Localidad: existing → del título → derivada del barrio canónico.
                localidad = (
                    localidad
                    or locality_from_title
                    or locality_for_barrio(neighborhood)
                )

                # --- All images ---
                raw_urls = extract_all_image_urls(item)
                print(f"  [{fincaraiz_id}] {len(raw_urls)} imagen(es) encontrada(s) — descargando...")
                cover_url, all_urls = await download_and_upload_all(supabase, raw_urls, fincaraiz_id, dry_run)

                prop = {
                    "owner_id": owner_id,
                    "title": title,
                    "property_type": property_type,
                    "monthly_rent": price,
                    "neighborhood": neighborhood,
                    "localidad": localidad,
                    "city": city,
                    "bedrooms": int(rooms),
                    "bathrooms": bathrooms,
                    "area_sqm": area_sqm,
                    "stratum": stratum,
                    "floor_number": floor_number,
                    "building_floors": building_floors,
                    "description": description,
                    "tags": tags,
                    "amenities_interior": amenities_interior,
                    "amenities_exterior": amenities_exterior,
                    "amenities_sector": amenities_sector,
                    "utilities_included": utilities_included,
                    "image_url": cover_url,
                    "images": all_urls,
                    "address": address,
                    "latitude": latitude,
                    "longitude": longitude,
                    "allows_students": True,
                    "requires_co_debtor": False,
                }

                if dry_run:
                    print(f"  [DRY RUN] {title} — ${price:,.0f} COP — barrio: {neighborhood or '(sin barrio)'} | localidad: {localidad or '(sin localidad)'} | {city}")
                    print(f"           {len(all_urls)} imagen(es): {cover_url or '(sin imagen)'}")
                    print(f"           dirección: {address or '(sin dirección)'} | coords: {latitude}, {longitude}")
                else:
                    ok = insert_property(supabase, prop)
                    if ok:
                        inserted += 1
                        print(f"  [OK] Insertada: {title} — ${price:,.0f} COP — {len(all_urls)} foto(s)")
                    else:
                        print(f"  [SKIP] {title}")

            if not dry_run:
                print(f"\nListo. {inserted}/{len(listings)} propiedades insertadas en Supabase.")
            else:
                print(f"\n[DRY RUN] {len(listings)} propiedades procesadas. Nada fue guardado.")

        except Exception as e:
            print(f"[error] {e}")
            raise
        finally:
            await browser.close()


if __name__ == "__main__":
    default_url = (
        "https://www.fincaraiz.com.co/arriendo/apartamentos/chapinero/bogota"
    )

    parser = argparse.ArgumentParser(
        description="Scraper Finca Raiz → Supabase Storage + DB (todas las imágenes)"
    )
    parser.add_argument("--url", default=default_url, help="URL de búsqueda de Finca Raiz")
    parser.add_argument("--owner_id", required=True, help="UUID o email del owner")
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Imprime el JSON crudo del primer apartamento y sale",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=100,
        help="Número máximo de apartamentos a procesar (default: 100)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Muestra lo que se haría sin insertar nada en Supabase",
    )

    args = parser.parse_args()
    asyncio.run(scrape_and_upload(args.url, args.owner_id, limit=args.limit, dry_run=args.dry_run, debug=args.debug))
