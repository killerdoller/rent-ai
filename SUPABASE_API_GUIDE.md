# Guía de Integración: Supabase API en Rent-AI 🚀

Esta guía detalla los pasos seguidos para transformar el frontend de Rent-AI de datos estáticos (*placeholders*) a una API real conectada a Supabase.

---

## 1. Configuración de Supabase

### Credenciales
Para conectar la app, necesitas la **URL** y la **Anon Key** de tu proyecto en Supabase (Sección *Project Settings > API*).

### Variables de Entorno
Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

---

## 2. Cliente de Supabase (`src/utils/supabaseClient.ts`)

Instalamos el SDK oficial:
```bash
npm install @supabase/supabase-js
```

Creamos un cliente único para toda la aplicación:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## 3. Creación de la API Route (`app/api/properties/route.ts`)

En Next.js (App Router), creamos una ruta GET para obtener los apartamentos:

1. **Consulta**: Usamos `supabase.from('properties').select(...)` para traer los datos y la información del dueño (`owners`).
2. **Transformación**: Convertimos los nombres de las columnas de la BD (ej. `monthly_rent`) al formato que espera el frontend (`price`).
3. **Manejo de Errores**: Retornamos un `NextResponse.json` con el error si algo falla.

```typescript
// Ejemplo de lógica en route.ts
const { data, error } = await supabase
  .from("properties")
  .select(`*, owners(*)`)
  .eq("allows_students", true);
```

---

## 4. Integración en el Frontend (`src/flow/components/Home.tsx`)

Reemplazamos el arreglo `mockData` por un estado dinámico:

1. **Estados**: Añadimos `isLoading` y `error`.
2. **Fetch**: Usamos `useEffect` para llamar a nuestra API interna.

```tsx
const fetchProperties = async () => {
  setIsLoading(true);
  try {
    const res = await fetch("/api/properties");
    const data = await res.json();
    setCards(data);
  } catch (err) {
    setError("Error al cargar");
  } finally {
    setIsLoading(false);
  }
};
```

---

## 5. Despliegue en Vercel

Para que la API funcione en producción, debemos sincronizar las variables:

1. **Vincular**: `npx vercel link`
2. **Agregar Variables**: 
   - `npx vercel env add NEXT_PUBLIC_SUPABASE_URL`
   - `npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Sincronizar Local**: `npx vercel env pull .env.local`

---

## 🔧 Solución de Problemas Comunes

- **Error de TypeScript en Calendar**: Si usas `react-day-picker` v9, asegúrate de usar el componente `Chevron` en lugar de `IconLeft/Right`.
- **CORS o Conexión**: Verifica que las variables de entorno en Vercel coincidan exactamente con las de Supabase.
- **Servidor Trabado**: Si `localhost:3000` no carga, usa `taskkill /PID <ID> /F` (Windows) para liberar el puerto.
