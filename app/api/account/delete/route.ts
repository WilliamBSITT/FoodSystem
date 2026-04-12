import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing Supabase server configuration for account deletion." },
      { status: 500 },
    );
  }

  const authorization = request.headers.get("authorization") ?? "";

  if (!authorization.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing auth token." }, { status: 401 });
  }

  const accessToken = authorization.slice("Bearer ".length).trim();

  if (!accessToken) {
    return NextResponse.json({ error: "Missing auth token." }, { status: 401 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  const { data: authData, error: authError } = await authClient.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(authData.user.id);

  if (deleteError) {
    console.error("Account deletion failed:", deleteError);
    return NextResponse.json({ error: "Operation failed." }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
