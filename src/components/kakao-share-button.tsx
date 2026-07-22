"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";

type KakaoShareButtonProps = {
  category: string;
  title: string;
  description?: string;
  path: string;
  compact?: boolean;
};

type KakaoSdk = {
  init: (key: string) => void;
  isInitialized: () => boolean;
  Share: {
    sendDefault: (options: {
      objectType: "text";
      text: string;
      link: { mobileWebUrl: string; webUrl: string };
      buttons: Array<{ title: string; link: { mobileWebUrl: string; webUrl: string } }>;
    }) => void;
  };
};

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}

const KAKAO_SDK_ID = "kakao-javascript-sdk";
const KAKAO_SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js";
const KAKAO_SDK_INTEGRITY = "sha384-OL+ylM/iuPLtW5U3XcvLSGhE8JzReKDank5InqlHGWPhb4140/yrBw0bg0y7+C9J";
let kakaoSdkPromise: Promise<KakaoSdk> | null = null;

export function KakaoShareButton({ category, title, description, path, compact = false }: KakaoShareButtonProps) {
  const [feedback, setFeedback] = useState("");
  const appKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;

  useEffect(() => {
    if (appKey) void loadKakaoSdk().catch(() => undefined);
  }, [appKey]);

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    const text = createShareText(category, title, description);
    setFeedback("");

    if (appKey) {
      try {
        const kakao = await loadKakaoSdk();
        if (!kakao.isInitialized()) kakao.init(appKey);
        kakao.Share.sendDefault({
          objectType: "text",
          text,
          link: { mobileWebUrl: url, webUrl: url },
          buttons: [{ title: "질투 길드에서 확인", link: { mobileWebUrl: url, webUrl: url } }],
        });
        return;
      } catch {
        // If Kakao is temporarily unavailable, continue with the device share sheet.
      }
    }

    if (navigator.share) {
      try {
        await navigator.share({ title: `[질투 길드] ${title}`, text, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setFeedback("공유 링크가 복사됐습니다.");
      window.setTimeout(() => setFeedback(""), 2500);
    } catch {
      setFeedback("공유하지 못했습니다. 주소를 직접 복사해 주세요.");
    }
  }

  const label = feedback || "카톡 공유";
  return (
    <>
      <button
        aria-label={`${title} 카카오톡으로 공유`}
        className={`kakao-share-button${compact ? " is-compact" : " button"}`}
        onClick={() => void share()}
        title={feedback || "카카오톡으로 공유"}
        type="button"
      >
        <Icon name="share" size={compact ? 15 : 17} />
        {compact ? null : <span>{label}</span>}
      </button>
      {compact && feedback ? <span className="sr-only" role="status">{feedback}</span> : null}
    </>
  );
}

function createShareText(category: string, title: string, description?: string) {
  return [`[질투 길드 · ${category}]`, title, description?.trim()].filter(Boolean).join("\n").slice(0, 200);
}

function loadKakaoSdk() {
  if (window.Kakao) return Promise.resolve(window.Kakao);
  if (kakaoSdkPromise) return kakaoSdkPromise;

  kakaoSdkPromise = new Promise<KakaoSdk>((resolve, reject) => {
    const existing = document.getElementById(KAKAO_SDK_ID) as HTMLScriptElement | null;
    const finish = () => window.Kakao ? resolve(window.Kakao) : reject(new Error("카카오 SDK를 불러오지 못했습니다."));

    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", () => reject(new Error("카카오 SDK를 불러오지 못했습니다.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = KAKAO_SDK_ID;
    script.src = KAKAO_SDK_URL;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.integrity = KAKAO_SDK_INTEGRITY;
    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", () => reject(new Error("카카오 SDK를 불러오지 못했습니다.")), { once: true });
    document.head.appendChild(script);
  });

  return kakaoSdkPromise;
}
