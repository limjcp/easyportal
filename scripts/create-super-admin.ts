/**
 * One-time bootstrap: creates the platform super admin in Supabase Auth.
 *
 * Usage:
 *   bun run scripts/create-super-admin.ts
 *
 * Requires in .env (or environment):
 *   SUPABASE_URL or VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SUPER_ADMIN_EMAIL
 *   SUPER_ADMIN_PASSWORD
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.SUPER_ADMIN_EMAIL;
const password = process.env.SUPER_ADMIN_PASSWORD;

if (!url || !serviceKey || !email || !password) {
  console.error(
    "Missing env. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD"
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: existing } = await admin.auth.admin.listUsers();
  const found = existing.users.find((u) => u.email?.toLowerCase() === email!.toLowerCase());

  let userId = found?.id;

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: email!,
      password: password!,
      email_confirm: true,
      user_metadata: {
        display_name: "Super Admin",
        first_name: "Super",
        last_name: "Admin",
      },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log("Created auth user:", email);
  } else {
    console.log("Auth user already exists:", email);
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ is_super_admin: true, display_name: "Super Admin" })
    .eq("id", userId);

  if (profileError) throw profileError;

  console.log("Super admin flag set for", userId);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
