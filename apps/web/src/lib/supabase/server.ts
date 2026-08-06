import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export async function createAuthClient() {
  const store = await cookies();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (items) => {
        try { items.forEach(({ name, value, options }) => store.set(name, value, options)); }
        catch { /* Server Components cannot set response cookies. Proxy refresh handles it. */ }
      },
    },
  });
}

export async function requireAdmin() {
  const client = await createAuthClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user || user.email?.toLowerCase() !== env.ADMIN_ALLOWED_EMAIL.toLowerCase()) return null;
  return user;
}
