import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MIN_PASSWORD_LENGTH, creatableRoles } from "@/lib/permissions";
import type { UserRole } from "@/lib/types";

/**
 * Create a cabinet user. The roles a caller may create depend on their own role
 * (super admin: all; admin: not admins; manager: commercials attached to
 * themselves). The caller's session is checked, then the
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
  const callerRole = profile?.role as UserRole | undefined;
  if (!callerRole || creatableRoles(callerRole).length === 0) {
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

  let { managerId } = body;
  const { role, name, email, password, agency, phone } = body;
  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  // Never trust the browser: re-check every field on the server.
  const isText = (v: unknown, max: number): v is string =>
    typeof v === "string" && v.length <= max;
  if (
    !isText(name, 120) ||
    !isText(email, 254) ||
    !isText(password, 128) ||
    !isText(role, 32) ||
    !isText(agency ?? "", 120) ||
    !isText(phone ?? "", 32) ||
    !isText(managerId ?? "", 64)
  ) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: "weak_password" }, { status: 400 });
  }

  // Each role may only hand out the roles below it (see lib/permissions.ts):
  // the director cannot create admins, a manager only commercials.
  if (!creatableRoles(callerRole).includes(role as UserRole)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  // A manager's new commercial is always tied to that manager.
  if (callerRole === "manager") {
    managerId = user.id;
  }
  // A commercial always reports to a manager.
  if (role === "commercial" && !managerId) {
    return NextResponse.json({ error: "manager_required" }, { status: 400 });
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

  const response = NextResponse.json({ ok: true, id: created.user.id });
  // Restrict CORS to same-origin only (internal tool)
  response.headers.set("Access-Control-Allow-Origin", "same-origin");
  response.headers.set("Access-Control-Allow-Methods", "POST");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}
