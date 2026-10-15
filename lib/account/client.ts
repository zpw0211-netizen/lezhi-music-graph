"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ACCOUNT_URL, ACCOUNT_KEY } from "./config";

let client: SupabaseClient | undefined;
export function accountClient() {
  client ??= createClient(ACCOUNT_URL, ACCOUNT_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: "yapu-account-session" },
  });
  return client;
}
export type Profile = { id: string; username: string; display_name: string; role: "teacher" | "student"; signup_province: string | null; class_province: string | null };
export type Classroom = { id: string; name: string; province: string; teacher_name?: string; invite_code?: string; status?: "pending" | "approved" | "rejected"; students?: { id: string; name: string; username: string; status: "pending" | "approved" | "rejected" }[] };

export function accountError(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? error.code : "";
  const raw = error && typeof error === "object" && "message" in error && typeof error.message === "string" ? error.message : "";
  if (code === "invalid_credentials") return "账号或密码不正确，请重新输入。";
  if (code === "email_not_confirmed" || code === "phone_not_confirmed") return "请先完成联系方式验证。";
  if (code === "otp_expired") return "验证码错误或已过期，请重新获取。";
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit" || code === "over_sms_send_rate_limit") return "请求太频繁，请稍后再试。";
  if (code === "weak_password") return "密码至少 8 位，须同时包含大写字母、小写字母和数字。";
  if (code === "23505") return "这个账号已经被使用，请换一个。";
  if (/[\u4e00-\u9fff]/.test(raw)) return raw;
  if (/fetch|network/i.test(raw)) return "网络连接失败，请检查网络后重试。";
  return "操作未完成，请稍后重试。";
}
export async function myProfile(): Promise<Profile | null> {
  const { data: { user }, error: userError } = await accountClient().auth.getUser();
  if (userError || !user) return null;
  const { data, error } = await accountClient().from("yapu_profiles").select("id,username,display_name,role,signup_province,class_province").eq("id", user.id).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}
export async function accountRpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await accountClient().rpc(name, args);
  if (error) throw error;
  return data as T;
}
export async function loginAccount(identifier: string, password: string) {
  // Resolving a username happens on the server; the browser never receives another user's contact details.
  const { data, error } = await accountClient().functions.invoke("yapu-login", { body: { identifier, password } });
  if (error || !data?.session?.access_token || !data?.session?.refresh_token) throw new Error("账号或密码不正确，或账号服务暂时不可用。");
  const { error: sessionError } = await accountClient().auth.setSession(data.session);
  if (sessionError) throw sessionError;
}
