"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  MELODY_PLAYBACK_STARTED,
  normalizeRecordingWorkName,
  RECORDINGS_BY_WORK,
  VOCAL_PLAYBACK_STARTED,
} from "../../lib/lesson/recordings";
import styles from "./VocalDemo.module.css";

export function VocalDemo({ workName, assetUrl }: {
  workName: string;
  assetUrl: (path: string) => string;
}) {
  const recordings = useMemo(() => RECORDINGS_BY_WORK[normalizeRecordingWorkName(workName)] ?? [], [workName]);
  const audioRefs = useRef<Array<HTMLAudioElement | null>>([]);

  useEffect(() => {
    if (recordings.length === 0) return;
    const stopVocalAudio = () => audioRefs.current.forEach((audio) => audio?.pause());
    window.addEventListener(MELODY_PLAYBACK_STARTED, stopVocalAudio);
    return () => window.removeEventListener(MELODY_PLAYBACK_STARTED, stopVocalAudio);
  }, [recordings]);

  if (recordings.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="vocal-demo-heading">
      <h3 id="vocal-demo-heading" className={styles.heading}>人声示范</h3>
      <ul className={styles.list}>
        {recordings.map((recording, index) => (
          <li className={styles.recording} key={`${recording.file}-${index}`}>
            <p className={styles.performer}>
              <strong>表演者：</strong>{recording.performer}
              {recording.year ? `（${recording.year} 年录音）` : ""}
            </p>
            <p className={styles.versionNote}>{recording.versionNote}</p>
            <audio
              ref={(element) => { audioRefs.current[index] = element; }}
              controls
              preload="none"
              src={assetUrl(recording.file)}
              aria-label={`${workName}：${recording.performer}人声示范`}
              onPlay={() => window.dispatchEvent(new Event(VOCAL_PLAYBACK_STARTED))}
            />
            <p className={styles.details}>
              <span><strong>署名：</strong>{recording.attribution}</span>
              <span>
                <strong>许可：</strong>
                <a href={recording.licenseUrl} target="_blank" rel="noreferrer">{recording.licenseName}</a>
              </span>
              <a href={recording.sourceUrl} target="_blank" rel="noreferrer">来源页</a>
              <span className={styles.language}>语种：{recording.language}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
