"use client";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { accountClient, accountError, accountRpc, loginAccount } from "@/lib/account/client";
import { ACCOUNTS_ENABLED, PHONE_ENABLED, PASSWORD_RULES, REGIONS, normalizePhone } from "@/lib/account/config";
import { useAccount } from "./AccountProvider";
import { ClassroomPanel } from "./ClassroomPanel";

export type AccountView = "login" | "register" | "recover" | "reset";
type Contact = "email" | "phone";
type Binding = Contact | "both";
type Draft = { username: string; name: string; province: string; role: "teacher" | "student"; binding: Binding; email: string; phone: string; primary: Contact };

export function AccountPanel({ initialView = "register", onBrowse }: { initialView?: AccountView; onBrowse?: () => void }) {
  const id = useId();
  const { profile, authenticated, loading, refresh } = useAccount();
  const [view, setView] = useState<AccountView>(initialView);
  const [role, setRole] = useState<"teacher" | "student">("student");
  const [binding, setBinding] = useState<Binding>("email");
  const [recovery, setRecovery] = useState<Contact>("email");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [stage, setStage] = useState<"primary" | "secondary" | "complete" | null>(null);
  const [recoveryContact, setRecoveryContact] = useState("");
  const [recoveryVerified, setRecoveryVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [now, setNow] = useState(0);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const registering = view === "register";
  const resetting = view === "reset";
  const secondsLeft = Math.max(0, Math.ceil((cooldown - now) / 1000));

  function startCooldown() {
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    const current = Date.now(); setNow(current); setCooldown(current + 60000);
    let ticks = 0;
    cooldownTimer.current = setInterval(() => { setNow(Date.now()); if (++ticks >= 60 && cooldownTimer.current) clearInterval(cooldownTimer.current); }, 1000);
  }
  useEffect(() => () => { if (cooldownTimer.current) clearInterval(cooldownTimer.current); }, []);
  function changeView(next: AccountView) {
    if (busy) return;
    setPassword(""); setShowPassword(false); setMessage(""); setRecoveryContact("");
    setRecoveryVerified(false); setDraft(null); setStage(null); setView(next);
  }
  async function complete(d: Draft) {
    await accountRpc("complete_yapu_profile", { p_username: d.username, p_name: d.name, p_role: d.role, p_province: d.province || null });
    setDraft(null); setStage(null); setPassword(""); await refresh();
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy || !ACCOUNTS_ENABLED) return;
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    setBusy(true); setMessage("");
    try {
      if (view === "login") { await loginAccount(String(values.account), password); setPassword(""); await refresh(); setView("register"); }
      else if (resetting) {
        if (!recoveryVerified) throw new Error("请先使用已绑定的联系方式验证身份。");
        if (!PASSWORD_RULES.every(rule => rule.test(password))) throw new Error("密码至少 8 位，须同时包含大写字母、小写字母和数字。");
        if (password !== values.confirmPassword) throw new Error("两次输入的密码不一致。");
        const { error } = await accountClient().auth.updateUser({ password }); if (error) throw error;
        const { error: signOutError } = await accountClient().auth.signOut({ scope: "global" });
        if (signOutError) throw new Error("密码已更新，但退出登录未完成，请重试退出登录。");
        await refresh();
        setView("login"); setPassword(""); setShowPassword(false); setRecoveryVerified(false); setRecoveryContact("");
        setMessage("密码已更新，请使用新密码登录。");
      } else if (view === "recover") {
        if (!recoveryContact) throw new Error("请先获取验证码。");
        const token = String(values.code);
        const { error } = await accountClient().auth.verifyOtp(recovery === "email"
          ? { email: recoveryContact, token, type: "recovery" }
          : { phone: recoveryContact, token, type: "sms" });
        if (error) throw error;
        setRecoveryVerified(true); setPassword(""); setView("reset");
      } else if (draft && stage) {
        const token = String(values.code);
        if (stage !== "complete") {
          const { error } = await accountClient().auth.verifyOtp(stage === "secondary"
            ? { phone: draft.phone, token, type: "phone_change" }
            : draft.primary === "email" ? { email: draft.email, token, type: "email" } : { phone: draft.phone, token, type: "sms" });
          if (error) throw error;
        }
        if (draft.binding === "both" && stage === "primary") {
          setStage("secondary");
          const { error } = await accountClient().auth.updateUser({ phone: draft.phone });
          if (error) throw error;
          setMessage("邮箱已验证，请再输入手机收到的验证码。"); startCooldown();
        } else {
          // Let the user fix a taken username without losing contact verification.
          setStage("complete"); await complete({ ...draft, username: String(values.verifiedAccount || draft.username) });
        }
      } else {
        const d: Draft = { username: String(values.account).trim().toLowerCase(), name: String(values.name).trim(), province: String(values.province || ""), role, binding,
          email: String(values.email || "").trim().toLowerCase(), phone: binding !== "email" ? normalizePhone(String(values.phone)) : "", primary: binding === "phone" ? "phone" : "email" };
        if (authenticated) { await complete(d); return; }
        if (!PASSWORD_RULES.every(rule => rule.test(password))) throw new Error("密码至少 8 位，须同时包含大写字母、小写字母和数字。");
        if (binding !== "email" && !PHONE_ENABLED) throw new Error("短信服务正在配置，请稍后再试。");
        const { error } = await accountClient().auth.signUp(d.primary === "email" ? { email: d.email, password } : { phone: d.phone, password });
        if (error) throw error;
        setDraft(d); setStage("primary"); setPassword(""); startCooldown();
        setMessage("验证码已发送，请查收后完成注册。");
      }
    } catch (error) { setMessage(accountError(error)); }
    finally { setBusy(false); }
  }
  async function resendCode() {
    if (!draft || busy || secondsLeft || !ACCOUNTS_ENABLED) return;
    setBusy(true); setMessage("");
    try {
      const { error } = stage === "secondary"
        ? await accountClient().auth.updateUser({ phone: draft.phone })
        : await accountClient().auth.resend(draft.primary === "email" ? { type: "signup", email: draft.email } : { type: "sms", phone: draft.phone });
      if (error) throw error;
      startCooldown(); setMessage("验证码已重新发送。");
    } catch (error) { setMessage(accountError(error)); }
    finally { setBusy(false); }
  }
  async function sendRecovery(form: HTMLFormElement) {
    if (busy || secondsLeft || !ACCOUNTS_ENABLED) return;
    const input = form.elements.namedItem("contact") as HTMLInputElement;
    if (!input.reportValidity()) return;
    setBusy(true); setMessage("");
    try {
      if (recovery === "phone" && !PHONE_ENABLED) throw new Error("短信服务正在配置，请稍后再试。");
      const contact = recovery === "email" ? input.value.trim().toLowerCase() : normalizePhone(input.value);
      const { error } = recovery === "email" ? await accountClient().auth.resetPasswordForEmail(contact)
        : await accountClient().auth.signInWithOtp({ phone: contact, options: { shouldCreateUser: false } });
      if (error) throw error;
      setRecoveryContact(contact); startCooldown(); setMessage("如果该联系方式已绑定账号，你将收到验证码，请查收。");
    } catch (error) { setMessage(accountError(error)); }
    finally { setBusy(false); }
  }
  function contactField(kind: Contact) {
    return <label className="account-field" key={kind} htmlFor={`${id}-${kind}`}>{kind === "email" ? "邮箱" : "手机号"}
      <input id={`${id}-${kind}`} name={kind} type={kind === "email" ? "email" : "tel"} autoComplete={kind === "email" ? "email" : "tel"} required={!authenticated} maxLength={254} placeholder={kind === "email" ? "例如：name@example.com" : "海外号码请带国家区号"} />
    </label>;
  }
  if (ACCOUNTS_ENABLED && loading) return <section className="account-panel" role="status">正在读取账号…</section>;
  if (profile && !resetting && view !== "recover" && !draft) return <ClassroomPanel key={profile.id} profile={profile} onBrowse={onBrowse} />;
  return <section className="account-panel" aria-label="芽谱账号">
    {(view === "login" || registering) && !draft && <div className="account-tabs">
      <button type="button" aria-pressed={view === "login"} disabled={busy} onClick={() => changeView("login")}>登录</button>
      <button type="button" aria-pressed={registering} disabled={busy} onClick={() => changeView("register")}>注册</button>
    </div>}
    <h2>{registering ? "加入芽谱" : view === "login" ? "欢迎回到芽谱" : resetting ? "设置新密码" : "找回密码"}</h2>
    <p className="account-subtitle">{registering ? "创建账号，开启你的音乐课堂。" : view === "login" ? "继续你的音乐学习与教学。" : resetting ? "设置后，使用新密码登录。" : PHONE_ENABLED ? "通过已绑定的手机号或邮箱验证身份。" : "通过已绑定的邮箱验证身份。"}</p>
    {!ACCOUNTS_ENABLED && <p className="account-service-notice" role="status">账号服务正在准备中，请先浏览教材。</p>}
    {authenticated && !profile && !draft && registering && <p className="account-hint">联系方式已验证，请完善姓名、账号和身份。</p>}
    <form key={`${view}-${stage}`} onSubmit={submit} aria-busy={busy}>
      {draft && stage ? <>
        {stage !== "complete" && <>
          <p>{stage === "secondary" || draft.primary === "phone" ? `验证码已发往手机 ${draft.phone}` : `验证码已发往邮箱 ${draft.email}`}</p>
          <label className="account-field" htmlFor={`${id}-code`}>验证码<input id={`${id}-code`} name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required placeholder="6 位验证码" /></label>
          <button className="account-link" type="button" disabled={busy || Boolean(secondsLeft)} onClick={() => void resendCode()}>{secondsLeft ? `${secondsLeft} 秒后可重发` : "重新发送验证码"}</button>
        </>}
        {stage === "complete" && <label className="account-field">登录账号<input name="verifiedAccount" defaultValue={draft.username} required pattern="[A-Za-z][A-Za-z0-9_]{2,23}" minLength={3} maxLength={24} /></label>}
      </> : <>
        {registering && <div className="account-choices" aria-label="注册身份"><button type="button" aria-pressed={role === "student"} disabled={busy} onClick={() => setRole("student")}>我是学生<small>学习 · 加入班级</small></button><button type="button" aria-pressed={role === "teacher"} disabled={busy} onClick={() => setRole("teacher")}>我是教师<small>建班 · 管理学生</small></button></div>}
        {(registering || view === "login") && <label className="account-field" htmlFor={`${id}-account`}>账号<input id={`${id}-account`} name="account" autoComplete="username" required maxLength={registering ? 24 : 254} minLength={registering ? 3 : undefined} pattern={registering ? "[A-Za-z][A-Za-z0-9_]{2,23}" : undefined} placeholder={registering ? "字母开头，3–24 位字母、数字或下划线" : PHONE_ENABLED ? "账号、邮箱或手机号" : "账号或邮箱"} /></label>}
        {registering && <><label className="account-field" htmlFor={`${id}-name`}>姓名<input id={`${id}-name`} name="name" autoComplete="name" required maxLength={40} placeholder="填写班内使用的姓名" /></label>
          <label className="account-field" htmlFor={`${id}-region`}>所在省级地区{role === "student" && "（可选）"}<select id={`${id}-region`} name="province" required={role === "teacher"} defaultValue=""><option value="">请选择省级地区</option>{REGIONS.map(region => <option key={region}>{region}</option>)}</select></label>
          <p className="account-hint">{role === "teacher" ? "按任教学校所在地选择，班级自动继承。" : "入班审核通过后采用班级地区。"}</p>
        </>}
        {(view === "login" || resetting || (registering && !authenticated)) && <label className="account-field" htmlFor={`${id}-password`}>{registering ? "设置密码" : resetting ? "新密码" : "密码"}<span className="account-password"><input id={`${id}-password`} name="password" type={showPassword ? "text" : "password"} required minLength={view === "login" ? undefined : 8} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} autoComplete={view === "login" ? "current-password" : "new-password"} placeholder={view === "login" ? "输入密码" : "至少 8 位字符"} /><button type="button" aria-label={showPassword ? "隐藏密码" : "显示密码"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? "隐藏" : "显示"}</button></span></label>}
        {(resetting || (registering && !authenticated)) && <><ul className="account-password-rules" aria-label="密码要求">{PASSWORD_RULES.map(rule => <li key={rule.label} data-met={rule.test(password)}>{rule.test(password) ? "✓" : "○"} {rule.label}</li>)}</ul><p className="account-hint">须同时包含大写字母、小写字母和数字，特殊符号可选。</p></>}
        {registering && !authenticated && <><p className="account-binding-label">{PHONE_ENABLED ? "找回密码方式 · 至少绑定一项" : "绑定邮箱 · 用于验证和找回密码"}</p>{PHONE_ENABLED && <div className="account-choices account-binding" aria-label="联系方式">{(["email", "phone", "both"] as Binding[]).map(kind => <button key={kind} type="button" disabled={busy} aria-pressed={binding === kind} onClick={() => setBinding(kind)}>{kind === "email" ? "邮箱" : kind === "phone" ? "手机号" : "两者都绑定"}</button>)}</div>}{(binding === "both" ? ["email", "phone"] as Contact[] : [binding]).map(contactField)}</>}
        {view === "recover" && <>
          {PHONE_ENABLED && <div className="account-choices" aria-label="找回密码方式">{(["email", "phone"] as Contact[]).map(kind => <button key={kind} type="button" disabled={busy} aria-pressed={recovery === kind} onClick={() => { setRecovery(kind); setRecoveryContact(""); }}>{kind === "email" ? "通过邮箱" : "通过手机号"}</button>)}</div>}
          <label className="account-field" htmlFor={`${id}-contact`}>{recovery === "email" ? "已绑定的邮箱" : "已绑定的手机号"}<input key={recovery} id={`${id}-contact`} name="contact" type={recovery === "email" ? "email" : "tel"} required maxLength={254} onChange={() => setRecoveryContact("")} /></label>
          <button className="account-link" type="button" disabled={busy || !ACCOUNTS_ENABLED || Boolean(secondsLeft)} onClick={event => { const form = event.currentTarget.closest("form"); if (form) void sendRecovery(form); }}>{secondsLeft ? `${secondsLeft} 秒后可重发` : "获取验证码"}</button>
          {recoveryContact && <label className="account-field">验证码<input name="code" required inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" placeholder="6 位验证码" /></label>}
        </>}
        {resetting && <label className="account-field">确认新密码<input name="confirmPassword" type="password" autoComplete="new-password" required maxLength={128} placeholder="再次输入新密码" /></label>}
        {view === "login" && <button type="button" className="account-link" onClick={() => changeView("recover")}>忘记密码？</button>}
      </>}
      {message && <p className="account-message" role="alert">{message}</p>}
      <button className="account-primary" type="submit" disabled={busy || !ACCOUNTS_ENABLED || (view === "recover" && !recoveryContact)}>{busy ? "正在处理…" : draft ? stage === "complete" ? "完成注册" : "验证并继续" : registering ? authenticated ? "完成注册" : "获取验证码并注册" : resetting ? "保存新密码" : view === "recover" ? "验证并继续" : "登录"}</button>
    </form>
    <div className="account-footer">
      {registering && <p>{role === "teacher" ? "注册后创建班级，学生凭邀请码申请，教师确认入班。" : "注册后可使用教材，凭老师的邀请码申请加入班级。"}</p>}
      {!draft && <button type="button" className="account-link" disabled={busy} onClick={() => changeView(view === "login" ? "register" : "login")}>{view === "login" ? "还没有账号？立即注册" : "返回登录"}</button>}
      {onBrowse && <button type="button" className="account-link" onClick={onBrowse}>先浏览教材</button>}
    </div>
  </section>;
}
