import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.rpc('get_rls_status');
  if (error) {
    // If RPC doesn't exist, let's query via postgres directly if we can,
    // but via REST API we can't query pg_class.
    // However, we can use the postgrest API to execute a SQL query if we have a way.
    console.log("Cannot use RPC. We will try fetching from pg_policies if it's exposed, but it isn't.");
  } else {
    console.log(data);
  }
}
check();
