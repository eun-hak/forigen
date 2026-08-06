"use client";

import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function LogoutButton() {
  const router = useRouter();
  return <button className="button secondary" onClick={async () => {
    await createBrowserSupabase().auth.signOut(); router.push("/login"); router.refresh();
  }}>로그아웃</button>;
}
