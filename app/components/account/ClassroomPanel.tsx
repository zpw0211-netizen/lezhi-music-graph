"use client";
import { useEffect, useState, type FormEvent } from "react";
import { accountClient, accountError, accountRpc, type Classroom, type Profile } from "@/lib/account/client";
import { useAccount } from "./AccountProvider";

export function ClassroomPanel({ profile, onBrowse }: { profile: Profile; onBrowse?: () => void }) {
  const { refresh } = useAccount();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function load() {
    setLoading(true);
    try { setClassroom(await accountRpc<Classroom | null>("my_yapu_class")); }
    catch (error) { setMessage(accountError(error)); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    void accountRpc<Classroom | null>("my_yapu_class")
      .then(result => { if (active) setClassroom(result); })
      .catch(error => { if (active) setMessage(accountError(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [profile.id]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const values = new FormData(event.currentTarget);
    try {
      if (profile.role === "teacher") await accountRpc("create_yapu_class", { p_name: values.get("className") });
      else setMessage(await accountRpc<string>("request_yapu_class", { p_code: values.get("inviteCode") }));
      await load(); await refresh();
    } catch (error) { setMessage(accountError(error)); }
    finally { setBusy(false); }
  }
  async function review(id: string, approve: boolean) {
    setBusy(true); setMessage("");
    try { await accountRpc("review_yapu_student", { p_student: id, p_approve: approve }); await load(); }
    catch (error) { setMessage(accountError(error)); }
    finally { setBusy(false); }
  }
  return <section className="account-panel" aria-label="我的账号与班级">
    <h2>{profile.display_name}，欢迎来到芽谱</h2>
    <p className="account-subtitle">{profile.role === "teacher" ? "教师" : "学生"} · {profile.username} · {profile.class_province || profile.signup_province || "未填写地区"}</p>
    <h3>我的班级</h3>
    {loading ? <p role="status">正在读取班级…</p> : classroom && classroom.status !== "rejected" ? <>
      <p><strong>{classroom.name}</strong> · {classroom.province}</p>
      {classroom.teacher_name && <p>教师：{classroom.teacher_name}</p>}
      {classroom.status === "pending" && <p className="account-service-notice">申请已提交，等待老师确认。你可以先使用教材。</p>}
      {classroom.status === "approved" && <p>已加入班级，可以开始学习。</p>}
      {classroom.invite_code && <div className="account-invite"><span>班级邀请码</span><strong>{classroom.invite_code}</strong><small>将此码告诉学生，审核后正式入班。</small></div>}
      {classroom.students && <>
        <h4>入班申请 · {classroom.students.filter(student => student.status === "pending").length}</h4>
        {classroom.students.filter(student => student.status === "pending").map(student => <div className="account-student" key={student.id}>
          <span>{student.name}<small>{student.username}</small></span>
          <button type="button" disabled={busy} onClick={() => void review(student.id, true)}>同意</button>
          <button type="button" disabled={busy} onClick={() => void review(student.id, false)}>拒绝</button>
        </div>)}
        <h4>学生名单 · {classroom.students.filter(student => student.status === "approved").length}</h4>
        <ul className="account-roster">{classroom.students.filter(student => student.status === "approved").map(student => <li key={student.id}>{student.name}<small>{student.username}</small></li>)}</ul>
      </>}
    </> : <form onSubmit={submit}>
      {classroom?.status === "rejected" && <p>上次申请未通过，请向老师确认邀请码后重新申请。</p>}
      <label className="account-field">{profile.role === "teacher" ? "班级名称" : "老师提供的邀请码"}
        <input name={profile.role === "teacher" ? "className" : "inviteCode"} required maxLength={profile.role === "teacher" ? 60 : 10} pattern={profile.role === "student" ? "[A-Fa-f0-9]{10}" : undefined} placeholder={profile.role === "teacher" ? "例如：七年级一班" : "输入 10 位班级邀请码"} />
      </label>
      <button className="account-primary" disabled={busy} type="submit">{profile.role === "teacher" ? "创建班级" : "申请加入班级"}</button>
    </form>}
    {message && <p className="account-message" role="alert">{message}</p>}
    <div className="account-footer">
      {onBrowse && <button type="button" className="account-primary" onClick={onBrowse}>打开教材，开始使用</button>}
      <button type="button" className="account-link" disabled={busy} onClick={() => void load()}>刷新班级</button>
      <button type="button" className="account-link" disabled={busy} onClick={async () => { const { error } = await accountClient().auth.signOut(); if (error) setMessage(accountError(error)); else await refresh(); }}>退出登录</button>
    </div>
  </section>;
}
