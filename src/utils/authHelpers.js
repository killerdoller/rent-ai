import { supabase } from "./supabaseClient";

/**
 * Inicia sesión con email y contraseña.
 * Retorna { user, role, userId/ownerId } para saber a dónde redirigir.
 */
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const userId = data.user?.id;
  if (!userId) throw new Error("No se pudo obtener el usuario");

  // Determinar rol: owners primero porque el trigger on_auth_user_created
  // crea una fila en profiles para TODOS los usuarios, incluyendo propietarios.
  const { data: owner } = await supabase
    .from("owners")
    .select("owner_id")
    .eq("owner_id", userId)
    .single();

  if (owner) {
    return { user: data.user, role: "owner", ownerId: owner.owner_id };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, user_mode")
    .eq("id", userId)
    .single();

  if (profile) {
    return { user: data.user, role: "student", userId };
  }

  // Perfil no encontrado aún (puede pasar si el trigger de BD no corrió)
  return { user: data.user, role: "unknown", userId };
};

/**
 * Registra un nuevo usuario y crea su perfil según el rol.
 */
export const signUp = async (email, password, role, userData) => {
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
  if (authError) throw authError;

  const userId = authData.user?.id;
  if (!userId) throw new Error("No se pudo crear el usuario");

  if (role === "student") {
    // El trigger on_auth_user_created ya creó el perfil — solo actualizamos los datos extra
    const { error: profileError } = await supabase.from("profiles").update({
      first_name: userData.firstName || "",
      last_name: userData.lastName || "",
      phone: userData.phone || null,
      university_name: userData.university || null,
      user_mode: "find-room",
    }).eq("id", userId);
    if (profileError) throw profileError;
    return { user: authData.user, role: "student", userId };
  }

  if (role === "owner") {
    // Usar el API route para evitar restricciones RLS en el cliente
    const res = await fetch("/api/owner/find-or-create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        owner_id: userId,
        name: `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || email.split("@")[0],
        email,
        phone: userData.phone || null,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al crear el perfil de propietario");
    }
    return { user: authData.user, role: "owner", ownerId: userId };
  }

  return { user: authData.user, role: "unknown", userId };
};

/**
 * Cierra la sesión activa.
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Obtiene el usuario actual y su sesión.
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
};
