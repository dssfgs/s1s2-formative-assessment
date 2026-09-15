import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ALL_CLASSES, classLabel, formOf, type ClassCode } from "@/lib/classes";
import { STAGES, type StageId } from "@/lib/calendar";
import { fmtPct, signed } from "@/lib/format";
import { computeClass } from "@/lib/progress";
import { SUBJECTS, subjectShort, type SubjectId } from "@/lib/subjects";
import { useAppStore, useAssessments, useMaxOf } from "@/lib/store";
import { cn } from "@/lib/utils";


export function SubjectsPage() {
  const roster = useAppStore((s) => s.roster);
  const settings = useAppStore((s) => s.settings);
  const all = useAssessments();
  const maxOf = useMaxOf();
  const [form, setForm] = useState<1 | 2>(1);
  const [stage, setStage] = useState<StageId>(1);

  const classes = ALL_CLASSES.filter((c) => formOf(c) === form);

  const rows = useMemo(() => {
    return SUBJECTS.map((sub) => {
      const cells: {
        code: ClassCode;
        mean: number | null;
        n: number;
        delta: number | null;
      }[] = [];
      for (const code of classes) {
        const papers = all.filter((a) => a.form === form);
        const computed = computeClass(
          roster[code] ?? [],
          papers,
          maxOf,
          settings.passPercent,
          settings.progressMethod,
        );
        const k = `${sub.id}-${stage}`;
        const meta = computed.stageMeta[k];
        const deltas = [...computed.byStudent.values()]
          .map((p) => p.subjectDelta[sub.id as SubjectId])
          .filter((v): v is number => v !== null);
        cells.push({
          code,
          mean: meta?.mean ?? null,
          n: meta?.n ?? 0,
          delta: deltas.length
            ? Math.round((deltas.reduce((a, b) => a + b, 0) / deltas.length) * 100) / 100
            : null,
        });
      }
      return { sub, cells };
    });
  }, [classes, all, form, roster, maxOf, settings, stage]);

  const chartData = rows.map((r) => ({
    name: r.sub.short,
    平均百分率: r.cells.reduce((a, c) => a + (c.mean ?? 0), 0) / Math.max(1, r.cells.filter((c) => c.mean != null).length),
  }));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          課程發展組
        </p>
        <h1 className="font-display text-2xl font-medium tracking-tight">各科進程與進步指數</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          檢視教學策略與評估設計。平均分為該班該科該階段百分率；進步為班內學生科進步指數的平均。
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          className={cn("h-9 rounded-md px-3 text-sm", form === 1 ? "bg-primary text-primary-foreground" : "bg-card")}
          onClick={() => setForm(1)}
        >
          中一
        </button>
        <button
          className={cn("h-9 rounded-md px-3 text-sm", form === 2 ? "bg-primary text-primary-foreground" : "bg-card")}
          onClick={() => setForm(2)}
        >
          中二
        </button>
        {STAGES.map((s) => (
          <button
            key={s.id}
            className={cn(
              "h-9 rounded-md px-3 text-sm",
              stage === s.id ? "bg-secondary text-secondary-foreground" : "bg-card hover:bg-muted",
            )}
            onClick={() => setStage(s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>全級各科平均百分率</CardTitle>
          <CardDescription>
            {form === 1 ? "中一" : "中二"} · {STAGES[stage - 1]?.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d6cdb8" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="平均百分率" fill="#3d4f3a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="overflow-auto rounded-lg bg-card shadow-[var(--shadow-card)]">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/60 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2">科目</th>
              {classes.map((c) => (
                <th key={c} className="px-3 py-2 text-center">
                  {classLabel(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ sub, cells }) => (
              <tr key={sub.id} className="border-b border-border/70">
                <td className="px-3 py-2 font-medium">{subjectShort(sub.id)}</td>
                {cells.map((c) => (
                  <td key={c.code} className="px-3 py-2 text-center tabular-nums">
                    <div>{c.mean == null ? "—" : fmtPct(c.mean)}</div>
                    <div
                      className={cn(
                        "text-[11px]",
                        c.delta != null && c.delta > 0 && "text-up",
                        c.delta != null && c.delta < 0 && "text-down",
                      )}
                    >
                      {c.delta == null ? "" : `進步 ${signed(c.delta)}`}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{c.n} 人</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
