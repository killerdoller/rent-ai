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
        result = supabase.table("owners").select("owner_id").eq("email", email).maybe_single().execute()
        if result.data:
            oid = result.data["owner_id"]
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
        result = supabase.table("owners").select("owner_id").eq("owner_id", owner_id_or_email).maybe_single().execute()
        if not result.data:
            raise ValueError(
                f"No existe ningún owner con id '{owner_id_or_email}'. "
                "Pasa un email para crear uno automáticamente, ej: --owner_id tu@email.com"
            )
        return owner_id_or_email


def extract_price(price_field) -> float:
    """Handle both raw numbers and Finca Raiz price objects."""
    if isinstance(price_field, dict):
        return float(price_field.get("amount", 0))
    try:
        return float(price_field or 0)
    except (TypeError, ValueError):
        return 0.0


def extract_all_image_urls(item: dict) -> list[str]:
    """Extract ALL image URLs from a Finca Raiz listing."""
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
    return urls


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
                price = extract_price(item.get("price"))
                locations = item.get("locations") or {}
                location_main = locations.get("location_main") or {}
                neighborhood = location_main.get("name") or (
                    (locations.get("neighbourhood") or [{}])[0].get("name") or "N/A"
                )
                city_list = locations.get("city") or []
                city = city_list[0].get("name") if city_list else "Bogotá"
                rooms = item.get("bedrooms") or 1
                description = item.get("description") or ""
                tags = [f["name"] for f in (item.get("facilities") or []) if f.get("name")]
                address = item.get("address") or None
                latitude = item.get("latitude") or None
                longitude = item.get("longitude") or None

                # --- All images ---
                raw_urls = extract_all_image_urls(item)
                print(f"  [{fincaraiz_id}] {len(raw_urls)} imagen(es) encontrada(s) — descargando...")
                cover_url, all_urls = await download_and_upload_all(supabase, raw_urls, fincaraiz_id, dry_run)

                prop = {
                    "owner_id": owner_id,
                    "title": title,
                    "monthly_rent": price,
                    "neighborhood": neighborhood,
                    "city": city,
                    "bedrooms": int(rooms),
                    "description": description,
                    "tags": tags,
                    "image_url": cover_url,
                    "images": all_urls,
                    "address": address,
                    "latitude": latitude,
                    "longitude": longitude,
                    "allows_students": True,
                    "requires_co_debtor": False,
                }

                if dry_run:
                    print(f"  [DRY RUN] {title} — ${price:,.0f} COP — {neighborhood}, {city}")
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
