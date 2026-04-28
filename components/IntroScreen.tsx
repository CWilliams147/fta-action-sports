"use client";

import { useEffect, useState } from "react";

const INTRO_HOLD_MS = 2500;
const INTRO_FADE_MS = 500;
const INTRO_TOTAL_MS = INTRO_HOLD_MS + INTRO_FADE_MS;

export function IntroScreenGate({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const startFadeTimer = setTimeout(() => setFadeOut(true), INTRO_HOLD_MS);
    const doneTimer = setTimeout(() => setShowIntro(false), INTRO_TOTAL_MS);
    return () => {
      clearTimeout(startFadeTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  return (
    <>
      {children}
      {showIntro && (
        <div
          className={`fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center transition-opacity duration-500 ${
            fadeOut ? "opacity-0" : "opacity-100"
          }`}
          aria-hidden
        >
          <img
            src="/branding/fta-full-logo.png"
            alt="FTA"
            className="w-72 h-auto object-contain"
          />
          <h1 className="mt-10 text-2xl font-black tracking-[0.3em] uppercase text-fta-black text-center text-balance">
            The map is the mission
          </h1>
        </div>
      )}
    </>
  );
}
