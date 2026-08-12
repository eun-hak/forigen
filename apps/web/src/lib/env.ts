import "server-only";

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY ?? "",
  ADMIN_ALLOWED_EMAIL: process.env.ADMIN_ALLOWED_EMAIL ?? "",
  KAKAO_REST_API_KEY: process.env.KAKAO_REST_API_KEY ?? "",
};

export const isAdminConfigured = Boolean(
  env.NEXT_PUBLIC_SUPABASE_URL &&
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
  env.SUPABASE_SECRET_KEY &&
  env.ADMIN_ALLOWED_EMAIL,
);

export const isPublicDataConfigured = Boolean(
  env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SECRET_KEY,
);
