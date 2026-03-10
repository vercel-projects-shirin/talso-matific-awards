import { createServerSupabaseClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

function t(base: string): string {
  const prefix = process.env.NEXT_PUBLIC_DB_SCHEMA || "local";
  return `${prefix}__${base}`;
}

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function verifyCredentials(
  email: string,
  password: string
): Promise<{ id: string; name: string; email: string } | null> {
  const supabase = createServerSupabaseClient();

  const { data: user } = await supabase
    .from(t("users"))
    .select("id, name, email, password_hash")
    .eq("email", email)
    .single();

  if (!user) return null;

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return null;

  return { id: user.id, name: user.name, email: user.email };
}

export async function createSession(userId: string): Promise<string> {
  const supabase = createServerSupabaseClient();
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await supabase.from(t("sessions")).insert({
    user_id: userId,
    token,
    expires_at: expiresAt.toISOString(),
  });

  return token;
}

export async function deleteSession(token: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  await supabase.from(t("sessions")).delete().eq("token", token);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
