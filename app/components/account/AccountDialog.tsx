"use client";
import { useEffect, useRef } from "react";
import { AccountPanel, type AccountView } from "./AccountPanel";

export function AccountDialog({ view, onClose, onBrowse }: { view: AccountView; onClose: () => void; onBrowse: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="account-dialog" aria-label="芽谱账号" onClose={onClose}>
    <button type="button" className="account-dialog-close" onClick={() => dialog.current?.close()}>关闭</button>
    <AccountPanel initialView={view} onBrowse={() => { dialog.current?.close(); onBrowse(); }} />
  </dialog>;
}
