import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Supabase URL defined:", !!supabaseUrl);
console.log("Supabase Service Role Key defined:", !!supabaseKey);

if (supabaseUrl && supabaseKey) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log("Supabase client initialized.");
  
  // Try to list tables or something simple
  const { data, error } = await supabase.from("profiles").select("count").limit(1);
  if (error) {
    console.error("Supabase Error:", error.message);
  } else {
    console.log("Supabase Connection Successful.");
  }
} else {
  console.error("Missing Supabase configuration.");
}
