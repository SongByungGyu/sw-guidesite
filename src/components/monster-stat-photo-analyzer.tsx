"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import type { MonsterBuildDraft } from "@/components/team-build-editor";
import {
  getMonsterStatQuality,
  monsterStatFields,
  parseMonsterScreenshotText,
  type MonsterStatKey,
  type MonsterStatValues,
} from "@/lib/monster-stat-ocr";

type AnalyzerProps = {
  build: MonsterBuildDraft;
  monsterName: string;
  onApply: (stats: MonsterStatValues, runeSets: string) => void;
  onClose: () => void;
  open: boolean;
};

type AnalysisPhase = "idle" | "analyzing" | "complete" | "error";

export function MonsterStatPhotoAnalyzer({ build, monsterName, onApply, onClose, open }: AnalyzerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [phase, setPhase] = useState<AnalysisPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("사진을 선택해 주세요.");
  const [stats, setStats] = useState<MonsterStatValues>(() => statsFromBuild(build));
  const [runeSets, setRuneSets] = useState(build?.runeSets ?? "");
  const [detectedKeys, setDetectedKeys] = useState<MonsterStatKey[]>([]);
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const reviewCount = useMemo(
    () => monsterStatFields.filter((field) => getMonsterStatQuality(field.key, stats[field.key]) !== "ok").length,
    [stats],
  );

  function selectFile(selected: File | undefined) {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setError("PNG 또는 JPG 형식의 이미지를 선택해 주세요.");
      return;
    }
    if (selected.size > 20 * 1024 * 1024) {
      setError("사진 크기는 20MB 이하만 사용할 수 있습니다.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setPhase("idle");
    setDetectedKeys([]);
    setRawText("");
    setError("");
    setProgress(0);
    setProgressLabel("분석 준비가 완료되었습니다.");
  }

  async function analyze() {
    if (!file || phase === "analyzing") return;
    setPhase("analyzing");
    setProgress(0);
    setError("");
    setProgressLabel("무료 OCR 엔진을 불러오는 중입니다.");

    let worker: Awaited<ReturnType<typeof import("tesseract.js")["createWorker"]>> | null = null;
    try {
      const canvas = await prepareImageForOcr(file);
      const { createWorker, OEM, PSM } = await import("tesseract.js");
      worker = await createWorker(["kor", "eng"], OEM.LSTM_ONLY, {
        logger: (message) => {
          setProgress(Math.round(message.progress * 100));
          setProgressLabel(progressMessage(message.status));
        },
      });
      await worker.setParameters({
        preserve_interword_spaces: "1",
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,
        user_defined_dpi: "300",
      });
      const result = await worker.recognize(canvas);
      const parsed = parseMonsterScreenshotText(result.data.text);
      setRawText(result.data.text.trim());
      setDetectedKeys(parsed.detectedKeys);
      setStats((current) => mergeDetectedStats(current, parsed.stats, parsed.detectedKeys));
      if (parsed.runeSets) setRuneSets(parsed.runeSets);
      setProgress(100);
      setProgressLabel(
        parsed.detectedKeys.length
          ? `${parsed.detectedKeys.length}/8개 스탯을 찾았습니다. 모든 숫자를 한 번 확인해 주세요.`
          : "스탯을 찾지 못했습니다. 스탯 영역이 크게 보이는 사진으로 다시 시도해 주세요.",
      );
      setPhase("complete");
    } catch (caught) {
      console.error(caught);
      setError("사진 분석에 실패했습니다. 인터넷 연결을 확인하거나 PNG/JPG 캡처로 다시 시도해 주세요.");
      setProgressLabel("분석하지 못했습니다.");
      setPhase("error");
    } finally {
      await worker?.terminate().catch(() => undefined);
    }
  }

  function updateStat(key: MonsterStatKey, value: string) {
    setStats((current) => ({ ...current, [key]: value === "" ? null : Number(value) }));
  }

  function close() {
    if (phase === "analyzing") return;
    onClose();
  }

  function apply() {
    onApply(stats, runeSets.trim());
    onClose();
  }

  return (
    <dialog
      aria-labelledby="photo-stat-title"
      className="monster-dialog photo-stat-dialog"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      onClose={onClose}
      ref={dialogRef}
    >
      <div className="photo-stat-shell">
        <header className="dialog-header">
          <div>
            <p className="eyebrow">무료 AI OCR · 베타</p>
            <h2 id="photo-stat-title">{monsterName} 사진으로 스펙 입력</h2>
            <p>사진은 서버에 저장되지 않고 현재 기기에서만 분석됩니다.</p>
          </div>
          <button aria-label="사진 분석 닫기" className="icon-button" disabled={phase === "analyzing"} onClick={close} type="button">
            <Icon name="x" />
          </button>
        </header>

        <div className="photo-stat-body">
          <section className="photo-stat-source">
            <div className="photo-stat-help">
              <Icon name="sparkles" size={18} />
              <div>
                <strong>몬스터 상세 스탯이 크게 보이게</strong>
                <p>사진 1장에 몬스터 1마리만, 체력부터 효과 적중까지 보이게 올려주세요.</p>
              </div>
            </div>
            <button className={`photo-upload-area${previewUrl ? " has-image" : ""}`} disabled={phase === "analyzing"} onClick={() => fileInputRef.current?.click()} type="button">
              {/* blob 미리보기는 Next Image 최적화 대상이 아닙니다. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {previewUrl ? <img alt="분석할 몬스터 스펙 캡처 미리보기" src={previewUrl} /> : <><span><Icon name="plus" /></span><strong>카메라 또는 사진 선택</strong><small>PNG·JPG · 최대 20MB</small></>}
            </button>
            <input
              accept="image/png,image/jpeg,image/webp"
              capture="environment"
              className="sr-only"
              onChange={(event) => selectFile(event.target.files?.[0])}
              ref={fileInputRef}
              type="file"
            />
            <button className="button primary photo-analyze-button" disabled={!file || phase === "analyzing"} onClick={() => void analyze()} type="button">
              <Icon name="sparkles" size={17} />
              {phase === "analyzing" ? "사진 분석 중…" : phase === "complete" ? "다시 분석" : "무료 AI로 분석"}
            </button>
            <div className={`photo-analysis-progress phase-${phase}`} aria-live="polite">
              <div><span style={{ width: `${progress}%` }} /></div>
              <p>{progressLabel}</p>
            </div>
            {error ? <p className="form-error">{error}</p> : null}
          </section>

          <section className="photo-stat-results">
            <header>
              <div>
                <strong>분석 결과 확인</strong>
                <p>잘못 읽은 숫자는 직접 고친 뒤 적용하세요.</p>
              </div>
              {phase === "complete" ? <span className={reviewCount ? "needs-review" : "all-clear"}>{reviewCount ? `${reviewCount}개 확인 필요` : "8개 확인 완료"}</span> : null}
            </header>
            <label className="photo-rune-field">
              <span>룬 세트 <small>아이콘은 직접 확인</small></span>
              <input onChange={(event) => setRuneSets(event.target.value)} placeholder="예: 폭주 + 의지" value={runeSets} />
            </label>
            <div className="photo-stat-grid">
              {monsterStatFields.map((field) => {
                const quality = getMonsterStatQuality(field.key, stats[field.key]);
                const detected = detectedKeys.includes(field.key);
                return <label className={`quality-${quality}${detected ? " is-detected" : ""}`} key={field.key}>
                  <span>{field.label}{detected ? <em>인식됨</em> : null}</span>
                  <input
                    inputMode="numeric"
                    min="0"
                    onChange={(event) => updateStat(field.key, event.target.value)}
                    placeholder={field.placeholder}
                    type="number"
                    value={stats[field.key] ?? ""}
                  />
                  <small>{quality === "missing" ? "사진에서 못 찾음" : quality === "warning" ? "수치 확인 필요" : "정상 범위"}</small>
                </label>;
              })}
            </div>
            {rawText ? <details className="photo-ocr-raw"><summary>AI가 읽은 원문 확인</summary><pre>{rawText}</pre></details> : null}
          </section>
        </div>

        <footer className="dialog-footer">
          <p>첫 분석은 무료 언어 데이터를 내려받아 조금 더 걸릴 수 있습니다.</p>
          <div>
            <button className="button secondary" disabled={phase === "analyzing"} onClick={close} type="button">취소</button>
            <button className="button primary" disabled={phase !== "complete" || detectedKeys.length === 0} onClick={apply} type="button">
              <Icon name="check" size={17} /> 스펙에 적용
            </button>
          </div>
        </footer>
      </div>
    </dialog>
  );
}

function statsFromBuild(build: MonsterBuildDraft): MonsterStatValues {
  return {
    hp: build?.hp ?? null,
    attack: build?.attack ?? null,
    defense: build?.defense ?? null,
    speed: build?.speed ?? null,
    critRate: build?.critRate ?? null,
    critDamage: build?.critDamage ?? null,
    resistance: build?.resistance ?? null,
    accuracy: build?.accuracy ?? null,
  };
}

function mergeDetectedStats(current: MonsterStatValues, parsed: MonsterStatValues, detectedKeys: MonsterStatKey[]) {
  const next = { ...current };
  for (const key of detectedKeys) next[key] = parsed[key];
  return next;
}

function progressMessage(status: string) {
  if (status.includes("core")) return "무료 OCR 엔진을 준비하는 중입니다.";
  if (status.includes("language")) return "한글·영문 인식 데이터를 불러오는 중입니다.";
  if (status.includes("initializing")) return "사진 분석기를 초기화하는 중입니다.";
  if (status.includes("recognizing")) return "스탯 숫자를 읽는 중입니다.";
  return "사진을 분석하는 중입니다.";
}

async function prepareImageForOcr(file: File) {
  const bitmap = await createImageBitmap(file);
  const longestSide = Math.max(bitmap.width, bitmap.height);
  const upscale = Math.max(1, 1600 / Math.max(bitmap.width, 1));
  const scale = Math.min(2.2, upscale, 2600 / Math.max(longestSide, 1));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    bitmap.close();
    throw new Error("Canvas is not available");
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  let luminanceTotal = 0;
  for (let offset = 0; offset < image.data.length; offset += 16) {
    luminanceTotal += 0.299 * image.data[offset] + 0.587 * image.data[offset + 1] + 0.114 * image.data[offset + 2];
  }
  const sampledPixels = Math.ceil(image.data.length / 16);
  const invert = luminanceTotal / sampledPixels < 105;

  for (let offset = 0; offset < image.data.length; offset += 4) {
    const luminance = 0.299 * image.data[offset] + 0.587 * image.data[offset + 1] + 0.114 * image.data[offset + 2];
    const base = invert ? 255 - luminance : luminance;
    const enhanced = Math.max(0, Math.min(255, 128 + (base - 128) * 1.55));
    image.data[offset] = enhanced;
    image.data[offset + 1] = enhanced;
    image.data[offset + 2] = enhanced;
  }
  context.putImageData(image, 0, 0);

  return canvas;
}
