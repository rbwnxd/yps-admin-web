"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw, X, AlertCircle, Download } from "lucide-react";
import { useVersionCheck } from "@/hooks/use-version-check";

interface UpdateBannerProps {
  variant?: "banner" | "popup";
}

export function UpdateBanner({ variant = "banner" }: UpdateBannerProps) {
  const { hasUpdate, dismissUpdate, reloadPage, isChecking } =
    useVersionCheck();
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    dismissUpdate();
  };

  const handleReload = () => {
    reloadPage();
  };

  // 업데이트가 없거나 숨김 상태면 렌더링하지 않음
  if (!hasUpdate || !isVisible) {
    return null;
  }

  if (variant === "popup") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Download className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">새 버전 업데이트</h3>
              <p className="text-sm text-muted-foreground">
                새로운 버전이 배포되었습니다. 페이지를 새로고침하여 최신 버전을
                이용해보세요.
              </p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className="flex items-center gap-2"
            >
              나중에
            </Button>
            <Button
              size="sm"
              onClick={handleReload}
              disabled={isChecking}
              className="flex items-center gap-2"
            >
              {isChecking ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              새로고침
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Banner variant
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
      <div className="flex flex-1 pl-10 pr-4 py-3">
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">새 버전이 배포되었습니다</p>
              <p className="text-xs opacity-90">
                페이지를 새로고침하여 최신 기능을 이용해보세요
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReload}
              disabled={isChecking}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              {isChecking ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              새로고침
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-white hover:bg-white/20 p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
