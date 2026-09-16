import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FORMALS,
  NONCORE_DATES,
  STAGES,
  languageAssessments,
  weekdayLabel,
  type StageId,
} from "@/lib/calendar";
import { isoToShort, todayIso } from "@/lib/format";
import { subjectShort } from "@/lib/subjects";
import { useAssessments } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendar")({ component: CalendarPage });

export function CalendarPage() {
  const all = useAssessments();
  const today = todayIso();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          指引 3.1–3.2
        </p>
        <h1 className="font-display text-2xl font-medium tracking-tight">2026-2027 評估日程</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          語文科逢星期一至三；非核心科目於測驗及考試前一至兩週，每階段每科一次。科任須於
          15:45 前到達課室，達標學生 16:15 後離校。
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>非核心測驗／考試對照</CardTitle>
          <CardDescription>
            班別成績表在課後評估旁輸入測考分數。頒獎取測考相對該階段進步最大的三名。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {FORMALS.map((f) => (
            <div key={f.kind} className="rounded-md border border-border px-3 py-2 text-sm">
              <div className="font-medium">
                {f.short}　{f.name}
              </div>
              <div className="text-xs text-muted-foreground">
                對照 {STAGES[f.stage - 1]?.name}（{STAGES[f.stage - 1]?.period}）
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {STAGES.map((st) => (
        <StageBlock key={st.id} stage={st.id} today={today} />
      ))}

      <Card>
        <CardHeader>
          <CardTitle>非核心科目日期（兩級共用）</CardTitle>
          <CardDescription>
            預設按地理 → 公經社 → 中史 → 歷史 → 佛化教育 → 科學。可在「設定」重排。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {NONCORE_DATES.map((d) => {
              const hit = all.find((a) => a.date === d.date && a.form === 1 && a.group === "noncore");
              return (
                <div
                  key={d.date}
                  className={cn(
                    "rounded-md border border-border px-3 py-2 text-sm",
                    d.date === today && "border-primary bg-secondary",
                  )}
                >
                  <div className="font-medium tabular-nums">
                    {isoToShort(d.date)} · {weekdayLabel(d.weekday)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {STAGES[d.stage - 1]?.name} · {hit ? subjectShort(hit.subject) : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StageBlock({ stage, today }: { stage: StageId; today: string }) {
  const langs = languageAssessments().filter((a) => a.stage === stage);
  const st = STAGES[stage - 1]!;
  const formal = FORMALS.find((f) => f.stage === stage);

  const groups = [
    { title: "中一 中文（星期一）", items: langs.filter((a) => a.form === 1 && a.subject === "chi") },
    { title: "中一 英文（星期三）", items: langs.filter((a) => a.form === 1 && a.subject === "eng") },
    { title: "中二 中文（星期三）", items: langs.filter((a) => a.form === 2 && a.subject === "chi") },
    { title: "中二 英文（星期一）", items: langs.filter((a) => a.form === 2 && a.subject === "eng") },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{st.name}</CardTitle>
        <CardDescription>
          {st.period}
          {formal ? `　·　測考 ${formal.short} ${formal.name}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="mb-2 text-xs font-medium text-muted-foreground">{g.title}</p>
            <div className="flex flex-wrap gap-1.5">
              {g.items.map((a) => (
                <Badge
                  key={a.id}
                  tone={a.date === today ? "primary" : a.date < today ? "muted" : "gold"}
                >
                  {isoToShort(a.date)}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
