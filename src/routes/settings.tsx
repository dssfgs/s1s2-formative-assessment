import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STAGES, type StageId } from "@/lib/calendar";
import { NONCORE_SUBJECTS, subjectShort, type SubjectId } from "@/lib/subjects";
import { useAppStore } from "@/lib/store";
import type { ProgressMethod } from "@/lib/progress";


const METHODS: { id: ProgressMethod; name: string; desc: string }[] = [
  { id: "z", name: "標準分差（建議）", desc: "z 本階段 − z 上一階段，消除卷別難度差異" },
  { id: "pct", name: "百分率差", desc: "本階段平均% − 上一階段平均%" },
  { id: "rank", name: "名次進步", desc: "上一階段班內名次 − 本階段名次" },
];

export function SettingsPage() {
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);
  const setNoncoreOrder = useAppStore((s) => s.setNoncoreOrder);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-medium tracking-tight">設定</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          及格線、滿分與進步公式套用到全校八班。資料仍只存在本機。
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>達標與滿分</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
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
            <Label htmlFor="max">預設滿分</Label>
            <Input
              id="max"
              type="number"
              min={1}
              value={settings.defaultMax}
              onChange={(e) => setSettings({ defaultMax: Number(e.target.value) || 20 })}
            />
            <p className="mt-1 text-xs text-muted-foreground">各次評估可在該班成績表表頭改滿分。</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>進步指數公式</CardTitle>
          <CardDescription>早會頒獎與各科進程使用同一公式。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSettings({ progressMethod: m.id })}
              className={`rounded-md border px-4 py-3 text-left text-sm ${
                settings.progressMethod === m.id
                  ? "border-primary bg-secondary"
                  : "border-border bg-card hover:bg-muted"
              }`}
            >
              <div className="font-medium">{m.name}</div>
              <div className="text-xs text-muted-foreground">{m.desc}</div>
            </button>
          ))}
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
