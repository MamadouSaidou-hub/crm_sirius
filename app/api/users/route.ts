import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Create a cabinet user. Admins can create any role; managers can only create
 * commercials attached to themselves. The caller's session is checked, then the
 * account is created with the service_role key (Auth admin API) and its profile
 * updated with the chosen role / manager / agency / phone.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const callerRole = profile?.role;
  if (callerRole !== "admin" && callerRole !== "manager") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
    managerId?: string;
    agency?: string;
    phone?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  let { role, managerId } = body;
  const { name, email, password, agency, phone } = body;
  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  // A manager may only create commercials, always tied to themselves.
  if (callerRole === "manager") {
    if (role !== "commercial") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    managerId = user.id;
  }

  const admin = createAdminClient();
  const { data: created, error: createErr } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
  if (createErr || !created?.user) {
    return NextResponse.json(
      { error: createErr?.message ?? "create_failed" },
      { status: 400 },
    );
  }

  const { error: updErr } = await admin
    .from("profiles")
    .update({
      name,
      role,
      manager_id: role === "commercial" ? managerId || null : null,
      agency: agency || null,
      phone: phone || null,
    })
    .eq("id", created.user.id);
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: created.user.id });
}
