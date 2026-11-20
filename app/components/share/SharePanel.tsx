"use client";

// 作品的「下载与分享」：下载音频（WAV）、下载简谱图片（PNG）、生成二维码；老师在大屏上可以开摄像头扫学生的二维码。
import { useEffect, useRef, useState } from "react";
import { MAX_PAYLOAD, sharedLinkTarget, shareUrl, type ShareTool } from "../../lib/share/share-codec";
import type { RenderNote } from "../../lib/share/render-audio";
import type { ImageScore } from "../../lib/share/jianpu-image";

type Props = {
  tool: ShareTool;
  /** 作品名，用作文件名。 */
  name: string;
  /** 还没写好时为 false，按钮都不能点。 */
  ready: boolean;
  payload: () => string | null;
  audio: () => RenderNote[] | null;
  image: () => ImageScore | null;
  /** 给扫码打开的人看的一句话，例如“扫码在平板上打开这条旋律”。 */
  hint?: string;
};

export function SharePanel({ tool, name, ready, payload, audio, image, hint }: Props) {
  const [busy, setBusy] = useState<"" | "audio" | "image">("");
  const [message, setMessage] = useState("");
  const [qr, setQr] = useState<{ url: string; svg: string } | null>(null);
  const [scanning, setScanning] = useState(false);

  const downloadAudio = async () => {
    const notes = audio();
    if (!notes?.length) return;
    setBusy("audio");
    setMessage("正在合成音频，稍等几秒……");
    try {
      const { renderToWav, saveFile } = await import("../../lib/share/render-audio");
      saveFile(await renderToWav(notes), `${name}.wav`);
      setMessage("音频已下载（WAV 格式，可以直接发给家长或插进课件）。");
    } catch {
      setMessage("音频没合成出来，请检查网络后再试一次。");
    } finally {
      setBusy("");
    }
  };

  const downloadImage = async () => {
    const score = image();
    if (!score) return;
    setBusy("image");
    try {
      const [{ scorePng }, { saveFile }] = await Promise.all([import("../../lib/share/jianpu-image"), import("../../lib/share/render-audio")]);
      saveFile(await scorePng(score), `${name}.png`);
      setMessage("简谱图片已下载。");
    } catch {
      setMessage("图片没生成出来，请再试一次。");
    } finally {
      setBusy("");
    }
  };

  const showQr = async () => {
    const data = payload();
    if (!data) return;
    if (data.length > MAX_PAYLOAD) { setMessage("作品太长，二维码装不下。可以下载图片或音频来分享。"); return; }
    const url = shareUrl(tool, data);
    try {
      const { default: qrcode } = await import("qrcode-generator");
      const code = qrcode(0, "L");
      code.addData(url, "Byte");
      code.make();
      setQr({ url, svg: code.createSvgTag({ cellSize: 4, margin: 2, scalable: true }) });
      setMessage("");
    } catch {
      setMessage("二维码没生成出来，请再试一次。");
    }
  };

  const copy = async () => {
    if (!qr) return;
    try { await navigator.clipboard.writeText(qr.url); setMessage("链接已复制。"); } catch { setMessage("这台电脑不允许复制，请长按或手动选中链接。"); }
  };

  return <div className="share-panel">
    <div className="share-actions">
      <span className="share-label">下载与分享</span>
      <button type="button" onClick={downloadAudio} disabled={!ready || Boolean(busy)}>{busy === "audio" ? "正在合成…" : "下载音频"}</button>
      <button type="button" onClick={downloadImage} disabled={!ready || Boolean(busy)}>{busy === "image" ? "正在生成…" : "下载简谱图片"}</button>
      <button type="button" className="is-qr" onClick={showQr} disabled={!ready}>二维码</button>
      <button type="button" className="share-scan" onClick={() => setScanning(true)} title="老师在大屏上用摄像头扫学生的二维码">扫码收作品</button>
    </div>
    {message && <p className="share-message" role="status">{message}</p>}
    {qr && <div className="share-dialog" role="dialog" aria-modal="true" aria-label="作品二维码" onClick={(event) => { if (event.target === event.currentTarget) setQr(null); }}>
      <div className="share-card">
        <p className="share-card-title">《{name}》</p>
        <div className="share-qr" dangerouslySetInnerHTML={{ __html: qr.svg }} />
        <p className="share-card-tip">{hint ?? "用手机或平板扫码，在那台设备上打开这件作品。"}老师也可以在大屏上点「扫码收作品」，把这个码对着摄像头。</p>
        <p className="share-link">{qr.url}</p>
        <div className="share-card-actions">
          <button type="button" onClick={copy}>复制链接</button>
          <button type="button" className="is-primary" onClick={() => setQr(null)}>关闭</button>
        </div>
      </div>
    </div>}
    {scanning && <ScanDialog onClose={() => setScanning(false)} />}
  </div>;
}

/** 大屏摄像头扫学生屏幕上的二维码，扫到本站的作品链接就打开。 */
export function ScanDialog({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("正在打开摄像头……");
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  useEffect(() => {
    let stream: MediaStream | null = null;
    let frame = 0;
    let alive = true;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    void (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("no camera api");
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 } }, audio: false });
        const { default: jsQR } = await import("jsqr");
        if (!alive) return;
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        setStatus("把学生屏幕上的二维码对准摄像头，离近一点。");
        let last = 0;
        const tick = (now: number) => {
          if (!alive) return;
          frame = requestAnimationFrame(tick);
          if (now - last < 180 || video.readyState < 2 || !context) return;
          last = now;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0);
          const found = jsQR(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height, { inversionAttempts: "dontInvert" });
          if (!found?.data) return;
          const target = sharedLinkTarget(found.data);
          if (!target) { setStatus("扫到的不是芽谱作品的二维码。"); return; }
          setStatus("扫到了，正在打开……");
          alive = false;
          cancelAnimationFrame(frame);
          window.location.assign(target);
          closeRef.current();
        };
        frame = requestAnimationFrame(tick);
      } catch {
        if (alive) setStatus("打不开摄像头。可以在浏览器里允许使用摄像头；没有摄像头的话，用手机扫学生屏幕上的码。");
      }
    })();
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return <div className="share-dialog" role="dialog" aria-modal="true" aria-label="扫码收作品" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="share-card is-scan">
      <p className="share-card-title">扫码收作品</p>
      <video ref={videoRef} className="share-video" muted playsInline />
      <p className="share-card-tip" role="status">{status}</p>
      <div className="share-card-actions"><button type="button" className="is-primary" onClick={onClose}>关闭</button></div>
    </div>
  </div>;
}
