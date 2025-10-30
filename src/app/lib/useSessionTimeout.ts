"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface UseSessionTimeoutOptions {
  timeoutMinutes: number;
  redirectPath: string;
  tokenKey: string;
}

export function useSessionTimeout({
  timeoutMinutes,
  redirectPath,
  tokenKey,
}: UseSessionTimeoutOptions) {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const logout = useCallback(() => {
    // Remove token
    localStorage.removeItem(tokenKey);

    // Redirect to login with expired flag
    router.push(`${redirectPath}?expired=true`);
  }, [router, redirectPath, tokenKey]);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      logout();
    }, timeoutMinutes * 60 * 1000);
  }, [logout, timeoutMinutes]);

  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    // Set initial timer
    resetTimer();

    // Add event listeners for user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Handle page visibility change (when user switches tabs or minimizes)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Check if enough time has passed since last activity
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        if (timeSinceLastActivity >= timeoutMinutes * 60 * 1000) {
          logout();
        } else {
          resetTimer();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleActivity, resetTimer, logout, timeoutMinutes]);

  // Return a function to manually reset the timer if needed
  return { resetTimer };
}
