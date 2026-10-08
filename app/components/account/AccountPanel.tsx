"use client";

import { useId, useState, type FormEvent } from "react";

export type AccountView = "login" | "register" | "recover" | "reset";
type Contact = "phone" | "email";
type Binding = Contact | "both";
const REGIONS = ["北京市", "天津市", "河北省", "山西省", "内蒙古自治区", "辽宁省", "吉林省", "黑龙江省", "上海市", "江苏省", "浙江省", "安徽省", "福建省", "江西省", "山东省", "河南省", "湖北省", "湖南省", "广东省", "广西壮族自治区", "海南省", "重庆市", "四川省", "贵州省", "云南省", "西藏自治区", "陕西省", "甘肃省", "青海省", "宁夏回族自治区", "新疆维吾尔自治区", "香港特别行政区", "澳门特别行政区", "台湾省"];
const RULES = [
  { label: "至少 8 位", test: (value: string) => value.length >= 8 },
  { label: "大写字母", test: (value: string) => /[A-Z]/.test(value) },
  { label: "小写字母", test: (value: string) => /[a-z]/.test(value) },
  { label: "数字", test: (value: string) => /[0-9]/.test(value) },
];

// No demo account, verification code, or successful fallback is used here.
// The production endpoint will be enabled only after real delivery is verified.
const API_URL = process.env.NEXT_PUBLIC_ACCOUNT_API_URL ?? "";
async function requestAccount(action: string, payload: Record<string, unknown>) {
  if (!API_URL) throw new Error("账号服务正在准备中，请稍后再试。");
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
    cache: "no-store",
  });
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("ok" in result)) throw new Error("账号服务返回异常，请稍后重试。");
  const message = "message" in result && typeof result.message === "string" ? result.message : undefined;
  if (!response.ok || result.ok !== true) throw new Error(message || "操作未完成，请稍后重试。");
  const recoveryToken = "recoveryToken" in result && typeof result.recoveryToken === "string" ? result.recoveryToken : undefined;
  return { ok: true as const, message, recoveryToken };
}

export function AccountPanel({ initialView = "register", onBrowse }: {
  initialView?: AccountView;
  onBrowse?: () => void;
}) {
  const id = useId();
  const [view, setView] = useState<AccountView>(initialView);
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [binding, setBinding] = useState<Binding>("email");
  const [recovery, setRecovery] = useState<Contact>("email");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [recoveryToken, setRecoveryToken] = useState("");
  const [delivery, setDelivery] = useState<Partial<Record<Contact, string>>>({});
  const registering = view === "register";
  const resetting = view === "reset";
  const contacts: Contact[] = binding === "both" ? ["phone", "email"] : [binding];

  function changeView(next: AccountView) {
    setPassword(""); setShowPassword(false); setMessage(""); setDelivery({});
    setRecoveryToken(""); setView(next);
  }
  async function sendCode(kind: Contact, form: HTMLFormElement) {
    const input = form.elements.namedItem(kind) as HTMLInputElement;
    if (!input.reportValidity()) return;
    setBusy(true); setMessage("");
    try {
      await requestAccount("send-code", { kind, contact: input.value.trim(), purpose: registering ? "register" : "recover" });
      setDelivery(previous => ({ ...previous, [kind]: "验证码已发送，请查收。" }));
    } catch (error) { setMessage(error instanceof Error ? error.message : "验证码发送失败，请重试。"); }
    finally { setBusy(false); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if ((registering || resetting) && !RULES.every(rule => rule.test(password))) {
      setMessage("密码至少 8 位，须同时包含大写字母、小写字母和数字。"); return;
    }
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    if (resetting && password !== values.confirmPassword) { setMessage("两次输入的密码不一致。"); return; }
    setBusy(true); setMessage("");
    try {
      const action = registering ? "register" : view === "recover" ? "verify-recovery" : resetting ? "reset-password" : "login";
      const result = await requestAccount(action, { ...values, role, binding, recovery, recoveryToken });
      if (view === "recover") {
        if (!result.recoveryToken) throw new Error("身份验证未完成，请重新验证。");
        setRecoveryToken(result.recoveryToken); setPassword(""); setView("reset");
      } else {
        form.reset(); setPassword("");
        setMessage(result.message || (resetting ? "密码已更新，请使用新密码登录。" : "操作已完成。"));
        if (resetting || registering) setView("login");
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "操作未完成，请稍后重试。"); }
    finally { setBusy(false); }
  }
  function contactField(kind: Contact) {
    return <div key={kind}>
      <label className="account-field" htmlFor={`${id}-${kind}`}>{kind === "phone" ? "手机号" : "邮箱"}
        <input id={`${id}-${kind}`} name={kind} type={kind === "phone" ? "tel" : "email"} required maxLength={254}
          autoComplete={kind === "phone" ? "tel" : "email"} placeholder={kind === "phone" ? "填写手机号，海外号码请带区号" : "例如：name@example.com"}
          onChange={() => setDelivery(previous => ({ ...previous, [kind]: "" }))} />
      </label>
      <div className="account-code-row">
        <label className="account-field" htmlFor={`${id}-${kind}-code`}>{kind === "phone" ? "短信验证码" : "邮箱验证码"}
          <input id={`${id}-${kind}-code`} name={`${kind}Code`} required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="6 位验证码" />
        </label>
        <button type="button" disabled={busy || !API_URL} onClick={event => {
          const form = event.currentTarget.closest("form"); if (form) void sendCode(kind, form);
        }}>获取验证码</button>
      </div>
      {delivery[kind] && <p className="account-hint" role="status">{delivery[kind]}</p>}
    </div>;
  }
  return <section className="account-panel" aria-label="芽谱账号">
    {(view === "login" || registering) && <div className="account-tabs" aria-label="账号入口">
      <button type="button" aria-pressed={view === "login"} onClick={() => changeView("login")}>登录</button>
      <button type="button" aria-pressed={registering} onClick={() => changeView("register")}>注册</button>
    </div>}
    <h2>{registering ? "加入芽谱" : view === "login" ? "欢迎回到芽谱" : resetting ? "设置新密码" : "找回密码"}</h2>
    <p className="account-subtitle">{registering ? "创建账号，开启你的音乐课堂。" : view === "login" ? "继续你的音乐学习与教学。" : resetting ? "设置后，使用新密码登录。" : "通过已绑定的手机号或邮箱验证身份。"}</p>
    {!API_URL && <p className="account-service-notice" role="status">账号服务尚未开放，请先浏览教材。</p>}
    <form key={view} onSubmit={submit} aria-busy={busy}>
      {registering && <div className="account-choices" aria-label="注册身份">
        <button type="button" aria-pressed={role === "student"} onClick={() => setRole("student")}>我是学生<small>学习 · 加入班级</small></button>
        <button type="button" aria-pressed={role === "teacher"} onClick={() => setRole("teacher")}>我是教师<small>建班 · 管理学生</small></button>
      </div>}
      {(registering || view === "login") && <label className="account-field" htmlFor={`${id}-account`}>账号
        <input id={`${id}-account`} name="account" autoComplete="username" required maxLength={64} placeholder={registering ? "设置一个登录账号" : "输入你的账号"} />
      </label>}
      {registering && <>
        <label className="account-field" htmlFor={`${id}-name`}>姓名<input id={`${id}-name`} name="name" autoComplete="name" required maxLength={40} placeholder={role === "teacher" ? "填写教师姓名" : "填写班内姓名"} /></label>
        <label className="account-field" htmlFor={`${id}-region`}>所在省级地区{role === "student" && "（可选）"}
          <select id={`${id}-region`} name="province" required={role === "teacher"} defaultValue=""><option value="">请选择省级地区</option>{REGIONS.map(region => <option key={region}>{region}</option>)}</select>
        </label>
        <p className="account-hint">{role === "teacher" ? "按任教学校所在地选择，班级自动继承。" : "入班审核通过后采用班级地区。"}</p>
      </>}
      {(registering || resetting || view === "login") && <label className="account-field" htmlFor={`${id}-password`}>{registering ? "设置密码" : resetting ? "新密码" : "密码"}
        <span className="account-password"><input id={`${id}-password`} name="password" type={showPassword ? "text" : "password"} required
          minLength={view === "login" ? undefined : 8} maxLength={128} value={password} onChange={event => setPassword(event.target.value)}
          autoComplete={view === "login" ? "current-password" : "new-password"} placeholder={view === "login" ? "输入密码" : "至少 8 位字符"} />
          <button type="button" aria-label={showPassword ? "隐藏密码" : "显示密码"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? "隐藏" : "显示"}</button>
        </span>
      </label>}
      {(registering || resetting) && <><ul className="account-password-rules" aria-label="密码要求">{RULES.map(rule => <li key={rule.label} data-met={rule.test(password)}>{rule.test(password) ? "✓" : "○"} {rule.label}</li>)}</ul><p className="account-hint">须同时包含大写字母、小写字母和数字，特殊符号可选。</p></>}
      {registering && <>
        <p className="account-binding-label">找回密码方式 · 至少绑定一项</p>
        <div className="account-choices account-binding" aria-label="联系方式">{(["email", "phone", "both"] as Binding[]).map(kind => <button key={kind} type="button" aria-pressed={binding === kind} onClick={() => { setBinding(kind); setDelivery({}); }}>{kind === "phone" ? "手机号" : kind === "email" ? "邮箱" : "两者都绑定"}</button>)}</div>
        {contacts.map(contactField)}
      </>}
      {view === "recover" && <>
        <div className="account-choices" aria-label="找回密码方式">{(["email", "phone"] as Contact[]).map(kind => <button key={kind} type="button" aria-pressed={recovery === kind} onClick={() => { setRecovery(kind); setDelivery({}); }}>{kind === "phone" ? "通过手机号" : "通过邮箱"}</button>)}</div>
        {contactField(recovery)}
      </>}
      {resetting && <label className="account-field" htmlFor={`${id}-confirm`}>确认新密码<input id={`${id}-confirm`} name="confirmPassword" type="password" autoComplete="new-password" required maxLength={128} placeholder="再次输入新密码" /></label>}
      {view === "login" && <button type="button" className="account-link" onClick={() => changeView("recover")}>忘记密码？</button>}
      {message && <p className="account-message" role="alert">{message}</p>}
      <button className="account-primary" disabled={busy || !API_URL} type="submit">{busy ? "正在处理…" : registering ? "创建账号" : resetting ? "保存新密码" : view === "recover" ? "验证并继续" : "登录"}</button>
    </form>
    <div className="account-footer">
      {registering ? <><p>{role === "teacher" ? "注册后创建班级，学生凭邀请码申请，教师确认入班。" : "注册后可使用教材，凭老师的邀请码申请加入班级。"}</p><button className="account-link" type="button" onClick={() => changeView("login")}>已有账号？去登录</button></> : <button type="button" className="account-link" onClick={() => changeView(view === "login" ? "register" : "login")}>{view === "login" ? "还没有账号？立即注册" : "返回登录"}</button>}
      {onBrowse && <button type="button" className="account-link" onClick={onBrowse}>先浏览教材</button>}
    </div>
  </section>;
}
