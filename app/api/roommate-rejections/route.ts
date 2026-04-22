import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { user_id, rejected_user_id } = await request.json();

    if (!user_id || !rejected_user_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { error } = await supabase
      .from("roommate_rejections")
      .insert({ user_id, rejected_user_id });

    if (error && error.code !== "23505") throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Roommate rejection error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
