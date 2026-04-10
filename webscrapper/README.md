# Proyecto: Web Scraper de Vivienda (Colombia)

Este proyecto permite extraer información de apartamentos y casas de **Finca Raiz** de forma automatizada.

## Requisitos

1. Tener **Python 3.8+** instalado.
2. Instalar las dependencias necesarias:

```bash
pip install -r requirements.txt
playwright install chromium
```

## Cómo usar el Scraper

Puedes ejecutar el script directamente desde la terminal:

```bash
# Para el scraper de apartamentos (CSV):
python scraper.py --url "TU_URL_DE_BUSQUEDA_AQUI"

# Para extraer TODO el texto de una página (TXT):
python extract_text.py --url "TU_URL_AQUI"
```

Si no pones ninguna URL, por defecto usará la de Chapinero que proporcionaste.

## Sugerencia para Roommates

Para encontrar roommates (compañeros de habitación), te recomiendo estos sitios adicionales que suelen tener filtros específicos para estudiantes:

1. **CompartoApto**: Es el más famoso en Colombia para este fin específico.
2. **Facebook Groups**: "Busco Roommate Bogotá" o "Arriendos Universitarios Chapinero" son muy activos.
3. **DadaRoom**: Otra alternativa popular para perfiles jóvenes.

---

*Nota: Este proyecto es para fines educativos. Recuerda siempre revisar los términos de servicio de los sitios que visitas.*
