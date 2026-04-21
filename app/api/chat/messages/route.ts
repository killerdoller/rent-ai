import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/chat/messages?conversation_id=xxx[&after=iso_timestamp]
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversation_id");
  const after          = searchParams.get("after");

  if (!conversationId) {
    return NextResponse.json({ error: "conversation_id requerido" }, { status: 400 });
  }

  let query = supabase
    .from("messages")
    .select("id, sender_id, sender_type, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (after) query = query.gt("created_at", after);

  const { data, error } = await query.limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data || []);
}

// POST /api/chat/messages
// body: { conversation_id, sender_id, sender_type, content }
export async function POST(request: Request) {
  let body: any;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const { conversation_id, sender_id, sender_type, content } = body;

  if (!conversation_id || !sender_id || !sender_type || !content?.trim()) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }
  if (!["user", "owner"].includes(sender_type)) {
    return NextResponse.json({ error: "sender_type inválido" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id, sender_id, sender_type, content: content.trim() })
    .select("id, sender_id, sender_type, content, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Keep last_message_at current
  await supabase
    .from("conversations")
    .update({ last_message_at: data.created_at })
    .eq("id", conversation_id);

  return NextResponse.json(data);
}
