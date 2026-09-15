import { useNavigate } from "@tanstack/react-router";
import { Download, RefreshCw, Share, Smartphone, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePwa } from "@/lib/pwa";
import { cn } from "@/lib/utils";

export function InstallPrompt() {
  const pwa = usePwa();
  const showBanner = !pwa.standalone && !pwa.dismissed && (pwa.canInstall || pwa.ios);
  return (
    <>
      {pwa.offline ? <OfflineBar /> : null}
      {pwa.updateReady ? <UpdateBar onReload={pwa.applyUpdate} /> : null}
      <InstallBanner pwa={pwa} visible={showBanner} />
    </>
  );
}

export function InstallSpacer() {
  const pwa = usePwa();
  const show = !pwa.standalone && !pwa.dismissed && (pwa.canInstall || pwa.ios);
  if (!show) return null;
  return <div className="h-[4.75rem] print:hidden" aria-hidden />;
}

export function InstallHeaderButton() {
  const pwa = usePwa();
  const navigate = useNavigate();
  if (pwa.standalone) {
    return (
      <span className="ml-auto hidden rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground sm:inline">
        主畫面應用 · 本機儲存
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        if (pwa.canInstall) void pwa.install();
        else void navigate({ to: "/settings" });
      }}
      className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <Download className="size-3.5" />
      <span className="hidden sm:inline">安裝到主畫面</span>
      <span className="sm:hidden">安裝</span>
    </button>
  );
}

export function InstallCard() {
  const pwa = usePwa();
  return (
    <Card id="pwa-install">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="size-4" />
          安裝到主畫面
        </CardTitle>
        <CardDescription>
          像 App 一樣從主畫面開啟。分數仍只存在這部裝置，不上雲。
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {pwa.standalone ? (
          <p className="rounded-md bg-pass px-3 py-2 text-pass-fg">已以獨立應用程式開啟。</p>
        ) : pwa.canInstall ? (
          <Button onClick={() => void pwa.install()}>
            <Download className="size-4" />
            安裝應用程式
          </Button>
        ) : pwa.ios ? (
          <ol className="list-decimal space-y-1.5 pl-5 text-muted-foreground">
            <li>
              點 Safari 底部分享
              <Share className="mx-1 inline size-3.5 align-text-bottom" />
            </li>
            <li>選「加入主畫面」／Add to Home Screen</li>
            <li>確認名稱「進展評估」後加入</li>
          </ol>
        ) : (
          <p className="text-muted-foreground">
            用 Chrome 或 Edge 開啟此頁，再從瀏覽器選單選擇「安裝應用程式」。iPhone
            請用 Safari 分享 → 加入主畫面。
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          安裝後可離線查看已輸入的成績；首次開啟需連網載入頁面。
        </p>
      </CardContent>
    </Card>
  );
}

function InstallBanner({
  pwa,
  visible,
}: {
  pwa: ReturnType<typeof usePwa>;
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <div
      className={cn(
        "print:hidden fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 px-4 pt-3 shadow-[var(--shadow-card)] backdrop-blur safe-bottom",
      )}
      role="dialog"
      aria-label="安裝到主畫面"
    >
      <div className="mx-auto flex max-w-[1600px] items-start gap-3">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
          <Smartphone className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">加到主畫面，離線也能輸入分數</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {pwa.ios
              ? "Safari 分享 → 加入主畫面。資料只留在這部手機。"
              : "安裝後從主畫面開啟，無需雲端。"}
          </p>
        </div>
        {pwa.canInstall ? (
          <Button size="sm" onClick={() => void pwa.install()}>
            安裝
          </Button>
        ) : null}
        <button
          type="button"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-md hover:bg-muted"
          onClick={pwa.dismiss}
          aria-label="關閉"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

function OfflineBar() {
  return (
    <div className="print:hidden border-b border-border bg-gold/20 px-4 py-1.5 text-center text-xs text-gold-fg">
      <WifiOff className="mr-1 inline size-3.5 align-text-bottom" />
      離線模式 · 分數仍會存在本機
    </div>
  );
}

function UpdateBar({ onReload }: { onReload: () => void }) {
  return (
    <div className="print:hidden flex items-center justify-center gap-2 border-b border-border bg-secondary px-4 py-1.5 text-xs">
      有新版本
      <button type="button" onClick={onReload} className="inline-flex items-center gap-1 font-medium text-primary">
        <RefreshCw className="size-3" />
        重新整理
      </button>
    </div>
  );
}
