"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface VersionInfo {
  version: string;
  buildId: string;
  deploymentId: string;
  timestamp: string;
}

export function useVersionCheck(checkInterval = 10 * 60 * 1000) {
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const checkingRef = useRef(false); // 중복 호출 방지를 위한 ref

  // 개발 환경에서는 더 긴 간격으로 체크 (30분)
  const isDevelopment = process.env.NODE_ENV === "development";
  const actualInterval = isDevelopment ? 30 * 60 * 1000 : checkInterval;

  const checkVersion = useCallback(async () => {
    // 이미 체크 중이면 실행하지 않음
    if (checkingRef.current) return;

    // 마지막 체크 시간으로 불필요한 호출 방지 (비용 최적화)
    const lastCheck = localStorage.getItem("lastVersionCheck");
    const now = Date.now();
    if (lastCheck && now - parseInt(lastCheck) < 1000 * 60 * 3) {
      return;
    }

    checkingRef.current = true;
    setIsChecking(true);

    // 체크 시간 기록
    localStorage.setItem("lastVersionCheck", now.toString());

    try {
      const response = await fetch("/api/version", {
        cache: "no-cache",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (response.ok) {
        const versionInfo: VersionInfo = await response.json();
        const newBuildId = versionInfo.buildId;

        // 초기 로드시에는 현재 버전만 설정
        if (currentVersion === null) {
          setCurrentVersion(newBuildId);
        } else if (currentVersion !== newBuildId) {
          // 버전이 다르면 업데이트 알림
          setHasUpdate(true);
        }
      }
    } catch (error) {
      console.warn("Version check failed:", error);
    } finally {
      setIsChecking(false);
      checkingRef.current = false;
    }
  }, [currentVersion, actualInterval]); // dependency 추가

  const dismissUpdate = useCallback(() => {
    setHasUpdate(false);
  }, []);

  const reloadPage = useCallback(() => {
    window.location.reload();
  }, []);

  useEffect(() => {
    // 초기 버전 체크
    checkVersion();

    // 주기적 체크 설정 (개발환경에서는 더 긴 간격)
    const interval = setInterval(checkVersion, actualInterval);

    // 브라우저 포커스 시에도 체크 (throttle 적용)
    let focusTimeout: NodeJS.Timeout | null = null;
    const handleFocus = () => {
      if (focusTimeout) clearTimeout(focusTimeout);
      focusTimeout = setTimeout(() => {
        checkVersion();
      }, 2000); // 2초 throttle
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      if (focusTimeout) clearTimeout(focusTimeout);
    };
  }, [checkVersion, actualInterval]);

  return {
    hasUpdate,
    isChecking,
    dismissUpdate,
    reloadPage,
    checkVersion,
  };
}
