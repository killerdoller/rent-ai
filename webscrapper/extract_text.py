import asyncio
from playwright.async_api import async_playwright
import argparse

async def extract_all_text(url, pages=5):
    output_file = "contenido_pagina.txt"
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
                # Construimos la URL con el patrón de ruta /paginaX
                # Si es la página 1, usamos la URL base
                if p_num == 1:
                    p_url = url
                else:
                    # Quitamos cualquier / al final de la URL base para evitar //paginaX
                    base_url = url.rstrip('/')
                    p_url = f"{base_url}/pagina{p_num}"
                
                print(f"[{p_num}/{pages}] Extrayendo texto de: {p_url}...")
                
                await page.goto(p_url, wait_until="domcontentloaded", timeout=60000)
                await page.wait_for_timeout(3000)
                
                text = await page.evaluate("document.body.innerText")
                
                if text:
                    with open(output_file, "a", encoding="utf-8") as f:
                        f.write(f"\n--- INICIO PAGINA {p_num} ---\n")
                        f.write(text)
                        f.write(f"\n--- FIN PAGINA {p_num} ---\n")
                else:
                    print(f"Advertencia: No se extrajo texto de la página {p_num}")

            print(f"\n¡Éxito! Se ha extraído el texto de {pages} páginas.")
            print(f"El resultado consolidado se guardó en: {output_file}")

        except Exception as e:
            print(f"Error durante la extracción: {str(e)}")
        finally:
            await browser.close()

if __name__ == "__main__":
    default_url = "https://www.fincaraiz.com.co/arriendo/apartamentos/chapinero/zona-nororiental/bogota"
    
    parser = argparse.ArgumentParser(description="Extractor de texto multipágina para Finca Raiz")
    parser.add_argument("--url", default=default_url, help="La URL base de búsqueda")
    parser.add_argument("--pages", type=int, default=5, help="Número de páginas a extraer")
    
    args = parser.parse_args()
    
    asyncio.run(extract_all_text(args.url, args.pages))
