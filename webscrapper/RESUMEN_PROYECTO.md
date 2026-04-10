# 🏠 Proyecto: Scraper de Apartamentos - Finca Raíz

Este documento resume la estructura final, los códigos y las preferencias configuradas para el sistema de extracción de datos.

## 🎯 Objetivo
Automatizar la recolección de datos de apartamentos en arriendo para alimentar una aplicación de búsqueda de vivienda y compañeros de cuarto, optimizando la limpieza y estructuración de la información.

## 🛠️ Componentes del Sistema

### 1. Extractor de Texto (`extract_text.py`)
Extrae todo el contenido visible de múltiples páginas de resultados.
- **Paginación:** Configurada para seguir el patrón `.../pagina2`, `.../pagina3`, etc.
- **Consolidación:** Guarda todo el texto acumulado en `contenido_pagina.txt`.
- **Uso:** `python extract_text.py --pages 5`

### 2. Generador de Base de Datos (`parse_to_csv.py`)
Procesa el texto plano y lo convierte en una base de datos estructurada.
- **Columnas Configuradas:**
    - `inmobiliaria`: Nombre de la agencia.
    - `precio canon`: Numérico (float).
    - `administracion`: Numérico (float), `0.0` si no se especifica.
    - `zona` y `ciudad`: Extraídas y limpias (ej. "Chapinero", "Bogotá").
    - `habitaciones`, `baños` y `metros_cuadrados`: Columnas numéricas individuales.
    - `descripcion`: Texto descriptivo completo.
- **Lógica de Actualización Incremental:** 
    - Al ejecutarse, lee la base de datos existente (`apartamentos_analizados_v2.csv`).
    - Compara nuevos registros para **evitar duplicados** (basado en precio, zona, habitaciones y fragmento de descripción).
    - Solo añade registros nuevos.

### 3. Scraper Técnico Técnico (`scraper.py`)
Utiliza la etiqueta oculta `__NEXT_DATA__` para obtener datos técnicos JSON directamente de la página.

## 📊 Preferencias de Datos (Configuradas)
- **Tipos de Datos:** Valores numéricos obligatorios para precios y características para facilitar análisis estadísticos rápidos.
- **Estructura de Ubicación:** Eliminación de texto irrelevante, dejando solo la zona geográfica principal y la ciudad.
- **Calidad de Base de Datos:** Sistema de limpieza de duplicados activo para mantener una base de datos de alta integridad.

## 🚀 Guía de Ejecución Rápida
1.  **Actualizar datos:** `python extract_text.py --pages 10`
2.  **Generar/Actualizar CSV:** `python parse_to_csv.py`
3.  **Resultado:** Revisa `apartamentos_analizados_v2.csv`.

---
*Documento generado automáticamente como resumen del estado actual del proyecto.*
