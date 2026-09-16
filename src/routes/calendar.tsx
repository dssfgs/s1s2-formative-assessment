import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FORMALS,
  STAGES,
  languageAssessments,
  noncoreSlots,
  weekdayLabel,
  type StageId,
} from "@/lib/calendar";
import { S1_CLASSES, S2_CLASSES, type FormLevel } from "@/lib/classes";
import { isoToShort, todayIso } from "@/lib/format";
import { subjectShort } from "@/lib/subjects";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendar")({ component: CalendarPage });

export function CalendarPage() {
  const today = todayIso();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          A.11／A.12 時間表
        </p>
        <h1 className="font-display text-2xl font-medium tracking-tight">2026-2027 評估日程</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          中一中文逢星期一、英文逢星期三；中二相反。非核心同一日各班科目不同，按官方時間表入分。
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

      <NoncoreTable form={1} today={today} />
      <NoncoreTable form={2} today={today} />
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
            <p className="mb-2 text-sm text-muted-foreground">{g.title}</p>
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

function NoncoreTable({ form, today }: { form: FormLevel; today: string }) {
  const slots = noncoreSlots(form);
  const classes = form === 1 ? S1_CLASSES : S2_CLASSES;
  const title = form === 1 ? "中一非核心（A.11）" : "中二非核心（A.12）";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>同一日各班科目不同。成績表只顯示該班當日科目。</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 pr-3 font-medium">日期</th>
              <th className="py-2 pr-3 font-medium">階段</th>
              {classes.map((c) => (
                <th key={c} className="py-2 pr-3 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr
                key={slot.date}
                className={cn(
                  "border-b border-border/70",
                  slot.date === today && "bg-secondary",
                )}
              >
                <td className="py-2 pr-3 tabular-nums whitespace-nowrap">
                  {isoToShort(slot.date)}
                  <span className="ml-1 text-muted-foreground">{weekdayLabel(slot.weekday)}</span>
                </td>
                <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">
                  {STAGES[slot.stage - 1]?.name.replace("階段", "")}
                </td>
                {slot.subjects.map((sub, i) => (
                  <td key={classes[i]} className="py-2 pr-3 whitespace-nowrap">
                    {subjectShort(sub)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
