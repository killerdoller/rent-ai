import asyncio
import json
import pandas as pd
from playwright.async_api import async_playwright
import argparse

async def scrape_fincaraiz(url):
    print(f"Buscando información en: {url}...")
    
    async with async_playwright() as p:
        # Iniciamos el navegador (Chromium es compatible con Brave)
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        try:
            # Vamos a la página con un tiempo de espera razonable
            await page.goto(url, wait_until="domcontentloaded", timeout=60000)
            
            # Esperamos un poco para que carguen los scripts
            await page.wait_for_timeout(2000)
            
            # Extraemos el "Gold Mine": el tag __NEXT_DATA__
            next_data_script = await page.query_selector("script#__NEXT_DATA__")
            
            if not next_data_script:
                print("Error: No se encontró la etiqueta __NEXT_DATA__. El sitio podría haber cambiado o bloqueó el acceso.")
                return

            json_content = await next_data_script.inner_text()
            data = json.loads(json_content)
            
            # Navegamos por el JSON hasta llegar a los resultados de búsqueda
            # El path suele ser: props -> pageProps -> fetchResult -> searchFast -> data
            try:
                listings = data['props']['pageProps']['fetchResult']['searchFast']['data']
            except KeyError:
                print("Error: La estructura del JSON ha cambiado. Intentando búsqueda alternativa...")
                # Fallback simple por si cambia la estructura interna
                return

            results = []
            for item in listings:
                # Extraemos la información clave
                # Nota: Algunos campos pueden variar dependiendo de la inmobiliaria
                res = {
                    "id": item.get("id"),
                    "titulo": item.get("title", "Sin título"),
                    "precio": item.get("price", 0),
                    "moneda": item.get("currency", "COP"),
                    "barrio": item.get("neighborhood", "N/A"),
                    "ciudad": item.get("city", "N/A"),
                    "area": f"{item.get('area', 0)} m2",
                    "habitaciones": item.get("rooms", 0),
                    "baños": item.get("baths", 0),
                    "link": f"https://www.fincaraiz.com.co{item.get('clientPropertyUrl', '')}"
                }
                results.append(res)
            
            if results:
                # Guardamos en CSV usando Pandas
                df = pd.DataFrame(results)
                output_file = "apartamentos_resultados.csv"
                df.to_csv(output_file, index=False, encoding='utf-8-sig')
                print(f"¡Éxito! Se encontraron {len(results)} apartamentos.")
                print(f"Datos guardados en: {output_file}")
            else:
                print("No se encontraron resultados en esta página.")

        except Exception as e:
            print(f"Ocurrió un error inesperado: {str(e)}")
        finally:
            await browser.close()

if __name__ == "__main__":
    # URL por defecto si no se pasa nada
    default_url = "https://www.fincaraiz.com.co/arriendo/apartamentos/chapinero/zona-nororiental/bogota"
    
    parser = argparse.ArgumentParser(description="Scraper sencillo para Finca Raiz Colombia")
    parser.add_argument("--url", default=default_url, help="El enlace de búsqueda de Finca Raiz")
    
    args = parser.parse_args()
    
    asyncio.run(scrape_fincaraiz(args.url))
