import { supabase } from "./supabaseClient";

/**
 * Inicia sesión con email y contraseña
 */
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

/**
 * Registra un nuevo usuario y crea su perfil según el rol (estudiante o dueño)
 */
export const signUp = async (email, password, role, userData) => {
  // 1. Crear el usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;

  const userId = authData.user?.id;

  if (userId) {
    // 2. Crear el perfil en la tabla correspondiente
    if (role === "student") {
      const { error: profileError } = await supabase.from("students").insert([
        {
          student_id: userId, // Usamos el ID de auth para vincularlos
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: email,
          university_name: userData.university,
          phone: userData.phone
        },
      ]);
      if (profileError) throw profileError;
    } else if (role === "owner") {
      const { error: profileError } = await supabase.from("owners").insert([
        {
          owner_id: userId,
          name: `${userData.firstName} ${userData.lastName}`,
          email: email,
          phone: userData.phone
        },
      ]);
      if (profileError) throw profileError;
    }
  }

  return authData;
};

/**
 * Cierra la sesión activa
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Obtiene el usuario actual y su sesión
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
};
