import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InstallCard } from "@/components/install-prompt";
import { STAGES, type StageId } from "@/lib/calendar";
import { NONCORE_SUBJECTS, subjectShort, type SubjectId } from "@/lib/subjects";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

export function SettingsPage() {
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);
  const setNoncoreOrder = useAppStore((s) => s.setNoncoreOrder);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-medium tracking-tight">設定</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          及格線、滿分套用到全校八班。資料仍只存在本機。
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
            <p className="mt-1 text-xs text-muted-foreground">語文小測、非核心課後評估。各次可在表頭改。</p>
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
            <p className="mt-1 text-xs text-muted-foreground">T1A1／T1A2／T2A1／T2A2 欄。各次可在表頭改。</p>
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
          <CardTitle>非核心科目日期對應</CardTitle>
          <CardDescription>每階段六個日期，對應六科。點選可輪換該格科目。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {STAGES.map((st) => (
            <StageOrder
              key={st.id}
              stage={st.id}
              title={st.name}
              order={settings.noncoreOrder[st.id]}
              onChange={(order) => setNoncoreOrder(st.id, order)}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StageOrder({
  stage,
  title,
  order,
  onChange,
}: {
  stage: StageId;
  title: string;
  order: SubjectId[];
  onChange: (order: SubjectId[]) => void;
}) {
  const cycle = (i: number) => {
    const ids = NONCORE_SUBJECTS.map((s) => s.id);
    const next = order.slice();
    const cur = next[i]!;
    const idx = ids.indexOf(cur);
    let cand = ids[(idx + 1) % ids.length]!;
    const used = new Set(next.filter((_, j) => j !== i));
    while (used.has(cand)) cand = ids[(ids.indexOf(cand) + 1) % ids.length]!;
    next[i] = cand;
    onChange(next);
  };

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {order.map((id, i) => (
          <Button key={`${stage}-${i}`} size="sm" variant="outline" onClick={() => cycle(i)}>
            {i + 1}. {subjectShort(id)}
          </Button>
        ))}
      </div>
    </div>
  );
}
