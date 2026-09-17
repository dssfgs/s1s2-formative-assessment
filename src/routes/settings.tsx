import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InstallCard } from "@/components/install-prompt";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

export function SettingsPage() {
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-medium tracking-tight">設定</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          及格線套用到全校。預設滿分只作底，各班可在成績表「滿分」列分開改。資料仍只存在本機。
        </p>
      </header>

      <InstallCard />

      <Card>
        <CardHeader>
          <CardTitle>達標與滿分</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="pass">及格百分率</Label>
            <Input
              id="pass"
              type="number"
              min={0}
              max={100}
              value={settings.passPercent}
              onChange={(e) => setSettings({ passPercent: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label htmlFor="max">課後評估預設滿分</Label>
            <Input
              id="max"
              type="number"
              min={1}
              value={settings.defaultMax}
              onChange={(e) => setSettings({ defaultMax: Number(e.target.value) || 20 })}
            />
            <p className="mt-1 text-xs text-muted-foreground">語文小測、非核心課後評估。各班各次可在成績表「滿分」列分開改。</p>
          </div>
          <div>
            <Label htmlFor="examMax">測驗／考試預設滿分</Label>
            <Input
              id="examMax"
              type="number"
              min={1}
              value={settings.examMax ?? 100}
              onChange={(e) => setSettings({ examMax: Number(e.target.value) || 100 })}
            />
            <p className="mt-1 text-xs text-muted-foreground">T1A1／T1A2／T2A1／T2A2 欄。各班各次可在成績表「滿分」列分開改。</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>進步指數（頒獎用）</CardTitle>
          <CardDescription>中文、英文分開；非核心以測考對照對應階段。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">語文：</span>
            該科連續兩次課後小測百分率差的平均。中文一條序列、英文一條，不與其他科混合。
          </p>
          <p>
            <span className="font-medium text-foreground">非核心：</span>
            T1A1 − 第一階段、T1A2 − 第二階段、T2A1 − 第三階段、T2A2 − 第四階段。進步＝測考% − 階段%。
          </p>
          <p>成績表仍顯示階段標準分作參考，但不作頒獎依據。詳見「計分規則」。</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>非核心科目日期</CardTitle>
          <CardDescription>
            按 A.11（中一）、A.12（中二）時間表，同一日各班科目不同，不可改。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to="/calendar">查看評估日程</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
