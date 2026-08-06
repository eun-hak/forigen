"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    const { error: signInError } = await createBrowserSupabase().auth.signInWithPassword({
      email: String(form.get("email")), password: String(form.get("password")),
    });
    if (signInError) { setError(signInError.message); setLoading(false); return; }
    router.push("/admin"); router.refresh();
  }
  return <main className="shell" style={{ maxWidth: 480, paddingTop: 100 }}>
    <form className="panel grid" onSubmit={submit}>
      <div><h1>K-Beauty Now</h1><p className="muted">관리자 계정으로 로그인하세요.</p></div>
      <label>이메일<input className="input" name="email" type="email" required /></label>
      <label>비밀번호<input className="input" name="password" type="password" required /></label>
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
      <button className="button" disabled={loading}>{loading ? "로그인 중…" : "로그인"}</button>
    </form>
  </main>;
}
