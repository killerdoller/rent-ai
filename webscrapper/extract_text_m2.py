import asyncio
from playwright.async_api import async_playwright
import argparse

async def extract_all_text(url, pages=5):
    output_file = "contenido_pagina_m2.txt"
    # Limpiamos el archivo al inicio
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        try:
            for p_num in range(1, pages + 1):
                # Lógica de paginación para MetroCuadrado
                if p_num == 1:
                    p_url = url
                else:
                    # MetroCuadrado usa el parámetro ?page= o &page=
                    connector = "&" if "?" in url else "?"
                    p_url = f"{url.rstrip('/')}{connector}page={p_num}"
                
                print(f"[{p_num}/{pages}] Extrayendo MetroCuadrado de: {p_url}...")
                
                await page.goto(p_url, wait_until="domcontentloaded", timeout=60000)
                await page.wait_for_timeout(3000) # Espera inicial

                # --- MEJORA: SCROLL DINÁMICO HASTA EL FINAL ---
                previous_height = await page.evaluate("document.body.scrollHeight")
                for _ in range(8):  # Intentamos hasta 8 scrolls por página
                    # Bajamos un bloque de 1200 píxeles
                    await page.mouse.wheel(0, 1200)
                    await page.wait_for_timeout(1500) # Pausa corta para que cargue el "Lazy Load"
                    
                    new_height = await page.evaluate("document.body.scrollHeight")
                    # Si bajamos y el tamaño no cambió, es que llegamos al fondo
                    if new_height == previous_height and _ > 3: 
                        break
                    previous_height = new_height

                # Una espera final para que el JavaScript termine de poner los textos
                await page.wait_for_timeout(2500)
                
                text = await page.evaluate("document.body.innerText")
                
                if text:
                    with open(output_file, "a", encoding="utf-8") as f:
                        f.write(f"\n--- INICIO PAGINA {p_num} ---\n")
                        f.write(text)
                        f.write(f"\n--- FIN PAGINA {p_num} ---\n")
                else:
                    print(f"Advertencia: No se extrajo nada de la página {p_num}")

            print(f"\n¡Éxito! Se ha extraído el texto de {pages} páginas.")
            print(f"El resultado consolidado se guardó en: {output_file}")

        except Exception as e:
            print(f"Error durante la extracción: {str(e)}")
        finally:
            await browser.close()

if __name__ == "__main__":
    # URL de ejemplo de MetroCuadrado
    default_url = "https://www.metrocuadrado.com/apartamento/arriendo/bogota/"
    
    parser = argparse.ArgumentParser(description="Extractor para MetroCuadrado")
    parser.add_argument("--url", default=default_url, help="La URL base")
    parser.add_argument("--pages", type=int, default=1, help="Número de páginas")
    
    args = parser.parse_args()
    asyncio.run(extract_all_text(args.url, args.pages))