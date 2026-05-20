import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Using the Anon key to simulate an unauthenticated user
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPublicAccess() {
  console.log("Verificando si las tablas son públicas para usuarios no autenticados...");

  // 1. Check properties
  const { data: properties, error: propError } = await supabase.from('properties').select('id').limit(1);
  if (propError) {
    console.error("Error consultando properties:", propError.message);
  } else {
    console.log(`Tabla 'properties': ${properties.length} registros devueltos. (Si es 0, la tabla ESTÁ SEGURA. Si > 0, es pública)`);
  }

  // 2. Check owners
  const { data: owners, error: ownerError } = await supabase.from('owners').select('owner_id').limit(1);
  if (ownerError) {
    console.error("Error consultando owners:", ownerError.message);
  } else {
    console.log(`Tabla 'owners': ${owners.length} registros devueltos. (Si es 0, la tabla ESTÁ SEGURA. Si > 0, es pública)`);
  }

  // 3. Check guest_users (should be dropped, so might error)
  const { data: guests, error: guestError } = await supabase.from('guest_users').select('id').limit(1);
  if (guestError) {
    console.log("Tabla 'guest_users':", guestError.message, "(Esto es correcto, la tabla fue eliminada o está asegurada)");
  } else {
    console.log(`Tabla 'guest_users': ${guests.length} registros devueltos. (Si es > 0, la tabla existe y es pública)`);
  }
}

checkPublicAccess();
