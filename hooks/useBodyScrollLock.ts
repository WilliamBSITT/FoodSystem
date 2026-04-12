"use client";

import { useEffect } from "react";

let lockCount = 0;
let savedScrollY = 0;
let previousStyles: Record<string, string> | null = null;

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked || typeof window === "undefined") {
      return;
    }

    const { body } = document;

    if (lockCount === 0) {
      savedScrollY = window.scrollY;
      previousStyles = {
        overflow: body.style.overflow,
        position: body.style.position,
        top: body.style.top,
        left: body.style.left,
        right: body.style.right,
        width: body.style.width,
        touchAction: body.style.touchAction,
        overscrollBehavior: body.style.overscrollBehavior,
      };

      body.style.overflow = "hidden";
      body.style.position = "fixed";
      body.style.top = `-${savedScrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.touchAction = "none";
      body.style.overscrollBehavior = "none";
    }

    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);

      if (lockCount > 0 || typeof window === "undefined") {
        return;
      }

      const restored = previousStyles;

      body.style.overflow = restored?.overflow ?? "";
      body.style.position = restored?.position ?? "";
      body.style.top = restored?.top ?? "";
      body.style.left = restored?.left ?? "";
      body.style.right = restored?.right ?? "";
      body.style.width = restored?.width ?? "";
      body.style.touchAction = restored?.touchAction ?? "";
      body.style.overscrollBehavior = restored?.overscrollBehavior ?? "";

      window.scrollTo(0, savedScrollY);
      previousStyles = null;
    };
  }, [locked]);
}