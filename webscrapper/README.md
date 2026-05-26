# Web Scraper de Vivienda — Finca Raíz

Herramienta de extracción automática de apartamentos en arriendo desde **FincaRaíz** para alimentar la base de datos de RentAI.

## Instalación

```bash
pip install -r requirements.txt
playwright install chromium
```

## Scripts

### Pipeline de dos pasos (texto → CSV)

```bash
# Paso 1: Extraer texto visible de N páginas de resultados
python extract_text.py --pages 5

# Paso 2: Convertir el texto a CSV estructurado
python parse_to_csv.py
```

Existen variantes `_m2` para scraping enfocado en precio por metro cuadrado:
```bash
python extract_text_m2.py --pages 5
python parse_to_csv_m2.py
```

### Scraper técnico (JSON directo)

```bash
python scraper.py --url "TU_URL_DE_BUSQUEDA_AQUI"
```

Usa la etiqueta `__NEXT_DATA__` de la página para extraer datos JSON directamente, sin pasar por texto plano.

### Scraper con carga a Supabase

```bash
python scraper_to_supabase.py --url "..." --owner_id "demo@rentai.com"
```

Sube imágenes a Supabase Storage y registra las propiedades en la tabla `properties`. El argumento `--owner_id` acepta un UUID existente en la tabla `owners` o un email.

## Variables de entorno

Crea un archivo `.env` copiando `.env.example`:

```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

## Columnas del CSV generado

| Columna | Tipo | Descripción |
|---|---|---|
| `inmobiliaria` | texto | Nombre de la agencia |
| `precio canon` | float | Precio mensual de arriendo |
| `administracion` | float | Cuota de administración (0.0 si no aplica) |
| `zona` | texto | Barrio/sector |
| `ciudad` | texto | Ciudad |
| `habitaciones` | int | Número de habitaciones |
| `baños` | int | Número de baños |
| `metros_cuadrados` | float | Área en m² |
| `descripcion` | texto | Texto descriptivo completo |

`parse_to_csv.py` actualiza el CSV de forma incremental — detecta y omite duplicados basándose en precio, zona, habitaciones y fragmento de descripción.

## Archivos de salida

Los CSV y TXT generados están en `.gitignore` — son archivos de trabajo, no código fuente. El resultado final se carga directamente a Supabase via `scraper_to_supabase.py`.
